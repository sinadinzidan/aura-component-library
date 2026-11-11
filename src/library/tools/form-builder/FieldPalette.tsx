import { Button } from '@cognite/aura/components/button';
import {
  IconAbc,
  IconAlignLeft,
  IconCalendar,
  IconCheckbox,
  IconHeading,
  IconNumber123,
  IconSelector,
  IconToggleLeft,
  IconCircleDot,
} from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { FIELD_TYPES } from './formSchema';
import type { FieldType } from './formSchema';

const ICONS: Record<FieldType, ReactNode> = {
  text: <IconAbc />,
  number: <IconNumber123 />,
  select: <IconSelector />,
  checkbox: <IconCheckbox />,
  radio: <IconCircleDot />,
  switch: <IconToggleLeft />,
  date: <IconCalendar />,
  textarea: <IconAlignLeft />,
  heading: <IconHeading />,
};

type FieldPaletteProps = {
  onAdd: (type: FieldType) => void;
  /** Locks the palette and says why. */
  disabledReason?: string;
};

/**
 * The field types a form can be built from. Each row has its own Add button, so building never
 * depends on dragging; new fields join the end of the form and are selected for editing.
 */
export function FieldPalette({ onAdd, disabledReason }: FieldPaletteProps) {
  return (
    <div data-slot="field-palette" className="flex w-full flex-col gap-2">
      {disabledReason ? <p className="text-xs text-muted-foreground">{disabledReason}</p> : null}
      <ul aria-label="Field types" className="flex flex-col gap-1">
        {FIELD_TYPES.map((entry) => (
          <li key={entry.type} className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="h-auto min-w-0 flex-1 justify-start py-2 text-left"
              aria-label={`Add ${entry.label} field`}
              disabled={disabledReason !== undefined}
              onClick={() => onAdd(entry.type)}
            >
              <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted-background text-medium-foreground [&_svg]:size-4">
                {ICONS[entry.type]}
              </span>
              <span className="flex min-w-0 flex-col items-start">
                <span className="text-sm font-medium text-base-foreground">{entry.label}</span>
                <span className="text-xs font-normal whitespace-normal text-muted-foreground">{entry.description}</span>
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
