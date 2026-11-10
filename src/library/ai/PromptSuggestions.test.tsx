import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PromptSuggestions } from './PromptSuggestions';
import type { PromptSuggestion } from './PromptSuggestions';

const SUGGESTIONS: readonly PromptSuggestion[] = [
  { id: 'trip', label: 'Why did the recompressor trip?' },
  { id: 'trend', label: 'Discharge pressure trend', prompt: 'Show discharge pressure for 23-KA-9101 over the last 24 hours' },
];

describe(PromptSuggestions.name, () => {
  it('renders one button per suggestion in a named group', () => {
    render(<PromptSuggestions suggestions={SUGGESTIONS} onSelect={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'Suggested prompts' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('hands back the label when a suggestion has no separate prompt', async () => {
    const onSelect = vi.fn();
    render(<PromptSuggestions suggestions={SUGGESTIONS} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Why did the recompressor trip?' }));

    expect(onSelect).toHaveBeenCalledWith('Why did the recompressor trip?', SUGGESTIONS[0]);
  });

  it('hands back the full prompt behind a short label', async () => {
    const onSelect = vi.fn();
    render(<PromptSuggestions suggestions={SUGGESTIONS} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Discharge pressure trend' }));

    expect(onSelect).toHaveBeenCalledWith(
      'Show discharge pressure for 23-KA-9101 over the last 24 hours',
      SUGGESTIONS[1]
    );
  });

  it('disables every suggestion while a response is in flight', () => {
    render(<PromptSuggestions suggestions={SUGGESTIONS} onSelect={vi.fn()} disabled />);

    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
  });

  it('renders nothing without suggestions', () => {
    const { container } = render(<PromptSuggestions suggestions={[]} onSelect={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });
});
