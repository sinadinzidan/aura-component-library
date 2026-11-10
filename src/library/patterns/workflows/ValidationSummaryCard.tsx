import { IconAlertTriangle, IconCircleCheck, IconCircleX } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { validationVerdict } from './validationVerdict';
import type { ValidationCounts } from './validationVerdict';

export type ValidationSummaryCardProps = {
  /** Names the check: "Validation of nordkapp-tags.csv". */
  title: string;
  counts: ValidationCounts;
  /** Singular and plural noun for what is counted. */
  noun?: { one: string; other: string };
  /** Buttons at the end: review errors, download a report. */
  actions?: ReactNode;
};

const NUMBER = new Intl.NumberFormat('en-US');

const PARTS = [
  { key: 'valid', label: 'Ready', Icon: IconCircleCheck, text: 'text-success-foreground-strong', fill: 'bg-chart-success-450' },
  { key: 'warnings', label: 'Warnings', Icon: IconAlertTriangle, text: 'text-warning-foreground-strong', fill: 'bg-chart-warning-450' },
  { key: 'errors', label: 'Errors', Icon: IconCircleX, text: 'text-critical-foreground-strong', fill: 'bg-chart-critical-450' },
] as const;

/**
 * The outcome of validating an import: how many rows are ready, carry a warning or have an error,
 * as figures with icons, a proportional strip and a one-line verdict on what happens next.
 */
export function ValidationSummaryCard({ title, counts, noun = { one: 'row', other: 'rows' }, actions }: ValidationSummaryCardProps) {
  const total = counts.valid + counts.warnings + counts.errors;

  return (
    <section data-slot="validation-summary" aria-label={title} className="flex w-full min-w-0 flex-col gap-4 rounded-xl border border-default bg-base-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-base font-semibold text-base-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{validationVerdict(counts, noun)}</p>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>

      <dl className="grid grid-cols-3 gap-4">
        {PARTS.map(({ key, label, Icon, text }) => (
          <div key={key} data-part={key} className="flex min-w-0 flex-col gap-1">
            <dt className={`flex items-center gap-1.5 text-xs font-medium ${counts[key] > 0 ? text : 'text-muted-foreground'}`}>
              <Icon aria-hidden="true" className="size-3.5 shrink-0" />
              {label}
            </dt>
            <dd className="text-2xl font-semibold tabular-nums text-base-foreground">{NUMBER.format(counts[key])}</dd>
          </div>
        ))}
      </dl>

      {total > 0 ? (
        <div role="img" aria-label={`${counts.valid} ready, ${counts.warnings} with warnings, ${counts.errors} with errors`} className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full">
          {PARTS.map(({ key, fill }) =>
            counts[key] > 0 ? <span key={key} className={`h-full min-w-1 ${fill}`} style={{ flexGrow: counts[key], flexBasis: 0 }} /> : null
          )}
        </div>
      ) : null}
    </section>
  );
}
