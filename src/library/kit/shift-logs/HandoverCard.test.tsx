import { render, screen } from '@testing-library/react';

import { HandoverCard } from './HandoverCard';

describe(HandoverCard.name, () => {
  it('names both people, the state and every topic', () => {
    render(
      <HandoverCard
        title="Day shift to evening shift"
        when="Thursday 12 March, 14:00"
        from={{ name: 'Ingrid Haugen', role: 'Control room operator' }}
        to={{ name: 'Liv Wold', role: 'Shift supervisor' }}
        state="handed-over"
        topics={[
          { id: 'safety', heading: 'Safety', tone: 'pink', points: ['PTW-2288 suspended'] },
          { id: 'equipment', heading: 'Equipment', tone: 'amber', points: ['Recompressor tripped', 'Cooler fouled'] },
        ]}
        footer={<span>Sign-off</span>}
      />
    );

    expect(screen.getByText('Waiting for acceptance')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ingrid Haugen' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Liv Wold' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(2);
    expect(screen.getByText('Cooler fouled')).toBeInTheDocument();
    expect(screen.getByText('Sign-off')).toBeInTheDocument();
  });
});
