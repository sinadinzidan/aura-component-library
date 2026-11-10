/** The kinds of file an industrial data product shows differently. */
export type FileKind = 'pdf' | 'drawing' | 'spreadsheet' | 'csv' | 'image' | 'document' | 'model' | 'archive' | 'data' | 'other';

/** Short type name for a row, a legend or an accessible name. */
export const FILE_KIND_LABEL: Record<FileKind, string> = {
  pdf: 'PDF',
  drawing: 'Drawing',
  spreadsheet: 'Spreadsheet',
  csv: 'CSV',
  image: 'Image',
  document: 'Document',
  model: '3D model',
  archive: 'Archive',
  data: 'Data file',
  other: 'File',
};

const KIND_BY_EXTENSION: Record<string, FileKind> = {
  pdf: 'pdf',
  dwg: 'drawing',
  dxf: 'drawing',
  svg: 'drawing',
  xlsx: 'spreadsheet',
  xls: 'spreadsheet',
  csv: 'csv',
  tsv: 'csv',
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  tif: 'image',
  tiff: 'image',
  doc: 'document',
  docx: 'document',
  txt: 'document',
  md: 'document',
  rvm: 'model',
  obj: 'model',
  fbx: 'model',
  e57: 'model',
  zip: 'archive',
  gz: 'archive',
  json: 'data',
  xml: 'data',
  parquet: 'data',
};

/** The extension of a file name in lower case, without the dot. Empty when there is none. */
export function extensionOf(fileName: string): string {
  const base = fileName.trim().split(/[\\/]/).pop() ?? '';
  const dot = base.lastIndexOf('.');
  // A leading dot is a hidden file, not an extension.
  if (dot <= 0 || dot === base.length - 1) return '';
  return base.slice(dot + 1).toLowerCase();
}

/** Which kind of file a name stands for, judged by its extension. */
export function fileKindOf(fileName: string): FileKind {
  return KIND_BY_EXTENSION[extensionOf(fileName)] ?? 'other';
}
