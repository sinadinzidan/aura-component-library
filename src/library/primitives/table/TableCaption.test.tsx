import { render, screen } from '@testing-library/react';

import { TableCaption } from './TableCaption';

describe(TableCaption.name, () => {
  it('names the table', () => {
    render(
      <table>
        <TableCaption>Open work orders, Nordkapp</TableCaption>
      </table>
    );

    expect(screen.getByRole('table', { name: 'Open work orders, Nordkapp' })).toBeInTheDocument();
  });

  it('sits above the table when asked', () => {
    render(
      <table>
        <TableCaption side="top">Open work orders</TableCaption>
      </table>
    );

    expect(screen.getByText('Open work orders')).toHaveClass('caption-top');
  });

  it('can name the table without showing', () => {
    render(
      <table>
        <TableCaption srOnly>Open work orders</TableCaption>
      </table>
    );

    expect(screen.getByText('Open work orders')).toHaveClass('sr-only');
    expect(screen.getByRole('table', { name: 'Open work orders' })).toBeInTheDocument();
  });
});
