import { fireEvent, render, screen } from '@testing-library/react';

import { LevelBlock } from './LevelBlock';

describe(LevelBlock.name, () => {
  it('names the block with its label, contents and level', () => {
    render(<LevelBlock label="TA-204" caption="Condensate" fill={0.92} />);

    expect(screen.getByRole('img', { name: 'TA-204, Condensate, 92 percent full' })).toBeInTheDocument();
  });

  it('raises the fill to the level', () => {
    render(<LevelBlock label="TA-204" fill={0.25} />);

    const fill = screen.getByRole('img').querySelector('[data-slot="level-fill"]');
    expect(fill).toHaveStyle({ clipPath: 'inset(75% 0 0 0)' });
  });

  it('says a level that needs attention in a word', () => {
    render(<LevelBlock label="TA-206" fill={0.14} state={{ tone: 'warning', word: 'Low' }} />);

    expect(screen.getByRole('img', { name: /14 percent full, low/ })).toBeInTheDocument();
    expect(screen.getAllByText('Low').length).toBeGreaterThan(0);
  });

  it('is a toggle button when it can be selected', () => {
    const onSelect = vi.fn();
    render(<LevelBlock label="TA-201" fill={0.5} selected onSelect={onSelect} />);

    const button = screen.getByRole('button', { name: /TA-201/ });
    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('carries the colour of its contents as a tone', () => {
    render(<LevelBlock label="TA-209" fill={0.2} tone="pink" />);

    expect(screen.getByRole('img')).toHaveAttribute('data-tone', 'pink');
  });
});
