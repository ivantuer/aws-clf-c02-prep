import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TASK_IDS = new Set([
  '1.1', '1.2', '1.3', '1.4',
  '2.1', '2.2', '2.3', '2.4',
  '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8',
  '4.1', '4.2', '4.3',
]);

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function validateAnnotation(id, annotation, question) {
  const problems = [];
  if (!TASK_IDS.has(annotation.taskStatement)) {
    problems.push(`unknown taskStatement "${annotation.taskStatement}"`);
  }
  if (annotation.secondaryTaskStatement && !TASK_IDS.has(annotation.secondaryTaskStatement)) {
    problems.push(`unknown secondaryTaskStatement "${annotation.secondaryTaskStatement}"`);
  }
  const explanation = annotation.explanation;
  if (!explanation?.concept) problems.push('missing explanation.concept');
  if (!explanation?.correct) problems.push('missing explanation.correct');

  const wrongLetters = Object.keys(question.options).filter((letter) => !question.answer.includes(letter));
  for (const letter of wrongLetters) {
    if (!explanation?.distractors?.[letter]) problems.push(`missing distractor rationale for ${letter}`);
  }
  for (const letter of Object.keys(explanation?.distractors ?? {})) {
    if (!(letter in question.options)) problems.push(`distractor ${letter} is not an option`);
    if (question.answer.includes(letter)) problems.push(`distractor ${letter} is actually a correct answer`);
  }
  return problems.map((problem) => `${id}: ${problem}`);
}

async function main() {
  const base = await readJson(resolve(ROOT, 'data/questions.base.json'));
  const byId = new Map(base.questions.map((question) => [question.id, question]));

  const explanationsDir = resolve(ROOT, 'data/explanations');
  const checkOnly = process.argv.includes('--check');
  const only = checkOnly ? process.argv.slice(2).filter((arg) => arg.endsWith('.json')) : [];
  const files = existsSync(explanationsDir)
    ? (await readdir(explanationsDir))
        .filter((file) => file.endsWith('.json'))
        .filter((file) => only.length === 0 || only.includes(file))
        .sort()
    : [];

  const problems = [];
  let annotated = 0;

  for (const file of files) {
    const entries = await readJson(resolve(explanationsDir, file));
    for (const [id, annotation] of Object.entries(entries)) {
      const question = byId.get(id);
      if (!question) {
        problems.push(`${file}: id ${id} is not in the base bank`);
        continue;
      }
      problems.push(...validateAnnotation(id, annotation, question));
      Object.assign(question, annotation);
      annotated += 1;
    }
  }

  if (problems.length) {
    for (const problem of problems.slice(0, 30)) console.error(problem);
    throw new Error(`${problems.length} annotation problems — refusing to write the bank`);
  }

  const questions = [...byId.values()];

  if (checkOnly) {
    console.log(`validation passed — ${annotated}/${questions.length} annotated (nothing written)`);
    return;
  }

  await mkdir(resolve(ROOT, 'src/data'), { recursive: true });
  await writeFile(
    resolve(ROOT, 'src/data/bank.json'),
    `${JSON.stringify({ ...base, questions }, null, 2)}\n`,
  );

  const byExam = {};
  for (const question of questions) {
    for (const { exam } of question.occurrences) {
      byExam[exam] ??= { total: 0, annotated: 0 };
      byExam[exam].total += 1;
      if (question.explanation) byExam[exam].annotated += 1;
    }
  }

  const manifest = {
    updatedAt: new Date().toISOString(),
    uniqueQuestions: questions.length,
    annotated,
    remaining: questions.length - annotated,
    needsReview: questions.filter((question) => question.needsReview).map((question) => question.id),
    outdated: questions.filter((question) => question.outdated).map((question) => question.id),
    byExam,
  };
  await writeFile(resolve(ROOT, 'data/manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`annotated ${annotated}/${questions.length} (${manifest.remaining} remaining)`);
  console.log(`needs-review: ${manifest.needsReview.length}  outdated: ${manifest.outdated.length}`);
  console.log('wrote src/data/bank.json and data/manifest.json');
}

await main();
