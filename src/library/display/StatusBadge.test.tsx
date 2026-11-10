import { render, screen } from '@testing-library/react';

import { StatusBadge } from './StatusBadge';
import type { Status } from './StatusBadge';

describe(StatusBadge.name, () => {
  it.each<[Status, string, string]>([
    ['running', 'Running', 'bg-success-background'],
    ['done', 'Done', 'bg-success-background'],
    ['tripped', 'Tripped', 'bg-critical-background'],
    ['maintenance', 'Maintenance', 'bg-warning-background'],
    ['waiting', 'Waiting', 'bg-warning-background'],
    ['in-progress', 'In progress', 'bg-info-background'],
    ['planned', 'Planned', 'bg-info-background'],
    ['standby', 'Standby', 'bg-neutral-background'],
    ['open', 'Open', 'bg-neutral-background'],
  ])('maps %s to the label "%s" and its status colour', (status, label, colourClass) => {
    render(<StatusBadge status={status} />);

    expect(screen.getByText(label)).toHaveClass(colourClass);
  });

  it('shows an icon by default so status does not rely on colour', () => {
    render(<StatusBadge status="tripped" />);

    expect(screen.getByText('Tripped').querySelector('svg')).not.toBeNull();
  });

  it('can hide the icon', () => {
    render(<StatusBadge status="tripped" showIcon={false} />);

    expect(screen.getByText('Tripped').querySelector('svg')).toBeNull();
  });

  it('uses a custom label when one is given', () => {
    render(<StatusBadge status="in-progress" label="Under arbeid" />);

    expect(screen.getByText('Under arbeid')).toBeInTheDocument();
    expect(screen.queryByText('In progress')).not.toBeInTheDocument();
  });

  it('drops the fill when outlined', () => {
    render(<StatusBadge status="running" outline />);

    expect(screen.getByText('Running')).toHaveClass('bg-transparent', 'border-default');
  });
});
