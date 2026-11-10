import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Message, MessageContent, MessageResponse } from '@cognite/aura/components/message';
import { Reasoning, ReasoningContent, ReasoningHeader, ReasoningItem } from '@cognite/aura/components/reasoning';
import { Shimmer } from '@cognite/aura/components/shimmer';
import { IconCircleCheck, IconCircleDashed, IconPlayerPlay, IconRefresh } from '@cognite/aura/icons';
import { useEffect, useState } from 'react';

import { ReasoningDisclosure } from '../../../library/ai/ReasoningDisclosure';
import { ToolCallList } from '../../../library/ai/ToolCallList';
import { definePage } from '../../types';

import source from './reasoning.tsx?raw';

const TRIP_STEPS = [
  'The question is about 23-KA-9103, the recompressor in gas compression.',
  'Alarm alm-4812 is active: tripped on high vibration at 13:46.',
  'Drive-end vibration on 23-VT-92740 reached 11.6 mm/s. The trip limit is 11.0 mm/s.',
  'Vibration climbed for 40 minutes before the trip, so this is a developing fault, not a spike.',
  'Work order WO-104482 already covers a drive-end bearing inspection.',
];

const STEP_TEXT = 'py-2.5 text-sm leading-5 text-medium-foreground';

function ReasoningBasic() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Reasoning>
        <ReasoningHeader />
        <ReasoningContent>
          <ReasoningItem>
            <p className={STEP_TEXT}>
              The recompressor tripped on high vibration, so the vibration trend before the trip is the place to start.
            </p>
          </ReasoningItem>
        </ReasoningContent>
      </Reasoning>
    </div>
  );
}

function ReasoningSteps() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Reasoning>
        <ReasoningHeader />
        <ReasoningContent>
          <ReasoningItem>
            <p className={STEP_TEXT}>{TRIP_STEPS[0]}</p>
          </ReasoningItem>
          <ReasoningItem>
            <p className={STEP_TEXT}>{TRIP_STEPS[1]}</p>
          </ReasoningItem>
          <ReasoningItem>
            <p className={STEP_TEXT}>{TRIP_STEPS[2]}</p>
          </ReasoningItem>
        </ReasoningContent>
      </Reasoning>
    </div>
  );
}

function ReasoningCustomTitle() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Reasoning>
        <ReasoningHeader title="How this was worked out" />
        <ReasoningContent>
          <ReasoningItem>
            <p className={STEP_TEXT}>{TRIP_STEPS[1]}</p>
          </ReasoningItem>
          <ReasoningItem>
            <p className={STEP_TEXT}>{TRIP_STEPS[2]}</p>
          </ReasoningItem>
        </ReasoningContent>
      </Reasoning>
    </div>
  );
}

function ReasoningHeaderOnly() {
  return (
    <Reasoning className="w-fit">
      <ReasoningHeader title="Thought for 12 s" />
    </Reasoning>
  );
}

function ReasoningMarkdownItems() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Reasoning>
        <ReasoningHeader />
        <ReasoningContent>
          <ReasoningItem>
            <div className="py-2">
              <MessageResponse>
                {'Active alarm **alm-4812** on `23-VT-92740`: *Recompressor tripped on high vibration*.'}
              </MessageResponse>
            </div>
          </ReasoningItem>
          <ReasoningItem>
            <div className="py-2">
              <MessageResponse>{'Peak value **11.6 mm/s** against a trip limit of **11.0 mm/s**.'}</MessageResponse>
            </div>
          </ReasoningItem>
        </ReasoningContent>
      </Reasoning>
    </div>
  );
}

function ReasoningStepTitles() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Reasoning>
        <ReasoningHeader />
        <ReasoningContent>
          <ReasoningItem>
            <div className="py-2.5">
              <p className="text-sm leading-5 font-medium text-base-foreground">Identify the equipment</p>
              <p className="text-sm text-muted-foreground">23-KA-9103, recompressor, criticality A.</p>
            </div>
          </ReasoningItem>
          <ReasoningItem>
            <div className="py-2.5">
              <p className="text-sm leading-5 font-medium text-base-foreground">Check active alarms</p>
              <p className="text-sm text-muted-foreground">1 critical alarm raised at 13:46.</p>
            </div>
          </ReasoningItem>
          <ReasoningItem>
            <div className="py-2.5">
              <p className="text-sm leading-5 font-medium text-base-foreground">Compare with limits</p>
              <p className="text-sm text-muted-foreground">Vibration passed the 11.0 mm/s trip limit.</p>
            </div>
          </ReasoningItem>
        </ReasoningContent>
      </Reasoning>
    </div>
  );
}

