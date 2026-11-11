import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { Pane } from './Pane';
import { Panes } from './Panes';

describe(Panes.name, () => {
  it('lays its panes out on the given column tracks', () => {
    render(
      <Panes label="Asset browser" columns="16rem minmax(0, 1fr)">
        <Pane title="Tree">Nodes</Pane>
        <Pane title="Record">Fields</Pane>
      </Panes>
    );

    expect(screen.getByRole('group', { name: 'Asset browser' })).toHaveStyle({ gridTemplateColumns: '16rem minmax(0, 1fr)' });
    expect(screen.getAllByRole('region')).toHaveLength(2);
  });

  it('carries the look for the stylesheet', () => {
    render(
      <LookScope look="glass">
        <Panes label="Split" columns="1fr 1fr">
          <Pane>Left</Pane>
        </Panes>
      </LookScope>
    );

    expect(screen.getByRole('group', { name: 'Split' })).toHaveAttribute('data-look', 'glass');
  });
});
