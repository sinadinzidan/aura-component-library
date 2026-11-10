import { useId } from 'react';
import type { ReactNode } from 'react';

/** Props to spread on the row's control so it is named and described by the row's text. */
export type SettingRowControlProps = {
  id: string;
  'aria-describedby'?: string;
  disabled?: boolean;
};

type SettingRowProps = {
  label: string;
  /** What the setting does, in one short sentence. */
  description?: ReactNode;
  /** When set, the control is disabled and this sentence replaces the description. */
  disabledReason?: string;
  /**
   * The control at the end of the row: a select, a button, a value. Spread the given props on
   * a form control; a plain button can ignore them.
   */
  children: (control: SettingRowControlProps) => ReactNode;
};

/**
 * One line of a settings list for anything that is not a switch: label and description at the
 * start, the control at the end. The label is wired to the control, and a disabled row says why.
 */
export function SettingRow({ label, description, disabledReason, children }: SettingRowProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const disabled = disabledReason !== undefined;
  const supportingText = disabledReason ?? description;

  return (
    <div className="flex w-full items-center justify-between gap-4 py-3" data-disabled={disabled ? 'true' : undefined}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <label
          htmlFor={id}
          className={
            disabled ? 'text-sm font-medium text-base-foreground-disabled' : 'text-sm font-medium text-base-foreground'
          }
        >
          {label}
        </label>
        {supportingText ? (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {supportingText}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {children({
          id,
          'aria-describedby': supportingText ? descriptionId : undefined,
          disabled: disabled ? true : undefined,
        })}
      </div>
    </div>
  );
}