function ReasoningWithTags() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Reasoning>
        <ReasoningHeader />
        <ReasoningContent>
          <ReasoningItem>
            <div className="flex flex-wrap items-center gap-2 py-2.5 text-sm leading-5 text-medium-foreground">
              Looked up the asset
              <Badge variant="secondary">23-KA-9103</Badge>
            </div>
          </ReasoningItem>
          <ReasoningItem>
            <div className="flex flex-wrap items-center gap-2 py-2.5 text-sm leading-5 text-medium-foreground">
              Read 2 time series
              <Badge variant="secondary">23-VT-92740</Badge>
              <Badge variant="secondary">23-TT-92532</Badge>
            </div>
          </ReasoningItem>
          <ReasoningItem>
            <div className="flex flex-wrap items-center gap-2 py-2.5 text-sm leading-5 text-medium-foreground">
              Found a related work order
              <Badge variant="secondary">WO-104482</Badge>
            </div>
          </ReasoningItem>
        </ReasoningContent>
      </Reasoning>
    </div>
  );
}

function ReasoningStepDurations() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Reasoning>
        <ReasoningHeader title="Thought for 12 s" />
        <ReasoningContent>
          <ReasoningItem>
            <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm leading-5">
              <span className="text-medium-foreground">Find the recompressor and its sensors</span>
              <span className="text-xs text-muted-foreground tabular-nums">2 s</span>
            </div>
          </ReasoningItem>
          <ReasoningItem>
            <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm leading-5">
              <span className="text-medium-foreground">Read 24 hours of vibration data</span>
              <span className="text-xs text-muted-foreground tabular-nums">7 s</span>
            </div>
          </ReasoningItem>
          <ReasoningItem>
            <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm leading-5">
              <span className="text-medium-foreground">Match the trip against open work orders</span>
              <span className="text-xs text-muted-foreground tabular-nums">3 s</span>
            </div>
          </ReasoningItem>
        </ReasoningContent>
      </Reasoning>
    </div>
  );
}

function ReasoningLongContent() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Reasoning>
        <ReasoningHeader title="Thought for 41 s" />
        <div className="max-h-44 overflow-y-auto" tabIndex={0} role="group" aria-label="Reasoning steps">
          <ReasoningContent>
            {[
              ...TRIP_STEPS,
              'Discharge temperature on the 1st stage compressor is also high, which fits reduced recompressor capacity.',
              'The interstage cooler outlet temperature is uncertain quality, so it is left out of the conclusion.',
              'No maintenance was logged on the recompressor in the last 30 days.',
            ].map((step) => (
              <ReasoningItem key={step}>
                <p className={STEP_TEXT}>{step}</p>
              </ReasoningItem>
            ))}
          </ReasoningContent>
        </div>
      </Reasoning>
    </div>
  );
}

function ReasoningPlanProgress() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Reasoning>
        <ReasoningHeader title="Plan" />
        <ul className="flex flex-col gap-2 pl-0.5 text-sm">
          <li className="flex items-center gap-2 text-medium-foreground">
            <IconCircleCheck aria-hidden className="size-4 text-success-foreground-strong" />
            Find the trip alarm
            <span className="sr-only">Done</span>
          </li>
          <li className="flex items-center gap-2 text-medium-foreground">
            <IconCircleCheck aria-hidden className="size-4 text-success-foreground-strong" />
            Read the vibration trend
            <span className="sr-only">Done</span>
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <IconCircleDashed aria-hidden className="size-4" />
            Check maintenance history
            <span className="sr-only">Not started</span>
          </li>
        </ul>
      </Reasoning>
    </div>
  );
}

function ReasoningCollapsed() {
  return (
    <div className="mx-auto w-full max-w-md">
      <ReasoningDisclosure steps={TRIP_STEPS} />
    </div>
  );
}

