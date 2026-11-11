import { Fragment } from 'react';
import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { StatusPill } from '../StatusPill';
import { TagId } from '../TagId';
import { cx, formatNumber, type Tone } from '../tones';

import { BLOCK_ANATOMY, FIGURE_STYLE, blockStyle } from './anatomy';
import { FlowConnector } from './FlowConnector';

export type FlowStageItem = {
  id: string;
  name: string;
  tag?: string;
  /** State in a word: Running, Tripped, Standby. */
  state: string;
  tone: Tone;
  icon?: ReactNode;
  /** The one reading that describes the stage. */
  value?: number | string | null;
  unit?: string;
  decimals?: number;
  /** What the reading is: "Discharge pressure". */
  caption?: string;
  /** Share of capacity in use, 0–100. */
  load?: number;
  /** Open alarms on the stage. */
  alarms?: number;
};

export type FlowLinkItem = { label?: string; state?: 'flowing' | 'stopped' };

type FlowStagesProps = {
  /** What the chain is: "Gas train, inlet to export". */
  label: string;
  stages: readonly FlowStageItem[];
  /** One entry per gap between stages; a missing entry is a plain flowing line. */
  links?: readonly (FlowLinkItem | undefined)[];
  /** Id of the stage that limits the line; it is marked and its load bar turns to its tone. */
  bottleneckId?: string;
  selectedId?: string | null;
  /** Makes stages selectable. */
  onSelect?: (id: string) => void;
  /** `compact` is one line of name, state and reading, for lanes and narrow columns. */
  size?: 'default' | 'compact';
  className?: string;
};

/**
 * Stages of a process in flow direction, joined by lines that say what moves between them. Each
 * stage is drawn the way the look draws a block: a card with a status pill in studio, a block with
 * a state edge in console, a solid tile in poster and signal, a drawn box in blueprint.
 */
export function FlowStages({ label, stages, links = [], bottleneckId, selectedId = null, onSelect, size = 'default', className }: FlowStagesProps) {
  const look = useLook();
  const anatomy = BLOCK_ANATOMY[look];
  const compact = size === 'compact';
  const solid = anatomy === 'solid';
  const template = stages.map(() => 'minmax(0, 1fr)').join(compact ? ' minmax(28px, 0.22fr) ' : ' minmax(36px, 0.3fr) ');

  return (
    <ol data-look={look} aria-label={label} className={cx('grid w-full min-w-0 items-stretch', className)} style={{ gridTemplateColumns: template }}>
      {stages.map((stage, index) => {
        const selected = stage.id === selectedId;
        const bottleneck = stage.id === bottleneckId;
        const reading =
          stage.value === undefined ? null : (
            <p className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-(--kit-text) tabular-nums">
              <span style={{ ...FIGURE_STYLE, fontSize: compact ? '1.125rem' : solid ? '2rem' : '1.625rem' }}>{stage.value === null ? '—' : typeof stage.value === 'number' ? formatNumber(stage.value, stage.decimals) : stage.value}</span>
              {stage.unit ? <span className="text-xs font-medium text-(--kit-text-3)">{stage.unit}</span> : null}
            </p>
          );
        const state = solid ? (
          <span className={cx('font-bold text-(--kit-text)', compact ? 'text-sm' : 'text-lg')} style={{ letterSpacing: 'var(--kit-figure-tracking)' }}>
            {stage.state}
          </span>
        ) : (
          <StatusPill tone={stage.tone}>{stage.state}</StatusPill>
        );
        const body = (
          <>
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col">
                <span className={cx('font-semibold text-(--kit-text)', compact ? 'text-sm' : 'text-base')}>{stage.name}</span>
                {stage.tag ? <TagId className="text-xs">{stage.tag}</TagId> : null}
              </div>
              {stage.icon && !compact ? (
                <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center [&_svg]:size-5" style={{ color: solid ? 'currentColor' : 'var(--t-line)' }}>
                  {stage.icon}
                </span>
              ) : null}
            </div>
            {reading ? (
              <div className="flex min-w-0 flex-col gap-0.5">
                {reading}
                {stage.caption && !compact ? <span className="text-xs text-(--kit-text-3)">{stage.caption}</span> : null}
              </div>
            ) : null}
            {stage.load !== undefined && !compact ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2 text-xs text-(--kit-text-3)">
                  <span>{bottleneck ? 'Bottleneck' : 'Load'}</span>
                  <span className="font-medium text-(--kit-text-2) tabular-nums">{formatNumber(stage.load, 0)} %</span>
                </div>
                <div className="overflow-hidden" style={{ height: 'var(--kit-track-h)', borderRadius: 'var(--kit-track-radius)', background: 'var(--kit-track)', boxShadow: look === 'blueprint' ? 'inset 0 0 0 1px var(--kit-rule-strong)' : undefined }}>
                  <div data-slot="stage-load" style={{ width: `${Math.max(0, Math.min(100, stage.load))}%`, height: '100%', background: solid ? 'currentColor' : 'var(--t-line)' }} />
                </div>
              </div>
            ) : null}
            <div className="mt-auto flex min-w-0 flex-wrap items-center justify-between gap-2">
              {state}
              {stage.alarms ? (
                <span className="text-xs font-semibold text-(--kit-text-2) tabular-nums">
                  {stage.alarms} {stage.alarms === 1 ? 'alarm' : 'alarms'}
                </span>
              ) : null}
            </div>
          </>
        );
        const box = cx('flex h-full w-full min-w-0 flex-col text-left', compact ? 'gap-2 p-3' : 'gap-3 p-4', anatomy === 'rule' && 'px-0', onSelect && 'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring-default');
        const style = {
          ...blockStyle(look),
          outline: selected ? '2px solid var(--kit-accent)' : bottleneck && !solid ? '2px solid var(--t-line)' : undefined,
          outlineOffset: selected || bottleneck ? 2 : undefined,
        };
        const link = links[index];
        return (
          <Fragment key={stage.id}>
            <li data-stage={stage.id} data-bottleneck={bottleneck || undefined} className="min-w-0">
              {onSelect ? (
                <button type="button" data-tone={stage.tone} aria-pressed={selected} onClick={() => onSelect(stage.id)} className={box} style={style}>
                  {body}
                </button>
              ) : (
                <div data-tone={stage.tone} className={box} style={style}>
                  {body}
                </div>
              )}
            </li>
            {index < stages.length - 1 ? (
              <li aria-hidden={link?.label ? undefined : true} className="flex min-w-0 items-center px-1">
                <FlowConnector label={link?.label} state={link?.state} tone={link?.state === 'stopped' ? 'neutral' : 'accent'} />
              </li>
            ) : null}
          </Fragment>
        );
      })}
    </ol>
  );
}
