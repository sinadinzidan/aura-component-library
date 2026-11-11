import { render, screen } from '@testing-library/react';

import { CompareRow } from './CompareRow';

function sides(container: HTMLElement) {
  return [container.querySelector('[data-side="a"]'), container.querySelector('[data-side="b"]')];
}

describe(CompareRow.name, () => {
  it('shows both values formatted and marks the higher one as better', () => {
    const { container } = render(<CompareRow label="Availability" unit="%" a={98.2} b={96.4} decimals={1} />);

    const [a, b] = sides(container);
    expect(screen.getByRole('group', { name: 'Availability' })).toHaveTextContent('%');
    expect(a).toHaveTextContent('98.2');
    expect(b).toHaveTextContent('96.4');
    expect(a).toHaveAttribute('data-better');
    expect(b).not.toHaveAttribute('data-better');
  });

  it('marks the lower one when lower is better', () => {
    const { container } = render(<CompareRow label="Vibration" a={6.8} b={4.1} decimals={1} better="lower" />);

    const [a, b] = sides(container);
    expect(a).not.toHaveAttribute('data-better');
    expect(b).toHaveAttribute('data-better');
  });

  it('judges neither side when told not to, or on a tie', () => {
    const { container, rerender } = render(<CompareRow label="Speed" a={10} b={12} better="none" />);
    expect(container.querySelector('[data-better]')).toBeNull();

    rerender(<CompareRow label="Speed" a={10} b={10} />);
    expect(container.querySelector('[data-better]')).toBeNull();
  });

  it('sizes the bars against the maximum', () => {
    const { container } = render(<CompareRow label="Load" a={50} b={200} max={100} />);

    const fills = container.querySelectorAll('.dash-compare-fill');
    expect(fills[0]).toHaveStyle({ width: '50%' });
    expect(fills[1]).toHaveStyle({ width: '100%' });
  });
});
