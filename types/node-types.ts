export enum NodeType {
  Base = "base",
  Circle = "circle",
}

export type Node = BaseNode | CircleNode;

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
