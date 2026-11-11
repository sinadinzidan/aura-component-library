import { render, screen } from '@testing-library/react';

import type { SelectionStats } from './selectionStats';
import { SheetStatusBar } from './SheetStatusBar';

const STATS: SelectionStats = { count: 5, numericCount: 4, sum: 1234.5, average: 308.625, min: 10, max: 900 };
const ONE: SelectionStats = { count: 1, numericCount: 1, sum: 52, average: 52, min: 52, max: 52 };

describe(SheetStatusBar.name, () => {
  it('shows the range and the count', () => {
    render(<SheetStatusBar range="B2:C6" stats={STATS} />);

    expect(screen.getByText('B2:C6')).toBeInTheDocument();
    expect(screen.getByText('Count').nextElementSibling).toHaveTextContent('5');
  });

  it('shows sum and average for two or more numbers', () => {
    render(<SheetStatusBar range="B2:C6" stats={STATS} />);

    expect(screen.getByText('Sum').nextElementSibling).toHaveTextContent('1,234.5');
    expect(screen.getByText('Average').nextElementSibling).toHaveTextContent('308.63');
  });

  it('leaves out sum and average for a single number', () => {
    render(<SheetStatusBar range="B2" stats={ONE} />);

    expect(screen.queryByText('Sum')).not.toBeInTheDocument();
    expect(screen.queryByText('Average')).not.toBeInTheDocument();
  });

  it('gives the reason the active cell is invalid', () => {
    render(<SheetStatusBar range="B2" stats={ONE} invalidReason="Must be a number" invalidCount={3} />);

    expect(screen.getByText('Must be a number')).toBeInTheDocument();
    expect(screen.queryByText('3 invalid cells')).not.toBeInTheDocument();
  });

  it('says when the active cell is read-only', () => {
    render(<SheetStatusBar range="A2" stats={ONE} readOnly />);

    expect(screen.getByText('Read-only')).toBeInTheDocument();
  });

  it('counts invalid cells elsewhere in the sheet', () => {
    render(<SheetStatusBar range="B2" stats={ONE} invalidCount={1} />);

    expect(screen.getByText('1 invalid cell')).toBeInTheDocument();
  });
});
