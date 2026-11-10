import { render } from '@testing-library/react';

import { IsoPrism } from './IsoPrism';
import { prismFaces } from './isoProjection';

const BOX = { x: 0, y: 0, z: 0, w: 2, d: 1, h: 3 };
const VIEW = { scale: 20, originX: 100, originY: 80 };

describe(IsoPrism.name, () => {
  it('draws the three visible faces with the top last', () => {
    const { container } = render(
      <svg>
        <IsoPrism box={BOX} view={VIEW} />
      </svg>
    );

    const faces = [...container.querySelectorAll('polygon')].map((polygon) => polygon.getAttribute('data-face'));
    expect(faces).toEqual(['left', 'right', 'top']);
  });

  it('projects the faces with the given view', () => {
    const { container } = render(
      <svg>
        <IsoPrism box={BOX} view={VIEW} />
      </svg>
    );

    expect(container.querySelector('[data-face="top"]')).toHaveAttribute('points', prismFaces(BOX, VIEW).top);
  });

  it('sets the colour variable from the tone', () => {
    const { container } = render(
      <svg>
        <IsoPrism box={BOX} tone="critical" />
      </svg>
    );

    expect(container.querySelector('[data-slot="iso-prism"]')).toHaveClass('[--iso:var(--critical-foreground-strong)]');
  });

  it('draws a ghost as a dashed outline', () => {
    const { container } = render(
      <svg>
        <IsoPrism box={BOX} variant="ghost" />
      </svg>
    );

    const prism = container.querySelector('[data-slot="iso-prism"]');
    expect(prism).toHaveAttribute('data-variant', 'ghost');
    expect(prism).toHaveAttribute('stroke-dasharray', '3 3');
  });

  it('outlines a selected box in the accent with a solid line', () => {
    const { container } = render(
      <svg>
        <IsoPrism box={BOX} variant="ghost" outlined />
      </svg>
    );

    const prism = container.querySelector('[data-slot="iso-prism"]');
    expect(prism).toHaveAttribute('data-outlined', 'true');
    expect(prism).not.toHaveAttribute('stroke-dasharray');
    expect(prism).toHaveClass('stroke-[color:var(--primary-background)]');
  });
});
