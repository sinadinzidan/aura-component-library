import { render } from '@testing-library/react';

import { EdgeRuler } from './EdgeRuler';

describe(EdgeRuler.name, () => {
  it('draws one tick per division plus the closing tick', () => {
    const { container } = render(<EdgeRuler edge="top" divisions={20} />);

    expect(container.querySelectorAll('line')).toHaveLength(21);
  });

  it('runs along the width for a horizontal edge and the height for a vertical one', () => {
    const { container, rerender } = render(<EdgeRuler edge="bottom" />);
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 1000 10');

    rerender(<EdgeRuler edge="left" />);
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 10 1000');
  });

  it('is decoration only', () => {
    const { container } = render(<EdgeRuler edge="right" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
