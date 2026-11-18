import { exposureReport, exposureProblems } from '../exposure.mjs';

export function allCoreWordsMeetExposureThresholdAndDocIsCurrent({ logic, assert }) {
  const rep = exposureReport(logic);
  const probs = exposureProblems(rep);
  assert.deepEqual(probs, [], probs.join('\n'));
}
