/**
 * Server-side LLM client (OpenAI-compatible, e.g. OpenRouter free models).
 * The API key lives ONLY here — it is never shipped to the browser bundle.
 * Retries with exponential backoff and alternates between primary/fallback
 * models, which matters on free-tier upstreams that rate-limit (429).
 */

// NOTE: read env lazily — this module may be evaluated before dotenv/config
// runs (bundle import order), so top-level captures would be empty.
function baseUrl() {
  return process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1";
}
function apiKey() {
  return process.env.LLM_API_KEY || "";
}
function models() {
  return [
    process.env.LLM_MODEL_PRIMARY || "google/gemma-4-31b-it:free",
    process.env.LLM_MODEL_FALLBACK || "google/gemma-4-26b-a4b-it:free",
  ];
}

export function llmConfigured(): boolean {
  return apiKey().length > 10;
}

export function llmModelInUse(): string {
  return models()[0];
}

interface ChatOpts {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  /** Retry attempts across the configured models (default 6). */
  maxAttempts?: number;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Single chat completion with retry/backoff across the configured models. */
export async function llmChat(opts: ChatOpts): Promise<string> {
  const maxTokens = opts.maxTokens ?? 4000;
  const temperature = opts.temperature ?? 0.7;
  const maxAttempts = opts.maxAttempts ?? 6;
  let lastErr = "";

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const model = models()[attempt % models().length];
    try {
      const res = await fetch(`${baseUrl()}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey()}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://council-of-forecasters.local",
          "X-Title": "Council of Forecasters",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          messages: [
            { role: "system", content: opts.system },
            { role: "user", content: opts.user },
          ],
        }),
        signal: AbortSignal.timeout(90_000),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        lastErr = `${model} HTTP ${res.status}: ${body.slice(0, 300)}`;
        // 429 / 5xx → back off and retry (alternate model next attempt)
        await sleep(Math.min(30_000, 4000 * 2 ** attempt) + Math.random() * 1500);
        continue;
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) {
        lastErr = `${model} returned empty content`;
        await sleep(3000 * (attempt + 1));
        continue;
      }
      return text;
    } catch (err) {
      lastErr = `${model} ${err instanceof Error ? err.message : String(err)}`.slice(0, 300);
      await sleep(Math.min(30_000, 4000 * 2 ** attempt));
    }
  }
  throw new Error(`LLM unavailable after retries — ${lastErr}`);
}

/** Cached upstream-availability probe (5 min TTL) so a saturated free pool
 *  doesn't turn every simulation into minutes of pointless retries. */
let availCache: { ok: boolean; at: number } | null = null;

export async function llmAvailable(): Promise<boolean> {
  if (!llmConfigured()) return false;
  if (availCache && Date.now() - availCache.at < 5 * 60_000) return availCache.ok;
  try {
    await llmChat({
      system: "You are a health probe.",
      user: "Reply with exactly: ok",
      maxTokens: 8,
      temperature: 0,
      maxAttempts: 2,
    });
    availCache = { ok: true, at: Date.now() };
  } catch {
    availCache = { ok: false, at: Date.now() };
  }
  return availCache.ok;
}

/** Extract the first valid JSON value (object or array) from model output. */
export function extractJson<T>(raw: string): T {
  // Strip markdown fences if present
  const cleaned = raw.replace(/```(?:json)?/gi, "");
  const startArr = cleaned.indexOf("[");
  const startObj = cleaned.indexOf("{");
  let start = -1;
  if (startArr === -1) start = startObj;
  else if (startObj === -1) start = startArr;
  else start = Math.min(startArr, startObj);
  if (start === -1) throw new Error("no JSON in model output");

  const open = cleaned[start];
  const close = open === "[" ? "]" : "}";
  const end = cleaned.lastIndexOf(close);
  if (end <= start) throw new Error("unbalanced JSON in model output");
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}
