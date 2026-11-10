import { Button } from '@cognite/aura/components/button';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationTurn,
} from '@cognite/aura/components/conversation';
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Message, MessageAvatar, MessageAvatarIcon, MessageContent, MessageResponse } from '@cognite/aura/components/message';
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@cognite/aura/components/prompt-input';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { IconMessageCircle, IconPlayerPlay, IconPlus, IconSparkles } from '@cognite/aura/icons';
import { useEffect, useState } from 'react';

import { ChatThread } from '../../../library/ai/ChatThread';
import type { ChatMessage } from '../../../library/ai/ChatThread';
import { PromptSuggestions } from '../../../library/ai/PromptSuggestions';
import type { ToolCallStatus } from '../../../library/ai/ToolCall';
import { useStreamedText } from '../../../library/ai/useStreamedText';
import { definePage } from '../../types';

import source from './conversation.tsx?raw';

const FUSION = 'https://fusion.nordkapp.test';

const TRIP_QUESTION = 'Why did the recompressor trip?';

const TRIP_ANSWER =
  'The recompressor **23-KA-9103** tripped at 13:46 on high drive-end vibration. The reading on `23-VT-92740` reached 11.6 mm/s against a trip limit of 11.0 mm/s.';

const WORK_ORDER_ANSWER =
  'Yes. **WO-104482**, a drive-end bearing inspection, is in progress and assigned to Tomás Barros. It is due in 6 hours.';

const PRESSURE_ANSWER = `Discharge pressure on \`23-PT-92531\` over the last 24 hours:

| Measure | Value |
| --- | --- |
| Average | 48.2 barg |
| Maximum | 51.7 barg |
| High limit | 52.0 barg |

It stayed inside its operating limits for the whole period.`;

const STREAMED_ANSWER = `The recompressor **23-KA-9103** tripped at 13:46 on high drive-end vibration.

- Vibration rose from 6.2 to 11.6 mm/s over 40 minutes
- The trip limit is 11.0 mm/s
- A bearing inspection is already in progress on WO-104482

Keep the machine stopped until the inspection is complete.`;

const TRIP_SOURCES = [
  { id: 'vt', title: '23-VT-92740', href: `${FUSION}/timeseries/23-VT-92740`, kind: 'timeseries' },
  { id: 'alarm', title: 'alm-4812', href: `${FUSION}/events/alm-4812`, kind: 'event' },
  { id: 'manual', title: 'Operating manual.pdf', href: `${FUSION}/files/recompressor-operating-manual.pdf`, kind: 'file' },
] as const;

const TRIP_TOOLS = [
  { id: 'alarms', toolName: 'list_alarms', title: 'List active alarms', status: 'completed', input: { assetExternalId: '23-KA-9103' }, output: [{ id: 'alm-4812', severity: 'critical' }] },
  { id: 'trend', toolName: 'query_time_series', title: 'Query time series', status: 'completed', input: { externalId: '23-VT-92740', start: '2h-ago' }, output: { max: 11.6, unit: 'mm/s' } },
] as const;

const TRIP_REASONING = {
  durationSeconds: 9,
  steps: [
    'Alarm alm-4812 is active on the recompressor: tripped on high vibration.',
    'Drive-end vibration on 23-VT-92740 passed the 11.0 mm/s trip limit.',
    'Vibration climbed for 40 minutes first, so this is a developing fault.',
  ],
} as const;

const SHORT_THREAD: readonly ChatMessage[] = [
  { id: 'u1', role: 'user', text: TRIP_QUESTION },
  { id: 'a1', role: 'assistant', text: TRIP_ANSWER },
];

const LONG_THREAD: readonly ChatMessage[] = [
  { id: 'u1', role: 'user', text: TRIP_QUESTION },
  { id: 'a1', role: 'assistant', text: TRIP_ANSWER },
  { id: 'u2', role: 'user', text: 'Is anyone already looking at it?' },
  { id: 'a2', role: 'assistant', text: WORK_ORDER_ANSWER },
  { id: 'u3', role: 'user', text: 'Show discharge pressure for 23-KA-9101 over the last 24 hours' },
  { id: 'a3', role: 'assistant', text: PRESSURE_ANSWER },
  { id: 'u4', role: 'user', text: 'Are there other active alarms in gas compression?' },
  { id: 'a4', role: 'assistant', text: 'Three more: discharge temperature high on **23-KA-9101**, drive-end vibration approaching its limit on the same machine, and cooler outlet temperature high on **23-HA-9114**.' },
];

