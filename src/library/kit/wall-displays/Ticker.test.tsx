import { render, screen } from '@testing-library/react';

import { Ticker } from './Ticker';

describe(Ticker.name, () => {
  it('lists whole messages with their kind and the refresh time', () => {
    render(<Ticker label="Site messages" items={[{ id: 'a', kind: 'Safety', text: 'Crane lift at 15:00', tone: 'warning' }]} trailing="Updated 14:00" />);

    expect(screen.getByRole('list', { name: 'Site messages' })).toHaveTextContent('SafetyCrane lift at 15:00');
    expect(screen.getByText('Safety')).toHaveAttribute('data-tone', 'warning');
    expect(screen.getByText('Updated 14:00')).toBeInTheDocument();
  });
});
