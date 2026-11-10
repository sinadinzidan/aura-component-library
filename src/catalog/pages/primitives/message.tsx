import { Alert, AlertActions, AlertButton, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import {
  Message,
  MessageAction,
  MessageActions,
  MessageAttachment,
  MessageAttachments,
  MessageAvatar,
  MessageAvatarIcon,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from '@cognite/aura/components/message';
import { MESSAGE_RESPONSE_MATH_PLUGIN } from '@cognite/aura/components/message-response-math-plugin';
import { MessageResponseTable } from '@cognite/aura/components/message-response-table';
import { Shimmer } from '@cognite/aura/components/shimmer';
import { IconCopy, IconPencil, IconPlayerPlay, IconRefresh, IconSparkles, IconThumbDown, IconThumbUp } from '@cognite/aura/icons';
import { useState } from 'react';

import { PromptSuggestions } from '../../../library/ai/PromptSuggestions';
import { ReasoningDisclosure } from '../../../library/ai/ReasoningDisclosure';
import { ResponseActions } from '../../../library/ai/ResponseActions';
import { SourceList } from '../../../library/ai/SourceList';
import { ToolCallList } from '../../../library/ai/ToolCallList';
import { useStreamedText } from '../../../library/ai/useStreamedText';
import { definePage } from '../../types';

import source from './message.tsx?raw';

const FUSION = 'https://fusion.nordkapp.test';

const TRIP_ANSWER =
  'The recompressor **23-KA-9103** tripped at 13:46 on high drive-end vibration. The reading on `23-VT-92740` reached 11.6 mm/s against a trip limit of 11.0 mm/s.';

const STRUCTURED_ANSWER = `### What happened

The recompressor **23-KA-9103** tripped at 13:46 on *high drive-end vibration*.

### What the data shows

- Vibration rose from 6.2 to 11.6 mm/s over 40 minutes
- The trip limit is 11.0 mm/s
- Discharge temperature on the 1st stage compressor is also above its limit

### Suggested next steps

1. Keep the machine stopped until the bearing has been inspected
2. Follow up work order WO-104482 with Tomás Barros
3. Review the vibration trend for the last 7 days`;

const CODE_ANSWER = `Use the time series external ID \`23-PT-92531\` with hourly aggregates:

\`\`\`python
points = client.time_series.data.retrieve(
    external_id="23-PT-92531",
    start="24h-ago",
    end="now",
    aggregates=["average", "max"],
    granularity="1h",
)
\`\`\``;

const TABLE_ANSWER = `Active alarms in gas compression, most severe first:

| Alarm | Severity | Tag | Value | Limit |
| --- | --- | --- | --- | --- |
| Recompressor tripped on high vibration | Critical | 23-VT-92740 | 11.6 mm/s | 11.0 mm/s |
| Discharge temperature high | High | 23-TT-92532 | 146.3 °C | 145.0 °C |
| Drive-end vibration approaching limit | High | 23-VT-92540 | 6.8 mm/s | 7.1 mm/s |
| Cooler outlet temperature high | Medium | 23-TT-91141 | 40.8 °C | 40.0 °C |`;

const QUOTE_ANSWER = `The operating manual sets the trip level:

> The machine trips when drive-end vibration exceeds 11.0 mm/s for more than 2 seconds.

For how the trend was aggregated, see [time series in data models](https://docs.cognite.com/cdf/dm/dm_concepts/dm_timeseries).`;

const MATH_ANSWER = `The pressure ratio across the 1st stage compressor uses absolute pressures:

$$
r = \\frac{p_{discharge} + 1.013}{p_{suction} + 1.013} = \\frac{48.6 + 1.013}{12.4 + 1.013} \\approx 3.70
$$

A ratio of $3.70$ is inside the normal operating envelope.`;

const DIAGRAM_ANSWER = `The likely chain of events:

\`\`\`mermaid
flowchart LR
  A[Bearing wear] --> B[Vibration rises]
  B --> C[Trip limit passed]
  C --> D[Recompressor trips]
\`\`\``;

const LONG_ANSWER = `${STRUCTURED_ANSWER}

### Background

The recompressor returns flash gas from the separators to the main compression train. While it is stopped, that gas goes to flare, so flaring will rise until the machine is back.

The interstage cooler outlet temperature has uncertain signal quality and was left out of this assessment.`;

const FOLLOW_UPS = [
  { id: 'trend', label: 'Show the vibration trend for the last 7 days' },
  { id: 'history', label: 'Has this machine tripped before this year?' },
  { id: 'order', label: 'Who is assigned to WO-104482?' },
];

const noop = () => undefined;

function MessageUser() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message>
        <MessageContent>Why did the recompressor trip?</MessageContent>
      </Message>
    </div>
  );
}

