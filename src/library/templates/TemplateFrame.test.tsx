import { render, screen } from '@testing-library/react';

import { TemplateFrame } from './TemplateFrame';

describe(TemplateFrame.name, () => {
  it('names the frame after the title and renders the page inside', () => {
    render(
      <TemplateFrame title="Work orders">
        <h1>Work orders</h1>
      </TemplateFrame>
    );

    const frame = screen.getByRole('group', { name: 'Work orders template' });
    expect(frame).toContainElement(screen.getByRole('heading', { name: 'Work orders' }));
  });

  it('uses the given label instead of the default name', () => {
    render(
      <TemplateFrame title="Work orders" label="List page layout">
        Page
      </TemplateFrame>
    );

    expect(screen.getByRole('group', { name: 'List page layout' })).toBeInTheDocument();
  });

  it('shows the address in the title strip', () => {
    render(
      <TemplateFrame title="Work orders" address="/maintain/work-orders">
        Page
      </TemplateFrame>
    );

    expect(screen.getByText('/maintain/work-orders')).toBeInTheDocument();
  });

  it('gives the viewport a fixed height that scrolls and can be focused', () => {
    render(
      <TemplateFrame title="Work orders" height="md">
        Page
      </TemplateFrame>
    );

    const viewport = screen.getByText('Page');
    expect(viewport).toHaveClass('h-128', 'overflow-y-auto');
    expect(viewport).toHaveAttribute('tabindex', '0');
  });

  it('narrows the window for a mobile layout', () => {
    render(
      <TemplateFrame title="Rounds" width="mobile">
        Page
      </TemplateFrame>
    );

    expect(screen.getByRole('group', { name: 'Rounds template' })).toHaveClass('max-w-sm');
  });
});
