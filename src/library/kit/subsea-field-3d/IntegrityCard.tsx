import { RingGauge } from '../RingGauge';
import { StatusPill } from '../StatusPill';
import { TagId } from '../TagId';
import { cx } from '../tones';

import { DESIGN_LIFE_YEARS, integritySummary, integrityTone, type IntegrityRecord } from './integrity';

type IntegrityCardProps = {
  /** The asset tag, for example `23-FL-C`. */
  tag: string;
  name: string;
  /** What kind of thing it is: "Flowline", "Template". */
  kind: string;
  record: IntegrityRecord;
  selected?: boolean;
  /** Fades the card, for assets outside the highlighted system. */
  dimmed?: boolean;
  onSelect?: () => void;
  className?: string;
};

/**
 * One asset of a field as a card to pick: tag, name, the state of its findings in words and the
 * remaining design life as a ring. The whole card is a toggle button; the selected one carries an
 * accent edge and glow, so it can be found again in a long strip.
 */
export function IntegrityCard({ tag, name, kind, record, selected = false, dimmed = false, onSelect, className }: IntegrityCardProps) {
  const tone = integrityTone(record);

  return (
    <button
      type="button"
      data-slot="integrity-card"
      data-selected={selected}
      aria-pressed={selected}
      aria-label={`${tag}, ${name}: ${integritySummary(record)}, ${record.remainingLife} years of design life left`}
      onClick={onSelect}
      className={cx(
        'flex w-[17rem] shrink-0 cursor-pointer items-center gap-3 rounded-[var(--kit-radius-sm)] border p-3 text-left outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-[var(--ring-default)]',
        selected
          ? 'border-[var(--kit-accent)] bg-[color-mix(in_oklab,var(--kit-accent)_22%,transparent)] shadow-[0_0_28px_-6px_var(--kit-accent)]'
          : 'border-[var(--kit-rule)] bg-[var(--kit-well)] hover:border-[var(--kit-rule-strong)] hover:bg-[color-mix(in_oklab,var(--kit-text)_8%,transparent)]',
        dimmed && !selected && 'opacity-45',
        className
      )}
    >
      <RingGauge label={`Remaining life of ${tag}`} value={record.remainingLife} max={DESIGN_LIFE_YEARS} unit="y" tone={tone} size={58} hideLabel />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline justify-between gap-2">
          <TagId>{tag}</TagId>
          <span className="shrink-0 text-xs text-[var(--kit-text-3)]">{kind}</span>
        </span>
        <span className="truncate text-sm text-[var(--kit-text-2)]">{name}</span>
        <StatusPill tone={tone} className="self-start">
          {record.findings.length === 0 ? 'Clear' : `${record.findings.length} ${record.findings.length === 1 ? 'finding' : 'findings'}`}
        </StatusPill>
      </span>
    </button>
  );
}
