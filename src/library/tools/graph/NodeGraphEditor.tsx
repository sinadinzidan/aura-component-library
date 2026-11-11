import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Separator } from '@cognite/aura/components/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconArrowBackUp, IconArrowForwardUp, IconCopy, IconLayoutDistributeHorizontal, IconLock, IconTrash, IconX } from '@cognite/aura/icons';
import { useEffect, useId, useMemo, useReducer, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { ViewerToolbar } from '../../industrial/workflows/ViewerToolbar';
import type { ViewPoint, ViewSize, Viewport } from '../pid/viewport';
import { fitRect, panBy, toWorld, visibleRect, zoomAbout, zoomPercent, zoomTo , centreOn } from '../pid/viewport';
import { ViewportMiniMap } from '../pid/ViewportMiniMap';

import { NODE_TEMPLATES } from './graphFixtures';
import type { NodeTemplate } from './graphFixtures';
import { autoLayout } from './graphLayout';
import { NODE_WIDTH, checkConnection, edgeMidpoint, edgePath, findNode, graphBounds, nodeHeight, nodeRect, nodesInRect, portAt, portPosition, rectFromPoints } from './graphModel';
import type { GraphData, GraphPort, Rect, Side } from './graphModel';
import type { PortFeedback } from './GraphNodeCard';
import { GraphNodeCard } from './GraphNodeCard';
import { dropPosition, graphReducer, initGraphState } from './graphReducer';
import { NodeInspector } from './NodeInspector';
import { NodePalette } from './NodePalette';
import { PortTypeLegend } from './PortTypeLegend';

export type NodeGraphEditorProps = {
  graph: GraphData;
  /** Nothing can be changed. Panning, zooming and selecting still work. */
  readOnly?: boolean;
  /** Ids of nodes selected when the editor first shows. */
  initialSelection?: readonly string[];
  /** `compact` hides the palette, the inspector and the mini-map: the graph embedded in a card. */
  variant?: 'full' | 'compact';
  /** Palette contents. Defaults to the shared templates. */
  templates?: readonly NodeTemplate[];
  /** Accessible name and visible title of the graph. */
  label: string;
  className?: string;
  /** Extra controls on the right of the toolbar. */
  toolbarEnd?: ReactNode;
};

const PAN_STEP = 48;
const DRAG_THRESHOLD = 4;
const GRID = 8;
const ZOOM_LIMITS = { min: 0.3, max: 2 };

type Gesture =
  | { kind: 'pan'; id: number; x: number; y: number }
  | { kind: 'marquee'; id: number; start: ViewPoint; additive: boolean }
  | { kind: 'move'; id: number; origin: ViewPoint; node: string; nodeStart: ViewPoint; moved: boolean }
  | { kind: 'connect'; id: number; from: { node: string; port: string } };

const isTyping = (target: EventTarget): boolean => target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

/**
 * A node graph editor. Drag nodes (snapped to a grid), drag from an output port to an input port
 * to connect them, refused with a reason when the types differ, an input is taken or the link
 * would loop. Shift-click or drag a marquee to select several; Delete, Ctrl+D, Ctrl+Z and
 * Ctrl+Shift+Z delete, duplicate, undo and redo. Everything also works from the keyboard: Tab to a
 * node, arrows move it, Enter on an output port then Enter on an input port connects them.
 * Give it a height from its container. State is local; the graph comes in as a prop.
 */
export function NodeGraphEditor({ graph, readOnly = false, variant = 'full', templates = NODE_TEMPLATES, label, className, toolbarEnd, initialSelection = [] }: NodeGraphEditorProps) {
  const compact = variant === 'compact';
  const [state, dispatch] = useReducer(graphReducer, graph, (initial) => ({ ...initGraphState(initial, GRID), selection: initialSelection }));
  const [size, setSize] = useState<ViewSize>({ width: 960, height: 520 });
  // `null` follows the graph as first given, fitted to the canvas; any pan or zoom takes over.
  const [manual, setManual] = useState<Viewport | null>(null);
  const base = useMemo(() => fitRect(graphBounds(graph.nodes), size, 32, ZOOM_LIMITS), [graph.nodes, size]);
  const baseRef = useRef(base);
  useEffect(() => {
    baseRef.current = base;
  });
  const viewport = manual ?? base;
  /** Keeps the view where it is from now on: after the first selection, opening the inspector must not rescale the drawing. */
  const freeze = () => setManual((previous) => previous ?? baseRef.current);
  const setViewport = (update: Viewport | ((view: Viewport) => Viewport)) => setManual((previous) => (typeof update === 'function' ? update(previous ?? base) : update));
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const [pending, setPending] = useState<{ from: { node: string; port: string }; pointer: ViewPoint | null } | null>(null);
  const [hover, setHover] = useState<{ node: string; port: string } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const markerId = `graph-arrow-${useId().replace(/:/g, '')}`;

  const fit = () => setManual(fitRect(graphBounds(state.graph.nodes), size, 32, ZOOM_LIMITS));

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return undefined;
    const measure = () => {
      const box = element.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) return;
      setSize({ width: box.width, height: box.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return undefined;
    const onWheel = (event: WheelEvent) => {
      const active = element.contains(document.activeElement) || event.ctrlKey || event.metaKey;
      if (!active) return;
      event.preventDefault();
      const box = element.getBoundingClientRect();
      if (event.ctrlKey || event.metaKey) {
        setManual((current) => zoomAbout(current ?? baseRef.current, { x: event.clientX - box.left, y: event.clientY - box.top }, Math.exp(-event.deltaY * 0.0025), ZOOM_LIMITS));
      } else {
        setManual((current) => panBy(current ?? baseRef.current, -event.deltaX, -event.deltaY));
      }
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, []);

  const worldPoint = (event: { clientX: number; clientY: number }): ViewPoint => {
    const box = canvasRef.current?.getBoundingClientRect();
    return toWorld(viewport, { x: event.clientX - (box?.left ?? 0), y: event.clientY - (box?.top ?? 0) });
  };

  const current = state.graph;
  const selectedNodes = current.nodes.filter((node) => state.selection.includes(node.id));
  const single = selectedNodes.length === 1 ? selectedNodes[0] : null;

  const feedbackFor = (nodeId: string) => (portId: string): PortFeedback => {
    if (!pending) return null;
    if (hover?.node !== nodeId || hover.port !== portId) {
      const quick = checkConnection(current, pending.from, { node: nodeId, port: portId });
      return pending.pointer === null && quick.ok ? 'valid' : null;
    }
    return checkConnection(current, pending.from, { node: nodeId, port: portId }).ok ? 'valid' : 'invalid';
  };

  const completeConnection = (to: { node: string; port: string }) => {
    if (pending) dispatch({ type: 'connect', from: pending.from, to });
    setPending(null);
    setHover(null);
  };

  const startConnection = (from: { node: string; port: string }, pointer: ViewPoint | null) => {
    setPending({ from, pointer });
  };

  const handleBackgroundPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.button !== 1) return;
    canvasRef.current?.focus();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (event.shiftKey && event.button === 0) {
      gesture.current = { kind: 'marquee', id: event.pointerId, start: worldPoint(event), additive: true };
    } else {
      gesture.current = { kind: 'pan', id: event.pointerId, x: event.clientX, y: event.clientY };
    }
  };

  const handleNodePointerDown = (nodeId: string) => (event: PointerEvent<SVGGElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    canvasRef.current?.focus();
    canvasRef.current?.setPointerCapture?.(event.pointerId);
    freeze();
    dispatch({ type: 'select', id: nodeId, additive: event.shiftKey });
    if (readOnly || event.shiftKey) return;
    const node = findNode(current, nodeId);
    if (node) gesture.current = { kind: 'move', id: event.pointerId, origin: worldPoint(event), node: nodeId, nodeStart: { x: node.x, y: node.y }, moved: false };
  };

  const handlePortPointerDown = (side: Side, port: GraphPort, nodeId: string, event: PointerEvent<SVGGElement>) => {
    if (readOnly) return;
    canvasRef.current?.setPointerCapture?.(event.pointerId);
    if (side === 'output') {
      const from = { node: nodeId, port: port.id };
      gesture.current = { kind: 'connect', id: event.pointerId, from };
      startConnection(from, worldPoint(event));
    } else if (pending) {
      completeConnection({ node: nodeId, port: port.id });
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const active = gesture.current;
    if (!active || active.id !== event.pointerId) return;
    if (active.kind === 'pan') {
      setViewport((view) => panBy(view, event.clientX - active.x, event.clientY - active.y));
      active.x = event.clientX;
      active.y = event.clientY;
    } else if (active.kind === 'marquee') {
      setMarquee(rectFromPoints(active.start, worldPoint(event)));
    } else if (active.kind === 'move') {
      const point = worldPoint(event);
      const dx = (point.x - active.origin.x) * 1;
      const dy = point.y - active.origin.y;
      if (!active.moved) {
        if (Math.hypot(dx * viewport.k, dy * viewport.k) < DRAG_THRESHOLD) return;
        active.moved = true;
        dispatch({ type: 'moveStart' });
      }
      const node = findNode(current, active.node);
      if (!node) return;
      const targetX = Math.round((active.nodeStart.x + dx) / GRID) * GRID;
      const targetY = Math.round((active.nodeStart.y + dy) / GRID) * GRID;
      dispatch({ type: 'moveSelection', dx: targetX - node.x, dy: targetY - node.y });
    } else if (active.kind === 'connect') {
      const point = worldPoint(event);
      setPending({ from: active.from, pointer: point });
      setHover(portAt(current, point, 'input'));
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const active = gesture.current;
    gesture.current = null;
    if (!active || active.id !== event.pointerId) return;
    if (active.kind === 'marquee') {
      if (marquee) freeze();
      if (marquee) dispatch({ type: 'selectMany', ids: nodesInRect(current, marquee), additive: true });
      setMarquee(null);
    } else if (active.kind === 'pan') {
      const moved = Math.hypot(event.clientX - active.x, event.clientY - active.y);
      if (moved < DRAG_THRESHOLD && (state.selection.length > 0 || state.selectedEdge)) dispatch({ type: 'clearSelection' });
    } else if (active.kind === 'connect') {
      const target = portAt(current, worldPoint(event), 'input');
      if (target) completeConnection(target);
      else {
        setPending(null);
        setHover(null);
      }
    }
  };

  const handlePointerCancel = () => {
    gesture.current = null;
    setMarquee(null);
    setPending(null);
    setHover(null);
  };

  const arrange = () => {
    const positions = autoLayout(current, { grid: GRID });
    dispatch({ type: 'autoLayout' });
    setManual(fitRect(graphBounds(current.nodes.map((node) => ({ ...node, ...(positions.get(node.id) ?? {}) }))), size, 32, ZOOM_LIMITS));
  };

  const addFromPalette = (template: NodeTemplate) => {
    const centre = toWorld(viewport, { x: size.width / 2, y: size.height / 2 });
    freeze();
    const spot = dropPosition(centre, current.nodes.length);
    dispatch({ type: 'addNode', spec: { ...template, ...spot } });
  };

  const handleKeyDown = (event: KeyboardEvent<Element>) => {
    if (isTyping(event.target)) return;
    const meta = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (event.key === 'Escape') {
      if (pending) {
        setPending(null);
        setHover(null);
      } else dispatch({ type: 'clearSelection' });
      return;
    }
    if (key === '+' || key === '=') {
      event.preventDefault();
      setViewport((view) => zoomAbout(view, { x: size.width / 2, y: size.height / 2 }, 1.25, ZOOM_LIMITS));
      return;
    }
    if (key === '-' || key === '_') {
      event.preventDefault();
      setViewport((view) => zoomAbout(view, { x: size.width / 2, y: size.height / 2 }, 0.8, ZOOM_LIMITS));
      return;
    }
    if (key === '0' && !meta) {
      event.preventDefault();
      fit();
      return;
    }
    if (meta && key === 'a') {
      event.preventDefault();
      freeze();
      dispatch({ type: 'selectAll' });
      return;
    }
    if (!readOnly && meta && key === 'z') {
      event.preventDefault();
      dispatch({ type: event.shiftKey ? 'redo' : 'undo' });
      return;
    }
    if (!readOnly && meta && key === 'y') {
      event.preventDefault();
      dispatch({ type: 'redo' });
      return;
    }
    if (!readOnly && meta && key === 'd') {
      event.preventDefault();
      dispatch({ type: 'duplicate' });
      return;
    }
    if (!readOnly && (event.key === 'Delete' || event.key === 'Backspace')) {
      event.preventDefault();
      dispatch({ type: 'deleteSelection' });
      return;
    }
    const arrows: Record<string, ViewPoint> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } };
    const arrow = arrows[event.key];
    if (!arrow) return;
    event.preventDefault();
    if (state.selection.length > 0 && !readOnly) {
      const step = GRID * (event.shiftKey ? 4 : 1);
      dispatch({ type: 'moveSelection', dx: arrow.x * step, dy: arrow.y * step, commit: true });
    } else {
      setViewport((view) => panBy(view, -arrow.x * PAN_STEP, -arrow.y * PAN_STEP));
    }
  };

  const handleNodeKeyDown = (nodeId: string) => (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      freeze();
      dispatch({ type: 'select', id: nodeId, additive: event.shiftKey });
    } else if (event.key === 'Escape') {
      handleKeyDown(event);
    }
  };

  const nodeById = (id: string) => findNode(current, id);
  const pendingStart = pending ? nodeById(pending.from.node) : undefined;
  const pendingFrom = pendingStart ? portPosition(pendingStart, 'output', pending?.from.port ?? '') : null;
  const hoverVerdict = pending && hover ? checkConnection(current, pending.from, hover) : null;
  const hoverTo = hover ? (() => { const node = nodeById(hover.node); return node ? portPosition(node, 'input', hover.port) : null; })() : null;
  const pendingEnd = pending?.pointer ? (hoverTo ?? pending.pointer) : null;
  const message = hoverVerdict && !hoverVerdict.ok ? hoverVerdict.reason : state.error;
  const empty = current.nodes.length === 0;

  const toolButton = (labelText: string, icon: ReactNode, onClick: () => void, disabled = false) => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={labelText} disabled={disabled} onClick={onClick}>{icon}</Button>} />
      <TooltipContent>{labelText}</TooltipContent>
    </Tooltip>
  );

  const edges = current.edges.map((edge) => {
    const from = nodeById(edge.from.node);
    const to = nodeById(edge.to.node);
    const start = from ? portPosition(from, 'output', edge.from.port) : null;
    const end = to ? portPosition(to, 'input', edge.to.port) : null;
    if (!from || !to || !start || !end) return null;
    return { edge, start, end, d: edgePath(start, end), selected: state.selectedEdge === edge.id, title: `${from.title} to ${to.title}` };
  });

  return (
    <div data-slot="node-graph-editor" data-variant={variant} data-read-only={readOnly} className={cn('flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border border-default bg-base-background', className)}>
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-default px-3 py-2">
        <span className="min-w-0 truncate text-sm font-medium text-base-foreground">{label}</span>
        <span className="flex-1" />
        {readOnly ? (
          <Badge variant="secondary">
            <IconLock aria-hidden="true" /> Read-only
          </Badge>
        ) : (
          <div role="toolbar" aria-label="Edit" className="flex items-center gap-1">
            {toolButton('Undo', <IconArrowBackUp />, () => dispatch({ type: 'undo' }), state.past.length === 0)}
            {toolButton('Redo', <IconArrowForwardUp />, () => dispatch({ type: 'redo' }), state.future.length === 0)}
            {toolButton('Arrange nodes left to right', <IconLayoutDistributeHorizontal />, arrange, empty)}
            <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
          </div>
        )}
        <ViewerToolbar
          zoom={zoomPercent(viewport)}
          onZoomChange={(percent) => setViewport((view) => zoomTo(view, { x: size.width / 2, y: size.height / 2 }, percent / 100, ZOOM_LIMITS))}
          onFit={() => fit()}
          range={{ min: ZOOM_LIMITS.min * 100, max: ZOOM_LIMITS.max * 100, step: 10 }}
          label="Zoom"
        />
        {toolbarEnd}
      </div>

      <div className="flex min-h-0 flex-1">
        {!compact && !readOnly ? (
          <div className="w-56 shrink-0 overflow-y-auto border-r border-default p-3">
            <h3 className="pb-2 text-xs font-medium text-muted-foreground">Add a node</h3>
            <NodePalette templates={templates} onAdd={addFromPalette} />
          </div>
        ) : null}

        <div className="relative min-h-0 min-w-0 flex-1 bg-muted-background">
          <div
            ref={canvasRef}
            role="application"
            tabIndex={0}
            aria-label={`${label}. Tab to a node, arrow keys move it, Delete removes it. With nothing selected the arrow keys pan.`}
            data-slot="graph-canvas"
            onPointerDown={handleBackgroundPointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onKeyDown={handleKeyDown}
            className={cn('absolute inset-0 touch-none overflow-hidden outline-none select-none focus-visible:ring-2 focus-visible:ring-ring-default focus-visible:ring-inset', pending ? 'cursor-crosshair' : 'cursor-grab')}
          >
            <svg width="100%" height="100%" fill="none" className="block">
              <defs>
                {(['default', 'selected', 'ok', 'bad'] as const).map((kind) => (
                  <marker key={kind} id={`${markerId}-${kind}`} viewBox="0 0 10 10" refX={9} refY={5} markerUnits="userSpaceOnUse" markerWidth={10} markerHeight={10} orient="auto-start-reverse" className={kind === 'selected' ? 'text-base-foreground' : kind === 'ok' ? 'text-info-foreground-strong' : kind === 'bad' ? 'text-critical-foreground-strong' : 'text-medium-foreground'}>
                    <path d="M 0 0 L 10 5 L 0 10 Z" fill="currentColor" />
                  </marker>
                ))}
              </defs>
              <g transform={`translate(${-viewport.x * viewport.k} ${-viewport.y * viewport.k}) scale(${viewport.k})`}>
                <g data-slot="graph-edges">
                  {edges.map((item) =>
                    item ? (
                      <g key={item.edge.id} data-edge={item.edge.id} data-selected={item.selected}>
                        <path d={item.d} strokeWidth={item.selected ? 2.5 : 1.5} vectorEffect="non-scaling-stroke" markerEnd={`url(#${markerId}-${item.selected ? 'selected' : 'default'})`} className={item.selected ? 'stroke-base-foreground' : 'stroke-medium-foreground'} />
                        <path
                          d={item.d}
                          strokeWidth={14}
                          vectorEffect="non-scaling-stroke"
                          pointerEvents="stroke"
                          role="button"
                          tabIndex={0}
                          aria-label={`Connection, ${item.title}${item.selected ? ', selected' : ''}`}
                          aria-pressed={item.selected}
                          onPointerDown={(event) => { event.stopPropagation(); canvasRef.current?.focus(); freeze(); dispatch({ type: 'selectEdge', id: item.edge.id }); }}
                          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); dispatch({ type: 'selectEdge', id: item.edge.id }); } }}
                          className="cursor-pointer stroke-transparent outline-none hover:stroke-info-background focus-visible:stroke-ring-default"
                        />
                        {item.selected && !readOnly ? (
                          <g role="button" tabIndex={0} aria-label="Remove connection" onPointerDown={(event) => { event.stopPropagation(); dispatch({ type: 'deleteEdge', id: item.edge.id }); }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); dispatch({ type: 'deleteEdge', id: item.edge.id }); } }} className="cursor-pointer outline-none">
                            <circle cx={edgeMidpoint(item.start, item.end).x} cy={edgeMidpoint(item.start, item.end).y} r={11} className="fill-base-background stroke-base-foreground" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                            <path d={`M ${edgeMidpoint(item.start, item.end).x - 4} ${edgeMidpoint(item.start, item.end).y - 4} l 8 8 m 0 -8 l -8 8`} strokeWidth={1.5} className="stroke-base-foreground" />
                          </g>
                        ) : null}
                      </g>
                    ) : null
                  )}
                  {pending && pendingFrom && pendingEnd ? (
                    <path data-slot="graph-pending-edge" d={edgePath(pendingFrom, pendingEnd)} strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" markerEnd={`url(#${markerId}-${hoverVerdict ? (hoverVerdict.ok ? 'ok' : 'bad') : 'default'})`} className={cn('pointer-events-none', hoverVerdict && !hoverVerdict.ok ? 'stroke-critical-foreground-strong' : 'stroke-info-foreground-strong')} />
                  ) : null}
                </g>
                <g data-slot="graph-nodes">
                  {current.nodes.map((node) => (
                    <GraphNodeCard
                      key={node.id}
                      node={node}
                      selected={state.selection.includes(node.id)}
                      readOnly={readOnly}
                      armedPort={pending?.from ?? null}
                      feedback={pending ? feedbackFor(node.id) : undefined}
                      onPointerDown={handleNodePointerDown(node.id)}
                      onKeyDown={handleNodeKeyDown(node.id)}
                      onPortPointerDown={(side, port, event) => handlePortPointerDown(side, port, node.id, event)}
                      onPortActivate={(side, port) => {
                        if (side === 'output') {
                          setPending(pending?.from.node === node.id && pending.from.port === port.id ? null : { from: { node: node.id, port: port.id }, pointer: null });
                          dispatch({ type: 'clearError' });
                        } else if (pending) completeConnection({ node: node.id, port: port.id });
                      }}
                    />
                  ))}
                </g>
                {marquee ? <rect data-slot="graph-marquee" x={marquee.x} y={marquee.y} width={marquee.width} height={marquee.height} strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" className="pointer-events-none fill-info-background/40 stroke-info-foreground-strong" /> : null}
              </g>
            </svg>
          </div>

          {empty ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <p className="max-w-xs text-center text-sm text-muted-foreground">{readOnly ? 'This graph has no nodes.' : 'The canvas is empty. Add a node from the list on the left, then drag from its output port to connect it.'}</p>
            </div>
          ) : null}

          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-2 p-3">
            {message ? (
              <p role="alert" data-slot="graph-validation" className="pointer-events-auto flex items-center gap-2 rounded-md bg-critical-background px-3 py-1.5 text-sm text-critical-foreground">
                {message}
                {!hoverVerdict && state.error ? (
                  <Button variant="ghost" size="icon-sm" aria-label="Dismiss message" onClick={() => dispatch({ type: 'clearError' })}>
                    <IconX />
                  </Button>
                ) : null}
              </p>
            ) : null}
            {!readOnly && selectedNodes.length > 1 ? (
              <div role="toolbar" aria-label="Selection" data-slot="graph-selection-toolbar" className="pointer-events-auto flex items-center gap-1 rounded-lg border border-default bg-base-background p-1">
                <span className="px-2 text-sm text-base-foreground tabular-nums">{selectedNodes.length} selected</span>
                {toolButton('Duplicate selection', <IconCopy />, () => dispatch({ type: 'duplicate' }))}
                {toolButton('Delete selection', <IconTrash />, () => dispatch({ type: 'deleteSelection' }))}
              </div>
            ) : null}
          </div>

          {compact ? null : (
            <div className="pointer-events-none absolute bottom-3 left-3 flex items-end gap-3">
              <ViewportMiniMap world={graphBoundsPadded(current)} viewport={visibleRect(viewport, size)} label={`Mini-map of ${label}`} onRecentre={(point) => setViewport(centreOn(point, size, viewport.k))} className="pointer-events-auto">
                {current.nodes.map((node) => {
                  const rect = nodeRect(node);
                  return <rect key={node.id} x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={6} className={state.selection.includes(node.id) ? 'fill-base-foreground' : 'fill-medium-foreground'} />;
                })}
              </ViewportMiniMap>
            </div>
          )}
        </div>

        {!compact && single ? (
          <div className="w-80 max-w-[45%] shrink-0">
            <NodeInspector
              node={single}
              connections={current.edges.filter((edge) => edge.from.node === single.id || edge.to.node === single.id).length}
              readOnly={readOnly}
              onRename={(title) => dispatch({ type: 'updateNode', id: single.id, patch: { title } })}
              onDetail={(detail) => dispatch({ type: 'updateNode', id: single.id, patch: { detail } })}
              onRunState={(runState) => dispatch({ type: 'setRunState', id: single.id, state: runState, error: runState === 'failed' ? 'The node reported an error.' : undefined })}
              onDuplicate={() => dispatch({ type: 'duplicate' })}
              onDelete={() => dispatch({ type: 'deleteSelection' })}
              onClose={() => dispatch({ type: 'clearSelection' })}
            />
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-default px-3 py-1.5 text-xs text-muted-foreground">
        {compact ? null : <PortTypeLegend />}
        <span className="min-w-0 truncate">{pending ? 'Choose an input port to finish the connection, or press Escape.' : readOnly ? 'Drag to pan. Scroll while focused to move the view.' : 'Drag empty space to pan, Shift-drag to select several.'}</span>
        <span role="status" aria-label="Editor activity" aria-live="polite" className="ml-auto shrink-0 tabular-nums">
          {state.message}
        </span>
      </div>
    </div>
  );
}

/** The graph's bounds with air around it, as the mini-map's world. */
function graphBoundsPadded(graph: GraphData): Rect {
  const bounds = graphBounds(graph.nodes);
  return { x: bounds.x - 64, y: bounds.y - 64, width: Math.max(bounds.width + 128, NODE_WIDTH), height: Math.max(bounds.height + 128, nodeHeight({ inputs: [], outputs: [] })) };
}
