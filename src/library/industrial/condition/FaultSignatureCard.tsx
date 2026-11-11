import { cn } from '../../../lib/utils';

import type { FaultSignature } from './faults';

export type FaultSignatureCardProps = {
  signature: FaultSignature;
  /** Highest order on the axis of the typical spectrum. */
  maxOrder?: number;
  /** Marks the card as the one matching the current finding. */
  matched?: boolean;
  className?: string;
};

/**
 * A reference card for one fault: its typical spectrum drawn as lines at orders of running speed,
 * what the pattern is, how to confirm it and what to do. Use a set of them as the key beside a
 * live spectrum.
 */
export function FaultSignatureCard({ signature, maxOrder = 8, matched = false, className }: FaultSignatureCardProps) {
  const lines = signature.lines.filter((line) => line.order <= maxOrder);
  const ticks = Array.from({ length: Math.floor(maxOrder) }, (_, index) => index + 1);

  return (
    <article
      data-slot="fault-signature-card"
      data-matched={matched || undefined}
      className={cn('flex w-full min-w-0 flex-col gap-3 rounded-xl border bg-card-background p-4', matched ? 'border-emphasized' : 'border-default', className)}
    >
      <header className="flex items-baseline justify-between gap-3">
        <h4 className="text-sm font-medium text-base-foreground">{signature.name}</h4>
        {matched ? <span className="shrink-0 text-xs font-medium text-base-foreground">Matches this spectrum</span> : null}
      </header>
      <div role="img" aria-label={`Typical spectrum of ${signature.name.toLowerCase()}: ${signature.pattern}`} className="flex flex-col">
        <div className="relative h-20">
          <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" className="absolute inset-0 size-full overflow-visible">
            <line x1={0} x2={100} y1={100} y2={100} strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-chart-neutral-300" />
            {lines.map((line) => (
              <line key={line.order} data-slot="signature-line" x1={(line.order / maxOrder) * 100} x2={(line.order / maxOrder) * 100} y1={100} y2={100 - line.height * 78} strokeWidth={line.label ? 2.5 : 1.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" className={line.label ? 'stroke-chart-1-450' : 'stroke-chart-1-300'} />
            ))}
          </svg>
          {lines.map((line) =>
            line.label ? (
              <span key={line.order} className="absolute -translate-x-1/2 -translate-y-full whitespace-nowrap pb-1 text-xs font-medium leading-none text-base-foreground tabular-nums" style={{ left: `${(line.order / maxOrder) * 100}%`, top: `${100 - line.height * 78}%` }}>
                {line.label}
              </span>
            ) : null
          )}
        </div>
        <div aria-hidden="true" className="relative h-4">
          {ticks.map((tick) => (
            <span key={tick} className={cn('absolute top-1 text-xs leading-none text-muted-foreground tabular-nums', tick === maxOrder ? '-translate-x-full' : '-translate-x-1/2')} style={{ left: `${(tick / maxOrder) * 100}%` }}>
              {tick}
            </span>
          ))}
        </div>
        <span className="pt-1 text-right text-xs text-muted-foreground">Orders of running speed</span>
      </div>
      <dl className="flex flex-col gap-2 text-sm">
        {[
          { term: 'Pattern', text: signature.pattern },
          { term: 'Confirm', text: signature.confirm },
          { term: 'Action', text: signature.action },
        ].map((item) => (
          <div key={item.term} className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{item.term}</dt>
            <dd className="text-medium-foreground">{item.text}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
