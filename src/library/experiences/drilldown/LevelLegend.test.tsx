import { render, screen, within } from '@testing-library/react';

import { LevelLegend } from './LevelLegend';

const ITEMS = [{ label: 'Site', detail: 'Nordkapp plant' }, { label: 'Area', detail: '4' }, { label: 'Equipment', detail: '11' }, { label: 'Sensor' }];

describe(LevelLegend.name, () => {
  it('names the centre and each ring outwards', () => {
    render(<LevelLegend items={ITEMS} />);
    const rows = within(screen.getByRole('list', { name: 'Rings' })).getAllByRole('listitem');

    expect(rows).toHaveLength(4);
    expect(rows[0]).toHaveTextContent('CentreSiteNordkapp plant');
    expect(rows[2]).toHaveTextContent('Ring 2Equipment11');
    expect(rows[3]).toHaveTextContent('Ring 3Sensor');
  });

  it('picks out exactly one ring per entry', () => {
    render(<LevelLegend items={ITEMS} />);
    const rows = screen.getAllByRole('listitem');

    rows.forEach((row) => expect(row.querySelectorAll('[data-active="true"]')).toHaveLength(1));
    expect(rows[0]?.querySelector('[data-active="true"]')).toHaveClass('fill-primary-background');
    expect(rows[2]?.querySelectorAll('circle')[2]).toHaveAttribute('data-active', 'true');
  });

  it('stacks vertically when asked', () => {
    render(<LevelLegend items={ITEMS} orientation="vertical" label="Levels" />);

    expect(screen.getByRole('list', { name: 'Levels' })).toHaveClass('flex-col');
  });
});
