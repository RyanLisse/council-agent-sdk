import { readFileSync } from 'node:fs';
import { instructionsPath, runCouncil } from './agent.ts';

const before = readFileSync(instructionsPath, 'utf8');
if (!/rechter|judge/i.test(before)) {
  console.error('Mini-quest incomplete: judge section missing in instructions.md');
  process.exit(1);
}

const prompt = 'Is remote-first altijd beter voor startups?';
const result = runCouncil(prompt);
console.log('judge notes:', result.judge.notes);
console.log('agreement:', result.judge.agreement);
console.log('answer:', result.judge.answer);
console.log('quest ok — edit only the judge rule in instructions.md and re-run.');
