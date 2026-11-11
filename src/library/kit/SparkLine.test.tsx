import { render, screen } from '@testing-library/react';

import { LookScope } from '../looks/LookScope';

import { SparkLine } from './SparkLine';

const VALUES = [4, 5, 3, 6, 7];

describe(SparkLine.name, () => {
  it('is an image named by its label', () => {
    render(<SparkLine values={VALUES} label="Gas export trend" />);

    expect(screen.getByRole('img', { name: 'Gas export trend' })).toBeInTheDocument();
  });

  it('draws a line with one point per value', () => {
    const { container } = render(<SparkLine values={VALUES} label="Trend" variant="line" />);

    expect(container.querySelector('.kit-spark-line')?.getAttribute('points')?.split(' ')).toHaveLength(5);
  });

  it('marks the latest value', () => {
    const { container } = render(<SparkLine values={VALUES} label="Trend" variant="line" />);

    expect(container.querySelector('.kit-spark-dot')).not.toBeNull();
  });

  it('draws bars in the poster look', () => {
    const { container } = render(
      <LookScope look="poster">
        <SparkLine values={VALUES} label="Trend" />
      </LookScope>
    );

    expect(container.querySelectorAll('.kit-spark-bar')).toHaveLength(5);
  });
});
