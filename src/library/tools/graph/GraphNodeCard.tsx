import type { KeyboardEvent, PointerEvent } from 'react';

import { cn } from '../../../lib/utils';
import { SvgStatusMark } from '../../experiences/drilldown/SvgStatusMark';
import type { DotShape, Tone } from '../../industrial/status';

import { HEADER_HEIGHT, NODE_WIDTH, PORT_TYPE_LABEL, RUN_STATE_LABEL, nodeHeight, portPosition } from './graphModel';
import type { GraphNode, GraphPort, PortType, RunState, Side } from './graphModel';

export type PortFeedback = 'valid' | 'invalid' | null;

export type GraphNodeCardProps = {
  node: GraphNode;
  selected?: boolean;
  /** Ports are drawn but cannot start a connection. */
  readOnly?: boolean;
  /** A port is armed as the start of a connection (from the pointer or the keyboard). */
  armedPort?: { node: string; port: string } | null;
  /** Verdict for each input port while a connection is being made. */
  feedback?: (portId: string) => PortFeedback;
  onPointerDown?: (event: PointerEvent<SVGGElement>) => void;
  onKeyDown?: (event: KeyboardEvent<SVGGElement>) => void;
  onPortPointerDown?: (side: Side, port: GraphPort, event: PointerEvent<SVGGElement>) => void;
  onPortActivate?: (side: Side, port: GraphPort) => void;
};

const RUN_MARK: Record<RunState, { tone: Tone; shape: DotShape }> = {
  idle: { tone: 'neutral', shape: 'ring' },
  running: { tone: 'info', shape: 'square' },
  done: { tone: 'success', shape: 'dot' },
  failed: { tone: 'critical', shape: 'diamond' },
};

/** Port glyph by type, so a type reads without colour. */
export function PortGlyph({ type, x, y, r = 5, className }: { type: PortType; x: number; y: number; r?: number; className?: string }) {
  const shared = { 'data-port-type': type, strokeWidth: 1.5, vectorEffect: 'non-scaling-stroke' as const, className };
  switch (type) {
    case 'signal':
      return <circle cx={x} cy={y} r={r} {...shared} />;
    case 'number':
      return <rect x={x - r} y={y - r} width={r * 2} height={r * 2} rx={1} {...shared} />;
    case 'table':
      return <path d={`M ${x - r} ${y - r} H ${x + r} V ${y + r} H ${x - r} Z M ${x - r} ${y} H ${x + r}`} {...shared} />;
    case 'boolean':
      return <path d={`M ${x} ${y - r - 1} L ${x + r + 1} ${y} L ${x} ${y + r + 1} L ${x - r - 1} ${y} Z`} {...shared} />;
    case 'text':
      return <path d={`M ${x - r} ${y + r} L ${x} ${y - r - 1} L ${x + r} ${y + r} Z`} {...shared} />;
    default:
      return <path d={`M ${x - r} ${y} H ${x + r} M ${x} ${y - r} V ${y + r}`} {...shared} />;
  }
}

const clip = (text: string, max: number): string => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/**
 * One node of a graph in world units: header with title and kind, typed ports on both edges and a
 * footer that says whether the node has run. Ports are shaped by type and named, the run state is
 * a shape and a word. Draw it inside the transformed group of a graph canvas.
 */
export function GraphNodeCard({ node, selected = false, readOnly = false, armedPort = null, feedback, onPointerDown, onKeyDown, onPortPointerDown, onPortActivate }: GraphNodeCardProps) {
  const height = nodeHeight(node);
  const mark = RUN_MARK[node.state];
  const label = `${node.title}, ${RUN_STATE_LABEL[node.state].toLowerCase()}${selected ? ', selected' : ''}`;

  const renderPort = (side: Side, port: GraphPort) => {
    const position = portPosition(node, side, port.id);
    if (!position) return null;
    const armed = armedPort?.node === node.id && armedPort.port === port.id;
    const verdict = side === 'input' ? feedback?.(port.id) ?? null : null;
    const interactive = !readOnly && (side === 'output' || feedback !== undefined || armedPort !== null);
    const textX = side === 'input' ? position.x + 12 : position.x - 12;
    return (
      <g
        key={`${side}-${port.id}`}
        data-slot="graph-port"
        data-side={side}
        data-port={port.id}
        data-feedback={verdict ?? undefined}
        role={readOnly ? undefined : 'button'}
        tabIndex={readOnly ? undefined : 0}
        aria-label={`${side === 'input' ? 'Input' : 'Output'} ${port.label}, ${PORT_TYPE_LABEL[port.type].toLowerCase()}, ${node.title}${armed ? ', connection started' : ''}`}
        onPointerDown={(event) => {
          if (readOnly) return;
          event.stopPropagation();
          onPortPointerDown?.(side, port, event);
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onPortActivate?.(side, port);
          } else if (event.key === 'Escape') {
            onKeyDown?.(event);
          }
        }}
        className={cn('group outline-none', interactive && 'cursor-crosshair')}
      >
        <circle cx={position.x} cy={position.y} r={13} className="fill-transparent group-focus-visible:stroke-ring-default" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <PortGlyph
          type={port.type}
          x={position.x}
          y={position.y}
          className={cn(
            armed || verdict === 'valid' ? 'fill-info-background stroke-info-foreground-strong' : verdict === 'invalid' ? 'fill-critical-background stroke-critical-foreground-strong' : 'fill-base-background stroke-medium-foreground group-hover:stroke-base-foreground'
          )}
        />
        <text x={textX} y={position.y} fontSize={11} textAnchor={side === 'input' ? 'start' : 'end'} dominantBaseline="central" className="pointer-events-none fill-medium-foreground">
          {clip(port.label, 16)}
        </text>
      </g>
    );
  };

  return (
    <g
      data-slot="graph-node"
      data-node={node.id}
      data-selected={selected}
      data-state={node.state}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={selected}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      className="group/node cursor-grab outline-none"
    >
      <rect
        x={node.x}
        y={node.y}
        width={NODE_WIDTH}
        height={height}
        rx={8}
        strokeWidth={selected ? 2 : 1}
        vectorEffect="non-scaling-stroke"
        className={cn('fill-card-background group-focus-visible/node:stroke-ring-default', selected ? 'stroke-base-foreground' : 'stroke-default group-hover/node:stroke-emphasized')}
      />
      <text x={node.x + 12} y={node.y + 18} fontSize={12} className="pointer-events-none fill-base-foreground font-medium">
        {clip(node.title, 22)}
      </text>
      {node.detail ? (
        <text x={node.x + 12} y={node.y + 33} fontSize={10} className="pointer-events-none fill-muted-foreground">
          {clip(node.detail, 28)}
        </text>
      ) : null}
      <path d={`M ${node.x} ${node.y + HEADER_HEIGHT} H ${node.x + NODE_WIDTH}`} strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-default" />
      {node.inputs.map((port) => renderPort('input', port))}
      {node.outputs.map((port) => renderPort('output', port))}
      <g data-slot="graph-node-state" className="pointer-events-none">
        <SvgStatusMark x={node.x + 16} y={node.y + height - 12} size={9} tone={mark.tone} shape={mark.shape} />
        <text x={node.x + 28} y={node.y + height - 12} fontSize={10} dominantBaseline="central" className={node.state === 'failed' ? 'fill-critical-foreground-strong font-medium' : 'fill-muted-foreground'}>
          {RUN_STATE_LABEL[node.state]}
        </text>
      </g>
      <title>{node.error ? `${node.title}: ${node.error}` : node.title}</title>
    </g>
  );
}
