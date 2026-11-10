import { render, screen } from '@testing-library/react';

import { WhyChain } from './WhyChain';
import type { WhyStep } from './WhyChain';

const STEPS: readonly WhyStep[] = [
  { id: '1', question: 'Why did the recompressor trip?', answer: 'Drive-end vibration exceeded 11 mm/s.' },
  { id: '2', question: 'Why did vibration rise?', answer: 'The drive-end bearing lost lubrication.' },
  { id: '3', question: 'Why was lubrication lost?', answer: 'The lube oil filter was blocked.' },
];

describe(WhyChain.name, () => {
  it('lists every question and answer in order', () => {
    render(<WhyChain label="Five whys" steps={STEPS} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[1]).toHaveTextContent('Why did vibration rise?');
    expect(items[1]).toHaveTextContent('The drive-end bearing lost lubrication.');
  });

  it('numbers the steps', () => {
    render(<WhyChain label="Five whys" steps={STEPS} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('marks only the last answer as the root cause', () => {
    render(<WhyChain label="Five whys" steps={STEPS} />);
    expect(screen.getAllByText('Root cause')).toHaveLength(1);
    expect(screen.getAllByRole('listitem')[2]).toHaveTextContent('Root cause');
  });

  it('leaves the mark out while the chain is unfinished', () => {
    render(<WhyChain label="Five whys" steps={STEPS} rootLabel={null} />);
    expect(screen.queryByText('Root cause')).not.toBeInTheDocument();
  });
});
