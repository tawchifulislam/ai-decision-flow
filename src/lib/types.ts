import type { Node } from '@xyflow/react';

export type DecisionNodeData = {
  prompt: string;
};

export type DecisionNode = Node<DecisionNodeData, 'decision'>;

export type EdgeKind = 'yes' | 'no';