const STARTERS = [
  { id: 'trip', label: TRIP_QUESTION },
  { id: 'trend', label: 'Discharge pressure, last 24 hours', prompt: 'Show discharge pressure for 23-KA-9101 over the last 24 hours' },
  { id: 'alarms', label: 'Active alarms in gas compression' },
];

const noop = () => undefined;

function ConversationShort() {
  return (
    <div className="mx-auto flex h-64 w-full max-w-xl flex-col">
      <Conversation aria-label="Conversation about the recompressor trip">
        <ConversationContent>
          <Message>
            <MessageContent>{TRIP_QUESTION}</MessageContent>
          </Message>
          <Message isResponse>
            <MessageContent>
              <MessageResponse>{TRIP_ANSWER}</MessageResponse>
            </MessageContent>
          </Message>
        </ConversationContent>
      </Conversation>
    </div>
  );
}

function ConversationEmpty() {
  return (
    <div className="mx-auto flex h-64 w-full max-w-xl flex-col">
      <Conversation aria-label="New conversation">
        <ConversationContent>
          <div className="flex flex-1 items-center justify-center">
            <EmptyState>
              <EmptyStateIcon>
                <IconMessageCircle />
              </EmptyStateIcon>
              <EmptyStateTitle as="h3">No messages yet</EmptyStateTitle>
              <EmptyStateDescription>Ask about alarms, trends, equipment or work orders at Nordkapp.</EmptyStateDescription>
            </EmptyState>
          </div>
        </ConversationContent>
      </Conversation>
    </div>
  );
}

