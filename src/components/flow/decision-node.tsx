'use client';

import { useContext } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import { Textarea } from '@/components/ui/textarea';
import { RunVisualContext } from './run-context';
import type { DecisionNode as DecisionNodeType, NodeStatus } from '@/lib/types';

const STATUS_STYLE: Record<NodeStatus, string> = {
  idle: 'border-border bg-card',
  running: 'border-blue-500 bg-card ring-2 ring-blue-300 animate-pulse',
  yes: 'border-green-500 bg-green-50',
  no: 'border-red-500 bg-red-50',
  failed: 'border-orange-500 bg-orange-50 ring-2 ring-orange-300',
};

const STATUS_LABEL: Partial<Record<NodeStatus, string>> = {
  running: 'Thinking...',
  yes: 'Answered YES',
  no: 'Answered NO',
  failed: 'Failed',
};

export function DecisionNode({
  id,
  data,
  selected,
}: NodeProps<DecisionNodeType>) {
  const { updateNodeData } = useReactFlow();
  const visuals = useContext(RunVisualContext);
  const visual = visuals[id];
  const status: NodeStatus = visual?.status ?? 'idle';

  return (
    <div
      className={`w-64 rounded-lg border p-3 shadow-sm ${STATUS_STYLE[status]} ${
        status === 'idle' && selected ? 'ring-2 ring-primary' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} />

      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">
          AI decision (YES or NO)
        </span>
        {visual?.order !== undefined && (
          <span className="rounded-full bg-foreground px-2 py-0.5 font-semibold text-background">
            #{visual.order}
          </span>
        )}
      </div>

      <Textarea
        className="nodrag nowheel min-h-20 bg-white text-sm"
        value={data.prompt}
        onChange={e => updateNodeData(id, { prompt: e.target.value })}
        placeholder="Is this a support request?"
      />

      {STATUS_LABEL[status] && (
        <p className="mt-2 text-center text-xs font-semibold">
          {STATUS_LABEL[status]}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 text-center text-xs font-semibold">
        <span className="text-green-600">YES</span>
        <span className="text-red-600">NO</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ left: '25%', background: '#16a34a' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ left: '75%', background: '#dc2626' }}
      />
    </div>
  );
}
