import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LookScope } from '../../looks/LookScope';

import { TabStrip } from './TabStrip';

const ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'alarms', label: 'Alarms', count: '4' },
];

describe(TabStrip.name, () => {
  it('marks the selected tab and shows counts', () => {
    render(<TabStrip label="Record sections" items={ITEMS} value="alarms" />);

    expect(screen.getByRole('tablist', { name: 'Record sections' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Alarms/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('reports the tab that was chosen', async () => {
    const onChange = vi.fn();
    render(<TabStrip label="Record sections" items={ITEMS} value="alarms" onChange={onChange} />);

    await userEvent.click(screen.getByRole('tab', { name: 'Overview' }));

    expect(onChange).toHaveBeenCalledWith('overview');
  });

  it('carries the look for the stylesheet', () => {
    render(
      <LookScope look="poster">
        <TabStrip label="Record sections" items={ITEMS} value="alarms" />
      </LookScope>
    );

    expect(screen.getByRole('tablist')).toHaveAttribute('data-look', 'poster');
  });
});
