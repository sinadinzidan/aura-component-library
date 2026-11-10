import { render } from '@testing-library/react';

import { SvgStatusMark } from './SvgStatusMark';

const mark = (container: HTMLElement) => container.querySelector('[data-slot="svg-status-mark"]');

describe(SvgStatusMark.name, () => {
  it('draws a filled circle by default', () => {
    const { container } = render(
      <svg>
        <SvgStatusMark x={20} y={20} tone="neutral" />
      </svg>
    );

    expect(mark(container)?.tagName.toLowerCase()).toBe('circle');
    expect(mark(container)).toHaveAttribute('r', '5');
  });

  it('draws a hollow circle for a ring', () => {
    const { container } = render(
      <svg>
        <SvgStatusMark x={20} y={20} tone="neutral" shape="ring" />
      </svg>
    );

    expect(mark(container)).toHaveAttribute('fill-opacity', '0');
  });

  it('draws a square centred on the point', () => {
    const { container } = render(
      <svg>
        <SvgStatusMark x={20} y={20} size={10} tone="warning" shape="square" />
      </svg>
    );

    expect(mark(container)?.tagName.toLowerCase()).toBe('rect');
    expect(mark(container)).toHaveAttribute('x', '15.75');
    expect(mark(container)).toHaveAttribute('data-tone', 'warning');
  });

  it('rotates a square into a diamond for critical states', () => {
    const { container } = render(
      <svg>
        <SvgStatusMark x={20} y={30} tone="critical" shape="diamond" />
      </svg>
    );

    expect(mark(container)).toHaveAttribute('transform', 'rotate(45 20 30)');
    expect(mark(container)).toHaveClass('fill-critical-foreground-strong');
  });

  it('is hidden from assistive technology, because a label always sits beside it', () => {
    const { container } = render(
      <svg>
        <SvgStatusMark x={0} y={0} tone="info" />
      </svg>
    );

    expect(mark(container)).toHaveAttribute('aria-hidden', 'true');
  });
});
