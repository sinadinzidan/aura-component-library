import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { suggestMapping } from './columnMapping';
import type { TargetField } from './columnMapping';
import { MappingTable } from './MappingTable';

const FIELDS: readonly TargetField[] = [
  { id: 'tag', label: 'Tag', required: true, aliases: ['tag no'] },
  { id: 'description', label: 'Description', required: true },
  { id: 'unit', label: 'Unit' },
];

const COLUMNS = [
  { name: 'TAG_NO', samples: ['23-PT-92531', '23-TT-92532'] },
  { name: 'Text', samples: ['Discharge pressure'] },
  { name: 'Unit', samples: ['barg', '°C'] },
];

const SUGGESTED = suggestMapping(
  COLUMNS.map((column) => column.name),
  FIELDS
);

const row = (name: string) => screen.getByRole('rowheader', { name }).closest('tr') ?? document.body;

describe(MappingTable.name, () => {
  it('lists every column with its sample values', () => {
    render(<MappingTable label="Column mapping" columns={COLUMNS} fields={FIELDS} mapping={SUGGESTED} suggested={SUGGESTED} onChange={vi.fn()} />);

    expect(screen.getByRole('table', { name: 'Column mapping' })).toBeInTheDocument();
    expect(within(row('TAG_NO')).getByText('23-PT-92531, 23-TT-92532')).toBeInTheDocument();
  });

  it('labels a suggested match as auto-mapped', () => {
    render(<MappingTable label="Column mapping" columns={COLUMNS} fields={FIELDS} mapping={SUGGESTED} suggested={SUGGESTED} onChange={vi.fn()} />);

    expect(within(row('TAG_NO')).getByText('Auto-mapped')).toBeInTheDocument();
  });

  it('flags an unmapped column while a required field is missing, and lists the field', () => {
    render(<MappingTable label="Column mapping" columns={COLUMNS} fields={FIELDS} mapping={SUGGESTED} suggested={SUGGESTED} onChange={vi.fn()} />);

    expect(within(row('Text')).getByText('Needs attention')).toBeInTheDocument();
    expect(screen.getByText(/A required field has no column/)).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('labels a hand-picked match and clears the error once every required field is mapped', () => {
    const mapping = { ...SUGGESTED, Text: 'description' };
    render(<MappingTable label="Column mapping" columns={COLUMNS} fields={FIELDS} mapping={mapping} suggested={SUGGESTED} onChange={vi.fn()} />);

    expect(within(row('Text')).getByText('Mapped by you')).toBeInTheDocument();
    expect(screen.queryByText(/required field/)).not.toBeInTheDocument();
  });

  it('labels a left-out column as not imported when nothing required is missing', () => {
    const mapping = { ...SUGGESTED, Text: 'description', Unit: null };
    render(<MappingTable label="Column mapping" columns={COLUMNS} fields={FIELDS} mapping={mapping} suggested={SUGGESTED} onChange={vi.fn()} />);

    expect(within(row('Unit')).getByText('Not imported')).toBeInTheDocument();
  });

  it('flags a field that two columns map to', () => {
    const mapping = { ...SUGGESTED, Text: 'unit' };
    render(<MappingTable label="Column mapping" columns={COLUMNS} fields={FIELDS} mapping={mapping} suggested={SUGGESTED} onChange={vi.fn()} />);

    expect(screen.getAllByText('Field used twice')).toHaveLength(2);
  });

  it('reports a new target field for a column', async () => {
    const onChange = vi.fn();
    render(<MappingTable label="Column mapping" columns={COLUMNS} fields={FIELDS} mapping={SUGGESTED} suggested={SUGGESTED} onChange={onChange} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Target field for Text' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Description (required)' }));

    expect(onChange).toHaveBeenCalledWith('Text', 'description');
  });

  it('reports null when a column is left out', async () => {
    const onChange = vi.fn();
    render(<MappingTable label="Column mapping" columns={COLUMNS} fields={FIELDS} mapping={SUGGESTED} suggested={SUGGESTED} onChange={onChange} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Target field for Unit' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Do not import' }));

    expect(onChange).toHaveBeenCalledWith('Unit', null);
  });
});
