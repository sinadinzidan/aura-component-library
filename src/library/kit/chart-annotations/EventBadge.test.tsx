import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { EventBadge } from './EventBadge';

describe(EventBadge.name, () => {
  it('shows the mark with its tone', () => {
    render(<EventBadge tone="critical">2</EventBadge>);

    const badge = screen.getByText('2').parentElement;
    expect(badge).toHaveAttribute('data-tone', 'critical');
    expect(badge).toHaveAttribute('data-selected', 'false');
  });

  it('marks the selected badge and follows the look', () => {
    render(
      <LookScope look="blueprint">
        <EventBadge selected>A</EventBadge>
      </LookScope>
    );

    const badge = screen.getByText('A').parentElement;
    expect(badge).toHaveAttribute('data-selected', 'true');
    expect(badge).toHaveAttribute('data-look', 'blueprint');
  });
});
