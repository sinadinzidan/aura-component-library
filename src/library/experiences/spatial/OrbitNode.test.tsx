import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OrbitNode } from './OrbitNode';

const BASE = { cx: 200, cy: 100, label: 'Gas compression', code: 'NK-23', value: 78, stateLabel: 'Watch' };

describe(OrbitNode.name, () => {
  it('is a button named with its value and state', () => {
    render(
      <svg>
        <OrbitNode {...BASE} />
      </svg>
    );

    expect(screen.getByRole('button', { name: 'Gas compression: 78 %, Watch' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('prints its value and code', () => {
    render(
      <svg>
        <OrbitNode {...BASE} />
      </svg>
    );

    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('NK-23')).toBeInTheDocument();
  });

  it('selects on click', async () => {
    const onSelect = vi.fn();
    render(
      <svg>
        <OrbitNode {...BASE} onSelect={onSelect} />
      </svg>
    );

    await userEvent.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('selects with Enter and Space', async () => {
    const onSelect = vi.fn();
    render(
      <svg>
        <OrbitNode {...BASE} onSelect={onSelect} />
      </svg>
    );

    screen.getByRole('button').focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('shows the pressed state when selected', () => {
    render(
      <svg>
        <OrbitNode {...BASE} selected />
      </svg>
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('turns its content against the orbit to stay upright', () => {
    render(
      <svg>
        <OrbitNode {...BASE} counterRotation={-130} />
      </svg>
    );

    expect(screen.getByRole('button').getAttribute('style')).toContain('rotate(-130deg)');
  });

  it('repeats the state in shape and omits the arc at zero', () => {
    const { container } = render(
      <svg>
        <OrbitNode {...BASE} value={0} shape="diamond" tone="critical" />
      </svg>
    );

    expect(container.querySelector('[data-slot="orbit-node-state"]')).toHaveAttribute('data-shape', 'diamond');
    expect(container.querySelector('[data-slot="orbit-node-value"]')).toBeNull();
    expect(container.querySelector('[data-slot="orbit-node"]')).toHaveAttribute('data-tone', 'critical');
  });
});
