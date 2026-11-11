import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { StateMessage } from './StateMessage';

describe(StateMessage.name, () => {
  it('shows the code, heading, explanation, actions and details', () => {
    render(
      <StateMessage code="404" title="This page does not exist" description="The link may be old." actions={<button type="button">Go home</button>}>
        <p>Reference NK-1</p>
      </StateMessage>,
    );

    expect(screen.getByRole('heading', { name: 'This page does not exist' })).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('The link may be old.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go home' })).toBeInTheDocument();
    expect(screen.getByText('Reference NK-1')).toBeInTheDocument();
  });

  it('turns the code into giant numerals on a poster', () => {
    render(
      <LookScope look="poster">
        <StateMessage code="500" title="Something broke" tone="critical" />
      </LookScope>,
    );

    expect(screen.getByText('500')).toHaveClass('text-[9rem]');
    expect(screen.getByRole('heading', { name: 'Something broke' }).closest('[data-tone]')).toHaveAttribute('data-tone', 'critical');
  });
});
