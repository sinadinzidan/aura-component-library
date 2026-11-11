import type { CSSProperties } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type TrainStageId = 'turbine' | 'gearbox' | 'lp' | 'hp';

export type TrainStage = {
  id: TrainStageId;
  /** Name read out and shown under the machine: "1st stage compressor". */
  label: string;
  /** Condition of the stage; colours its bearings. */
  tone?: Tone;
};

export type TrainReadout = {
  id: string;
  label: string;
  /** The value with its unit, already formatted. */
  value: string;
  /** Point on the drawing the tag is pinned to, in drawing units (1000 × 400). */
  at: readonly [number, number];
  /** Centre of the floating chip, in the same units. */
  chip: readonly [number, number];
  tone?: Tone;
  /** A word for the state when it is not normal: "High", "Near limit". */
  state?: string;
};

type TrainSchematicProps = {
  /** What the drawing shows, for assistive technology. */
  label: string;
  stages: readonly TrainStage[];
  selectedId?: TrainStageId | null;
  onSelect?: (id: TrainStageId) => void;
  /** Live tags pinned to the machine. */
  readouts?: readonly TrainReadout[];
  /** Hide the stage names under the machine, for small sizes. */
  hideNames?: boolean;
  className?: string;
};

const SHAFT = 250;

/** Hit boxes per stage in drawing units: x, y, width, height. */
const BOXES: Record<TrainStageId, readonly [number, number, number, number]> = {
  turbine: [44, 122, 224, 190],
  gearbox: [278, 196, 76, 116],
  lp: [396, 154, 200, 158],
  hp: [666, 164, 170, 148],
};

const BEARINGS: readonly (readonly [TrainStageId, number])[] = [
  ['lp', 388],
  ['lp', 592],
  ['hp', 656],
  ['hp', 832],
];

const LP_IMPELLERS = [432, 472, 512, 552].map((x, index) => ({ x, half: 42 - index * 3 }));
const HP_IMPELLERS = [698, 732, 766, 800].map((x, index) => ({ x, half: 32 - index * 2 }));

function impeller(x: number, half: number): string {
  return `${x - 14},${SHAFT - 4} ${x + 8},${SHAFT - half} ${x + 14},${SHAFT - half} ${x + 14},${SHAFT + half} ${x + 8},${SHAFT + half} ${x - 14},${SHAFT + 4}`;
}

function percent(value: number, of: number): string {
  return `${(value / of) * 100}%`;
}

/**
 * A compressor train in cross-section: gas turbine driver, gearbox, two barrel compressors with
 * their impellers on one shaft, the interstage cooler above, and the gas path through them.
 * Stages are selectable; live tags float beside the machine on leader lines.
 */
