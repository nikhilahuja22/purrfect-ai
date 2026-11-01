const DEEPSEEK_CHAT_URL = 'https://api.deepseek.com/chat/completions';
const TIMEOUT_MS = 120_000;

type DeepSeekRequest = {
  apiKey: string;
  model: string;
  system: string;
  user: string;
};

// Sends one chat request in JSON mode and returns the parsed object.
// The key is only sent in the Authorization header. It is never included in error messages.
export async function askDeepSeekForJson({
  apiKey,
  model,
  system,
  user
}: DeepSeekRequest): Promise<unknown> {
  const res = await fetch(DEEPSEEK_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!res.ok) {
    throw new Error(`DeepSeek request failed with status ${res.status}. Check the key and model.`);
  }

  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek returned an empty response.');

  try {
    return JSON.parse(content) as unknown;
  } catch {
    throw new Error('DeepSeek did not return valid JSON.');
  }
}
