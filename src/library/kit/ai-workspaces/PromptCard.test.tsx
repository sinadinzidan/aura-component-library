import { fireEvent, render, screen } from '@testing-library/react';

import { PromptCard } from './PromptCard';

describe(PromptCard.name, () => {
  it('is a button named by its suggestion and reports the click', () => {
    const onSelect = vi.fn();
    render(<PromptCard title="Explain the 13:46 trip" detail="Reads alarms and vibration trends." onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /Explain the 13:46 trip/ }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Reads alarms and vibration trends.')).toBeInTheDocument();
  });

  it('carries its tone for the look to colour', () => {
    render(<PromptCard title="Draft a handover" tone="teal" onSelect={vi.fn()} />);

    expect(screen.getByRole('button')).toHaveAttribute('data-tone', 'teal');
  });
});
