import { render, screen, within } from '@testing-library/react';

import { BreakdownList } from './BreakdownList';

const ITEMS = [
  { id: 'inlet', label: 'Inlet and separation', value: 2 },
  { id: 'compression', label: 'Gas compression', value: 6 },
  { id: 'export', label: 'Gas export', value: 4 },
];

function barWidths(container: HTMLElement): string[] {
  return [...container.querySelectorAll<HTMLElement>('[data-slot="breakdown-bar"]')].map((bar) => bar.style.width);
}

function labels(): string[] {
  return screen.getAllByRole('listitem').map((item) => within(item).getByText(/[a-z]{3,}/i).textContent ?? '');
}

describe(BreakdownList.name, () => {
  it('lists items in the given order with their values', () => {
    render(<BreakdownList label="Alarms by area" items={ITEMS} />);

    expect(screen.getByRole('list', { name: 'Alarms by area' })).toBeInTheDocument();
    expect(labels()).toEqual(['Inlet and separation', 'Gas compression', 'Gas export']);
  });

  it('scales bars to the largest item by default', () => {
    const { container } = render(<BreakdownList label="Alarms by area" items={ITEMS} />);

    expect(barWidths(container).map((width) => Math.round(parseFloat(width)))).toEqual([33, 100, 67]);
  });

  it('scales bars to the total when asked', () => {
    const { container } = render(<BreakdownList label="Alarms by area" items={ITEMS} scale="total" />);

    expect(barWidths(container)[1]).toBe('50%');
  });

  it('sorts and numbers rows when ranked, and keeps the top N', () => {
    render(<BreakdownList label="Top areas" items={ITEMS} ranked limit={2} />);

    expect(labels()).toEqual(['Gas compression', 'Gas export']);
    expect(within(screen.getAllByRole('listitem')[0]).getByText('1')).toBeInTheDocument();
  });

  it('shows each share of the total', () => {
    render(<BreakdownList label="Alarms by area" items={ITEMS} showShare />);

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('17%')).toBeInTheDocument();
  });

  it('formats values with the unit and decimals', () => {
    render(<BreakdownList label="Energy" items={[{ id: 'a', label: 'Compression', value: 1234.5 }]} unit="MWh" decimals={1} />);

    expect(screen.getByText('1,234.5')).toBeInTheDocument();
    expect(screen.getByText('MWh')).toBeInTheDocument();
  });

  it('draws empty bars when every value is zero', () => {
    const { container } = render(<BreakdownList label="Alarms" items={[{ id: 'a', label: 'Gas export', value: 0 }]} />);

    expect(barWidths(container)).toEqual(['0%']);
  });
});
