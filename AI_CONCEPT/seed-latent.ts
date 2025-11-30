import { join } from "https://deno.land/std@0.210.0/path/join.ts";
import { Buffer } from "node:buffer";
import { PNG } from "npm:pngjs@7.0.0";
import {
  SeedConcept,
  SeedImageLatents,
  SeedPixel,
} from "../types/hypergraph-types.ts";

const LEGACY_SEED_IMAGE = "AI_CONCEPT/assets/reference-image.png";
const DEFAULT_ATLAS_DIR = "AI_CONCEPT/assets/original-one";

// Mapping from old image filenames to new knowledge domains
const IMAGE_TO_CONCEPT_MAP: Record<string, string> = {
  "core-foundation": "stem-mathematics",
  "temporal-orbits": "social-history",
  "sensory-spectrum": "social-psychology",
  "action-field": "practical-skills",
  "concept-loop": "synthesis-meta",
};

// Universal Knowledge Concepts - encoding broad knowledge domains
const UNIVERSAL_KNOWLEDGE_CONCEPTS: Record<string, SeedConcept> = {
  "stem-science": {
    id: "stem-science",
    label: "Science & Nature",
    description:
      "Natural sciences including physics, chemistry, biology, astronomy, and earth sciences.",
    keywords: [
      "science",
      "physics",
      "chemistry",
      "biology",
      "astronomy",
      "nature",
      "natural",
      "universe",
      "matter",
      "energy",
    ],
    color: [80, 160, 255],
    region: { xRange: [0, 0.5], yRange: [0, 0.5] },
    loopPhase: 0,
    weight: 1.2,
  },
  "stem-mathematics": {
    id: "stem-mathematics",
    label: "Mathematics & Logic",
    description:
      "Mathematical principles, logic, computation, and quantitative reasoning.",
    keywords: [
      "math",
      "mathematics",
      "algebra",
      "geometry",
      "calculus",
      "logic",
      "number",
      "equation",
      "proof",
      "theorem",
    ],
    color: [100, 200, 255],
    region: { xRange: [0.1, 0.4], yRange: [0.2, 0.5] },
    loopPhase: Math.PI / 4,
    weight: 1.15,
  },
  "arts-literature": {
    id: "arts-literature",
    label: "Arts & Literature",
    description:
      "Creative expression through writing, poetry, storytelling, and visual arts.",
    keywords: [
      "literature",
      "writing",
      "poetry",
      "story",
      "book",
      "art",
      "creative",
      "expression",
      "novel",
      "author",
    ],
    color: [255, 200, 100],
    region: { xRange: [0.5, 1], yRange: [0, 0.35] },
    loopPhase: Math.PI / 2,
    weight: 1.1,
  },
  "arts-philosophy": {
    id: "arts-philosophy",
    label: "Philosophy & Ethics",
    description:
      "Philosophical inquiry, ethics, meaning, wisdom, and fundamental questions about existence.",
    keywords: [
      "philosophy",
      "ethics",
      "thought",
      "wisdom",
      "meaning",
      "existence",
      "moral",
      "value",
      "truth",
      "knowledge",
    ],
    color: [200, 150, 255],
    region: { xRange: [0.65, 1], yRange: [0, 0.5] },
    loopPhase: (3 * Math.PI) / 4,
    weight: 1.25,
  },
  "social-history": {
    id: "social-history",
    label: "History & Culture",
    description:
      "Human history, civilizations, cultural development, and historical events.",
    keywords: [
      "history",
      "civilization",
      "culture",
      "historical",
      "events",
      "people",
      "society",
      "past",
      "heritage",
      "tradition",
    ],
    color: [255, 100, 150],
    region: { xRange: [0, 0.4], yRange: [0.5, 1] },
    loopPhase: Math.PI,
    weight: 1.1,
  },
  "social-psychology": {
    id: "social-psychology",
    label: "Psychology & Human Behavior",
    description:
      "Understanding the mind, behavior, emotions, and human interaction.",
    keywords: [
      "psychology",
      "mind",
      "behavior",
      "emotion",
      "human",
      "mental",
      "cognitive",
      "social",
      "personality",
      "feeling",
    ],
    color: [230, 120, 200],
    region: { xRange: [0.2, 0.5], yRange: [0.6, 1] },
    loopPhase: (5 * Math.PI) / 4,
    weight: 1.15,
  },
  "practical-health": {
    id: "practical-health",
    label: "Health & Wellness",
    description:
      "Physical and mental health, medicine, wellness practices, and body care.",
    keywords: [
      "health",
      "medicine",
      "wellness",
      "body",
      "care",
      "medical",
      "fitness",
      "nutrition",
      "disease",
      "treatment",
    ],
    color: [120, 220, 140],
    region: { xRange: [0.5, 0.85], yRange: [0.5, 1] },
    loopPhase: (3 * Math.PI) / 2,
    weight: 1.2,
  },
  "practical-skills": {
    id: "practical-skills",
    label: "Skills & How-To",
    description:
      "Practical skills, techniques, guides, and applied knowledge for everyday life.",
    keywords: [
      "skills",
      "practical",
      "how",
      "guide",
      "learn",
      "technique",
      "method",
      "tutorial",
      "instruction",
      "process",
    ],
    color: [160, 200, 100],
    region: { xRange: [0.6, 1], yRange: [0.65, 1] },
    loopPhase: (7 * Math.PI) / 4,
    weight: 1.1,
  },
  "synthesis-meta": {
    id: "synthesis-meta",
    label: "Understanding & Connection",
    description:
      "Meta-knowledge, synthesis across domains, understanding, explanation, and integration of concepts.",
    keywords: [
      "understand",
      "explain",
      "connect",
      "integrate",
      "overview",
      "synthesis",
      "comprehend",
      "insight",
      "grasp",
      "meaning",
    ],
    color: [240, 240, 240],
    region: { xRange: [0.4, 0.6], yRange: [0.4, 0.6] },
    loopPhase: Math.PI * 2,
    weight: 1.3,
  },
};

