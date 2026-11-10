import { render } from '@testing-library/react';

import { PipeLine } from './PipeLine';

const ROUTE = [
  { x: 0, y: 0 },
  { x: 60, y: 0 },
];

function renderPipe(pipe: React.ReactNode) {
  const { container } = render(<svg>{pipe}</svg>);
  return { group: container.querySelector('[data-slot="pipe-line"]'), container };
}

describe(PipeLine.name, () => {
  it('draws the route as one path', () => {
    const { group } = renderPipe(<PipeLine points={[...ROUTE, { x: 60, y: 30 }]} />);

    expect(group?.querySelector('path')).toHaveAttribute('d', 'M 0 0 L 60 0 L 60 30');
  });

  it('has no arrows unless flow is set', () => {
    const { container } = renderPipe(<PipeLine points={ROUTE} />);

    expect(container.querySelector('[data-slot="flow-arrow"]')).not.toBeInTheDocument();
  });

  it('puts a forward arrow in the middle of the route', () => {
    const { container } = renderPipe(<PipeLine points={ROUTE} flow="forward" arrowSize={6} />);

    const arrow = container.querySelector('[data-slot="flow-arrow"]');
    expect(arrow).toHaveAttribute('data-direction', 'right');
    expect(arrow).toHaveAttribute('d', 'M 27 -3 L 33 0 L 27 3 Z');
  });

  it('turns the arrows round for reverse flow', () => {
    const { container } = renderPipe(<PipeLine points={ROUTE} flow="reverse" />);

    expect(container.querySelector('[data-slot="flow-arrow"]')).toHaveAttribute('data-direction', 'left');
  });

  it('draws as many arrows as asked', () => {
    const { container } = renderPipe(<PipeLine points={ROUTE} flow="forward" arrows={3} />);

    expect(container.querySelectorAll('[data-slot="flow-arrow"]')).toHaveLength(3);
  });

  it('is heavier for main lines and lighter for utilities', () => {
    const heavy = renderPipe(<PipeLine points={ROUTE} weight="heavy" />).group?.querySelector('path');
    const light = renderPipe(<PipeLine points={ROUTE} weight="light" />).group?.querySelector('path');

    expect(heavy).toHaveAttribute('stroke-width', '3');
    expect(light).toHaveAttribute('stroke-width', '1');
  });

  it('dashes a line with no flow', () => {
    const { group } = renderPipe(<PipeLine points={ROUTE} dashed />);

    expect(group?.querySelector('path')).toHaveAttribute('stroke-dasharray');
  });

  it('is neutral unless given a tone', () => {
    expect(renderPipe(<PipeLine points={ROUTE} />).group).toHaveClass('text-medium-foreground');
    expect(renderPipe(<PipeLine points={ROUTE} tone="critical" />).group).toHaveClass('text-critical-foreground-strong');
  });
});