function ConversationLongScroll() {
  return (
    <div className="mx-auto flex h-96 w-full max-w-xl flex-col">
      <Conversation aria-label="Conversation about gas compression">
        <ConversationContent>
          {LONG_THREAD.map((message) => (
            <Message key={message.id} isResponse={message.role === 'assistant'}>
              <MessageContent>
                {message.role === 'assistant' ? <MessageResponse>{message.text}</MessageResponse> : message.text}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <span className="pointer-events-auto">
            <ConversationScrollButton />
          </span>
        </div>
      </Conversation>
    </div>
  );
}

function ConversationTurns() {
  return (
    <div className="mx-auto flex h-96 w-full max-w-xl flex-col">
      <Conversation aria-label="Conversation in turns">
        <ConversationContent className="gap-8">
          <ConversationTurn>
            <Message>
              <MessageContent>{TRIP_QUESTION}</MessageContent>
            </Message>
            <Message isResponse>
              <MessageContent>
                <MessageResponse>{TRIP_ANSWER}</MessageResponse>
              </MessageContent>
            </Message>
          </ConversationTurn>
          <ConversationTurn>
            <Message>
              <MessageContent>Is anyone already looking at it?</MessageContent>
            </Message>
            <Message isResponse>
              <MessageContent>
                <MessageResponse>{WORK_ORDER_ANSWER}</MessageResponse>
              </MessageContent>
            </Message>
          </ConversationTurn>
        </ConversationContent>
      </Conversation>
    </div>
  );
}

function ConversationReserveViewport() {
  const [followUp, setFollowUp] = useState(false);
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
      <div className="flex h-80 flex-col">
        <Conversation aria-label="Conversation with a pinned latest turn">
          <ConversationContent className="gap-6">
            <ConversationTurn>
              <Message>
                <MessageContent>{TRIP_QUESTION}</MessageContent>
              </Message>
              <Message isResponse>
                <MessageContent>
                  <MessageResponse>{STREAMED_ANSWER}</MessageResponse>
                </MessageContent>
              </Message>
            </ConversationTurn>
            {followUp ? (
              <ConversationTurn reserveViewport>
                <Message>
                  <MessageContent>Is anyone already looking at it?</MessageContent>
                </Message>
                <Message isResponse>
                  <MessageContent>
                    <MessageResponse>{WORK_ORDER_ANSWER}</MessageResponse>
                  </MessageContent>
                </Message>
              </ConversationTurn>
            ) : null}
          </ConversationContent>
        </Conversation>
      </div>
      <div>
        <Button variant="outline" size="sm" onClick={() => setFollowUp(!followUp)}>
          {followUp ? 'Remove the follow-up' : 'Ask a follow-up'}
        </Button>
      </div>
    </div>
  );
}

function ConversationWithToolsAndReasoning() {
  return (
    <div className="mx-auto h-96 w-full max-w-xl">
      <ChatThread
        messages={[
          { id: 'u1', role: 'user', text: TRIP_QUESTION },
          { id: 'a1', role: 'assistant', text: TRIP_ANSWER, reasoning: TRIP_REASONING, tools: TRIP_TOOLS },
        ]}
        onRegenerate={noop}
        onFeedback={noop}
      />
    </div>
  );
}

function ConversationWithSources() {
  return (
    <div className="mx-auto h-96 w-full max-w-xl">
      <ChatThread
        messages={[
          { id: 'u1', role: 'user', text: TRIP_QUESTION },
          { id: 'a1', role: 'assistant', text: TRIP_ANSWER, sources: TRIP_SOURCES },
          { id: 'u2', role: 'user', text: 'Is anyone already looking at it?' },
          { id: 'a2', role: 'assistant', text: WORK_ORDER_ANSWER, sources: [{ id: 'wo', title: 'WO-104482', href: `${FUSION}/workorders/WO-104482`, kind: 'event' }] },
        ]}
        hideActions
      />
    </div>
  );
}

function ConversationWithTable() {
  return (
    <div className="mx-auto h-96 w-full max-w-xl">
      <ChatThread
        messages={[
          { id: 'u1', role: 'user', text: 'Show discharge pressure for 23-KA-9101 over the last 24 hours' },
          {
            id: 'a1',
            role: 'assistant',
            text: PRESSURE_ANSWER,
            tools: [TRIP_TOOLS[1]],
            sources: [{ id: 'pt', title: '23-PT-92531', href: `${FUSION}/timeseries/23-PT-92531`, kind: 'timeseries' }],
          },
        ]}
      />
    </div>
  );
}

function ConversationDateSeparators() {
  return (
    <div className="mx-auto flex h-96 w-full max-w-xl flex-col">
      <Conversation aria-label="Conversation across two days">
        <ConversationContent>
          <p className="py-2 text-center text-xs text-muted-foreground">Yesterday</p>
          <Message>
            <MessageContent>Is the standby test for export pump B overdue?</MessageContent>
          </Message>
          <Message isResponse>
            <MessageContent>
              <MessageResponse>{'Yes. The last test was 34 days ago and the interval is 30 days. **WO-104458** is open and unassigned.'}</MessageResponse>
            </MessageContent>
          </Message>
          <p className="py-2 text-center text-xs text-muted-foreground">Today</p>
          <Message>
            <MessageContent>{TRIP_QUESTION}</MessageContent>
          </Message>
          <Message isResponse>
            <MessageContent>
              <MessageResponse>{TRIP_ANSWER}</MessageResponse>
            </MessageContent>
          </Message>
        </ConversationContent>
      </Conversation>
    </div>
  );
}

function ConversationParticipants() {
  return (
    <div className="mx-auto flex h-96 w-full max-w-xl flex-col">
      <Conversation aria-label="Shared conversation in the control room">
        <ConversationContent>
          <Message>
            <MessageAvatar name="Ingrid Haugen" />
            <MessageContent>{TRIP_QUESTION}</MessageContent>
          </Message>
          <Message isResponse>
            <MessageAvatar>
              <MessageAvatarIcon>
                <IconSparkles />
              </MessageAvatarIcon>
            </MessageAvatar>
            <MessageContent>
              <MessageResponse>{TRIP_ANSWER}</MessageResponse>
            </MessageContent>
          </Message>
          <Message>
            <MessageAvatar name="Liv Wold" variant="decorative-3" />
            <MessageContent>Is anyone already looking at it?</MessageContent>
          </Message>
          <Message isResponse>
            <MessageAvatar>
              <MessageAvatarIcon>
                <IconSparkles />
              </MessageAvatarIcon>
            </MessageAvatar>
            <MessageContent>
              <MessageResponse>{WORK_ORDER_ANSWER}</MessageResponse>
            </MessageContent>
          </Message>
        </ConversationContent>
      </Conversation>
    </div>
  );
}

function ConversationEmptyWithSuggestions() {
  const [picked, setPicked] = useState('');
  return (
    <div className="mx-auto h-80 w-full max-w-xl">
      <ChatThread
        messages={picked ? [{ id: 'u1', role: 'user', text: picked }, { id: 'a1', role: 'assistant', text: '', status: 'pending' }] : []}
        emptyState={
          <div className="flex max-w-md flex-col items-center gap-4 text-center">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-semibold text-base-foreground">Ask about Nordkapp</h3>
              <p className="text-sm text-muted-foreground">Pick a question to start, or write your own.</p>
            </div>
            <PromptSuggestions layout="stack" suggestions={STARTERS} onSelect={setPicked} />
          </div>
        }
      />
    </div>
  );
}

function ConversationPending() {
  return (
    <div className="mx-auto h-64 w-full max-w-xl">
      <ChatThread
        pendingLabel="Looking up alarms on 23-KA-9103…"
        messages={[
          { id: 'u1', role: 'user', text: TRIP_QUESTION },
          { id: 'a1', role: 'assistant', text: '', status: 'pending' },
        ]}
      />
    </div>
  );
}

function ConversationStreaming() {
  const stream = useStreamedText(STREAMED_ANSWER, { initialLength: 130 });
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
      <div className="h-80">
        <ChatThread
          messages={[
            { id: 'u1', role: 'user', text: TRIP_QUESTION },
            {
              id: 'a1',
              role: 'assistant',
              text: stream.text,
              status: stream.status === 'done' ? 'done' : 'streaming',
              tools: TRIP_TOOLS,
              sources: TRIP_SOURCES,
            },
          ]}
        />
      </div>
      <div>
        <Button variant="outline" size="sm" onClick={stream.start} disabled={stream.status === 'streaming'}>
          <IconPlayerPlay /> Replay stream
        </Button>
      </div>
    </div>
  );
}

function ConversationErrorRetry() {
  const [failed, setFailed] = useState(true);
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
      <div className="h-72">
        <ChatThread
          messages={[
            { id: 'u1', role: 'user', text: 'Show discharge pressure for 23-KA-9101 over the last 24 hours' },
            failed
              ? { id: 'a1', role: 'assistant', text: '', status: 'error', errorText: 'The time series service did not respond. Your question was not lost.' }
              : { id: 'a1', role: 'assistant', text: PRESSURE_ANSWER },
          ]}
          onRetry={() => setFailed(false)}
        />
      </div>
      {failed ? null : (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setFailed(true)}>
            Show the error again
          </Button>
        </div>
      )}
    </div>
  );
}

