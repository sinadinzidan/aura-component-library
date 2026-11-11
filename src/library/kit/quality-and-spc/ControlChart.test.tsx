import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ControlChart } from './ControlChart';

const VALUES = [10, 10.2, 13.1, 9.9, 10.1];
const LABELS = ['S1', 'S2', 'S3', 'S4', 'S5'];

describe(ControlChart.name, () => {
  it('labels the centre line and control limits and numbers the point that breaks a rule', () => {
    const { container } = render(<ControlChart label="Water dew point, X-bar" values={VALUES} labels={LABELS} center={10} ucl={12} lcl={8} decimals={1} />);

    expect(screen.getByRole('img', { name: 'Water dew point, X-bar' })).toBeInTheDocument();
    expect(screen.getByText('UCL 12.0')).toBeInTheDocument();
    expect(screen.getByText('CL 10.0')).toBeInTheDocument();
    expect(screen.getByText('LCL 8.0')).toBeInTheDocument();
    const flagged = container.querySelectorAll('[data-flag]');
    expect(flagged).toHaveLength(1);
    expect(flagged[0]).toHaveAttribute('data-tone', 'critical');
    expect(flagged[0]).toHaveTextContent('1');
  });

  it('draws specification limits apart from the control limits', () => {
    const { container } = render(<ControlChart label="Dew point" values={VALUES} labels={LABELS} center={10} ucl={12} lcl={8} spec={{ usl: 14 }} decimals={1} zones />);

    expect(screen.getByText('USL 14.0')).toBeInTheDocument();
    expect(container.querySelector('[data-line="usl"]')).toHaveAttribute('data-tone', 'critical');
    expect(container.querySelectorAll('[data-zone]')).toHaveLength(2);
    expect(screen.getByText('Specification')).toBeInTheDocument();
  });

  it('makes flagged points selectable', async () => {
    const onSelect = vi.fn();
    render(<ControlChart label="Dew point" values={VALUES} labels={LABELS} center={10} ucl={12} lcl={8} decimals={1} unit="°C" onSelect={onSelect} selected={2} />);

    const point = screen.getByRole('button', { name: 'S3: 13.1 °C, rule 1, beyond a control limit' });
    expect(point).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(point);

    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
