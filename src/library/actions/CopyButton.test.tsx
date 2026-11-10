import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CopyButton } from './CopyButton';

describe(CopyButton.name, () => {
  it('writes the text to the clipboard and confirms in place', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    render(<CopyButton text="23-KA-9101" label="Copy tag" writeText={writeText} />);

    await userEvent.click(screen.getByRole('button', { name: 'Copy tag' }));

    expect(writeText).toHaveBeenCalledWith('23-KA-9101');
    await waitFor(() => expect(screen.getByRole('button', { name: /Copied/ })).toBeInTheDocument());
  });

  it('keeps its label when the clipboard rejects', async () => {
    const writeText = vi.fn(() => Promise.reject(new Error('denied')));
    render(<CopyButton text="x" label="Copy tag" writeText={writeText} />);

    await userEvent.click(screen.getByRole('button', { name: 'Copy tag' }));

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Copy tag' })).toBeInTheDocument();
  });

  it('uses the label as the accessible name when icon-only', () => {
    render(<CopyButton text="x" label="Copy external ID" iconOnly writeText={vi.fn(() => Promise.resolve())} />);

    expect(screen.getByRole('button', { name: 'Copy external ID' })).toBeInTheDocument();
  });

  it('returns to its resting label after the reset delay', async () => {
    render(<CopyButton text="x" writeText={() => Promise.resolve()} resetAfterMs={10} />);
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Copied/ })).toBeInTheDocument());

    await waitFor(() => expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument());
  });
});
