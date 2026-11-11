import { render, screen } from '@testing-library/react';

import { HeatStrip } from './HeatStrip';

describe(HeatStrip.name, () => {
  it('is an image named by its label', () => {
    render(<HeatStrip label="Alarms per hour" rows={[{ label: 'Compression', values: [0, 2, 4] }]} />);

    expect(screen.getByRole('img', { name: 'Alarms per hour' })).toBeInTheDocument();
  });

  it('scales each cell against the largest value', () => {
    const { container } = render(<HeatStrip label="Alarms" rows={[{ label: 'Compression', values: [0, 2, 4] }]} />);

    const levels = [...container.querySelectorAll<HTMLElement>('.kit-heat-cell')].map((cell) => cell.style.getPropertyValue('--kit-heat-level'));
    expect(levels).toEqual(['0%', '50%', '100%']);
  });

  it('shows row labels and axis captions', () => {
    render(<HeatStrip label="Alarms" rows={[{ label: 'Compression', values: [1] }]} axis={['24 h ago', 'Now']} />);

    expect(screen.getByText('Compression')).toBeInTheDocument();
    expect(screen.getByText('24 h ago')).toBeInTheDocument();
    expect(screen.getByText('Now')).toBeInTheDocument();
  });
});
