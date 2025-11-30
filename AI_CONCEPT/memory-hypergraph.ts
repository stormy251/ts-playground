import { ConceptNode, NodeType } from "../types/node-types.ts";
import {
  HypergraphMemoryState,
  LatentPoint,
  MemoryTrace,
  ProjectionOutcome,
  ValueProjection,
} from "../types/hypergraph-types.ts";

const createEmptyState = (): HypergraphMemoryState => ({
  latentPoints: new Map(),
  hyperEdges: new Map(),
  conceptIndex: new Map(),
  conceptNodes: new Map(),
  traces: [],
});

const conceptIdFromPoint = (pointId: string) => `concept-${pointId}`;

const uniqueMerge = <T>(existing: T[], incoming: T[]) => [
  ...new Set([...existing, ...incoming]),
];

const summarizeOutcome = (outcome: ProjectionOutcome): string => {
  const tags = new Set<string>();
  outcome.samples.forEach((sample) => {
    sample.point.tags.forEach((tag) => tags.add(tag));
  });
  const excerpt = [...tags].slice(0, 4).join(", ") || "latent concepts";
  return `Projected ${outcome.samples.length} concepts around ${excerpt}`;
};

export class MemoryHypergraph {
  private state: HypergraphMemoryState = createEmptyState();

  ingestProjection(
    prompt: string,
    outcome: ProjectionOutcome,
    responseSummary = summarizeOutcome(outcome),
  ): MemoryTrace[] {
    const timestamp = Date.now();
    const hyperEdgeId = `edge-${timestamp}-${this.state.hyperEdges.size}`;
    const memberPointIds = outcome.samples.map((sample) => sample.point.id);

    this.state.hyperEdges.set(hyperEdgeId, {
      id: hyperEdgeId,
      memberPointIds,
      description: `raycast:${prompt}`,
      weight: outcome.valueField.reduce((sum, value) => sum + value.value, 0),
    });

    const traces: MemoryTrace[] = [];

    outcome.samples.forEach((sample) => {
      this.state.latentPoints.set(sample.point.id, sample.point);

      const valueProjection = outcome.valueField.find(
        (value) => value.pointId === sample.point.id,
      );

      if (!valueProjection) return;

      const conceptNode = this.upsertConcept(sample.point, valueProjection);
      const trace = this.createTrace(
        conceptNode,
        prompt,
        responseSummary,
        valueProjection,
        timestamp,
      );
      traces.push(trace);
      this.state.traces.push(trace);
    });

    return traces;
  }

  getState(): HypergraphMemoryState {
    return this.state;
  }

  getConcept(conceptId: string) {
    return this.state.conceptNodes.get(conceptId);
  }

  private upsertConcept(
    point: LatentPoint,
    projection: ValueProjection,
  ): ConceptNode {
    const conceptId = conceptIdFromPoint(point.id);
    const existing = this.state.conceptNodes.get(conceptId);

    const baseNode: ConceptNode =
      existing ??
      {
        id: conceptId,
        type: NodeType.Concept,
        label: point.tags[0] ?? "concept",
        description: `Concept synthesized from ${point.id}`,
        vector: point.vector,
        anchors: point.tags,
      };

    const updated: ConceptNode = {
      ...baseNode,
      vector: point.vector,
      anchors: uniqueMerge(baseNode.anchors, point.tags),
      lastProjection: projection.coordinate,
    };

    this.state.conceptNodes.set(conceptId, updated);

    const conceptLatentPoints =
      this.state.conceptIndex.get(conceptId) ?? [];
    this.state.conceptIndex.set(
      conceptId,
      uniqueMerge(conceptLatentPoints, [point.id]),
    );

    return updated;
  }

  private createTrace(
    conceptNode: ConceptNode,
    prompt: string,
    responseSummary: string,
    projection: ValueProjection,
    timestamp: number,
  ): MemoryTrace {
    return {
      id: `trace-${timestamp}-${conceptNode.id}`,
      conceptId: conceptNode.id,
      prompt,
      responseSummary,
      projection,
      createdAt: timestamp,
    };
  }
}

export const createMemoryHypergraph = () => new MemoryHypergraph();

