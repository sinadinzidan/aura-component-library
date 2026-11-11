import { render, screen } from '@testing-library/react';

import { PidLegend } from './PidLegend';

describe(PidLegend.name, () => {
  it('explains lines, symbols and reading states', () => {
    render(<PidLegend />);

    expect(screen.getByRole('heading', { name: 'Lines' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Symbols' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Readings and alarms' })).toBeInTheDocument();
    expect(screen.getByText('Main process line')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Compressor, tripped' })).toBeInTheDocument();
  });

  it('shows only the groups asked for', () => {
    render(<PidLegend groups={['lines']} />);

    expect(screen.getByRole('heading', { name: 'Lines' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Symbols' })).not.toBeInTheDocument();
  });
});
