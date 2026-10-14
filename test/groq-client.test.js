import test from "node:test";
import assert from "node:assert/strict";
import { generateWithGroq, GroqConfigurationError, GroqRequestError } from "../src/groq-client.js";

const env = { GROQ_API_KEY: "test-secret", GROQ_MODEL: "openai/gpt-oss-20b" };
const messages = [{ role: "user", content: "Write a short test." }];
const ok = (payload, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  async json() { return payload; },
});

test("Groq client sends configured model and secret only in authorization header", async () => {
  let request;
  const result = await generateWithGroq(env, messages, {
    fetchImpl: async (url, init) => {
      request = { url, init };
      return ok({ model: env.GROQ_MODEL, choices: [{ message: { content: "Draft ready" } }], usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 } });
    },
  });
  assert.equal(request.url, "https://api.groq.com/openai/v1/chat/completions");
  assert.equal(request.init.headers.authorization, "Bearer test-secret");
  assert.equal(JSON.parse(request.init.body).model, env.GROQ_MODEL);
  assert.equal(result.text, "Draft ready");
  assert.equal(result.usage.total_tokens, 8);
});

test("Groq client fails closed when key or model is missing", async () => {
  await assert.rejects(generateWithGroq({ GROQ_MODEL: env.GROQ_MODEL }, messages), GroqConfigurationError);
  await assert.rejects(generateWithGroq({ GROQ_API_KEY: env.GROQ_API_KEY }, messages), GroqConfigurationError);
});

test("Groq client validates message shape and token budget", async () => {
  await assert.rejects(generateWithGroq(env, []), TypeError);
  await assert.rejects(generateWithGroq(env, [{ role: "system", content: "ok" }], { maxCompletionTokens: 5000 }), RangeError);
});

test("Groq rate limit is marked retryable without leaking provider body or secret", async () => {
  await assert.rejects(
    generateWithGroq(env, messages, { fetchImpl: async () => ok({ error: { message: env.GROQ_API_KEY } }, 429) }),
    (error) => error instanceof GroqRequestError && error.status === 429 && error.retryable === true &&
      !error.message.includes(env.GROQ_API_KEY) && !error.message.includes("provider body"),
  );
});

test("Groq authorization errors are not retryable", async () => {
  await assert.rejects(
    generateWithGroq(env, messages, { fetchImpl: async () => ok({}, 401) }),
    (error) => error instanceof GroqRequestError && error.status === 401 && error.retryable === false,
  );
});

test("Groq client rejects empty or malformed model responses safely", async () => {
  await assert.rejects(
    generateWithGroq(env, messages, { fetchImpl: async () => ok({ choices: [] }) }),
    (error) => error instanceof GroqRequestError && error.retryable === true,
  );
});

test("Groq network errors are sanitized", async () => {
  await assert.rejects(
    generateWithGroq(env, messages, { fetchImpl: async () => { throw new Error("network included secret " + env.GROQ_API_KEY); } }),
    (error) => error instanceof GroqRequestError && !error.message.includes(env.GROQ_API_KEY),
  );
});