function MessageAssistant() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <MessageResponse>{TRIP_ANSWER}</MessageResponse>
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageExchange() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col">
      <Message>
        <MessageContent>Why did the recompressor trip?</MessageContent>
      </Message>
      <Message isResponse>
        <MessageContent>
          <MessageResponse>{TRIP_ANSWER}</MessageResponse>
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageUserAvatar() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message>
        <MessageAvatar name="Ingrid Haugen" />
        <MessageContent>Why did the recompressor trip?</MessageContent>
      </Message>
    </div>
  );
}

function MessageAssistantAvatar() {
  return (
    <div className="mx-auto w-full max-w-xl">
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
    </div>
  );
}

function MessageLongUser() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message>
        <MessageContent>
          Compare the recompressor trip today with the two previous trips this year. For each one I need the alarm that
          fired first, the vibration in the hour before, and how long the machine was down.
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageMarkdownText() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <MessageResponse>{STRUCTURED_ANSWER}</MessageResponse>
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageMarkdownCode() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <MessageResponse>{CODE_ANSWER}</MessageResponse>
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageMarkdownTable() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Message isResponse>
        <MessageContent>
          <MessageResponse>{TABLE_ANSWER}</MessageResponse>
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageTableGrid() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Message isResponse>
        <MessageContent>
          <MessageResponse components={{ table: MessageResponseTable }}>{TABLE_ANSWER}</MessageResponse>
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageMarkdownQuoteLinks() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <MessageResponse>{QUOTE_ANSWER}</MessageResponse>
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageMath() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <MessageResponse plugins={{ math: MESSAGE_RESPONSE_MATH_PLUGIN }}>{MATH_ANSWER}</MessageResponse>
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageDiagram() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <MessageResponse>{DIAGRAM_ANSWER}</MessageResponse>
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageWithActions() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <MessageResponse>{TRIP_ANSWER}</MessageResponse>
          <MessageActions>
            <MessageAction size="icon-sm" tooltip="Copy response">
              <IconCopy />
            </MessageAction>
            <MessageAction size="icon-sm" tooltip="Regenerate response">
              <IconRefresh />
            </MessageAction>
            <MessageAction size="icon-sm" tooltip="Good response">
              <IconThumbUp />
            </MessageAction>
            <MessageAction size="icon-sm" tooltip="Poor response">
              <IconThumbDown />
            </MessageAction>
          </MessageActions>
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageResponseActionRow() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <MessageResponse>{TRIP_ANSWER}</MessageResponse>
          <ResponseActions text={TRIP_ANSWER} onRegenerate={noop} onFeedback={noop} />
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageUserActions() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message>
        <div className="flex w-full flex-col items-end">
          <MessageContent>Show discharge pressure for 23-KA-9101 over the last 24 hours</MessageContent>
          <MessageActions>
            <MessageAction size="icon-sm" tooltip="Edit message">
              <IconPencil />
            </MessageAction>
            <MessageAction size="icon-sm" tooltip="Copy message">
              <IconCopy />
            </MessageAction>
          </MessageActions>
        </div>
      </Message>
    </div>
  );
}

function MessageBranches() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <MessageBranch>
        <MessageBranchContent>
          <Message key="first" isResponse>
            <MessageContent>
              <MessageResponse>{TRIP_ANSWER}</MessageResponse>
            </MessageContent>
          </Message>
          <Message key="second" isResponse>
            <MessageContent>
              <MessageResponse>
                {'High vibration on the drive-end bearing tripped **23-KA-9103** at 13:46. An inspection is already under way on WO-104482.'}
              </MessageResponse>
            </MessageContent>
          </Message>
        </MessageBranchContent>
        <MessageToolbar>
          <MessageBranchSelector from="assistant">
            <MessageBranchPrevious aria-label="Previous version" />
            <MessageBranchPage />
            <MessageBranchNext aria-label="Next version" />
          </MessageBranchSelector>
        </MessageToolbar>
      </MessageBranch>
    </div>
  );
}

