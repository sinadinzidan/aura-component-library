import { render, screen } from '@testing-library/react';

import { TaktIndicator } from './TaktIndicator';

describe(TaktIndicator.name, () => {
  it('describes cycle time against takt', () => {
    render(<TaktIndicator cycleTime={41.5} takt={45} />);

    expect(screen.getByRole('img')).toHaveAccessibleName('Cycle time: 41.5 s against a takt of 45.0 s, under takt');
    expect(screen.getByText('Takt 45.0 s')).toBeInTheDocument();
  });

  it('says how far over takt a slow station is', () => {
    const { container } = render(<TaktIndicator label="Station 40" cycleTime={48.2} takt={45} />);

    expect(container.querySelector('[data-slot="takt-indicator"]')).toHaveAttribute('data-tone', 'critical');
    expect(screen.getByText('+3.2 s over takt')).toBeInTheDocument();
  });

  it('says how much slack is left under takt', () => {
    render(<TaktIndicator cycleTime={41.5} takt={45} />);

    expect(screen.getByText('−3.5 s to takt')).toBeInTheDocument();
  });

  it('warns when there is no slack', () => {
    const { container } = render(<TaktIndicator cycleTime={44.2} takt={45} />);

    expect(container.querySelector('[data-slot="takt-indicator"]')).toHaveAttribute('data-tone', 'warning');
  });

  it('places the takt tick and sizes the bar on one scale', () => {
    const { container } = render(<TaktIndicator cycleTime={30} takt={45} max={60} />);

    expect(container.querySelector<HTMLElement>('[data-slot="takt-tick"]')?.style.left).toBe('75%');
    expect(container.querySelector<HTMLElement>('[data-slot="takt-fill"]')?.style.width).toBe('50%');
  });

  it('can drop its header for table cells', () => {
    render(<TaktIndicator showHeader={false} cycleTime={41.5} takt={45} />);

    expect(screen.queryByText('Cycle time')).not.toBeInTheDocument();
  });
});
