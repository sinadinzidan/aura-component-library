import { render } from '@testing-library/react';

import { Reticle } from './Reticle';

function renderReticle(props: Partial<Parameters<typeof Reticle>[0]> = {}) {
  return render(
    <svg>
      <Reticle x={120} y={80} {...props} />
    </svg>
  );
}

describe(Reticle.name, () => {
  it('sits at the given position', () => {
    const { container } = renderReticle();

    expect(container.querySelector('[data-slot="reticle"]')).toHaveStyle({ transform: 'translate(120px, 80px)' });
  });

  it('draws four brackets, four ticks and a ring when locked', () => {
    const { container } = renderReticle();

    expect(container.querySelectorAll('path')).toHaveLength(8);
    expect(container.querySelector('[data-slot="reticle-ring"]')).toBeInTheDocument();
  });

  it('has no ring when unlocked', () => {
    const { container } = renderReticle({ locked: false });

    expect(container.querySelector('[data-slot="reticle"]')).toHaveAttribute('data-locked', 'false');
    expect(container.querySelector('[data-slot="reticle-ring"]')).not.toBeInTheDocument();
  });

  it('is decorative and lets clicks through', () => {
    const { container } = renderReticle();

    expect(container.querySelector('[data-slot="reticle"]')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('[data-slot="reticle"]')).toHaveClass('pointer-events-none');
  });
});
