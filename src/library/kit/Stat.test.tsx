import { render, screen, within } from '@testing-library/react';

import { Stat } from './Stat';

describe(Stat.name, () => {
  it('groups a formatted value and unit under its label', () => {
    render(<Stat label="Gas export" value={4.38} decimals={2} unit="MSm³/d" />);

    const stat = screen.getByRole('group', { name: 'Gas export' });
    expect(within(stat).getByText('4.38')).toBeInTheDocument();
    expect(within(stat).getByText('MSm³/d')).toBeInTheDocument();
  });

  it('shows a string value as given', () => {
    render(<Stat label="Peak hour" value="13:00" />);

    expect(screen.getByText('13:00')).toBeInTheDocument();
  });

  it('shows the change with its caption and the target', () => {
    render(<Stat label="Availability" value={96.4} decimals={1} delta={{ value: -0.7, caption: 'vs last week' }} target="Target 97.5" />);

    expect(screen.getByText(/−0\.7/)).toBeInTheDocument();
    expect(screen.getByText('vs last week')).toBeInTheDocument();
    expect(screen.getByText('Target 97.5')).toBeInTheDocument();
  });

  it('names its sparkline after the label', () => {
    render(<Stat label="Availability" value={96.4} sparkline={[1, 2, 3]} />);

    expect(screen.getByRole('img', { name: 'Availability trend' })).toBeInTheDocument();
  });

  it('carries the state word', () => {
    render(<Stat label="Gas compression" value={78} state="Watch" tone="warning" />);

    expect(screen.getByText('Watch')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Gas compression' })).toHaveAttribute('data-tone', 'warning');
  });

  it('exposes size and variant for the look', () => {
    render(<Stat label="OEE" value={82.7} size="hero" variant="plain" />);

    const stat = screen.getByRole('group', { name: 'OEE' });
    expect(stat).toHaveAttribute('data-size', 'hero');
    expect(stat).toHaveAttribute('data-variant', 'plain');
  });

  it('renders the state icon at every size', () => {
    render(<Stat label="Recompressor" value="23-KA-9103" size="sm" state="Tripped" stateIcon={<svg data-testid="state-icon" />} />);

    expect(screen.getByTestId('state-icon')).toBeInTheDocument();
  });
});
