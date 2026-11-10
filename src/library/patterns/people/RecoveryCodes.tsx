import { Button } from '@cognite/aura/components/button';
import { IconDownload } from '@cognite/aura/icons';

import { CopyButton } from '../../actions/CopyButton';

type RecoveryCodesProps = {
  /** Names the list: "Recovery codes". */
  label?: string;
  codes: readonly string[];
  /** Codes that have already been spent. They stay in place, struck through. */
  usedCodes?: readonly string[];
  /** Receives the unused codes, one per line. Omit to hide the download button. */
  onDownload?: (text: string) => void;
  writeText?: (text: string) => Promise<void>;
};

/**
 * A block of single-use recovery codes with copy and download. Codes sit in two monospace columns
 * so they are easy to read off a screen or a printout; used ones are struck through and announced
 * as used, and only the unused ones are copied or downloaded.
 */
export function RecoveryCodes({ label = 'Recovery codes', codes, usedCodes = [], onDownload, writeText }: RecoveryCodesProps) {
  const unused = codes.filter((code) => !usedCodes.includes(code));
  const text = unused.join('\n');

  return (
    <div className="flex w-full flex-col gap-3">
      <ul aria-label={label} className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg bg-muted-background p-4">
        {codes.map((code) => {
          const used = usedCodes.includes(code);
          return (
            <li
              key={code}
              className={`font-mono text-sm tabular-nums ${used ? 'text-muted-foreground line-through' : 'text-base-foreground'}`}
            >
              {code}
              {used ? <span className="sr-only"> (used)</span> : null}
            </li>
          );
        })}
      </ul>
      <p className="text-xs tabular-nums text-muted-foreground">
        {unused.length} of {codes.length} left
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton variant="secondary" size="sm" text={text} label="Copy codes" writeText={writeText} />
        {onDownload ? (
          <Button variant="secondary" size="sm" onClick={() => onDownload(text)}>
            <IconDownload /> Download codes
          </Button>
        ) : null}
      </div>
    </div>
  );
}
