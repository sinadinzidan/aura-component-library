import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverHeaderContent,
  PopoverSlot,
  PopoverTitle,
  PopoverTrigger,
} from '@cognite/aura/components/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconSettings } from '@cognite/aura/icons';
import { useState } from 'react';

import { FormField } from '../../forms/FormField';
import { OptionSelect } from '../../patterns/data-entry/OptionSelect';
import type { SelectOption } from '../../patterns/data-entry/OptionSelect';

export type WidgetSizePreset = { id: string; label: string; w: number; h: number };

export type WidgetSettingsValue = { title: string; w: number; h: number; range: string };

type WidgetSettingsPopoverProps = {
  /** Current settings of the widget. */
  value: WidgetSettingsValue;
  sizes: readonly WidgetSizePreset[];
  /** Time ranges to offer. Leave out for widgets that do not cover a period. */
  ranges?: readonly SelectOption[];
  /** Called with the edited settings when the user applies them. */
  onApply: (value: WidgetSettingsValue) => void;
  /** Open on first render, for documentation and tests. */
  defaultOpen?: boolean;
};

const CUSTOM = 'custom';

/**
 * The per-widget settings behind the cog button: title, a size preset and the time range. Edits
 * are a draft until "Apply settings", so a half-typed title never reaches the dashboard and the
 * whole edit is one undo step.
 */
export function WidgetSettingsPopover({ value, sizes, ranges, onApply, defaultOpen = false }: WidgetSettingsPopoverProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState(value);

  const matching = sizes.find((size) => size.w === draft.w && size.h === draft.h);
  const sizeOptions: SelectOption[] = [
    ...sizes.map((size) => ({ value: size.id, label: `${size.label} · ${size.w} × ${size.h}` })),
    ...(matching ? [] : [{ value: CUSTOM, label: `Custom · ${draft.w} × ${draft.h}` }]),
  ];
  const title = draft.title.trim();

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(value);
        setOpen(next);
      }}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label={`Edit settings for ${value.title}`}>
                  <IconSettings />
                </Button>
              }
            />
          }
        />
        <TooltipContent>Widget settings</TooltipContent>
      </Tooltip>
      <PopoverContent align="end">
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>Widget settings</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
        </PopoverHeader>
        <PopoverSlot>
          <form
            className="flex w-64 flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (title === '') return;
              onApply({ ...draft, title });
              setOpen(false);
            }}
          >
            <FormField label="Title" error={title === '' ? 'Enter a title.' : undefined}>
              {(control) => <Input {...control} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />}
            </FormField>
            <FormField label="Size" helper="Columns × rows on the 12-column grid.">
              {(control) => (
                <OptionSelect
                  id={control.id}
                  aria-describedby={control['aria-describedby']}
                  options={sizeOptions}
                  value={matching?.id ?? CUSTOM}
                  onValueChange={(id) => {
                    const size = sizes.find((entry) => entry.id === id);
                    if (size) setDraft({ ...draft, w: size.w, h: size.h });
                  }}
                />
              )}
            </FormField>
            {ranges && ranges.length > 0 ? (
              <FormField label="Time range">
                {(control) => <OptionSelect id={control.id} options={ranges} value={draft.range} onValueChange={(range) => setDraft({ ...draft, range })} />}
              </FormField>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={title === ''}>
                Apply settings
              </Button>
            </div>
          </form>
        </PopoverSlot>
      </PopoverContent>
    </Popover>
  );
}
