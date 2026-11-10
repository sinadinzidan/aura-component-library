import { render, screen } from '@testing-library/react';

import { TornadoBars } from './TornadoBars';

const ITEMS = [
  { id: 'temp', label: 'Suction temperature', low: 10.1, high: 10.5 },
  { id: 'flow', label: 'Flow', low: 9.0, high: 11.4, lowLabel: '160', highLabel: '200 kSm³/h' },
  { id: 'eff', label: 'Efficiency', low: 10.9, high: 9.8 },
];

describe(TornadoBars.name, () => {
  it('sorts inputs by swing, largest first', () => {
    const { container } = render(<TornadoBars label="Shaft power sensitivity" baseline={10.3} items={ITEMS} unit="MW" />);

    const labels = [...container.querySelectorAll('[data-slot="tornado-row"]')].map((row) => row.firstElementChild?.firstChild?.textContent);
    expect(labels).toEqual(['Flow', 'Efficiency', 'Suction temperature']);
  });

  it('names the baseline and the largest driver', () => {
    render(<TornadoBars label="Shaft power sensitivity" baseline={10.3} items={ITEMS} unit="MW" />);

    expect(screen.getByRole('img')).toHaveAccessibleName('Shaft power sensitivity: baseline 10.3 MW; largest swing from Flow, 9.0 to 11.4 MW');
  });

  it('prints both ends of every bar', () => {
    render(<TornadoBars label="Shaft power sensitivity" baseline={10.3} items={ITEMS} unit="MW" />);

    for (const value of ['9.0', '11.4', '9.8', '10.9', '10.1', '10.5']) expect(screen.getByText(value)).toBeInTheDocument();
  });

  it('shows the input range when given', () => {
    render(<TornadoBars label="Shaft power sensitivity" baseline={10.3} items={ITEMS} />);

    expect(screen.getByText('160 to 200 kSm³/h')).toBeInTheDocument();
  });

  it('puts the low-input half on the side its outcome falls', () => {
    const { container } = render(<TornadoBars label="Shaft power sensitivity" baseline={10} items={[{ id: 'eff', label: 'Efficiency', low: 11, high: 9 }]} />);

    const left = (slot: string) => parseFloat(container.querySelector<HTMLElement>(`[data-slot="${slot}"]`)?.style.left ?? '');
    expect(left('tornado-high')).toBeLessThan(left('tornado-baseline'));
    expect(left('tornado-low')).toBeCloseTo(left('tornado-baseline'), 1);
  });

  it('explains the two shades', () => {
    render(<TornadoBars label="Shaft power sensitivity" baseline={10.3} items={ITEMS} unit="MW" />);

    expect(screen.getByText('Input at low end')).toBeInTheDocument();
    expect(screen.getByText('Input at high end')).toBeInTheDocument();
    expect(screen.getByText('Baseline 10.3 MW')).toBeInTheDocument();
  });
});
