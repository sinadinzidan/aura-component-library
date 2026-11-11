import { render, screen } from '@testing-library/react';

import { Callout } from './Callout';

describe(Callout.name, () => {
  it('is a note with its finding, evidence, tone and action', () => {
    render(
      <Callout title="Four days over tolerance" tone="warning" action={<button type="button">Open trend</button>}>
        All after the first vibration alarm.
      </Callout>
    );

    const note = screen.getByRole('note');
    expect(note).toHaveTextContent('Four days over tolerance');
    expect(note).toHaveTextContent('All after the first vibration alarm.');
    expect(note).toHaveAttribute('data-tone', 'warning');
    expect(screen.getByRole('button', { name: 'Open trend' })).toBeInTheDocument();
  });

  it('uses the accent tone by default', () => {
    render(<Callout title="On plan" />);

    expect(screen.getByRole('note')).toHaveAttribute('data-tone', 'accent');
  });
});
