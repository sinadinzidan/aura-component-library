import { IconEqual, IconMinus, IconPencil, IconPlus } from '@cognite/aura/icons';

import { changeLabel } from './changeKind';
import type { ChangeKind } from './changeKind';

const KINDS = {
  added: { Icon: IconPlus, text: 'text-success-foreground-strong' },
  removed: { Icon: IconMinus, text: 'text-critical-foreground-strong' },
  changed: { Icon: IconPencil, text: 'text-info-foreground-strong' },
  unchanged: { Icon: IconEqual, text: 'text-muted-foreground' },
} as const;

export type ChangeMarkerProps = {
  kind: ChangeKind;
  /** Overrides the word, for example "New" or "Only in B". */
  label?: string;
  /** Shows the icon alone and keeps the word for assistive technology. For tight gutters only. */
  iconOnly?: boolean;
};

/**
 * Says how a line of a comparison changed: added, removed, changed or unchanged. Each kind has
 * its own icon and word, so a diff reads the same without colour.
 */
export function ChangeMarker({ kind, label, iconOnly = false }: ChangeMarkerProps) {
  const { Icon, text } = KINDS[kind];
  const word = label ?? changeLabel(kind);
  return (
    <span data-slot="change-marker" data-kind={kind} className={`inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium ${text}`}>
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {iconOnly ? <span className="sr-only">{word}</span> : word}
    </span>
  );
}
