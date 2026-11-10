import { render } from '@testing-library/react';

import { TextDiff } from './TextDiff';

describe(TextDiff.name, () => {
  it('strikes removed words and underlines added ones', () => {
    const { container } = render(<TextDiff before="Trip at 55 barg" after="Trip at 53 barg" />);

    expect(container.querySelector('del')).toHaveTextContent('55');
    expect(container.querySelector('ins')).toHaveTextContent('53');
  });

  it('keeps the text readable in order', () => {
    const { container } = render(<TextDiff before="Close the valve" after="Close the valve and lock it" />);

    expect(container.querySelector('p')).toHaveTextContent('Close the valve and lock it');
  });

  it('hides removed words when showing the new text only', () => {
    const { container } = render(<TextDiff before="Trip at 55 barg" after="Trip at 53 barg" show="after" />);

    expect(container.querySelector('del')).toBeNull();
    expect(container.querySelector('p')).toHaveTextContent('Trip at 53 barg');
  });

  it('hides added words when showing the old text only', () => {
    const { container } = render(<TextDiff before="Trip at 55 barg" after="Trip at 53 barg" show="before" />);

    expect(container.querySelector('ins')).toBeNull();
    expect(container.querySelector('del')).toHaveTextContent('55');
    expect(container.querySelector('p')).toHaveTextContent('Trip at 55 barg');
  });

  it('marks nothing when the texts are the same', () => {
    const { container } = render(<TextDiff before="No change" after="No change" label="Changes to step 4" />);

    expect(container.querySelector('del, ins')).toBeNull();
    expect(container.querySelector('p')).toHaveAttribute('aria-label', 'Changes to step 4');
  });
});
