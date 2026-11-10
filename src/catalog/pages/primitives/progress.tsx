import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Loader } from '@cognite/aura/components/loader';
import { Progress } from '@cognite/aura/components/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconAlertCircleFilled,
  IconCircle,
  IconCircleCheckFilled,
  IconFileTypePdf,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconX,
} from '@cognite/aura/icons';
import { useEffect, useState } from 'react';

import { formatRemaining } from '../../../library/feedback/formatRemaining';
import { LabelledProgress } from '../../../library/feedback/LabelledProgress';
import { WORK_ORDERS } from '../../data/plant';
import { definePage } from '../../types';

import source from './progress.tsx?raw';

/** Drives a demo bar from a click: advances `step` every `intervalMs` and stops by itself at 100. */
function useDemoRun(step: number, intervalMs = 350) {
  const [value, setValue] = useState(0);
  const [active, setActive] = useState(false);
  const running = active && value < 100;

  useEffect(() => {
    if (!running) return;
    const handle = window.setInterval(() => setValue((current) => Math.min(100, current + step)), intervalMs);
    return () => window.clearInterval(handle);
  }, [running, step, intervalMs]);

  const start = () => {
    setValue(0);
    setActive(true);
  };

  return { value, running, done: value >= 100, start, pause: () => setActive(false), resume: () => setActive(true) };
}

const WIZARD_STEPS = ['Source', 'Mapping', 'Schedule', 'Review'] as const;

const SETUP_TASKS = [
  { id: 'source', label: 'Connect a data source', done: true },
  { id: 'model', label: 'Publish a data model', done: true },
  { id: 'assets', label: 'Map assets to time series', done: true },
  { id: 'dashboard', label: 'Create a dashboard', done: false },
  { id: 'invite', label: 'Invite your team', done: false },
] as const;

const UPLOADS = [
  { id: 'pid-23', name: 'PID-23-compression.pdf', value: 100, status: 'Uploaded' },
  { id: 'pid-27', name: 'PID-27-export.pdf', value: 64, status: '64%' },
  { id: 'pid-40', name: 'PID-40-cooling-water.pdf', value: 0, status: 'Waiting' },
] as const;

const ACTIVE_WORK_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done').slice(0, 4);

function ProgressDefault() {
  return (
    <div className="w-full max-w-xs">
      <Progress value={60} aria-label="Import progress" />
    </div>
  );
}

function ProgressSmall() {
  return (
    <div className="w-full max-w-xs">
      <Progress value={60} size="sm" aria-label="Import progress" />
    </div>
  );
}

function ProgressCustomMax() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <Progress value={3} max={8} aria-label="Files processed" aria-valuetext="3 of 8 files" />
      <p className="text-xs text-muted-foreground tabular-nums">value 3, max 8</p>
    </div>
  );
}

function ProgressStartAndEnd() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <Progress value={0} aria-label="Not started" />
      <Progress value={100} aria-label="Complete" />
    </div>
  );
}

function ProgressWithLabel() {
  return (
    <div className="w-full max-w-xs">
      <LabelledProgress label="Importing assets" value={42} />
    </div>
  );
}

function ProgressWithCount() {
  return (
    <div className="w-full max-w-xs">
      <LabelledProgress label="Uploading drawings" value={128} max={340} valueText="128 of 340 files" />
    </div>
  );
}

function ProgressWithBytes() {
  return (
    <div className="w-full max-w-xs">
      <LabelledProgress label="Downloading export" value={1.2} max={3.4} valueText="1.2 of 3.4 GB" />
    </div>
  );
}

function ProgressWithEta() {
  return (
    <div className="w-full max-w-xs">
      <LabelledProgress label="Backfilling time series" value={68} hint={formatRemaining(250)} />
    </div>
  );
}

function ProgressInlineValue() {
  return (
    <div className="flex w-full max-w-xs items-center gap-3">
      <Progress value={35} size="sm" aria-label="Work order progress" />
      <span className="shrink-0 text-sm text-muted-foreground tabular-nums">35%</span>
    </div>
  );
}

