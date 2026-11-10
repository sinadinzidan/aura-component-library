import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { ChatThread } from './ChatThread';
import type { ChatMessage } from './ChatThread';

const QUESTION: ChatMessage = { id: 'u1', role: 'user', text: 'Why did the recompressor trip?' };
const ANSWER: ChatMessage = {
  id: 'a1',
  role: 'assistant',
  text: 'It tripped on **high vibration**.',
  reasoning: { steps: ['Checked the active alarms.'], durationSeconds: 6 },
  tools: [{ id: 't1', toolName: 'list_alarms', title: 'List alarms', status: 'completed' }],
  sources: [{ id: 's1', title: 'alm-4812', href: 'https://fusion.nordkapp.test/events/alm-4812', kind: 'event' }],
};

describe(ChatThread.name, () => {
  it('shows the empty state when there are no messages', () => {
    renderThread({ messages: [], emptyState: <p>Ask about the plant</p> });

    expect(screen.getByText('Ask about the plant')).toBeInTheDocument();
    expect(screen.queryByRole('log')).not.toBeInTheDocument();
  });

  it('renders user text and formatted assistant markdown in a log', () => {
    renderThread({ messages: [QUESTION, ANSWER] });

    expect(screen.getByRole('log', { name: 'Conversation' })).toBeInTheDocument();
    expect(screen.getByText('Why did the recompressor trip?')).toBeInTheDocument();
    expect(screen.getByText('high vibration').tagName).toBe('STRONG');
  });

  it('shows reasoning, tool calls and sources for a finished response', () => {
    renderThread({ messages: [QUESTION, ANSWER] });

    expect(screen.getByRole('button', { name: 'Thought for 6 s' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Used 1 tool' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1 source' })).toBeInTheDocument();
  });

  it('shows the pending label and no actions before a response arrives', () => {
    renderThread({ messages: [QUESTION, { id: 'a2', role: 'assistant', text: '', status: 'pending' }] });

    expect(screen.getByText('Working on it…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy response' })).not.toBeInTheDocument();
  });

  it('holds back sources and actions while text is still streaming', () => {
    renderThread({ messages: [QUESTION, { ...ANSWER, status: 'streaming' }] });

    expect(screen.queryByRole('button', { name: '1 source' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy response' })).not.toBeInTheDocument();
  });

  it('offers a retry on a failed turn', async () => {
    const onRetry = vi.fn();
    renderThread({
      messages: [QUESTION, { id: 'a3', role: 'assistant', text: '', status: 'error', errorText: 'The time series service timed out.' }],
      onRetry,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('The time series service timed out.')).toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledWith('a3');
  });

  it('reports regenerate with the message id', async () => {
    const onRegenerate = vi.fn();
    renderThread({ messages: [QUESTION, ANSWER], onRegenerate });

    await userEvent.click(screen.getByRole('button', { name: 'Regenerate response' }));

    expect(onRegenerate).toHaveBeenCalledWith('a1');
  });

  it('can hide the action row for a read-only transcript', () => {
    renderThread({ messages: [QUESTION, ANSWER], hideActions: true });

    expect(screen.queryByRole('button', { name: 'Copy response' })).not.toBeInTheDocument();
  });
});

function renderThread(props: ComponentProps<typeof ChatThread>) {
  return render(
    <TooltipProvider>
      <ChatThread {...props} />
    </TooltipProvider>
  );
}
