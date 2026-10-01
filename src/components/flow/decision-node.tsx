'use client';

import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import { Textarea } from '@/components/ui/textarea';
import type { DecisionNode as DecisionNodeType } from '@/lib/types';

export function DecisionNode({
  id,
  data,
  selected,
}: NodeProps<DecisionNodeType>) {
  const { updateNodeData } = useReactFlow();

  return (
    <div
      className={`w-64 rounded-lg border bg-card p-3 shadow-sm ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} />

      <p className="mb-2 text-xs font-medium text-muted-foreground">
        AI decision (YES or NO)
      </p>

      <Textarea
        className="nodrag nowheel min-h-20 text-sm"
        value={data.prompt}
        onChange={e => updateNodeData(id, { prompt: e.target.value })}
        placeholder="Is this a support request?"
      />

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
