import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { HelpfulPrompt } from './HelpfulPrompt';

const REASONS = ['Out of date', 'Hard to follow', 'Not what I searched for'];

describe(HelpfulPrompt.name, () => {
  it('asks the question with two answers', () => {
    renderPrompt({});

    expect(screen.getByText('Was this helpful?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });

  it('finishes at once on Yes', async () => {
    const onSubmit = vi.fn();
    renderPrompt({ onSubmit, reasons: REASONS });

    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));

    expect(onSubmit).toHaveBeenCalledWith({ helpful: true });
    expect(screen.getByRole('status')).toHaveTextContent('Thanks for the feedback.');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('asks for a reason after No and reports only then', async () => {
    const onSubmit = vi.fn();
    renderPrompt({ onSubmit, reasons: REASONS });

    await userEvent.click(screen.getByRole('button', { name: 'No' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('group', { name: 'What was missing?' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Out of date' }));

    expect(onSubmit).toHaveBeenCalledWith({ helpful: false, reason: 'Out of date' });
    expect(screen.getByRole('status')).toHaveTextContent('Thanks for the feedback.');
  });

  it('lets the reason be skipped', async () => {
    const onSubmit = vi.fn();
    renderPrompt({ onSubmit, reasons: REASONS });

    await userEvent.click(screen.getByRole('button', { name: 'No' }));
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(onSubmit).toHaveBeenCalledWith({ helpful: false });
  });

  it('finishes on No when there are no reasons to offer', async () => {
    const onSubmit = vi.fn();
    renderPrompt({ onSubmit });

    await userEvent.click(screen.getByRole('button', { name: 'No' }));

    expect(onSubmit).toHaveBeenCalledWith({ helpful: false });
  });

  it('reports exactly once', async () => {
    const onSubmit = vi.fn();
    renderPrompt({ onSubmit });

    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('uses custom wording', () => {
    renderPrompt({ question: 'Did this procedure match the equipment?', yesLabel: 'It matched', noLabel: 'It did not' });

    expect(screen.getByText('Did this procedure match the equipment?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'It matched' })).toBeInTheDocument();
  });
});

function renderPrompt(props: Partial<ComponentProps<typeof HelpfulPrompt>>) {
  return render(<HelpfulPrompt onSubmit={vi.fn()} {...props} />);
}
