import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LiveToggle } from './LiveToggle';

const MINUTE = 60_000;
const NOW = Date.UTC(2026, 2, 12, 14, 0, 0);

describe(LiveToggle.name, () => {
  it('shows the live state with the update time and interval', () => {
    render(<LiveToggle live onLiveChange={vi.fn()} lastUpdated={NOW} now={NOW} interval="every 5 s" />);

    expect(screen.getByRole('status')).toHaveTextContent('Live');
    expect(screen.getByRole('status')).toHaveTextContent('updated 14:00, every 5 s');
    expect(screen.getByRole('button', { name: 'Live, pause updates' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows how far behind a paused view is', () => {
    render(<LiveToggle live={false} onLiveChange={vi.fn()} lastUpdated={NOW - 18 * MINUTE} now={NOW} />);

    expect(screen.getByRole('status')).toHaveTextContent('Paused');
    expect(screen.getByRole('status')).toHaveTextContent('since 13:42, 18 min behind');
  });

  it('pauses when live and resumes when paused', async () => {
    const onLiveChange = vi.fn();
    const { rerender } = render(<LiveToggle live onLiveChange={onLiveChange} lastUpdated={NOW} now={NOW} />);

    await userEvent.click(screen.getByRole('button', { name: 'Live, pause updates' }));
    expect(onLiveChange).toHaveBeenLastCalledWith(false);

    rerender(<LiveToggle live={false} onLiveChange={onLiveChange} lastUpdated={NOW} now={NOW} />);
    await userEvent.click(screen.getByRole('button', { name: 'Paused, resume live updates' }));
    expect(onLiveChange).toHaveBeenLastCalledWith(true);
  });

  it('pulses the dot only while live', () => {
    const { container, rerender } = render(<LiveToggle live onLiveChange={vi.fn()} lastUpdated={NOW} now={NOW} />);
    expect(container.querySelector('[data-slot="status-dot-pulse"]')).toBeInTheDocument();

    rerender(<LiveToggle live={false} onLiveChange={vi.fn()} lastUpdated={NOW} now={NOW} />);
    expect(container.querySelector('[data-slot="status-dot-pulse"]')).not.toBeInTheDocument();
  });
});
