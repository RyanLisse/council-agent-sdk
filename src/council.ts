import { readFileSync } from 'node:fs';
import { MEMBER_IDS, type CouncilMemberId, type CouncilMemberOutput, type JudgeResult } from './schemas.ts';

/** Fixture member answers — no live multi-model spend. */
export function fanOutFixture(prompt: string): CouncilMemberOutput[] {
  const base = prompt.trim() || 'Geen prompt';
  return [
    { id: 'alpha', answer: `Alpha: ${base} — focus op feiten.` },
    { id: 'bravo', answer: `Bravo: ${base} — misschien, hangt van context af.` },
    { id: 'charlie', answer: `Charlie: ${base} — concrete stappen: 1) check bron 2) beslis.` },
    { id: 'delta', answer: `Delta: ${base} — eens met Charlie over broncheck.` },
  ];
}

function scoreAgainstJudge(member: CouncilMemberOutput, judgeAnswer: string, strict: boolean): number {
  const text = member.answer.toLowerCase();
  let score = 0.55;
  if (/feit|bron|concreet|stappen/.test(text)) score += 0.2;
  if (/misschien|hangt|vague|vaag/.test(text)) score -= strict ? 0.35 : 0.15;
  if (judgeAnswer.toLowerCase().split(/\s+/).some((w) => w.length > 4 && text.includes(w))) score += 0.1;
  return Math.max(0, Math.min(1, Number(score.toFixed(2))));
}

export function loadJudgeRule(instructions: string): { strict: boolean; dutch: boolean; maxWords: number } {
  const strict = /\bstrenger\b|\bbe strict\b|strict-vague/i.test(instructions);
  const dutch = /nederlands/i.test(instructions);
  const maxMatch = instructions.match(/max\s*(\d+)\s*woord/i);
  const maxWords = maxMatch ? Number(maxMatch[1]) : 80;
  return { strict, dutch, maxWords };
}

/** Structured reduce step — parity with Eve council judge schema. */
export function reduceCouncil(input: {
  prompt: string;
  members: CouncilMemberOutput[];
  instructions: string;
}): JudgeResult {
  const rule = loadJudgeRule(input.instructions);
  const preferred = input.members.find((m) => /concreet|stappen|bron/i.test(m.answer)) || input.members[0];
  let answer = rule.dutch
    ? `Samenvatting: ${preferred.answer.replace(/^[A-Za-z]+:\s*/, '')}`
    : `Summary: ${preferred.answer.replace(/^[A-Za-z]+:\s*/, '')}`;
  const words = answer.split(/\s+/);
  if (words.length > rule.maxWords) {
    answer = words.slice(0, rule.maxWords).join(' ') + '…';
  }
  const agreement = {} as Record<CouncilMemberId, number>;
  for (const id of MEMBER_IDS) {
    const member = input.members.find((m) => m.id === id)!;
    agreement[id] = scoreAgainstJudge(member, answer, rule.strict);
  }
  return {
    answer,
    agreement,
    notes: rule.strict ? 'judge-rule:strict-vague' : 'judge-rule:default',
  };
}

export function runCouncilFixture(prompt: string, instructionsPath: string): {
  members: CouncilMemberOutput[];
  judge: JudgeResult;
} {
  const instructions = readFileSync(instructionsPath, 'utf8');
  const members = fanOutFixture(prompt);
  const judge = reduceCouncil({ prompt, members, instructions });
  return { members, judge };
}
