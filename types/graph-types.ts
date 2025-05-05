import { DirectedEdge, Edge } from "./edge-types.ts";
import { Node } from "./node-types.ts";

export type Graph = {
  nodeMap: Map<Node["id"], Node>;
  edgeMap: Map<Edge["id"], Edge>;
};

export type LinkedListGraph = {
  nodeMap: Map<Node["id"], Node>;
  edgeMap: Map<Edge["id"], DirectedEdge>;
  startingNodeIndex: number;
  length: number;
};
