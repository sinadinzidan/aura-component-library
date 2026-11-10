import { render, screen, within } from '@testing-library/react';

import { BrowserFrame } from './BrowserFrame';

describe(BrowserFrame.name, () => {
  it('names the frame for assistive technology', () => {
    render(
      <BrowserFrame address="fusion.cognite.test/nordkapp" label="Preview of the plant overview">
        <p>Content</p>
      </BrowserFrame>
    );

    expect(screen.getByRole('group', { name: 'Preview of the plant overview' })).toBeInTheDocument();
  });

  it('shows the address in the bar and hides the chrome from assistive technology', () => {
    render(
      <BrowserFrame address="fusion.cognite.test/nordkapp" label="Preview">
        <p>Content</p>
      </BrowserFrame>
    );

    const address = screen.getByText('fusion.cognite.test/nordkapp');
    expect(address.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('renders its children inside the frame', () => {
    render(
      <BrowserFrame address="fusion.cognite.test" label="Preview">
        <button type="button">Open trend</button>
      </BrowserFrame>
    );

    expect(within(screen.getByRole('group')).getByRole('button', { name: 'Open trend' })).toBeInTheDocument();
  });
});
