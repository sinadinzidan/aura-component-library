import { AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Badge } from '@cognite/aura/components/badge';
import { Banner, BannerAction, BannerActions, BannerClose, BannerIcon, BannerTitle } from '@cognite/aura/components/banner';
import { Button } from '@cognite/aura/components/button';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Progress } from '@cognite/aura/components/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { Textarea } from '@cognite/aura/components/textarea';
import {
  IconArrowRight,
  IconBell,
  IconBook,
  IconBulb,
  IconCheck,
  IconCircleCheck,
  IconDatabaseImport,
  IconExternalLink,
  IconFileSpreadsheet,
  IconGitCompare,
  IconPlugConnected,
  IconSparkles,
  IconTestPipe,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AsyncButton } from '../../../library/actions/AsyncButton';
import { ShortcutHint } from '../../../library/actions/ShortcutHint';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { createMemoryDismissalStore } from '../../../library/feedback/dismissalStore';
import { DismissibleAlert } from '../../../library/feedback/DismissibleAlert';
import { ChoiceCardGroup } from '../../../library/forms/ChoiceCardGroup';
import { SetupChecklist } from '../../../library/patterns/states/SetupChecklist';
import type { SetupStep } from '../../../library/patterns/states/SetupChecklist';
import { definePage } from '../../types';

import source from './onboarding.tsx?raw';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const tipDismissals = createMemoryDismissalStore();

const SETUP_STEPS: readonly SetupStep[] = [
  {
    id: 'source',
    title: 'Connect a data source',
    description: 'Install an extractor for your historian, or upload a file to try things out.',
    done: true,
    actionLabel: 'Connect source',
  },
  {
    id: 'hierarchy',
    title: 'Map your asset hierarchy',
    description: 'Link time series to the equipment they measure, so charts and alarms know where they belong.',
    done: false,
    actionLabel: 'Map assets',
    hint: 'About 10 min',
  },
  {
    id: 'alarms',
    title: 'Create your first alarm rule',
    description: 'Pick a sensor and a limit. You are notified when the value crosses it.',
    done: false,
    actionLabel: 'Create alarm rule',
    hint: 'About 2 min',
  },
  {
    id: 'team',
    title: 'Invite your shift team',
    description: 'Operators and planners see the same data and alarms as you.',
    done: false,
    actionLabel: 'Invite people',
    hint: 'Optional',
  },
];

const FLOW_STEPS = ['Connect data', 'Map assets', 'Set alarms', 'Invite team'] as const;

const ROLE_OPTIONS = [
  { value: 'operator', label: 'Control room operator', description: 'Live values, alarms and shift handover come first.' },
  { value: 'planner', label: 'Maintenance planner', description: 'Work orders, backlog and equipment history come first.' },
  { value: 'engineer', label: 'Reliability engineer', description: 'Trends, health scores and analysis come first.' },
];

const INVITE_ROLE_ITEMS = [
  { value: 'viewer', label: 'Can view' },
  { value: 'editor', label: 'Can edit' },
  { value: 'admin', label: 'Admin' },
];

const WHATS_NEW = [
  { id: 'compare', date: '10 Mar', title: 'Compare two time ranges in one chart', tag: 'Charts' },
  { id: 'shelve', date: '3 Mar', title: 'Shelve alarms until the end of a shift', tag: 'Alarms' },
  { id: 'export', date: '24 Feb', title: 'Export work orders to a spreadsheet', tag: 'Work orders' },
] as const;

const TOUR_STEPS = [
  { title: 'Find any tag', body: 'Search by tag, name or document number from anywhere with the search field at the top.' },
  { title: 'Follow what matters', body: 'Star an asset to see its alarms and work orders on your overview.' },
  { title: 'Compare over time', body: 'Open a chart and choose Compare to put last week next to this week.' },
  { title: 'Hand over the shift', body: 'The handover note collects open alarms and comments for the next operator.' },
] as const;

