import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReasoningDisclosure } from './ReasoningDisclosure';

const STEPS = ['Looked up the active alarms on 23-KA-9103.', 'Compared vibration with the trip limit.'];

describe(ReasoningDisclosure.name, () => {
  it('is closed once done and names the duration', () => {
    render(<ReasoningDisclosure steps={STEPS} durationSeconds={8} />);

    expect(screen.getByRole('button', { name: 'Thought for 8 s' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('falls back to a step count when no duration is known', () => {
    render(<ReasoningDisclosure steps={STEPS} />);

    expect(screen.getByRole('button', { name: 'Reasoning · 2 steps' })).toBeInTheDocument();
  });

  it('opens on click and shows every step', async () => {
    render(<ReasoningDisclosure steps={STEPS} durationSeconds={8} />);

    await userEvent.click(screen.getByRole('button', { name: 'Thought for 8 s' }));

    expect(screen.getByRole('button', { name: 'Thought for 8 s' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(STEPS[1])).toBeVisible();
  });

  it('stays open and shows the streaming label while the model is thinking', () => {
    render(<ReasoningDisclosure steps={STEPS} status="streaming" />);

    expect(screen.getByRole('button', { name: 'Thinking…' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('lets the reader close it while streaming', async () => {
    render(<ReasoningDisclosure steps={STEPS} status="streaming" />);

    await userEvent.click(screen.getByRole('button', { name: 'Thinking…' }));

    expect(screen.getByRole('button', { name: 'Thinking…' })).toHaveAttribute('aria-expanded', 'false');
  });
});
