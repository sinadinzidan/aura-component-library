import { render } from '@testing-library/react';

import { IsoCylinder } from './IsoCylinder';
import { cylinderShape } from './isoProjection';

const TANK = { x: 2, y: 2, z: 0, radius: 1, length: 3 };
const VIEW = { scale: 20, originX: 100, originY: 80 };

describe(IsoCylinder.name, () => {
  it('draws the far cap, the body and the near cap in painting order', () => {
    const { container } = render(
      <svg>
        <IsoCylinder {...TANK} view={VIEW} />
      </svg>
    );

    const parts = [...container.querySelectorAll('polygon')].map((polygon) => polygon.getAttribute('data-part'));
    expect(parts).toEqual(['far-cap', 'body', 'near-cap']);
    expect(container.querySelector('[data-part="near-cap"]')).toHaveAttribute('points', cylinderShape(TANK, VIEW).nearCap);
  });

  it('stands on the z axis by default and can lie along x', () => {
    const { container, rerender } = render(
      <svg>
        <IsoCylinder {...TANK} />
      </svg>
    );
    expect(container.querySelector('[data-slot="iso-cylinder"]')).toHaveAttribute('data-axis', 'z');

    rerender(
      <svg>
        <IsoCylinder {...TANK} axis="x" />
      </svg>
    );

    expect(container.querySelector('[data-slot="iso-cylinder"]')).toHaveAttribute('data-axis', 'x');
  });

  it('shows the contents of a standing tank up to its level', () => {
    const { container } = render(
      <svg>
        <IsoCylinder {...TANK} level={0.6} contentTone="water" />
      </svg>
    );

    const content = container.querySelector('[data-slot="iso-cylinder-content"]');
    expect(content).toHaveAttribute('data-level', '0.6');
    expect(content).toHaveClass('[--iso:var(--chart-3-450)]');
  });

  it('draws no contents for an empty tank or a lying vessel', () => {
    const { container, rerender } = render(
      <svg>
        <IsoCylinder {...TANK} level={0} />
      </svg>
    );
    expect(container.querySelector('[data-slot="iso-cylinder-content"]')).toBeNull();

    rerender(
      <svg>
        <IsoCylinder {...TANK} axis="x" level={0.5} />
      </svg>
    );

    expect(container.querySelector('[data-slot="iso-cylinder-content"]')).toBeNull();
  });

  it('clamps an overfull level', () => {
    const { container } = render(
      <svg>
        <IsoCylinder {...TANK} level={1.8} />
      </svg>
    );

    expect(container.querySelector('[data-slot="iso-cylinder-content"]')).toHaveAttribute('data-level', '1');
  });

  it('outlines a selected cylinder', () => {
    const { container } = render(
      <svg>
        <IsoCylinder {...TANK} outlined />
      </svg>
    );

    expect(container.querySelector('[data-slot="iso-cylinder"]')).toHaveClass('stroke-[color:var(--primary-background)]');
  });
});
