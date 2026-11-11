import { render, screen } from '@testing-library/react';

import { TrendArea } from './TrendArea';

describe(TrendArea.name, () => {
  it('renders a named trend', () => {
    render(<TrendArea label="Gas export, last 24 hours" labels={['13:00', '14:00']} series={[{ id: 'export', label: 'Export', values: [4.2, 4.38] }]} />);

    expect(screen.getByRole('img', { name: 'Gas export, last 24 hours' })).toBeInTheDocument();
  });
});
