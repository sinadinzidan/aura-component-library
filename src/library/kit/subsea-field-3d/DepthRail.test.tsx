import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DepthRail, type DepthStop } from './DepthRail';

const STOPS: DepthStop<'surface' | 'seabed'>[] = [
  { id: 'surface', label: 'Surface', metres: 0, hint: 'Vessel and turret' },
  { id: 'seabed', label: 'Seabed', metres: 480, hint: 'Templates and lines' },
];

describe(DepthRail.name, () => {
  it('lists the stops with their depth and marks the active one', () => {
    render(<DepthRail label="Camera depth" stops={STOPS} value="seabed" onChange={() => undefined} />);
    expect(screen.getByRole('navigation', { name: 'Camera depth' })).toBeTruthy();
    expect(screen.getByText('480 m')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Seabed, 480 metres: Templates and lines' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Surface, 0 metres: Vessel and turret' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('reports the stop that was picked', () => {
    const onChange = vi.fn();
    render(<DepthRail label="Camera depth" stops={STOPS} value="seabed" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Surface/ }));
    expect(onChange).toHaveBeenCalledWith('surface');
  });
});
