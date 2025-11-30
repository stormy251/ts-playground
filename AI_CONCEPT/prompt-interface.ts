import {
  HypergraphMemoryState,
  ProjectionOutcome,
  SeedPixel,
} from "../types/hypergraph-types.ts";
import { createProjectionRuntime } from "./image-projection.ts";
import { generateKnowledgeResponse } from "./knowledge-generator.ts";
import {
  createMemoryHypergraph,
  MemoryHypergraph,
} from "./memory-hypergraph.ts";

export type PromptInterfaceOptions = {
  memory?: MemoryHypergraph;
  projectionConfig?: Parameters<typeof createProjectionRuntime>[0];
};

export type ConceptResponse = {
  conceptId: string;
  label: string;
  anchors: string[];
  coordinate: {
    x: number;
    y: number;
    confidence: number;
  };
  value: number;
};

export type ObserverInsight = {
  title: string;
  narrative: string;
  loopAnchors: string[];
  recommendedActions: string[];
  memoryEcho: string;
  message: string;
};

export type GeneratedAnswer = {
  answer: string;
  steps?: string[];
  explanation?: string;
};

export type PromptResponse = {
  summary: string;
  concepts: ConceptResponse[];
  rawProjection: ProjectionOutcome;
  observerInsight: ObserverInsight;
  generatedAnswer?: GeneratedAnswer;
};

export type SeedConceptSummary = {
  id: string;
  label: string;
  keywords: string[];
  coverage: number;
  description: string;
};

export type DialogTurn = {
  prompt: string;
  response: PromptResponse;
};

export type PromptInterface = {
  prompt: (input: string) => Promise<PromptResponse>;
  history: () => DialogTurn[];
  memoryState: () => HypergraphMemoryState;
  seedSummary: () => SeedConceptSummary[];
  seedPixels: (conceptId: string, limit?: number) => SeedPixel[];
  seedHighlights: (limit?: number) => SeedPixel[];
};

const describeOutcome = (
  prompt: string,
  outcome: ProjectionOutcome,
): string => {
  // Extract domain labels from the projection
  const domains = [
    ...new Set(
      outcome.samples
        .map((s) => s.concept?.label)
        .filter(Boolean),
    ),
  ].slice(0, 3);

  const playfulTone = /(funny|humor|joke|laugh|smile|fun|hilarious|comedy)/i
    .test(prompt);

  if (playfulTone) {
    if (domains.length === 0) {
      return `I'd love to help you with that! Let me think about this one...`;
    } else if (domains.length === 1) {
      return `Alright, this is an interesting question! I'm drawing from ${
        domains[0]
      } to give you a thoughtful answer.`;
    } else if (domains.length === 2) {
      return `Ooh, good question! I'm connecting ${domains[0]} and ${
        domains[1]
      } to answer this one.`;
    } else {
      return `This is fun! I'm combining insights from ${domains[0]}, ${
        domains[1]
      }, and ${domains[2]} for you.`;
    }
  }

  if (domains.length === 0) {
    return `I've processed your question and drawn from the knowledge base.`;
  } else if (domains.length === 1) {
    return `Drawing from ${domains[0]}, I can help with that.`;
  } else if (domains.length === 2) {
    return `I'm connecting insights from ${domains[0]} and ${
      domains[1]
    } to answer your question.`;
  } else {
    return `I'm synthesizing knowledge from ${domains[0]}, ${domains[1]}, and ${
      domains[2]
    } for you.`;
  }
};

