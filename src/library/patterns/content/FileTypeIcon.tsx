import {
  IconBraces,
  IconFile,
  IconFile3d,
  IconFileSpreadsheet,
  IconFileText,
  IconFileTypeCsv,
  IconFileTypePdf,
  IconFileZip,
  IconPhoto,
  IconVector,
} from '@cognite/aura/icons';

import { FILE_KIND_LABEL } from './fileKind';
import type { FileKind } from './fileKind';

const ICONS: Record<FileKind, typeof IconFile> = {
  pdf: IconFileTypePdf,
  drawing: IconVector,
  spreadsheet: IconFileSpreadsheet,
  csv: IconFileTypeCsv,
  image: IconPhoto,
  document: IconFileText,
  model: IconFile3d,
  archive: IconFileZip,
  data: IconBraces,
  other: IconFile,
};

/** Decorative slots tell kinds apart in a long list. They never mean status. */
const TINTS: Record<FileKind, string> = {
  pdf: 'bg-decorative-7-background text-decorative-7-foreground',
  drawing: 'bg-decorative-2-background text-decorative-2-foreground',
  spreadsheet: 'bg-decorative-3-background text-decorative-3-foreground',
  csv: 'bg-decorative-4-background text-decorative-4-foreground',
  image: 'bg-decorative-5-background text-decorative-5-foreground',
  document: 'bg-decorative-1-background text-decorative-1-foreground',
  model: 'bg-decorative-6-background text-decorative-6-foreground',
  archive: 'bg-medium-background text-medium-foreground',
  data: 'bg-medium-background text-medium-foreground',
  other: 'bg-medium-background text-medium-foreground',
};

const SIZES = {
  sm: 'size-6 rounded-md [&>svg]:size-4',
  md: 'size-9 rounded-lg [&>svg]:size-5',
  lg: 'size-11 rounded-lg [&>svg]:size-6',
} as const;

type FileTypeIconProps = {
  kind: FileKind;
  /** `sm` inside dense rows, `md` for list rows and queues, `lg` for tiles and detail headers. */
  size?: keyof typeof SIZES;
  /** Gives each kind its own decorative tint. Leave off where status colour sits close by. */
  tinted?: boolean;
  /** Overrides the type name read to assistive technology. */
  label?: string;
};

/**
 * The glyph that says what kind of file a row is, in a square tile so rows of different types
 * keep one left edge. Aura documents a set of document icons but does not ship them; this maps
 * kinds to system icons in a neutral or decorative tile instead.
 */
export function FileTypeIcon({ kind, size = 'md', tinted = false, label }: FileTypeIconProps) {
  const Icon = ICONS[kind];
  const surface = tinted ? TINTS[kind] : 'bg-medium-background text-medium-foreground';

  return (
    <span
      role="img"
      aria-label={label ?? FILE_KIND_LABEL[kind]}
      data-kind={kind}
      className={`inline-flex shrink-0 items-center justify-center ${SIZES[size]} ${surface}`}
    >
      <Icon aria-hidden="true" />
    </span>
  );
}
