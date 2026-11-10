import { render, screen, within } from '@testing-library/react';

import { WorkspaceLayout } from './WorkspaceLayout';

describe(WorkspaceLayout.name, () => {
  it('is a named region with the thread in its own named section', () => {
    render(<WorkspaceLayout label="Plant assistant" thread={<p>Thread</p>} />);

    const workspace = screen.getByRole('region', { name: 'Plant assistant' });
    expect(within(workspace).getByRole('region', { name: 'Conversation' })).toHaveTextContent('Thread');
  });

  it('centres the thread at a reading width when it has the page to itself', () => {
    const { container } = render(<WorkspaceLayout label="Plant assistant" thread="Thread" />);

    expect(container.querySelector('[data-slot="workspace-thread"]')).toHaveAttribute('data-width', 'reading');
    expect(container.querySelector('[data-slot="workspace-canvas"]')).toBeNull();
  });

  it('turns the thread into a fixed column beside a canvas', () => {
    const { container } = render(<WorkspaceLayout label="Plant assistant" thread="Thread" canvas={<p>Chart</p>} canvasLabel="Trend" />);

    expect(container.querySelector('[data-slot="workspace-thread"]')).toHaveAttribute('data-width', 'column');
    expect(screen.getByRole('region', { name: 'Trend' })).toHaveTextContent('Chart');
  });

  it('lets the caller override the thread width', () => {
    const { container } = render(<WorkspaceLayout label="Plant assistant" thread="Thread" threadWidth="fill" />);

    expect(container.querySelector('[data-slot="workspace-thread"]')).toHaveAttribute('data-width', 'fill');
  });

  it('moves the thread to the right of the canvas when asked', () => {
    const { container } = render(<WorkspaceLayout label="Plant assistant" thread="Thread" canvas="Chart" threadSide="right" />);

    expect(container.querySelector('[data-slot="workspace-thread"]')).toHaveClass('order-2');
    expect(container.querySelector('[data-slot="workspace-canvas"]')).toHaveClass('order-1');
  });

  it('renders header, sidebar, composer and rail in named slots', () => {
    const { container } = render(
      <WorkspaceLayout
        label="Plant assistant"
        header={<span>Recompressor trip</span>}
        sidebar={<a href="#c1">Yesterday</a>}
        thread="Thread"
        composer={<input aria-label="Message" />}
        rail={<p>4 sources</p>}
      />
    );

    expect(within(screen.getByRole('banner')).getByText('Recompressor trip')).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: 'Conversations' })).getByRole('link', { name: 'Yesterday' })).toBeInTheDocument();
    expect(within(screen.getByRole('complementary', { name: 'Sources' })).getByText('4 sources')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="workspace-composer"]')).toContainElement(screen.getByLabelText('Message'));
  });

  it('leaves out the slots that are not given', () => {
    const { container } = render(<WorkspaceLayout label="Plant assistant" thread="Thread" />);

    expect(screen.queryByRole('banner')).toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(container.querySelector('[data-slot="workspace-composer"]')).toBeNull();
  });
});
