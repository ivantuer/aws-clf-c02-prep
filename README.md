# AWS Cloud Practitioner Quiz Prep

Local-first study app for the AWS Certified Cloud Practitioner (CLF-C02) exam, built on the
1,142 community practice questions in
[kananinirav/AWS-Certified-Cloud-Practitioner-Notes](https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes),
deduplicated to 963 unique questions.

Design decisions and their rationale live in [DESIGN.md](./DESIGN.md).

## Running it

```bash
yarn install
yarn dev
```

Progress is stored in this browser's localStorage. Nothing is sent anywhere.

## What it does

- **Mock exam** — 50 questions in authored order, configurable timer (default 90 min), auto-submit
  at zero with unanswered scored as incorrect, all-or-nothing multi-select. Matches the real exam's
  50 scored questions.
- **Recap** — after a mock, misses are grouped by official task statement (not question order) so
  three misses on 3.5 read as one lesson. Each shows your answer, the correct answer, why yours was
  wrong, and the underlying concept, with a one-click drill of exactly those questions.
- **Drill** — untimed, immediate feedback on every answer, shuffled questions and options.
  Filters compose: by exam, by retry registry, by domain, by task statement, unseen only.
- **Retry registry** — a miss in either mode enters it, and only **2 correct drill answers in a row**
  clear it. Mocks detect weakness; drills retire it. A lucky guess inside a timed mock can't
  silently graduate a question you haven't actually learned.
- **Per-exam reset** — clears that exam's score history and the progress of questions unique to it.
  Questions that also appear in other exams keep their history, since the bank is deduplicated.
- **Trackers** — per-exam table (seen/unseen, last result, attempts, task statement, retry state)
  and a global searchable view across all 963 questions.
- **Answer-key overrides** — community keys are sometimes wrong. Flagged questions show a banner,
  and you can set your own key; overrides are stored separately from the bundled bank so
  regenerating never clobbers them.

## Data pipeline

```bash
yarn ingest   # fetch + parse the 23 markdown exams -> data/questions.base.json
yarn merge    # base + data/explanations/*.json -> src/data/bank.json + data/manifest.json
yarn test     # asserts the retry-registry mastery rules
```

`ingest` refuses to emit a bank if any question has fewer than two options or an answer letter that
isn't among its options. `merge` refuses to write if any annotation references an unknown task
statement, a distractor letter that isn't an option, a distractor that's actually a correct answer,
or is missing a rationale for any wrong option.

## Explanation status

Explanations are written by hand, exam by exam. `data/manifest.json` is the source of truth for
what's done.

**Currently: exam 1 complete (50/963 questions).**

### Resuming

```bash
node scripts/dump-exam.mjs <exam> [from] [to]   # e.g. node scripts/dump-exam.mjs 2 1 25
```

Write annotations into `data/explanations/exam-NN.json` keyed by question id:

```json
{
  "<question-id>": {
    "taskStatement": "3.5",
    "secondaryTaskStatement": "3.2",
    "explanation": {
      "concept": "Short name for the idea being tested",
      "correct": "Why the correct answer is correct.",
      "distractors": { "A": "Why A is wrong.", "B": "Why B is wrong." }
    },
    "needsReview": "optional — why the stored key looks wrong",
    "outdated": "optional — why this may be out of scope for CLF-C02"
  }
}
```

Every wrong option needs a distractor rationale. Run `yarn merge` — it validates and reports
progress. Questions without explanations still work in the app; they show "explanation not written
yet" alongside the correct answer.

Duplicated questions are annotated once and the explanation appears in every exam containing them,
so the remaining work is 913 questions, not 1,092 occurrences.
