import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SideSheet } from './SideSheet';

describe(SideSheet.name, () => {
  it('is a complementary region named by its title with body and footer', () => {
    render(
      <SideSheet title="WO-104482" subtitle="Inspect bearing" footer={<button type="button">Assign</button>} width={400}>
        Details
      </SideSheet>
    );

    const sheet = screen.getByRole('complementary', { name: 'WO-104482' });
    expect(sheet).toHaveTextContent('Inspect bearing');
    expect(sheet).toHaveTextContent('Details');
    expect(sheet).toHaveStyle({ width: '400px' });
    expect(screen.getByRole('button', { name: 'Assign' })).toBeInTheDocument();
  });

  it('asks to close', async () => {
    const onClose = vi.fn();
    render(<SideSheet title="WO-104482" onClose={onClose}>Details</SideSheet>);

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
