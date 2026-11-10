import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AreaBlock } from './AreaBlock';

describe(AreaBlock.name, () => {
  it('shows the area name and tag', () => {
    render(<AreaBlock name="Gas compression" tag="NK-23" />);

    expect(screen.getByText('Gas compression')).toBeInTheDocument();
    expect(screen.getByText('NK-23')).toHaveClass('font-mono');
  });

  it('shows the state as dot and label', () => {
    render(<AreaBlock name="Gas export" status={{ tone: 'success', label: 'Running', shape: 'dot' }} />);

    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('counts active alarms in words', () => {
    render(<AreaBlock name="Gas compression" alarmCount={3} />);

    expect(screen.getByText('3 alarms')).toBeInTheDocument();
  });

  it('uses the singular for one alarm', () => {
    render(<AreaBlock name="Cooling water" alarmCount={1} alarmTone="warning" />);

    expect(screen.getByText('1 alarm').closest('[data-slot="status-indicator"]')).toHaveAttribute('data-tone', 'warning');
  });

  it('hides the alarm count at zero', () => {
    render(<AreaBlock name="Gas export" />);

    expect(screen.queryByText(/alarm/)).not.toBeInTheDocument();
  });

  it('is a neutral block unless it needs attention', () => {
    const { container, rerender } = render(<AreaBlock name="Gas export" />);
    expect(container.firstChild).toHaveClass('bg-muted-background');

    rerender(<AreaBlock name="Gas compression" tone="critical" />);

    expect(container.firstChild).toHaveClass('bg-critical-background');
  });

  it('is not a button without a select handler', () => {
    render(<AreaBlock name="Gas export" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('becomes a toggle button that reports selection', async () => {
    const onSelect = vi.fn();
    render(<AreaBlock name="Gas export" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: /Gas export/ }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('outlines the selected block', () => {
    render(<AreaBlock name="Gas export" selected onSelect={vi.fn()} />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button')).toHaveClass('border-emphasized');
  });

  it('renders extra content under the name', () => {
    render(
      <AreaBlock name="Tank farm">
        <span>4 tanks</span>
      </AreaBlock>
    );

    expect(screen.getByText('4 tanks')).toBeInTheDocument();
  });
});
