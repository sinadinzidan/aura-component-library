import { render } from '@testing-library/react';

import { RotorGlyph } from './RotorGlyph';

describe(RotorGlyph.name, () => {
  it('draws three blades and keeps its proportions', () => {
    const { container } = render(<RotorGlyph size={112} />);

    expect(container.querySelectorAll('g path')).toHaveLength(3);
    expect(container.querySelector('svg')).toHaveAttribute('width', '96');
  });

  it('marks feathered blades', () => {
    const { container } = render(<RotorGlyph feathered />);

    expect(container.querySelector('svg')).toHaveAttribute('data-feathered', 'true');
  });
});
