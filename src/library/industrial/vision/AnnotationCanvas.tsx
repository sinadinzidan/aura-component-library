import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconArrowBackUp, IconMapPin, IconPointer, IconRectangle, IconTrash } from '@cognite/aura/icons';
import { useRef, useState } from 'react';
import type { Dispatch, KeyboardEvent, PointerEvent, ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { NUDGE_STEP, NUDGE_STEP_LARGE, describeShape, hitTest, isUsableRect, rectFromPoints, shapeCentre, shapeStyle, toNormalPoint } from './annotations';
import type { AnnotationAction, AnnotationState, NormalPoint } from './annotations';

export type AnnotationTool = 'select' | 'rect' | 'point';

export type AnnotationCanvasProps = {
  state: AnnotationState;
  dispatch: Dispatch<AnnotationAction>;
  /** The frame the annotations sit on. It should fill the canvas; it is the thing being marked up. */
  children: ReactNode;
  /** Label given to new annotations. */
  defaultLabel?: string;
  /** Turns drawing off, e.g. for a reviewer without edit rights. */
  readOnly?: boolean;
  className?: string;
};

const TOOLS: readonly { id: AnnotationTool; label: string; icon: ReactNode }[] = [
  { id: 'select', label: 'Select', icon: <IconPointer /> },
  { id: 'rect', label: 'Draw rectangle', icon: <IconRectangle /> },
  { id: 'point', label: 'Place point', icon: <IconMapPin /> },
];

/**
 * Marks up a frame with rectangles and points. Pointer: pick a tool, drag for a rectangle or click
 * for a point; with Select, click to pick and drag to move. Keyboard: Tab to the frame, press R for
 * a rectangle or P for a point at the centre, arrow keys to move the selection (Shift for bigger
 * steps), Alt + arrow to resize, Tab or Escape to leave, Delete to remove, Ctrl or Cmd + Z to undo.
 * Every change is announced.
 */
export function AnnotationCanvas({ state, dispatch, children, defaultLabel, readOnly = false, className }: AnnotationCanvasProps) {
  const [tool, setTool] = useState<AnnotationTool>('select');
  const [draft, setDraft] = useState<{ start: NormalPoint; end: NormalPoint } | null>(null);
  const [message, setMessage] = useState('');
  const surface = useRef<HTMLDivElement>(null);
  const moving = useRef<{ id: string; last: NormalPoint } | null>(null);
  const selected = state.items.find((item) => item.id === state.selectedId) ?? null;

  const pointFor = (event: PointerEvent<HTMLElement>): NormalPoint => {
    const bounds = surface.current?.getBoundingClientRect();
    return bounds ? toNormalPoint(event.clientX, event.clientY, bounds) : { x: 0, y: 0 };
  };

  const add = (shape: Parameters<typeof describeShape>[0]) => {
    dispatch({ type: 'add', shape, label: defaultLabel });
    setMessage(`Added. ${describeShape(shape)}.`);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const point = pointFor(event);
    event.currentTarget.focus({ preventScroll: true });
    if (tool === 'select') {
      const id = hitTest(state.items, point);
      dispatch({ type: 'select', id });
      if (id) {
        moving.current = { id, last: point };
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      return;
    }
    if (tool === 'point') {
      add({ kind: 'point', x: point.x, y: point.y });
      return;
    }
    setDraft({ start: point, end: point });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const point = pointFor(event);
    if (draft) setDraft({ ...draft, end: point });
    else if (moving.current) {
      dispatch({ type: 'move', id: moving.current.id, dx: point.x - moving.current.last.x, dy: point.y - moving.current.last.y });
      moving.current = { ...moving.current, last: point };
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (draft) {
      const rect = rectFromPoints(draft.start, pointFor(event));
      setDraft(null);
      if (isUsableRect(rect)) add(rect);
    }
    moving.current = null;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      dispatch({ type: 'undo' });
      setMessage('Undid the last change.');
      return;
    }
    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      add({ kind: 'rect', x: 0.4, y: 0.4, w: 0.2, h: 0.2 });
      return;
    }
    if (event.key === 'p' || event.key === 'P') {
      event.preventDefault();
      add({ kind: 'point', x: 0.5, y: 0.5 });
      return;
    }
    if (!selected) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      dispatch({ type: 'delete', id: selected.id });
      setMessage(`Deleted ${selected.label}.`);
      return;
    }
    if (event.key === 'Escape') {
      dispatch({ type: 'select', id: null });
      setMessage('Selection cleared.');
      return;
    }
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? NUDGE_STEP_LARGE : NUDGE_STEP;
    if (event.altKey) {
      dispatch({ type: 'resize', id: selected.id, dw: direction[0] * step, dh: direction[1] * step });
      setMessage(`Resized ${selected.label}.`);
    } else {
      dispatch({ type: 'move', id: selected.id, dx: direction[0] * step, dy: direction[1] * step });
      setMessage(`Moved ${selected.label}.`);
    }
  };

  const draftRect = draft ? rectFromPoints(draft.start, draft.end) : null;

  return (
    <div data-slot="annotation-canvas" className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      <div role="toolbar" aria-label="Annotation tools" className="flex flex-wrap items-center gap-1.5">
        {TOOLS.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger
              render={
                <Button variant={tool === item.id ? 'secondary' : 'ghost'} size="icon-sm" aria-label={item.label} aria-pressed={tool === item.id} disabled={readOnly} onClick={() => setTool(item.id)}>
                  {item.icon}
                </Button>
              }
            />
            <TooltipContent>{item.label}</TooltipContent>
          </Tooltip>
        ))}
        <span className="mx-1 h-4 w-px bg-border-default" aria-hidden="true" />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Undo" disabled={readOnly || state.history.length === 0} onClick={() => dispatch({ type: 'undo' })}>
                <IconArrowBackUp />
              </Button>
            }
          />
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Delete selected annotation" disabled={readOnly || !selected} onClick={() => selected && dispatch({ type: 'delete', id: selected.id })}>
                <IconTrash />
              </Button>
            }
          />
          <TooltipContent>Delete selected</TooltipContent>
        </Tooltip>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{state.items.length} annotations</span>
      </div>
      <div
        ref={surface}
        role="application"
        tabIndex={0}
        aria-label="Annotation frame. Press R to add a rectangle, P to add a point, arrow keys to move the selection, Alt and arrow keys to resize, Delete to remove."
        aria-roledescription="annotation canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          setDraft(null);
          moving.current = null;
        }}
        onKeyDown={onKeyDown}
        className={cn('relative touch-none overflow-hidden rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring-default)]', readOnly ? 'cursor-default' : tool === 'select' ? 'cursor-default' : 'cursor-crosshair')}
      >
        {children}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {state.items.map((item) => {
            const isSelected = item.id === state.selectedId;
            const style = shapeStyle(item.shape);
            const centre = shapeCentre(item.shape);
            return item.shape.kind === 'rect' ? (
              <div key={item.id} data-slot="annotation" data-selected={isSelected || undefined} className={cn('absolute rounded-xs border-2', isSelected ? 'border-[var(--primary-background)] bg-[color-mix(in_oklab,var(--primary-background)_14%,transparent)]' : 'border-base-foreground')} style={style}>
                <span className="absolute -top-6 left-[-2px] whitespace-nowrap rounded-xs bg-card-background px-1.5 py-1 text-xs font-medium leading-none text-base-foreground">{item.label}</span>
              </div>
            ) : (
              <div key={item.id} data-slot="annotation" data-selected={isSelected || undefined} className="absolute" style={{ left: `${centre.x * 100}%`, top: `${centre.y * 100}%` }}>
                <span className={cn('absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-card-background', isSelected ? 'border-[var(--primary-background)]' : 'border-base-foreground')} />
                <span className="absolute left-3 top-2 whitespace-nowrap rounded-xs bg-card-background px-1.5 py-1 text-xs font-medium leading-none text-base-foreground">{item.label}</span>
              </div>
            );
          })}
          {draftRect ? <div data-slot="annotation-draft" className="absolute rounded-xs border-2 border-dashed border-[var(--primary-background)]" style={shapeStyle(draftRect)} /> : null}
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {message}
      </p>
    </div>
  );
}
