import { render, screen } from '@testing-library/react';

import { failedAt, stagesAt } from './loadingStages';
import { ModelLoadingCard } from './ModelLoadingCard';

describe(ModelLoadingCard.name, () => {
  it('shows overall progress and what is happening', () => {
    render(<ModelLoadingCard model="Compressor module" stages={stagesAt(1)} activeFraction={0.5} />);

    expect(screen.getByText('Loading Compressor module')).toBeInTheDocument();
    expect(screen.getByText('Fetching geometry, 40 %')).toBeInTheDocument();
  });

  it('marks the active stage as the current step', () => {
    render(<ModelLoadingCard model="Module" stages={stagesAt(2)} />);

    expect(screen.getByText('Building the scene').closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it('says the state of every stage in words', () => {
    render(<ModelLoadingCard model="Module" stages={stagesAt(1)} />);

    expect(screen.getByText(', done')).toBeInTheDocument();
    expect(screen.getByText(', in progress')).toBeInTheDocument();
    expect(screen.getAllByText(', waiting')).toHaveLength(2);
  });

  it('keeps a failed stage in place with its reason', () => {
    render(<ModelLoadingCard model="Module" stages={failedAt(stagesAt(1), 'geometry', 'Connection lost after 12 of 48 files')} />);

    expect(screen.getByText('Connection lost after 12 of 48 files')).toBeInTheDocument();
    expect(screen.getByText('Fetching geometry failed')).toBeInTheDocument();
    expect(screen.getByText(/Nothing was lost/)).toBeInTheDocument();
  });
});
