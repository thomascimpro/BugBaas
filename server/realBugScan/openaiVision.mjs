import { buildBugCatalogPrompt } from "./classification.mjs";

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "containsBug",
    "imageQuality",
    "catalogStatus",
    "matchedBugId",
    "commonName",
    "scientificName",
    "confidence",
    "reason"
  ],
  properties: {
    containsBug: { type: "boolean" },
    imageQuality: { type: "string", enum: ["good", "poor"] },
    catalogStatus: { type: "string", enum: ["matched", "not_in_catalog", "uncertain"] },
    matchedBugId: { type: ["string", "null"] },
    commonName: { type: "string" },
    scientificName: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reason: { type: "string" }
  }
};

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) return payload.output_text;
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  throw new Error("OpenAI response contained no structured output.");
}

export function createOpenAIImageIdentifier({
  apiKey,
  model = "gpt-5-mini",
  fetchImpl = fetch
} = {}) {
  return async function identifyImage({ imageDataUrl, catalog }) {
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
    const catalogPrompt = buildBugCatalogPrompt(catalog);
    const response = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        max_output_tokens: 1200,
        input: [{
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "Identify the visible insect, arachnid, or other small arthropod in this photo.",
                "Set catalogStatus to matched only when the visible animal clearly matches one BugDex entry, and return that exact matchedBugId.",
                "Set catalogStatus to not_in_catalog only when a specific named species or clear taxon is confidently identifiable but absent from the catalog.",
                "Set catalogStatus to uncertain when the photo or identification is not specific enough. Use null for matchedBugId unless catalogStatus is matched.",
                "Do not invent IDs. Treat confidence as identification confidence, not image quality.",
                "Reject obvious screenshots, photos of screens or prints, toys, and clearly AI-generated or manipulated images by setting containsBug to false and explaining the authenticity concern briefly. Do not claim certainty when authenticity is ambiguous.",
                "For a rejected reference image, still fill commonName and scientificName for the visible subject when possible, but keep containsBug false so it cannot grant a reward or create a catalog suggestion.",
                "BugDex catalog:",
                catalogPrompt
              ].join("\n")
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
              detail: "high"
            }
          ]
        }],
        text: {
          format: {
            type: "json_schema",
            name: "real_bug_identification",
            description: "A cautious real-world bug identification matched to the BugBaas BugDex catalog.",
            strict: true,
            schema: responseSchema
          }
        }
      })
    });

    if (!response.ok) {
      if (typeof response.text === "function") await response.text().catch(() => "");
      throw new Error(`OpenAI request failed: ${response.status}`);
    }

    const payload = await response.json();
    return JSON.parse(extractOutputText(payload));
  };
}
