import { render, screen } from '@testing-library/react';

import { StateLabel } from './StateLabel';
import { RUN_STATES } from './status';

describe(StateLabel.name, () => {
  it('shows the glyph, the word and the detail', () => {
    const { container } = render(<StateLabel state={RUN_STATES.tripped} detail="Since 13:46" size="lg" attention />);

    expect(screen.getByText('Tripped')).toBeInTheDocument();
    expect(screen.getByText('Since 13:46')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'critical');
    expect(container.querySelector('[data-shape="triangle"]')).toHaveAttribute('data-attention', 'true');
  });
});