function ConversationStopped() {
  return (
    <div className="mx-auto flex h-64 w-full max-w-xl flex-col">
      <Conversation aria-label="Conversation with a stopped response">
        <ConversationContent>
          <Message>
            <MessageContent>{TRIP_QUESTION}</MessageContent>
          </Message>
          <Message isResponse>
            <MessageContent>
              <MessageResponse>{'The recompressor **23-KA-9103** tripped at 13:46 on high drive-end vibration. The reading on'}</MessageResponse>
              <p className="text-sm text-muted-foreground">You stopped this response.</p>
            </MessageContent>
          </Message>
        </ConversationContent>
      </Conversation>
    </div>
  );
}

function ConversationLoadingHistory() {
  return (
    <div className="mx-auto flex h-64 w-full max-w-xl flex-col" aria-busy="true">
      <Conversation aria-label="Loading conversation">
        <ConversationContent>
          <div className="flex flex-col gap-6 py-3">
            <Skeleton className="ml-auto h-9 w-56" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
            <Skeleton className="ml-auto h-9 w-40" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </ConversationContent>
      </Conversation>
    </div>
  );
}

function ConversationAwaitingApproval() {
  const [decision, setDecision] = useState<ToolCallStatus>('awaiting-approval');
  return (
    <div className="mx-auto h-96 w-full max-w-xl">
      <ChatThread
        messages={[
          { id: 'u1', role: 'user', text: 'Create a vibration survey work order for the recompressor' },
          {
            id: 'a1',
            role: 'assistant',
            text: decision === 'completed' ? 'Done. **WO-104490** is open with priority P2.' : decision === 'denied' ? 'No work order was created.' : '',
            status: decision === 'awaiting-approval' ? 'streaming' : 'done',
            tools: [
              {
                id: 'create',
                toolName: 'create_work_order',
                title: 'Create work order',
                status: decision,
                input: { title: 'Vibration survey, recompressor', assetExternalId: '23-KA-9103', priority: 'P2' },
                approvalReason: 'Creates a P2 work order on 23-KA-9103.',
              },
            ],
          },
        ]}
        hideActions
        onApproveTool={() => setDecision('completed')}
        onDenyTool={() => setDecision('denied')}
      />
    </div>
  );
}

