import { render, screen, within } from '@testing-library/react';

import { SceneLegend } from './SceneLegend';

describe(SceneLegend.name, () => {
  it('lists every item with its label', () => {
    render(
      <SceneLegend
        items={[
          { kind: 'status', label: 'Tripped', tone: 'critical' },
          { kind: 'selection', label: 'Selected' },
          { kind: 'flow', label: 'Flow direction' },
          { kind: 'area', label: 'Area' },
        ]}
      />
    );

    const list = screen.getByRole('list', { name: 'Scene legend' });
    expect(within(list).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Tripped', 'Selected', 'Flow direction', 'Area']);
  });

  it('stacks vertically on request', () => {
    render(<SceneLegend orientation="vertical" items={[{ kind: 'selection', label: 'Selected' }]} />);

    expect(screen.getByRole('list')).toHaveClass('flex-col');
  });
});
