import {
  ImageProjectionConfig,
  ProjectionOutcome,
  ProjectionSample,
  SeedConcept,
  SeedPixel,
  ValueProjection,
} from "../types/hypergraph-types.ts";
import { loadSeedImageInterface, SeedImageInterface } from "./seed-latent.ts";

const DEFAULT_SEED_RESOURCE = "AI_CONCEPT/assets/original-one";

const DEFAULT_IMAGE_CONFIG: ImageProjectionConfig = {
  imagePath: DEFAULT_SEED_RESOURCE,
  sampleCount: 16,
  embeddingDimension: 8,
  seed: 1337,
  conceptSampleSize: 4,
};

type RNG = () => number;

const mulberry32 = (seed: number): RNG => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const pickKeywords = (prompt: string, limit = 6): string[] => {
  const tokens = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  // Filter out common stop words
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "as",
    "is",
    "was",
    "are",
    "were",
    "been",
    "be",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "should",
    "could",
    "can",
    "may",
    "might",
    "must",
  ]);
  const meaningful = tokens.filter((token) =>
    !stopWords.has(token) && token.length > 2
  );
  const unique = [...new Set(meaningful)];
  return unique.slice(0, limit);
};

export class ImageProjectionModel {
  readonly config: ImageProjectionConfig;
  private rng: RNG;
  private loaded = false;
  private seedInterface?: SeedImageInterface;

  constructor(config: Partial<ImageProjectionConfig> = {}) {
    this.config = { ...DEFAULT_IMAGE_CONFIG, ...config };
    this.rng = mulberry32(this.config.seed ?? Date.now());
  }

  async load(): Promise<void> {
    if (this.loaded) return;
    this.seedInterface = await loadSeedImageInterface(this.config.imagePath);
    this.loaded = true;
  }

  projectPrompt(prompt: string): ProjectionOutcome {
    if (!this.loaded) {
      throw new Error(
        "ImageProjectionModel.load() must be awaited before projecting.",
      );
    }

    const keywords = pickKeywords(prompt);
    const samples = this.sampleFromSeed(keywords);
    const valueField = samples.map((sample) =>
      this.buildValueProjection(sample, keywords)
    );

    return { samples, valueField };
  }

  private sampleFromSeed(keywords: string[]): ProjectionSample[] {
    if (!this.seedInterface) {
      throw new Error("Seed interface not loaded.");
    }

    const seed = this.seedInterface.raw();
    const rankedConcepts = this.seedInterface.conceptSummaries()
      .map(({ concept, coverage }) => {
        const matchCount = keywords.filter((keyword) =>
          concept.keywords.some((kw) =>
            kw.includes(keyword)
          )
        ).length;
        const weight = concept.weight ?? 1;
        const loopPhase = concept.loopPhase ?? 0;
        const rhythm = Math.cos(loopPhase + matchCount * 0.35);
        const score = weight *
          (0.8 + coverage * 0.9) *
          (1 + matchCount * 0.55) *
          (1 + rhythm * 0.2);
        return { concept, score };
      })
      .sort((a, b) => b.score - a.score);

    const targetConceptCount = this.config.conceptSampleSize ?? 3;
    let selectedConcepts = rankedConcepts
      .slice(0, targetConceptCount)
      .map((entry) => entry.concept);

    if (!selectedConcepts.length) {
      selectedConcepts = seed.concepts.slice(0, targetConceptCount);
    }

    let candidatePixels = seed.pixels.filter((pixel) =>
      selectedConcepts.some((concept) => concept.id === pixel.conceptId)
    );

    if (!candidatePixels.length) {
      candidatePixels = seed.pixels;
    }

    const shuffled = [...candidatePixels];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const chosenPixels = shuffled.slice(0, this.config.sampleCount);

    return chosenPixels.map((pixel, index) => {
      const concept = selectedConcepts.find((c) => c.id === pixel.conceptId) ??
        selectedConcepts[0] ??
        seed.concepts[0];
      const pointId = `${concept.id}-${index}-${Math.floor(this.rng() * 1e6)}`;
      const vector = this.vectorFromPixel(pixel, concept);
      const tags = [concept.label, ...concept.keywords];

      return {
        point: {
          id: pointId,
          vector,
          pixel: {
            x: Math.round(pixel.x * (seed.width - 1)),
            y: Math.round(pixel.y * (seed.height - 1)),
          },
          tags,
        },
        projection: this.coordinateFromPixel(pixel, keywords, concept),
        concept,
        layerId: pixel.layerId,
      };
    });
  }

