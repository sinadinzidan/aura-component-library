import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SunburstRings, type SunburstDatum } from './SunburstRings';

describe(SunburstRings.name, () => {
  it('draws one button per node below the root', () => {
    render(<SunburstRings label="Asset tree" root={ROOT} />);

    expect(screen.getByRole('group', { name: 'Asset tree' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Plant' })).not.toBeInTheDocument();
  });

  it('stops at the deepest ring asked for', () => {
    render(<SunburstRings label="Asset tree" root={ROOT} maxDepth={1} />);

    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('reports the picked arc on click and on Enter', async () => {
    const onPick = vi.fn();
    render(<SunburstRings label="Asset tree" root={ROOT} onPick={onPick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Compression, watch' }));
    screen.getByRole('button', { name: 'Pump, tripped' }).focus();
    await userEvent.keyboard('{Enter}');

    expect(onPick.mock.calls).toEqual([['a1'], ['u1']]);
  });

  it('marks the selection and alert arcs', () => {
    const { container } = render(<SunburstRings label="Asset tree" root={ROOT} selectedId="a2" />);

    expect(screen.getByRole('button', { name: 'Export, normal' })).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('[data-arc="u1"]')).toHaveAttribute('data-emphasis', 'alert');
  });

  it('renders the centre content', () => {
    render(<SunburstRings label="Asset tree" root={ROOT} center={<span>Plant, 91</span>} />);

    expect(screen.getByText('Plant, 91')).toBeInTheDocument();
  });
});

const ROOT: SunburstDatum = {
  id: 'root',
  label: 'Plant',
  title: 'Plant',
  tone: 'accent',
  weight: 0,
  children: [
    {
      id: 'a1',
      label: 'Compression',
      title: 'Compression, watch',
      tone: 'purple',
      weight: 0,
      children: [{ id: 'u1', label: 'Pump', title: 'Pump, tripped', tone: 'critical', emphasis: 'alert', weight: 1, children: [] }],
    },
    { id: 'a2', label: 'Export', title: 'Export, normal', tone: 'teal', weight: 1, children: [] },
  ],
};
