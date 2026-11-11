import { render, screen } from '@testing-library/react';

import { Donut } from './Donut';

const SEGMENTS = [
  { label: 'Corrective', value: 2, tone: 'pink' },
  { label: 'Preventive', value: 4, tone: 'blue' },
] as const;

describe(Donut.name, () => {
  it('is an image with the total in the middle', () => {
    render(<Donut label="Open work orders by type" segments={SEGMENTS} centerCaption="open" />);

    expect(screen.getByRole('img', { name: 'Open work orders by type' })).toHaveTextContent('6');
    expect(screen.getByText('open')).toBeInTheDocument();
  });

  it('draws one arc per segment', () => {
    const { container } = render(<Donut label="Mix" segments={SEGMENTS} />);

    expect(container.querySelectorAll('.kit-donut-seg')).toHaveLength(2);
  });

  it('carries the numbers in its legend', () => {
    render(<Donut label="Mix" segments={SEGMENTS} unit=" h" />);

    expect(screen.getByText('Corrective')).toBeInTheDocument();
    expect(screen.getByText('4 h')).toBeInTheDocument();
  });

  it('can drop the legend', () => {
    render(<Donut label="Mix" segments={SEGMENTS} legend="none" />);

    expect(screen.queryByText('Corrective')).toBeNull();
  });
});
