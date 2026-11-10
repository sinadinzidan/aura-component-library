import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DiagramHotspot } from './DiagramHotspot';

function renderHotspot(onSelect: () => void, selected = false) {
  return render(
    <svg>
      <DiagramHotspot x={10} y={20} width={80} height={60} label="Inlet separator" selected={selected} onSelect={onSelect}>
        <circle data-testid="symbol" cx={50} cy={50} r={10} />
      </DiagramHotspot>
    </svg>
  );
}

describe(DiagramHotspot.name, () => {
  it('is a named toggle button around its content', () => {
    const { container } = renderHotspot(vi.fn());

    const button = screen.getByRole('button', { name: 'Inlet separator' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelector('[data-testid="symbol"]')).toBeInTheDocument();
  });

  it('selects on click', async () => {
    const onSelect = vi.fn();
    renderHotspot(onSelect);

    await userEvent.click(screen.getByRole('button', { name: 'Inlet separator' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('selects with Enter and Space from the keyboard', async () => {
    const onSelect = vi.fn();
    renderHotspot(onSelect);

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(screen.getByRole('button', { name: 'Inlet separator' })).toHaveFocus();
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('ignores other keys', async () => {
    const onSelect = vi.fn();
    renderHotspot(onSelect);

    await userEvent.tab();
    await userEvent.keyboard('a');

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('marks the selection with an outline and a surface', () => {
    const { container } = renderHotspot(vi.fn(), true);

    expect(screen.getByRole('button', { name: 'Inlet separator' })).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('rect')).toHaveClass('stroke-emphasized', 'fill-muted-background');
  });

  it('covers the area it is given', () => {
    const { container } = renderHotspot(vi.fn());

    const rect = container.querySelector('rect');
    expect(rect).toHaveAttribute('x', '10');
    expect(rect).toHaveAttribute('width', '80');
    expect(rect).toHaveAttribute('height', '60');
  });
});
