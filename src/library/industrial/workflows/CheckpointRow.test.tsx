import { render, screen } from '@testing-library/react';

import { CheckpointRow } from './CheckpointRow';

describe(CheckpointRow.name, () => {
  it('shows the checkpoint, its tag and the result in words', () => {
    render(<CheckpointRow name="Lube oil level" tag="23-KA-9101" result="pass" />);
    expect(screen.getByText('Lube oil level')).toBeInTheDocument();
    expect(screen.getByText('23-KA-9101')).toBeInTheDocument();
    expect(screen.getByText('Pass')).toBeInTheDocument();
  });

  it.each([
    ['fail', 'Fail'],
    ['skip', 'Skipped'],
    ['pending', 'Not checked'],
  ] as const)('names the %s result', (result, word) => {
    render(<CheckpointRow name="Seal gas filter" result={result} />);
    expect(screen.getByText(word)).toBeInTheDocument();
  });

  it('numbers a checkpoint that has not been checked', () => {
    render(<CheckpointRow index={4} name="Seal gas filter" result="pending" />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('shows a reading with its limits', () => {
    render(<CheckpointRow name="Bearing temperature" result="pass" reading={{ value: 61.2, unit: '°C', decimals: 1, low: 20, high: 75 }} />);
    expect(screen.getByText('61.2')).toBeInTheDocument();
    expect(screen.getByText('Limits 20–75 °C')).toBeInTheDocument();
  });

  it('warns when the reading is outside its limits', () => {
    render(<CheckpointRow name="Filter differential" result="fail" reading={{ value: 1.4, unit: 'bar', decimals: 1, high: 1 }} />);
    expect(screen.getByText('Outside · Max 1 bar')).toBeInTheDocument();
  });

  it('shows a note and trailing content', () => {
    render(<CheckpointRow name="Drain valve" result="skip" note="Scaffolding blocks access" trailing={<span>2 photos</span>} />);
    expect(screen.getByText('Scaffolding blocks access')).toBeInTheDocument();
    expect(screen.getByText('2 photos')).toBeInTheDocument();
  });
});
