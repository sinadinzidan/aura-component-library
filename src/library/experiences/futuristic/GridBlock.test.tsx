import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GridBlock } from './GridBlock';

const VIEW = { width: 800, height: 500, horizonY: 140 };
const BLOCK = { x: 0.5, z: 1, width: 0.4, depth: 0.4, height: 0.3 };

function renderBlock(props: Partial<Parameters<typeof GridBlock>[0]> = {}) {
  return render(
    <svg>
      <GridBlock view={VIEW} block={BLOCK} label="NK-23" description="NK-23 Gas compression, load 78 %" {...props} />
    </svg>
  );
}

describe(GridBlock.name, () => {
  it('is a toggle button named by its description', () => {
    renderBlock();

    expect(screen.getByRole('button', { name: 'NK-23 Gas compression, load 78 %' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the label, value and status in text', () => {
    renderBlock({ value: '78%', status: 'Unit tripped' });

    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText('Unit tripped')).toBeInTheDocument();
  });

  it('selects on click', async () => {
    const onSelect = vi.fn();
    renderBlock({ onSelect });

    await userEvent.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('selects with Enter and Space', async () => {
    const onSelect = vi.fn();
    renderBlock({ onSelect });

    screen.getByRole('button').focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('lifts off its footprint when selected', () => {
    const { container } = renderBlock({ selected: true });

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('[data-slot="grid-block-body"]')).toHaveStyle({ transform: 'translateY(-16px)' });
    expect(container.querySelector('[data-slot="grid-block-base"]')).toBeInTheDocument();
  });
});
