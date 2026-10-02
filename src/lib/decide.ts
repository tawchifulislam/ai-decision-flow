import OpenAI from 'openai';
import { NonRetriableError } from 'inngest';
import { llm } from './llm';
import type { Answer } from './types';

const SYSTEM_PROMPT =
  'You are a decision step in a workflow. Read the input and the question. ' +
  'Reply with exactly one word: YES or NO. No punctuation and no explanation.';

export async function decide(prompt: string, input: string): Promise<Answer> {
  if (!prompt.trim()) {
    throw new NonRetriableError('This node has an empty prompt');
  }

  let text = '';
  try {
    const res = await llm.chat.completions.create({
      model: process.env.GEMINI_MODEL ?? 'gemini-3.6-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Input:\n${input}\n\nQuestion: ${prompt}` },
      ],
    });
    text = res.choices[0]?.message?.content ?? '';
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      const status = err.status;
      if (status === 400 || status === 401 || status === 403) {
        throw new NonRetriableError(
          `The request was rejected (${status}). Check GEMINI_API_KEY and GEMINI_MODEL in .env.local. ${err.message.slice(0, 120)}`,
        );
      }
      if (status === 404) {
        throw new NonRetriableError(
          'Model not found. Check GEMINI_MODEL in .env.local',
        );
      }
      if (status === 429) {
        throw new Error(
          'Rate limit or quota reached. Wait a bit and run again',
        );
      }
    }
    throw err;
  }

  const cleaned = text
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  if (cleaned === 'YES' || cleaned === 'NO') return cleaned;

  throw new Error(
    `Model did not return YES or NO. Got: "${text.slice(0, 60)}"`,
  );
}
