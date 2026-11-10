import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TagChip } from './TagChip';

describe(TagChip.name, () => {
  it('shows the tag as plain text by default', () => {
    render(<TagChip tag="23-PT-92531" />);
    expect(screen.getByText('23-PT-92531')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('names the quality dot', () => {
    render(<TagChip tag="23-TT-91141" quality="uncertain" />);
    expect(screen.getByRole('img', { name: 'Uncertain quality' })).toBeInTheDocument();
  });

  it('opens the tag when selected', async () => {
    const onSelect = vi.fn();
    render(<TagChip tag="23-PT-92531" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: '23-PT-92531' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('removes the tag with a named button', async () => {
    const onRemove = vi.fn();
    render(<TagChip tag="23-PT-92531" onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove 23-PT-92531' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
