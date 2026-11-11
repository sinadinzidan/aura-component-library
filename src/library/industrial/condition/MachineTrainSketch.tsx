import type { KeyboardEvent } from 'react';

import { cn } from '../../../lib/utils';
import { DiagramCanvas } from '../diagrams/DiagramCanvas';
import type { Tone } from '../status';

export type MeasurementPoint = {
  id: string;
  /** Short code printed in the marker: "1H", "2V", "3A". */
  code: string;
  /** Full name for assistive technology and lists: "Motor drive end, horizontal". */
  name: string;
  /** Position on the sketch, in diagram units (the sketch is 420 × 190). */
  x: number;
  y: number;
  /** Status of the latest reading. Paired with `status` text in the accessible name. */
  tone?: Tone;
  status?: string;
};

export type MachineTrainSketchProps = {
  /** What the sketch shows. Becomes the accessible name. */
  label: string;
  points: readonly MeasurementPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Name printed under the driver and the driven machine. */
  driverLabel?: string;
  drivenLabel?: string;
  className?: string;
};

export const MACHINE_SKETCH_WIDTH = 420;
export const MACHINE_SKETCH_HEIGHT = 190;

const TONE_STROKE: Record<Tone, string> = {
  neutral: 'stroke-chart-neutral-450',
  success: 'stroke-chart-neutral-450',
  warning: 'stroke-chart-warning-450',
  critical: 'stroke-chart-critical-450',
  info: 'stroke-chart-info-450',
};

/**
 * A side view of a motor-driven pump with its measurement points: the picker a vibration route or
 * analysis screen uses to say where a reading was taken. Points are buttons — click one or focus
 * it and press Enter — and an abnormal point keeps a coloured ring and says so in its name.
 */
export function MachineTrainSketch({ label, points, selectedId = null, onSelect, driverLabel = 'Motor', drivenLabel = 'Pump', className }: MachineTrainSketchProps) {
  const interactive = onSelect !== undefined;
  const onKey = (event: KeyboardEvent<SVGGElement>, id: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onSelect?.(id);
  };

  return (
    <DiagramCanvas label={label} width={MACHINE_SKETCH_WIDTH} height={MACHINE_SKETCH_HEIGHT} interactive={interactive} className={cn('text-medium-foreground', className)}>
      {/* Base frame and feet */}
      <rect x={24} y={138} width={372} height={10} rx={2} strokeWidth={1.5} className="fill-chart-neutral-100 stroke-chart-neutral-450" />
      <path d="M 60 148 V 158 M 200 148 V 158 M 360 148 V 158" strokeWidth={1.5} strokeLinecap="round" className="stroke-chart-neutral-450" />
      {/* Motor: frame with cooling fins, fan cowl and terminal box */}
      <rect x={52} y={62} width={120} height={64} rx={6} strokeWidth={1.5} className="stroke-chart-neutral-450" />
      <path d="M 72 70 V 118 M 88 70 V 118 M 104 70 V 118 M 120 70 V 118 M 136 70 V 118 M 152 70 V 118" strokeWidth={1} className="stroke-chart-neutral-300" />
      <path d="M 52 68 H 38 Q 32 68 32 74 V 114 Q 32 120 38 120 H 52" strokeWidth={1.5} className="stroke-chart-neutral-450" />
      <rect x={96} y={46} width={34} height={16} rx={2} strokeWidth={1.5} className="stroke-chart-neutral-450" />
      <path d="M 68 126 V 138 M 156 126 V 138" strokeWidth={1.5} className="stroke-chart-neutral-450" />
      {/* Shaft and coupling */}
      <line x1={172} x2={262} y1={94} y2={94} strokeWidth={5} strokeLinecap="round" className="stroke-chart-neutral-300" />
      <rect x={196} y={80} width={10} height={28} rx={2} strokeWidth={1.5} className="fill-chart-neutral-100 stroke-chart-neutral-450" />
      <rect x={208} y={80} width={10} height={28} rx={2} strokeWidth={1.5} className="fill-chart-neutral-100 stroke-chart-neutral-450" />
      {/* Pump: bearing housing, volute and nozzles */}
      <rect x={238} y={76} width={46} height={36} rx={4} strokeWidth={1.5} className="stroke-chart-neutral-450" />
      <path d="M 250 112 V 138 M 272 112 V 138" strokeWidth={1.5} className="stroke-chart-neutral-450" />
      <circle cx={326} cy={94} r={36} strokeWidth={1.5} className="stroke-chart-neutral-450" />
      <circle cx={326} cy={94} r={9} strokeWidth={1.5} className="stroke-chart-neutral-300" />
      <path d="M 314 60 V 30 H 338 V 60" strokeWidth={1.5} strokeLinejoin="round" className="stroke-chart-neutral-450" />
      <path d="M 308 30 H 344" strokeWidth={3} strokeLinecap="round" className="stroke-chart-neutral-450" />
      <path d="M 362 82 H 392 V 106 H 362" strokeWidth={1.5} strokeLinejoin="round" className="stroke-chart-neutral-450" />
      <path d="M 392 76 V 112" strokeWidth={3} strokeLinecap="round" className="stroke-chart-neutral-450" />
      <path d="M 318 130 V 138 M 334 130 V 138" strokeWidth={1.5} className="stroke-chart-neutral-450" />
      <text x={112} y={176} fontSize={11} textAnchor="middle" className="fill-muted-foreground">
        {driverLabel}
      </text>
      <text x={300} y={176} fontSize={11} textAnchor="middle" className="fill-muted-foreground">
        {drivenLabel}
      </text>
      {points.map((point) => {
        const selected = point.id === selectedId;
        const tone = point.tone ?? 'neutral';
        const name = `${point.code}, ${point.name}${point.status ? `, ${point.status}` : ''}`;
        return (
          <g
            key={point.id}
            data-slot="measurement-point"
            data-selected={selected || undefined}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? name : undefined}
            aria-pressed={interactive ? selected : undefined}
            onClick={interactive ? () => onSelect?.(point.id) : undefined}
            onKeyDown={interactive ? (event) => onKey(event, point.id) : undefined}
            className={cn(interactive && 'cursor-pointer outline-none [&:focus-visible>circle:first-of-type]:stroke-[var(--ring-default)]')}
          >
            <circle cx={point.x} cy={point.y} r={15} strokeWidth={2} className={selected ? 'stroke-[var(--primary-background)]' : 'stroke-transparent'} />
            <circle cx={point.x} cy={point.y} r={11} strokeWidth={tone === 'neutral' || tone === 'success' ? 1.5 : 2} className={cn('fill-card-background', TONE_STROKE[tone])} />
            <text x={point.x} y={point.y} fontSize={9.5} textAnchor="middle" dominantBaseline="central" className="fill-base-foreground font-mono font-medium">
              {point.code}
            </text>
          </g>
        );
      })}
    </DiagramCanvas>
  );
}
