import { LinkedListGraph } from "../../types/graph-types.ts";

export const getEdgeIdFromIndex = (index: number) => `${index - 1}-${index}`;
export const getNodeIdFromIndex = (index: number) => index.toString();
export const STARTING_INDEX = 1;
export const STARTING_NODE_ID = getNodeIdFromIndex(STARTING_INDEX);

export const printLinkedList = (linkedList: LinkedListGraph) => {
  const { nodeMap, edgeMap, startingNodeIndex, length } = linkedList;

  const lastNode = nodeMap.get(getNodeIdFromIndex(length));
  let nodeIndexPointer = startingNodeIndex;
  const sourceNodeLabels: string[] = [];

  while (nodeIndexPointer <= length) {
    const currentEdge = edgeMap.get(getEdgeIdFromIndex(nodeIndexPointer));

    if (currentEdge) {
      const sourceNode = nodeMap.get(currentEdge.source);
      sourceNodeLabels.push(sourceNode?.label ?? "non-labeled node");
    }
    nodeIndexPointer++;
  }

  sourceNodeLabels.push(lastNode?.label ?? "non-labeled node");

  console.log(sourceNodeLabels.join(" -> "));
};
