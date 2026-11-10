import { render } from '@testing-library/react';

import { ContourBackdrop } from './ContourBackdrop';

describe(ContourBackdrop.name, () => {
  it('is decoration, hidden from assistive technology', () => {
    const { container } = render(<ContourBackdrop />);

    expect(container.querySelector('[data-slot="contour-backdrop"]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws the requested number of lines', () => {
    const { container } = render(<ContourBackdrop lines={8} />);

    expect(container.querySelectorAll('[data-slot="contour-line"]')).toHaveLength(8);
  });

  it('adds a stream to every nth line', () => {
    const { container } = render(<ContourBackdrop lines={8} streamEvery={4} />);

    expect(container.querySelectorAll('[data-slot="contour-stream"]')).toHaveLength(2);
  });

  it('draws no streams when they are turned off', () => {
    const { container } = render(<ContourBackdrop streamEvery={0} />);

    expect(container.querySelectorAll('[data-slot="contour-stream"]')).toHaveLength(0);
  });

  it('holds the streams still when animation is off', () => {
    const { container } = render(<ContourBackdrop animated={false} />);

    expect(container.querySelector('[data-slot="contour-backdrop"]')).toHaveAttribute('data-moving', 'false');
    expect(container.querySelector('animate')).toBeNull();
  });
});
