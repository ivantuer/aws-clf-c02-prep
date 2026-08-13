import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const todoOnly = args.includes('--todo');
const positional = args.filter((arg) => !arg.startsWith('--'));
const exam = Number(positional[0]);
const from = Number(positional[1] ?? 1);
const to = Number(positional[2] ?? 999);

if (!Number.isInteger(exam)) {
  console.error('usage: node scripts/dump-exam.mjs <exam> [from] [to] [--todo]');
  process.exit(1);
}

const base = JSON.parse(await readFile(resolve(ROOT, 'data/questions.base.json'), 'utf8'));

const explanationsDir = resolve(ROOT, 'data/explanations');
const files = await readdir(explanationsDir).catch(() => []);
const annotated = new Set();
for (const file of files.filter((name) => name.endsWith('.json'))) {
  const parsed = JSON.parse(await readFile(resolve(explanationsDir, file), 'utf8'));
  for (const id of Object.keys(parsed)) annotated.add(id);
}

const ownerExam = (question) =>
  Math.min(...question.occurrences.map((occurrence) => occurrence.exam));

const questions = base.questions
  .filter((question) => question.occurrences.some((entry) => entry.exam === exam))
  .map((question) => ({
    ...question,
    position: question.occurrences.find((entry) => entry.exam === exam).number,
  }))
  .filter((question) => question.position >= from && question.position <= to)
  .filter((question) => !todoOnly || (ownerExam(question) === exam && !annotated.has(question.id)))
  .sort((a, b) => a.position - b.position);

for (const question of questions) {
  const options = Object.entries(question.options)
    .map(([letter, text]) => `${letter}. ${text}`)
    .join(' | ');
  console.log(`${question.position} [${question.id}] ${question.stem}`);
  console.log(`   ${options}`);
  console.log(`   KEY: ${question.answer.join(',')}${question.multiSelect ? ' (multi-select)' : ''}`);
  if (question.references.length) console.log(`   REF: ${question.references.join(' ')}`);
}

const label = todoOnly ? 'questions to annotate in this file' : 'questions';
console.log(`\n${questions.length} ${label}. annotated across all files: ${annotated.size}`);
