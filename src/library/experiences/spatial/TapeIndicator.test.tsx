import { render, screen } from '@testing-library/react';

import { TapeIndicator } from './TapeIndicator';

const LIMITS = { low: 40, high: 52, highHigh: 55 };

describe(TapeIndicator.name, () => {
  it('names the reading and its setpoint', () => {
    render(<TapeIndicator label="Discharge pressure" value={48.6} unit="barg" decimals={1} span={20} majorStep={5} setpoint={48} />);

    expect(screen.getByRole('img', { name: 'Discharge pressure: 48.6 barg, setpoint 48' })).toBeInTheDocument();
  });

  it('prints the value in the window', () => {
    render(<TapeIndicator label="Discharge pressure" value={48.6} decimals={1} span={20} majorStep={5} />);

    expect(screen.getByText('48.6')).toBeInTheDocument();
  });

  it('numbers only the major ticks', () => {
    const { container } = render(<TapeIndicator label="Pressure" value={50} span={20} majorStep={10} minorPerMajor={2} />);

    expect(container.querySelectorAll('[data-slot="tape-tick"]')).toHaveLength(5);
    expect(container.querySelectorAll('[data-slot="tape-tick"][data-major="true"] text')).toHaveLength(3);
  });

  it('judges the value against its limits and says so in words', () => {
    const { container } = render(<TapeIndicator label="Pressure" value={53} span={20} majorStep={5} min={0} max={60} limits={LIMITS} />);

    expect(container.querySelector('[data-slot="tape-indicator"]')).toHaveAttribute('data-tone', 'warning');
    expect(screen.getByText('Outside limits')).toBeInTheDocument();
  });

  it('draws the abnormal zones inside the window as bands', () => {
    const { container } = render(<TapeIndicator label="Pressure" value={50} span={20} majorStep={5} min={0} max={60} limits={LIMITS} />);

    const tones = [...container.querySelectorAll('[data-slot="tape-band"]')].map((band) => band.getAttribute('data-tone'));
    expect(tones).toEqual(['warning', 'warning', 'critical']);
  });

  it('pins the bug when the setpoint is outside the window', () => {
    const { container } = render(<TapeIndicator label="Pressure" value={20} span={10} majorStep={5} setpoint={48} />);

    expect(container.querySelector('[data-slot="tape-bug"]')).toHaveAttribute('data-pinned', 'high');
  });

  it('lays the tape out horizontally on request', () => {
    const { container } = render(<TapeIndicator label="Shaft speed" value={9840} span={2000} majorStep={500} orientation="horizontal" />);

    expect(container.querySelector('[data-slot="tape-indicator"]')).toHaveAttribute('data-orientation', 'horizontal');
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 420 84');
  });
});