function ReasoningOpen() {
  return (
    <div className="mx-auto w-full max-w-md">
      <ReasoningDisclosure steps={TRIP_STEPS.slice(0, 3)} defaultOpen />
    </div>
  );
}

function ReasoningWithDuration() {
  return (
    <div className="mx-auto w-full max-w-md">
      <ReasoningDisclosure steps={TRIP_STEPS} durationSeconds={12} />
    </div>
  );
}

function ReasoningCustomLabel() {
  return (
    <div className="mx-auto w-full max-w-md">
      <ReasoningDisclosure steps={TRIP_STEPS} label="Checked 1 alarm and 2 time series" />
    </div>
  );
}

function ReasoningThinking() {
  return (
    <Reasoning className="w-fit">
      <ReasoningHeader>
        <Shimmer as="span">Thinking…</Shimmer>
      </ReasoningHeader>
    </Reasoning>
  );
}

function ReasoningStreaming() {
  const [visible, setVisible] = useState(2);
  const [running, setRunning] = useState(false);
  const done = visible >= TRIP_STEPS.length;

  useEffect(() => {
    if (!running || done) return;
    const handle = window.setTimeout(() => setVisible((count) => count + 1), 900);
    return () => window.clearTimeout(handle);
  }, [running, done, visible]);

  const replay = () => {
    setVisible(1);
    setRunning(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-2">
      <ReasoningDisclosure
        steps={TRIP_STEPS.slice(0, visible)}
        status={done ? 'done' : 'streaming'}
        durationSeconds={5}
        defaultOpen
      />
      <div>
        <Button variant="outline" size="sm" onClick={replay} disabled={running && !done}>
          <IconPlayerPlay /> Replay reasoning
        </Button>
      </div>
    </div>
  );
}

function ReasoningStopped() {
  return (
    <div className="mx-auto w-full max-w-md">
      <ReasoningDisclosure steps={TRIP_STEPS.slice(0, 2)} label="Stopped after 2 steps" defaultOpen />
    </div>
  );
}

function ReasoningUnavailable() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Reasoning>
        <ReasoningHeader />
        <p className="pl-6 text-sm text-muted-foreground">
          No reasoning was recorded for this response. It was answered from the alarm list directly.
        </p>
      </Reasoning>
    </div>
  );
}

function ReasoningAboveAnswer() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <ReasoningDisclosure steps={TRIP_STEPS} durationSeconds={12} />
          <MessageResponse>
            {
              'The recompressor **23-KA-9103** tripped at 13:46 on high drive-end vibration. The reading reached 11.6 mm/s against a trip limit of 11.0 mm/s.'
            }
          </MessageResponse>
        </MessageContent>
      </Message>
    </div>
  );
}

function ReasoningWithToolCalls() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <ReasoningDisclosure steps={TRIP_STEPS.slice(0, 3)} durationSeconds={9} />
          <ToolCallList
            collapsible
            calls={[
              { id: 'alarms', toolName: 'list_alarms', title: 'List active alarms', status: 'completed' },
              { id: 'trend', toolName: 'query_time_series', title: 'Query time series', status: 'completed' },
            ]}
          />
          <MessageResponse>
            {'Vibration on `23-VT-92740` rose steadily for 40 minutes before the trip at 13:46.'}
          </MessageResponse>
        </MessageContent>
      </Message>
    </div>
  );
}

function ReasoningThenAnswer() {
  const [phase, setPhase] = useState<'idle' | 'thinking' | 'answered'>('answered');
  const [visible, setVisible] = useState(3);

  useEffect(() => {
    if (phase !== 'thinking') return;
    const handle = window.setTimeout(() => {
      if (visible >= 3) setPhase('answered');
      else setVisible((count) => count + 1);
    }, 900);
    return () => window.clearTimeout(handle);
  }, [phase, visible]);

  const ask = () => {
    setVisible(1);
    setPhase('thinking');
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
      <Message isResponse>
        <MessageContent>
          <ReasoningDisclosure
            steps={TRIP_STEPS.slice(0, visible)}
            status={phase === 'thinking' ? 'streaming' : 'done'}
            durationSeconds={3}
          />
          {phase === 'answered' ? (
            <MessageResponse>
              {'High drive-end vibration tripped the recompressor. The panel above folds away once the answer arrives.'}
            </MessageResponse>
          ) : null}
        </MessageContent>
      </Message>
      <div>
        <Button variant="outline" size="sm" onClick={ask} disabled={phase === 'thinking'}>
          <IconRefresh /> Ask again
        </Button>
      </div>
    </div>
  );
}

