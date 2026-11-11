import { render, screen } from '@testing-library/react';

import { LimitScale } from './LimitScale';

function renderScale() {
  const { container } = render(
    <LimitScale
      label="Discharge temperature limits"
      min={120}
      max={160}
      unit="°C"
      reading={140}
      bands={[{ id: 'normal', from: 130, to: 150, tone: 'success', label: 'Normal operation' }]}
      markers={[
        { id: 'current', value: 145, label: 'Current limit', tone: 'warning', side: 'below' },
        { id: 'proposed', value: 150, label: 'Proposed', tone: 'accent', dashed: true },
        { id: 'far', value: 400, label: 'Off scale', tone: 'critical' },
      ]}
    />
  );
  return container;
}

describe(LimitScale.name, () => {
  it('names itself with every marker and value', () => {
    renderScale();

    expect(screen.getByRole('img', { name: /Discharge temperature limits: Current limit 145 °C, Proposed 150 °C/ })).toBeInTheDocument();
  });

  it('places markers by value and clamps those off the range', () => {
    const container = renderScale();

    expect(container.querySelector<HTMLElement>('[data-marker="current"]')?.style.left).toBe('62.5%');
    expect(container.querySelector<HTMLElement>('[data-marker="proposed"]')?.style.left).toBe('75%');
    expect(container.querySelector<HTMLElement>('[data-marker="far"]')?.style.left).toBe('100%');
  });

  it('draws a proposal dashed and carries the tone', () => {
    const container = renderScale();

    const proposed = container.querySelector('[data-marker="proposed"]');
    expect(proposed).toHaveClass('border-dashed');
    expect(proposed).toHaveAttribute('data-tone', 'accent');
  });

  it('captions the markers, the band and the reading', () => {
    renderScale();

    expect(screen.getByText('Current limit')).toBeInTheDocument();
    expect(screen.getByText('145 °C')).toBeInTheDocument();
    expect(screen.getByText('Normal operation')).toBeInTheDocument();
    expect(screen.getByText('Reading 140 °C')).toBeInTheDocument();
  });
});
