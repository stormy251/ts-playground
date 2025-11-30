import { ConceptNode } from "./node-types.ts";

export type LatentPoint = {
  id: string;
  vector: number[];
  pixel?: { x: number; y: number };
  tags: string[];
};

export type HyperEdge = {
  id: string;
  memberPointIds: LatentPoint["id"][];
  description?: string;
  weight?: number;
};

export type PlanarCoordinate = {
  x: number;
  y: number;
  confidence: number;
};

export type ValueProjection = {
  pointId: LatentPoint["id"];
  coordinate: PlanarCoordinate;
  value: number;
};

export type MemoryTrace = {
  id: string;
  conceptId: ConceptNode["id"];
  prompt: string;
  responseSummary: string;
  projection: ValueProjection;
  createdAt: number;
};

export type HypergraphMemoryState = {
  latentPoints: Map<LatentPoint["id"], LatentPoint>;
  hyperEdges: Map<HyperEdge["id"], HyperEdge>;
  conceptIndex: Map<ConceptNode["id"], LatentPoint["id"][]>;
  conceptNodes: Map<ConceptNode["id"], ConceptNode>;
  traces: MemoryTrace[];
};

export type ImageProjectionConfig = {
  /**
   * Path to the seed resource. Can be a single image file or a directory that
   * contains an atlas of images.
   */
  imagePath: string;
  sampleCount: number;
  embeddingDimension: number;
  seed?: number;
  conceptSampleSize?: number;
};

export type SeedConcept = {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  color: [number, number, number];
  region: {
    xRange: [number, number];
    yRange: [number, number];
  };
  loopPhase?: number;
  weight?: number;
};

export type SeedPixel = {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  a: number;
  energy: number;
  conceptId: SeedConcept["id"];
  layerId?: string;
};

export type SeedImageLatents = {
  width: number;
  height: number;
  pixels: SeedPixel[];
  concepts: SeedConcept[];
};

export type ProjectionSample = {
  point: LatentPoint;
  projection: PlanarCoordinate;
  concept?: SeedConcept;
  layerId?: string;
};

export type ProjectionOutcome = {
  samples: ProjectionSample[];
  valueField: ValueProjection[];
};