export function TrainSchematic({ label, stages, selectedId, onSelect, readouts = [], hideNames = false, className }: TrainSchematicProps) {
  const look = useLook();
  const tone = (id: TrainStageId): Tone => stages.find((stage) => stage.id === id)?.tone ?? 'neutral';
  const body = (id: TrainStageId): CSSProperties =>
    id === selectedId
      ? { color: 'var(--kit-line-accent)', filter: 'drop-shadow(0 0 10px var(--kit-line-accent))' }
      : { color: 'var(--kit-text-2)' };
  const fill = (id: TrainStageId): string =>
    id === selectedId ? 'color-mix(in oklab, var(--kit-line-accent) 22%, transparent)' : 'color-mix(in oklab, var(--kit-text) 7%, transparent)';

  return (
    <div data-look={look} role="group" aria-label={label} className={cx('relative aspect-[1000/400] w-full min-w-0 text-(--kit-text)', className)}>
      <svg viewBox="0 0 1000 400" aria-hidden="true" className="absolute inset-0 size-full overflow-visible" fill="none" strokeLinejoin="round" strokeLinecap="round">
        {/* Skid */}
        <g stroke="var(--kit-rule-strong)" strokeWidth="2">
          <path d="M36 322H862" />
          <path d="M70 300V322M240 300V322M292 300V322M340 300V322M420 308V322M570 308V322M690 298V322M812 298V322" />
          <path d="M36 322l-10 12M96 322l-10 12M156 322l-10 12M216 322l-10 12M276 322l-10 12M336 322l-10 12M396 322l-10 12M456 322l-10 12M516 322l-10 12M576 322l-10 12M636 322l-10 12M696 322l-10 12M756 322l-10 12M816 322l-10 12" strokeWidth="1" />
        </g>

        {/* Gas path */}
        <g stroke="var(--kit-line-accent)" strokeWidth="5" opacity="0.9" style={{ filter: 'drop-shadow(0 0 6px var(--kit-line-accent))' }}>
          <path d="M300 90H425V158" />
          <path d="M565 158V90H598" />
          <path d="M664 90H690V168" />
          <path d="M810 168V90H948" />
        </g>
        <g fill="var(--kit-line-accent)">
          <path d="M352 82l14 8-14 8zM418 128l7 14 7-14zM558 128l7-14 7 14zM683 136l7 14 7-14zM803 132l7-14 7 14zM890 82l14 8-14 8zM948 80l18 10-18 10z" />
        </g>

        {/* Interstage cooler */}
        <g stroke="var(--kit-text-2)" strokeWidth="2">
          <rect x="598" y="68" width="66" height="44" rx="22" fill="color-mix(in oklab, var(--kit-text) 7%, transparent)" />
          <path d="M612 80H650M608 90H654M612 100H650" strokeWidth="1.5" />
        </g>

        {/* Shaft */}
        <path d={`M250 ${SHAFT}H852`} stroke="var(--kit-text-2)" strokeWidth="7" />
        <path d={`M250 ${SHAFT}H852`} stroke="var(--kit-halo)" strokeWidth="2" strokeDasharray="2 14" />

        {/* Gas turbine */}
        <g style={body('turbine')} stroke="currentColor" strokeWidth="2.5">
          <path d="M52 212L92 224V276L52 288Z" fill={fill('turbine')} />
          <path d="M92 222H150C150 200 186 200 188 224L250 204V296L188 276C186 300 150 300 150 278H92Z" fill={fill('turbine')} />
          <path d="M104 226V274M116 226V274M128 226V274M140 226V274M200 222V278M214 218V282M228 213V287" strokeWidth="1.5" />
          <path d="M226 211V150C226 136 236 128 250 128H262V140H252C244 140 240 144 240 152V207" fill={fill('turbine')} />
        </g>

        {/* Gearbox */}
        <g style={body('gearbox')} stroke="currentColor" strokeWidth="2.5">
          <rect x="284" y="202" width="64" height="100" rx="8" fill={fill('gearbox')} />
          <circle cx="308" cy="258" r="24" strokeWidth="1.5" strokeDasharray="4 3" />
          <circle cx="330" cy="228" r="14" strokeWidth="1.5" strokeDasharray="4 3" />
        </g>

        {/* 1st stage compressor */}
        <g style={body('lp')} stroke="currentColor" strokeWidth="2.5">
          <path d="M407 158H443M413 158V194H437V158M547 158H583M553 158V194H577V158" fill={fill('lp')} />
          <rect x="402" y="194" width="188" height="112" rx="20" fill={fill('lp')} />
          {LP_IMPELLERS.map((item) => (
            <polygon key={item.x} points={impeller(item.x, item.half)} strokeWidth="1.5" fill={fill('lp')} />
          ))}
        </g>

        {/* 2nd stage compressor */}
        <g style={body('hp')} stroke="currentColor" strokeWidth="2.5">
          <path d="M672 168H708M678 168V204H702V168M792 168H828M798 168V204H822V168" fill={fill('hp')} />
          <rect x="672" y="204" width="158" height="92" rx="18" fill={fill('hp')} />
          {HP_IMPELLERS.map((item) => (
            <polygon key={item.x} points={impeller(item.x, item.half)} strokeWidth="1.5" fill={fill('hp')} />
          ))}
        </g>

        {/* Couplings and bearings */}
        <g stroke="var(--kit-text-2)" strokeWidth="2" fill="var(--kit-halo)">
          <rect x="258" y="240" width="18" height="20" rx="3" />
          <rect x="358" y="240" width="18" height="20" rx="3" />
          <rect x="618" y="240" width="18" height="20" rx="3" />
        </g>
        {BEARINGS.map(([id, x]) => (
          <rect key={x} x={x} y="234" width="12" height="32" rx="3" data-tone={tone(id)} fill="var(--t-line)" style={{ filter: 'drop-shadow(0 0 5px var(--t-line))' }} />
        ))}

        {/* Leader lines */}
        {readouts.map((readout) => (
          <g key={readout.id} data-tone={readout.tone ?? 'neutral'} stroke="var(--kit-rule-strong)" strokeWidth="1.25">
            <path d={`M${readout.at[0]} ${readout.at[1]}L${readout.chip[0]} ${readout.chip[1]}`} strokeDasharray="3 4" />
            <circle cx={readout.at[0]} cy={readout.at[1]} r="4.5" fill="var(--t-line)" stroke="var(--kit-halo)" strokeWidth="2" />
          </g>
        ))}
      </svg>

      {stages.map((stage) => {
        const [x, y, width, height] = BOXES[stage.id];
        const selected = stage.id === selectedId;
        return (
          <button
            key={stage.id}
            type="button"
            aria-pressed={selected}
            aria-label={stage.label}
            onClick={() => onSelect?.(stage.id)}
            className="absolute cursor-pointer rounded-2xl outline-none hover:bg-(--kit-track) focus-visible:ring-2 focus-visible:ring-(--kit-text)"
            style={{ left: percent(x, 1000), top: percent(y, 400), width: percent(width, 1000), height: percent(height, 400) }}
          />
        );
      })}

      {hideNames
        ? null
        : stages.map((stage) => {
            const [x, , width] = BOXES[stage.id];
            const selected = stage.id === selectedId;
            return (
              <span
                key={stage.id}
                aria-hidden="true"
                className={cx(
                  'pointer-events-none absolute -translate-x-1/2 text-center text-xs leading-4',
                  selected ? 'font-semibold text-(--kit-text)' : 'font-medium text-(--kit-text-3)'
                )}
                style={{ left: percent(x + width / 2, 1000), top: percent(336, 400), width: percent(Math.max(width, 120), 1000) }}
              >
                {stage.label}
              </span>
            );
          })}

      {readouts.map((readout) => (
        <div
          key={readout.id}
          data-tone={readout.tone ?? 'neutral'}
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-(--kit-rule) bg-(--kit-halo) px-3 py-1.5 whitespace-nowrap shadow-lg"
          style={{ left: percent(readout.chip[0], 1000), top: percent(readout.chip[1], 400) }}
        >
          <p className="text-xs leading-4 text-(--kit-text-3)">{readout.label}</p>
          <p className="flex items-baseline gap-1.5 text-base leading-5 font-semibold tabular-nums">
            {readout.value}
            {readout.state ? <span className="text-xs font-semibold text-(--t-ink)">{readout.state}</span> : null}
          </p>
        </div>
      ))}
    </div>
  );
}
