import { fireEvent, render, screen } from '@testing-library/react';

import { Pane } from './Pane';
import { renderPanes } from './testUtils';

describe(Pane.name, () => {
  it('is a labelled group sized by its share', () => {
    renderPanes();

    expect(screen.getByRole('group', { name: 'Navigation' })).toHaveStyle({ flexGrow: '30' });
    expect(screen.getByRole('group', { name: 'Content' })).toHaveStyle({ flexGrow: '70' });
  });

  it('hides its content from assistive technology while collapsed', () => {
    renderPanes({ first: { collapsible: true } });

    fireEvent.keyDown(screen.getByRole('separator'), { key: 'Enter' });

    expect(screen.getByText('Asset tree')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Asset tree').parentElement).toHaveAttribute('data-collapsed');
  });

  it('shows the rail content while collapsed', () => {
    renderPanes({ first: { collapsible: true, collapsedSize: 6, collapsedContent: <span>Rail</span> } });
    expect(screen.queryByText('Rail')).not.toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('separator'), { key: 'Enter' });

    expect(screen.getByText('Rail')).toBeInTheDocument();
  });

  it('throws outside a group', () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Pane label="Navigation">Asset tree</Pane>)).toThrow(/ResizablePanes/);
    silence.mockRestore();
  });
});
