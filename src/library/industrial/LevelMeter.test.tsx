import { render, screen } from '@testing-library/react';

import { LevelMeter } from './LevelMeter';

const limits = { low: 30, high: 70, highHigh: 85 };

describe(LevelMeter.name, () => {
  it('names the level with value and range', () => {
    render(<LevelMeter label="Separator level" value={54.3} decimals={1} limits={limits} />);

    expect(screen.getByRole('img', { name: 'Separator level: 54.3\u00a0%, range 0 to 100' })).toBeInTheDocument();
  });

  it('fills the vessel to the value', () => {
    const { container } = render(<LevelMeter label="Separator level" value={54.3} limits={limits} />);

    expect(container.querySelector('[data-slot="level-fill"]')).toHaveStyle({ height: '54.3%' });
  });

  it('labels each limit beside the vessel', () => {
    const { container } = render(<LevelMeter label="Separator level" value={54.3} limits={limits} />);

    expect(container.querySelectorAll('[data-slot="level-limit"]')).toHaveLength(3);
    expect(screen.getByText('HH 85')).toBeInTheDocument();
    expect(screen.getByText('L 30')).toBeInTheDocument();
  });

  it('turns warning above the high limit', () => {
    const { container } = render(<LevelMeter label="Separator level" value={71.2} decimals={1} limits={limits} />);

    expect(container.firstChild).toHaveAttribute('data-tone', 'warning');
    expect(screen.getByText('71.2')).toHaveClass('text-warning-foreground-strong');
  });

  it('hides limits and readout when asked', () => {
    const { container } = render(<LevelMeter label="Separator level" value={50} limits={limits} showLimits={false} showReadout={false} />);

    expect(container.querySelector('[data-slot="level-limit"]')).not.toBeInTheDocument();
    expect(screen.queryByText('Separator level')).not.toBeInTheDocument();
  });

  it('is empty without a value', () => {
    const { container } = render(<LevelMeter label="Sump level" value={null} />);

    expect(container.querySelector('[data-slot="level-fill"]')).toHaveStyle({ height: '0%' });
    expect(screen.getByRole('img', { name: /no data/ })).toBeInTheDocument();
  });
});
