'use client';

import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useState } from 'react';
import {
  addEdge,
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
} from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { DecisionNode } from './decision-node';
import { NoEdge, YesEdge } from './edges';
import type { DecisionNode as DecisionNodeType } from '@/lib/types';

const nodeTypes = { decision: DecisionNode };
const edgeTypes = { yes: YesEdge, no: NoEdge };

const STORAGE_KEY = 'ai-decision-flow:graph:v1';

const initialNodes: DecisionNodeType[] = [
  {
    id: 'n1',
    type: 'decision',
    position: { x: 250, y: 0 },
    data: { prompt: 'Is this a support request?' },
  },
  {
    id: 'n2',
    type: 'decision',
    position: { x: 0, y: 260 },
    data: { prompt: 'Is the customer reporting a bug or a broken feature?' },
  },
  {
    id: 'n3',
    type: 'decision',
    position: { x: 500, y: 260 },
    data: { prompt: 'Is the customer interested in pricing or buying?' },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1',
    source: 'n1',
    sourceHandle: 'yes',
    target: 'n2',
    type: 'yes',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#16a34a' },
  },
  {
    id: 'e2',
    source: 'n1',
    sourceHandle: 'no',
    target: 'n3',
    type: 'no',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#dc2626' },
  },
];

export default function FlowEditor() {
  const [nodes, setNodes, onNodesChange] =
    useNodesState<DecisionNodeType>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [hydrated, setHydrated] = useState(false);

  // Load saved graph once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.nodes) && Array.isArray(saved.edges)) {
          setNodes(saved.nodes);
          setEdges(saved.edges);
        }
      }
    } catch {
      // ignore corrupted storage and keep the default graph
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, [setNodes, setEdges]);

  // Save on every change, but only after the first load finished
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
    } catch {
      // storage can be full or blocked, ignore
    }
  }, [nodes, edges, hydrated]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const kind = connection.sourceHandle === 'no' ? 'no' : 'yes';
      const color = kind === 'yes' ? '#16a34a' : '#dc2626';
      setEdges(eds =>
        addEdge(
          {
            ...connection,
            type: kind,
            markerEnd: { type: MarkerType.ArrowClosed, color },
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  // One edge per handle, and no self-connections
  const isValidConnection = useCallback(
    (c: Connection | Edge) => {
      if (c.source === c.target) return false;
      return !edges.some(
        e => e.source === c.source && e.sourceHandle === c.sourceHandle,
      );
    },
    [edges],
  );

  const addNode = useCallback(() => {
    setNodes(ns => [
      ...ns,
      {
        id: crypto.randomUUID(),
        type: 'decision',
        position: { x: 100 + ns.length * 30, y: 100 + ns.length * 30 },
        data: { prompt: '' },
      },
    ]);
  }, [setNodes]);

  const resetGraph = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      isValidConnection={isValidConnection}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
      <Panel position="top-left" className="flex gap-2">
        <Button onClick={addNode}>Add node</Button>
        <Button variant="outline" onClick={resetGraph}>
          Reset
        </Button>
      </Panel>
    </ReactFlow>
  );
}
