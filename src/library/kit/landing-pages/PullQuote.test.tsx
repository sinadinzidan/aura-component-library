import { render, screen } from '@testing-library/react';

import { PullQuote } from './PullQuote';

describe(PullQuote.name, () => {
  it('sets the quote with who said it', () => {
    render(<PullQuote quote="We saw the bearing going a week early." name="Aisha Khan" role="Rotating equipment engineer, Nordkapp" />);

    expect(screen.getByRole('figure')).toHaveTextContent('“We saw the bearing going a week early.”');
    expect(screen.getByText('Aisha Khan')).toBeInTheDocument();
    expect(screen.getByText('Rotating equipment engineer, Nordkapp')).toBeInTheDocument();
  });
});
