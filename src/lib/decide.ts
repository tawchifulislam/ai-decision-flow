import { llm } from './llm';
import type { Answer } from './types';

const SYSTEM_PROMPT =
  'You are a decision step in a workflow. Read the input and the question. ' +
  'Reply with exactly one word: YES or NO. No punctuation and no explanation.';

export async function decide(prompt: string, input: string): Promise<Answer> {
  if (!prompt.trim()) {
    throw new Error('This node has an empty prompt');
  }

  const res = await llm.chat.completions.create({
    model: process.env.GEMINI_MODEL ?? 'gemini-3.6-flash',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Input:\n${input}\n\nQuestion: ${prompt}` },
    ],
  });

  const text = res.choices[0]?.message?.content ?? '';
  // "YES." or "**yes**" are fine. "YES, because..." is not.
  const cleaned = text
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '');

  if (cleaned === 'YES' || cleaned === 'NO') return cleaned;

  throw new Error(
    `Model did not return YES or NO. Got: "${text.slice(0, 60)}"`,
  );
}
