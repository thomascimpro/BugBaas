import { buildBugCatalogPrompt } from "./classification.mjs";

const INITIAL_MAX_OUTPUT_TOKENS = 6000;
const RETRY_MAX_OUTPUT_TOKENS = 9000;

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "containsBug",
    "imageQuality",
    "catalogStatus",
    "matchedBugId",
    "commonName",
    "commonNameEn",
    "commonNameFr",
    "scientificName",
    "fact",
    "factEn",
    "factFr",
    "confidence",
    "reason",
    "reasonEn",
    "reasonFr"
  ],
  properties: {
    containsBug: { type: "boolean" },
    imageQuality: { type: "string", enum: ["good", "poor"] },
    catalogStatus: { type: "string", enum: ["matched", "not_in_catalog", "uncertain"] },
    matchedBugId: { type: ["string", "null"] },
    commonName: { type: "string" },
    commonNameEn: { type: "string" },
    commonNameFr: { type: "string" },
    scientificName: { type: "string" },
    fact: { type: "string" },
    factEn: { type: "string" },
    factFr: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reason: { type: "string" },
    reasonEn: { type: "string" },
    reasonFr: { type: "string" }
  }
};

class IncompleteOpenAIResponseError extends Error {}

function extractOutputText(payload) {
  if (payload?.status === "incomplete") {
    const reason = payload?.incomplete_details?.reason ?? "unknown reason";
    throw new IncompleteOpenAIResponseError(`OpenAI response was incomplete: ${reason}.`);
  }
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) return payload.output_text;
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  throw new IncompleteOpenAIResponseError("OpenAI response contained no structured output.");
}

function parseStructuredOutput(payload) {
  try {
    return JSON.parse(extractOutputText(payload));
  } catch (error) {
    if (error instanceof IncompleteOpenAIResponseError) throw error;
    if (error instanceof SyntaxError) {
      throw new IncompleteOpenAIResponseError("OpenAI response contained incomplete JSON.");
    }
    throw error;
  }
}

export function createOpenAIImageIdentifier({
  apiKey,
  model = "gpt-5-mini",
  fetchImpl = fetch
} = {}) {
  return async function identifyImage({ imageDataUrl, catalog }) {
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
    const catalogPrompt = buildBugCatalogPrompt(catalog);
    const promptLines = [
      "First identify the visible insect, arachnid, or other small arthropod independently, without using the BugDex catalog as a list of candidates.",
      "Always name what is actually visible in commonName and scientificName at the most specific defensible taxonomic level, even when imageQuality is poor or containsBug is false. Use a broader honest taxon such as beetle, moth, spider, or family when the exact species is uncertain; do not replace a recognizable subject with a generic unknown label.",
      "If the photo does not contain an arthropod, commonName must still briefly name the visible subject, while containsBug remains false.",
      "Only after identifying the animal, compare that taxon with the BugDex catalog.",
      "Set catalogStatus to matched only when the identified taxon is genuinely represented by one exact BugDex entry. Never choose the closest-looking, related, or generic entry merely because it is in the catalog.",
      "Set catalogStatus to not_in_catalog only when a specific named species or clear taxon is confidently identifiable but absent from the catalog.",
      "Set catalogStatus to uncertain when the photo or identification is not specific enough. Use null for matchedBugId unless catalogStatus is matched.",
      "Use uncertain only when the visible evidence genuinely cannot support one best identification. If one taxon is clearly most likely, return that best identification and express residual doubt through confidence instead.",
      "A confidence around 0.70 is acceptable for a best identification when multiple visible anatomical features support it; do not require near-certainty.",
      "Set imageQuality to poor only when blur, darkness, distance, or obstruction prevents useful anatomical assessment. A normal phone photo, crop, plain background, or imperfect composition is not poor by itself.",
      "When the identified taxon is absent from BugDex, return catalogStatus not_in_catalog and its real name so a developer can review and add it later.",
      "Do not invent IDs. Treat confidence as identification confidence, not image quality.",
      "Return commonName in Dutch, commonNameEn in English, and commonNameFr in French. Keep scientificName language-neutral.",
      "Return one short, verifiable species fact in Dutch, English, and French using fact, factEn, and factFr. Avoid medical or safety claims.",
      "Return the identification explanation in Dutch, English, and French using reason, reasonEn, and reasonFr.",
      "Keep every translated fact and explanation concise: at most 140 characters per field.",
      "Reject obvious screenshots, photos of screens or prints, toys, and clearly AI-generated or manipulated images by setting containsBug to false and explaining the authenticity concern briefly. Do not claim certainty when authenticity is ambiguous.",
      "For a rejected reference image, still fill commonName and scientificName for the visible subject when possible, but keep containsBug false so it cannot grant a reward or create a catalog suggestion.",
      "BugDex catalog:",
      catalogPrompt
    ];

    async function requestIdentification(maxOutputTokens, retry = false) {
      const response = await fetchImpl("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          max_output_tokens: maxOutputTokens,
          reasoning: { effort: "medium" },
          input: [{
            role: "user",
            content: [
              {
                type: "input_text",
                text: [
                  ...(retry ? ["Retry after an incomplete response. Return one compact, complete JSON object and no extra text."] : []),
                  ...promptLines
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

      return parseStructuredOutput(await response.json());
    }

    try {
      return await requestIdentification(INITIAL_MAX_OUTPUT_TOKENS);
    } catch (error) {
      if (!(error instanceof IncompleteOpenAIResponseError)) throw error;
      return requestIdentification(RETRY_MAX_OUTPUT_TOKENS, true);
    }
  };
}
