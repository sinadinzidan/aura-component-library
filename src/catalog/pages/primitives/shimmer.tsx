import { Avatar, AvatarFallback } from '@cognite/aura/components/avatar';
import { Button } from '@cognite/aura/components/button';
import { Shimmer } from '@cognite/aura/components/shimmer';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { IconCircleCheckFilled, IconCircleDashed, IconSparkles } from '@cognite/aura/icons';
import { useEffect, useState } from 'react';

import { ASSETS } from '../../data/plant';
import { definePage } from '../../types';

import source from './shimmer.tsx?raw';

const GRADIENT_VARIANTS = ['nordic', 'aurora', 'dusk', 'equinox', 'summer', 'spring', 'fall'] as const;

const AGENT_STEPS = ['Searching time series…', 'Reading 14 maintenance records…', 'Comparing with last month…', 'Writing the answer…'] as const;

const ANSWER =
  'Drive-end vibration on the 1st stage compressor has risen from 5.9 to 6.8 mm/s over the last 14 days. It is still below the 7.1 mm/s high limit, but the trend reaches it in about 6 days.';
const ANSWER_WORDS = ANSWER.split(' ');
const THINKING_TICKS = 16;

const HEALTH_ROWS = ASSETS.filter((asset) => asset.type === 'compressor');

function ShimmerDefault() {
  return (
    <div className="text-sm">
      <Shimmer>Thinking…</Shimmer>
    </div>
  );
}

function ShimmerActive() {
  return (
    <div className="text-sm">
      <Shimmer variant="active">Generating summary…</Shimmer>
    </div>
  );
}

function ShimmerGradients() {
  return (
    <ul className="grid w-full max-w-md grid-cols-2 gap-x-6 gap-y-3 text-sm">
      {GRADIENT_VARIANTS.map((variant) => (
        <li key={variant} className="flex items-baseline justify-between gap-4">
          <Shimmer as="span" variant={variant}>
            Analysing trends…
          </Shimmer>
          <code className="text-xs text-muted-foreground">{variant}</code>
        </li>
      ))}
    </ul>
  );
}

function ShimmerSlow() {
  return (
    <div className="text-sm">
      <Shimmer duration={4}>Training anomaly model…</Shimmer>
    </div>
  );
}

function ShimmerFast() {
  return (
    <div className="text-sm">
      <Shimmer duration={1}>Looking up tag…</Shimmer>
    </div>
  );
}

function ShimmerNarrowSpread() {
  return (
    <div className="text-sm">
      <Shimmer spread={1}>Reading the maintenance history for 23-KA-9101…</Shimmer>
    </div>
  );
}

function ShimmerWideSpread() {
  return (
    <div className="text-sm">
      <Shimmer spread={5}>Thinking…</Shimmer>
    </div>
  );
}

function ShimmerSizes() {
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="text-xs">
        <Shimmer>Updating…</Shimmer>
      </div>
      <div className="text-sm">
        <Shimmer>Updating…</Shimmer>
      </div>
      <div className="text-base">
        <Shimmer>Updating…</Shimmer>
      </div>
    </div>
  );
}

function ShimmerAsHeading() {
  return (
    <div className="text-xl font-semibold">
      <Shimmer as="h3">Naming this chart…</Shimmer>
    </div>
  );
}

function ShimmerInlineSpan() {
  return (
    <p className="max-w-xs text-sm text-base-foreground">
      Availability this week is{' '}
      <Shimmer as="span" variant="active">
        calculating…
      </Shimmer>{' '}
      against a target of 97.5%.
    </p>
  );
}

function ShimmerWithIcon() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <IconSparkles className="size-4" aria-hidden />
      <Shimmer as="span">Drafting work order description…</Shimmer>
    </div>
  );
}

function ShimmerWithDetail() {
  return (
    <div className="flex flex-col items-start gap-1 text-sm">
      <Shimmer>Reading maintenance records…</Shimmer>
      <p className="text-xs text-muted-foreground tabular-nums">9 of 14 records, 12 s</p>
    </div>
  );
}

function ShimmerStepStatus() {
  const [step, setStep] = useState(0);

  return (
    <div className="flex flex-col items-center gap-4">
      <div role="status" className="text-sm">
        <Shimmer key={step}>{AGENT_STEPS[step]}</Shimmer>
      </div>
      <Button variant="outline" size="sm" onClick={() => setStep((step + 1) % AGENT_STEPS.length)}>
        Next step
      </Button>
    </div>
  );
}

