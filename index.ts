import { linkedListGenerator } from "./generators/linked-list-generator/linked-list-generator.ts";
import { printLinkedList } from "./generators/linked-list-generator/linked-list-utils.ts";

const linkedListGraph = linkedListGenerator({
  nodeCount: 10,
  labelControl: (index) => `Node ${index}`,
  startingNodeIndex: 1,
});

console.log(linkedListGraph);

printLinkedList(linkedListGraph);
