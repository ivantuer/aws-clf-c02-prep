import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE =
  'https://raw.githubusercontent.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes/master/practice-exam/practice-exam-';
const EXAM_COUNT = 23;
const NEAR_DUPLICATE_THRESHOLD = 0.9;

const STOP_WORDS = new Set(
  'the a an of to in for is are and or with that which what will be on by as it you your from'.split(' '),
);

const QUESTION_START = /^(\d+)\.\s+(.*)$/;
const OPTION = /^\s*-\s+([A-Z])\.\s+(.*)$/;
const ANSWER = /correct\s+answer\s*:?\s*(.*)/i;

function normalise(text) {
  return text
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
}

function splitInlineOptions(text) {
  const parts = text.split(/\s+-\s+(?=[A-Z]\.\s)/);
  const stem = parts.shift();
  const options = {};
  for (const part of parts) {
    const match = /^([A-Z])\.\s+(.*)$/.exec(part.trim());
    if (match) options[match[1]] = match[2].trim().replace(/\.$/, '');
  }
  return { stem, options };
}

function hashStem(stem) {
  return createHash('md5').update(normalise(stem)).digest('hex').slice(0, 12);
}

function parseExam(text, examNumber) {
  const lines = text.split('\n');
  const starts = lines.reduce((acc, line, index) => {
    if (QUESTION_START.test(line)) acc.push(index);
    return acc;
  }, []);

  return starts.map((start, index) => {
    const block = lines.slice(start, starts[index + 1] ?? lines.length);
    const [, number, firstLine] = QUESTION_START.exec(block[0]);

    const inline = splitInlineOptions(firstLine);
    const options = { ...inline.options };
    let stem = inline.stem;
    let answer = null;
    let sourceExplanation = [];
    let insideDetails = false;
    let afterAnswer = false;

    for (const line of block.slice(1)) {
      const option = OPTION.exec(line);

      if (line.includes('<details')) {
        insideDetails = true;
        continue;
      }
      if (line.includes('</details>')) {
        insideDetails = false;
        afterAnswer = false;
        continue;
      }

      if (insideDetails) {
        const match = ANSWER.exec(line);
        if (match && answer === null) {
          answer = (match[1].replace(/\./g, ' ').match(/[A-Z]/g) ?? []).sort();
          afterAnswer = true;
          continue;
        }
        if (afterAnswer && line.trim()) sourceExplanation.push(line.trim());
        continue;
      }

      if (option) {
        options[option[1]] = option[2].trim().replace(/\.$/, '');
        continue;
      }
      if (line.trim() && !line.trim().startsWith('-')) stem += ` ${line.trim()}`;
    }

    const explanationText = sourceExplanation.join('\n').trim();
    const references = [...explanationText.matchAll(/<(https?:\/\/[^>]+)>|(?<!<)(https?:\/\/\S+)/g)]
      .map((match) => (match[1] ?? match[2]).replace(/[.,)]+$/, ''))
      .filter(Boolean);

    return {
      exam: examNumber,
      number: Number(number),
      stem: stem.replace(/<br\s*\/?>/g, ' ').replace(/\s+/g, ' ').trim(),
      options,
      answer,
      multiSelect: answer.length > 1,
      sourceExplanation: explanationText,
      references: [...new Set(references)],
    };
  });
}

function assertInvariants(questions) {
  const violations = [];
  for (const question of questions) {
    const letters = Object.keys(question.options);
    if (letters.length < 2) violations.push([question, 'fewer than 2 options']);
    if (!question.answer?.length) violations.push([question, 'no answer key']);
    for (const letter of question.answer ?? []) {
      if (!letters.includes(letter)) violations.push([question, `answer ${letter} not among options`]);
    }
  }
  return violations;
}

function tokenSet(stem) {
  return new Set(normalise(stem).split(' ').filter((word) => !STOP_WORDS.has(word)));
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / (a.size + b.size - shared);
}

