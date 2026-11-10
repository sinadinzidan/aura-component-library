import { Alert, AlertActions, AlertButton, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@cognite/aura/components/conversation';
import { Message, MessageContent, MessageResponse } from '@cognite/aura/components/message';
import { Shimmer } from '@cognite/aura/components/shimmer';
import type { ReactNode } from 'react';

import { ReasoningDisclosure } from './ReasoningDisclosure';
import { ResponseActions } from './ResponseActions';
import type { ResponseFeedback } from './ResponseActions';
import { SourceList } from './SourceList';
import type { SourceItem } from './SourceList';
import type { ToolCallData } from './ToolCall';
import { ToolCallList } from './ToolCallList';

export type ChatUserMessage = {
  id: string;
  role: 'user';
  text: string;
};

export type ChatAssistantMessage = {
  id: string;
  role: 'assistant';
  /** Markdown. May be partial while `status` is `streaming`. */
  text: string;
  /** `pending` = nothing received yet; `streaming` = text still arriving; `error` = the turn failed. */
  status?: 'pending' | 'streaming' | 'done' | 'error';
  /** What went wrong, for `error`. */
  errorText?: string;
  reasoning?: { steps: readonly string[]; durationSeconds?: number; streaming?: boolean };
  tools?: readonly ToolCallData[];
  sources?: readonly SourceItem[];
};

export type ChatMessage = ChatUserMessage | ChatAssistantMessage;

type ChatThreadProps = {
  messages: readonly ChatMessage[];
  /** Shown instead of the thread when there are no messages. */
  emptyState?: ReactNode;
  /** Shows a retry action on failed turns. */
  onRetry?: (messageId: string) => void;
  /** Shows Regenerate under finished responses. */
  onRegenerate?: (messageId: string) => void;
  /** Shows the thumbs under finished responses. */
  onFeedback?: (messageId: string, feedback: ResponseFeedback | null) => void;
  /** Hide the copy / regenerate / feedback row, e.g. in a read-only transcript. */
  hideActions?: boolean;
  onApproveTool?: (toolCallId: string) => void;
  onDenyTool?: (toolCallId: string) => void;
  /** Text shown while a response has not started arriving. */
  pendingLabel?: string;
  /** Accessible name of the thread. */
  label?: string;
};

/**
 * A whole assistant thread from one typed message list: user bubbles, assistant markdown,
 * reasoning, tool calls, sources, streaming and failed turns, with stick-to-bottom scrolling.
 * It fills the height of its parent, so give the parent a height.
 */
export function ChatThread({
  messages,
  emptyState,
  onRetry,
  onRegenerate,
  onFeedback,
  hideActions = false,
  onApproveTool,
  onDenyTool,
  pendingLabel = 'Working on it…',
  label = 'Conversation',
}: ChatThreadProps) {
  if (messages.length === 0 && emptyState) {
    return <div className="flex h-full min-h-0 w-full items-center justify-center">{emptyState}</div>;
  }

  return (
    <Conversation aria-label={label} className="h-full w-full">
      <ConversationContent>
        <div className="flex flex-col gap-2 px-1">
          {messages.map((message) =>
            message.role === 'user' ? (
              <Message key={message.id}>
                <MessageContent>{message.text}</MessageContent>
              </Message>
            ) : (
              <Message key={message.id} isResponse>
                <MessageContent>
                  {message.reasoning ? (
                    <ReasoningDisclosure
                      steps={message.reasoning.steps}
                      durationSeconds={message.reasoning.durationSeconds}
                      status={message.reasoning.streaming ? 'streaming' : 'done'}
                    />
                  ) : null}
                  {message.tools && message.tools.length > 0 ? (
                    <ToolCallList calls={message.tools} collapsible onApprove={onApproveTool} onDeny={onDenyTool} />
                  ) : null}
                  {message.status === 'pending' ? <Shimmer as="span">{pendingLabel}</Shimmer> : null}
                  {message.text ? <MessageResponse>{message.text}</MessageResponse> : null}
                  {message.status === 'error' ? (
                    <Alert variant="error">
                      <AlertTitle>Response stopped</AlertTitle>
                      <AlertDescription>
                        {message.errorText ?? 'Something went wrong while answering. Try again.'}
                      </AlertDescription>
                      {onRetry ? (
                        <AlertActions>
                          <AlertButton onClick={() => onRetry(message.id)}>Try again</AlertButton>
                        </AlertActions>
                      ) : null}
                    </Alert>
                  ) : null}
                  {message.sources && message.sources.length > 0 && isSettled(message) ? (
                    <SourceList sources={message.sources} collapsible />
                  ) : null}
                  {!hideActions && isSettled(message) && message.status !== 'error' ? (
                    <ResponseActions
                      text={message.text}
                      onRegenerate={onRegenerate ? () => onRegenerate(message.id) : undefined}
                      onFeedback={onFeedback ? (feedback) => onFeedback(message.id, feedback) : undefined}
                    />
                  ) : null}
                </MessageContent>
              </Message>
            )
          )}
        </div>
      </ConversationContent>
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
        <span className="pointer-events-auto">
          <ConversationScrollButton />
        </span>
      </div>
    </Conversation>
  );
}

function isSettled(message: ChatAssistantMessage): boolean {
  return message.status === undefined || message.status === 'done' || message.status === 'error';
}
