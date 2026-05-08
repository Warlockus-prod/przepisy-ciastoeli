import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI | null {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  client = new OpenAI({ apiKey });
  return client;
}

export const MODELS = {
  primary: process.env.OPENAI_MODEL_PRIMARY ?? 'gpt-4o',
  light: process.env.OPENAI_MODEL_LIGHT ?? 'gpt-4o-mini',
  vision: process.env.OPENAI_MODEL_VISION ?? 'gpt-4o',
  image: process.env.OPENAI_MODEL_IMAGE ?? 'dall-e-3',
};

export function isOpenAIAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
