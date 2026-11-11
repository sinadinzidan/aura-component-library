import type { KeyboardEvent, PointerEvent } from 'react';

import { cn } from '../../../lib/utils';
import { TONE_MARK_FILL, TONE_MARK_STROKE } from '../../industrial/status';
import type { Tone } from '../../industrial/status';

import { kpOfX, kpTicks, profileAreaPath, profileLinePath, valueAtKp, valueExtent, xOfKp, yOfValue } from './profileGeometry';
import type { ProfileFrame, ProfilePoint } from './profileGeometry';

export type ProfileStation = { id: string; label: string; kp: number };
export type ProfileAnomaly = { id: string; kp: number; tone: Tone };

export type ProfileStripProps = {
  /** What the strip shows, read out in place of the drawing. */
  label: string;
  /** Length of the line in kilometres. */
  totalKm: number;
  /** Ground elevation in metres, drawn as a silhouette. */
  elevation: readonly ProfilePoint[];
  /** Pressure in barg: the hydraulic gradient. */
  pressure: readonly ProfilePoint[];
  /** The gradient before a scenario changed it, drawn dashed behind. */
  basePressure?: readonly ProfilePoint[];
  /** Maximum allowable operating pressure, a dashed line. */
  maop?: number;
  /** Where the camera is: the cursor. */
  cameraKp: number;
  /** Where the inspection pig is, with its own marker. */
  pigKp?: number | null;
  stations?: readonly ProfileStation[];
  anomalies?: readonly ProfileAnomaly[];
  selectedAnomalyId?: string | null;
  /** A leak: its chainage and the wave fronts either side. */
  leak?: { kp: number; fronts: readonly [number, number] } | null;
  /** The stretch shut in between two block valves. */
  isolated?: readonly [number, number] | null;
  /** Called with a chainage when the profile is clicked, dragged or moved with the keyboard. */
  onSeek: (kp: number) => void;
  /** Kilometres per arrow key press. */
  keyStep?: number;
  className?: string;
};

const FRAME: ProfileFrame = { width: 1000, height: 190, left: 46, right: 52, top: 30, bottom: 28 };
const PRESSURE_RANGE: readonly [number, number] = [50, 140];

/**
 * An elevation and pressure profile of a whole route in one strip: the ground as a silhouette, the
 * hydraulic gradient against the allowable limit, stations, inspection findings and the camera
 * position as a cursor. Click or drag to jump there; arrow keys step along the line.
 */
