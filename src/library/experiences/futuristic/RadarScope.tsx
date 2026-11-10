import type { KeyboardEvent } from 'react';

import { cn } from '../../../lib/utils';
import { arcPath, polarToCartesian } from '../../industrial/geometry';

import { NEON_FILL, NEON_STROKE, NEON_SVG_GLOW, NEON_TONE } from './neon';
import type { NeonTone } from './neon';
import { layoutBlips, ringTicks, scoreRadius, sectorBounds } from './radar';
import { Reticle } from './Reticle';

export type RadarItem = {
  id: string;
  /** Short text beside the blip, usually a tag. */
  label: string;
  /** Sets the distance from the core: the best score sits on the outer ring. */
  score: number;
  /** Full description for assistive technology, state included. */
  description: string;
  tone?: NeonTone;
};

export type RadarGroup = { id: string; label: string; items: readonly RadarItem[] };

export type RadarScopeProps = {
  /** One sector per group, clockwise from 12 o'clock. */
  groups: readonly RadarGroup[];
  /** What the scope plots, for assistive technology. */
  label: string;
  lockedId?: string | null;
  onLock?: (id: string) => void;
  /** Scores that get a labelled ring, best first. */
  rings?: readonly number[];
  /** Score at the core. */
  minScore?: number;
  maxScore?: number;
  /** Scores below this fall inside the dashed critical ring. */
  criticalBelow?: number;
  /** Rotating sweep. It stops with reduced motion. */
  sweep?: boolean;
  tone?: NeonTone;
  className?: string;
};

const SIZE = 440;
const CENTER = SIZE / 2;
const OUTER = 176;
const INNER = 26;

/** Blip shape repeats the tone, so state reads without colour. */
function BlipShape({ tone, locked }: { tone: NeonTone; locked: boolean }) {
  const size = locked ? 5.5 : 4.5;
  const className = cn(NEON_FILL, NEON_SVG_GLOW);
  if (tone === 'critical') return <rect x={-size} y={-size} width={size * 2} height={size * 2} transform="rotate(45)" className={className} />;
  if (tone === 'warning') return <rect x={-size} y={-size} width={size * 2} height={size * 2} className={className} />;
  if (tone === 'neutral' || tone === 'info') {
    return <circle r={size} fill="none" strokeWidth={2} className={cn(NEON_STROKE, NEON_SVG_GLOW)} />;
  }
  return <circle r={size} className={className} />;
}

/**
 * A circular scope that plots items as blips: the group picks the sector, the score the distance
 * from the core, the tone the shape and colour. Blips are toggle buttons; locking one slides the
 * reticle onto it and draws a bearing line. A sweep turns slowly behind them and stops with
 * reduced motion. Everything is strokes on a transparent ground.
 */