function ReasoningSidePanel() {
  return (
    <div className="mx-auto w-full max-w-xs rounded-xl bg-base-background p-4">
      <ReasoningDisclosure steps={TRIP_STEPS.slice(1, 4)} durationSeconds={8} defaultOpen />
    </div>
  );
}

function ReasoningPerTurn() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col">
      <Message>
        <MessageContent>Why did the recompressor trip?</MessageContent>
      </Message>
      <Message isResponse>
        <MessageContent>
          <ReasoningDisclosure steps={TRIP_STEPS.slice(0, 3)} durationSeconds={9} />
          <MessageResponse>{'It tripped on high drive-end vibration at 13:46.'}</MessageResponse>
        </MessageContent>
      </Message>
      <Message>
        <MessageContent>Is anyone already looking at it?</MessageContent>
      </Message>
      <Message isResponse>
        <MessageContent>
          <ReasoningDisclosure steps={[TRIP_STEPS[4]]} durationSeconds={2} />
          <MessageResponse>
            {'Yes. **WO-104482** is in progress and assigned to Tomás Barros, due in 6 hours.'}
          </MessageResponse>
        </MessageContent>
      </Message>
    </div>
  );
}

export default definePage({
  id: 'reasoning',
  title: 'Reasoning',
  summary:
    'Reasoning shows the steps a model took before it answered. It keeps the answer trustworthy without getting in its way: quiet, secondary, and folded once the answer is in.',
  docsSlug: 'reasoning',
  guidance: {
    use: [
      'Above the answer it led to, in the same assistant message.',
      'One short, factual sentence per step, naming the tags and records that were checked.',
      'Open while the model is thinking, folded once the answer arrives.',
      'A duration or step count in the header so the fold says what is inside.',
    ],
    avoid: [
      'Presenting reasoning as the answer — the conclusion belongs in the response.',
      'Status colour or icons on steps that are not statuses.',
      'Unbounded reasoning that pushes the answer off screen; cap the height or fold it.',
      'Hiding reasoning entirely when the answer drives a decision on the plant.',
    ],
  },
  source,
  sections: [
    {
      id: 'anatomy',
      title: 'Anatomy',
      description: 'A header and a list of steps. Two or more steps get a timeline; one step does not.',
      specimens: [
        {
          id: 'ReasoningBasic',
          title: 'Single step',
          note: 'One thought before a simple answer; a lone item gets no timeline marker.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ReasoningBasic,
        },
        {
          id: 'ReasoningSteps',
          title: 'Several steps',
          note: 'The default for multi-step answers; each item is one step on the timeline.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ReasoningSteps,
        },
        {
          id: 'ReasoningCustomTitle',
          title: 'Custom title',
          note: 'When "Reasoning" is too technical for the audience, name it in their words.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ReasoningCustomTitle,
        },
        {
          id: 'ReasoningHeaderOnly',
          title: 'Header only',
          note: 'A one-line receipt that thinking happened, where the steps are not worth showing.',
          origin: 'aura',
          Component: ReasoningHeaderOnly,
        },
        {
          id: 'ReasoningThinking',
          title: 'Thinking',
          note: 'Before the first step arrives: a shimmering header tells the user work has started.',
          origin: 'aura',
          Component: ReasoningThinking,
        },
      ],
    },
    {
      id: 'step-content',
      title: 'Step content',
      description: 'What a step can hold, from a plain sentence to references and timings.',
      specimens: [
        {
          id: 'ReasoningMarkdownItems',
          title: 'Markdown steps',
          note: 'When the model emits markdown in its reasoning: tags as code, key values in bold.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ReasoningMarkdownItems,
        },
        {
          id: 'ReasoningStepTitles',
          title: 'Titled steps',
          note: 'Steps that are worth scanning: a short title with the finding underneath.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ReasoningStepTitles,
        },
        {
          id: 'ReasoningWithTags',
          title: 'With referenced records',
          note: 'Shows exactly which assets, time series and work orders each step touched.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ReasoningWithTags,
        },
        {
          id: 'ReasoningStepDurations',
          title: 'With step durations',
          note: 'For slow answers, shows where the time went.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ReasoningStepDurations,
        },
        {
          id: 'ReasoningLongContent',
          title: 'Long, height-capped',
          note: 'Many steps scroll inside a capped region so the answer stays in view.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ReasoningLongContent,
        },
        {
          id: 'ReasoningPlanProgress',
          title: 'Plan with progress',
          note: 'When the model states a plan up front and works through it; status colour marks done steps only.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ReasoningPlanProgress,
        },
      ],
    },
    {
      id: 'disclosure',
      title: 'Disclosure',
      description: 'Aura ships Reasoning without a fold. ReasoningDisclosure adds one.',
      specimens: [
        {
          id: 'ReasoningCollapsed',
          title: 'Collapsed',
          note: 'The resting state under a finished answer; the step count says what is inside.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ReasoningDisclosure.tsx'],
          Component: ReasoningCollapsed,
        },
        {
          id: 'ReasoningOpen',
          title: 'Open by default',
          note: 'Where the working matters as much as the answer, such as a root-cause review.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ReasoningDisclosure.tsx'],
          Component: ReasoningOpen,
        },
        {
          id: 'ReasoningWithDuration',
          title: 'With duration',
          note: 'When the thinking time is known, it replaces the step count in the header.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ReasoningDisclosure.tsx'],
          Component: ReasoningWithDuration,
        },
        {
          id: 'ReasoningCustomLabel',
          title: 'Summary label',
          note: 'A header that summarises what was checked, so most readers never need to open it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ReasoningDisclosure.tsx'],
          Component: ReasoningCustomLabel,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'While the model is thinking, when it was interrupted, and when there is nothing to show.',
      specimens: [
        {
          id: 'ReasoningStreaming',
          title: 'Streaming',
          note: 'Open with a shimmering header while steps arrive, then settles to the duration. Replay to see it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ReasoningDisclosure.tsx'],
          Component: ReasoningStreaming,
        },
        {
          id: 'ReasoningStopped',
          title: 'Stopped',
          note: 'The user stopped the response; keep the steps that were reached and say so.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ReasoningDisclosure.tsx'],
          Component: ReasoningStopped,
        },
        {
          id: 'ReasoningUnavailable',
          title: 'Not recorded',
          note: 'When a response has no reasoning, say why instead of showing an empty fold.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ReasoningUnavailable,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Reasoning in its place: inside an assistant message, before tools and the answer.',
      specimens: [
        {
          id: 'ReasoningAboveAnswer',
          title: 'Above the answer',
          note: 'The standard placement: folded reasoning first, then the response it led to.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ReasoningDisclosure.tsx'],
          Component: ReasoningAboveAnswer,
        },
        {
          id: 'ReasoningWithToolCalls',
          title: 'With tool calls',
          note: 'Reasoning, then the tools it decided to use, then the answer — in the order they happened.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ReasoningDisclosure.tsx', 'ai/ToolCallList.tsx'],
          Component: ReasoningWithToolCalls,
        },
        {
          id: 'ReasoningThenAnswer',
          title: 'Thinking, then answering',
          note: 'The full hand-over: open while thinking, folds itself when the answer lands. Ask again to see it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ReasoningDisclosure.tsx'],
          Component: ReasoningThenAnswer,
        },
        {
          id: 'ReasoningSidePanel',
          title: 'In a side panel',
          note: 'At 320px the timeline still reads; keep steps to one or two lines.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['ai/ReasoningDisclosure.tsx'],
          Component: ReasoningSidePanel,
        },
        {
          id: 'ReasoningPerTurn',
          title: 'One per turn',
          note: 'Each assistant turn carries its own reasoning, so a follow-up never inherits the last one.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['ai/ReasoningDisclosure.tsx'],
          Component: ReasoningPerTurn,
        },
      ],
    },
  ],
});