function MessageWithAttachments() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message>
        <div className="flex w-full flex-col items-end gap-2">
          <MessageAttachments>
            <MessageAttachment data={{ type: 'file', mediaType: 'application/pdf', filename: 'Shift log 12 March.pdf', url: `${FUSION}/files/shift-log.pdf` }} />
            <MessageAttachment data={{ type: 'file', mediaType: 'text/csv', filename: 'vibration-export.csv', url: `${FUSION}/files/vibration-export.csv` }} />
          </MessageAttachments>
          <MessageContent>Summarize what happened before the trip</MessageContent>
        </div>
      </Message>
    </div>
  );
}

function MessageAttachmentsRemovable() {
  const all = ['Shift log 12 March.pdf', 'vibration-export.csv', 'P&ID NK-23-0041.pdf'];
  const [files, setFiles] = useState(all);
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-end gap-2">
      <MessageAttachments>
        {files.map((filename) => (
          <MessageAttachment
            key={filename}
            data={{ type: 'file', mediaType: 'application/pdf', filename, url: `${FUSION}/files/draft` }}
            onRemove={() => setFiles(files.filter((name) => name !== filename))}
          />
        ))}
      </MessageAttachments>
      <p className="text-sm text-muted-foreground">
        {files.length === 0 ? 'No files attached.' : `${files.length} attached. Hover a file to remove it.`}
      </p>
      {files.length < all.length ? (
        <Button variant="ghost" size="sm" onClick={() => setFiles(all)}>
          Attach all again
        </Button>
      ) : null}
    </div>
  );
}

