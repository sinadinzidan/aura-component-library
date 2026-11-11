import { fireEvent, render, screen } from '@testing-library/react';

import { StatusStrip, type StatusStripItem } from './StatusStrip';

const ITEMS: StatusStripItem[] = [
  { id: 'a', label: '1st stage compressor', state: 'Running', tone: 'success', detail: '23-KA-9101' },
  { id: 'b', label: 'Recompressor', state: 'Tripped', tone: 'critical' },
];

describe(StatusStrip.name, () => {
  it('writes the state of every unit as a word', () => {
    render(<StatusStrip label="Unit states" items={ITEMS} />);

    const strip = screen.getByRole('group', { name: 'Unit states' });
    expect(strip).toHaveTextContent('Running');
    expect(strip).toHaveTextContent('Tripped');
    expect(strip).toHaveTextContent('23-KA-9101');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('turns cells into toggle buttons and reports the selection', () => {
    const onSelect = vi.fn();
    render(<StatusStrip label="Unit states" items={ITEMS} selectedId="a" onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: /Running/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /Tripped/ }));

    expect(onSelect).toHaveBeenCalledWith('b');
  });
});
