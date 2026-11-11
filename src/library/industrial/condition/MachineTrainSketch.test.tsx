import { fireEvent, render, screen } from '@testing-library/react';

import { MachineTrainSketch } from './MachineTrainSketch';

const points = [
  { id: 'm1', code: '1H', name: 'Motor drive end, horizontal', x: 70, y: 90, tone: 'neutral' as const, status: 'Good' },
  { id: 'p1', code: '3V', name: 'Pump drive end, vertical', x: 260, y: 70, tone: 'warning' as const, status: 'Above alert' },
];

describe(MachineTrainSketch.name, () => {
  it('draws the machine with an accessible name', () => {
    render(<MachineTrainSketch label="Pump train" points={points} />);

    expect(screen.getByRole('img', { name: 'Pump train' })).toBeInTheDocument();
  });

  it('makes points buttons that report their selection', () => {
    const onSelect = vi.fn();
    render(<MachineTrainSketch label="Pump train" points={points} onSelect={onSelect} selectedId="m1" />);

    expect(screen.getByRole('button', { name: '1H, Motor drive end, horizontal, Good' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /3V/ }));
    expect(onSelect).toHaveBeenCalledWith('p1');
  });

  it('selects from the keyboard', () => {
    const onSelect = vi.fn();
    render(<MachineTrainSketch label="Pump train" points={points} onSelect={onSelect} />);

    fireEvent.keyDown(screen.getByRole('button', { name: /1H/ }), { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('m1');
  });

  it('says the state of an abnormal point in its name', () => {
    render(<MachineTrainSketch label="Pump train" points={points} onSelect={() => undefined} />);

    expect(screen.getByRole('button', { name: /Above alert/ })).toBeInTheDocument();
  });
});