// Legacy concepts for backward compatibility
const BASE_CONCEPTS: SeedConcept[] = Object.values(
  UNIVERSAL_KNOWLEDGE_CONCEPTS,
);

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const inRange = ([min, max]: [number, number], value: number) =>
  value >= min && value <= max;

const computeEnergy = (r: number, g: number, b: number) =>
  (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

const distance = (a: [number, number, number], b: [number, number, number]) =>
  Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2,
  );

const pickConcept = (
  xNorm: number,
  yNorm: number,
  r: number,
  g: number,
  b: number,
): SeedConcept => {
  const regional = BASE_CONCEPTS.find((concept) =>
    inRange(concept.region.xRange, xNorm) &&
    inRange(concept.region.yRange, yNorm)
  );
  if (regional) return regional;

  return BASE_CONCEPTS.reduce((closest, concept) => {
    const currentDist = distance(concept.color, [r, g, b]);
    const bestDist = distance(closest.color, [r, g, b]);
    return currentDist < bestDist ? concept : closest;
  });
};

const loadLegacyLatents = async (
  imagePath: string,
): Promise<SeedImageLatents> => {
  const data = await Deno.readFile(imagePath);
  const png = PNG.sync.read(Buffer.from(data));
  const { width, height } = png;
  const pixels: SeedPixel[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];
      const xNorm = x / Math.max(1, width - 1);
      const yNorm = y / Math.max(1, height - 1);
      const concept = pickConcept(xNorm, yNorm, r, g, b);

      pixels.push({
        x: xNorm,
        y: yNorm,
        r,
        g,
        b,
        a,
        energy: computeEnergy(r, g, b),
        conceptId: concept.id,
      });
    }
  }

  return { width, height, pixels, concepts: BASE_CONCEPTS };
};

const mapPixelsToConcept = (
  png: PNG,
  concept: SeedConcept,
  layerId: string,
): SeedPixel[] => {
  const pixels: SeedPixel[] = [];
  const { width, height } = png;

  // Sample pixels instead of using all of them (every 4th pixel)
  const sampleRate = 4;

  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width; x += sampleRate) {
      const idx = (width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];
      const xNorm = x / Math.max(1, width - 1);
      const yNorm = y / Math.max(1, height - 1);

      pixels.push({
        x: xNorm,
        y: yNorm,
        r,
        g,
        b,
        a,
        energy: computeEnergy(r, g, b),
        conceptId: concept.id,
        layerId,
      });
    }
  }

  return pixels;
};

