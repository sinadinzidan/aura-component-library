import { render, screen } from '@testing-library/react';

import { Spectrum } from './Spectrum';

const BINS = [0.2, 0.4, 4, 0.4, 0.2, 1.5, 0.2, 0.1, 0.1];

describe(Spectrum.name, () => {
  it('is an image named by its label', () => {
    render(<Spectrum label="Velocity spectrum, drive-end bearing" bins={BINS} maxFrequency={800} />);

    expect(screen.getByRole('img', { name: 'Velocity spectrum, drive-end bearing' })).toBeInTheDocument();
  });

  it('names peaks with the amplitude at their frequency', () => {
    render(<Spectrum label="Spectrum" bins={BINS} maxFrequency={800} peaks={[{ frequency: 200, label: '1×' }, { frequency: 500, label: 'Blade pass' }]} />);

    expect(screen.getByText('1×').nextSibling).toHaveTextContent('4.0');
    expect(screen.getByText('Blade pass').nextSibling).toHaveTextContent('1.5');
  });

  it('writes the limit with its unit', () => {
    render(<Spectrum label="Spectrum" bins={BINS} maxFrequency={800} limit={{ value: 7.1, label: 'Alarm' }} />);

    expect(screen.getByText('Alarm 7.1 mm/s')).toBeInTheDocument();
  });

  it('ends the frequency axis with the unit', () => {
    render(<Spectrum label="Spectrum" bins={BINS} maxFrequency={800} />);

    expect(screen.getByText('800 Hz')).toBeInTheDocument();
  });
});
