'use client';

import { useEffect, useState } from 'react';
import type { Edge } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { DecisionNode, RunState } from '@/lib/types';

type Props = {
  nodes: DecisionNode[];
  edges: Edge[];
  onRunChange: (run: RunState | null) => void;
};

export function RunPanel({ nodes, edges, onRunChange }: Props) {
  const [input, setInput] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const [run, setRun] = useState<RunState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // Poll the run state until it finishes
  useEffect(() => {
    if (!runId) return;
    let stopped = false;

    const tick = async () => {
      try {
        const res = await fetch(`/api/runs/${runId}`);
        if (!res.ok)
          throw new Error('Could not read the run (server restarted?)');
        const data: RunState = await res.json();
        if (stopped) return;
        setRun(data);
        onRunChange(data);
        if (data.status !== 'running') clearInterval(timer);
      } catch (e) {
        if (stopped) return;
        setError(e instanceof Error ? e.message : 'Polling failed');
        clearInterval(timer);
      }
    };

    const timer = setInterval(tick, 1000);
    tick();

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [runId, onRunChange]);

  async function startRun() {
    setError(null);

    // Check everything we can before spending an API call
    if (!input.trim()) {
      setError('Type an input to evaluate first.');
      return;
    }
    const emptyCount = nodes.filter(n => !n.data.prompt.trim()).length;
    if (emptyCount > 0) {
      setError(
        `${emptyCount} node(s) have an empty prompt. Fill them in or delete them.`,
      );
      return;
    }

    setRun(null);
    setRunId(null);
    onRunChange(null);
    setStarting(true);
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          nodes: nodes.map(n => ({
            id: n.id,
            data: { prompt: n.data.prompt },
          })),
          edges: edges.map(e => ({
            source: e.source,
            sourceHandle: e.sourceHandle,
            target: e.target,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not start the run');
      setRunId(data.runId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="w-80 space-y-3 rounded-lg border bg-card p-3 shadow-sm">
      <p className="text-sm font-semibold">Run workflow</p>

      <Textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Input to evaluate, e.g. My app crashes when I click save"
        className="min-h-20 text-sm"
      />

      <Button
        className="w-full"
        onClick={startRun}
        disabled={starting || run?.status === 'running'}
      >
        {run?.status === 'running' ? 'Running...' : 'Run workflow'}
      </Button>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {run && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Status: {run.status}
          </p>

          <ol className="space-y-1.5">
            {run.steps.map(s => (
              <li key={s.order} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 text-muted-foreground">{s.order}.</span>
                <span className="flex-1">{s.prompt}</span>
                <span
                  className={`rounded px-1.5 py-0.5 font-semibold ${
                    s.answer === 'YES'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {s.answer}
                </span>
              </li>
            ))}
          </ol>

          {run.status === 'failed' && (
            <p className="rounded bg-orange-50 p-2 text-xs text-orange-700">
              Failed: {run.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
