import { render, screen } from '@testing-library/react';

import { StatusBar } from './StatusBar';

describe(StatusBar.name, () => {
  it('shows items with their values and tones, and end items', () => {
    render(
      <StatusBar
        label="System status"
        items={[
          { id: 'link', label: 'Historian', value: 'Connected', tone: 'success' },
          { id: 'mode', label: 'Read only' },
        ]}
        end={[{ id: 'clock', label: '14:00 UTC' }]}
      />
    );

    const bar = screen.getByRole('contentinfo', { name: 'System status' });
    expect(bar).toHaveTextContent('Historian');
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Historian').parentElement).toHaveAttribute('data-tone', 'success');
    expect(screen.getByText('Read only').parentElement).toHaveAttribute('data-tone', 'neutral');
    expect(screen.getByText('14:00 UTC')).toBeInTheDocument();
  });
});
