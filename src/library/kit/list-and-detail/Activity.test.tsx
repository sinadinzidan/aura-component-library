import { render, screen } from '@testing-library/react';

import { Activity } from './Activity';

describe(Activity.name, () => {
  it('lists events in the given order with actor, time and note', () => {
    render(
      <Activity
        label="Work order history"
        items={[
          { id: 'a', title: 'Bearing opened', actor: 'Tomás Barros', time: '13:58', body: 'Pads show scoring.', tone: 'warning' },
          { id: 'b', title: 'Work order created', time: '13:50' },
        ]}
      />
    );

    const items = screen.getAllByRole('listitem');
    expect(screen.getByRole('list', { name: 'Work order history' })).toBeInTheDocument();
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Bearing opened');
    expect(items[0]).toHaveTextContent('Tomás Barros');
    expect(items[0]).toHaveTextContent('Pads show scoring.');
    expect(items[0]).toHaveAttribute('data-tone', 'warning');
    expect(items[1]).toHaveAttribute('data-tone', 'neutral');
    expect(items[1]).toHaveTextContent('13:50');
  });
});
