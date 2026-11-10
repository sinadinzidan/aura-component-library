import { render, screen } from '@testing-library/react';

import { LabelledProgress } from './LabelledProgress';

describe(LabelledProgress.name, () => {
  it('names the progress bar after its label', () => {
    render(<LabelledProgress label="Uploading drawings" value={40} />);

    expect(screen.getByRole('progressbar', { name: 'Uploading drawings' })).toBeInTheDocument();
  });

  it('shows a rounded percentage by default', () => {
    render(<LabelledProgress label="Backfill" value={1} max={3} />);

    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('shows and announces custom value text instead of the percentage', () => {
    render(<LabelledProgress label="Uploading drawings" value={128} max={340} valueText="128 of 340 files" />);

    expect(screen.getByText('128 of 340 files')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '128 of 340 files');
  });

  it('clamps values outside the range', () => {
    render(<LabelledProgress label="Backfill" value={140} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders the hint under the bar', () => {
    render(<LabelledProgress label="Backfill" value={40} hint="About 4 min left" />);

    expect(screen.getByText('About 4 min left')).toBeInTheDocument();
  });
});
