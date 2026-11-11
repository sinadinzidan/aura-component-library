import { render, screen } from '@testing-library/react';

import { Timeline } from './Timeline';
import { TimelineItem } from './TimelineItem';
import type { TimelineItemProps } from './TimelineItem';

function renderItem(props: Partial<TimelineItemProps> = {}, orientation: 'vertical' | 'horizontal' = 'vertical') {
  return render(
    <Timeline label="Events" orientation={orientation}>
      <TimelineItem title="Alarm raised" {...props} />
      <TimelineItem title="Cleared" />
    </Timeline>
  );
}

const marker = (container: HTMLElement) => container.querySelector('[data-slot="timeline-marker"]');
const connector = (container: HTMLElement) => container.querySelector('[data-slot="timeline-connector"]');

describe(TimelineItem.name, () => {
  it('shows title, time, duration and description', () => {
    renderItem({
      time: '13:46',
      duration: '12 min',
      description: 'Recompressor tripped on high vibration',
    });

    expect(screen.getByText('Alarm raised')).toBeInTheDocument();
    expect(screen.getByText('13:46 · 12 min')).toBeInTheDocument();
    expect(screen.getByText('Recompressor tripped on high vibration')).toBeInTheDocument();
  });

  it('uses a neutral dot by default', () => {
    const { container } = renderItem();

    expect(marker(container)).toHaveAttribute('data-marker', 'dot');
    expect(marker(container)).toHaveClass('bg-neutral-foreground-strong');
  });

  it('draws a toned shape', () => {
    const { container } = renderItem({ tone: 'critical', shape: 'diamond' });

    expect(marker(container)).toHaveAttribute('data-marker', 'diamond');
    expect(marker(container)).toHaveClass('rotate-45', 'bg-critical-foreground-strong');
  });

  it('puts an icon in a tile', () => {
    const { container } = renderItem({
      icon: <svg data-testid="bell" />,
      tone: 'warning',
    });

    expect(marker(container)).toHaveAttribute('data-marker', 'icon');
    expect(marker(container)).toHaveClass('bg-warning-background');
    expect(screen.getByTestId('bell')).toBeInTheDocument();
  });

  it('uses an avatar as the marker', () => {
    const { container } = renderItem({
      avatar: <span aria-label="Ingrid Haugen">IH</span>,
    });

    expect(marker(container)).toHaveAttribute('data-marker', 'avatar');
    expect(screen.getByLabelText('Ingrid Haugen')).toBeInTheDocument();
  });

  it('marks the current event and says so', () => {
    renderItem({ state: 'current' });

    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('(Current)', { exact: false })).toHaveClass('sr-only');
  });

  it('draws a pending event hollow, on a dashed line, and says so', () => {
    const { container } = renderItem({ state: 'pending' });

    expect(marker(container)).toHaveAttribute('data-marker', 'pending');
    expect(connector(container)).toHaveClass('border-dashed');
    expect(screen.getByText('(Not yet)', { exact: false })).toBeInTheDocument();
  });

  it('draws a solid line after an event that happened', () => {
    const { container } = renderItem();

    expect(connector(container)).not.toHaveClass('border-dashed');
  });

  it('lets the connector be overridden or removed', () => {
    const { container, unmount } = renderItem({ connector: 'dashed' });
    expect(connector(container)).toHaveClass('border-dashed');
    unmount();

    const second = renderItem({ connector: 'none' });
    expect(second.container.querySelectorAll('[data-slot="timeline-connector"]')).toHaveLength(1);
  });

  it('renders rich content and trailing meta', () => {
    renderItem({
      meta: <span>P1</span>,
      children: <p>Work order WO-104482 created</p>,
    });

    expect(screen.getByText('P1')).toBeInTheDocument();
    expect(screen.getByText('Work order WO-104482 created')).toBeInTheDocument();
  });

  it('stacks time under the title when horizontal', () => {
    const { container } = renderItem({ time: '13:46' }, 'horizontal');

    expect(container.querySelector('[data-slot="timeline-time"]')).toHaveTextContent('13:46');
    expect(connector(container)).toHaveClass('border-t');
  });
});
