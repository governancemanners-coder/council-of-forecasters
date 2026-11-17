import { useSyncExternalStore } from 'react';

export type RunStepKey = 'seed' | 'council' | 'simulation' | 'report';

/**
 * Tiny external store so the Simulator page can publish its live step
 * to the Navbar's step-indicator sub-bar without prop drilling.
 */
let currentStep: RunStepKey = 'seed';
let stepsDone = new Set<RunStepKey>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setRunStep(step: RunStepKey, done?: RunStepKey[]) {
  currentStep = step;
  if (done) stepsDone = new Set(done);
  emit();
}

export function markStepDone(step: RunStepKey) {
  stepsDone = new Set([...stepsDone, step]);
  emit();
}

export function resetRunSteps() {
  currentStep = 'seed';
  stepsDone = new Set();
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useRunSteps(): { current: RunStepKey; done: ReadonlySet<RunStepKey> } {
  useSyncExternalStore(subscribe, () => currentStep);
  useSyncExternalStore(subscribe, () => stepsDone);
  return { current: currentStep, done: stepsDone };
}
