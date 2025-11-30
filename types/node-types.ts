export enum NodeType {
  Base = "base",
  Circle = "circle",
  Concept = "concept",
}

export type Node = BaseNode | CircleNode | ConceptNode;

export type BaseNode = {
  id: string;
  label?: string;
  description?: string;
  type: NodeType;
};

export type CircleNode = BaseNode & {
  type: NodeType.Circle;
  radius: number;
  color: string;
  displayText: string;
};

export type ConceptNode = BaseNode & {
  type: NodeType.Concept;
  vector: number[];
  anchors: string[];
  lastProjection?: {
    x: number;
    y: number;
    confidence: number;
  };
};