const SHORTCUTS: readonly { label: string; keys: readonly string[]; mode?: 'chord' | 'sequence' }[] = [
  { label: 'Search', keys: ['/'] },
  { label: 'Command palette', keys: ['mod', 'K'] },
  { label: 'Go to alarms', keys: ['G', 'A'], mode: 'sequence' },
  { label: 'Go to work orders', keys: ['G', 'W'], mode: 'sequence' },
  { label: 'Acknowledge selected alarm', keys: ['shift', 'A'] },
  { label: 'Show all shortcuts', keys: ['?'] },
];

const GUIDES = [
  { id: 'g1', title: 'Connect an extractor', meta: '5 min read' },
  { id: 'g2', title: 'Build your first dashboard', meta: '8 min read' },
  { id: 'g3', title: 'How alarm rules work', meta: '4 min read' },
] as const;

/** A flat card for onboarding blocks: one surface, one border, generous padding. */
function OnboardingCard({ children }: { children: ReactNode }) {
  return <section className="flex w-full flex-col gap-4 rounded-xl border border-default p-6">{children}</section>;
}

/** Neutral icon tile. Onboarding uses one per block, never as decoration on every row. */
function OnboardingTile({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted-background text-medium-foreground [&>svg]:size-5">
      {children}
    </span>
  );
}

function OnboardingWelcomeCard() {
  return (
    <OnboardingCard>
      <OnboardingTile>
        <IconSparkles aria-hidden />
      </OnboardingTile>
      <div className="flex flex-col gap-2">
        <h4 className="text-xl font-semibold text-base-foreground">Welcome to Nordkapp, Ingrid</h4>
        <p className="text-sm text-muted-foreground">
          Your project is ready. Four short steps bring in your data and set up the alarms your shift relies on.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button>
          Start setup <IconArrowRight />
        </Button>
        <Button variant="ghost">Explore first</Button>
      </div>
      <p className="text-xs text-muted-foreground">About 15 minutes. You can stop and continue at any time.</p>
    </OnboardingCard>
  );
}

