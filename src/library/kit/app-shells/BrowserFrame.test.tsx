import { render, screen } from '@testing-library/react';

import { BrowserFrame } from './BrowserFrame';

describe(BrowserFrame.name, () => {
  it('names the window by its address and shows the page', () => {
    render(
      <BrowserFrame url="nordkapp.example.test/alarms" look="studio" tab="Alarms">
        <p>Page</p>
      </BrowserFrame>
    );

    expect(screen.getByRole('group', { name: 'Browser window: nordkapp.example.test/alarms' })).toHaveTextContent('Page');
    expect(screen.getByText('Alarms')).toBeInTheDocument();
  });

  it('draws the page in the given look and keeps a minimum height', () => {
    const { container } = render(
      <BrowserFrame url="nordkapp.example.test" look="console" minHeight={720}>
        <p>Page</p>
      </BrowserFrame>
    );

    expect(container.querySelector('[data-look="console"]')).toHaveTextContent('Page');
    expect(container.querySelector('.shell-browser-body')).toHaveStyle({ minHeight: '720px' });
  });
});
