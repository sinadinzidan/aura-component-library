import { render, screen } from '@testing-library/react';

import { ChatBubble } from './ChatBubble';

describe(ChatBubble.name, () => {
  it('shows who wrote the message, when, and what', () => {
    render(
      <ChatBubble from="assistant" name="Atlas" time="14:01" footer={<button type="button">Open trend</button>}>
        Vibration rose 0.9 mm/s.
      </ChatBubble>
    );

    expect(screen.getByText('Atlas')).toBeInTheDocument();
    expect(screen.getByText('14:01')).toBeInTheDocument();
    expect(screen.getByText('Vibration rose 0.9 mm/s.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open trend' })).toBeInTheDocument();
  });

  it('marks the author for the stylesheet', () => {
    const { container } = render(
      <ChatBubble from="user" name="Ingrid">
        Why did it trip?
      </ChatBubble>
    );

    expect(container.firstElementChild).toHaveAttribute('data-from', 'user');
  });
});