function ConversationSidePanel() {
  return (
    <div className="mx-auto flex h-[28rem] w-full max-w-sm flex-col rounded-xl bg-base-background">
      <div className="flex items-center justify-between border-b border-default px-4 py-2">
        <h3 className="text-sm font-medium text-base-foreground">Assistant</h3>
        <Button variant="ghost" size="icon-sm" aria-label="New conversation">
          <IconPlus />
        </Button>
      </div>
      <div className="min-h-0 flex-1 px-3">
        <ChatThread
          hideActions
          messages={[
            { id: 'u1', role: 'user', text: TRIP_QUESTION },
            { id: 'a1', role: 'assistant', text: TRIP_ANSWER, tools: TRIP_TOOLS, sources: TRIP_SOURCES.slice(0, 2) },
          ]}
        />
      </div>
      <div className="p-3">
        <PromptInput onSubmit={noop} helperText={false}>
          <PromptInputBody>
            <PromptInputTextarea aria-label="Message" placeholder="Ask a follow-up" className="min-h-10" />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

function ConversationFullWidth() {
  return (
    <div className="flex h-96 w-full flex-col">
      <Conversation aria-label="Full-width conversation">
        <ConversationContent>
          <div className="mx-auto flex w-full max-w-3xl flex-col">
            {LONG_THREAD.slice(0, 6).map((message) => (
              <Message key={message.id} isResponse={message.role === 'assistant'}>
                <MessageContent>
                  {message.role === 'assistant' ? <MessageResponse>{message.text}</MessageResponse> : message.text}
                </MessageContent>
              </Message>
            ))}
          </div>
        </ConversationContent>
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <span className="pointer-events-auto">
            <ConversationScrollButton />
          </span>
        </div>
      </Conversation>
    </div>
  );
}

function ConversationWithPromptInput() {
  return (
    <div className="mx-auto flex h-[28rem] w-full max-w-xl flex-col gap-3">
      <div className="min-h-0 flex-1">
        <ChatThread messages={LONG_THREAD.slice(0, 4)} onRegenerate={noop} onFeedback={noop} />
      </div>
      <PromptInput onSubmit={noop}>
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Ask a follow-up" className="min-h-10" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function ConversationTypedThread() {
  return (
    <div className="mx-auto h-96 w-full max-w-xl">
      <ChatThread messages={SHORT_THREAD} onRegenerate={noop} onFeedback={noop} />
    </div>
  );
}

function ConversationReadOnlyTranscript() {
  return (
    <div className="mx-auto flex h-96 w-full max-w-xl flex-col gap-2">
      <p className="rounded-lg bg-muted-background px-3 py-2 text-sm text-medium-foreground">
        Shared by Ingrid Haugen on 12 March 2026, 13:58. You can read this conversation but not continue it.
      </p>
      <div className="min-h-0 flex-1">
        <ChatThread
          hideActions
          label="Shared conversation"
          messages={[
            { id: 'u1', role: 'user', text: TRIP_QUESTION },
            { id: 'a1', role: 'assistant', text: TRIP_ANSWER, reasoning: TRIP_REASONING, sources: TRIP_SOURCES },
          ]}
        />
      </div>
    </div>
  );
}

function ConversationLiveDemo() {
  const [question, setQuestion] = useState('');
  const [phase, setPhase] = useState<'idle' | 'pending' | 'answering'>('idle');
  const stream = useStreamedText(STREAMED_ANSWER);
  const startStream = stream.start;

  useEffect(() => {
    if (phase !== 'pending') return;
    const handle = window.setTimeout(() => {
      setPhase('answering');
      startStream();
    }, 900);
    return () => window.clearTimeout(handle);
  }, [phase, startStream]);

  const ask = (text: string) => {
    if (!text.trim() || phase === 'pending' || stream.status === 'streaming') return;
    setQuestion(text);
    setPhase('pending');
  };

  const busy = phase === 'pending' || stream.status === 'streaming';
  const answer: ChatMessage =
    phase === 'pending'
      ? { id: 'a1', role: 'assistant', text: '', status: 'pending' }
      : {
          id: 'a1',
          role: 'assistant',
          text: stream.text,
          status: stream.status === 'done' ? 'done' : 'streaming',
          tools: TRIP_TOOLS,
          sources: TRIP_SOURCES,
        };

  return (
    <div className="mx-auto flex h-[34rem] w-full max-w-2xl flex-col gap-3">
      <div className="min-h-0 flex-1">
        <ChatThread
          messages={question ? [{ id: 'u1', role: 'user', text: question }, answer] : []}
          onRegenerate={() => ask(question)}
          onFeedback={noop}
          emptyState={
            <div className="flex max-w-md flex-col items-center gap-4 text-center">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-semibold text-base-foreground">Ask about Nordkapp</h3>
                <p className="text-sm text-muted-foreground">
                  This demo always gives the same answer, streamed locally. Nothing is sent anywhere.
                </p>
              </div>
              <PromptSuggestions suggestions={STARTERS} onSelect={ask} />
            </div>
          }
        />
      </div>
      <PromptInput onSubmit={(message) => ask(message.text ?? '')}>
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Ask about the plant" className="min-h-10" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          {stream.status === 'streaming' ? (
            <PromptInputSubmit status="streaming" type="button" aria-label="Stop response" onClick={stream.stop} />
          ) : (
            <PromptInputSubmit status={phase === 'pending' ? 'submitted' : 'ready'} disabled={busy} />
          )}
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

export default definePage({
  id: 'conversation',
  title: 'Conversation',
  summary:
    'Conversation is the scrolling thread that holds the messages. It keeps the newest content in view while a response streams, and gets out of the way when the reader scrolls back.',
  docsSlug: 'conversation',
  guidance: {
    use: [
      'A parent with a fixed or flexible height; the thread scrolls inside it.',
      'A reading column of about 640 to 768px, centred, even in a wide layout.',
      'The scroll-to-bottom button whenever the thread can be longer than the view.',
      'An empty state that says what can be asked, with prompts to start from.',
    ],
    avoid: [
      'Letting the whole page scroll instead of the thread.',
      'Forcing the view to the bottom while the reader is scrolled up reading.',
      'Messages running the full width of a wide screen.',
      'A blank panel before the first message.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'The scroll container, its content, turns and the scroll button.',
      specimens: [
        {
          id: 'ConversationShort',
          title: 'Short thread',
          note: 'One exchange; content starts at the top and the container does not scroll yet.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ConversationShort,
        },
        {
          id: 'ConversationEmpty',
          title: 'Empty',
          note: 'Before the first message: a centred empty state instead of a blank panel.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ConversationEmpty,
        },
        {
          id: 'ConversationLongScroll',
          title: 'Long thread with scroll button',
          note: 'Opens at the newest message. Scroll up and the button to return appears.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ConversationLongScroll,
        },
        {
          id: 'ConversationTurns',
          title: 'Grouped into turns',
          note: 'ConversationTurn groups a question with its answer, so spacing separates exchanges.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ConversationTurns,
        },
        {
          id: 'ConversationReserveViewport',
          title: 'Latest turn fills the view',
          note: 'A new question jumps to the top of the view with room below for its answer. Ask a follow-up to see it.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ConversationReserveViewport,
        },
      ],
    },
    {
      id: 'content',
      title: 'Content',
      description: 'What a thread carries besides plain text. From here on the threads are built with ChatThread.',
      specimens: [
        {
          id: 'ConversationTypedThread',
          title: 'From a message list',
          note: 'ChatThread renders a typed list of messages, with actions under each finished answer.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ChatThread.tsx'],
          Component: ConversationTypedThread,
        },
        {
          id: 'ConversationWithToolsAndReasoning',
          title: 'With reasoning and tool calls',
          note: 'Evidence of how the answer was produced, folded above it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ChatThread.tsx'],
          Component: ConversationWithToolsAndReasoning,
        },
        {
          id: 'ConversationWithSources',
          title: 'With sources',
          note: 'Every answer about the plant ends with the data it came from.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ChatThread.tsx'],
          Component: ConversationWithSources,
        },
        {
          id: 'ConversationWithTable',
          title: 'With a table answer',
          note: 'Comparable values come back as a table inside the reading column.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ChatThread.tsx'],
          Component: ConversationWithTable,
        },
        {
          id: 'ConversationDateSeparators',
          title: 'With date separators',
          note: 'Threads that are picked up again on another day.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ConversationDateSeparators,
        },
        {
          id: 'ConversationParticipants',
          title: 'Several participants',
          note: 'A shared control-room thread: avatars tell the people and the assistant apart.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ConversationParticipants,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Empty, waiting, streaming, failed, stopped and loading.',
      specimens: [
        {
          id: 'ConversationEmptyWithSuggestions',
          title: 'Empty with suggestions',
          note: 'Starter prompts turn a blank thread into a first step. Pick one.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ChatThread.tsx', 'ai/PromptSuggestions.tsx'],
          Component: ConversationEmptyWithSuggestions,
        },
        {
          id: 'ConversationPending',
          title: 'Waiting for the response',
          note: 'After sending and before the first token: the question, then a shimmering status line.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ChatThread.tsx'],
          Component: ConversationPending,
        },
        {
          id: 'ConversationStreaming',
          title: 'Streaming last message',
          note: 'The thread follows the answer as it grows; sources and actions wait until it is complete. Replay to watch.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ChatThread.tsx', 'ai/useStreamedText.ts'],
          Component: ConversationStreaming,
        },
        {
          id: 'ConversationErrorRetry',
          title: 'Failed turn with retry',
          note: 'The failure sits where the answer would be, with one action to try again.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ChatThread.tsx'],
          Component: ConversationErrorRetry,
        },
        {
          id: 'ConversationAwaitingApproval',
          title: 'Waiting for approval',
          note: 'The thread pauses on a write action until the user approves or denies it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ChatThread.tsx'],
          Component: ConversationAwaitingApproval,
        },
        {
          id: 'ConversationStopped',
          title: 'Stopped response',
          note: 'A response the user interrupted keeps its partial text and says it was stopped.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ConversationStopped,
        },
        {
          id: 'ConversationLoadingHistory',
          title: 'Loading history',
          note: 'Reopening a saved conversation: skeletons in the shape of the thread.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ConversationLoadingHistory,
        },
      ],
    },
    {
      id: 'layouts',
      title: 'Layouts',
      description: 'The same thread in a narrow panel, a wide page, and with its input.',
      specimens: [
        {
          id: 'ConversationSidePanel',
          title: 'Side panel',
          note: 'A 384px assistant panel beside the main view: header, thread, compact input.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['ai/ChatThread.tsx'],
          Component: ConversationSidePanel,
        },
        {
          id: 'ConversationWithPromptInput',
          title: 'With docked input',
          note: 'The standard chat layout: the thread flexes, the input stays at the bottom.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ChatThread.tsx'],
          Component: ConversationWithPromptInput,
        },
        {
          id: 'ConversationFullWidth',
          title: 'Full width',
          note: 'On a wide page the scroll area spans the width but messages stay in a centred 768px column.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: ConversationFullWidth,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Whole assistant surfaces built from the thread.',
      specimens: [
        {
          id: 'ConversationReadOnlyTranscript',
          title: 'Read-only transcript',
          note: 'A shared or archived conversation: no actions, no input, and a note saying why.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ChatThread.tsx'],
          Component: ConversationReadOnlyTranscript,
        },
        {
          id: 'ConversationLiveDemo',
          title: 'Working assistant',
          note: 'Empty state, send, wait, stream with stop, sources and actions. Ask something to run the whole cycle.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['ai/ChatThread.tsx', 'ai/PromptSuggestions.tsx', 'ai/useStreamedText.ts'],
          Component: ConversationLiveDemo,
        },
      ],
    },
  ],
});
