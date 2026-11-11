import { render, screen } from '@testing-library/react';

import { ReleaseEntry } from './ReleaseEntry';

describe(ReleaseEntry.name, () => {
  it('shows the version, date, headline and each change with its kind in words', () => {
    render(
      <ReleaseEntry
        version="2026.3"
        date="10 March 2026"
        title="Shift handover with sign-off"
        summary="Handover notes can now be signed."
        latest
        changes={[
          { kind: 'new', text: 'Sign a handover note' },
          { kind: 'fixed', text: 'Trend legend no longer overlaps' },
        ]}
      />,
    );

    const entry = screen.getByRole('article');
    expect(entry).toHaveTextContent('2026.3');
    expect(entry).toHaveTextContent('10 March 2026');
    expect(screen.getByRole('heading', { name: 'Shift handover with sign-off' })).toBeInTheDocument();
    expect(screen.getByText('Latest')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Fixed')).toBeInTheDocument();
  });

  it('gives each kind of change its own tone', () => {
    render(<ReleaseEntry version="2026.2" date="10 February 2026" title="Faster trends" changes={[{ kind: 'improved', text: 'Trends load twice as fast' }]} />);

    expect(screen.getByText('Trends load twice as fast').closest('li')).toHaveAttribute('data-tone', 'info');
  });
});
