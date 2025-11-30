import type { PromptInterface } from "./AI_CONCEPT/prompt-interface.ts";
import {
  createImagePromptInterface,
  PromptResponse,
  SeedConceptSummary,
} from "./AI_CONCEPT/prompt-interface.ts";
import type { SeedPixel } from "./types/hypergraph-types.ts";

const logConcept = (
  concept: PromptResponse["concepts"][number],
  index: number,
) => {
  const { label, anchors, coordinate, value } = concept;
  console.log(
    `  ${index + 1}. ${label} (${
      anchors.slice(0, 3).join(", ") || "latent"
    }) -> (${coordinate.x.toFixed(2)}, ${
      coordinate.y.toFixed(2)
    }) value=${value}`,
  );
};

const runImageDialogDemo = async () => {
  const promptInterface: PromptInterface = await createImagePromptInterface();
  console.log("Seed concept overview:");
  promptInterface.seedSummary().forEach(
    (concept: SeedConceptSummary, idx: number) => {
      console.log(
        `  ${idx + 1}. ${concept.label} [${
          concept.keywords
            .slice(0, 4)
            .join(", ")
        }] coverage=${(concept.coverage * 100).toFixed(1)}%`,
      );
    },
  );

  console.log("\nSeed highlight pixels:");
  promptInterface.seedHighlights(5).forEach(
    (pixel: SeedPixel, idx: number) => {
      console.log(
        `  ${idx + 1}. ${pixel.conceptId} -> (${
          (pixel.x * 2 - 1).toFixed(2)
        }, ${(pixel.y * 2 - 1).toFixed(2)}) energy=${pixel.energy.toFixed(2)}`,
      );
    },
  );

  const scriptedPrompts = [
    "Map the luminous nodes near the horizon",
    "Project circular motifs anchored in cyan",
    "Describe abstract memory clusters around dusk-tones",
  ];

  for (const prompt of scriptedPrompts) {
    const response = await promptInterface.prompt(prompt);
    console.log(`\n[Prompt] ${prompt}`);
    console.log(`Summary: ${response.summary}`);
    response.concepts.slice(0, 3).forEach((concept, idx) => {
      logConcept(concept, idx);
    });
  }
};

const main = async () => {
  await runImageDialogDemo();
};

if (import.meta.main) {
  await main();
}
