import { render, screen } from '@testing-library/react';

import { ControlChart } from './ControlChart';

const LIMITS = { center: 10, ucl: 13, lcl: 7 };

describe(ControlChart.name, () => {
  it('summarises the chart in its accessible name', () => {
    render(<ControlChart label="Wobbe index" values={[10, 11, 9, 10]} limits={LIMITS} unit="MJ/Sm³" />);

    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Wobbe index: 4 points, centre line 10.0 MJ/Sm³, control limits 7.0 to 13.0 MJ/Sm³, no run-rule violations'
    );
  });

  it('prints the limit values in the margin', () => {
    render(<ControlChart label="Wobbe index" values={[10, 11]} limits={LIMITS} centerLabel="X̿" />);

    expect(screen.getByText('UCL 13.0')).toBeInTheDocument();
    expect(screen.getByText('X̿ 10.0')).toBeInTheDocument();
    expect(screen.getByText('LCL 7.0')).toBeInTheDocument();
  });

  it('marks points that break a run rule with the rule number', () => {
    const { container } = render(<ControlChart label="Wobbe index" values={[10, 9, 13.5, 10]} limits={LIMITS} />);

    const violations = container.querySelectorAll('[data-slot="violation"]');
    expect(violations).toHaveLength(1);
    expect(violations[0]).toHaveAttribute('data-rule', '1');
    expect(violations[0]).toHaveTextContent('1');
    expect(container.querySelectorAll('[data-slot="point"]')).toHaveLength(3);
  });

  it('counts the violations in the accessible name', () => {
    render(<ControlChart label="Wobbe index" values={[10, 9, 13.5, 10]} limits={LIMITS} />);

    expect(screen.getByRole('img')).toHaveAccessibleName(/1 run-rule violation$/);
  });

  it('uses the violations it is given instead of computing them', () => {
    const { container } = render(<ControlChart label="Wobbe index" values={[10, 9, 13.5, 10]} limits={LIMITS} violations={[]} />);

    expect(container.querySelectorAll('[data-slot="violation"]')).toHaveLength(0);
  });

  it('draws sigma lines only when asked', () => {
    const { container, rerender } = render(<ControlChart label="Wobbe index" values={[10, 11]} limits={LIMITS} />);
    expect(container.querySelectorAll('[data-slot="sigma-line"]')).toHaveLength(0);

    rerender(<ControlChart label="Wobbe index" values={[10, 11]} limits={LIMITS} showSigmaLines />);
    expect(container.querySelectorAll('[data-slot="sigma-line"]')).toHaveLength(4);
  });

  it('prints the first, middle and last category', () => {
    render(<ControlChart label="Wobbe index" values={[10, 11, 9, 10, 11]} limits={LIMITS} categories={['06:00', '08:00', '10:00', '12:00', '14:00']} />);

    expect(screen.getByText('06:00')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('14:00')).toBeInTheDocument();
    expect(screen.queryByText('08:00')).not.toBeInTheDocument();
  });
});
