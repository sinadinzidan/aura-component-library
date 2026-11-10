import { render } from '@testing-library/react';

import { FlowArrow } from './FlowArrow';

function renderArrow(arrow: React.ReactNode) {
  return render(<svg>{arrow}</svg>).container.querySelector('[data-slot="flow-arrow"]');
}

describe(FlowArrow.name, () => {
  it('points right by default', () => {
    const arrow = renderArrow(<FlowArrow x={10} y={10} size={6} />);

    expect(arrow).toHaveAttribute('data-direction', 'right');
    expect(arrow).toHaveAttribute('d', 'M 7 7 L 13 10 L 7 13 Z');
  });

  it('points the way it is told', () => {
    const arrow = renderArrow(<FlowArrow x={10} y={10} size={6} direction="up" />);

    expect(arrow).toHaveAttribute('d', 'M 7 13 L 10 7 L 13 13 Z');
  });

  it('is filled with the current colour, neutral by default', () => {
    const arrow = renderArrow(<FlowArrow x={0} y={0} />);

    expect(arrow).toHaveAttribute('fill', 'currentColor');
    expect(arrow).toHaveClass('text-medium-foreground');
  });

  it('takes a status tone', () => {
    const arrow = renderArrow(<FlowArrow x={0} y={0} tone="warning" />);

    expect(arrow).toHaveClass('text-warning-foreground-strong');
  });
});
