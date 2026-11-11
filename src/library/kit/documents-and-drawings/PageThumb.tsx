import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import type { DocumentKind } from './documents';

type PageThumbProps = {
  /** What the page is, for assistive technology: "First page of NK-23-PR-0012". */
  label: string;
  kind: DocumentKind;
  /** Stamped in the title block. */
  revision?: string;
  /** Layout classes: a width such as `w-28`. Height follows the paper format. */
  className?: string;
};

const TEXT_LINES = [92, 100, 84, 96, 60, 0, 100, 88, 94, 72];
const INK = 'var(--kit-text-3)';

/**
 * A page preview drawn from shapes: a landscape sheet with line art for drawings, a portrait
 * page with ruled text for procedures and reports, a form grid for data sheets and certificates.
 * It shows what kind of document to expect without loading it.
 */
export function PageThumb({ label, kind, revision, className }: PageThumbProps) {
  const look = useLook();
  const landscape = kind === 'pid' || kind === 'drawing';
  const form = kind === 'datasheet' || kind === 'certificate';

  return (
    <div
      role="img"
      aria-label={label}
      data-look={look}
      data-format={landscape ? 'landscape' : 'portrait'}
      className={cx('relative overflow-hidden bg-[var(--kit-halo)]', landscape ? 'aspect-[7/5]' : 'aspect-[5/7]', className)}
      style={{ border: '1px solid var(--kit-rule-strong)', borderRadius: 'min(var(--kit-radius-sm), 6px)' }}
    >
      {landscape ? (
        <svg viewBox="0 0 140 100" aria-hidden="true" className="absolute inset-0 h-full w-full" fill="none" stroke={INK} strokeWidth="1.5" vectorEffect="non-scaling-stroke">
          <rect x="6" y="6" width="128" height="88" />
          <path d="M14 58 H34 M46 58 H62 M82 58 H96 M112 58 H128" />
          <path d="M34 52 L46 64 M34 64 L46 52" />
          <circle cx="72" cy="58" r="10" />
          <path d="M66 52 L80 58 L66 64 Z" />
          <rect x="96" y="50" width="16" height="16" rx="8" />
          <path d="M72 48 V34 M104 50 V34" strokeDasharray="3 3" />
          <circle cx="72" cy="28" r="6" />
          <circle cx="104" cy="28" r="6" />
          <rect x="98" y="78" width="36" height="16" />
        </svg>
      ) : form ? (
        <div className="absolute inset-[10%] flex flex-col">
          <span className="mb-[8%] h-[7%] w-3/5" style={{ background: INK }} />
          <div className="grid flex-1 grid-cols-[2fr_3fr]" style={{ borderTop: `1px solid ${INK}`, borderLeft: `1px solid ${INK}` }}>
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index} style={{ borderRight: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }} />
            ))}
          </div>
        </div>
      ) : (
        <div className="absolute inset-[11%] flex flex-col gap-[4.5%]">
          <span className="mb-[4%] h-[7%] w-2/3" style={{ background: INK }} />
          {TEXT_LINES.map((width, index) => (
            <span key={index} className="h-[2.5%] rounded-full" style={{ width: `${width}%`, background: width === 0 ? 'transparent' : 'var(--kit-rule-strong)' }} />
          ))}
        </div>
      )}
      {revision ? (
        <span className="absolute bottom-1 right-1 bg-[var(--kit-halo)] px-1 text-xs font-semibold leading-4 tabular-nums text-[var(--kit-text-2)]">Rev {revision}</span>
      ) : null}
    </div>
  );
}