const loadAtlasLatents = async (dirPath: string): Promise<SeedImageLatents> => {
  const entries: Array<{ concept: SeedConcept; png: PNG; layerId: string }> =
    [];

  for await (const entry of Deno.readDir(dirPath)) {
    if (!entry.isFile || !entry.name.toLowerCase().endsWith(".png")) continue;
    const baseId = entry.name.replace(/\.png$/i, "");

    // Map old filenames to new concept IDs
    const conceptId = IMAGE_TO_CONCEPT_MAP[baseId] ?? baseId;
    const concept = UNIVERSAL_KNOWLEDGE_CONCEPTS[conceptId] ??
      {
        id: baseId,
        label: baseId.replace(/[-_]/g, " ").replace(
          /\b\w/g,
          (c) => c.toUpperCase(),
        ),
        description: `Knowledge domain derived from ${baseId}.`,
        keywords: baseId.split(/[-_]/g),
        color: [200, 200, 200],
        region: { xRange: [0, 1], yRange: [0, 1] },
        loopPhase: 0,
        weight: 1,
      };

    const data = await Deno.readFile(join(dirPath, entry.name));
    const png = PNG.sync.read(Buffer.from(data));
    entries.push({ concept, png, layerId: baseId });
  }

  if (!entries.length) {
    throw new Error(
      `No seed images found inside ${dirPath}. Please run the generator script first.`,
    );
  }

  const width = entries[0].png.width;
  const height = entries[0].png.height;
  let pixels: SeedPixel[] = [];
  const concepts: SeedConcept[] = [];

  for (const entry of entries) {
    concepts.push(entry.concept);
    // Concat instead of spread to avoid stack overflow with large images
    pixels = pixels.concat(
      mapPixelsToConcept(entry.png, entry.concept, entry.layerId),
    );
  }

  return { width, height, pixels, concepts };
};

const resolveSeedResource = async (
  preferred?: string,
): Promise<{ kind: "file" | "directory"; path: string }> => {
  const candidates = [
    preferred,
    DEFAULT_ATLAS_DIR,
    LEGACY_SEED_IMAGE,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const stats = await Deno.stat(candidate);
      if (stats.isDirectory) return { kind: "directory", path: candidate };
      if (stats.isFile) return { kind: "file", path: candidate };
    } catch {
      continue;
    }
  }

  throw new Error("Unable to locate a seed image resource.");
};

const shuffle = <T>(array: T[], seed = Date.now()): T[] => {
  let currentIndex = array.length;
  let randomIndex: number;
  let state = seed;
  while (currentIndex > 0) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    randomIndex = state % currentIndex;
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

export class SeedImageInterface {
  constructor(private readonly data: SeedImageLatents) {}

  conceptSummaries() {
    const counts = new Map<string, number>();
    this.data.pixels.forEach((pixel) => {
      counts.set(pixel.conceptId, (counts.get(pixel.conceptId) ?? 0) + 1);
    });

    return this.data.concepts.map((concept) => ({
      concept,
      coverage: clamp01(
        (counts.get(concept.id) ?? 0) / Math.max(this.data.pixels.length, 1),
      ),
    }));
  }

  getPixelsForConcept(conceptId: string, limit = 64) {
    const subset = this.data.pixels.filter((pixel) =>
      pixel.conceptId === conceptId
    );
    return subset.slice(0, limit);
  }

  sampleByKeyword(keyword: string, limit = 64, seed = Date.now()) {
    const normalized = keyword.toLowerCase();
    const concept = this.data.concepts.find((concept) =>
      concept.keywords.some((kw) => kw.toLowerCase().includes(normalized))
    );
    if (!concept) return [];
    const subset = this.data.pixels.filter((pixel) =>
      pixel.conceptId === concept.id
    );
    return shuffle([...subset], seed).slice(0, limit);
  }

  strongestPixels(limit = 128) {
    return [...this.data.pixels]
      .sort((a, b) => b.energy - a.energy)
      .slice(0, limit);
  }

  getConcept(conceptId: string) {
    return this.data.concepts.find((concept) => concept.id === conceptId);
  }

  raw() {
    return this.data;
  }
}

export const loadSeedImageInterface = async (resourcePath?: string) => {
  const resolved = await resolveSeedResource(resourcePath);
  if (resolved.kind === "directory") {
    return new SeedImageInterface(await loadAtlasLatents(resolved.path));
  }
  return new SeedImageInterface(await loadLegacyLatents(resolved.path));
};

export const loadSeedImageLatents = loadLegacyLatents;
