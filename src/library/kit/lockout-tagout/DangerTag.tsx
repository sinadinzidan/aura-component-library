import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

type DangerTagProps = {
  /** The warning on the band: "Do not operate", "Do not close". */
  warning: string;
  /** Tag of the isolation point. */
  tag: string;
  /** What the point is: "Suction valve, recompressor". */
  point: string;
  /** The position it must stay in: "Closed", "Open and racked out". */
  position: string;
  lock: string;
  /** Who applied it. */
  by: string;
  /** When: "12 Mar, 09:40". */
  date: string;
  /** Certificate or permit the tag belongs to. */
  certificate: string;
  className?: string;
};

/**
 * The tag that hangs on a locked isolation point, drawn as the physical thing: a punched hole, a
 * filled warning band and the fields a person reads before touching the point. The warning is
 * written in words; the colour only reinforces it.
 */
export function DangerTag({ warning, tag, point, position, lock, by, date, certificate, className }: DangerTagProps) {
  const look = useLook();
  const square = look === 'console' || look === 'poster' || look === 'blueprint' || look === 'signal';
  const fields = [
    { name: 'Point', value: point },
    { name: 'Keep', value: position },
    { name: 'Lock', value: lock },
    { name: 'Applied by', value: by },
    { name: 'Date', value: date },
    { name: 'Certificate', value: certificate },
  ];

  return (
    <article
      aria-label={`Danger tag for ${tag}: ${warning}`}
      data-look={look}
      data-tone="critical"
      className={cx('flex w-full max-w-64 min-w-0 flex-col overflow-hidden border-2 border-(--t-solid) bg-(--kit-surface) text-(--kit-text)', square ? '' : 'rounded-t-[1.75rem] rounded-b-(--kit-radius-sm)', className)}
    >
      <div aria-hidden="true" className="flex justify-center pt-3 pb-2">
        <span className="size-5 rounded-full border-2 border-(--kit-rule-strong) bg-(--kit-well)" />
      </div>
      <header className="bg-(--t-solid) px-4 py-3 text-center text-(--t-on-solid)">
        <p className="text-sm leading-5 font-semibold">Danger</p>
        <p className="text-xl leading-6 font-bold tracking-tight">{warning}</p>
      </header>
      <div className="px-4 pt-3">
        <p className="text-lg leading-6 font-semibold tabular-nums">{tag}</p>
      </div>
      <dl className="flex flex-col px-4 pt-1 pb-4">
        {fields.map((field) => (
          <div key={field.name} className="flex items-baseline justify-between gap-3 border-b border-(--kit-rule) py-1.5 last:border-b-0">
            <dt className="text-xs text-(--kit-text-2)">{field.name}</dt>
            <dd className="text-right text-sm font-medium tabular-nums">{field.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
