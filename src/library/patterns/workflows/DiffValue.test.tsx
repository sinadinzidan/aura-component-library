import { render, screen } from '@testing-library/react';

import { DiffValue } from './DiffValue';

describe(DiffValue.name, () => {
  it('strikes the old value and inserts the new one', () => {
    const { container } = render(<DiffValue before="145.0" after="148.0" unit="°C" />);

    expect(container.querySelector('del')).toHaveTextContent('Was 145.0');
    expect(container.querySelector('ins')).toHaveTextContent('Now 148.0 °C');
    expect(container.querySelector('[data-slot="diff-value"]')).toHaveAttribute('data-change', 'changed');
  });

  it('prints an unchanged value once', () => {
    const { container } = render(<DiffValue before="52.0" after="52.0" unit="barg" />);

    expect(container.querySelector('del')).toBeNull();
    expect(container.querySelector('ins')).toBeNull();
    expect(screen.getByText('52.0')).toBeInTheDocument();
  });

  it('announces a value that is new', () => {
    const { container } = render(<DiffValue after="55.0" />);

    expect(container.querySelector('del')).toBeNull();
    expect(container.querySelector('ins')).toHaveTextContent('New 55.0');
  });

  it('says a value was removed', () => {
    const { container } = render(<DiffValue before="55.0" />);

    expect(container.querySelector('del')).toHaveTextContent('Was 55.0');
    expect(screen.getByText('removed')).toBeInTheDocument();
  });

  it('prints a dash when there is no value on either side', () => {
    render(<DiffValue />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
