import type { RunState, StepResult } from './types';

// Kept on globalThis so every API route in the dev server shares one map
const g = globalThis as unknown as { __flowRuns?: Map<string, RunState> };
const runs = (g.__flowRuns ??= new Map<string, RunState>());

export function createRun(runId: string) {
  runs.set(runId, { runId, status: 'running', steps: [] });
}

export function getRun(runId: string) {
  return runs.get(runId);
}

export function addStep(runId: string, step: StepResult) {
  const run = runs.get(runId);
  if (!run) return;
  if (run.steps.some(s => s.order === step.order)) return; // retry safe
  run.steps.push(step);
}

export function finishRun(runId: string) {
  const run = runs.get(runId);
  if (run) run.status = 'completed';
}

export function failRun(runId: string, message: string) {
  const run = runs.get(runId);
  if (run) {
    run.status = 'failed';
    run.error = message;
  }
}
