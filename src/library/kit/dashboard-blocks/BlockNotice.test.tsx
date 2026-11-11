import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { BlockNotice } from './BlockNotice';

describe(BlockNotice.name, () => {
  it('raises a critical notice as an alert with its detail and action', () => {
    render(<BlockNotice tone="critical" title="Could not load alarms" detail="The alarm service timed out." action={<button type="button">Retry</button>} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not load alarms');
    expect(alert).toHaveTextContent('The alarm service timed out.');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('reports other tones as a status', () => {
    render(<BlockNotice title="Showing values from 13:12" />);

    expect(screen.getByRole('status')).toHaveAttribute('data-tone', 'warning');
  });

  it('carries the look it is drawn in', () => {
    render(
      <LookScope look="signal">
        <BlockNotice title="Stale" variant="block" />
      </LookScope>
    );

    expect(screen.getByRole('status')).toHaveAttribute('data-look', 'signal');
    expect(screen.getByRole('status')).toHaveAttribute('data-variant', 'block');
  });
});
