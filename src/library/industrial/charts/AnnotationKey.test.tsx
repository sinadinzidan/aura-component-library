import { render, screen } from '@testing-library/react';

import { AnnotationKey } from './AnnotationKey';

describe(AnnotationKey.name, () => {
  it('lists each annotation under an accessible name', () => {
    render(
      <AnnotationKey
        label="Chart annotations"
        items={[
          { kind: 'limit', label: 'High limit', tone: 'warning' },
          { kind: 'region', label: 'Maintenance window' },
        ]}
      />
    );

    const list = screen.getByRole('list', { name: 'Chart annotations' });
    expect(list).toHaveTextContent('High limit');
    expect(list).toHaveTextContent('Maintenance window');
  });

  it('draws each kind with its own glyph in its tone', () => {
    const { container } = render(
      <AnnotationKey
        items={[
          { kind: 'limit', label: 'Trip limit', tone: 'critical' },
          { kind: 'event', label: 'Alarm raised', tone: 'warning' },
          { kind: 'region', label: 'Shutdown', tone: 'info' },
          { kind: 'marker', label: 'Note' },
          { kind: 'cursor', label: 'Cursor' },
        ]}
      />
    );

    expect(container.querySelector('[data-kind="limit"]')).toHaveClass('border-dashed', 'border-chart-critical-450');
    expect(container.querySelector('[data-kind="event"]')).toHaveClass('border-dotted', 'border-chart-warning-450');
    expect(container.querySelector('[data-kind="region"]')).toHaveClass('bg-chart-info-100');
    expect(container.querySelector('[data-kind="marker"]')).toHaveClass('rounded-full', 'bg-chart-neutral-450');
    expect(container.querySelector('[data-kind="cursor"]')).not.toHaveClass('border-dashed');
  });
});
