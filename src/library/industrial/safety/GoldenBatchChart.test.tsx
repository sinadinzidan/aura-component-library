import { render, screen, within } from '@testing-library/react';

import { GoldenBatchChart } from './GoldenBatchChart';
import type { AlignedPoint, BatchPhase, BatchPoint } from './goldenBatch';

const PHASES: BatchPhase[] = [
  { id: 'heat', label: 'Heat', start: 0, end: 40 },
  { id: 'react', label: 'React', start: 40, end: 100 },
];

const GOLDEN: BatchPoint[] = [
  { t: 0, v: 20 },
  { t: 40, v: 80 },
  { t: 100, v: 80 },
];

const point = (t: number, v: number, phaseId: string): AlignedPoint => ({ t, v, phaseId, original: t });

const ON_PROFILE = [point(0, 20, 'heat'), point(20, 50, 'heat'), point(40, 80, 'react'), point(60, 80.5, 'react')];
const WITH_EXCURSION = [point(0, 20, 'heat'), point(40, 80, 'react'), point(50, 85, 'react'), point(60, 86, 'react'), point(70, 80, 'react')];

const LABEL = 'Reactor temperature against the golden batch';

describe(GoldenBatchChart.name, () => {
  it('names the plot and states the conformance in the name', () => {
    render(<GoldenBatchChart label={LABEL} golden={GOLDEN} current={ON_PROFILE} goldenPhases={PHASES} tolerance={2} unit="°C" />);

    expect(screen.getByRole('img', { name: /Reactor temperature against the golden batch\. 100% of samples within ±2\.0 °C/ })).toBeInTheDocument();
  });

  it('draws the golden line, the tolerance band and the current line', () => {
    const { container } = render(<GoldenBatchChart label={LABEL} golden={GOLDEN} current={ON_PROFILE} goldenPhases={PHASES} tolerance={2} />);

    expect(container.querySelector('[data-slot="golden-line"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="tolerance-band"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="current-line"]')).toBeInTheDocument();
  });

  it('shades no excursion for a batch that stays inside the band', () => {
    const { container } = render(<GoldenBatchChart label={LABEL} golden={GOLDEN} current={ON_PROFILE} goldenPhases={PHASES} tolerance={2} />);

    expect(container.querySelectorAll('[data-slot="excursion"]')).toHaveLength(0);
    expect(screen.queryByText('Outside tolerance')).not.toBeInTheDocument();
  });

  it('shades and redraws every excursion, and adds it to the key', () => {
    const { container } = render(<GoldenBatchChart label={LABEL} golden={GOLDEN} current={WITH_EXCURSION} goldenPhases={PHASES} tolerance={2} />);

    expect(container.querySelectorAll('[data-slot="excursion"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-slot="excursion-line"]')).toHaveLength(1);
    expect(within(screen.getByRole('list', { name: 'Key' })).getByText('Outside tolerance')).toBeVisible();
  });

  it('describes each excursion in words: phase, peak and when', () => {
    const { container } = render(<GoldenBatchChart label={LABEL} golden={GOLDEN} current={WITH_EXCURSION} goldenPhases={PHASES} tolerance={2} unit="°C" />);

    expect(container.querySelector('[data-slot="golden-batch-summary"]')).toHaveTextContent('60% of samples within ±2.0 °C. 1 excursion: React +6.0 °C at 50–60 min.');
  });

  it('prints the phase names and one boundary between each pair', () => {
    const { container } = render(<GoldenBatchChart label={LABEL} golden={GOLDEN} current={ON_PROFILE} goldenPhases={PHASES} tolerance={2} />);

    expect(screen.getByText('Heat')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="phase-boundary"]')).toHaveLength(1);
  });

  it('says so when the current batch has no data', () => {
    const { container } = render(<GoldenBatchChart label={LABEL} golden={GOLDEN} current={[]} goldenPhases={PHASES} tolerance={2} />);

    expect(container.querySelector('[data-slot="golden-batch-summary"]')).toHaveTextContent('No data for the current batch yet.');
    expect(container.querySelector('[data-slot="current-line"]')).not.toBeInTheDocument();
  });

  it('states the tolerance in the key', () => {
    render(<GoldenBatchChart label={LABEL} golden={GOLDEN} current={ON_PROFILE} goldenPhases={PHASES} tolerance={2.5} unit="°C" />);

    expect(within(screen.getByRole('list', { name: 'Key' })).getByText(/Tolerance ±2\.5 °C/)).toBeVisible();
  });
});