function ShimmerTruncated() {
  return (
    <div className="flex w-full max-w-48 text-sm">
      <Shimmer className="truncate">Reading the maintenance history for the 1st stage compressor…</Shimmer>
    </div>
  );
}

function ShimmerSettles() {
  const [done, setDone] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <div role="status" className="flex h-5 items-center gap-2 text-sm">
        {done ? (
          <>
            <IconCircleCheckFilled className="size-4 text-success-foreground-strong" aria-hidden />
            <span className="text-base-foreground">Summary ready</span>
          </>
        ) : (
          <Shimmer>Summarising 8 alarms…</Shimmer>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={() => setDone(!done)}>
        {done ? 'Start again' : 'Finish'}
      </Button>
    </div>
  );
}

function ShimmerStreamingAnswer() {
  const [tick, setTick] = useState(0);
  const [started, setStarted] = useState(false);
  const total = THINKING_TICKS + ANSWER_WORDS.length;
  const running = started && tick < total;
  const shownWords = Math.max(0, tick - THINKING_TICKS);

  useEffect(() => {
    if (!running) return;
    const handle = window.setInterval(() => setTick((current) => current + 1), 80);
    return () => window.clearInterval(handle);
  }, [running]);

  const ask = () => {
    setTick(0);
    setStarted(true);
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-base-foreground">Is vibration on 23-KA-9101 getting worse?</p>
        <Button variant="secondary" size="sm" className="shrink-0" disabled={running} onClick={ask}>
          {started && !running ? 'Ask again' : 'Ask'}
        </Button>
      </div>
      <div className="min-h-24 text-sm" aria-live="polite" aria-busy={running}>
        {!started ? (
          <p className="text-muted-foreground">The answer streams in here.</p>
        ) : shownWords === 0 ? (
          <Shimmer>Searching time series…</Shimmer>
        ) : (
          <p className="text-base-foreground">{ANSWER_WORDS.slice(0, shownWords).join(' ')}</p>
        )}
      </div>
    </div>
  );
}

function ShimmerChatBubble() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4 text-sm">
      <p className="max-w-xs self-end rounded-xl bg-muted-background px-3 py-2 text-base-foreground">
        Which compressors need attention this week?
      </p>
      <div className="flex items-start gap-3">
        <Avatar sizes="xsm">
          <AvatarFallback>
            <IconSparkles aria-label="Assistant" />
          </AvatarFallback>
        </Avatar>
        <div role="status" className="pt-1">
          <Shimmer>Checking health scores for 3 compressors…</Shimmer>
        </div>
      </div>
    </div>
  );
}

function ShimmerToolCalls() {
  return (
    <ul className="flex w-full max-w-sm flex-col gap-3 text-sm">
      <li className="flex items-center gap-2 text-muted-foreground">
        <IconCircleCheckFilled className="size-4 shrink-0 text-success-foreground-strong" aria-label="Done" />
        Found 6 time series on 23-KA-9101
      </li>
      <li className="flex items-center gap-2 text-muted-foreground">
        <IconCircleCheckFilled className="size-4 shrink-0 text-success-foreground-strong" aria-label="Done" />
        Read 14 maintenance records
      </li>
      <li role="status" className="flex items-center gap-2 text-muted-foreground">
        <IconCircleDashed className="size-4 shrink-0" aria-hidden />
        <Shimmer as="span">Comparing vibration with last month…</Shimmer>
      </li>
      <li className="flex items-center gap-2 text-muted-foreground">
        <IconCircleDashed className="size-4 shrink-0" aria-label="Not started" />
        Write the answer
      </li>
    </ul>
  );
}

function ShimmerSummaryCard() {
  return (
    <section className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-default p-4">
      <div className="flex items-center gap-2">
        <IconSparkles className="size-4 text-muted-foreground" aria-hidden />
        <h4 className="text-sm font-medium text-base-foreground">Shift summary</h4>
      </div>
      <div role="status" className="text-sm">
        <Shimmer variant="active">Summarising 8 alarms and 3 work orders…</Shimmer>
      </div>
      <div className="flex flex-col gap-2" aria-hidden>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </section>
  );
}

