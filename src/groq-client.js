const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_TIMEOUT_MS = 20_000;

export class GroqConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "GroqConfigurationError";
  }
}

export class GroqRequestError extends Error {
  constructor(message, { status = null, retryable = false } = {}) {
    super(message);
    this.name = "GroqRequestError";
    this.status = status;
    this.retryable = retryable;
  }
}

/**
 * Call Groq's OpenAI-compatible chat-completions endpoint.
 * Secrets are read only from Worker env bindings; never include them in errors.
 * Model ID is deliberately configurable so retired models are not silently pinned.
 */
export async function generateWithGroq(
  env,
  messages,
  { fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS, maxCompletionTokens = 1200 } = {},
) {
  if (!env?.GROQ_API_KEY || typeof env.GROQ_API_KEY !== "string") {
    throw new GroqConfigurationError("Groq API key is not configured.");
  }
  if (!env?.GROQ_MODEL || typeof env.GROQ_MODEL !== "string" || !env.GROQ_MODEL.trim()) {
    throw new GroqConfigurationError("Groq model ID is not configured.");
  }
  if (!Array.isArray(messages) || messages.length === 0 ||
      messages.some((m) => !m || !["system", "user", "assistant"].includes(m.role) ||
        typeof m.content !== "string" || !m.content.trim())) {
    throw new TypeError("Messages must be a non-empty list of valid chat messages.");
  }
  if (!Number.isInteger(maxCompletionTokens) || maxCompletionTokens < 1 || maxCompletionTokens > 4096) {
    throw new RangeError("maxCompletionTokens must be an integer between 1 and 4096.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(GROQ_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.GROQ_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL.trim(),
        messages,
        max_completion_tokens: maxCompletionTokens,
        temperature: 0.4,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
      const message = response.status === 429
        ? "Groq rate limit reached; pause and retry only within the job retry budget."
        : response.status >= 500
          ? "Groq service temporarily failed."
          : response.status === 401 || response.status === 403
            ? "Groq authorization failed; check the configured secret and account access."
            : `Groq request rejected (HTTP ${response.status}).`;
      throw new GroqRequestError(message, { status: response.status, retryable });
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new GroqRequestError("Groq returned an invalid response.", { retryable: true });
    }
    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      throw new GroqRequestError("Groq response did not contain generated text.", { retryable: true });
    }
    return {
      text,
      model: typeof payload.model === "string" ? payload.model : env.GROQ_MODEL.trim(),
      usage: payload.usage && typeof payload.usage === "object"
        ? {
            prompt_tokens: Number.isFinite(payload.usage.prompt_tokens) ? payload.usage.prompt_tokens : null,
            completion_tokens: Number.isFinite(payload.usage.completion_tokens) ? payload.usage.completion_tokens : null,
            total_tokens: Number.isFinite(payload.usage.total_tokens) ? payload.usage.total_tokens : null,
          }
        : null,
    };
  } catch (error) {
    if (error instanceof GroqConfigurationError || error instanceof GroqRequestError) throw error;
    if (error?.name === "AbortError") {
      throw new GroqRequestError("Groq request timed out.", { retryable: true });
    }
    throw new GroqRequestError("Groq network request failed.", { retryable: true });
  } finally {
    clearTimeout(timer);
  }
}
