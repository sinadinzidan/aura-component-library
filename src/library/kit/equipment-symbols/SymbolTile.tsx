import type { CSSProperties, ReactNode } from 'react';

import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

import { SymbolGlyph } from './SymbolGlyph';
import type { SymbolKind } from './symbols';

type Anatomy = 'card' | 'strip' | 'block' | 'outline';

const LOOK_ANATOMY: Record<LookId, Anatomy> = {
  studio: 'card',
  console: 'strip',
  poster: 'block',
  glass: 'card',
  editorial: 'outline',
  soft: 'card',
  blueprint: 'outline',
  signal: 'block',
};

type SymbolTileProps = {
  kind: SymbolKind;
  /** Name of the equipment: "1st stage compressor". */
  name: string;
  /** Functional location tag. */
  tag?: string;
  /** The state as a word: "Running", "Tripped". */
  state?: string;
  tone?: Tone;
  /** A live reading, already formatted: "48.6 barg". */
  value?: string;
  /** Extra line or control under the text. */
  detail?: ReactNode;
  selected?: boolean;
  /** Makes the tile a toggle button. */
  onSelect?: () => void;
  /** Dashed symbol: out of service. */
  dashed?: boolean;
  fault?: boolean;
  /** Side of the symbol in px. */
  size?: number;
  className?: string;
};

/**
 * A symbol with what identifies it and how it is doing: name, tag, state word and a reading. The
 * look sets the anatomy — a card with the symbol on a tinted ground, a console strip with a state
 * edge, a block filled with the state in poster and signal, a bare outline on a blueprint.
 */
export function SymbolTile({ kind, name, tag, state, tone = 'neutral', value, detail, selected = false, onSelect, dashed, fault, size = 48, className }: SymbolTileProps) {
  const look = useLook();
  const anatomy = LOOK_ANATOMY[look];
  const filled = anatomy === 'block' && tone !== 'neutral';
  const onFill = look === 'poster' ? 'var(--t-on-pop)' : 'var(--t-on-vivid)';
  const style: CSSProperties & Record<'--kit-text' | '--kit-text-2' | '--kit-text-3', string | undefined> = {
    '--kit-text': filled ? onFill : undefined,
    '--kit-text-2': filled ? onFill : undefined,
    '--kit-text-3': filled ? onFill : undefined,
    background: filled ? (look === 'poster' ? 'var(--t-pop)' : 'var(--t-vivid)') : anatomy === 'outline' ? 'transparent' : anatomy === 'strip' ? 'var(--kit-well)' : 'var(--kit-surface)',
    border: anatomy === 'strip' ? undefined : look === 'poster' ? '2px solid var(--base-foreground)' : `1px solid ${anatomy === 'outline' ? 'var(--kit-text-3)' : 'var(--kit-rule)'}`,
    borderLeft: anatomy === 'strip' ? '4px solid var(--t-line)' : undefined,
    borderRadius: anatomy === 'strip' || look === 'poster' || look === 'blueprint' ? 0 : 'var(--kit-radius-sm)',
    boxShadow: selected ? '0 0 0 2px var(--kit-line-accent)' : undefined,
    color: 'var(--kit-text)',
  };
  const row = anatomy === 'strip';
  const body = (
    <>
      <span
        className={cx('flex shrink-0 items-center justify-center', row ? '' : 'self-start p-2')}
        style={anatomy === 'card' ? { background: tone === 'neutral' ? 'var(--kit-track)' : 'var(--t-soft)', borderRadius: 'var(--kit-radius-sm)' } : undefined}
      >
        <SymbolGlyph kind={kind} label={null} size={size} tone={filled ? 'neutral' : tone} dashed={dashed} fault={fault} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="text-sm leading-5 font-semibold">{name}</span>
        {tag ? <span className="text-xs font-medium text-(--kit-text-3) tabular-nums">{tag}</span> : null}
        {value ? <span className="mt-1 text-base leading-5 font-semibold tabular-nums">{value}</span> : null}
        {detail}
      </span>
      {state ? (
        <span
          data-part="state"
          className={cx('inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap', row ? 'self-center' : 'self-start', filled ? 'text-sm' : 'px-2 py-0.5')}
          style={filled ? undefined : { background: 'var(--t-soft)', color: 'var(--t-on-soft)', borderRadius: look === 'blueprint' || look === 'console' ? 0 : 999 }}
        >
          {filled ? null : <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: 'currentColor' }} />}
          {state}
        </span>
      ) : null}
    </>
  );
  const shared = {
    'data-look': look,
    'data-tone': tone,
    'data-anatomy': anatomy,
    style,
    className: cx('flex min-w-0 gap-3', row ? 'flex-row items-center px-3 py-2' : 'flex-col p-3', onSelect ? 'cursor-pointer outline-none hover:brightness-[0.97] focus-visible:ring-2 focus-visible:ring-(--kit-text)' : '', className),
  } as const;

  return onSelect ? (
    <button type="button" aria-pressed={selected} onClick={onSelect} {...shared}>
      {body}
    </button>
  ) : (
    <div role="group" aria-label={`${name}${state ? `, ${state}` : ''}`} {...shared}>
      {body}
    </div>
  );
}
