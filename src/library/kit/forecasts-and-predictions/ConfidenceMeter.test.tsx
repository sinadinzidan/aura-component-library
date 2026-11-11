import { render, screen } from '@testing-library/react';

import { ConfidenceMeter } from './ConfidenceMeter';
import { confidenceLevel } from './forecast';

describe(ConfidenceMeter.name, () => {
  it('sorts a score into a level', () => {
    expect(confidenceLevel(86)).toBe('high');
    expect(confidenceLevel(64)).toBe('medium');
    expect(confidenceLevel(41)).toBe('low');
  });

  it('says the level as a word with the score', () => {
    render(<ConfidenceMeter percent={86} />);

    expect(screen.getByRole('img', { name: 'High confidence, 86 %' })).toBeInTheDocument();
    expect(screen.getByText('High confidence')).toBeInTheDocument();
  });

  it('lights as many bars as the level', () => {
    const { container } = render(<ConfidenceMeter percent={41} />);

    expect(container.querySelectorAll('[data-on="true"]')).toHaveLength(1);
  });

  it('adds the reason in the block variant', () => {
    render(<ConfidenceMeter percent={64} variant="block" detail="Nine days of history" />);

    expect(screen.getByText('Nine days of history')).toBeInTheDocument();
  });
});
