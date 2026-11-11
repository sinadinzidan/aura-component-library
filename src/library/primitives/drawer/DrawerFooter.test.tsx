import { render, screen } from '@testing-library/react';

import { DrawerFooter } from './DrawerFooter';

describe(DrawerFooter.name, () => {
  it('renders its children in the footer slot', () => {
    render(<DrawerFooter>Compressor details</DrawerFooter>);

    expect(screen.getByText('Compressor details')).toHaveAttribute('data-slot', 'drawer-footer');
  });

  it('merges layout classes', () => {
    render(<DrawerFooter className="gap-4">Compressor details</DrawerFooter>);

    expect(screen.getByText('Compressor details')).toHaveClass('gap-4');
  });
});
