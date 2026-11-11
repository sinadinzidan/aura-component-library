import type { PointerEvent } from 'react';

import { profileAreaPath, profileLinePath, valueAtKp, yOfValue, type ProfileFrame, type ProfilePoint } from '../../three/fields/profileGeometry';
import { cx, toneLine, type Tone } from '../tones';

import { axisTicks, kpAtPointer, kpPercent, staggerRows } from './chainage';

export type ChainageStation = { id: string; label: string; kp: number };

export type ChainageMark = { id: string; kp: number; tone: Tone; label: string };

type ChainageProfileProps = {
  /** What the profile shows, read out in place of the drawing. */
  label: string;
  /** Length of the line in kilometres. */
  totalKm: number;
  /** Ground elevation in metres along the line, drawn as a silhouette. */
  elevation: readonly ProfilePoint[];
  /** Pressure in barg along the line. */
  pressure: readonly ProfilePoint[];
  /** The pressure before a scenario changed it, drawn dashed behind. */
  basePressure?: readonly ProfilePoint[];
  /** Maximum allowable operating pressure, a labelled dashed line. */
  maop?: number;
  /** Elevation axis range in metres. */
  elevationRange?: readonly [number, number];
  /** Pressure axis range in barg. */
  pressureRange?: readonly [number, number];
  /** Where the reader is: the cursor. */
  cursorKp: number;
  stations?: readonly ChainageStation[];
  /** Findings along the line; each is a button. */
  marks?: readonly ChainageMark[];
  selectedMarkId?: string | null;
  onSelectMark?: (id: string) => void;
  /** A stretch to shade, with its name: a pressure wave, an isolated segment. */
  band?: { from: number; to: number; label: string; tone: Tone } | null;
  /** Called with a chainage when the plot is clicked or dragged. Provide a slider for the keyboard. */
  onSeek?: (kp: number) => void;
  /** Plot height in px. */
  height?: number;
  className?: string;
};

const GUTTER = 'mx-12';

/**
 * A route in section: the ground as a silhouette over the kilometres, the line pressure above it
 * against its allowable limit, stations as labelled rules, findings as markers and a cursor where
 * the reader is. Every label is HTML over the drawing, so type keeps its size at any width.
 */
