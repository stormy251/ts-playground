import { serveDir } from "https://deno.land/std@0.210.0/http/file_server.ts";
import { serve } from "https://deno.land/std@0.210.0/http/server.ts";
import { createImagePromptInterface } from "./AI_CONCEPT/prompt-interface.ts";

// Use reference seed image
const SEED_IMAGE_PATH = "AI_CONCEPT/assets/reference-image.png";

console.log("Initializing Knowledge Interface...");
const promptInterface = await createImagePromptInterface();
console.log("Knowledge Interface ready!");

const seedImageBytes = await Deno.readFile(SEED_IMAGE_PATH);

const seedImageHeaders = {
  "content-type": "image/png",
  "cache-control": "public, max-age=60",
};

const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });

const handleApi = async (
  req: Request,
  url: URL,
): Promise<Response | undefined> => {
  if (url.pathname === "/api/seed" && req.method === "GET") {
    return json({
      summary: promptInterface.seedSummary(),
      highlights: promptInterface.seedHighlights(32),
    });
  }

  if (url.pathname === "/api/history" && req.method === "GET") {
    return json({ history: promptInterface.history() });
  }

  if (url.pathname === "/api/prompt" && req.method === "POST") {
    try {
      const { prompt } = await req.json();
      if (!prompt || typeof prompt !== "string") {
        return json(
          { error: "Prompt is required." },
          { status: 400 },
        );
      }
      const response = await promptInterface.prompt(prompt);
      return json({
        response,
        historyLength: promptInterface.history().length,
      });
    } catch (error) {
      console.error("Prompt error", error);
      return json({ error: "Failed to process prompt." }, { status: 500 });
    }
  }

  if (url.pathname === "/seed-image" && req.method === "GET") {
    return new Response(seedImageBytes, { headers: seedImageHeaders });
  }

  return undefined;
};

console.log("Starting server on http://localhost:8000");
console.log("Knowledge Interface is ready to use!\n");

serve(async (req) => {
  const url = new URL(req.url);

  try {
    const apiResponse = await handleApi(req, url);
    if (apiResponse) return apiResponse;

    return await serveDir(req, {
      fsRoot: "web",
      urlRoot: "",
      quiet: true,
    });
  } catch (error) {
    console.error("Server error", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}, { port: 8000 });
