import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Timeline } from './Timeline';
import { TimelineCollapse } from './TimelineCollapse';
import type { TimelineCollapseProps } from './TimelineCollapse';
import { TimelineItem } from './TimelineItem';

function renderCollapse(props: Partial<TimelineCollapseProps> = {}) {
  return render(
    <Timeline label="Work order history">
      <TimelineItem title="Created" />
      <TimelineCollapse {...props}>
        <TimelineItem title="Planned" />
        <TimelineItem title="Materials reserved" />
        <TimelineItem title="Permit approved" />
      </TimelineCollapse>
      <TimelineItem title="Work started" />
    </Timeline>
  );
}

describe(TimelineCollapse.name, () => {
  it('hides its items behind a button that says how many', () => {
    renderCollapse();

    expect(screen.getByRole('button', { name: 'Show 3 earlier' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Materials reserved')).not.toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Work started')).toBeInTheDocument();
  });

  it('opens the items in place', async () => {
    renderCollapse();

    await userEvent.click(screen.getByRole('button', { name: 'Show 3 earlier' }));

    expect(screen.getByText('Materials reserved')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Created',
      'Hide 3 earlier',
      'Planned',
      'Materials reserved',
      'Permit approved',
      'Work started',
    ]);
  });

  it('keeps focus on the button and folds again', async () => {
    renderCollapse();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    const button = screen.getByRole('button', { name: 'Hide 3 earlier' });
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{Enter}');
    expect(screen.queryByText('Planned')).not.toBeInTheDocument();
  });

  it('accepts a count and custom labels', () => {
    renderCollapse({
      count: 8,
      showLabel: (count) => `Show ${count} more events`,
    });

    expect(screen.getByRole('button', { name: 'Show 8 more events' })).toBeInTheDocument();
  });

  it('can be controlled', async () => {
    const onExpandedChange = vi.fn();
    renderCollapse({ expanded: false, onExpandedChange });

    await userEvent.click(screen.getByRole('button', { name: 'Show 3 earlier' }));

    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(screen.queryByText('Planned')).not.toBeInTheDocument();
  });
});