function MessagePending() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <Shimmer as="span">Looking up alarms on 23-KA-9103…</Shimmer>
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageStreaming() {
  const stream = useStreamedText(STRUCTURED_ANSWER, { initialLength: 150 });
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
      <Message isResponse>
        <MessageContent>
          <MessageResponse isAnimating={stream.status === 'streaming'}>{stream.text}</MessageResponse>
          {stream.status === 'done' ? null : <Shimmer as="span">Writing…</Shimmer>}
        </MessageContent>
      </Message>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={stream.start} disabled={stream.status === 'streaming'}>
          <IconPlayerPlay /> Replay stream
        </Button>
        {stream.status === 'streaming' ? (
          <Button variant="ghost" size="sm" onClick={stream.stop}>
            Stop
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function MessageStopped() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <MessageResponse>
            {'The recompressor **23-KA-9103** tripped at 13:46 on high drive-end vibration. The reading on'}
          </MessageResponse>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">You stopped this response.</p>
            <Button variant="ghost" size="sm">
              <IconRefresh /> Continue
            </Button>
          </div>
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageError() {
  const [failed, setFailed] = useState(true);
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          {failed ? (
            <Alert variant="error">
              <AlertTitle>The answer could not be completed</AlertTitle>
              <AlertDescription>The time series service did not respond. Your question was not lost.</AlertDescription>
              <AlertActions>
                <AlertButton onClick={() => setFailed(false)}>Try again</AlertButton>
              </AlertActions>
            </Alert>
          ) : (
            <>
              <MessageResponse>{TRIP_ANSWER}</MessageResponse>
              <div>
                <Button variant="ghost" size="sm" onClick={() => setFailed(true)}>
                  Show the error again
                </Button>
              </div>
            </>
          )}
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageLongContent() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <div className={expanded ? undefined : 'max-h-56 overflow-hidden'}>
            <MessageResponse>{LONG_ANSWER}</MessageResponse>
          </div>
          <div>
            <Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Show less' : 'Show full answer'}
            </Button>
          </div>
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageWithSources() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <MessageResponse>{TRIP_ANSWER}</MessageResponse>
          <SourceList
            collapsible
            defaultOpen
            sources={[
              { id: 'vt', title: '23-VT-92740', href: `${FUSION}/timeseries/23-VT-92740`, kind: 'timeseries' },
              { id: 'alarm', title: 'alm-4812', href: `${FUSION}/events/alm-4812`, kind: 'event' },
              { id: 'manual', title: 'Operating manual.pdf', href: `${FUSION}/files/recompressor-operating-manual.pdf`, kind: 'file' },
            ]}
          />
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageFullAnswer() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <ReasoningDisclosure
            durationSeconds={9}
            steps={[
              'Alarm alm-4812 is active on the recompressor.',
              'Vibration on 23-VT-92740 passed the 11.0 mm/s trip limit.',
            ]}
          />
          <ToolCallList
            collapsible
            calls={[
              { id: 'alarms', toolName: 'list_alarms', title: 'List active alarms', status: 'completed' },
              { id: 'trend', toolName: 'query_time_series', title: 'Query time series', status: 'completed' },
            ]}
          />
          <MessageResponse>{TRIP_ANSWER}</MessageResponse>
          <SourceList
            collapsible
            sources={[
              { id: 'vt', title: '23-VT-92740', href: `${FUSION}/timeseries/23-VT-92740`, kind: 'timeseries' },
              { id: 'alarm', title: 'alm-4812', href: `${FUSION}/events/alm-4812`, kind: 'event' },
            ]}
          />
          <ResponseActions text={TRIP_ANSWER} onRegenerate={noop} onFeedback={noop} />
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageWithFollowUps() {
  const [picked, setPicked] = useState('');
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <MessageResponse>{TRIP_ANSWER}</MessageResponse>
          <PromptSuggestions label="Follow-up questions" layout="stack" suggestions={FOLLOW_UPS} onSelect={setPicked} />
          {picked ? <p className="text-sm text-muted-foreground">Next question: {picked}</p> : null}
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageWithMeta() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col">
      <Message>
        <MessageAvatar name="Liv Wold" />
        <div className="flex w-full flex-col items-end gap-1">
          <p className="text-xs text-muted-foreground">Liv Wold · 13:52</p>
          <MessageContent>Is anyone already looking at the recompressor?</MessageContent>
        </div>
      </Message>
      <Message isResponse>
        <MessageAvatar>
          <MessageAvatarIcon>
            <IconSparkles />
          </MessageAvatarIcon>
        </MessageAvatar>
        <div className="flex w-full flex-col gap-1">
          <p className="text-xs text-muted-foreground">Assistant · 13:52</p>
          <MessageContent>
            <MessageResponse>
              {'Yes. **WO-104482**, a drive-end bearing inspection, is in progress and assigned to Tomás Barros.'}
            </MessageResponse>
          </MessageContent>
        </div>
      </Message>
    </div>
  );
}

export default definePage({
  id: 'message',
  title: 'Message',
  summary:
    'A message is one turn in a conversation. User messages are short bubbles on the right; assistant messages are plain markdown on the left with room for evidence and actions.',
  docsSlug: 'message',
  guidance: {
    use: [
      'A bubble for the user, unframed markdown for the assistant — the difference is the signal.',
      'Markdown structure for long answers: short headings, lists, tables for comparable values.',
      'Shimmer text while nothing has arrived yet, then stream the answer in place.',
      'Actions under the answer they act on, shown once the answer is complete.',
    ],
    avoid: [
      'A bubble or card around assistant answers; it fights tables and code blocks.',
      'Raw markdown shown as text — always render through MessageResponse.',
      'Answers that run wider than 80% of the thread; long lines are hard to read.',
      'Blame or apology in error messages; say what failed and offer the retry.',
    ],
  },
  source,
  sections: [
    {
      id: 'roles',
      title: 'Roles',
      description: 'Who is speaking decides the side and the surface.',
      specimens: [
        {
          id: 'MessageUser',
          title: 'User',
          note: 'What the person asked: right-aligned on a quiet fill.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MessageUser,
        },
        {
          id: 'MessageAssistant',
          title: 'Assistant',
          note: 'The response: left-aligned markdown with no bubble.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MessageAssistant,
        },
        {
          id: 'MessageExchange',
          title: 'Question and answer',
          note: 'One exchange; the two roles read apart without labels.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MessageExchange,
        },
        {
          id: 'MessageUserAvatar',
          title: 'User with avatar',
          note: 'Shared threads where more than one person asks; initials come from the name.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MessageUserAvatar,
        },
        {
          id: 'MessageAssistantAvatar',
          title: 'Assistant with avatar',
          note: 'Marks the assistant when it shares a thread with several people.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MessageAssistantAvatar,
        },
        {
          id: 'MessageLongUser',
          title: 'Long user message',
          note: 'The bubble wraps at 80% of the thread width, so both sides stay distinguishable.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MessageLongUser,
        },
      ],
    },
    {
      id: 'markdown',
      title: 'Markdown responses',
      description: 'MessageResponse renders streamed markdown with Aura typography.',
      specimens: [
        {
          id: 'MessageMarkdownText',
          title: 'Headings and lists',
          note: 'Answers with more than one part: short headings, bullets for facts, numbers for steps.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MessageMarkdownText,
        },
        {
          id: 'MessageMarkdownCode',
          title: 'Code',
          note: 'Inline code for tags and IDs; fenced blocks for queries and scripts.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MessageMarkdownCode,
        },
        {
          id: 'MessageMarkdownQuoteLinks',
          title: 'Quote and link',
          note: 'Quoting a document verbatim, and linking out for the detail.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MessageMarkdownQuoteLinks,
        },
        {
          id: 'MessageMath',
          title: 'Math',
          note: 'Opt in to the math plugin when answers include calculations worth showing.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MessageMath,
        },
        {
          id: 'MessageMarkdownTable',
          title: 'Table',
          note: 'The default table renderer, for a handful of rows that need no interaction.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: MessageMarkdownTable,
        },
        {
          id: 'MessageTableGrid',
          title: 'Table as data grid',
          note: 'Opt in for longer results: resizable columns, paging, expand and CSV download.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: MessageTableGrid,
        },
        {
          id: 'MessageDiagram',
          title: 'Diagram',
          note: 'Mermaid blocks render as diagrams, for cause chains and simple flows.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MessageDiagram,
        },
      ],
    },
    {
      id: 'actions-attachments',
      title: 'Actions and attachments',
      description: 'What hangs off a message: actions below it, files above it.',
      specimens: [
        {
          id: 'MessageWithActions',
          title: 'Action row',
          note: 'Icon actions with tooltips under a finished answer.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MessageWithActions,
        },
        {
          id: 'MessageResponseActionRow',
          title: 'Working action row',
          note: 'Copy confirms in place and the thumbs toggle; use this instead of wiring each action by hand.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ResponseActions.tsx'],
          Component: MessageResponseActionRow,
        },
        {
          id: 'MessageUserActions',
          title: 'User message actions',
          note: 'Edit and copy under the user’s own message, right-aligned with the bubble.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MessageUserActions,
        },
        {
          id: 'MessageBranches',
          title: 'Response versions',
          note: 'After a regenerate, page between versions instead of losing the earlier one.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MessageBranches,
        },
        {
          id: 'MessageWithAttachments',
          title: 'With attachments',
          note: 'Files sent with a question sit above the bubble; the file name is in the tooltip.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MessageWithAttachments,
        },
        {
          id: 'MessageAttachmentsRemovable',
          title: 'Removable attachments',
          note: 'Before sending, each attachment can be removed on hover.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MessageAttachmentsRemovable,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Waiting, arriving, interrupted, failed and too long.',
      specimens: [
        {
          id: 'MessagePending',
          title: 'Pending',
          note: 'Before the first token: one shimmering line that says what is being done.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MessagePending,
        },
        {
          id: 'MessageStreaming',
          title: 'Streaming',
          note: 'Markdown renders as it arrives, even mid-list. Replay to watch it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/useStreamedText.ts'],
          Component: MessageStreaming,
        },
        {
          id: 'MessageStopped',
          title: 'Stopped',
          note: 'The partial answer stays, with a plain note and a way to continue.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: MessageStopped,
        },
        {
          id: 'MessageError',
          title: 'Error with retry',
          note: 'Says what failed, reassures that the question is kept, and offers one action.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: MessageError,
        },
        {
          id: 'MessageLongContent',
          title: 'Long answer, clamped',
          note: 'In narrow panels, clamp a long answer and let the reader expand it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: MessageLongContent,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'An assistant message with everything around the answer.',
      specimens: [
        {
          id: 'MessageWithSources',
          title: 'With sources',
          note: 'Any answer that states plant facts ends with what it was based on.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/SourceList.tsx'],
          Component: MessageWithSources,
        },
        {
          id: 'MessageFullAnswer',
          title: 'Complete answer',
          note: 'The full order: reasoning, tools, answer, sources, actions.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ReasoningDisclosure.tsx', 'ai/ToolCallList.tsx', 'ai/SourceList.tsx', 'ai/ResponseActions.tsx'],
          Component: MessageFullAnswer,
        },
        {
          id: 'MessageWithFollowUps',
          title: 'With follow-up questions',
          note: 'Suggested next questions under the latest answer keep an investigation moving.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/PromptSuggestions.tsx'],
          Component: MessageWithFollowUps,
        },
        {
          id: 'MessageWithMeta',
          title: 'With name and time',
          note: 'Shared or audited threads, where who asked and when is part of the record.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: MessageWithMeta,
        },
      ],
    },
  ],
});
