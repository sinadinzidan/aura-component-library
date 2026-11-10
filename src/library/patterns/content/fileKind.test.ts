import { FILE_KIND_LABEL, extensionOf, fileKindOf } from './fileKind';

describe(extensionOf.name, () => {
  it('returns the last extension in lower case', () => {
    expect(extensionOf('P&ID 23-KA-9101 rev C.PDF')).toBe('pdf');
    expect(extensionOf('export.2026-03.csv')).toBe('csv');
  });

  it('ignores folders in the path', () => {
    expect(extensionOf('drawings/rev.c/layout.dwg')).toBe('dwg');
    expect(extensionOf('C:\\scans\\bearing.jpg')).toBe('jpg');
  });

  it('returns nothing for names without an extension', () => {
    expect(extensionOf('README')).toBe('');
    expect(extensionOf('.gitignore')).toBe('');
    expect(extensionOf('report.')).toBe('');
  });
});

describe(fileKindOf.name, () => {
  it.each([
    ['P&ID 23-KA-9101 rev C.pdf', 'pdf'],
    ['Compression area layout.dwg', 'drawing'],
    ['Vibration survey Q1.xlsx', 'spreadsheet'],
    ['datapoints.csv', 'csv'],
    ['Drive-end bearing, borescope.jpg', 'image'],
    ['Shift handover.docx', 'document'],
    ['NK-23 module.rvm', 'model'],
    ['handover-package.zip', 'archive'],
    ['asset-hierarchy.json', 'data'],
  ] as const)('reads %s as %s', (name, kind) => {
    expect(fileKindOf(name)).toBe(kind);
  });

  it('falls back to a generic file', () => {
    expect(fileKindOf('historian.bak')).toBe('other');
    expect(fileKindOf('notes')).toBe('other');
  });

  it('has a label for every kind', () => {
    expect(FILE_KIND_LABEL[fileKindOf('a.pdf')]).toBe('PDF');
    expect(FILE_KIND_LABEL[fileKindOf('a.unknown')]).toBe('File');
  });
});