  private vectorFromPixel(pixel: SeedPixel, concept: SeedConcept) {
    const base = [
      pixel.x * 2 - 1,
      pixel.y * 2 - 1,
      pixel.r / 255,
      pixel.g / 255,
      pixel.b / 255,
      pixel.energy,
    ];
    const padding = this.config.embeddingDimension - base.length;
    if (padding > 0) {
      const extra = Array.from(
        { length: padding },
        (_, idx) =>
          (concept.keywords[idx % concept.keywords.length]?.length ??
            concept.weight ?? 0.2) / 12,
      );
      return [...base, ...extra, concept.weight ?? 1];
    }
    const trimmed = base.slice(0, this.config.embeddingDimension - 1);
    return [...trimmed, concept.weight ?? 1];
  }

  private coordinateFromPixel(
    pixel: SeedPixel,
    promptKeywords: string[],
    concept: SeedConcept,
  ) {
    const conceptKeywords = concept.keywords;
    const affinity =
      promptKeywords.some((keyword) => conceptKeywords.includes(keyword))
        ? 1.05
        : 0.85;
    const loopPhase = concept.loopPhase ?? 0;
    const loopShiftX = Math.sin(loopPhase + pixel.y * Math.PI) * 0.08;
    const loopShiftY = Math.cos(loopPhase + pixel.x * Math.PI) * 0.08;
    const weight = concept.weight ?? 1;
    const x = pixel.x * 2 - 1 + this.jitter(0.04 + weight * 0.01) + loopShiftX;
    const y = pixel.y * 2 - 1 + this.jitter(0.04) + loopShiftY;
    const confidence = clamp(
      pixel.energy * affinity * weight * 0.95 + 0.05 * this.rng(),
      0,
      1,
    );
    return { x, y, confidence };
  }

  private buildValueProjection(
    sample: ProjectionSample,
    keywords: string[],
  ): ValueProjection {
    const matches =
      keywords.filter((keyword) =>
        sample.point.tags.join(" ").includes(keyword)
      ).length;
    const conceptWeight = sample.concept?.weight ?? 1;
    const loopPhase = sample.concept?.loopPhase ?? 0;
    const loopContribution = 1 + Math.sin(loopPhase + matches * 0.2) * 0.15;
    const keywordBoost = matches ? 1 + matches * 0.2 : 0.75;
    const baseValue = sample.projection.confidence *
      (0.85 + this.rng() * 0.25) *
      keywordBoost *
      conceptWeight *
      loopContribution;

    return {
      pointId: sample.point.id,
      coordinate: sample.projection,
      value: parseFloat(baseValue.toFixed(3)),
    };
  }

  private jitter(scale: number) {
    return (this.rng() * 2 - 1) * scale;
  }

  seedConceptSummaries() {
    if (!this.seedInterface) return [];
    return this.seedInterface.conceptSummaries().map((
      { concept, coverage },
    ) => ({
      id: concept.id,
      label: concept.label,
      keywords: [...concept.keywords],
      coverage,
      description: concept.description,
    }));
  }

  sampleSeedPixels(conceptId: string, limit = 32): SeedPixel[] {
    if (!this.seedInterface) return [];
    return this.seedInterface.getPixelsForConcept(conceptId, limit);
  }

  strongestSeedPixels(limit = 64): SeedPixel[] {
    if (!this.seedInterface) return [];
    return this.seedInterface.strongestPixels(limit);
  }
}

export const createImageProjectionModel = (
  config?: Partial<ImageProjectionConfig>,
) => new ImageProjectionModel(config);

export const loadDefaultImageModel = async () => {
  const model = createImageProjectionModel();
  await model.load();
  return model;
};

export type ImageProjectionRuntime = {
  model: ImageProjectionModel;
  project: (prompt: string) => ProjectionOutcome;
};

export const createProjectionRuntime = async (
  config?: Partial<ImageProjectionConfig>,
): Promise<ImageProjectionRuntime> => {
  const model = createImageProjectionModel(config);
  await model.load();
  return {
    model,
    project: (prompt: string) => model.projectPrompt(prompt),
  };
};