function OnboardingEmptyApp() {
  return (
    <EmptyState variant="full" type="new-object">
      <EmptyStateIcon>
        <IconPlugConnected />
      </EmptyStateIcon>
      <div className="flex flex-col gap-2">
        <EmptyStateTitle as="h4">Nothing to show yet</EmptyStateTitle>
        <EmptyStateDescription>Connect a data source and your assets, values and alarms appear here.</EmptyStateDescription>
      </div>
      <EmptyStateActions className="flex-row">
        <Button>Connect a data source</Button>
        <Button variant="ghost">Use sample data</Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function OnboardingPersonaPicker() {
  const [role, setRole] = useState('operator');

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h4 className="text-base font-medium text-base-foreground">What do you mostly do?</h4>
        <p className="text-sm text-muted-foreground">This sets up your overview. You can change it later in your profile.</p>
      </div>
      <ChoiceCardGroup label="Your role" options={ROLE_OPTIONS} value={role} onValueChange={setRole} />
      <div>
        <Button>Continue</Button>
      </div>
    </div>
  );
}

function OnboardingSampleData() {
  const [loaded, setLoaded] = useState(false);

  return (
    <OnboardingCard>
      <div className="flex items-start gap-4">
        <OnboardingTile>
          <IconTestPipe aria-hidden />
        </OnboardingTile>
        <div className="flex min-w-0 flex-col gap-1">
          <h4 className="text-base font-medium text-base-foreground">
            {loaded ? 'Sample data is loaded' : 'Look around with sample data'}
          </h4>
          <p className="text-sm text-muted-foreground">
            {loaded
              ? '16 assets, 12 time series and 8 alarms from a fictional gas plant. They are marked as sample everywhere.'
              : 'Not ready to connect your own source? Load a small fictional gas plant and try every feature.'}
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-2 text-sm text-medium-foreground">
        {['Kept apart from your real data', 'Removed in one click, at any time', 'Does not count towards your quota'].map((point) => (
          <li key={point} className="flex items-center gap-2">
            <IconCheck aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            {point}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        {loaded ? (
          <>
            <Button>
              Open overview <IconArrowRight />
            </Button>
            <Button variant="ghost" onClick={() => setLoaded(false)}>
              Remove sample data
            </Button>
          </>
        ) : (
          <AsyncButton pendingLabel="Loading sample data…" onAction={() => wait(1500).then(() => setLoaded(true))}>
            Load sample data
          </AsyncButton>
        )}
      </div>
    </OnboardingCard>
  );
}

function OnboardingSetupChecklist() {
  const [done, setDone] = useState<readonly string[]>(['source']);
  const steps = SETUP_STEPS.map((step) => ({ ...step, done: done.includes(step.id) }));

  return (
    <SetupChecklist
      title="Set up Nordkapp"
      description="Finish these to get live values and alarms for your shift."
      steps={steps}
      onStepAction={(id) => setDone([...done, id])}
      headerAction={
        <Button variant="ghost" size="sm" onClick={() => setDone(['source'])}>
          {done.length === steps.length ? 'Reset example' : 'Hide'}
        </Button>
      }
      complete={
        <div className="flex items-start gap-3 rounded-lg bg-muted-background p-4">
          <IconCircleCheck aria-hidden className="size-5 shrink-0 text-success-foreground-strong" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-base-foreground">Setup complete</p>
            <p className="text-sm text-muted-foreground">Live values and alarms are flowing. This checklist hides itself tomorrow.</p>
          </div>
        </div>
      }
    />
  );
}

function OnboardingGettingStarted() {
  const steps = [
    { title: 'Pick an asset', body: 'Use the tree on the left, or search for a tag such as 23-KA-9101.' },
    { title: 'Open a time series', body: 'Select a sensor to see its trend and limits for the last 24 hours.' },
    { title: 'Save it to a dashboard', body: 'Choose Add to dashboard, so the chart is there for the next shift.' },
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <h4 className="text-base font-medium text-base-foreground">Your first chart in three steps</h4>
      <ol className="flex flex-col gap-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted-background text-xs font-medium tabular-nums text-medium-foreground">
              {index + 1}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-medium text-base-foreground">{step.title}</span>
              <span className="text-sm text-muted-foreground">{step.body}</span>
            </div>
          </li>
        ))}
      </ol>
      <div>
        <Button variant="secondary" size="sm">
          Open the asset tree
        </Button>
      </div>
    </div>
  );
}

function OnboardingConnectData() {
  const options = [
    {
      id: 'extractor',
      icon: <IconPlugConnected aria-hidden />,
      title: 'Install an extractor',
      body: 'Stream live values from your historian or control system. The usual choice for production.',
      meta: 'About 20 min · Needs network access',
      action: 'Set up extractor',
      recommended: true,
    },
    {
      id: 'file',
      icon: <IconFileSpreadsheet aria-hidden />,
      title: 'Upload a file',
      body: 'Bring in a CSV or spreadsheet export to see your own data without installing anything.',
      meta: 'About 2 min · Up to 200 MB',
      action: 'Upload file',
      recommended: false,
    },
    {
      id: 'api',
      icon: <IconDatabaseImport aria-hidden />,
      title: 'Send data with the API',
      body: 'Push data points from your own code. Use this when the source has no ready-made extractor.',
      meta: 'For developers',
      action: 'View API guide',
      recommended: false,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h4 className="text-base font-medium text-base-foreground">Connect your data</h4>
        <p className="text-sm text-muted-foreground">Pick one way to start. You can add more sources later.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {options.map((option) => (
          <section key={option.id} className="flex flex-col gap-4 rounded-xl border border-default p-4">
            <div className="flex items-center justify-between gap-2">
              <OnboardingTile>{option.icon}</OnboardingTile>
              {option.recommended ? <Badge variant="secondary">Recommended</Badge> : null}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <h5 className="text-sm font-medium text-base-foreground">{option.title}</h5>
              <p className="text-sm text-muted-foreground">{option.body}</p>
            </div>
            <p className="text-xs text-muted-foreground">{option.meta}</p>
            <div>
              <Button variant={option.recommended ? 'default' : 'secondary'} size="sm">
                {option.action}
              </Button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function OnboardingStepHeader() {
  const [current, setCurrent] = useState(1);

  return (
    <div className="flex w-full flex-col gap-6">
      <ol className="flex items-center gap-3">
        {FLOW_STEPS.map((step, index) => (
          <li
            key={step}
            aria-current={index === current ? 'step' : undefined}
            className="flex min-w-0 flex-1 items-center gap-3 last:flex-none"
          >
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums ${
                index === current
                  ? 'bg-primary-background text-primary-foreground'
                  : 'bg-muted-background text-medium-foreground'
              }`}
            >
              {index < current ? <IconCheck aria-hidden className="size-3.5" /> : index + 1}
            </span>
            <span
              className={`hidden truncate text-sm sm:inline ${index === current ? 'font-medium text-base-foreground' : 'text-muted-foreground'}`}
            >
              {step}
              {index < current ? <span className="sr-only"> (done)</span> : null}
            </span>
            {index < FLOW_STEPS.length - 1 ? <span aria-hidden className="min-w-4 flex-1 border-t border-emphasized" /> : null}
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Step {current + 1} of {FLOW_STEPS.length}: {FLOW_STEPS[current]}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
            Back
          </Button>
          <Button size="sm" onClick={() => setCurrent(current === FLOW_STEPS.length - 1 ? 0 : current + 1)}>
            {current === FLOW_STEPS.length - 1 ? 'Finish' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function OnboardingResumeCard() {
  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-default p-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Finish setting up</span>
        <span className="text-xs tabular-nums text-muted-foreground">2 of 4 done</span>
      </div>
      <Progress value={2} max={4} size="sm" aria-label="Setup progress" aria-valuetext="2 of 4 done" />
      <p className="text-sm text-muted-foreground">Next: create your first alarm rule.</p>
      <div>
        <Button variant="secondary" size="sm">
          Continue setup
        </Button>
      </div>
    </div>
  );
}

function OnboardingInviteTeammates() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [invited, setInvited] = useState<readonly { email: string; role: string }[]>([
    { email: 'magnus.solberg@nordkapp.test', role: 'editor' },
  ]);
  const [error, setError] = useState(false);

  const add = () => {
    const trimmed = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError(true);
      return;
    }
    setInvited([...invited, { email: trimmed, role }]);
    setEmail('');
    setError(false);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h4 className="text-base font-medium text-base-foreground">Invite your shift team</h4>
        <p className="text-sm text-muted-foreground">They get an email with a link. Nobody is charged until they sign in.</p>
      </div>
      <form
        className="flex items-start gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <div className="min-w-0 flex-1">
          <Label htmlFor="onboarding-invite-email">Work email</Label>
          <Input
            id="onboarding-invite-email"
            type="email"
            autoComplete="off"
            placeholder="name@nordkapp.test"
            value={email}
            aria-invalid={error || undefined}
            onChange={(event) => setEmail(event.target.value)}
          />
          {error ? <HelperText isError>Enter a full email address, such as name@nordkapp.test.</HelperText> : null}
        </div>
        <div className="w-32 shrink-0">
          <Label htmlFor="onboarding-invite-role">Access</Label>
          <Select items={INVITE_ROLE_ITEMS} value={role} onValueChange={setRole}>
            <SelectTrigger id="onboarding-invite-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVITE_ROLE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col">
          <span aria-hidden className="invisible pb-2 text-sm">
            Add
          </span>
          <Button type="submit" variant="secondary">
            Add
          </Button>
        </div>
      </form>
      <ul className="flex flex-col">
        {invited.map((person) => (
          <li key={person.email} className="flex items-center gap-3 border-t border-default py-2 first:border-t-0">
            <PersonAvatar name={person.email} initials={person.email.slice(0, 2).toUpperCase()} sizes="xsm" />
            <span className="min-w-0 flex-1 truncate text-sm text-base-foreground">{person.email}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {INVITE_ROLE_ITEMS.find((item) => item.value === person.role)?.label}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <Button>
          Send {invited.length} {invited.length === 1 ? 'invite' : 'invites'}
        </Button>
        <Button variant="ghost">Skip for now</Button>
      </div>
    </div>
  );
}

function OnboardingCompletion() {
  return (
    <EmptyState variant="full" type="new-object">
      <EmptyStateIcon>
        <IconCircleCheck />
      </EmptyStateIcon>
      <div className="flex flex-col gap-2">
        <EmptyStateTitle as="h4">Nordkapp is set up</EmptyStateTitle>
        <EmptyStateDescription>
          1,284 time series are streaming, 3 alarm rules are active and 4 people are invited.
        </EmptyStateDescription>
      </div>
      <EmptyStateActions className="flex-row">
        <Button>
          Open overview <IconArrowRight />
        </Button>
        <Button variant="ghost">Review settings</Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function OnboardingFirstSuccess() {
  return (
    <div className="flex w-full flex-col items-center gap-3 text-center">
      <IconCircleCheck aria-hidden className="size-6 text-success-foreground-strong" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-base-foreground">First data received</p>
        <p className="text-sm text-muted-foreground">23-PT-92531 reported 48.6 barg at 14:00. The extractor is working.</p>
      </div>
      <Button variant="secondary" size="sm">
        View live values
      </Button>
    </div>
  );
}

function OnboardingNotificationsOptIn() {
  const [answer, setAnswer] = useState<'on' | 'later' | null>(null);

  return (
    <div className="flex w-full flex-col gap-3">
      <OnboardingTile>
        <IconBell aria-hidden />
      </OnboardingTile>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-base-foreground">Get critical alarms on this device</p>
        <p className="text-sm text-muted-foreground">
          {answer === 'on'
            ? 'Notifications are on. Change this at any time in your profile.'
            : answer === 'later'
              ? 'Not now. You can turn them on later in your profile.'
              : 'Your browser asks for permission next. Only critical alarms for your areas are sent.'}
        </p>
      </div>
      {answer === null ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setAnswer('on')}>
            Turn on notifications
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAnswer('later')}>
            Not now
          </Button>
        </div>
      ) : (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setAnswer(null)}>
            Reset example
          </Button>
        </div>
      )}
    </div>
  );
}

function OnboardingSkipSetup() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-base-foreground">Skip the rest of setup?</p>
        <p className="text-sm text-muted-foreground">
          Alarms stay off until a rule exists. Pick up where you left off from Settings, under Setup.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm">
          Skip for now
        </Button>
        <Button variant="ghost" size="sm">
          Keep going
        </Button>
      </div>
    </div>
  );
}

function OnboardingFeatureCard() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <Button variant="outline" size="sm" onClick={() => setDismissed(false)}>
        Show announcement again
      </Button>
    );
  }

  return (
    <OnboardingCard>
      <div className="flex items-center justify-between gap-4">
        <OnboardingTile>
          <IconGitCompare aria-hidden />
        </OnboardingTile>
        <Badge variant="secondary">New in March</Badge>
      </div>
      <div className="flex flex-col gap-1">
        <h4 className="text-base font-medium text-base-foreground">Compare two time ranges</h4>
        <p className="text-sm text-muted-foreground">
          Put last week next to this week in the same chart to see what changed after a restart or an overhaul.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm">Try it on a chart</Button>
        <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      </div>
    </OnboardingCard>
  );
}

function OnboardingFeatureBanner() {
  const [version, setVersion] = useState(0);
  const [closed, setClosed] = useState(false);

  return (
    <div className="flex w-full flex-col items-start gap-3">
      <Banner key={version} variant="info" inset onClose={() => setClosed(true)}>
        <BannerIcon icon={IconSparkles} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Alarms can now be shelved</span>
        </BannerTitle>
        <BannerActions>
          <BannerAction>Show me</BannerAction>
          <BannerClose>Dismiss</BannerClose>
        </BannerActions>
      </Banner>
      {closed ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setVersion(version + 1);
            setClosed(false);
          }}
        >
          Show banner again
        </Button>
      ) : null}
    </div>
  );
}

function OnboardingWhatsNew() {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex min-h-7 items-center justify-between gap-4">
        <h4 className="text-sm font-medium text-base-foreground">What&apos;s new</h4>
        <Button
          variant="ghost"
          size="sm"
          render={<a href="https://docs.cognite.com/cdf/" target="_blank" rel="noreferrer" />}
        >
          All release notes <IconExternalLink />
        </Button>
      </div>
      <ul className="flex flex-col">
        {WHATS_NEW.map((entry, index) => (
          <li key={entry.id} className="flex items-center gap-4 border-t border-default py-3 first:border-t-0">
            <span className="w-12 shrink-0 text-xs tabular-nums text-muted-foreground">{entry.date}</span>
            <span className={`min-w-0 flex-1 truncate text-sm ${index === 0 ? 'font-medium text-base-foreground' : 'text-medium-foreground'}`}>
              {entry.title}
            </span>
            <Badge variant="secondary">{entry.tag}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OnboardingDismissibleTip() {
  const [mountKey, setMountKey] = useState(0);
  const [dismissed, setDismissed] = useState(() => tipDismissals.isDismissed('tip-star-assets'));

  const restore = () => {
    tipDismissals.restore('tip-star-assets');
    setDismissed(false);
    setMountKey(mountKey + 1);
  };

  return (
    <div className="flex w-full flex-col items-start gap-3">
      <DismissibleAlert
        key={mountKey}
        id="tip-star-assets"
        store={tipDismissals}
        icon={<IconBulb />}
        onDismiss={() => setDismissed(true)}
      >
        <AlertTitle>Star the assets you watch</AlertTitle>
        <AlertDescription>Starred assets show their alarms and work orders on your overview.</AlertDescription>
      </DismissibleAlert>
      {dismissed ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Dismissed tips do not come back on the next visit.</span>
          <Button variant="ghost" size="sm" onClick={restore}>
            Reset example
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function OnboardingCoachMark() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex w-full max-w-sm flex-col items-end">
      <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-default px-4 py-2">
        <span className="text-sm font-medium text-base-foreground">Discharge pressure</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            24 h
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            <IconGitCompare /> Compare
          </Button>
        </div>
      </div>
      {open ? (
        <div role="note" className="relative mt-3 mr-2 flex w-64 flex-col gap-2 rounded-lg border border-emphasized bg-base-background p-3">
          <span
            aria-hidden
            className="absolute -top-1.5 right-8 size-3 rotate-45 border-t border-l border-emphasized bg-base-background"
          />
          <p className="text-sm font-medium text-base-foreground">Compare is new</p>
          <p className="text-sm text-muted-foreground">Overlay an earlier period to see what changed.</p>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">Hint dismissed. Select Compare to show it again.</p>
      )}
    </div>
  );
}

function OnboardingTourStep() {
  const [index, setIndex] = useState(1);
  const step = TOUR_STEPS[index];
  const last = index === TOUR_STEPS.length - 1;

  return (
    <section aria-label="Product tour" className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-default p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-medium tabular-nums text-muted-foreground" aria-live="polite">
          Step {index + 1} of {TOUR_STEPS.length}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setIndex(0)}>
          <IconX /> End tour
        </Button>
      </div>
      <div className="flex min-h-20 flex-col gap-1">
        <h4 className="text-base font-medium text-base-foreground">{step.title}</h4>
        <p className="text-sm text-muted-foreground">{step.body}</p>
      </div>
      <Progress value={index + 1} max={TOUR_STEPS.length} size="sm" aria-label="Tour progress" />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          Back
        </Button>
        <Button size="sm" onClick={() => setIndex(last ? 0 : index + 1)}>
          {last ? 'Finish' : 'Next'}
        </Button>
      </div>
    </section>
  );
}

function OnboardingShortcutSheet() {
  return (
    <div className="flex w-full flex-col gap-2">
      <h4 className="text-sm font-medium text-base-foreground">Keyboard shortcuts</h4>
      <ul className="flex flex-col">
        {SHORTCUTS.map((shortcut) => (
          <li key={shortcut.label} className="flex min-h-9 items-center justify-between gap-4 border-t border-default first:border-t-0">
            <span className="min-w-0 truncate text-sm text-medium-foreground">{shortcut.label}</span>
            <ShortcutHint keys={shortcut.keys} mode={shortcut.mode} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function OnboardingInlineHint() {
  return (
    <div className="flex w-full flex-col">
      <Label htmlFor="onboarding-hint-tags">Time series to add</Label>
      <Textarea id="onboarding-hint-tags" rows={3} placeholder="23-PT-92531" />
      <HelperText icon={<IconBulb />}>Paste a list of tags, one per line. Up to 50 at a time.</HelperText>
    </div>
  );
}

function OnboardingGuideLinks() {
  return (
    <div className="flex w-full flex-col gap-2">
      <h4 className="text-sm font-medium text-base-foreground">Learn the basics</h4>
      <ul className="flex flex-col">
        {GUIDES.map((guide) => (
          <li key={guide.id}>
            <a
              href="https://docs.cognite.com/cdf/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-lg px-2 py-2 outline-none transition-colors hover:bg-accent-background focus-visible:shadow-focus-ring"
            >
              <IconBook aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm text-base-foreground">{guide.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{guide.meta}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
        <IconExternalLink aria-hidden className="size-4" /> Guides open in a new tab.
      </div>
    </div>
  );
}

export default definePage({
  id: 'onboarding',
  title: 'Onboarding',
  summary:
    'The first minutes in the product and the first meeting with a new feature: a welcome that says what happens next, setup that shows progress, announcements that can be dismissed, and hints placed where the work is.',
  guidance: {
    use: [
      'One next step at a time, with an honest estimate of how long it takes.',
      'Progress that is visible and resumable; setup can be left and picked up.',
      'Sample data and a skip, so nobody is locked out until setup is done.',
      'Hints next to the control they explain, dismissed for good with one click.',
    ],
    avoid: [
      'A tour that blocks the product before the user has seen it.',
      'Several announcements, tips and banners on the same screen.',
      'Celebration without information; say what is now working.',
      'Tips that come back after they were dismissed.',
    ],
  },
  source,
  sections: [
    {
      id: 'welcome',
      title: 'Welcome and first run',
      description: 'The first screen of an empty product: who it is for, what happens next, and a way to look around first.',
      specimens: [
        {
          id: 'OnboardingWelcomeCard',
          title: 'Welcome card',
          note: 'The first sign-in: greet by name, say what setup involves and how long it takes.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: OnboardingWelcomeCard,
        },
        {
          id: 'OnboardingEmptyApp',
          title: 'Empty app, first run',
          note: 'Setup was skipped and the app is empty: the page itself points to the step that fills it.',
          origin: 'custom',
          size: 'md',
          Component: OnboardingEmptyApp,
        },
        {
          id: 'OnboardingPersonaPicker',
          title: 'Role picker',
          note: 'The product differs by role: ask once, explain what the answer changes, and allow changing it later.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/ChoiceCardGroup.tsx'],
          Component: OnboardingPersonaPicker,
        },
        {
          id: 'OnboardingSampleData',
          title: 'Sample-data offer',
          note: 'Connecting real data takes time: offer a safe, removable sample so people can explore now. Click to load.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['actions/AsyncButton.tsx'],
          Component: OnboardingSampleData,
        },
      ],
    },
    {
      id: 'setup',
      title: 'Setup',
      description: 'Getting from an empty project to a working one, with progress that can be seen and resumed.',
      specimens: [
        {
          id: 'OnboardingSetupChecklist',
          title: 'Setup checklist',
          note: 'Several steps over more than one session: progress, the next step open, the rest listed. Click to advance.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/SetupChecklist.tsx'],
          Component: OnboardingSetupChecklist,
        },
        {
          id: 'OnboardingGettingStarted',
          title: 'Getting-started steps',
          note: 'A short path to a first result: three numbered steps and one button that starts the first.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: OnboardingGettingStarted,
        },
        {
          id: 'OnboardingConnectData',
          title: 'Connect-your-data cards',
          note: 'Several ways to do the same step: one card each with effort and requirements, one marked as recommended.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: OnboardingConnectData,
        },
        {
          id: 'OnboardingStepHeader',
          title: 'Setup flow header',
          note: 'A guided flow in fixed order: where the user is, what is done and what is left. Click to step.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          Component: OnboardingStepHeader,
        },
        {
          id: 'OnboardingResumeCard',
          title: 'Resume setup',
          note: 'Setup was left unfinished: a small card on the overview says what is next.',
          origin: 'custom',
          align: 'stretch',
          Component: OnboardingResumeCard,
        },
      ],
    },
    {
      id: 'steps-and-outcomes',
      title: 'Steps and outcomes',
      description: 'Single steps of setup, and what the user sees when one of them, or all of them, worked.',
      specimens: [
        {
          id: 'OnboardingInviteTeammates',
          title: 'Invite teammates',
          note: 'The invite step: add people one by one with an access level, review the list, send or skip.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx'],
          Component: OnboardingInviteTeammates,
        },
        {
          id: 'OnboardingCompletion',
          title: 'Completion',
          note: 'Setup is done: say what is now working, in numbers, and lead into the product.',
          origin: 'custom',
          size: 'md',
          Component: OnboardingCompletion,
        },
        {
          id: 'OnboardingFirstSuccess',
          title: 'First success',
          note: 'The first data point arrived: confirm it with the actual value, so the user knows it is real.',
          origin: 'custom',
          align: 'stretch',
          Component: OnboardingFirstSuccess,
        },
        {
          id: 'OnboardingNotificationsOptIn',
          title: 'Permission primer',
          note: 'Before the browser asks for permission: say what will be sent and let people decline. Click to try.',
          origin: 'custom',
          align: 'stretch',
          Component: OnboardingNotificationsOptIn,
        },
        {
          id: 'OnboardingSkipSetup',
          title: 'Skip setup',
          note: 'Leaving setup early: say what stays off and where to resume, without pressure.',
          origin: 'custom',
          align: 'stretch',
          Component: OnboardingSkipSetup,
        },
      ],
    },
    {
      id: 'announcements',
      title: 'Announcements',
      description: 'Telling existing users about something new. One at a time, always dismissible.',
      specimens: [
        {
          id: 'OnboardingFeatureCard',
          title: 'Feature announcement card',
          note: 'A feature worth a few sentences: what it is for, a way to try it, and a way to dismiss it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: OnboardingFeatureCard,
        },
        {
          id: 'OnboardingWhatsNew',
          title: 'What is new list',
          note: 'A running record of changes: date, one line and the area it belongs to, newest first.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: OnboardingWhatsNew,
        },
        {
          id: 'OnboardingFeatureBanner',
          title: 'Feature announcement banner',
          note: 'A small change on the page where it applies: one line, one link, dismissible.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: OnboardingFeatureBanner,
        },
        {
          id: 'OnboardingDismissibleTip',
          title: 'Dismissible tip',
          note: 'A tip people need once: closing it is remembered, so it does not return on the next visit.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/DismissibleAlert.tsx', 'feedback/dismissalStore.ts'],
          Component: OnboardingDismissibleTip,
        },
      ],
    },
    {
      id: 'guidance',
      title: 'Guidance in place',
      description: 'Help that sits next to the work: a hint on a control, a short tour, shortcuts and guides.',
      specimens: [
        {
          id: 'OnboardingCoachMark',
          title: 'Coach mark',
          note: 'One new control: a static look-alike of a hint that points at it and is dismissed with one click.',
          origin: 'custom',
          size: 'md',
          Component: OnboardingCoachMark,
        },
        {
          id: 'OnboardingTourStep',
          title: 'Tour step card',
          note: 'A short tour of four stops: step count, Back and Next, and a way out on every step. Click to step.',
          origin: 'custom',
          size: 'md',
          Component: OnboardingTourStep,
        },
        {
          id: 'OnboardingShortcutSheet',
          title: 'Shortcut cheat sheet',
          note: 'For people who use the product all day: the few shortcuts worth learning, with the right keys per platform.',
          origin: 'custom',
          align: 'stretch',
          uses: ['actions/ShortcutHint.tsx'],
          Component: OnboardingShortcutSheet,
        },
        {
          id: 'OnboardingInlineHint',
          title: 'Inline hint',
          note: 'A field with a faster way to use it: say so under the field, where it is read at the right moment.',
          origin: 'custom',
          align: 'stretch',
          Component: OnboardingInlineHint,
        },
        {
          id: 'OnboardingGuideLinks',
          title: 'Guide links',
          note: 'Reading for later: three guides with their length, opening outside the product.',
          origin: 'custom',
          align: 'stretch',
          Component: OnboardingGuideLinks,
        },
      ],
    },
  ],
});
