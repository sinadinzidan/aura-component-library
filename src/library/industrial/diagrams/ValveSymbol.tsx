import { cn } from '../../../lib/utils';
import type { Tone } from '../status';

import { EquipmentSymbol } from './EquipmentSymbol';
import { SYMBOLS, VALVE_BODY_UPSTREAM, VALVE_FAULT_MARK } from './symbolPaths';
import type { SymbolKind } from './symbolPaths';
import { valvePositionStatus } from './symbolState';
import type { SymbolSize, ValvePosition } from './symbolState';

export type ValveType = 'gate' | 'control' | 'shutdown';

export type ValveSymbolProps = {
  type?: ValveType;
  position: ValvePosition;
  /** Tag or name. The position is appended to the accessible name. */
  label?: string;
  size?: SymbolSize | number;
  /** Centre in the parent diagram. Leave out when the symbol stands alone. */
  cx?: number;
  cy?: number;
  /** Overrides the tone the position gives. */
  tone?: Tone;
  className?: string;
};

const KIND: Record<ValveType, SymbolKind> = { gate: 'gate-valve', control: 'control-valve', shutdown: 'shutdown-valve' };

/**
 * A valve that shows its position without relying on colour: open is hollow, closed is solid,
 * travelling fills the upstream half, and a failed valve is outlined in critical with a cross.
 */
export function ValveSymbol({ type = 'gate', position, label, size = 'md', cx, cy, tone, className }: ValveSymbolProps) {
  const kind = KIND[type];
  const status = valvePositionStatus(position);
  const resolvedTone = tone ?? (position === 'failed' ? 'critical' : 'neutral');

  return (
    <EquipmentSymbol
      kind={kind}
      label={`${label ?? SYMBOLS[kind].label}, ${status.label.toLowerCase()}`}
      size={size}
      cx={cx}
      cy={cy}
      tone={resolvedTone}
      fill={position === 'closed' ? 'full' : 'none'}
      className={cn(className)}
    >
      {position === 'travelling' ? <path data-slot="valve-travel" d={VALVE_BODY_UPSTREAM} fill="currentColor" vectorEffect="non-scaling-stroke" /> : null}
      {position === 'failed' ? <path data-slot="valve-fault" d={VALVE_FAULT_MARK} vectorEffect="non-scaling-stroke" /> : null}
    </EquipmentSymbol>
  );
}
