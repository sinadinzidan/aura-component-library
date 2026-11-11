import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TrainSchematic, type TrainStage } from './TrainSchematic';

const STAGES: TrainStage[] = [
  { id: 'turbine', label: 'Gas turbine' },
  { id: 'gearbox', label: 'Gearbox' },
  { id: 'lp', label: '1st stage compressor', tone: 'warning' },
  { id: 'hp', label: '2nd stage compressor', tone: 'success' },
];

describe(TrainSchematic.name, () => {
  it('names the drawing and offers a button per stage', () => {
    render(<TrainSchematic label="Compressor train A" stages={STAGES} />);

    expect(screen.getByRole('group', { name: 'Compressor train A' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(screen.getByRole('button', { name: '1st stage compressor' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('marks the selected stage and reports selection', async () => {
    const onSelect = vi.fn();
    render(<TrainSchematic label="Train" stages={STAGES} selectedId="lp" onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: '1st stage compressor' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Gearbox' }));
    expect(onSelect).toHaveBeenCalledWith('gearbox');
  });

  it('pins readouts with their value and state word', () => {
    render(
      <TrainSchematic
        label="Train"
        stages={STAGES}
        readouts={[{ id: 'vib', label: 'Drive-end vibration', value: '6.8 mm/s', at: [392, 266], chip: [470, 368], tone: 'warning', state: 'Near limit' }]}
      />
    );

    expect(screen.getByText('Drive-end vibration')).toBeInTheDocument();
    expect(screen.getByText('6.8 mm/s')).toBeInTheDocument();
    expect(screen.getByText('Near limit')).toBeInTheDocument();
  });

  it('can hide the stage names', () => {
    render(<TrainSchematic label="Train" stages={STAGES} hideNames />);

    expect(screen.queryByText('Gearbox')).toBeNull();
    expect(screen.getByRole('button', { name: 'Gearbox' })).toBeInTheDocument();
  });
});
