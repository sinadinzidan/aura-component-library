import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MobileAppBar } from './MobileAppBar';
import type { MobileAppBarProps } from './MobileAppBar';

function renderBar(props: Partial<MobileAppBarProps> = {}) {
  return render(
    <TooltipProvider>
      <MobileAppBar title="WO-104482" {...props} />
    </TooltipProvider>
  );
}

describe(MobileAppBar.name, () => {
  it('shows the title and subtitle', () => {
    renderBar({ subtitle: '23-KA-9103' });

    expect(screen.getByRole('heading', { name: 'WO-104482' })).toBeInTheDocument();
    expect(screen.getByText('23-KA-9103')).toBeInTheDocument();
  });

  it('has a back button named for where it goes', async () => {
    const onBack = vi.fn();
    renderBar({ backLabel: 'Back to Work orders', onBack });

    await userEvent.click(screen.getByRole('button', { name: 'Back to Work orders' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('has no back button on a root screen and shows its leading control instead', () => {
    renderBar({ leading: <button type="button">Menu</button> });

    expect(screen.queryByRole('button', { name: /Back/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });

  it('runs an action and keeps at most two', async () => {
    const onClick = vi.fn();
    const action = (id: string) => ({ id, label: `Action ${id}`, icon: <svg aria-hidden="true" />, onClick });
    renderBar({ actions: [action('a'), action('b'), action('c')] });

    await userEvent.click(screen.getByRole('button', { name: 'Action a' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Action c' })).not.toBeInTheDocument();
  });
});
