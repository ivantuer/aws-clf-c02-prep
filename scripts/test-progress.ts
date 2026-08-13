import { recordAttempt, MASTERY_STREAK } from '../src/store/progress';
import type { ProgressState, Attempt } from '../src/data/types';

const base: ProgressState = {
  version: 1,
  questions: {},
  examResults: {},
  overrides: {},
  settings: { mockDurationMinutes: 90, shuffleDrillQuestions: true, shuffleDrillOptions: true },
};

const at = (correct: boolean, mode: 'mock' | 'drill'): Attempt => ({
  at: Date.now(),
  correct,
  selected: ['A'],
  mode,
});

const q = 'q1';
let ok = true;
const check = (label: string, cond: boolean) => {
  console.log(cond ? 'PASS' : 'FAIL', '-', label);
  if (!cond) ok = false;
};

console.log('MASTERY_STREAK =', MASTERY_STREAK);

let s = recordAttempt(base, q, at(false, 'mock'));
check('miss in mock enters registry', s.questions[q].inRegistry === true);

s = recordAttempt(s, q, at(true, 'mock'));
check('correct in mock does not advance streak', s.questions[q].streak === 0);
check('correct in mock keeps it in registry', s.questions[q].inRegistry === true);

s = recordAttempt(s, q, at(true, 'mock'));
check('two mock corrects still do not clear it', s.questions[q].inRegistry === true);

s = recordAttempt(s, q, at(true, 'drill'));
check('first drill correct -> streak 1', s.questions[q].streak === 1);
check('still in registry at streak 1', s.questions[q].inRegistry === true);

s = recordAttempt(s, q, at(true, 'drill'));
check('second drill correct -> streak 2', s.questions[q].streak === 2);
check('cleared from registry at streak 2', s.questions[q].inRegistry === false);

s = recordAttempt(s, q, at(false, 'drill'));
check('later miss resets streak', s.questions[q].streak === 0);
check('later miss re-enters registry', s.questions[q].inRegistry === true);

let d = recordAttempt(base, 'q2', at(false, 'drill'));
d = recordAttempt(d, 'q2', at(true, 'drill'));
d = recordAttempt(d, 'q2', at(false, 'drill'));
d = recordAttempt(d, 'q2', at(true, 'drill'));
check('non-consecutive drill corrects do not clear', d.questions['q2'].inRegistry === true);

check('attempt history keeps every attempt incl. mocks', s.questions[q].attempts.length === 6);

console.log(ok ? '\nALL PASS' : '\nFAILURES');
process.exit(ok ? 0 : 1);
