import { render, screen, within } from '@testing-library/react';

import { ColorByControl } from './ColorByControl';

describe(ColorByControl.name, () => {
  it('explains that material mode has no colour coding', () => {
    render(<ColorByControl mode="none" onModeChange={() => undefined} />);

    expect(screen.getByText('No colour coding. Parts show their material.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Colour legend' })).not.toBeInTheDocument();
  });

  it('lists only the run states in use', () => {
    render(<ColorByControl mode="status" onModeChange={() => undefined} />);

    const legend = screen.getByRole('list', { name: 'Colour legend' });
    expect(within(legend).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Running', 'Standby', 'Tripped']);
  });

  it('lists the five systems', () => {
    render(<ColorByControl mode="system" onModeChange={() => undefined} />);

    expect(within(screen.getByRole('list', { name: 'Colour legend' })).getAllByRole('listitem')).toHaveLength(5);
  });

  it('names health states in words', () => {
    render(<ColorByControl mode="health" onModeChange={() => undefined} />);

    expect(screen.getByText('Poor')).toBeInTheDocument();
    expect(screen.getByText('Watch')).toBeInTheDocument();
  });
});
