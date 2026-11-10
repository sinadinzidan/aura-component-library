import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MergeChoiceRow } from './MergeChoiceRow';

const PROPS = { label: 'High limit', left: '145.0 °C', right: '148.0 °C', leftLabel: 'yours', rightLabel: 'theirs' };

describe(MergeChoiceRow.name, () => {
  it('offers both values as named buttons', () => {
    render(<MergeChoiceRow {...PROPS} onChoose={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'High limit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep yours: 145.0 °C' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep theirs: 148.0 °C' })).toBeInTheDocument();
  });

  it('asks for a choice while unresolved', () => {
    render(<MergeChoiceRow {...PROPS} onChoose={vi.fn()} />);

    expect(screen.getByText('Choose a side')).toBeInTheDocument();
    expect(screen.getByRole('group')).toHaveAttribute('data-choice', 'unresolved');
  });

  it('reports the chosen side', async () => {
    const onChoose = vi.fn();
    render(<MergeChoiceRow {...PROPS} onChoose={onChoose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Keep theirs: 148.0 °C' }));

    expect(onChoose).toHaveBeenCalledWith('right');
  });

  it('marks the kept side as pressed and drops the prompt', () => {
    render(<MergeChoiceRow {...PROPS} choice="left" onChoose={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Keep yours: 145.0 °C' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Keep theirs: 148.0 °C' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText('Choose a side')).not.toBeInTheDocument();
  });
});
