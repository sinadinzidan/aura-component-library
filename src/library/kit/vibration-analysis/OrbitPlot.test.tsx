import { render, screen } from '@testing-library/react';

import { OrbitPlot } from './OrbitPlot';
import { orbitPoints } from './signal';

describe(OrbitPlot.name, () => {
  it('names the orbit and reports both peak-to-peak spans', () => {
    render(<OrbitPlot label="Shaft orbit" points={orbitPoints({ xAmplitude: 30, yAmplitude: 20, phaseDeg: 90 })} clearance={120} caption="Ellipse" />);

    expect(screen.getByRole('img', { name: 'Shaft orbit' })).toBeInTheDocument();
    expect(screen.getByText('Ellipse')).toBeInTheDocument();
    expect(screen.getByText('X 60 · Y 40 µm pp · clearance 120')).toBeInTheDocument();
  });
});
