import { render, screen } from '@testing-library/react';

import { DrawerBody } from './DrawerBody';

describe(DrawerBody.name, () => {
  it('renders its children in the body slot', () => {
    render(<DrawerBody>Compressor details</DrawerBody>);

    expect(screen.getByText('Compressor details')).toHaveAttribute('data-slot', 'drawer-body');
  });

  it('merges layout classes', () => {
    render(<DrawerBody className="gap-4">Compressor details</DrawerBody>);

    expect(screen.getByText('Compressor details')).toHaveClass('gap-4');
  });
});

describe('DrawerBody scrolling', () => {
  it('scrolls on its own and can drop its padding', () => {
    render(<DrawerBody flush>Rows</DrawerBody>);

    expect(screen.getByText('Rows')).toHaveClass('overflow-y-auto');
    expect(screen.getByText('Rows')).not.toHaveClass('px-5');
  });
});
