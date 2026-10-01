import type { Node } from '@xyflow/react';

export type DecisionNodeData = {
  prompt: string;
};

export type DecisionNode = Node<DecisionNodeData, 'decision'>;

export type EdgeKind = 'yes' | 'no';
export type Answer = 'YES' | 'NO';

export type StepResult = {
  order: number;
  nodeId: string;
  prompt: string;
  answer: Answer;
};

export type RunState = {
  runId: string;
  status: 'running' | 'completed' | 'failed';
  steps: StepResult[];
  error?: string;
};
