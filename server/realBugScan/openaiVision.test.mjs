import assert from "node:assert/strict";
import test from "node:test";
import { createOpenAIImageIdentifier } from "./openaiVision.mjs";

const catalog = [
  { id: "mier", name: "Mier", rarity: "Gewoon" },
  { id: "lieveheersbeestje", name: "Lieveheersbeestje", rarity: "Zeldzaam" }
];

const identification = {
  containsBug: true,
  imageQuality: "good",
  catalogStatus: "matched",
  matchedBugId: "mier",
  commonName: "Mier",
  commonNameEn: "Ant",
  commonNameFr: "Fourmi",
  scientificName: "Formicidae",
  fact: "Mieren communiceren met geursporen.",
  factEn: "Ants communicate using scent trails.",
  factFr: "Les fourmis communiquent avec des pistes odorantes.",
  confidence: 0.91,
  reason: "Zes poten en geknikte antennes.",
  reasonEn: "Six legs and elbowed antennae.",
  reasonFr: "Six pattes et des antennes coudees."
};

function successfulResponse(value = identification) {
  return {
    ok: true,
    json: async () => ({ output_text: JSON.stringify(value) })
  };
}

test("sends the image and returns structured identification", async () => {
  const requestBodies = [];
  const identifyImage = createOpenAIImageIdentifier({
    apiKey: "test-key",
    model: "gpt-test",
    fetchImpl: async (_url, options) => {
      requestBodies.push(JSON.parse(options.body));
      return successfulResponse();
    }
  });

  const result = await identifyImage({ imageDataUrl: "data:image/jpeg;base64,YWJjZA==", catalog });
  const requestBody = requestBodies[0];

  assert.equal(result.matchedBugId, "mier");
  assert.equal(requestBodies.length, 1);
  assert.equal(requestBody.model, "gpt-test");
  assert.equal(requestBody.max_output_tokens, 3200);
  assert.equal(requestBody.reasoning.effort, "low");
  assert.equal(requestBody.input[0].content[1].image_url, "data:image/jpeg;base64,YWJjZA==");
  assert.match(requestBody.input[0].content[0].text, /screenshots, photos of screens or prints, toys, and clearly AI-generated or manipulated images/i);
  assert.match(requestBody.input[0].content[0].text, /still fill commonName and scientificName/i);
  assert.match(requestBody.input[0].content[0].text, /without using the BugDex catalog as a list of candidates/i);
  assert.match(requestBody.input[0].content[0].text, /always name what is actually visible/i);
  assert.match(requestBody.input[0].content[0].text, /developer can review and add it later/i);
  assert.match(requestBody.input[0].content[0].text, /at most 140 characters per field/i);
  assert.ok(requestBody.text.format.schema.required.includes("factFr"));
  assert.ok(requestBody.text.format.schema.required.includes("reasonFr"));
  assert.equal(requestBody.text.format.type, "json_schema");
  assert.ok(requestBody.text.format.schema.required.includes("catalogStatus"));
  assert.deepEqual(requestBody.text.format.schema.properties.catalogStatus.enum, ["matched", "not_in_catalog", "uncertain"]);
});

test("retries once with a larger budget after an incomplete response", async () => {
  const requestBodies = [];
  const identifyImage = createOpenAIImageIdentifier({
    apiKey: "test-key",
    fetchImpl: async (_url, options) => {
      requestBodies.push(JSON.parse(options.body));
      if (requestBodies.length === 1) {
        return {
          ok: true,
          json: async () => ({ status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, output: [] })
        };
      }
      return successfulResponse();
    }
  });

  const result = await identifyImage({ imageDataUrl: "data:image/jpeg;base64,YWJjZA==", catalog });

  assert.equal(result.matchedBugId, "mier");
  assert.equal(requestBodies.length, 2);
  assert.equal(requestBodies[0].max_output_tokens, 3200);
  assert.equal(requestBodies[1].max_output_tokens, 5000);
  assert.match(requestBodies[1].input[0].content[0].text, /retry after an incomplete response/i);
});

test("retries once when structured JSON is truncated", async () => {
  let callCount = 0;
  const identifyImage = createOpenAIImageIdentifier({
    apiKey: "test-key",
    fetchImpl: async () => {
      callCount += 1;
      return callCount === 1
        ? { ok: true, json: async () => ({ output_text: '{"containsBug":true,"commonName":"Oak' }) }
        : successfulResponse();
    }
  });

  const result = await identifyImage({ imageDataUrl: "data:image/jpeg;base64,YWJjZA==", catalog });

  assert.equal(result.matchedBugId, "mier");
  assert.equal(callCount, 2);
});

test("stops after one retry when OpenAI remains incomplete", async () => {
  let callCount = 0;
  const identifyImage = createOpenAIImageIdentifier({
    apiKey: "test-key",
    fetchImpl: async () => {
      callCount += 1;
      return {
        ok: true,
        json: async () => ({ status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, output: [] })
      };
    }
  });

  await assert.rejects(
    () => identifyImage({ imageDataUrl: "data:image/jpeg;base64,YWJjZA==", catalog }),
    /incomplete: max_output_tokens/i
  );
  assert.equal(callCount, 2);
});

test("throws a safe error without retrying when OpenAI rejects the request", async () => {
  let callCount = 0;
  const identifyImage = createOpenAIImageIdentifier({
    apiKey: "test-key",
    fetchImpl: async () => {
      callCount += 1;
      return {
        ok: false,
        status: 429,
        text: async () => "rate limited"
      };
    }
  });

  await assert.rejects(
    () => identifyImage({ imageDataUrl: "data:image/jpeg;base64,YWJjZA==", catalog }),
    /OpenAI request failed: 429/
  );
  assert.equal(callCount, 1);
});
