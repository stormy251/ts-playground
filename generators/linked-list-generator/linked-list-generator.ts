import { EdgeType } from "../../types/edge-types.ts";
import { LinkedListGraph } from "../../types/graph-types.ts";
import { NodeType } from "../../types/node-types.ts";

import {
  getEdgeIdFromIndex,
  getNodeIdFromIndex,
  STARTING_INDEX,
} from "./linked-list-utils.ts";

export type LinkedListGeneratorOptions = {
  /**
   * The index of the starting node.
   * @default 1
   */
  startingNodeIndex: number;
  //** number of nodes in the list */
  nodeCount: number;
  //** control the label of the node */
  labelControl: (index: number) => string;
};

export const linkedListGenerator = ({
  startingNodeIndex = STARTING_INDEX,
  nodeCount,
  labelControl,
}: LinkedListGeneratorOptions): LinkedListGraph => {
  const nodeMap: LinkedListGraph["nodeMap"] = new Map();
  const edgeMap: LinkedListGraph["edgeMap"] = new Map();
  const generatorLimit = nodeCount + startingNodeIndex;

  for (let i = startingNodeIndex; i < generatorLimit; i++) {
    const isStartingNode = i === startingNodeIndex;

    const nodeId = getNodeIdFromIndex(i);
    nodeMap.set(nodeId, {
      id: nodeId,
      type: NodeType.Base,
      label: labelControl(i),
    });

    if (!isStartingNode) {
      edgeMap.set(getEdgeIdFromIndex(i), {
        id: getEdgeIdFromIndex(i),
        type: EdgeType.Directed,
        source: (i - 1).toString(),
        target: i.toString(),
      });
    }
  }

  return {
    nodeMap,
    edgeMap,
    startingNodeIndex,
    length: nodeCount,
  };
};
