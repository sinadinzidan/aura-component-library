import { render, screen } from '@testing-library/react';

import { ControlChart } from './ControlChart';
import type { SpcLimits } from './spc';

const LIMITS: SpcLimits = { mean: 10, sigma: 1, ucl: 13, lcl: 7 };
const VALUES = [10.2, 9.6, 10.4, 13.6, 11.4];
const LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

describe(ControlChart.name, () => {
  it('names the chart and writes the control limits beside the plot', () => {
    render(<ControlChart label="Wobbe index, last five results" values={VALUES} labels={LABELS} limits={LIMITS} unit="MJ" />);

    expect(screen.getByRole('img', { name: 'Wobbe index, last five results' })).toBeInTheDocument();
    expect(screen.getByText('UCL 13.0')).toBeInTheDocument();
    expect(screen.getByText('LCL 7.0')).toBeInTheDocument();
    expect(screen.getByText('Centre 10.0')).toBeInTheDocument();
  });

  it('marks a result that breaks a run rule with the number of the rule', () => {
    const { container } = render(<ControlChart label="Chart" values={VALUES} labels={LABELS} limits={LIMITS} violations={[{ index: 3, rule: 1 }]} />);

    const marks = container.querySelectorAll('[data-rule]');
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveTextContent('1');
    expect(marks[0]).toHaveAttribute('title', 'One result beyond three sigma: 13.6');
  });

  it('calls out the latest result with its unit', () => {
    const { container } = render(<ControlChart label="Chart" values={VALUES} labels={LABELS} limits={LIMITS} unit="MJ" />);

    expect(container.querySelector('[data-current]')).toHaveTextContent('11.4 MJ');
  });

  it('draws a specification limit that is close to the control limits and skips one far away', () => {
    render(<ControlChart label="Chart" values={VALUES} labels={LABELS} limits={LIMITS} spec={{ lsl: -40, usl: 14.5 }} />);

    expect(screen.getByText('Upper spec 14.5')).toBeInTheDocument();
    expect(screen.queryByText(/Lower spec/)).not.toBeInTheDocument();
  });

  it('shades eight zones, or none when zones are off', () => {
    const { container, rerender } = render(<ControlChart label="Chart" values={VALUES} labels={LABELS} limits={LIMITS} />);
    expect(container.querySelectorAll('[data-zone]')).toHaveLength(8);

    rerender(<ControlChart label="Chart" values={VALUES} labels={LABELS} limits={LIMITS} zones={false} />);
    expect(container.querySelectorAll('[data-zone]')).toHaveLength(0);
  });

  it('labels every nth result on the x axis, always including the latest', () => {
    render(<ControlChart label="Chart" values={VALUES} labels={LABELS} limits={LIMITS} labelEvery={2} />);

    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.queryByText('Thu')).not.toBeInTheDocument();
  });

  it('drops gutters, labels and rule numbers when compact', () => {
    const { container } = render(<ControlChart label="Chart" values={VALUES} labels={LABELS} limits={LIMITS} violations={[{ index: 3, rule: 1 }]} compact />);

    expect(screen.queryByText(/UCL/)).not.toBeInTheDocument();
    expect(container.querySelector('[data-rule]')).toHaveTextContent('');
  });
});
