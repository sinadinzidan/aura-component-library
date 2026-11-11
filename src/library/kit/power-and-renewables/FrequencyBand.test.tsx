import { render, screen } from '@testing-library/react';

import { FrequencyBand } from './FrequencyBand';

describe(FrequencyBand.name, () => {
  it('shows the reading, its deviation and a state word', () => {
    render(<FrequencyBand label="Grid frequency" value={49.97} />);

    expect(screen.getByText('49.97')).toBeInTheDocument();
    expect(screen.getByText(/−\s*30 mHz/)).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('places the pointer on the scale', () => {
    const { container } = render(<FrequencyBand label="Grid frequency" value={50.25} />);

    expect(container.querySelector('[data-slot="frequency-pointer"]')).toHaveStyle({ left: '75%' });
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'critical');
    expect(screen.getByRole('meter', { name: 'Grid frequency' })).toHaveAttribute('aria-valuetext', '50.25 hertz, alert');
  });
});
