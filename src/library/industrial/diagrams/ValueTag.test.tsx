import { render, screen } from '@testing-library/react';

import { ValueTag } from './ValueTag';

function renderTag(tag: React.ReactNode) {
  const { container } = render(<svg>{tag}</svg>);
  return {
    container,
    group: container.querySelector('[data-slot="value-tag"]'),
    box: container.querySelector('[data-slot="value-tag-box"]'),
  };
}

describe(ValueTag.name, () => {
  it('prints the value with fixed decimals and its unit', () => {
    renderTag(<ValueTag x={0} y={0} value={48.6} unit="barg" decimals={1} />);

    expect(screen.getByText('48.6')).toBeInTheDocument();
    expect(screen.getByText('barg')).toBeInTheDocument();
  });

  it('prints an em dash when there is no value', () => {
    renderTag(<ValueTag x={0} y={0} value={null} unit="°C" />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('is a quiet neutral box by default', () => {
    const { box, group } = renderTag(<ValueTag x={0} y={0} value={12} />);

    expect(group).toHaveAttribute('data-tone', 'neutral');
    expect(box).toHaveClass('fill-muted-background');
    expect(screen.getByText('12').parentElement).toHaveClass('fill-base-foreground');
  });

  it('tints the box and text for an abnormal reading', () => {
    const { box } = renderTag(<ValueTag x={0} y={0} value={146.3} decimals={1} tone="warning" />);

    expect(box).toHaveClass('fill-warning-background');
    expect(screen.getByText('146.3').parentElement).toHaveClass('fill-warning-foreground');
  });

  it('adds a letter flag so the state does not rest on colour', () => {
    renderTag(<ValueTag x={0} y={0} value={11.6} decimals={1} tone="critical" flag="HH" />);

    expect(screen.getByText('HH')).toHaveAttribute('data-slot', 'value-tag-flag');
  });

  it('shows a label above the value and grows taller for it', () => {
    const plain = renderTag(<ValueTag x={0} y={0} value={1} />).box;
    const labelled = renderTag(<ValueTag x={0} y={0} value={1} label="23-PT-92531" mono />);

    expect(screen.getByText('23-PT-92531')).toHaveClass('font-mono');
    expect(Number(labelled.box?.getAttribute('height'))).toBeGreaterThan(Number(plain?.getAttribute('height')));
  });

  it('anchors at the start, middle or end of its point', () => {
    const start = renderTag(<ValueTag x={100} y={0} value={1} width={40} />).box;
    const middle = renderTag(<ValueTag x={100} y={0} value={1} width={40} anchor="middle" />).box;
    const end = renderTag(<ValueTag x={100} y={0} value={1} width={40} anchor="end" />).box;

    expect(start).toHaveAttribute('x', '100');
    expect(middle).toHaveAttribute('x', '80');
    expect(end).toHaveAttribute('x', '60');
  });

  it('widens to fit longer text', () => {
    const short = renderTag(<ValueTag x={0} y={0} value={1} />).box;
    const long = renderTag(<ValueTag x={0} y={0} value={182400} unit="Sm³/h" />).box;

    expect(Number(long?.getAttribute('width'))).toBeGreaterThan(Number(short?.getAttribute('width')));
  });

  it('draws a leader from the bottom edge to a point below', () => {
    const { container } = renderTag(<ValueTag x={0} y={0} value={1} width={40} leaderTo={{ x: 20, y: 60 }} />);

    expect(container.querySelector('[data-slot="value-tag-leader"]')).toHaveAttribute('d', 'M 20 20 L 20 60');
  });

  it('draws a leader from the top edge to a point above', () => {
    const { container } = renderTag(<ValueTag x={0} y={50} value={1} width={40} leaderTo={{ x: 20, y: 10 }} />);

    expect(container.querySelector('[data-slot="value-tag-leader"]')).toHaveAttribute('d', 'M 20 50 L 20 10');
  });
});
