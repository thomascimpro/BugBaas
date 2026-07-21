import assert from "node:assert/strict";
import test from "node:test";
import { createOpenAIImageIdentifier } from "./openaiVision.mjs";

const catalog = [
  { id: "mier", name: "Mier", rarity: "Gewoon" },
  { id: "lieveheersbeestje", name: "Lieveheersbeestje", rarity: "Zeldzaam" }
];

test("sends the image and returns structured identification", async () => {
  let requestBody;
  const identifyImage = createOpenAIImageIdentifier({
    apiKey: "test-key",
    model: "gpt-test",
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          output: [{
            type: "message",
            content: [{
              type: "output_text",
              text: JSON.stringify({
                containsBug: true,
                imageQuality: "good",
                catalogStatus: "matched",
                matchedBugId: "mier",
                commonName: "Mier",
                scientificName: "Formicidae",
                confidence: 0.91,
                reason: "Zes poten en geknikte antennes."
              })
            }]
          }]
        })
      };
    }
  });

  const result = await identifyImage({ imageDataUrl: "data:image/jpeg;base64,YWJjZA==", catalog });

  assert.equal(result.matchedBugId, "mier");
  assert.equal(requestBody.model, "gpt-test");
  assert.equal(requestBody.max_output_tokens, 1200);
  assert.equal(requestBody.input[0].content[1].image_url, "data:image/jpeg;base64,YWJjZA==");
  assert.match(requestBody.input[0].content[0].text, /screenshots, photos of screens or prints, toys, and clearly AI-generated or manipulated images/i);
  assert.match(requestBody.input[0].content[0].text, /still fill commonName and scientificName/i);
  assert.equal(requestBody.text.format.type, "json_schema");
  assert.ok(requestBody.text.format.schema.required.includes("catalogStatus"));
  assert.deepEqual(requestBody.text.format.schema.properties.catalogStatus.enum, ["matched", "not_in_catalog", "uncertain"]);
});

test("throws a safe error when OpenAI rejects the request", async () => {
  const identifyImage = createOpenAIImageIdentifier({
    apiKey: "test-key",
    fetchImpl: async () => ({
      ok: false,
      status: 429,
      text: async () => "rate limited"
    })
  });

  await assert.rejects(
    () => identifyImage({ imageDataUrl: "data:image/jpeg;base64,YWJjZA==", catalog }),
    /OpenAI request failed: 429/
  );
});