export function ProfileStrip({
  label,
  totalKm,
  elevation,
  pressure,
  basePressure,
  maop,
  cameraKp,
  pigKp = null,
  stations = [],
  anomalies = [],
  selectedAnomalyId = null,
  leak = null,
  isolated = null,
  onSeek,
  keyStep = 1,
  className,
}: ProfileStripProps) {
  const [elevationMin, elevationMax] = valueExtent(elevation, 0.12);
  const floor = FRAME.height - FRAME.bottom;
  const x = (kp: number) => xOfKp(FRAME, kp, totalKm);
  const yPressure = (value: number) => yOfValue(FRAME, value, PRESSURE_RANGE[0], PRESSURE_RANGE[1]);
  const asPressure = (points: readonly ProfilePoint[]) => profileLinePath(FRAME, points, totalKm, PRESSURE_RANGE[0], PRESSURE_RANGE[1]);
  const pigElevation = pigKp === null ? null : yOfValue(FRAME, valueAtKp(elevation, pigKp) ?? elevationMin, elevationMin, elevationMax);

  const seekFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    onSeek(kpOfX(FRAME, ((event.clientX - rect.left) / rect.width) * FRAME.width, totalKm));
  };
  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const step = event.shiftKey ? keyStep * 5 : keyStep;
    const next = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? cameraKp + step : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? cameraKp - step : event.key === 'Home' ? 0 : event.key === 'End' ? totalKm : null;
    if (next === null) return;
    event.preventDefault();
    onSeek(Math.min(totalKm, Math.max(0, next)));
  };

  return (
    <svg
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={totalKm}
      aria-valuenow={Math.round(cameraKp * 10) / 10}
      aria-valuetext={`Kilometre ${cameraKp.toFixed(1)} of ${totalKm}`}
      data-slot="profile-strip"
      viewBox={`0 0 ${FRAME.width} ${FRAME.height}`}
      width="100%"
      className={cn('block h-auto cursor-pointer touch-none select-none rounded-md outline-none focus-visible:outline-2 focus-visible:outline-[var(--ring-default)]', className)}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        seekFromPointer(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) seekFromPointer(event);
      }}
      onKeyDown={onKeyDown}
    >
      {/* Kilometre grid */}
      {kpTicks(totalKm, 10).map((kp) => (
        <g key={kp}>
          <line x1={x(kp)} x2={x(kp)} y1={FRAME.top} y2={floor} className="stroke-default" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <text x={x(kp)} y={FRAME.height - 9} textAnchor="middle" className="fill-muted-foreground text-[10px] tabular-nums">
            {kp}
          </text>
        </g>
      ))}
      <text x={FRAME.left - 6} y={FRAME.height - 9} textAnchor="end" className="fill-muted-foreground text-[10px]">
        km
      </text>

      {/* Shut-in stretch and leak wave */}
      {isolated ? (
        <g data-slot="profile-isolated">
          <rect x={x(isolated[0])} y={FRAME.top} width={Math.max(0, x(isolated[1]) - x(isolated[0]))} height={floor - FRAME.top} className="fill-warning-background" opacity={0.55} />
          <text x={(x(isolated[0]) + x(isolated[1])) / 2} y={FRAME.top + 12} textAnchor="middle" className="fill-warning-foreground-strong text-[10px] font-medium">
            Isolated
          </text>
        </g>
      ) : null}
      {leak && !isolated
        ? leak.fronts.map((front) => <line key={front} x1={x(front)} x2={x(front)} y1={FRAME.top} y2={floor} className="stroke-warning-foreground-strong" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />)
        : null}

      {/* Ground silhouette */}
      <path d={profileAreaPath(FRAME, elevation, totalKm, elevationMin, elevationMax)} className="fill-muted-background" />
      <path d={profileLinePath(FRAME, elevation, totalKm, elevationMin, elevationMax)} className="stroke-muted-foreground" fill="none" strokeWidth={1} vectorEffect="non-scaling-stroke" />

      {/* MAOP and the gradient */}
      {maop !== undefined ? (
        <g>
          <line x1={FRAME.left} x2={FRAME.width - FRAME.right} y1={yPressure(maop)} y2={yPressure(maop)} className="stroke-critical-foreground-strong" strokeWidth={1.25} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
          <text x={FRAME.width - FRAME.right + 4} y={yPressure(maop) + 3} className="fill-critical-foreground-strong text-[10px] font-medium">
            MAOP
          </text>
        </g>
      ) : null}
      {basePressure ? <path d={asPressure(basePressure)} className="stroke-muted-foreground" fill="none" strokeWidth={1} strokeDasharray="2 3" vectorEffect="non-scaling-stroke" /> : null}
      <path d={asPressure(pressure)} className="stroke-chart-1-450" fill="none" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <text x={FRAME.width - FRAME.right + 4} y={yPressure(PRESSURE_RANGE[0]) + 3} className="fill-muted-foreground text-[10px]">
        {PRESSURE_RANGE[0]} bar
      </text>

      {/* Stations */}
      {stations.map((station) => (
        <g key={station.id}>
          <line x1={x(station.kp)} x2={x(station.kp)} y1={FRAME.top - 6} y2={FRAME.top} className="stroke-medium-foreground" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <text x={x(station.kp)} y={FRAME.top - 10} textAnchor={station.kp >= totalKm ? 'end' : station.kp <= 0 ? 'start' : 'middle'} className="fill-medium-foreground text-[10px] font-medium">
            {station.label}
          </text>
        </g>
      ))}

      {/* Inspection findings as ticks on the baseline */}
      {anomalies.map((anomaly) => (
        <g key={anomaly.id} data-selected={anomaly.id === selectedAnomalyId}>
          <line x1={x(anomaly.kp)} x2={x(anomaly.kp)} y1={floor - (anomaly.id === selectedAnomalyId ? 16 : 10)} y2={floor} className={TONE_MARK_STROKE[anomaly.tone]} strokeWidth={anomaly.id === selectedAnomalyId ? 3 : 2} vectorEffect="non-scaling-stroke" />
          <rect x={x(anomaly.kp) - 2} y={floor - (anomaly.id === selectedAnomalyId ? 20 : 14)} width={4} height={4} className={TONE_MARK_FILL[anomaly.tone]} />
        </g>
      ))}

      {/* Leak marker */}
      {leak ? (
        <path d={`M ${x(leak.kp)} ${FRAME.top + 14} l 6 6 l -6 6 l -6 -6 z`} className="fill-warning-foreground-strong" />
      ) : null}

      {/* Pig */}
      {pigKp !== null && pigElevation !== null ? (
        <g data-slot="profile-pig">
          <path d={`M ${x(pigKp)} ${pigElevation - 8} l 5 8 l -5 8 l -5 -8 z`} className="fill-base-foreground stroke-base-background" strokeWidth={1.5} />
          <text x={x(pigKp)} y={pigElevation - 12} textAnchor="middle" className="fill-base-foreground text-[10px] font-medium">
            pig
          </text>
        </g>
      ) : null}

      {/* Camera cursor */}
      <g data-slot="profile-cursor">
        <line x1={x(cameraKp)} x2={x(cameraKp)} y1={FRAME.top} y2={floor} className="stroke-[var(--primary-background)]" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <path d={`M ${x(cameraKp) - 6} ${FRAME.top - 1} h 12 l -6 8 z`} className="fill-[var(--primary-background)]" />
      </g>
    </svg>
  );
}
