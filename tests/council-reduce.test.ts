import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fanOutFixture, loadJudgeRule, reduceCouncil } from '../src/council.ts';
import { loadInstructions, runCouncil } from '../src/agent.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const instructionsFile = join(root, 'instructions.md');

test('fan-out returns four fixture members without API spend', () => {
  const members = fanOutFixture('Test prompt');
  assert.equal(members.length, 4);
  assert.deepEqual(members.map((m) => m.id), ['alpha', 'bravo', 'charlie', 'delta']);
});

test('structured reduce produces answer + agreement scores', () => {
  const instructions = loadInstructions();
  const members = fanOutFixture('Paraplu in Amsterdam?');
  const judge = reduceCouncil({ prompt: 'Paraplu?', members, instructions });
  assert.ok(judge.answer.length > 0);
  assert.equal(Object.keys(judge.agreement).length, 4);
  for (const score of Object.values(judge.agreement)) {
    assert.ok(score >= 0 && score <= 1);
  }
});

test('instructions.md is the editable judge quest hook', () => {
  const text = loadInstructions();
  assert.match(text, /rechter|judge/i);
  assert.match(text, /strenger|agreement|score/i);
  assert.equal(text, readFileSync(instructionsFile, 'utf8'));
});

test('judge instruction delta changes reduce notes (mini-quest parity)', () => {
  const strictRule = 'Wees strenger bij vage claims.';
  const mildRule = 'Wees mild; vague wording is fine.';
  const a = loadJudgeRule(strictRule);
  const b = loadJudgeRule(mildRule);
  assert.equal(a.strict, true);
  assert.equal(b.strict, false);
  const members = fanOutFixture('Vague topic');
  const strictJudge = reduceCouncil({ prompt: 'x', members, instructions: strictRule });
  const mildJudge = reduceCouncil({ prompt: 'x', members, instructions: mildRule });
  assert.equal(strictJudge.notes, 'judge-rule:strict-vague');
  assert.equal(mildJudge.notes, 'judge-rule:default');
  assert.ok(strictJudge.agreement.bravo <= mildJudge.agreement.bravo);
});

test('runCouncil smoke', () => {
  const result = runCouncil('Smoke test');
  assert.equal(result.members.length, 4);
  assert.ok(result.judge.answer);
});
