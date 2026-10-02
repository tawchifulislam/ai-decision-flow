import { MarkerType, type Edge } from '@xyflow/react';
import type { DecisionNode } from './types';

const COLORS = { yes: '#16a34a', no: '#dc2626' } as const;

export function exportGraph(nodes: DecisionNode[], edges: Edge[]): string {
  const graph = {
    version: 1,
    nodes: nodes.map(n => ({
      id: n.id,
      position: { x: n.position.x, y: n.position.y },
      data: { prompt: n.data.prompt },
    })),
    edges: edges.map(e => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle,
      target: e.target,
    })),
  };
  return JSON.stringify(graph, null, 2);
}

type RawNode = {
  id?: unknown;
  position?: { x?: unknown; y?: unknown };
  data?: { prompt?: unknown };
};
type RawEdge = {
  source?: string;
  sourceHandle?: string | null;
  target?: string;
};

export function parseGraph(text: string): {
  nodes: DecisionNode[];
  edges: Edge[];
} {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON');
  }

  const obj = raw as { nodes?: unknown; edges?: unknown } | null;
  if (!obj || !Array.isArray(obj.nodes) || !Array.isArray(obj.edges)) {
    throw new Error('The file must contain "nodes" and "edges" arrays');
  }
  if (obj.nodes.length === 0) {
    throw new Error('The file has no nodes');
  }

  const ids = new Set<string>();
  const nodes = obj.nodes.map((n: RawNode, i: number): DecisionNode => {
    if (typeof n.id !== 'string' || !n.id) {
      throw new Error(`Node ${i + 1} has no id`);
    }
    if (ids.has(n.id)) {
      throw new Error(`Duplicate node id: ${n.id}`);
    }
    ids.add(n.id);

    const x = Number(n.position?.x);
    const y = Number(n.position?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`Node ${n.id} has an invalid position`);
    }

    return {
      id: n.id,
      type: 'decision',
      position: { x, y },
      data: { prompt: typeof n.data?.prompt === 'string' ? n.data.prompt : '' },
    };
  });

  const used = new Set<string>();
  const edges = obj.edges.map((e: RawEdge, i: number): Edge => {
    const handle = e.sourceHandle;
    if (handle !== 'yes' && handle !== 'no') {
      throw new Error(`Edge ${i + 1} must start from the "yes" or "no" handle`);
    }
    if (!e.source || !e.target || !ids.has(e.source) || !ids.has(e.target)) {
      throw new Error(`Edge ${i + 1} points to a node that does not exist`);
    }
    if (e.source === e.target) {
      throw new Error(`Edge ${i + 1} connects a node to itself`);
    }

    const key = `${e.source}-${handle}`;
    if (used.has(key)) {
      throw new Error(`Node ${e.source} has two "${handle}" edges`);
    }
    used.add(key);

    return {
      id: `e-${key}`,
      source: e.source,
      sourceHandle: handle,
      target: e.target,
      type: handle,
      markerEnd: { type: MarkerType.ArrowClosed, color: COLORS[handle] },
    };
  });

  return { nodes, edges };
}
