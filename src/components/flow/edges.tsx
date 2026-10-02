'use client';

import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

function KindEdge(props: EdgeProps & { label: string; color: string }) {
  const [path, labelX, labelY] = getBezierPath(props);

  return (
    <BaseEdge
      id={props.id}
      path={path}
      markerEnd={props.markerEnd}
      style={{ stroke: props.color, strokeWidth: 2, ...props.style }}
      labelX={labelX}
      labelY={labelY}
      label={props.label}
      labelStyle={{ fill: props.color, fontWeight: 700, fontSize: 12 }}
      labelBgStyle={{ fill: 'white' }}
      labelShowBg
    />
  );
}

export function YesEdge(props: EdgeProps) {
  return <KindEdge {...props} label="YES" color="#16a34a" />;
}

export function NoEdge(props: EdgeProps) {
  return <KindEdge {...props} label="NO" color="#dc2626" />;
}
