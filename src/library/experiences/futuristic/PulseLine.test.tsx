import { render } from '@testing-library/react';

import { PulseLine } from './PulseLine';

const PATH = 'M 0 0 L 100 0';

function renderLine(props: Partial<Parameters<typeof PulseLine>[0]> = {}) {
  return render(
    <svg>
      <PulseLine d={PATH} {...props} />
    </svg>
  );
}

describe(PulseLine.name, () => {
  it('draws the route as a glow and a core line', () => {
    const { container } = renderLine({ animated: false });

    expect(container.querySelectorAll('path')).toHaveLength(2);
    expect(container.querySelector('path')).toHaveAttribute('d', PATH);
  });

  it('sends the requested number of pulses along the path', () => {
    const { container } = renderLine({ animated: true, pulses: 3 });

    expect(container.querySelectorAll('[data-slot="pulse"]')).toHaveLength(3);
    expect(container.querySelector('animateMotion')).toHaveAttribute('path', PATH);
  });

  it('has no pulses without motion', () => {
    const { container } = renderLine({ animated: false, pulses: 3 });

    expect(container.querySelectorAll('[data-slot="pulse"]')).toHaveLength(0);
  });

  it('is dashed and still when idle', () => {
    const { container } = renderLine({ animated: true, idle: true });

    expect(container.querySelectorAll('[data-slot="pulse"]')).toHaveLength(0);
    expect(container.querySelectorAll('path')[1]).toHaveAttribute('stroke-dasharray', '5 5');
  });

  it('is hidden from assistive technology', () => {
    const { container } = renderLine();

    expect(container.querySelector('[data-slot="pulse-line"]')).toHaveAttribute('aria-hidden', 'true');
  });
});
