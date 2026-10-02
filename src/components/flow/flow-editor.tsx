'use client';

import '@xyflow/react/dist/style.css';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
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
import { RunPanel } from './run-panel';
import { RunVisualContext } from './run-context';
import { computeRunVisuals } from '@/lib/run-visuals';
import { exportGraph, parseGraph } from '@/lib/graph-io';
import type { DecisionNode as DecisionNodeType, RunState } from '@/lib/types';

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

  const [run, setRun] = useState<RunState | null>(null);
  const [panelKey, setPanelKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  // How each node and edge should look for the current run
  const { nodeVisuals, edgeVisuals } = useMemo(
    () => computeRunVisuals(nodes, edges, run),
    [nodes, edges, run],
  );

  const displayEdges = useMemo(() => {
    if (!run) return edges;
    return edges.map(e => {
      const v = edgeVisuals[e.id] ?? 'idle';
      if (v === 'active')
        return { ...e, animated: true, style: { strokeWidth: 3 } };
      if (v === 'taken') return { ...e, style: { strokeWidth: 3 } };
      return { ...e, style: { opacity: 0.25 } };
    });
  }, [edges, edgeVisuals, run]);

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

  const clearRun = useCallback(() => {
    setRun(null);
    setPanelKey(k => k + 1); // remounts the run panel and stops its polling
  }, []);

  const resetGraph = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    clearRun();
    setMessage(null);
  }, [setNodes, setEdges, clearRun]);

  const handleExport = useCallback(() => {
    const blob = new Blob([exportGraph(nodes, edges)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-decision-flow.json';
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Exported ai-decision-flow.json');
  }, [nodes, edges]);

  const handleImport = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ''; // lets you import the same file again later
      if (!file) return;
      try {
        const graph = parseGraph(await file.text());
        setNodes(graph.nodes);
        setEdges(graph.edges);
        clearRun();
        setMessage(
          `Imported ${graph.nodes.length} nodes and ${graph.edges.length} edges`,
        );
      } catch (err) {
        setMessage(
          err instanceof Error ? err.message : 'Could not import this file',
        );
      }
    },
    [setNodes, setEdges, clearRun],
  );

  return (
    <RunVisualContext.Provider value={nodeVisuals}>
      <ReactFlow
        nodes={nodes}
        edges={displayEdges}
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

        <Panel position="top-left" className="space-y-2">
          <div className="flex gap-2">
            <Button onClick={addNode}>Add node</Button>
            <Button variant="outline" onClick={resetGraph}>
              Reset
            </Button>
            <Button variant="outline" onClick={handleExport}>
              Export JSON
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Import JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
          {message && (
            <p className="max-w-sm rounded border bg-card px-2 py-1 text-xs">
              {message}
            </p>
          )}
        </Panel>

        <Panel position="top-right">
          <RunPanel
            key={panelKey}
            nodes={nodes}
            edges={edges}
            onRunChange={setRun}
          />
        </Panel>
      </ReactFlow>
    </RunVisualContext.Provider>
  );
}
