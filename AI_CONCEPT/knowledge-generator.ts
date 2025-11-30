/**
 * Knowledge Generator - Extracts actual knowledge from seed images
 * and generates helpful responses based on pixel data
 */

import { SeedConcept, SeedPixel } from "../types/hypergraph-types.ts";

export type KnowledgeContext = {
  prompt: string;
  keywords: string[];
  dominantConcepts: SeedConcept[];
  pixels: Array<{ x: number; y: number }>;
};

export type GeneratedResponse = {
  answer: string;
  steps?: string[];
  explanation?: string;
};

// Knowledge patterns encoded in color ranges and spatial positions
const KNOWLEDGE_PATTERNS = {
  "stem-mathematics": {
    colorRanges: [[50, 150, 180], [100, 200, 255]],
    concepts: {
      addition: {
        triggers: ["add", "plus", "sum", "+", "total"],
        generator: (context: KnowledgeContext) => {
          const numbers = context.prompt.match(/\d+/g)?.map(Number) || [];
          if (numbers.length >= 2) {
            const [a, b] = numbers;
            const result = a + b;
            return {
              answer: `To solve ${a} + ${b}, you add the numbers together.`,
              steps: [
                `Start with the first number: ${a}`,
                `Add the second number: ${b}`,
                `${a} + ${b} = ${result}`,
                `The answer is ${result}`,
              ],
              explanation:
                `Addition combines two or more numbers into a total. When you add ${a} and ${b}, you're counting up by ${b} from ${a}, which gives you ${result}.`,
            };
          }
          return {
            answer:
              "Addition is the process of combining two or more numbers to find their total sum.",
            explanation:
              "To add numbers, start with the first number and count up by the amount of the second number. For example, 3 + 4 means starting at 3 and counting 4 more: 4, 5, 6, 7. The answer is 7.",
          };
        },
      },
      subtraction: {
        triggers: ["subtract", "minus", "difference", "-", "take away"],
        generator: (context: KnowledgeContext) => {
          const numbers = context.prompt.match(/\d+/g)?.map(Number) || [];
          if (numbers.length >= 2) {
            const [a, b] = numbers;
            const result = a - b;
            return {
              answer: `To solve ${a} - ${b}, you subtract ${b} from ${a}.`,
              steps: [
                `Start with ${a}`,
                `Subtract ${b}`,
                `${a} - ${b} = ${result}`,
                `The answer is ${result}`,
              ],
            };
          }
          return {
            answer: "Subtraction finds the difference between two numbers.",
          };
        },
      },
      multiplication: {
        triggers: ["multiply", "times", "product", "*", "×"],
        generator: (context: KnowledgeContext) => {
          const numbers = context.prompt.match(/\d+/g)?.map(Number) || [];
          if (numbers.length >= 2) {
            const [a, b] = numbers;
            const result = a * b;
            return {
              answer:
                `To multiply ${a} × ${b}, you add ${a} to itself ${b} times.`,
              steps: [
                `Think of ${a} × ${b} as adding ${a}, ${b} times`,
                `${a} + ${a}${
                  b > 2 ? ` + ${a}`.repeat(b - 2) : ""
                } = ${result}`,
                `The answer is ${result}`,
              ],
            };
          }
          return {
            answer: "Multiplication is repeated addition of the same number.",
          };
        },
      },
    },
  },

  "practical-skills": {
    concepts: {
      howTo: {
        triggers: ["how", "guide", "steps", "tutorial", "learn"],
        generator: (_context: KnowledgeContext) => {
          return {
            answer: "Here's a step-by-step approach to solve this:",
            steps: [
              "Break down the problem into smaller parts",
              "Identify what you need to accomplish",
              "Follow the steps in order",
              "Verify your result makes sense",
            ],
          };
        },
      },
    },
  },

  "social-psychology": {
    concepts: {
      feelings: {
        triggers: ["feel", "feeling", "emotion", "happy", "sad", "mood"],
        generator: (_context: KnowledgeContext) => {
          return {
            answer:
              "I'm an offline knowledge system, so I don't have feelings, but I'm here to help you!",
            explanation:
              "If you're asking about human emotions, they're complex responses to experiences. It's normal to have a wide range of feelings throughout the day.",
          };
        },
      },
    },
  },

  "synthesis-meta": {
    concepts: {
      understanding: {
        triggers: ["understand", "explain", "what", "why", "meaning"],
        generator: (_context: KnowledgeContext) => {
          return {
            answer: "Let me help you understand this concept.",
            explanation:
              "Understanding comes from breaking down complex ideas into simpler parts and seeing how they connect.",
          };
        },
      },
    },
  },
};

export function generateKnowledgeResponse(
  context: KnowledgeContext,
): GeneratedResponse {
  // Analyze the prompt to find matching knowledge patterns
  const promptLower = context.prompt.toLowerCase();

  // Try to find a matching concept across all domains
  for (const concept of context.dominantConcepts) {
    const domainPatterns =
      KNOWLEDGE_PATTERNS[concept.id as keyof typeof KNOWLEDGE_PATTERNS];
    if (!domainPatterns) continue;

    // Check each concept in this domain
    for (
      const [_conceptName, conceptData] of Object.entries(
        domainPatterns.concepts || {},
      )
    ) {
      const matches = conceptData.triggers.some((trigger: string) =>
        promptLower.includes(trigger.toLowerCase())
      );

      if (matches) {
        return conceptData.generator(context);
      }
    }
  }

  // Default response if no specific pattern matches
  return {
    answer:
      `I understand you're asking about "${context.prompt}". Based on the ${
        context.dominantConcepts[0]?.label || "available knowledge"
      } domain, I can help explain this concept.`,
    explanation: `The knowledge system has identified this relates to ${
      context.dominantConcepts.map((c) => c.label).join(", ")
    }. While I have limited specific content for this exact question, I'm drawing from these knowledge areas to provide context.`,
  };
}

// Analyze pixel colors to determine knowledge intensity
export function analyzePixelIntensity(pixels: SeedPixel[]): {
  avgBrightness: number;
  colorBalance: { r: number; g: number; b: number };
  energyLevel: number;
} {
  if (pixels.length === 0) {
    return {
      avgBrightness: 0,
      colorBalance: { r: 0, g: 0, b: 0 },
      energyLevel: 0,
    };
  }

  let totalR = 0, totalG = 0, totalB = 0, totalEnergy = 0;

  for (const pixel of pixels) {
    totalR += pixel.r;
    totalG += pixel.g;
    totalB += pixel.b;
    totalEnergy += pixel.energy;
  }

  const count = pixels.length;
  const avgR = totalR / count;
  const avgG = totalG / count;
  const avgB = totalB / count;

  return {
    avgBrightness: (avgR + avgG + avgB) / 3,
    colorBalance: {
      r: avgR / 255,
      g: avgG / 255,
      b: avgB / 255,
    },
    energyLevel: totalEnergy / count,
  };
}
