import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BottomNav } from './BottomNav';

const ITEMS = [
  { id: 'home', label: 'Home', icon: <svg aria-hidden="true" /> },
  { id: 'alarms', label: 'Alarms', icon: <svg aria-hidden="true" />, badge: '4' },
];

describe(BottomNav.name, () => {
  it('marks the current destination and shows badges', () => {
    render(<BottomNav label="Primary" items={ITEMS} current="home" />);

    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /Alarms/ })).toHaveTextContent('4');
  });

  it('reports navigation', async () => {
    const onNavigate = vi.fn();
    render(<BottomNav label="Primary" items={ITEMS} current="home" onNavigate={onNavigate} />);

    await userEvent.click(screen.getByRole('button', { name: /Alarms/ }));

    expect(onNavigate).toHaveBeenCalledWith('alarms');
  });
});