function collapseNearDuplicates(canonicals) {
  const tokens = canonicals.map((entry) => tokenSet(entry.stem));
  const index = new Map();

  tokens.forEach((set, position) => {
    for (const token of set) {
      if (!index.has(token)) index.set(token, []);
      index.get(token).push(position);
    }
  });

  const pairs = new Set();
  for (const positions of index.values()) {
    if (positions.length > 60) continue;
    for (let a = 0; a < positions.length; a += 1) {
      for (let b = a + 1; b < positions.length; b += 1) {
        pairs.add(`${positions[a]}:${positions[b]}`);
      }
    }
  }

  const merges = [];
  for (const pair of pairs) {
    const [a, b] = pair.split(':').map(Number);
    const score = jaccard(tokens[a], tokens[b]);
    if (score >= NEAR_DUPLICATE_THRESHOLD) merges.push({ score, a, b });
  }

  merges.sort((left, right) => right.score - left.score);
  const absorbed = new Map();
  for (const { a, b } of merges) {
    if (absorbed.has(a) || absorbed.has(b)) continue;
    absorbed.set(b, a);
  }
  return absorbed;
}

async function main() {
  const parsed = [];
  for (let exam = 1; exam <= EXAM_COUNT; exam += 1) {
    const response = await fetch(`${BASE}${exam}.md`);
    if (!response.ok) throw new Error(`exam ${exam}: HTTP ${response.status}`);
    parsed.push(...parseExam(await response.text(), exam));
  }

  const violations = assertInvariants(parsed);
  if (violations.length) {
    for (const [question, reason] of violations.slice(0, 20)) {
      console.error(`exam ${question.exam} q${question.number}: ${reason}`);
    }
    throw new Error(`${violations.length} invariant violations — refusing to emit a lossy bank`);
  }

  const byHash = new Map();
  for (const question of parsed) {
    const id = hashStem(question.stem);
    if (!byHash.has(id)) byHash.set(id, { id, ...question, occurrences: [] });
    const canonical = byHash.get(id);
    canonical.occurrences.push({ exam: question.exam, number: question.number });
    canonical.references = [...new Set([...canonical.references, ...question.references])];
    if (question.sourceExplanation.length > canonical.sourceExplanation.length) {
      canonical.sourceExplanation = question.sourceExplanation;
    }
  }

  const canonicals = [...byHash.values()];
  const absorbed = collapseNearDuplicates(canonicals);
  const survivors = [];

  canonicals.forEach((entry, position) => {
    const target = absorbed.get(position);
    if (target === undefined) {
      survivors.push(entry);
      return;
    }
    const keeper = canonicals[target];
    keeper.occurrences.push(...entry.occurrences);
    keeper.references = [...new Set([...keeper.references, ...entry.references])];
    if (entry.sourceExplanation.length > keeper.sourceExplanation.length) {
      keeper.sourceExplanation = entry.sourceExplanation;
    }
  });

  for (const entry of survivors) {
    entry.occurrences.sort((a, b) => a.exam - b.exam || a.number - b.number);
    delete entry.exam;
    delete entry.number;
  }

  const bank = {
    generatedAt: new Date().toISOString(),
    source: 'kananinirav/AWS-Certified-Cloud-Practitioner-Notes',
    examCount: EXAM_COUNT,
    totalOccurrences: parsed.length,
    questions: survivors,
  };

  await mkdir(resolve(ROOT, 'data'), { recursive: true });
  await writeFile(resolve(ROOT, 'data/questions.base.json'), `${JSON.stringify(bank, null, 2)}\n`);

  const multiSelect = survivors.filter((entry) => entry.multiSelect).length;
  console.log(`occurrences        : ${parsed.length}`);
  console.log(`unique questions   : ${survivors.length}`);
  console.log(`  exact merges     : ${parsed.length - canonicals.length}`);
  console.log(`  near merges      : ${absorbed.size}`);
  console.log(`multi-select       : ${multiSelect}`);
  console.log(`with source prose  : ${survivors.filter((e) => e.sourceExplanation).length}`);
  console.log('wrote data/questions.base.json');
}

await main();
