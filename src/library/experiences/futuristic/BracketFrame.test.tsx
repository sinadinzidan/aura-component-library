import { render, screen } from '@testing-library/react';

import { BracketFrame } from './BracketFrame';

describe(BracketFrame.name, () => {
  it('is a region named by its title', () => {
    render(<BracketFrame title="Alarm queue">Body</BracketFrame>);

    expect(screen.getByRole('region', { name: 'Alarm queue' })).toBeInTheDocument();
  });

  it('draws four decorative corner brackets', () => {
    const { container } = render(<BracketFrame title="Alarm queue">Body</BracketFrame>);

    expect(container.querySelectorAll('section > span[aria-hidden="true"]')).toHaveLength(4);
  });

  it('shows meta text beside the title', () => {
    render(
      <BracketFrame title="Alarm queue" meta="4 open">
        Body
      </BracketFrame>
    );

    expect(screen.getByText('4 open')).toBeInTheDocument();
  });
});