function ShimmerTableCell() {
  return (
    <table className="w-full max-w-md text-left text-sm">
      <thead>
        <tr className="border-b border-default text-xs text-muted-foreground">
          <th className="py-2 pr-4 font-medium">Asset</th>
          <th className="py-2 pr-4 font-medium">Health</th>
          <th className="py-2 font-medium">Predicted in 30 days</th>
        </tr>
      </thead>
      <tbody className="text-base-foreground">
        {HEALTH_ROWS.map((asset, index) => (
          <tr key={asset.id}>
            <td className="py-2 pr-4">{asset.name}</td>
            <td className="py-2 pr-4 tabular-nums">{asset.healthScore}</td>
            <td className="py-2 tabular-nums">
              {index === 0 ? (
                '66'
              ) : (
                <Shimmer as="span">Calculating…</Shimmer>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ShimmerGeneratedTitle() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-1">
      <span className="text-xs text-muted-foreground">New conversation</span>
      <div className="text-base font-medium">
        <Shimmer as="h3">Generating a title…</Shimmer>
      </div>
      <p className="text-sm text-muted-foreground">Started 14:00 by Ingrid Haugen</p>
    </div>
  );
}

function ShimmerSuggestedField() {
  const [suggested, setSuggested] = useState(false);

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Description</span>
        <Button variant="ghost" size="sm" onClick={() => setSuggested(!suggested)}>
          <IconSparkles /> {suggested ? 'Suggest again' : 'Show suggestion'}
        </Button>
      </div>
      <div className="min-h-20 rounded-lg bg-muted-background p-3 text-sm" aria-live="polite">
        {suggested ? (
          <p className="text-base-foreground">
            Inspect the drive-end bearing on the recompressor after the high-vibration trip. Check clearance and lubrication.
          </p>
        ) : (
          <Shimmer>Suggesting a description from the alarm…</Shimmer>
        )}
      </div>
    </div>
  );
}

export default definePage({
  id: 'shimmer',
  title: 'Shimmer',
  summary:
    'Shimmer animates a line of text to show that work is in progress and that the text itself will change: an assistant thinking, an answer on its way, a value being calculated.',
  docsSlug: 'shimmer',
  guidance: {
    use: [
      'Status text for generative or streaming work: "Thinking…", "Searching time series…".',
      'Text that names the current step, updated as the work moves on.',
      'One shimmer per region; let it settle into plain text when the work is done.',
      'A live region around it, so step changes are announced.',
    ],
    avoid: [
      'Shimmer on static labels, headings or links to make them stand out.',
      'Shimmer where the layout is known and no text exists yet; use a skeleton.',
      'Several shimmering lines at once; the motion competes.',
      'Gradient variants as decoration; keep them for assistant and brand moments.',
    ],
  },
  source,
  sections: [
    {
      id: 'variants',
      title: 'Variants',
      description: 'A neutral sweep, a stronger active sweep, and seven brand gradients.',
      specimens: [
        {
          id: 'ShimmerDefault',
          title: 'Default',
          note: 'Quiet status text in product UI: muted text with a light sweep.',
          origin: 'aura',
          Component: ShimmerDefault,
        },
        {
          id: 'ShimmerActive',
          title: 'Active',
          note: 'The assistant is generating right now and the line should draw the eye.',
          origin: 'aura',
          Component: ShimmerActive,
        },
        {
          id: 'ShimmerSizes',
          title: 'Sizes',
          note: 'Shimmer takes the type size around it; match the text it will turn into.',
          origin: 'aura',
          Component: ShimmerSizes,
        },
        {
          id: 'ShimmerGradients',
          title: 'Gradient variants',
          note: 'Brand gradients for assistant surfaces; pick one per product area and keep it.',
          origin: 'aura',
          size: 'md',
          Component: ShimmerGradients,
        },
        {
          id: 'ShimmerAsHeading',
          title: 'As a heading',
          note: 'A title that is being generated; render it as the element it will become.',
          origin: 'aura',
          size: 'md',
          Component: ShimmerAsHeading,
        },
      ],
    },
    {
      id: 'tuning',
      title: 'Speed and spread',
      description: 'How fast the highlight travels and how wide it is.',
      specimens: [
        {
          id: 'ShimmerSlow',
          title: 'Slow',
          note: 'Long-running work, where a calm four-second sweep is easier to live with.',
          origin: 'aura',
          Component: ShimmerSlow,
        },
        {
          id: 'ShimmerFast',
          title: 'Fast',
          note: 'Short lookups that finish in a second or two.',
          origin: 'aura',
          Component: ShimmerFast,
        },
        {
          id: 'ShimmerInlineSpan',
          title: 'Inline in a sentence',
          note: 'One value inside running text is still being calculated.',
          origin: 'aura',
          Component: ShimmerInlineSpan,
        },
        {
          id: 'ShimmerNarrowSpread',
          title: 'Narrow spread',
          note: 'Long lines, where the default highlight would cover too much of the text.',
          origin: 'aura',
          size: 'md',
          Component: ShimmerNarrowSpread,
        },
        {
          id: 'ShimmerWideSpread',
          title: 'Wide spread',
          note: 'Very short text, where the default highlight is too thin to notice.',
          origin: 'aura',
          size: 'md',
          Component: ShimmerWideSpread,
        },
      ],
    },
    {
      id: 'status-text',
      title: 'Status text',
      description: 'Shimmer as a status line: what is happening now, and when it stops.',
      specimens: [
        {
          id: 'ShimmerWithIcon',
          title: 'With icon',
          note: 'The icon says who is working, such as the assistant.',
          origin: 'aura',
          Component: ShimmerWithIcon,
        },
        {
          id: 'ShimmerWithDetail',
          title: 'With detail',
          note: 'A static second line carries counts and elapsed time; only the status shimmers.',
          origin: 'aura',
          Component: ShimmerWithDetail,
        },
        {
          id: 'ShimmerTruncated',
          title: 'Truncated',
          note: 'A narrow panel: the status stays on one line and cuts off.',
          origin: 'aura',
          Component: ShimmerTruncated,
        },
        {
          id: 'ShimmerStepStatus',
          title: 'Changing steps',
          note: 'Multi-step work: the text names the current step and changes as it moves on. Click to try.',
          origin: 'custom',
          size: 'md',
          Component: ShimmerStepStatus,
        },
        {
          id: 'ShimmerSettles',
          title: 'Settles when done',
          note: 'The motion stops with the work: shimmer gives way to plain text. Click to try.',
          origin: 'custom',
          size: 'md',
          Component: ShimmerSettles,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Streaming answers, tool calls and values that are still being produced.',
      specimens: [
        {
          id: 'ShimmerStreamingAnswer',
          title: 'Streaming answer',
          note: 'Shimmer covers the wait before the first words, then the text streams in. Click Ask.',
          origin: 'custom',
          size: 'md',
          Component: ShimmerStreamingAnswer,
        },
        {
          id: 'ShimmerChatBubble',
          title: 'Pending chat message',
          note: 'The assistant has the question and is working on a reply.',
          origin: 'custom',
          size: 'md',
          Component: ShimmerChatBubble,
        },
        {
          id: 'ShimmerToolCalls',
          title: 'Step list',
          note: 'An agent plan: finished steps are plain, the running one shimmers, the rest wait.',
          origin: 'custom',
          size: 'md',
          Component: ShimmerToolCalls,
        },
        {
          id: 'ShimmerSummaryCard',
          title: 'Generated summary',
          note: 'A status line above skeleton lines: what is being written, and where it will land.',
          origin: 'custom',
          size: 'md',
          Component: ShimmerSummaryCard,
        },
        {
          id: 'ShimmerTableCell',
          title: 'Table cell',
          note: 'A calculated column fills in row by row; pending cells say so.',
          origin: 'custom',
          size: 'md',
          Component: ShimmerTableCell,
        },
        {
          id: 'ShimmerSuggestedField',
          title: 'Suggested field value',
          note: 'A field the assistant is filling in; the suggestion replaces the shimmer. Click to try.',
          origin: 'custom',
          size: 'md',
          Component: ShimmerSuggestedField,
        },
        {
          id: 'ShimmerGeneratedTitle',
          title: 'Generated title',
          note: 'A conversation or chart gets its name a moment after it is created.',
          origin: 'custom',
          size: 'md',
          Component: ShimmerGeneratedTitle,
        },
      ],
    },
  ],
});