export function RadarScope({
  groups,
  label,
  lockedId = null,
  onLock,
  rings = [100, 75, 50],
  minScore = 25,
  maxScore = 100,
  criticalBelow,
  sweep = true,
  tone = 'accent',
  className,
}: RadarScopeProps) {
  const scale = { inner: INNER, outer: OUTER, min: minScore, max: maxScore };
  const blips = layoutBlips(groups, (item) => item.score, { ...scale, cx: CENTER, cy: CENTER, sectorPadding: 10 });
  const locked = blips.find((blip) => blip.item.id === lockedId);

  const handleKeyDown = (event: KeyboardEvent<SVGGElement>, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onLock?.(id);
    }
  };

  return (
    <svg
      data-slot="radar-scope"
      role="group"
      aria-label={label}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={cn(NEON_TONE[tone], 'block size-full', className)}
    >
      <g aria-hidden="true" fill="none" className={NEON_STROKE}>
        <circle cx={CENTER} cy={CENTER} r={OUTER + 12} strokeWidth={1} opacity={0.35} />
        {ringTicks(CENTER, CENTER, OUTER + 12, 72, 4, 6, 9).map((tick, index) => (
          <line key={index} {...tick} strokeWidth={1} opacity={0.7} />
        ))}
        {rings.map((score) => (
          <circle
            key={score}
            data-slot="radar-ring"
            cx={CENTER}
            cy={CENTER}
            r={scoreRadius(score, scale)}
            strokeWidth={score === maxScore ? 1.5 : 1}
            opacity={score === maxScore ? 0.9 : 0.35}
            className={score === maxScore ? NEON_SVG_GLOW : undefined}
          />
        ))}
        {groups.map((group, index) => {
          const { start } = sectorBounds(index, groups.length);
          const from = polarToCartesian(CENTER, CENTER, INNER, start);
          const to = polarToCartesian(CENTER, CENTER, OUTER + 12, start);
          return <line key={group.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} strokeWidth={1} opacity={0.35} />;
        })}
        <circle cx={CENTER} cy={CENTER} r={3} strokeWidth={1.5} />
        <path d={`M ${CENTER - 12} ${CENTER} H ${CENTER - 6} M ${CENTER + 6} ${CENTER} H ${CENTER + 12} M ${CENTER} ${CENTER - 12} V ${CENTER - 6} M ${CENTER} ${CENTER + 6} V ${CENTER + 12}`} strokeWidth={1} />
      </g>

      {criticalBelow !== undefined ? (
        <g aria-hidden="true" className={NEON_TONE.critical}>
          <circle
            data-slot="radar-critical"
            cx={CENTER}
            cy={CENTER}
            r={scoreRadius(criticalBelow, scale)}
            strokeWidth={1}
            strokeDasharray="3 4"
            className={cn(NEON_STROKE, 'fill-[color-mix(in_oklab,var(--neon)_7%,transparent)]')}
          />
        </g>
      ) : null}

      {sweep ? (
        <g
          data-slot="radar-sweep"
          aria-hidden="true"
          className="origin-center [transform-box:view-box] motion-safe:animate-spin motion-safe:[animation-duration:9s]"
        >
          {[44, 28, 14].map((width) => (
            <path
              key={width}
              d={`${arcPath(CENTER, CENTER, OUTER, 40 - width, 40)} L ${CENTER} ${CENTER} Z`}
              className="fill-[color-mix(in_oklab,var(--neon)_9%,transparent)]"
            />
          ))}
          <line
            x1={CENTER}
            y1={CENTER}
            {...(() => {
              const end = polarToCartesian(CENTER, CENTER, OUTER, 40);
              return { x2: end.x, y2: end.y };
            })()}
            strokeWidth={1.5}
            className={cn(NEON_STROKE, NEON_SVG_GLOW)}
          />
        </g>
      ) : null}

      <g aria-hidden="true" className="fill-muted-foreground font-mono text-[0.6875rem]">
        {rings.map((score) => (
          <text key={score} x={CENTER + 5} y={CENTER - scoreRadius(score, scale) + 13} className="tabular-nums">
            {score}
          </text>
        ))}
        {groups.map((group, index) => {
          const { mid } = sectorBounds(index, groups.length);
          const point = polarToCartesian(CENTER, CENTER, OUTER + 26, mid);
          const anchor = Math.abs(point.x - CENTER) < 20 ? 'middle' : point.x > CENTER ? 'start' : 'end';
          return (
            <text key={group.id} x={point.x} y={point.y + 4} textAnchor={anchor} className={cn(NEON_FILL, 'text-xs font-medium tracking-wider')}>
              {group.label}
            </text>
          );
        })}
      </g>

      {locked ? (
        <line
          data-slot="radar-bearing"
          aria-hidden="true"
          x1={CENTER}
          y1={CENTER}
          x2={locked.x}
          y2={locked.y}
          strokeWidth={1}
          strokeDasharray="2 3"
          className={cn(NEON_TONE[locked.item.tone ?? 'accent'], NEON_STROKE)}
        />
      ) : null}

      {blips.map((blip) => {
        const isLocked = blip.item.id === lockedId;
        const blipTone = blip.item.tone ?? 'accent';
        const leftSide = blip.x < CENTER;
        return (
          <g
            key={blip.item.id}
            data-slot="radar-blip"
            data-locked={isLocked ? 'true' : 'false'}
            role="button"
            tabIndex={0}
            aria-pressed={isLocked}
            aria-label={blip.item.description}
            transform={`translate(${blip.x} ${blip.y})`}
            onClick={() => onLock?.(blip.item.id)}
            onKeyDown={(event) => handleKeyDown(event, blip.item.id)}
            className={cn(NEON_TONE[blipTone], 'group cursor-pointer outline-none')}
          >
            <circle r={14} className="fill-transparent group-hover:fill-[color-mix(in_oklab,var(--neon)_18%,transparent)] group-focus-visible:fill-[color-mix(in_oklab,var(--neon)_30%,transparent)]" />
            <BlipShape tone={blipTone} locked={isLocked} />
            <text
              x={leftSide ? -11 : 11}
              y={4}
              textAnchor={leftSide ? 'end' : 'start'}
              className={cn(
                'font-mono text-[0.6875rem] [paint-order:stroke] stroke-base-background [stroke-width:3px]',
                isLocked ? 'fill-base-foreground font-semibold' : 'fill-medium-foreground group-hover:fill-base-foreground'
              )}
            >
              {blip.item.label}
            </text>
          </g>
        );
      })}

      <Reticle x={locked ? locked.x : CENTER} y={locked ? locked.y : CENTER} locked={Boolean(locked)} tone={locked?.item.tone ?? tone} />
    </svg>
  );
}
