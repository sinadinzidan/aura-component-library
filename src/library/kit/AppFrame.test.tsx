import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LookScope } from '../looks/LookScope';

import { AppFrame } from './AppFrame';

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'alarms', label: 'Alarms', badge: '4' },
];

describe(AppFrame.name, () => {
  it('names the navigation after the brand and marks the current item', () => {
    render(
      <AppFrame brand={{ name: 'Nordkapp' }} nav={NAV} current="overview">
        Board
      </AppFrame>
    );

    expect(screen.getByRole('navigation', { name: 'Nordkapp' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /Alarms/ })).not.toHaveAttribute('aria-current');
  });

  it('reports navigation', async () => {
    const onNavigate = vi.fn();
    render(
      <AppFrame brand={{ name: 'Nordkapp' }} nav={NAV} current="overview" onNavigate={onNavigate}>
        Board
      </AppFrame>
    );

    await userEvent.click(screen.getByRole('button', { name: /Alarms/ }));

    expect(onNavigate).toHaveBeenCalledWith('alarms');
  });

  it('shows the title bar and the content on a canvas', () => {
    const { container } = render(
      <AppFrame brand={{ name: 'Nordkapp' }} title="Plant overview" subtitle="Updated 14:00">
        Board
      </AppFrame>
    );

    expect(screen.getByRole('heading', { name: 'Plant overview' })).toBeInTheDocument();
    expect(container.querySelector('.kit-canvas')).toHaveTextContent('Board');
  });

  it('uses the chrome the look is paired with unless told otherwise', () => {
    const { container, rerender } = render(
      <LookScope look="glass">
        <AppFrame brand={{ name: 'Nordkapp' }}>Board</AppFrame>
      </LookScope>
    );
    expect(container.querySelector('.kit-frame')).toHaveAttribute('data-variant', 'rail');

    rerender(
      <LookScope look="glass">
        <AppFrame brand={{ name: 'Nordkapp' }} variant="topbar">
          Board
        </AppFrame>
      </LookScope>
    );
    expect(container.querySelector('.kit-frame')).toHaveAttribute('data-variant', 'topbar');
  });
});
