import { render, screen } from '@testing-library/react';

import { BarrierTypeMark } from './BarrierTypeMark';

describe(BarrierTypeMark.name, () => {
  it('writes the type out next to its icon', () => {
    render(<BarrierTypeMark type="procedural" />);

    expect(screen.getByText('Procedural')).toBeVisible();
  });

  it('marks the type on the element', () => {
    const { container } = render(<BarrierTypeMark type="human" />);

    expect(container.querySelector('[data-slot="barrier-type"]')).toHaveAttribute('data-type', 'human');
  });

  it('keeps the word for assistive technology when only the icon shows', () => {
    render(<BarrierTypeMark type="engineered" iconOnly />);

    expect(screen.getByText('Engineered')).toHaveClass('sr-only');
  });
});
