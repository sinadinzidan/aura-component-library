import { render, screen, within } from '@testing-library/react';

import { KeyValueDiff } from './KeyValueDiff';

const BEFORE = { unit: 'barg', source: 'PI', highLimit: '52' };
const AFTER = { unit: 'barg', highLimit: '50', owner: 'Aisha Khan' };

const row = (key: string) => {
  const cell = screen.getByRole('rowheader', { name: key }).closest('tr');
  if (cell === null) throw new Error(`No row for ${key}`);
  return within(cell);
};

describe(KeyValueDiff.name, () => {
  it('summarises how much changed', () => {
    render(<KeyValueDiff label="Changes" before={BEFORE} after={AFTER} />);

    expect(screen.getByText('1 changed · 1 added · 1 removed')).toBeInTheDocument();
  });

  it('writes the kind of change on each changed row', () => {
    render(<KeyValueDiff label="Changes" before={BEFORE} after={AFTER} />);

    expect(row('highLimit').getByText('Changed')).toBeInTheDocument();
    expect(row('owner').getByText('Added')).toBeInTheDocument();
    expect(row('source').getByText('Removed')).toBeInTheDocument();
    expect(row('unit').getByText('Unchanged')).toHaveClass('sr-only');
  });

  it('strikes the old value and shows a placeholder for the missing side', () => {
    render(<KeyValueDiff label="Changes" before={BEFORE} after={AFTER} />);

    expect(row('highLimit').getByText('52')).toHaveClass('line-through');
    expect(row('owner').getByText('—')).toBeInTheDocument();
  });

  it('hides unchanged keys on request and says how many', () => {
    render(<KeyValueDiff label="Changes" before={BEFORE} after={AFTER} changesOnly />);

    expect(screen.queryByRole('rowheader', { name: 'unit' })).not.toBeInTheDocument();
    expect(screen.getByText('1 changed · 1 added · 1 removed · 1 unchanged hidden')).toBeInTheDocument();
  });

  it('says there are no changes and drops the table when only changes are asked for', () => {
    render(<KeyValueDiff label="Changes" before={BEFORE} after={BEFORE} changesOnly />);

    expect(screen.getByText('No changes')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('labels the two versions', () => {
    render(<KeyValueDiff label="Changes" before={BEFORE} after={AFTER} beforeLabel="Revision B" afterLabel="Revision C" />);

    expect(screen.getByRole('columnheader', { name: 'Revision B' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Revision C' })).toBeInTheDocument();
  });
});
