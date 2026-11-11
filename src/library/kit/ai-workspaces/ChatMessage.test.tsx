import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { ChatMessage } from './ChatMessage';

describe(ChatMessage.name, () => {
  it('shows who said what and when, with the actions of an answer', () => {
    render(
      <ChatMessage role="assistant" author="Atlas" time="14:02" actions={<button type="button">Copy</button>}>
        The recompressor tripped at 13:46.
      </ChatMessage>,
    );

    const message = screen.getByRole('article');
    expect(message).toHaveAttribute('data-role', 'assistant');
    expect(message).toHaveTextContent('Atlas');
    expect(message).toHaveTextContent('14:02');
    expect(message).toHaveTextContent('The recompressor tripped at 13:46.');
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  it('puts a question on the other side in a bubble look', () => {
    render(
      <ChatMessage role="user" author="Ingrid">
        Why did it trip?
      </ChatMessage>,
    );

    expect(screen.getByRole('article')).toHaveClass('flex-row-reverse');
  });

  it('labels question and answer on a blueprint sheet', () => {
    render(
      <LookScope look="blueprint">
        <ChatMessage role="user" author="Ingrid">
          Why did it trip?
        </ChatMessage>
      </LookScope>,
    );

    expect(screen.getByText('Q')).toBeInTheDocument();
  });
});
