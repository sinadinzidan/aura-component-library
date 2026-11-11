import { render } from '@testing-library/react';

import { Placeholder } from './Placeholder';

describe(Placeholder.name, () => {
  it('is hidden from assistive technology and takes its size from the caller', () => {
    const { container } = render(<Placeholder className="w-40" />);
    const bar = container.firstElementChild;

    expect(bar).toHaveAttribute('aria-hidden', 'true');
    expect(bar).toHaveClass('w-40');
    expect(bar).toHaveAttribute('data-shape', 'line');
  });

  it('draws a circle for avatars and gauges', () => {
    const { container } = render(<Placeholder shape="circle" className="size-10" />);

    expect(container.firstElementChild).toHaveClass('rounded-full');
  });
});
