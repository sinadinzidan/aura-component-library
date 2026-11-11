import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Separator } from '@cognite/aura/components/separator';
import { Toggle } from '@cognite/aura/components/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconArrowBackUp, IconLock, IconMapPinPlus, IconTrash } from '@cognite/aura/icons';
import { useEffect, useId, useMemo, useReducer, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';

import { cn } from '../../../lib/utils';
import { polylinePath } from '../../industrial/diagrams/diagramGeometry';
import { valvePositionStatus } from '../../industrial/diagrams/symbolState';
import { formatReading, runStateStatus } from '../../industrial/status';
import type { StatusDescriptor } from '../../industrial/status';
import { ViewerToolbar } from '../../industrial/workflows/ViewerToolbar';
import { SidePanel } from '../../patterns/structure/SidePanel';

import { PidCanvas } from './PidCanvas';
import { PidLayerToggles } from './PidLayerToggles';
import { alarmsFor, documentsFor, equipmentBounds, readingState, tagRefs } from './pidModel';
import type { PidAlarm, PidDocument, PidDrawing, PidInstrument, PidLayers, PidPin, PidTagRef } from './pidModel';
import { KEY_PAN, initPidState, pidReducer, pinNumber } from './pidReducer';
import type { PidSelection } from './pidReducer';
import { PidTagPanel } from './PidTagPanel';
import type { PidPanelReading } from './PidTagPanel';
import { PidTagSearch } from './PidTagSearch';
import { PidTitleBlock } from './PidTitleBlock';
import { useViewportFlight } from './useViewportFlight';
import { centreOn, isRectVisible, toWorld, visibleRect, zoomPercent } from './viewport';
import type { ViewSize } from './viewport';
import { ViewportMiniMap } from './ViewportMiniMap';

export type PidViewerProps = {
  drawing: PidDrawing;
  /** Live value per instrument id. `null` is a lost signal. */
  readings?: Readonly<Record<string, number | null>>;
  /** Recent values per instrument id, oldest first, for the trend in the tag panel. */
  trends?: Readonly<Record<string, readonly number[]>>;
  alarms?: readonly PidAlarm[];
  documents?: readonly PidDocument[];
  /** Hides the pin tools. Tags stay clickable and the view still pans and zooms. */
  readOnly?: boolean;
  /** `compact` is the viewer embedded in a card: zoom controls only, the selection in one line. */
  variant?: 'full' | 'compact';
  initialLayers?: Partial<PidLayers>;
  initialSelection?: PidSelection;
  initialPins?: readonly PidPin[];
  /** `false` jumps instead of flying to a tag. */
  animate?: boolean;
  onOpenDocument?: (document: PidDocument) => void;
  className?: string;
};

/** Pointer travel, in pixels, before a press becomes a pan instead of a click. */
const DRAG_THRESHOLD = 4;
/** Scale a fly-to zooms in to, unless the view is already closer. */
const FOCUS_SCALE = 1.4;

const isTypingTarget = (target: EventTarget): boolean => target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

function panelReading(instrument: PidInstrument, readings: Readonly<Record<string, number | null>>): PidPanelReading {
  return { id: instrument.id, tag: instrument.tag, name: instrument.name, value: readings[instrument.id] ?? null, unit: instrument.unit, decimals: instrument.decimals, limits: instrument.limits };
}

/**
 * A working P&ID viewer. Drag to pan, zoom about the pointer with the wheel, the buttons or the
 * keyboard, find a tag and fly to it, and click a tag, a line or a pin to read about it in the
 * side panel. Layers switch lines, instruments, live values, alarms and annotations; a mini-map
 * keeps the bearings; pins can be added, noted, removed and undone. Give it a height from its
 * container. All state is local: the drawing, readings, alarms and documents come in as props.
 */
export function PidViewer({
  drawing,
  readings = {},
  trends = {},
  alarms = [],
  documents = [],
  readOnly = false,
  variant = 'full',
  initialLayers,
  initialSelection = null,
  initialPins,
  animate = true,
  onOpenDocument,
  className,
}: PidViewerProps) {
  const compact = variant === 'compact';
  const world = useMemo(() => ({ x: 0, y: 0, width: drawing.width, height: drawing.height }), [drawing.width, drawing.height]);
  const [state, dispatch] = useReducer(pidReducer, { world, layers: initialLayers, selection: initialSelection, pins: initialPins }, initPidState);
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const viaPointer = useRef(false);
  const flightSize = useRef<ViewSize>(state.size);
  const noteId = useId();
  const refs = useMemo(() => tagRefs(drawing), [drawing]);

  const { fly, cancel } = useViewportFlight(
    (viewport) => {
      const rect = visibleRect(viewport, flightSize.current);
      dispatch({ type: 'lookAt', centre: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }, k: viewport.k });
    },
    { animate }
  );

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return undefined;
    const measure = () => {
      const box = element.getBoundingClientRect();
      if (box.width > 0 && box.height > 0) dispatch({ type: 'resize', size: { width: box.width, height: box.height } });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return undefined;
    // The wheel scrolls the page until the viewer is in use; then it zooms about the pointer.
    const onWheel = (event: WheelEvent) => {
      const active = rootRef.current?.contains(document.activeElement) ?? false;
      if (!active && !event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      cancel();
      const box = element.getBoundingClientRect();
      dispatch({ type: 'zoomBy', factor: Math.exp(-event.deltaY * 0.0015), anchor: { x: event.clientX - box.left, y: event.clientY - box.top } });
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [cancel]);

  const flyTo = (ref: PidTagRef) => {
    flightSize.current = state.size;
    fly(state.viewport, centreOn(ref.centre, state.size, Math.max(state.viewport.k, FOCUS_SCALE)), state.size);
  };

  const select = (selection: NonNullable<PidSelection>) => {
    if (selection.kind === 'tag') {
      const ref = refs.find((candidate) => candidate.id === selection.id);
      dispatch({ type: 'select', selection, announce: ref ? `Showing ${ref.tag}, ${ref.name}` : undefined });
    } else if (selection.kind === 'line') {
      const line = drawing.lines.find((candidate) => candidate.id === selection.id);
      dispatch({ type: 'select', selection, announce: line ? `Line ${line.number} selected` : undefined });
    } else {
      dispatch({ type: 'select', selection, announce: 'Pin selected' });
    }
  };

  const pickFromSearch = (ref: PidTagRef) => {
    select({ kind: 'tag', id: ref.id });
    flyTo(ref);
  };

  const focusTag = (id: string) => {
    if (viaPointer.current) return;
    const ref = refs.find((candidate) => candidate.id === id);
    if (ref && !isRectVisible(state.viewport, state.size, ref.bounds, 8)) dispatch({ type: 'lookAt', centre: ref.centre, announce: `${ref.tag} brought into view` });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    viaPointer.current = true;
    cancel();
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      current.moved = true;
      suppressClick.current = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setDragging(true);
    }
    dispatch({ type: 'pan', dx, dy });
    current.x = event.clientX;
    current.y = event.clientY;
  };

  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      event.stopPropagation();
      return;
    }
    if (state.pinMode) {
      event.stopPropagation();
      const box = event.currentTarget.getBoundingClientRect();
      const point = toWorld(state.viewport, { x: event.clientX - box.left, y: event.clientY - box.top });
      dispatch({ type: 'addPin', x: point.x, y: point.y });
    }
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const onMark = event.target instanceof Element && event.target.closest('[role="button"]') !== null;
    if (!onMark && state.selection) dispatch({ type: 'select', selection: null });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isTypingTarget(event.target)) return;
    viaPointer.current = false;
    const pan: Record<string, { dx: number; dy: number }> = {
      ArrowLeft: { dx: KEY_PAN, dy: 0 },
      ArrowRight: { dx: -KEY_PAN, dy: 0 },
      ArrowUp: { dx: 0, dy: KEY_PAN },
      ArrowDown: { dx: 0, dy: -KEY_PAN },
    };
    if (pan[event.key]) {
      event.preventDefault();
      cancel();
      dispatch({ type: 'pan', ...pan[event.key] });
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      dispatch({ type: 'zoom', direction: 1 });
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      dispatch({ type: 'zoom', direction: -1 });
    } else if (event.key === '0') {
      event.preventDefault();
      dispatch({ type: 'fit' });
    } else if (event.key === 'Escape') {
      if (state.pinMode) dispatch({ type: 'setPinMode', on: false });
      else if (state.selection) dispatch({ type: 'select', selection: null });
    } else if (event.key === 'Enter' && state.pinMode && event.target === event.currentTarget) {
      event.preventDefault();
      const centre = toWorld(state.viewport, { x: state.size.width / 2, y: state.size.height / 2 });
      dispatch({ type: 'addPin', x: centre.x, y: centre.y });
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && !readOnly && state.selection?.kind === 'pin') {
      event.preventDefault();
      dispatch({ type: 'removePin', id: state.selection.id });
    } else if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey) && !readOnly) {
      event.preventDefault();
      dispatch({ type: 'undoPins' });
    }
  };

  const { viewport, selection, layers } = state;
  const selectedRef = selection?.kind === 'tag' ? refs.find((ref) => ref.id === selection.id) : undefined;
  const selectedLine = selection?.kind === 'line' ? drawing.lines.find((line) => line.id === selection.id) : undefined;
  const selectedPin = selection?.kind === 'pin' ? state.pins.find((pin) => pin.id === selection.id) : undefined;
  const selectedInstrument = selectedRef?.kind === 'instrument' ? drawing.instruments.find((item) => item.id === selectedRef.id) : undefined;
  const selectedEquipment = selectedRef?.kind === 'equipment' ? drawing.equipment.find((item) => item.id === selectedRef.id) : undefined;
  const selectedValve = selectedRef?.kind === 'valve' ? drawing.valves.find((item) => item.id === selectedRef.id) : undefined;
  const status: StatusDescriptor | undefined = selectedEquipment ? runStateStatus(selectedEquipment.state) : selectedValve ? valvePositionStatus(selectedValve.position) : undefined;
  const close = () => dispatch({ type: 'select', selection: null });

  let panel = null;
  if (!compact && selectedRef) {
    panel = (
      <PidTagPanel
        tag={selectedRef}
        status={status}
        reading={selectedInstrument ? panelReading(selectedInstrument, readings) : undefined}
        trend={selectedInstrument ? trends[selectedInstrument.id] : undefined}
        measurements={selectedEquipment ? drawing.instruments.filter((item) => item.equipmentId === selectedEquipment.id).map((item) => panelReading(item, readings)) : []}
        alarms={alarmsFor(alarms, selectedRef.id)}
        documents={documentsFor(documents, selectedRef.id)}
        onClose={close}
        onSelectTag={(id) => {
          const ref = refs.find((candidate) => candidate.id === id);
          if (ref) pickFromSearch(ref);
        }}
        onOpenDocument={onOpenDocument}
      />
    );
  } else if (!compact && selectedLine) {
    panel = (
      <SidePanel title={selectedLine.number} description={`${selectedLine.service} · Line`} onClose={close} frame="edge">
        <dl className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 gap-y-3 text-sm">
          <dt className="text-muted-foreground">Service</dt>
          <dd className="text-base-foreground">{selectedLine.service}</dd>
          <dt className="text-muted-foreground">Line class</dt>
          <dd className="text-base-foreground">{selectedLine.weight === 'heavy' ? 'Main process' : selectedLine.weight === 'light' ? 'Utility or signal' : 'Secondary process'}</dd>
          <dt className="text-muted-foreground">Flow</dt>
          <dd className="text-base-foreground">{selectedLine.flow ? 'Direction marked on the line' : 'Not marked'}</dd>
          <dt className="text-muted-foreground">Drawing</dt>
          <dd className="font-mono text-base-foreground">{drawing.number}</dd>
        </dl>
      </SidePanel>
    );
  } else if (!compact && selectedPin) {
    panel = (
      <SidePanel
        title={`Pin ${pinNumber(selectedPin)}`}
        description="Annotation on this drawing"
        onClose={close}
        frame="edge"
        footer={
          readOnly ? undefined : (
            <Button variant="destructive" onClick={() => dispatch({ type: 'removePin', id: selectedPin.id })}>
              <IconTrash /> Remove pin
            </Button>
          )
        }
      >
        <div className="flex flex-col">
          <Label htmlFor={noteId}>Note</Label>
          <Input
            id={noteId}
            value={selectedPin.note}
            readOnly={readOnly}
            placeholder="What should the next person know"
            onChange={(event) => dispatch({ type: 'editPin', id: selectedPin.id, note: event.target.value })}
          />
          <p className="pt-3 text-xs text-muted-foreground tabular-nums">
            Position {selectedPin.x}, {selectedPin.y} on sheet {drawing.sheet}.
          </p>
        </div>
      </SidePanel>
    );
  }

  const compactSummary = (() => {
    if (!compact) return null;
    if (selectedInstrument) {
      const value = readings[selectedInstrument.id] ?? null;
      const reading = readingState(value, selectedInstrument.limits);
      return `${selectedInstrument.tag} · ${selectedInstrument.name} · ${formatReading(value, selectedInstrument.unit, selectedInstrument.decimals)}${reading.flag ? ` ${reading.flag}` : ''}`;
    }
    if (selectedRef) return `${selectedRef.tag} · ${selectedRef.name}${status ? ` · ${status.label}` : ''}`;
    if (selectedLine) return `${selectedLine.number} · ${selectedLine.service}`;
    return null;
  })();

  const hint = state.pinMode ? 'Click the drawing to place the pin, or press Escape to cancel.' : 'Drag to pan. Click the drawing, then scroll to zoom. Tab steps through tags.';

  return (
    <div
      ref={rootRef}
      data-slot="pid-viewer"
      data-variant={variant}
      className={cn('flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border border-default bg-base-background', className)}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-default px-3 py-2">
        {compact ? (
          <div className="flex min-w-0 flex-1 items-baseline gap-2">
            <span className="font-mono text-sm font-medium text-base-foreground">{drawing.number}</span>
            <span className="truncate text-xs text-muted-foreground">
              Rev {drawing.revision} · {drawing.title}
            </span>
          </div>
        ) : (
          <>
            <PidTagSearch drawing={drawing} onPick={pickFromSearch} className="w-52 shrink-0" />
            <PidLayerToggles
              layers={layers}
              onToggle={(layer) => dispatch({ type: 'toggleLayer', layer })}
              alarmCount={alarms.length}
              annotationCount={state.pins.length + drawing.notes.length}
            />
            <span className="flex-1" />
          </>
        )}
        {readOnly ? (
          <Badge variant="secondary">
            <IconLock aria-hidden="true" /> Read-only
          </Badge>
        ) : compact ? null : (
          <div className="flex items-center gap-1">
            <Toggle size="sm" pressed={state.pinMode} onPressedChange={(on) => dispatch({ type: 'setPinMode', on })} icon={<IconMapPinPlus />} label="Add pin" />
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Undo pin change" disabled={state.pinPast.length === 0} onClick={() => dispatch({ type: 'undoPins' })}>
                    <IconArrowBackUp />
                  </Button>
                }
              />
              <TooltipContent>Undo pin change</TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
          </div>
        )}
        <ViewerToolbar
          zoom={zoomPercent(viewport)}
          onZoomChange={(percent) => {
            cancel();
            dispatch({ type: 'zoomTo', percent });
          }}
          onFit={() => {
            cancel();
            dispatch({ type: 'fit' });
          }}
          range={{ min: state.limits.min * 100, max: state.limits.max * 100 }}
          label="Zoom"
        />
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-h-0 min-w-0 flex-1 bg-muted-background">
          {/* A canvas tool: pointer and key handlers live on the focusable group, with every action also on a button. */}
          <div
            ref={canvasRef}
            role="group"
            tabIndex={0}
            aria-label={`${drawing.number}, ${drawing.title}. Arrow keys pan, plus and minus zoom, zero fits the drawing.`}
            data-slot="pid-viewport"
            data-pin-mode={state.pinMode}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClickCapture={handleClickCapture}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            style={{ overflow: 'hidden' }}
            className={cn(
              'absolute inset-0 touch-none outline-none select-none focus-visible:ring-2 focus-visible:ring-ring-default focus-visible:ring-inset',
              state.pinMode ? 'cursor-crosshair' : dragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
          >
            <svg width="100%" height="100%" fill="none" className="block">
              <g transform={`translate(${-viewport.x * viewport.k} ${-viewport.y * viewport.k}) scale(${viewport.k})`}>
                <PidCanvas drawing={drawing} readings={readings} alarms={alarms} layers={layers} selection={selection} pins={state.pins} onSelect={select} onFocusTag={focusTag} />
              </g>
            </svg>
          </div>

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
            <div className="flex items-start justify-between gap-3">
              {compact ? (
                <span />
              ) : (
                <p data-slot="pid-revision-stamp" className="flex items-baseline gap-2 rounded-md border border-default bg-base-background px-2 py-1 text-xs text-muted-foreground">
                  <span className="font-mono font-semibold text-base-foreground">REV {drawing.revision}</span>
                  <span>
                    {drawing.status} · {drawing.issuedOn}
                  </span>
                </p>
              )}
            </div>
            {compact ? null : (
              <div className="flex items-end justify-between gap-3">
                <ViewportMiniMap
                  world={world}
                  viewport={visibleRect(viewport, state.size)}
                  label={`Mini-map of ${drawing.number}`}
                  onRecentre={(point) => {
                    cancel();
                    dispatch({ type: 'lookAt', centre: point });
                  }}
                  className="pointer-events-auto"
                >
                  {drawing.lines.map((line) => (
                    <path key={line.id} d={polylinePath(line.points)} strokeWidth={line.weight === 'heavy' ? 1.5 : 1} vectorEffect="non-scaling-stroke" className="stroke-muted-foreground" />
                  ))}
                  {drawing.equipment.map((item) => {
                    const box = equipmentBounds(item);
                    const size = item.size ?? box.width;
                    return <rect key={item.id} x={item.x - size / 2} y={item.y - size / 2} width={size} height={size} rx={8} className="fill-medium-foreground" />;
                  })}
                </ViewportMiniMap>
                <PidTitleBlock drawing={drawing} className="hidden lg:grid" />
              </div>
            )}
          </div>
        </div>
        {panel ? <div className="w-80 max-w-[50%] shrink-0">{panel}</div> : null}
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-default px-3 py-1.5 text-xs text-muted-foreground">
        {compactSummary ? <span className="min-w-0 truncate font-medium text-base-foreground">{compactSummary}</span> : <span className="min-w-0 truncate">{hint}</span>}
        <span role="status" aria-live="polite" className="ml-auto shrink-0 tabular-nums">
          {state.message}
        </span>
      </div>
    </div>
  );
}