export function ChainageProfile({
  label,
  totalKm,
  elevation,
  pressure,
  basePressure,
  maop,
  elevationRange = [0, 320],
  pressureRange = [20, 140],
  cursorKp,
  stations = [],
  marks = [],
  selectedMarkId = null,
  onSelectMark,
  band = null,
  onSeek,
  height = 260,
  className,
}: ChainageProfileProps) {
  const frame: ProfileFrame = { width: 1000, height, left: 0, right: 0, top: 0, bottom: 0 };
  const yElevation = (value: number) => yOfValue(frame, value, elevationRange[0], elevationRange[1]);
  const yPressure = (value: number) => yOfValue(frame, value, pressureRange[0], pressureRange[1]);
  const left = (kp: number) => `${kpPercent(kp, totalKm).toFixed(3)}%`;
  const cursorPressure = valueAtKp(pressure, cursorKp);
  const cursorGround = valueAtKp(elevation, cursorKp);
  const groundTicks = axisTicks(elevationRange[0], Math.min(elevationRange[1], 150), 50);
  const pressureTicks = axisTicks(Math.max(pressureRange[0], 80), pressureRange[1], 20);
  const sortedStations = [...stations].sort((first, second) => first.kp - second.kp);
  const stationRows = staggerRows(sortedStations.map((station) => station.kp), totalKm);
  const topGroundTick = groundTicks[groundTicks.length - 1] ?? elevationRange[0];
  const lowPressureTick = pressureTicks[0] ?? pressureRange[0];

  const seek = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    onSeek?.(kpAtPointer(event.clientX - box.left, box.width, totalKm));
  };

  return (
    <figure data-slot="chainage-profile" className={cx('m-0 flex min-w-0 flex-col text-[var(--kit-text)]', className)}>
      <div className={cx('relative h-11', GUTTER)}>
        {sortedStations.map((station, index) => (
          <span
            key={station.id}
            style={{ left: left(station.kp) }}
            className={cx(
              'absolute whitespace-nowrap text-xs font-medium text-[var(--kit-text-2)]',
              stationRows[index] === 1 ? 'bottom-5' : 'bottom-1',
              station.kp <= 0 ? '' : station.kp > totalKm * 0.9 ? '-translate-x-full' : '-translate-x-1/2'
            )}
          >
            {station.label}
          </span>
        ))}
      </div>

      <div className="relative" style={{ height }}>
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-12">
          {groundTicks.map((tick) => (
            <span key={tick} style={{ top: yElevation(tick) }} className="absolute right-2 -translate-y-1/2 text-xs tabular-nums text-[var(--kit-text-3)]">
              {tick}
            </span>
          ))}
          <span style={{ top: yElevation(topGroundTick) - 22 }} className="absolute right-2 -translate-y-1/2 text-xs text-[var(--kit-text-3)]">
            m
          </span>
        </div>
        <div aria-hidden="true" className="absolute inset-y-0 right-0 w-12">
          {pressureTicks.map((tick) => (
            <span key={tick} style={{ top: yPressure(tick) }} className="absolute left-2 -translate-y-1/2 text-xs tabular-nums text-[var(--kit-text-3)]">
              {tick}
            </span>
          ))}
          <span style={{ top: yPressure(lowPressureTick) + 22 }} className="absolute left-2 -translate-y-1/2 text-xs text-[var(--kit-text-3)]">
            barg
          </span>
        </div>

        <div
          role="img"
          aria-label={label}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture?.(event.pointerId);
            seek(event);
          }}
          onPointerMove={(event) => {
            if (event.buttons === 1) seek(event);
          }}
          className={cx('absolute inset-y-0 border-b border-l border-r border-[var(--kit-rule-strong)]', GUTTER, onSeek ? 'cursor-ew-resize touch-none' : '')}
          style={{ left: 0, right: 0 }}
        >
          <svg aria-hidden="true" viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            {pressureTicks.map((tick) => (
              <line key={tick} x1={0} x2={1000} y1={yPressure(tick)} y2={yPressure(tick)} stroke="var(--kit-rule)" strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.6} />
            ))}
            {band ? <rect x={(band.from / totalKm) * 1000} width={((band.to - band.from) / totalKm) * 1000} y={0} height={height} fill={toneLine(band.tone)} opacity={0.12} /> : null}
            {stations.map((station) => (
              <line key={station.id} x1={(station.kp / totalKm) * 1000} x2={(station.kp / totalKm) * 1000} y1={0} y2={height} stroke="var(--kit-rule-strong)" strokeWidth={1} strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
            ))}
            <path d={profileAreaPath(frame, elevation, totalKm, elevationRange[0], elevationRange[1])} fill="var(--kit-track)" />
            <path d={profileLinePath(frame, elevation, totalKm, elevationRange[0], elevationRange[1])} fill="none" stroke="var(--kit-text)" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
            {maop === undefined ? null : <line x1={0} x2={1000} y1={yPressure(maop)} y2={yPressure(maop)} stroke={toneLine('critical')} strokeWidth={1.5} strokeDasharray="7 5" vectorEffect="non-scaling-stroke" />}
            {basePressure ? (
              <path d={profileLinePath(frame, basePressure, totalKm, pressureRange[0], pressureRange[1])} fill="none" stroke={toneLine('accent')} strokeWidth={1.25} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" opacity={0.7} />
            ) : null}
            <path d={profileLinePath(frame, pressure, totalKm, pressureRange[0], pressureRange[1])} fill="none" stroke={toneLine('accent')} strokeWidth={2.25} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>

          {maop === undefined ? null : (
            <span aria-hidden="true" style={{ top: yPressure(maop), color: toneLine('critical') }} className="absolute left-2 -translate-y-full pb-0.5 text-xs font-medium">
              Allowable pressure {maop} barg
            </span>
          )}
          {band ? (
            <span aria-hidden="true" style={{ left: left((band.from + band.to) / 2), color: toneLine(band.tone) }} className="absolute top-6 -translate-x-1/2 whitespace-nowrap text-xs font-semibold">
              {band.label}
            </span>
          ) : null}

          {marks.map((mark) => {
            const ground = valueAtKp(elevation, mark.kp) ?? elevationRange[0];
            const selected = mark.id === selectedMarkId;
            return (
              <button
                key={mark.id}
                type="button"
                aria-label={mark.label}
                aria-pressed={selected}
                title={mark.label}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onSelectMark?.(mark.id)}
                style={{ left: left(mark.kp), top: yElevation(ground), background: toneLine(mark.tone), outlineColor: 'var(--kit-text)' }}
                className={cx(
                  'absolute z-10 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 cursor-pointer border-2 border-[var(--kit-halo)] outline-offset-2 focus-visible:outline-2',
                  selected && 'size-4 outline-2'
                )}
              />
            );
          })}

          <div data-slot="chainage-cursor" aria-hidden="true" style={{ left: left(cursorKp) }} className="pointer-events-none absolute inset-y-0 z-20 w-0">
            <span className="absolute inset-y-0 -left-px w-0.5 bg-[var(--kit-text)]" />
            {cursorPressure === null ? null : <span style={{ top: yPressure(cursorPressure), background: toneLine('accent') }} className="absolute left-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--kit-halo)]" />}
            {cursorGround === null ? null : <span style={{ top: yElevation(cursorGround) }} className="absolute left-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--kit-text)] ring-2 ring-[var(--kit-halo)]" />}
          </div>
        </div>
      </div>

      <div aria-hidden="true" className={cx('relative h-6', GUTTER)}>
        {axisTicks(0, totalKm, 10).map((tick) => (
          <span key={tick} style={{ left: left(tick) }} className={cx('absolute top-1.5 text-xs tabular-nums text-[var(--kit-text-3)]', tick === 0 ? '' : '-translate-x-1/2')}>
            {tick === 0 ? 'km 0' : tick}
          </span>
        ))}
      </div>
    </figure>
  );
}