function ProgressOverallAndCurrent() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <LabelledProgress label="Migrating data sets" value={2} max={5} valueText="2 of 5 data sets" />
      <LabelledProgress label="Compressor vibration" value={76} size="sm" hint="412 000 of 540 000 rows" />
    </div>
  );
}

function ProgressRunning() {
  const run = useDemoRun(4);

  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <LabelledProgress
        label="Importing assets"
        value={run.value}
        hint={run.done ? 'Import finished' : run.running ? formatRemaining((100 - run.value) * 6) : 'Not started'}
      />
      <Button variant="secondary" size="sm" className="self-start" disabled={run.running} onClick={run.start}>
        {run.done ? 'Run again' : 'Start import'}
      </Button>
    </div>
  );
}

function ProgressComplete() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-medium text-base-foreground">Importing assets</span>
        <span className="text-muted-foreground tabular-nums">100%</span>
      </div>
      <Progress value={100} aria-label="Importing assets" />
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <IconCircleCheckFilled className="size-4 text-success-foreground-strong" aria-hidden />
        1 284 assets imported
      </p>
    </div>
  );
}

function ProgressFailed() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-medium text-base-foreground">Importing assets</span>
        <span className="text-muted-foreground tabular-nums">Stopped at 62%</span>
      </div>
      <Progress value={62} aria-label="Importing assets" aria-valuetext="Stopped at 62%" />
      <p className="flex items-start gap-1 text-xs text-critical-foreground-strong">
        <IconAlertCircleFilled className="size-4 shrink-0" aria-hidden />
        Import failed. Connection lost. The 796 imported assets are kept.
      </p>
      <Button variant="secondary" size="sm" className="self-start">
        <IconRefresh /> Resume import
      </Button>
    </div>
  );
}

function ProgressPaused() {
  const [paused, setPaused] = useState(true);

  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-base-foreground">Backfilling time series</span>
        {paused ? <Badge variant="archived">Paused</Badge> : <span className="text-muted-foreground tabular-nums">45%</span>}
      </div>
      <Progress value={45} aria-label="Backfilling time series" aria-valuetext={paused ? 'Paused at 45%' : '45%'} />
      <Button variant="ghost" size="sm" className="self-start" onClick={() => setPaused(!paused)}>
        {paused ? <IconPlayerPlay /> : <IconPlayerPause />}
        {paused ? 'Resume backfill' : 'Pause backfill'}
      </Button>
    </div>
  );
}

function ProgressWaiting() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-medium text-base-foreground">Exporting 12 charts</span>
        <span className="text-muted-foreground">Queued</span>
      </div>
      <Progress value={0} aria-label="Exporting 12 charts" aria-valuetext="Queued" />
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader size={12} aria-hidden /> Waiting for 2 exports ahead of yours
      </p>
    </div>
  );
}

function ProgressStepped() {
  const [step, setStep] = useState(1);

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <LabelledProgress
        label={WIZARD_STEPS[step]}
        value={step + 1}
        max={WIZARD_STEPS.length}
        valueText={`Step ${step + 1} of ${WIZARD_STEPS.length}`}
        size="sm"
      />
      <div className="flex justify-between gap-2">
        <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Back
        </Button>
        <Button size="sm" disabled={step === WIZARD_STEPS.length - 1} onClick={() => setStep(step + 1)}>
          Continue
        </Button>
      </div>
    </div>
  );
}

