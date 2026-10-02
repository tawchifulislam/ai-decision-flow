import { NonRetriableError } from 'inngest';
import { inngest } from './client';
import { decide } from '@/lib/decide';
import {
  findStartNode,
  nextNodeId,
  type GraphEdge,
  type GraphNode,
} from '@/lib/graph';
import { addStep, failRun, finishRun } from '@/lib/run-store';
import type { StepResult } from '@/lib/types';

export const helloWorld = inngest.createFunction(
  { id: 'hello-world', triggers: [{ event: 'test/hello' }] },
  async ({ step }) => {
    const msg = await step.run('say-hello', async () => 'hello from inngest');
    return { msg };
  },
);

type RunEventData = {
  runId: string;
  input: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

const MAX_STEPS = 25; // protects against loops in the graph

export const runWorkflow = inngest.createFunction(
  { id: 'run-workflow', retries: 2, triggers: [{ event: 'workflow/run' }] },
  async ({ event, step }) => {
    const { runId, input, nodes, edges } = event.data as RunEventData;

    try {
      let current = findStartNode(nodes, edges);
      if (!current) throw new Error('The graph has no nodes');

      const trace: StepResult[] = [];

      for (let i = 1; i <= MAX_STEPS; i++) {
        const node: GraphNode = current;

        // Each node is one Inngest step
        const answer = await step.run(`node-${i}-${node.id}`, async () => {
          const result = await decide(node.data.prompt, input);
          const entry: StepResult = {
            order: i,
            nodeId: node.id,
            prompt: node.data.prompt,
            answer: result,
          };
          addStep(runId, entry);
          return result;
        });

        trace.push({
          order: i,
          nodeId: node.id,
          prompt: node.data.prompt,
          answer,
        });

        const nextId = nextNodeId(edges, node.id, answer);
        const next = nextId ? nodes.find(n => n.id === nextId) : undefined;

        if (!next) {
          finishRun(runId);
          return { runId, finalAnswer: answer, trace };
        }
        current = next;
      }

      throw new Error(
        `Stopped after ${MAX_STEPS} steps. The graph may contain a loop.`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      failRun(runId, message);
      throw new NonRetriableError(message, {
        cause: err instanceof Error ? err : undefined,
      });
    }
  },
);
