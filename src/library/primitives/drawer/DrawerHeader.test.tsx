import { render, screen } from '@testing-library/react';

import { DrawerHeader } from './DrawerHeader';

describe(DrawerHeader.name, () => {
  it('renders its children in the header slot', () => {
    render(<DrawerHeader>Compressor details</DrawerHeader>);

    expect(screen.getByText('Compressor details')).toHaveAttribute('data-slot', 'drawer-header');
  });

  it('merges layout classes', () => {
    render(<DrawerHeader className="gap-4">Compressor details</DrawerHeader>);

    expect(screen.getByText('Compressor details')).toHaveClass('gap-4');
  });
});
