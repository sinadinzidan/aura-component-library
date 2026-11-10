import { render, screen, within } from '@testing-library/react';

import { StateMatrix } from './StateMatrix';

const COLUMNS = [
  { id: 'default', label: 'Default' },
  { id: 'hover', label: 'Hover', hint: 'Static look-alike' },
];

describe(StateMatrix.name, () => {
  it('names the table with its caption', () => {
    render(<StateMatrix caption="Button states" columns={COLUMNS} rows={[]} />);

    expect(screen.getByRole('table', { name: 'Button states' })).toBeInTheDocument();
  });

  it('renders a column header per state, with its hint', () => {
    render(<StateMatrix caption="States" columns={COLUMNS} rows={[]} />);

    expect(screen.getByRole('columnheader', { name: 'Default' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Hover/ })).toHaveTextContent('Static look-alike');
  });

  it('renders each cell under its row header', () => {
    render(
      <StateMatrix
        caption="States"
        columns={COLUMNS}
        rows={[{ id: 'button', label: 'Button', cells: { default: <button>Save</button>, hover: <span>Hovered</span> } }]}
      />
    );

    const row = screen.getByRole('row', { name: /Button/ });
    expect(within(row).getByRole('rowheader', { name: 'Button' })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(within(row).getByText('Hovered')).toBeInTheDocument();
  });

  it('marks a missing cell as not applicable', () => {
    render(
      <StateMatrix caption="States" columns={COLUMNS} rows={[{ id: 'tab', label: 'Tab', cells: { default: 'Trend' } }]} />
    );

    expect(screen.getByText('Not applicable')).toBeInTheDocument();
  });

  it('uses a custom first column header', () => {
    render(<StateMatrix caption="States" rowHeader="Family" columns={COLUMNS} rows={[]} />);

    expect(screen.getByRole('columnheader', { name: 'Family' })).toBeInTheDocument();
  });
});
