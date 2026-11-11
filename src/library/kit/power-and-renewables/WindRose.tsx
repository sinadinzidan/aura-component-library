import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

import { compassPoint, wedgePath } from './power';

export type WindSector = { direction: string; value: number };

type WindRoseProps = {
  /** What the rose shows: "Wind direction, last 30 days". */
  label: string;
  /** Sectors clockwise from north, with the share of time in per cent. */
  sectors: readonly WindSector[];
  /** Diameter in px. */
  size?: number;
  tone?: Tone;
  className?: string;
};

/**
 * Where the wind comes from: one wedge per compass sector, as long as its share of time. The
 * prevailing sector is drawn in full colour and named in words underneath, so the answer does not
 * depend on reading the shape. Wedges are outlined on a blueprint and hard-edged on a poster.
 */
export function WindRose({ label, sectors, size = 240, tone = 'accent', className }: WindRoseProps) {
  const look = useLook();
  const centre = size / 2;
  const outer = size / 2 - 26;
  const max = Math.max(...sectors.map((sector) => sector.value), 1);
  const scaleMax = Math.ceil(max / 10) * 10;
  const rings = Array.from({ length: scaleMax / 10 }, (_, index) => (index + 1) * 10);
  const spread = 360 / sectors.length;
  const prevailing = sectors.reduce((best, sector) => (sector.value > best.value ? sector : best), sectors[0]);
  const outlined = look === 'blueprint' || look === 'editorial';

  return (
    <figure data-look={look} data-tone={tone} className={cx('flex min-w-0 flex-col items-center gap-3', className)}>
      <svg role="img" aria-label={`${label}. Prevailing from ${prevailing.direction}, ${formatNumber(prevailing.value, 0)} per cent of the time.`} width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {rings.map((ring) => (
          <circle key={ring} cx={centre} cy={centre} r={(ring / scaleMax) * outer} fill="none" style={{ stroke: 'var(--kit-grid)' }} strokeWidth={1} strokeDasharray={ring === scaleMax ? undefined : '3 4'} />
        ))}
        {sectors.map((sector, index) => {
          const [x, y] = compassPoint(centre, centre, outer, index * spread);
          return <line key={sector.direction} x1={centre} y1={centre} x2={x} y2={y} style={{ stroke: 'var(--kit-grid)' }} strokeWidth={1} />;
        })}
        {sectors.map((sector, index) => {
          const top = sector === prevailing;
          return (
            <path
              key={sector.direction}
              data-sector={sector.direction}
              data-prevailing={top || undefined}
              d={wedgePath(centre, centre, Math.max(2, (sector.value / scaleMax) * outer), index * spread, spread * (look === 'poster' ? 0.96 : 0.82))}
              style={{
                fill: 'var(--t-line)',
                fillOpacity: outlined ? (top ? 0.3 : 0.06) : top ? 1 : look === 'poster' ? 0.55 : 0.38,
                stroke: outlined ? 'var(--t-line)' : look === 'poster' ? 'var(--kit-text)' : 'var(--kit-halo)',
                strokeWidth: look === 'poster' ? 2 : 1.25,
              }}
              strokeLinejoin="round"
            />
          );
        })}
        {sectors.map((sector, index) => {
          const [x, y] = compassPoint(centre, centre, outer + 15, index * spread);
          return (
            <text key={sector.direction} x={x} y={y + 4} textAnchor="middle" fontSize={12} fontWeight={sector === prevailing ? 700 : 500} style={{ fill: sector === prevailing ? 'var(--kit-text)' : 'var(--kit-text-3)' }}>
              {sector.direction}
            </text>
          );
        })}
        <text x={centre + 4} y={centre - outer + 14} fontSize={12} style={{ fill: 'var(--kit-text-3)', stroke: 'var(--kit-halo)', strokeWidth: 3, paintOrder: 'stroke', fontVariantNumeric: 'tabular-nums' }}>
          {scaleMax} %
        </text>
      </svg>
      <figcaption className="text-center text-sm text-(--kit-text-2)">
        Prevailing from <strong className="font-semibold text-(--kit-text)">{prevailing.direction}</strong>, <span className="tabular-nums">{formatNumber(prevailing.value, 0)} %</span> of the time
      </figcaption>
    </figure>
  );
}
