import { render, screen } from '@testing-library/react';

import { LookScope } from '../looks/LookScope';

import { Stat } from './Stat';
import { StatGroup } from './StatGroup';

describe(StatGroup.name, () => {
  it('names the group and sets its columns', () => {
    render(
      <StatGroup label="Plant KPIs" columns={3}>
        <Stat label="OEE" value={82.7} />
      </StatGroup>
    );

    const group = screen.getByRole('group', { name: 'Plant KPIs' });
    expect(group.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
    expect(group).toHaveAttribute('data-joined', 'false');
  });

  it('joins the figures in looks that rule them', () => {
    render(
      <LookScope look="editorial">
        <StatGroup label="Plant KPIs">
          <Stat label="OEE" value={82.7} />
        </StatGroup>
      </LookScope>
    );

    expect(screen.getByRole('group', { name: 'Plant KPIs' })).toHaveAttribute('data-joined', 'true');
  });
});