function ProgressSegmented() {
  const current = 2;

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <div
        role="group"
        aria-label={`Step ${current + 1} of ${WIZARD_STEPS.length}: ${WIZARD_STEPS[current]}`}
        className="grid grid-cols-4 gap-1"
      >
        {WIZARD_STEPS.map((name, index) => (
          <Progress
            key={name}
            size="sm"
            value={index < current ? 100 : index === current ? 50 : 0}
            aria-label={name}
            aria-valuetext={index < current ? 'Done' : index === current ? 'In progress' : 'Not started'}
          />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1 text-xs">
        {WIZARD_STEPS.map((name, index) => (
          <span key={name} className={index === current ? 'font-medium text-base-foreground' : 'text-muted-foreground'}>
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProgressChecklist() {
  const done = SETUP_TASKS.filter((task) => task.done).length;

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <LabelledProgress
        label="Set up your workspace"
        value={done}
        max={SETUP_TASKS.length}
        valueText={`${done} of ${SETUP_TASKS.length} done`}
      />
      <ul className="flex flex-col gap-2 text-sm">
        {SETUP_TASKS.map((task) => (
          <li key={task.id} className="flex items-center gap-2">
            {task.done ? (
              <IconCircleCheckFilled className="size-4 shrink-0 text-success-foreground-strong" aria-label="Done" />
            ) : (
              <IconCircle className="size-4 shrink-0 text-muted-foreground" aria-label="To do" />
            )}
            <span className={task.done ? 'text-muted-foreground' : 'text-base-foreground'}>{task.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProgressUploadCard() {
  const run = useDemoRun(5);
  const megabytes = ((run.value / 100) * 18.4).toFixed(1);

  return (
    <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-default p-4">
      <div className="flex items-center gap-3">
        <IconFileTypePdf className="size-6 shrink-0 text-muted-foreground" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-base-foreground">PID-23-compression.pdf</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {run.done ? '18.4 MB, uploaded' : `${megabytes} of 18.4 MB`}
          </span>
        </div>
        {run.running ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Cancel upload" onClick={run.pause}>
                  <IconX />
                </Button>
              }
            />
            <TooltipContent>Cancel upload</TooltipContent>
          </Tooltip>
        ) : (
          <Button variant="secondary" size="sm" onClick={run.start}>
            {run.done ? 'Upload again' : 'Upload'}
          </Button>
        )}
      </div>
      <Progress value={run.value} size="sm" aria-label="Uploading PID-23-compression.pdf" />
    </div>
  );
}

function ProgressBackfill() {
  const run = useDemoRun(2, 300);
  const points = Math.round((run.value / 100) * 1_200_000).toLocaleString('en-US');

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-default p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium text-base-foreground">Backfill 23-PT-92531</h4>
          <p className="text-xs text-muted-foreground">Discharge pressure, 1 Jan to 12 Mar 2026</p>
        </div>
        {run.running ? (
          <Button variant="ghost" size="sm" onClick={run.pause}>
            Pause
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={run.value > 0 && !run.done ? run.resume : run.start}>
            {run.done ? 'Run again' : run.value > 0 ? 'Resume' : 'Start backfill'}
          </Button>
        )}
      </div>
      <LabelledProgress
        label="Data points written"
        value={run.value}
        valueText={`${points} of 1,200,000`}
        hint={
          run.done
            ? 'Backfill finished'
            : run.running
              ? formatRemaining((100 - run.value) * 9)
              : run.value > 0
                ? 'Paused'
                : 'Not started'
        }
      />
    </div>
  );
}

function ProgressFileList() {
  return (
    <ul className="flex w-full max-w-md flex-col gap-4">
      {UPLOADS.map((file) => (
        <li key={file.id} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0 truncate text-base-foreground">{file.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{file.status}</span>
          </div>
          <Progress value={file.value} size="sm" aria-label={`Uploading ${file.name}`} aria-valuetext={file.status} />
        </li>
      ))}
    </ul>
  );
}

function ProgressTableColumn() {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-default text-xs text-muted-foreground">
          <th className="py-2 pr-4 font-medium">Work order</th>
          <th className="py-2 pr-4 font-medium">Title</th>
          <th className="w-48 py-2 font-medium">Progress</th>
        </tr>
      </thead>
      <tbody className="text-base-foreground">
        {ACTIVE_WORK_ORDERS.map((order) => (
          <tr key={order.id}>
            <td className="py-2 pr-4 whitespace-nowrap tabular-nums">{order.id}</td>
            <td className="max-w-0 truncate py-2 pr-4">{order.title}</td>
            <td className="py-2">
              <div className="flex items-center gap-3">
                <Progress value={order.progress} size="sm" aria-label={`Progress of ${order.id}`} />
                <span className="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{order.progress}%</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ProgressBlockingExport() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-muted-background p-4">
      <div className="flex flex-col gap-1">
        <h4 className="text-base font-medium text-base-foreground">Exporting report</h4>
        <p className="text-sm text-muted-foreground">Keep this window open until the export finishes.</p>
      </div>
      <LabelledProgress label="Rendering charts" value={4} max={12} valueText="4 of 12 charts" hint={formatRemaining(40)} />
      <div className="flex justify-end">
        <Button variant="ghost">Cancel export</Button>
      </div>
    </div>
  );
}

export default definePage({
  id: 'progress',
  title: 'Progress',
  summary:
    'Progress shows how far a task with a known length has come. Pair the bar with a label and a value, so it says what is happening and how much is left.',
  docsSlug: 'progress',
  guidance: {
    use: [
      'Uploads, imports, backfills and exports where completion can be measured.',
      'A label for what is progressing and a value people can read: percent, count or size.',
      'An honest time estimate once it is stable; round it and say "about".',
      'A clear end: say what finished, or what failed and what was kept.',
    ],
    avoid: [
      'A bar for work of unknown length; use a loader instead.',
      'A bar that sits at 0% or 99% with no explanation.',
      'Progress for waits under a second; it only adds flicker.',
      'Colour as the only sign of failure or completion; say it in text.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'The bar on its own: two heights, a value and a maximum.',
      specimens: [
        {
          id: 'ProgressDefault',
          title: 'Default',
          note: 'The standard 8px bar for a task that has its own card or dialog.',
          origin: 'aura',
          Component: ProgressDefault,
        },
        {
          id: 'ProgressSmall',
          title: 'Small',
          note: 'The 4px bar for table rows, list items and other dense places.',
          origin: 'aura',
          Component: ProgressSmall,
        },
        {
          id: 'ProgressCustomMax',
          title: 'Custom maximum',
          note: 'Pass the real count as max and skip converting to percent yourself.',
          origin: 'aura',
          Component: ProgressCustomMax,
        },
        {
          id: 'ProgressStartAndEnd',
          title: 'Empty and full',
          note: 'The two ends of the range; neither should stay on screen without a label.',
          origin: 'aura',
          Component: ProgressStartAndEnd,
        },
      ],
    },
    {
      id: 'labels-and-values',
      title: 'Labels and values',
      description: 'A bar alone says little. Name the task and show the value in the unit people think in.',
      specimens: [
        {
          id: 'ProgressWithLabel',
          title: 'Label and percent',
          note: 'The default pairing when no better unit than percent exists.',
          origin: 'custom',
          uses: ['feedback/LabelledProgress.tsx'],
          Component: ProgressWithLabel,
        },
        {
          id: 'ProgressWithCount',
          title: 'Label and count',
          note: 'The task is made of countable items such as files or rows.',
          origin: 'custom',
          uses: ['feedback/LabelledProgress.tsx'],
          Component: ProgressWithCount,
        },
        {
          id: 'ProgressWithBytes',
          title: 'Label and size',
          note: 'Transfers, where people judge the wait by size.',
          origin: 'custom',
          uses: ['feedback/LabelledProgress.tsx'],
          Component: ProgressWithBytes,
        },
        {
          id: 'ProgressWithEta',
          title: 'With time left',
          note: 'Tasks longer than about ten seconds, once the estimate is stable.',
          origin: 'custom',
          uses: ['feedback/LabelledProgress.tsx', 'feedback/formatRemaining.ts'],
          Component: ProgressWithEta,
        },
        {
          id: 'ProgressInlineValue',
          title: 'Inline value',
          note: 'One compact line where the row already names the task.',
          origin: 'aura',
          Component: ProgressInlineValue,
        },
        {
          id: 'ProgressOverallAndCurrent',
          title: 'Overall and current item',
          note: 'A batch job: one bar for the whole batch, a smaller one for the item in flight.',
          origin: 'custom',
          uses: ['feedback/LabelledProgress.tsx'],
          Component: ProgressOverallAndCurrent,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Running, done, failed, paused and not yet started. The bar has one colour, so text carries the state.',
      specimens: [
        {
          id: 'ProgressRunning',
          title: 'Running',
          note: 'The bar and the estimate update together while work is in flight. Click to try.',
          origin: 'custom',
          uses: ['feedback/LabelledProgress.tsx', 'feedback/formatRemaining.ts'],
          Component: ProgressRunning,
        },
        {
          id: 'ProgressComplete',
          title: 'Complete',
          note: 'Say what finished, in numbers, before the bar is replaced by the result.',
          origin: 'custom',
          Component: ProgressComplete,
        },
        {
          id: 'ProgressFailed',
          title: 'Failed',
          note: 'Keep the bar where it stopped, say why, what was kept, and how to continue.',
          origin: 'custom',
          Component: ProgressFailed,
        },
        {
          id: 'ProgressPaused',
          title: 'Paused',
          note: 'The user or the system paused the work and it can be resumed.',
          origin: 'custom',
          Component: ProgressPaused,
        },
        {
          id: 'ProgressWaiting',
          title: 'Queued',
          note: 'Work has not started; explain the empty bar and show that something is alive.',
          origin: 'custom',
          Component: ProgressWaiting,
        },
      ],
    },
    {
      id: 'steps',
      title: 'Steps',
      description: 'Progress through a sequence the user drives, not a task the system runs.',
      specimens: [
        {
          id: 'ProgressStepped',
          title: 'Stepped',
          note: 'A short wizard: the bar moves one step at a time and names the current step.',
          origin: 'custom',
          uses: ['feedback/LabelledProgress.tsx'],
          Component: ProgressStepped,
        },
        {
          id: 'ProgressSegmented',
          title: 'Segmented',
          note: 'A few named steps where people should see how many remain at a glance.',
          origin: 'custom',
          Component: ProgressSegmented,
        },
        {
          id: 'ProgressChecklist',
          title: 'Checklist',
          note: 'Onboarding or setup tasks that can be done in any order.',
          origin: 'custom',
          uses: ['feedback/LabelledProgress.tsx'],
          Component: ProgressChecklist,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Progress inside the cards, lists, tables and dialogs where the work was started.',
      specimens: [
        {
          id: 'ProgressUploadCard',
          title: 'File upload',
          note: 'One file with its size, a way to cancel, and a clear end state. Click Upload.',
          origin: 'custom',
          size: 'md',
          Component: ProgressUploadCard,
        },
        {
          id: 'ProgressBlockingExport',
          title: 'Blocking task',
          note: 'A dialog body for work the user has to wait for, with a way out.',
          origin: 'custom',
          size: 'md',
          surface: 'muted',
          uses: ['feedback/LabelledProgress.tsx', 'feedback/formatRemaining.ts'],
          Component: ProgressBlockingExport,
        },
        {
          id: 'ProgressBackfill',
          title: 'Backfill job',
          note: 'A long-running job with a label, a counted value, time left and pause. Click to try.',
          origin: 'custom',
          size: 'md',
          uses: ['feedback/LabelledProgress.tsx', 'feedback/formatRemaining.ts'],
          Component: ProgressBackfill,
        },
        {
          id: 'ProgressFileList',
          title: 'Several uploads',
          note: 'A queue of files: one small bar each, with the state written next to the name.',
          origin: 'custom',
          size: 'md',
          Component: ProgressFileList,
        },
        {
          id: 'ProgressTableColumn',
          title: 'Table column',
          note: 'Comparing progress across rows; the number sits beside each bar.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: ProgressTableColumn,
        },
      ],
    },
  ],
});
