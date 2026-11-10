import { render, screen } from '@testing-library/react';

import { DashboardCell, DashboardGrid } from './DashboardGrid';

describe(DashboardGrid.name, () => {
  it('lays its cells out on twelve columns', () => {
    render(
      <DashboardGrid>
        <DashboardCell span={12}>
          <p>Row</p>
        </DashboardCell>
      </DashboardGrid>
    );

    expect(screen.getByText('Row').parentElement?.parentElement).toHaveClass('grid', 'grid-cols-12', 'gap-4');
  });
});

describe(DashboardCell.name, () => {
  it.each([
    [3, 'xl:col-span-3'],
    [4, 'xl:col-span-4'],
    [8, 'xl:col-span-8'],
    [12, 'col-span-12'],
  ] as const)('gives a span of %i the class %s', (span, expected) => {
    render(
      <DashboardCell span={span}>
        <p>Cell</p>
      </DashboardCell>
    );

    expect(screen.getByText('Cell').parentElement).toHaveClass(expected);
  });

  it('is full width on the narrowest screens and lets content shrink', () => {
    render(
      <DashboardCell span={4}>
        <p>Cell</p>
      </DashboardCell>
    );

    expect(screen.getByText('Cell').parentElement).toHaveClass('col-span-12', 'min-w-0');
  });
});
