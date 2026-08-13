# AWS Cloud Practitioner Quiz Prep — Design

Agreed design from the grilling session. Nothing here is built yet.

## Source data (verified, not assumed)

Parsed all 23 files from `kananinirav/AWS-Certified-Cloud-Practitioner-Notes/practice-exam`:

| Fact | Value |
| --- | --- |
| Total questions | 1,142 (50 per exam; exam 12 has 42) |
| Unique question stems | 972 (168 duplicate groups, 170 redundant copies) |
| Multi-select | 266 |
| Parse invariant violations | 0 (every question has >=2 options; every answer letter exists in its options) |
| Existing explanations | 156 prose / 298 bare URL only / 688 nothing |

Two markdown dialects exist and both parse cleanly:
- `Correct answer: D` and `Correct answer: B, E` (earlier exams)
- `Correct Answer: CE` with optional `Explanation:` block (later exams)

## Official exam facts (from the CLF-C02 exam guide)

- 50 scored questions + 15 unscored; pass mark 700/1000 scaled; compensatory scoring.
- Duration is not published on the guide page — timer is configurable, defaulting to 90 min.
- Domains: Cloud Concepts 24%, Security and Compliance 30%, Cloud Technology and Services 34%, Billing/Pricing/Support 12%.
- 20 official task statements beneath those domains (1.1-1.4, 2.1-2.4, 3.1-3.8, 4.1-4.3).

## Decisions

| # | Decision | Choice |
| --- | --- | --- |
| 1 | Location | New repo at `~/Documents/geniusee/aws-quiz` |
| 2 | Shape | Local-first web app, no backend, localStorage for progress |
| 3 | Ingest | Build-time parse -> JSON committed to the repo |
| 4 | Duplicates | Canonical store keyed by content hash; per-exam view still shows all 50 and marks repeats |
| 5 | Generation | Batch up front, rolled out exam by exam |
| 6 | Existing explanations | Augment — always write our own; preserve any AWS reference URL |
| 7 | Bad answer keys | Flag `needs-review` + UI banner; never silently override |
| 8 | Categories | Domain **and** official task statement on every question |
| 9 | Modes | Both timed mock and untimed drill |
| 10 | Tracker | Per-exam table + global searchable view across all questions |
| 11 | Mastery | 2 consecutive correct answers to clear from the incorrect registry |
| 12 | Mock settings | 90 min configurable; auto-submit at zero; unanswered = incorrect; raw % + per-domain breakdown, 70% marked "approximate" |
| 13 | Multi-select | All-or-nothing, exact selection count enforced in UI |
| 14 | Drill filters | Composable: by exam, by registry, by domain/task, unseen only, random mix |
| 15 | Shuffle | Configurable; default both shuffled in drill, neither in mock |
| 16 | Stack | Vite + React + TypeScript + Tailwind |
| 17 | Rollout | Incremental, exams 1 -> 23 |
| 18 | Deployment | Local only; structured to allow static deploy later |
| 19 | Explanation shape | Why correct + why each distractor is wrong + a named underlying concept |
| 20 | Drill feedback | Immediately on submit, on every question (right or wrong) |
| 21 | Key overrides | User can override a key in the UI; stored separately from the bundled bank |
| 22 | Outdated questions | Tagged and shown with an out-of-scope note, never hidden |
| 23 | Export / reset | Export all user-generated state; reset per-exam and reset-all, both confirmed |
| 24 | Home screen | Dashboard: overall progress, per-domain and per-task accuracy (weakest first), registry size + "drill these now", 23-exam list with completion and last score |

## Post-exam recap (mock mode)

After submitting a timed mock, the recap leads with what went wrong and how to fix it:

1. **Score header** — raw %, per-domain breakdown against the official weightings, 70% line marked approximate.
2. **Weakest task statements first** — misses grouped by task statement, not listed in question order, so three misses on 3.5 read as one lesson rather than three unrelated facts.
3. **Per missed question** — your answer, the correct answer, why yours was wrong, why the correct one is right, and the named concept.
4. **What to study next** — the weak task statements linked to their exam-guide section, plus a one-click "drill these" that loads exactly this exam's misses.
5. All misses land in the incorrect registry, needing 2 consecutive correct to clear.

## Data model sketch

**Bundled (in repo, generated):** `questions.json` — canonical question per hash, with stem, options, answer key, domain, task statement, explanation (correct + per-distractor + concept), reference URL, `needsReview` and `outdated` flags, and the list of (exam, number) positions it appears at.

**localStorage (user state, exportable):** attempt history per question, incorrect registry with consecutive-correct counters, answer-key overrides, per-exam completion and score history, settings.

## Open item for confirmation

Recap grouping is designed around task statements rather than question order (point 2 above). Say if you would rather see a plain question-by-question list.
