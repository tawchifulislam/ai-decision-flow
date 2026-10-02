import { findStartNode, nextNodeId } from './graph';
import type { NodeVisual, RunState } from './types';

type VNode = { id: string; data: { prompt: string } };
type VEdge = {
  id: string;
  source: string;
  sourceHandle?: string | null;
  target: string;
};

export type EdgeVisual = 'active' | 'taken' | 'idle';

export function computeRunVisuals(
  nodes: VNode[],
  edges: VEdge[],
  run: RunState | null,
) {
  const nodeVisuals: Record<string, NodeVisual> = {};
  const edgeVisuals: Record<string, EdgeVisual> = {};
  if (!run) return { nodeVisuals, edgeVisuals };

  const steps = [...run.steps].sort((a, b) => a.order - b.order);

  // Nodes that already answered
  for (const s of steps) {
    nodeVisuals[s.nodeId] = {
      status: s.answer === 'YES' ? 'yes' : 'no',
      order: s.order,
    };
  }

  // The node that is being evaluated now (or the one that failed)
  if (run.status !== 'completed') {
    let candidateId: string | null = null;
    if (steps.length === 0) {
      candidateId = findStartNode(nodes, edges)?.id ?? null;
    } else {
      const last = steps[steps.length - 1];
      candidateId = nextNodeId(edges, last.nodeId, last.answer);
    }
    if (candidateId) {
      nodeVisuals[candidateId] = {
        status: run.status === 'running' ? 'running' : 'failed',
      };
    }
  }

  // Edges that were followed
  steps.forEach((s, i) => {
    const handle = s.answer === 'YES' ? 'yes' : 'no';
    const edge = edges.find(
      e => e.source === s.nodeId && e.sourceHandle === handle,
    );
    if (!edge) return;
    const isLast = i === steps.length - 1;
    edgeVisuals[edge.id] =
      isLast && run.status === 'running' ? 'active' : 'taken';
  });

  return { nodeVisuals, edgeVisuals };
}
