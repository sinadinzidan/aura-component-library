import { cn } from '../../../lib/utils';

export type DangerTagProps = {
  /** Number printed on the tag. */
  tagNo: string;
  /** What the tag hangs on: the isolation point, not the equipment worked on. */
  point: string;
  /** Tag of the isolation point. */
  pointTag: string;
  /** The position the point must stay in: "Closed", "Racked out". */
  position: string;
  /** Why it is isolated: the job and its permit or certificate. */
  reason: string;
  lockNo?: string;
  placedBy: string;
  /** When it was hung, e.g. "12 Mar 2026, 06:40". */
  placedAt: string;
  /** Word in the header band. */
  heading?: string;
  /** The instruction in large type. */
  instruction?: string;
  className?: string;
};

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('text-sm text-base-foreground', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  );
}

/**
 * The physical danger tag hung on an isolation point, drawn from tokens: the punched hole, the
 * header band, the instruction in large type and the fields a person fills in by hand. Use it to
 * preview or print a tag, and wherever a screen should look like the thing in the field.
 */
export function DangerTag({ tagNo, point, pointTag, position, reason, lockNo, placedBy, placedAt, heading = 'Danger', instruction = 'Do not operate', className }: DangerTagProps) {
  return (
    <article data-slot="danger-tag" aria-label={`Danger tag ${tagNo}: ${instruction.toLowerCase()} ${pointTag}`} className={cn('flex w-56 flex-col overflow-hidden rounded-xl border-2 border-critical-foreground-strong bg-base-background', className)}>
      <div className="flex justify-center pt-2.5 pb-2">
        <span aria-hidden="true" className="size-4 rounded-full border-2 border-emphasized bg-muted-background" />
      </div>
      <div className="bg-critical-background px-3 py-1.5 text-center text-sm font-semibold tracking-widest text-critical-foreground uppercase">{heading}</div>
      <div className="flex flex-col gap-3 px-3 pt-3 pb-3">
        <p className="text-center text-xl leading-6 font-semibold text-base-foreground uppercase">{instruction}</p>
        <dl className="flex flex-col gap-2 border-t border-default pt-3">
          <Field label="Isolation point" value={point} />
          <div className="grid grid-cols-2 gap-x-3">
            <Field label="Tag" value={pointTag} mono />
            <Field label="Leave" value={position} />
          </div>
          <Field label="Reason" value={reason} />
          <div className="grid grid-cols-2 gap-x-3">
            <Field label="Tag no." value={tagNo} mono />
            {lockNo ? <Field label="Lock no." value={lockNo} mono /> : null}
          </div>
          <Field label="Placed by" value={placedBy} />
          <div className="flex flex-col">
            <dt className="text-xs text-muted-foreground">Date and time</dt>
            <dd className="text-sm tabular-nums text-base-foreground">{placedAt}</dd>
          </div>
        </dl>
        <p className="border-t border-default pt-2 text-xs text-muted-foreground">Only the person named may remove this tag.</p>
      </div>
    </article>
  );
}
