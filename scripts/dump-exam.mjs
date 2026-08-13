import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const exam = Number(process.argv[2]);
const from = Number(process.argv[3] ?? 1);
const to = Number(process.argv[4] ?? 999);

const base = JSON.parse(await readFile(resolve(ROOT, 'data/questions.base.json'), 'utf8'));
const manifest = JSON.parse(
  await readFile(resolve(ROOT, 'data/manifest.json'), 'utf8').catch(() => '{}'),
);
const done = new Set();
for (const file of []) done.add(file);

const questions = base.questions
  .filter((question) => question.occurrences.some((entry) => entry.exam === exam))
  .map((question) => ({
    ...question,
    position: question.occurrences.find((entry) => entry.exam === exam).number,
  }))
  .filter((question) => question.position >= from && question.position <= to)
  .sort((a, b) => a.position - b.position);

for (const question of questions) {
  const options = Object.entries(question.options)
    .map(([letter, text]) => `${letter}. ${text}`)
    .join(' | ');
  console.log(`${question.position} [${question.id}] ${question.stem}`);
  console.log(`   ${options}`);
  console.log(`   KEY: ${question.answer.join(',')}`);
}
console.log(`\n${questions.length} questions. annotated so far: ${manifest.annotated ?? 0}`);