const buildObserverInsight = (
  prompt: string,
  _summary: string,
  concepts: ConceptResponse[],
): ObserverInsight => {
  const loopAnchors = concepts.slice(0, 4).map((concept) => concept.label);
  const avgValue = concepts.reduce((sum, concept) => sum + concept.value, 0) /
    Math.max(concepts.length, 1);
  const dominant = loopAnchors.slice(0, 2).join(" and ") || "knowledge domains";

  const narrative =
    `This response draws primarily from ${dominant}, with knowledge activation strength of ${
      avgValue.toFixed(2)
    }. ` +
    `The interpretation system has identified these as the most relevant domains for your question.`;

  const recommendedActions = [
    `For deeper understanding, explore ${
      loopAnchors[0] ?? "foundational concepts"
    } first.`,
    `Consider connections between ${
      loopAnchors.slice(0, 2).join(" and ") || "these domains"
    } for broader insights.`,
  ];

  const memoryEcho =
    `Knowledge graph strengthened across ${loopAnchors.length} domains. ` +
    `The system is ready for follow-up questions.`;

  // Determine tone based on prompt
  const questionWords = ["what", "why", "how", "when", "where", "who", "which"];
  const isQuestion = questionWords.some((w) =>
    prompt.toLowerCase().includes(w)
  );
  const playfulTone = /(funny|humor|joke|laugh|smile|fun|hilarious|comedy)/i
    .test(prompt);
  const technicalTone =
    /(science|math|technical|engineering|algorithm|formula)/i.test(prompt);

  let message: string;
  const leadAnchor = loopAnchors[0] ?? "Knowledge Base";

  if (playfulTone) {
    message =
      `😊 Great question! I'll give you a thoughtful response with a touch of humor.`;
  } else if (technicalTone) {
    message =
      `I'll provide a precise, detailed response grounded in ${leadAnchor}.`;
  } else if (isQuestion) {
    message = `Let me explain this clearly using insights from ${leadAnchor}.`;
  } else {
    message =
      `I'm here to help. This response leverages ${leadAnchor} to address your needs.`;
  }

  return {
    title: "Knowledge Interpretation",
    narrative,
    loopAnchors,
    recommendedActions,
    memoryEcho,
    message,
  };
};

const responseFromTraces = (
  memory: MemoryHypergraph,
  prompt: string,
  summary: string,
  outcome: ProjectionOutcome,
  traces = memory.getState().traces,
): PromptResponse => {
  const recentTraceIds = traces.slice(-outcome.samples.length).map((trace) =>
    trace.id
  );
  const recentTraces = memory
    .getState()
    .traces.filter((trace) => recentTraceIds.includes(trace.id));

  const concepts = recentTraces.map((trace) => {
    const concept = memory.getConcept(trace.conceptId);
    return {
      conceptId: trace.conceptId,
      label: concept?.label ?? trace.conceptId,
      anchors: concept?.anchors ?? [],
      coordinate: trace.projection.coordinate,
      value: trace.projection.value,
    };
  });

  // Extract keywords for knowledge generation
  const keywords = prompt.toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  // Get dominant concepts
  const dominantConcepts = outcome.samples
    .map((s) => s.concept)
    .filter((c): c is typeof c & object => c !== undefined)
    .filter((c, i, arr) => arr.findIndex((x) => x?.id === c?.id) === i)
    .slice(0, 3);

  // Generate actual knowledge response
  const pixels = outcome.samples
    .map((s) => s.point.pixel)
    .filter((p): p is { x: number; y: number } => p !== undefined);

  const generatedAnswer = generateKnowledgeResponse({
    prompt,
    keywords,
    dominantConcepts,
    pixels,
  });

  return {
    summary,
    concepts,
    rawProjection: outcome,
    observerInsight: buildObserverInsight(prompt, summary, concepts),
    generatedAnswer,
  };
};

export const createImagePromptInterface = async (
  options: PromptInterfaceOptions = {},
): Promise<PromptInterface> => {
  const memory = options.memory ?? createMemoryHypergraph();
  const runtime = await createProjectionRuntime(options.projectionConfig);
  const dialog: DialogTurn[] = [];

  const prompt = (input: string): Promise<PromptResponse> => {
    const outcome = runtime.project(input);
    const summary = describeOutcome(input, outcome);
    memory.ingestProjection(input, outcome, summary);
    const response = responseFromTraces(memory, input, summary, outcome);
    dialog.push({ prompt: input, response });
    return Promise.resolve(response);
  };

  return {
    prompt,
    history: () => [...dialog],
    memoryState: () => memory.getState(),
    seedSummary: () =>
      runtime.model.seedConceptSummaries().map((summary) => ({
        id: summary.id,
        label: summary.label,
        keywords: summary.keywords,
        coverage: summary.coverage,
        description: summary.description,
      })),
    seedPixels: (conceptId: string, limit = 32) =>
      runtime.model.sampleSeedPixels(conceptId, limit),
    seedHighlights: (limit = 48) => runtime.model.strongestSeedPixels(limit),
  };
};
