import { Badge } from '@cognite/aura/components/badge';
import { IconAlertTriangle, IconArrowDown, IconArrowUp, IconCopy, IconGripVertical, IconTrash } from '@cognite/aura/icons';
import { useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

import { cn } from '../../../lib/utils';
import { IconAction } from '../../patterns/collections/IconAction';

import { FormFieldControl } from './FormFieldControl';
import { describeRule, dropIndex, fieldTypeLabel } from './formSchema';
import type { FormSchema } from './formSchema';

type FormCanvasProps = {
  schema: FormSchema;
  selectedId: string | null;
  /** Problems with the form itself, by field id, from `validateSchema`. */
  problems?: Readonly<Record<string, string>>;
  onSelect: (id: string) => void;
  /** Moves a field to an absolute position. */
  onMove: (id: string, to: number) => void;
  onMoveBy: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  /** Shown when the form has no fields. */
  empty?: string;
};

/**
 * The form being built. Each field is drawn with its real control, inert, inside a row you can
 * select. A selected row shows move up, move down, duplicate and delete; the grip reorders by
 * pointer drag or with the arrow keys. A field with a problem says what is wrong under it.
 */
export function FormCanvas({ schema, selectedId, problems = {}, onSelect, onMove, onMoveBy, onRemove, onDuplicate, empty = 'Add a field from the palette to start.' }: FormCanvasProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  if (schema.fields.length === 0) {
    return (
      <div data-slot="canvas-empty" className="flex w-full flex-col items-center gap-1 rounded-xl border border-dashed border-emphasized px-6 py-12 text-center">
        <p className="text-sm font-medium text-base-foreground">This form has no fields</p>
        <p className="text-sm text-muted-foreground">{empty}</p>
      </div>
    );
  }

  const middles = (): number[] =>
    Array.from(listRef.current?.querySelectorAll<HTMLElement>('[data-field-row]') ?? [], (row) => {
      const rect = row.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });

  const onGripMove = (id: string, event: PointerEvent<HTMLElement>) => {
    if (dragging !== id) return;
    const from = schema.fields.findIndex((field) => field.id === id);
    const to = dropIndex(middles(), event.clientY, from);
    if (to !== from) onMove(id, to);
  };

  const onGripKey = (id: string, event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      onMoveBy(id, event.key === 'ArrowUp' ? -1 : 1);
    }
  };

  return (
    <ul ref={listRef} aria-label={`${schema.title} fields`} data-slot="form-canvas" className="flex w-full flex-col gap-2">
      {schema.fields.map((field, index) => {
        const selected = field.id === selectedId;
        const problem = problems[field.id];
        const isDragging = dragging === field.id;
        return (
          <li
            key={field.id}
            data-field-row
            data-selected={selected ? 'true' : undefined}
            data-invalid={problem ? 'true' : undefined}
            className={cn(
              'group/row relative flex gap-2 rounded-xl border p-3',
              selected ? 'border-primary-background bg-card-background' : problem ? 'border-critical-foreground-strong' : 'border-transparent hover:border-default hover:bg-card-background',
              isDragging ? 'opacity-80' : undefined,
            )}
          >
            <button
              type="button"
              aria-label={`Reorder ${field.label}. Arrow keys move it.`}
              aria-describedby={undefined}
              className="flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-base-background-hover focus-visible:shadow-focus-ring active:cursor-grabbing"
              onKeyDown={(event) => onGripKey(field.id, event)}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.currentTarget.setPointerCapture?.(event.pointerId);
                onSelect(field.id);
                setDragging(field.id);
              }}
              onPointerMove={(event) => onGripMove(field.id, event)}
              onPointerUp={() => setDragging(null)}
              onPointerCancel={() => setDragging(null)}
            >
              <IconGripVertical aria-hidden className="size-4" />
            </button>
            <div
              role="button"
              tabIndex={0}
              aria-label={`Edit ${field.label}, ${fieldTypeLabel(field.type)} field ${index + 1} of ${schema.fields.length}`}
              aria-pressed={selected}
              className="flex min-w-0 flex-1 cursor-pointer flex-col gap-2 rounded-md outline-none focus-visible:shadow-focus-ring"
              onClick={() => onSelect(field.id)}
              onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  onSelect(field.id);
                }
              }}
            >
              <div className="pointer-events-none min-w-0" ref={(node) => node?.setAttribute('inert', '')}>
                <FormFieldControl field={field} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{fieldTypeLabel(field.type)}</Badge>
                {field.showWhen ? <span className="text-xs text-muted-foreground">{describeRule(field.showWhen, schema.fields)}</span> : null}
                {problem ? (
                  <span role="alert" className="flex items-center gap-1 text-xs font-medium text-critical-foreground-strong">
                    <IconAlertTriangle aria-hidden className="size-3.5" /> {problem}
                  </span>
                ) : null}
              </div>
            </div>
            <div className={cn('flex shrink-0 items-start gap-0.5', selected ? 'visible' : 'invisible group-hover/row:visible group-focus-within/row:visible')}>
              <IconAction label={index === 0 ? 'Already first' : `Move ${field.label} up`} disabled={index === 0} onClick={() => onMoveBy(field.id, -1)}>
                <IconArrowUp />
              </IconAction>
              <IconAction label={index === schema.fields.length - 1 ? 'Already last' : `Move ${field.label} down`} disabled={index === schema.fields.length - 1} onClick={() => onMoveBy(field.id, 1)}>
                <IconArrowDown />
              </IconAction>
              <IconAction label={`Duplicate ${field.label}`} onClick={() => onDuplicate(field.id)}>
                <IconCopy />
              </IconAction>
              <IconAction label={`Delete ${field.label}`} onClick={() => onRemove(field.id)}>
                <IconTrash />
              </IconAction>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
