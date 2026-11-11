import { render, screen } from '@testing-library/react';

import { LookScope } from '../looks/LookScope';

import { Canvas } from './Canvas';

describe(Canvas.name, () => {
  it('draws in the studio look outside a scope', () => {
    render(<Canvas>Board</Canvas>);

    expect(screen.getByText('Board')).toHaveAttribute('data-look', 'studio');
  });

  it('takes the look of the scope around it', () => {
    render(
      <LookScope look="blueprint">
        <Canvas>Board</Canvas>
      </LookScope>
    );

    expect(screen.getByText('Board')).toHaveAttribute('data-look', 'blueprint');
  });

  it('can drop its padding', () => {
    render(<Canvas padding="none">Board</Canvas>);

    expect(screen.getByText('Board')).toHaveAttribute('data-pad', 'none');
  });
});
