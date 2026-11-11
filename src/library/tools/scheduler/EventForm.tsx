import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { IconAlertTriangle } from '@cognite/aura/icons';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { FormField } from '../../forms/FormField';
import { FormActions } from '../../patterns/data-entry/FormActions';
import { OptionSelect } from '../../patterns/data-entry/OptionSelect';
import type { SelectOption } from '../../patterns/data-entry/OptionSelect';

import type { Conflict } from './conflicts';
import { formatClock, formatDuration, parseClock } from './timeMath';

export type EventFormValues = {
  title: string;
  dayId: string;
  resourceId: string;
  start: number;
  end: number;
};

export type EventFormProps = {
  initial: EventFormValues;
  days: readonly SelectOption[];
  crews: readonly SelectOption[];
  /** Conflicts the entered values would cause, shown live under the fields. */
  conflictsFor: (values: EventFormValues) => readonly Conflict[];
  onSubmit: (values: EventFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
  /** Focus the title when the form opens. */
  autoFocus?: boolean;
};

/**
 * The fields of a new job: title, day, crew, start and end. Shows the conflicts the current values
 * would cause but still lets the planner schedule it, since a double booking is sometimes the plan.
 * Also the keyboard path for creating an item without dragging.
 */
export function EventForm({ initial, days, crews, conflictsFor, onSubmit, onCancel, submitLabel = 'Schedule job', autoFocus = false }: EventFormProps) {
  const [title, setTitle] = useState(initial.title);
  const [dayId, setDayId] = useState(initial.dayId);
  const [resourceId, setResourceId] = useState(initial.resourceId);
  const [start, setStart] = useState(formatClock(initial.start));
  const [end, setEnd] = useState(formatClock(initial.end));
  const [attempted, setAttempted] = useState(false);

  const startMinutes = parseClock(start);
  const endMinutes = parseClock(end);
  const timeError = startMinutes === null || endMinutes === null ? 'Enter times as HH:MM' : endMinutes <= startMinutes ? 'The end must be after the start' : null;
  const titleError = attempted && title.trim() === '' ? 'Name the job to schedule it' : undefined;
  const values: EventFormValues | null = startMinutes !== null && endMinutes !== null && endMinutes > startMinutes ? { title: title.trim(), dayId, resourceId, start: startMinutes, end: endMinutes } : null;
  const conflicts = values ? conflictsFor(values) : [];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    if (title.trim() === '' || values === null) return;
    onSubmit(values);
  };

  return (
    <form noValidate onSubmit={submit} className="flex w-full flex-col gap-3">
      <FormField label="Job" required error={titleError}>
        {(control) => <Input {...control} autoFocus={autoFocus} placeholder="Replace seal, export pump A" value={title} onChange={(event) => setTitle(event.target.value)} />}
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Day">{(control) => <OptionSelect {...control} size="sm" options={days} value={dayId} onValueChange={setDayId} />}</FormField>
        <FormField label="Crew">{(control) => <OptionSelect {...control} size="sm" options={crews} value={resourceId} onValueChange={setResourceId} />}</FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Starts" error={attempted ? (timeError ?? undefined) : undefined}>
          {(control) => <Input {...control} type="time" step={900} value={start} onChange={(event) => setStart(event.target.value)} />}
        </FormField>
        <FormField label="Ends" helper={values ? formatDuration(values.end - values.start) : undefined}>
          {(control) => <Input {...control} type="time" step={900} value={end} onChange={(event) => setEnd(event.target.value)} />}
        </FormField>
      </div>
      {conflicts.length > 0 ? (
        <ul aria-label="Conflicts" className="flex flex-col gap-1">
          {conflicts.map((conflict) => (
            <li key={conflict.message} className="flex items-start gap-1.5 text-xs text-warning-foreground-strong">
              <IconAlertTriangle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              <span>{conflict.message}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <FormActions label="Job actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </FormActions>
    </form>
  );
}
