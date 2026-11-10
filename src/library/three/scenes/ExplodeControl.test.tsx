import { fireEvent, render, screen } from '@testing-library/react';

import { ExplodeControl } from './ExplodeControl';

describe(ExplodeControl.name, () => {
  it('offers to explode an assembled stack', () => {
    render(<ExplodeControl amount={0} onAmountChange={vi.fn()} onToggle={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Explode decks' })).toBeInTheDocument();
    expect(screen.getByText('0 %')).toBeInTheDocument();
  });

  it('offers to assemble an exploded stack', () => {
    render(<ExplodeControl amount={0.8} onAmountChange={vi.fn()} onToggle={vi.fn()} noun="modules" />);

    expect(screen.getByRole('button', { name: 'Assemble modules' })).toBeInTheDocument();
    expect(screen.getByText('80 %')).toBeInTheDocument();
  });

  it('toggles from the button', () => {
    const onToggle = vi.fn();
    render(<ExplodeControl amount={0} onAmountChange={vi.fn()} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('button', { name: 'Explode decks' }));

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('sets the slider to the separation in percent', () => {
    const { container } = render(<ExplodeControl amount={0.35} onAmountChange={vi.fn()} onToggle={vi.fn()} />);

    expect(container.querySelector('[data-slot="slider"]')).toHaveAttribute('data-orientation', 'vertical');
    expect(container.querySelector('input[type="range"]')).toHaveValue('35');
  });
});
