import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { runCouncilFixture } from './council.ts';
import { isMainModule } from './is-main.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const instructionsPath = join(root, 'instructions.md');

export const loadInstructions = (path = instructionsPath) => readFileSync(path, 'utf8');

/** Fixture council — no live multi-model spend. */
export function runCouncil(prompt: string) {
  return runCouncilFixture(prompt, instructionsPath);
}

/** Optional live SDK path — single model asking to apply judge instructions (env key required). */
export async function runCouncilAgentLive(prompt: string) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Set ANTHROPIC_API_KEY in the environment. No secrets in git.');
  }
  const instructions = loadInstructions();
  const messages: unknown[] = [];
  for await (const message of query({
    prompt: `${prompt}\n\nApply the council judge instructions and return JSON with answer + agreement scores.`,
    options: {
      systemPrompt: instructions,
      permissionMode: 'bypassPermissions',
    },
  })) {
    messages.push(message);
  }
  return messages;
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const prompt = process.argv.slice(2).join(' ') || 'Moeten we een paraplu meenemen in Amsterdam?';
  if (process.env.ANTHROPIC_API_KEY) {
    const messages = await runCouncilAgentLive(prompt);
    console.log(JSON.stringify(messages, null, 2));
  } else {
    const result = runCouncil(prompt);
    console.log(JSON.stringify(result, null, 2));
    console.log('\n(Tip) Set ANTHROPIC_API_KEY to exercise the live Claude Agent SDK path.');
  }
}
