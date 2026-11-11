import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PivotControls } from './PivotControls';
import type { PivotControlsProps } from './PivotControls';

function renderControls(props: Partial<PivotControlsProps> = {}) {
  const handlers = {
    onRowChange: vi.fn(),
    onColumnChange: vi.fn(),
    onMeasureChange: vi.fn(),
    onAggregationChange: vi.fn(),
    onHeatChange: vi.fn(),
  };
  render(
    <PivotControls
      dimensions={[{ id: 'area', label: 'Area' }, { id: 'type', label: 'Type' }]}
      measures={[{ id: 'hours', label: 'Labour hours' }, { id: 'downtime', label: 'Downtime' }]}
      rows={['area']}
      column={null}
      measure="hours"
      aggregation="sum"
      heat={false}
      {...handlers}
      {...props}
    />
  );
  return handlers;
}

describe(PivotControls.name, () => {
  it('shows the current layout', () => {
    renderControls();

    expect(screen.getByRole('combobox', { name: 'Group rows by' })).toHaveTextContent('Area');
    expect(screen.getByRole('combobox', { name: 'Columns' })).toHaveTextContent('One total column');
    expect(screen.getByRole('combobox', { name: 'Measure' })).toHaveTextContent('Labour hours');
  });

  it('reports a new aggregation', async () => {
    const { onAggregationChange } = renderControls();

    await userEvent.click(screen.getByRole('tab', { name: 'Average' }));

    expect(onAggregationChange).toHaveBeenCalledWith('average');
  });

  it('reports the heat switch', async () => {
    const { onHeatChange } = renderControls();

    await userEvent.click(screen.getByRole('switch'));

    expect(onHeatChange).toHaveBeenCalledWith(true);
  });

  it('reports a column field', async () => {
    const { onColumnChange } = renderControls();

    await userEvent.click(screen.getByRole('combobox', { name: 'Columns' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Type' }));

    expect(onColumnChange).toHaveBeenCalledWith('type');
  });

  it('reports removing a grouping as null', async () => {
    const { onRowChange } = renderControls({ rows: ['area', 'type'] });

    await userEvent.click(screen.getByRole('combobox', { name: 'Then by' }));
    await userEvent.click(await screen.findByRole('option', { name: 'None' }));

    expect(onRowChange).toHaveBeenCalledWith(1, null);
  });

  it('cannot add a second grouping before the first', () => {
    renderControls({ rows: [] });

    expect(screen.getByRole('combobox', { name: 'Then by' })).toBeDisabled();
  });

  it('does not offer a measure for a count', () => {
    renderControls({ aggregation: 'count' });

    expect(screen.getByRole('combobox', { name: 'Measure' })).toBeDisabled();
  });
});
