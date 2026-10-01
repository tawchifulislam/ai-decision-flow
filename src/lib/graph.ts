import type { Answer } from './types';

export type GraphNode = { id: string; data: { prompt: string } };
export type GraphEdge = {
  source: string;
  sourceHandle?: string | null;
  target: string;
};

// The start node is a node nobody points to. If several qualify,
// prefer one that actually has an outgoing edge (skips stray nodes).
export function findStartNode(
  nodes: GraphNode[],
  edges: GraphEdge[],
): GraphNode | null {
  const hasIncoming = new Set(edges.map(e => e.target));
  const hasOutgoing = new Set(edges.map(e => e.source));
  const roots = nodes.filter(n => !hasIncoming.has(n.id));
  return roots.find(n => hasOutgoing.has(n.id)) ?? roots[0] ?? nodes[0] ?? null;
}

// Follow the YES or NO edge that leaves this node
export function nextNodeId(
  edges: GraphEdge[],
  nodeId: string,
  answer: Answer,
): string | null {
  const handle = answer === 'YES' ? 'yes' : 'no';
  const edge = edges.find(
    e => e.source === nodeId && e.sourceHandle === handle,
  );
  return edge ? edge.target : null;
}
