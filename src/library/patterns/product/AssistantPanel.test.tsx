import { render, screen, within } from '@testing-library/react';

import { AssistantPanel } from './AssistantPanel';

describe(AssistantPanel.name, () => {
  it('is a named complementary region', () => {
    render(<AssistantPanel title="Plant assistant">Thread</AssistantPanel>);

    expect(screen.getByRole('complementary', { name: 'Plant assistant' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Plant assistant' })).toBeInTheDocument();
  });

  it('says what the assistant is looking at', () => {
    render(
      <AssistantPanel title="Plant assistant" context="Reading 23-KA-9101">
        Thread
      </AssistantPanel>
    );

    expect(screen.getByText('Reading 23-KA-9101')).toBeInTheDocument();
  });

  it('renders header actions, thread and prompt in their slots', () => {
    const { container } = render(
      <AssistantPanel
        title="Plant assistant"
        actions={<button type="button">Close</button>}
        footer={<input aria-label="Message" />}
        variant="floating"
      >
        <p>Thread content</p>
      </AssistantPanel>
    );

    expect(within(screen.getByRole('banner')).getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="assistant-panel-body"]')).toHaveTextContent('Thread content');
    expect(within(screen.getByRole('contentinfo')).getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toHaveAttribute('data-variant', 'floating');
  });

  it('leaves out the footer when there is no prompt', () => {
    const { container } = render(<AssistantPanel title="Transcript">Thread</AssistantPanel>);

    expect(container.querySelector('[data-slot="assistant-panel-footer"]')).toBeNull();
  });
});
