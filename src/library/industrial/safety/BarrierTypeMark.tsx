import { IconFileText, IconSettings, IconUser } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';

import { BARRIER_TYPE_LABEL } from './bowTieLayout';
import type { BarrierType } from './bowTieLayout';

export type BarrierTypeMarkProps = {
  type: BarrierType;
  /** Hide the word and keep it as the accessible name, for dense cells. */
  iconOnly?: boolean;
  className?: string;
};

const ICON = { engineered: IconSettings, procedural: IconFileText, human: IconUser } as const;

/**
 * What kind of barrier this is: engineered (hardware and automation), procedural (a rule or
 * document) or human (someone has to notice and act). One icon and one word per type, always
 * neutral — the type is a fact about the barrier, not a state.
 */
export function BarrierTypeMark({ type, iconOnly = false, className }: BarrierTypeMarkProps) {
  const Icon = ICON[type];
  return (
    <span data-slot="barrier-type" data-type={type} className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className)}>
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {iconOnly ? <span className="sr-only">{BARRIER_TYPE_LABEL[type]}</span> : BARRIER_TYPE_LABEL[type]}
    </span>
  );
}
