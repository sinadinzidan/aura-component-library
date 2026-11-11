import { render, screen } from '@testing-library/react';

import { LookScope } from '../looks/LookScope';

import { StatusPill } from './StatusPill';

describe(StatusPill.name, () => {
  it('says the state as a word with its tone', () => {
    render(<StatusPill tone="critical">Tripped</StatusPill>);

    expect(screen.getByText('Tripped')).toHaveAttribute('data-tone', 'critical');
  });

  it('lets the look choose the variant', () => {
    render(
      <LookScope look="console">
        <StatusPill>Running</StatusPill>
      </LookScope>
    );

    expect(screen.getByText('Running')).toHaveAttribute('data-variant', 'filled');
  });

  it('keeps an explicit variant', () => {
    render(
      <LookScope look="console">
        <StatusPill variant="outline">Running</StatusPill>
      </LookScope>
    );

    expect(screen.getByText('Running')).toHaveAttribute('data-variant', 'outline');
  });

  it('shows an icon instead of the dot', () => {
    const { container } = render(<StatusPill icon={<svg data-testid="icon" />}>Watch</StatusPill>);

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(container.querySelector('.kit-pill-dot')).toBeNull();
  });
});
