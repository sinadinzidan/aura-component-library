import { IconLock } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { EntityRow } from '../collections/EntityRow';

import { FILE_KIND_LABEL, fileKindOf } from './fileKind';
import type { FileKind } from './fileKind';
import { FileTypeIcon } from './FileTypeIcon';
import { formatBytes } from './formatBytes';

type FileRowProps = {
  /** File name with its extension. The type icon is read from it unless `kind` is given. */
  name: string;
  kind?: FileKind;
  /** Size in bytes. */
  size?: number;
  /** When it last changed, already formatted: "4 Mar", "2 h ago". */
  modified?: string;
  /** Who owns or last changed it. */
  owner?: string;
  /** Name of the person who has the file checked out. Shows a lock beside the name. */
  lockedBy?: string;
  /** Tints the type icon. Leave off in lists that also show status colour. */
  tinted?: boolean;
  /** Extra always-visible content before the modified date, such as a revision or a badge. */
  meta?: ReactNode;
  /** Icon buttons shown on hover and focus. */
  actions?: ReactNode;
  /** Controls that stay visible, such as an overflow menu. */
  trailing?: ReactNode;
  density?: 'comfortable' | 'dense';
  selected?: boolean;
  onOpen?: () => void;
  selection?: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
  };
};

/**
 * One file in a list: type icon, name, then type, size and owner on the second line and the
 * modified date at the end. Built on `EntityRow`, so files line up with every other collection,
 * and the size and type are always written the same way.
 */
export function FileRow({
  name,
  kind,
  size,
  modified,
  owner,
  lockedBy,
  tinted = false,
  meta,
  actions,
  trailing,
  density = 'comfortable',
  selected = false,
  onOpen,
  selection,
}: FileRowProps) {
  const resolved = kind ?? fileKindOf(name);
  const facts = [FILE_KIND_LABEL[resolved], size === undefined ? null : formatBytes(size), owner ?? null].filter(
    (fact): fact is string => fact !== null
  );
  const dense = density === 'dense';

  return (
    <EntityRow
      density={density}
      selected={selected}
      onOpen={onOpen}
      selection={selection}
      leading={<FileTypeIcon kind={resolved} size={dense ? 'sm' : 'md'} tinted={tinted} />}
      title={
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="min-w-0 truncate" title={name}>
            {name}
          </span>
          {lockedBy ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-normal text-muted-foreground">
              <IconLock aria-hidden="true" className="size-3.5" />
              Checked out by {lockedBy}
            </span>
          ) : null}
        </span>
      }
      description={dense ? undefined : <span className="tabular-nums">{facts.join(' · ')}</span>}
      meta={
        meta || modified || dense ? (
          <>
            {meta}
            {dense && size !== undefined ? <span className="tabular-nums">{formatBytes(size)}</span> : null}
            {modified ? <span className="tabular-nums">{modified}</span> : null}
          </>
        ) : undefined
      }
      actions={actions}
      trailing={trailing}
    />
  );
}
