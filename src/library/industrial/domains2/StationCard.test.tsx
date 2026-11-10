import { render, screen } from '@testing-library/react';

import { StationCard } from './StationCard';

describe(StationCard.name, () => {
  it('names the station and its state', () => {
    render(<StationCard code="OP 40" name="Leak test" state="running" cycleTime={43.1} takt={45} count={212} target={220} />);

    expect(screen.getByRole('article', { name: 'Station OP 40, Leak test: running' })).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('shows cycle time against takt', () => {
    render(<StationCard code="OP 40" name="Leak test" state="running" cycleTime={48.2} takt={45} count={212} target={220} />);

    expect(screen.getByText('48.2')).toBeInTheDocument();
    expect(screen.getByText('+3.2 s over takt')).toBeInTheDocument();
  });

  it('says how far behind plan the count is', () => {
    render(<StationCard code="OP 40" name="Leak test" state="running" cycleTime={43.1} takt={45} count={212} target={220} />);

    expect(screen.getByText('8 behind plan')).toBeInTheDocument();
  });

  it('says when the count is ahead of or on plan', () => {
    const { rerender } = render(<StationCard code="OP 40" name="Leak test" state="running" cycleTime={43.1} takt={45} count={226} target={220} />);
    expect(screen.getByText('6 ahead of plan')).toBeInTheDocument();

    rerender(<StationCard code="OP 40" name="Leak test" state="running" cycleTime={43.1} takt={45} count={220} target={220} />);

    expect(screen.getByText('On plan')).toBeInTheDocument();
  });

  it('explains an abnormal state', () => {
    render(<StationCard code="OP 30" name="Press fit" state="blocked" detail="Waiting for OP 40 · 4 min" cycleTime={41} takt={45} count={214} target={220} />);

    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(screen.getByText('Waiting for OP 40 · 4 min')).toBeInTheDocument();
  });
});
