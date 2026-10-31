"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export type GeornyMilestone = {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  node_type: string;
  estimated_hours?: number | null;
};

export type GeornyDep = {
  milestone_id: string;
  depends_on_id: string;
};

type Props = {
  milestones: GeornyMilestone[];
  dependencies: GeornyDep[];
  onSelect?: (id: string) => void;
};

export function GeornyGraph({ milestones, dependencies, onSelect }: Props) {
  const initialNodes: Node[] = useMemo(() => {
    const sorted = [...milestones].sort((a, b) => a.position - b.position);
    return sorted.map((m, i) => ({
      id: m.id,
      position: { x: (i % 4) * 220, y: Math.floor(i / 4) * 140 },
      data: {
        label: (
          <div className="px-2 py-1 text-left">
            <div className="text-[10px] uppercase tracking-wide opacity-70">{m.node_type}</div>
            <div className="font-medium text-sm leading-snug">{m.title}</div>
            {m.estimated_hours != null && (
              <div className="text-[11px] opacity-60 mt-0.5">~{m.estimated_hours}h</div>
            )}
          </div>
        ),
      },
      style: {
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--card)",
        color: "var(--card-foreground)",
        width: 180,
        fontSize: 12,
      },
    }));
  }, [milestones]);

  const initialEdges: Edge[] = useMemo(
    () =>
      dependencies.map((d) => ({
        id: `${d.depends_on_id}-${d.milestone_id}`,
        source: d.depends_on_id,
        target: d.milestone_id,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: "var(--accent)" },
      })),
    [dependencies]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => onSelect?.(node.id),
    [onSelect]
  );

  if (!milestones.length) {
    return (
      <div className="h-[400px] flex items-center justify-center rounded-2xl border border-dashed border-border text-muted-foreground text-sm">
        No milestones in this Georny yet.
      </div>
    );
  }

  return (
    <div className="h-[min(70vh,560px)] w-full rounded-2xl border border-border overflow-hidden bg-muted/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}
