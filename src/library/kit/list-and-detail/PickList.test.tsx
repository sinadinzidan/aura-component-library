import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PickList } from './PickList';

const ITEMS = [
  { id: 'a', title: 'Recompressor', meta: '23-KA-9103', trailing: 'Tripped', tone: 'critical' as const },
  { id: 'b', title: 'Interstage cooler', meta: '23-HA-9114' },
];

describe(PickList.name, () => {
  it('shows each record and presses the selected one', () => {
    render(<PickList label="Equipment" items={ITEMS} selected="b" />);

    expect(screen.getByRole('list', { name: 'Equipment' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Interstage cooler/ })).toHaveAttribute('aria-pressed', 'true');
    const first = screen.getByRole('button', { name: /Recompressor/ });
    expect(first).toHaveAttribute('aria-pressed', 'false');
    expect(first).toHaveAttribute('data-tone', 'critical');
    expect(first).toHaveTextContent('Tripped');
  });

  it('reports the chosen record', async () => {
    const onSelect = vi.fn();
    render(<PickList label="Equipment" items={ITEMS} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: /Recompressor/ }));

    expect(onSelect).toHaveBeenCalledWith('a');
  });
});
