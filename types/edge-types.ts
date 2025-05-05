import { Node } from "./node-types.ts";

export enum EdgeType {
  Base = "base",
  Directed = "directed",
}

export type Edge = BaseEdge | DirectedEdge;

export type BaseEdge = {
  id: string;
  name?: string;
  description?: string;
  connections: Array<[Node["id"], Node["id"]]>;
  type: EdgeType;
};

export type DirectedEdge = Omit<BaseEdge, "connections"> & {
  type: EdgeType.Directed;
  source: Node["id"];
  target: Node["id"];
};
