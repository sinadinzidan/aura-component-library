import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RadarScope } from './RadarScope';
import type { RadarGroup } from './RadarScope';

const GROUPS: readonly RadarGroup[] = [
  {
    id: 'nk-23',
    label: 'NK-23',
    items: [
      { id: 'ka-1', label: '23-KA-9101', score: 72, description: '23-KA-9101 1st stage compressor, health 72, watch', tone: 'warning' },
      { id: 'ka-3', label: '23-KA-9103', score: 41, description: '23-KA-9103 Recompressor, health 41, tripped', tone: 'critical' },
    ],
  },
  { id: 'nk-27', label: 'NK-27', items: [{ id: 'pa-1', label: '27-PA-2001A', score: 93, description: '27-PA-2001A Export pump A, health 93, running' }] },
];

describe(RadarScope.name, () => {
  it('is a labelled group with one button per item', () => {
    render(<RadarScope groups={GROUPS} label="Equipment health by area" />);

    expect(screen.getByRole('group', { name: 'Equipment health by area' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByRole('button', { name: '23-KA-9103 Recompressor, health 41, tripped' })).toBeInTheDocument();
  });

  it('locks a blip on click', async () => {
    const onLock = vi.fn();
    render(<RadarScope groups={GROUPS} label="Scope" onLock={onLock} />);

    await userEvent.click(screen.getByRole('button', { name: /27-PA-2001A/ }));

    expect(onLock).toHaveBeenCalledWith('pa-1');
  });

  it('locks a blip from the keyboard', async () => {
    const onLock = vi.fn();
    render(<RadarScope groups={GROUPS} label="Scope" onLock={onLock} />);

    screen.getByRole('button', { name: /23-KA-9101/ }).focus();
    await userEvent.keyboard('{Enter}');

    expect(onLock).toHaveBeenCalledWith('ka-1');
  });

  it('marks the locked blip, draws a bearing and moves the reticle onto it', () => {
    const { container } = render(<RadarScope groups={GROUPS} label="Scope" lockedId="ka-3" />);

    expect(screen.getByRole('button', { name: /23-KA-9103/ })).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('[data-slot="radar-bearing"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="reticle"]')).toHaveAttribute('data-locked', 'true');
  });

  it('rests the reticle unlocked at the core when nothing is locked', () => {
    const { container } = render(<RadarScope groups={GROUPS} label="Scope" />);

    expect(container.querySelector('[data-slot="reticle"]')).toHaveAttribute('data-locked', 'false');
    expect(container.querySelector('[data-slot="reticle"]')).toHaveStyle({ transform: 'translate(220px, 220px)' });
    expect(container.querySelector('[data-slot="radar-bearing"]')).not.toBeInTheDocument();
  });

  it('draws the rings, the critical ring and the sweep on request', () => {
    const { container, rerender } = render(<RadarScope groups={GROUPS} label="Scope" criticalBelow={50} />);
    expect(container.querySelectorAll('[data-slot="radar-ring"]')).toHaveLength(3);
    expect(container.querySelector('[data-slot="radar-critical"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="radar-sweep"]')).toBeInTheDocument();

    rerender(<RadarScope groups={GROUPS} label="Scope" sweep={false} />);
    expect(container.querySelector('[data-slot="radar-sweep"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="radar-critical"]')).not.toBeInTheDocument();
  });
});
