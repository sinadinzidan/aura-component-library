import { Avatar, AvatarFallback } from '@cognite/aura/components/avatar';
import {
  Banner,
  BannerAction,
  BannerActions,
  BannerClose,
  BannerIcon,
  BannerStatus,
  BannerTitle,
} from '@cognite/aura/components/banner';
import { Button } from '@cognite/aura/components/button';
import { Loader } from '@cognite/aura/components/loader';
import {
  IconAlertCircleFilled,
  IconAlertTriangleFilled,
  IconEyeFilled,
  IconFlask,
  IconInfoCircleFilled,
  IconLockFilled,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { PLANT_KPIS } from '../../data/plant';
import { definePage } from '../../types';

import source from './banner.tsx?raw';

// BannerTitle sets a fixed dark text colour that is unreadable on the dark-theme tints, so each
// title wraps its text in a span that carries the themed foreground token (and truncates).
const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const QUEUED_MESSAGES = [
  { id: 'extractor', variant: 'destructive', icon: IconAlertCircleFilled, title: 'Extractor disconnected. Live values are paused.' },
  { id: 'quota', variant: 'warning', icon: IconAlertTriangleFilled, title: 'Storage is 92% full.' },
  { id: 'release', variant: 'info', icon: IconInfoCircleFilled, title: 'Charts now support dual axes.' },
] as const;

function BannerDefault() {
  return (
    <div className="w-full">
      <Banner inset>
        <BannerIcon icon={IconInfoCircleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">This workspace is in preview mode</span>
        </BannerTitle>
      </Banner>
    </div>
  );
}

function BannerInfo() {
  return (
    <div className="w-full">
      <Banner variant="info" inset>
        <BannerIcon icon={IconInfoCircleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">New data is available for this dashboard</span>
        </BannerTitle>
      </Banner>
    </div>
  );
}

function BannerWarning() {
  return (
    <div className="w-full">
      <Banner variant="warning" inset>
        <BannerIcon icon={IconAlertTriangleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Your trial ends in 5 days</span>
        </BannerTitle>
      </Banner>
    </div>
  );
}

function BannerDestructive() {
  return (
    <div className="w-full">
      <Banner variant="destructive" inset>
        <BannerIcon icon={IconAlertCircleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Couldn&apos;t save the dashboard layout</span>
        </BannerTitle>
      </Banner>
    </div>
  );
}

function BannerWithAction() {
  return (
    <div className="w-full">
      <Banner variant="info" inset>
        <BannerIcon icon={IconInfoCircleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">A newer model version is published</span>
        </BannerTitle>
        <BannerActions>
          <BannerAction>View changes</BannerAction>
        </BannerActions>
      </Banner>
    </div>
  );
}

function BannerWithTwoActions() {
  return (
    <div className="w-full">
      <Banner variant="warning" inset>
        <BannerIcon icon={IconAlertTriangleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">API key expires on 20 March</span>
        </BannerTitle>
        <BannerActions>
          <BannerAction>Rotate key</BannerAction>
          <BannerClose>Dismiss</BannerClose>
        </BannerActions>
      </Banner>
    </div>
  );
}

function BannerWithStatus() {
  return (
    <div className="w-full">
      <Banner variant="destructive" inset>
        <BannerIcon icon={IconAlertCircleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Historian sync is failing</span>
        </BannerTitle>
        <BannerStatus>3 runs failed</BannerStatus>
      </Banner>
    </div>
  );
}

function BannerDismissible() {
  const [version, setVersion] = useState(0);
  const [closed, setClosed] = useState(false);

  const showAgain = () => {
    setVersion(version + 1);
    setClosed(false);
  };

  return (
    <div className="flex w-full flex-col items-start gap-3">
      <Banner key={version} variant="info" inset onClose={() => setClosed(true)}>
        <BannerIcon icon={IconInfoCircleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Scheduled maintenance finished</span>
        </BannerTitle>
        <BannerActions>
          <BannerClose>Dismiss</BannerClose>
        </BannerActions>
      </Banner>
      {closed ? (
        <Button variant="outline" size="sm" onClick={showAgain}>
          Show banner again
        </Button>
      ) : null}
    </div>
  );
}

function BannerIconClose() {
  const [version, setVersion] = useState(0);
  const [closed, setClosed] = useState(false);

  const showAgain = () => {
    setVersion(version + 1);
    setClosed(false);
  };

  return (
    <div className="flex w-full flex-col items-start gap-3">
      <Banner key={version} inset onClose={() => setClosed(true)}>
        <BannerIcon icon={IconInfoCircleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Keyboard shortcuts have changed</span>
        </BannerTitle>
        <BannerActions>
          <BannerAction>See shortcuts</BannerAction>
          <BannerClose aria-label="Dismiss">
            <IconX />
          </BannerClose>
        </BannerActions>
      </Banner>
      {closed ? (
        <Button variant="outline" size="sm" onClick={showAgain}>
          Show banner again
        </Button>
      ) : null}
    </div>
  );
}

function BannerLongTitle() {
  const title = 'Ingestion from the plant historian is delayed by about 12 minutes while the gateway restarts';

  return (
    <div className="w-full">
      <Banner variant="warning" inset>
        <BannerIcon icon={IconAlertTriangleFilled} />
        <BannerTitle title={title}>
          <span className="truncate text-base-foreground">{title}</span>
        </BannerTitle>
        <BannerActions>
          <BannerAction>View status</BannerAction>
        </BannerActions>
      </Banner>
    </div>
  );
}

function BannerInset() {
  return (
    <div className="flex w-full flex-col gap-4 rounded-xl bg-muted-background p-4">
      <Banner variant="info" inset>
        <BannerIcon icon={IconInfoCircleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Results are limited to the last 30 days</span>
        </BannerTitle>
      </Banner>
      <p className="text-sm text-muted-foreground">Padded content: the banner follows the content edge and rounds its corners.</p>
    </div>
  );
}

function BannerEdgeToEdge() {
  return (
    <div className="w-full overflow-hidden rounded-xl bg-muted-background">
      <Banner variant="info">
        <BannerIcon icon={IconInfoCircleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Results are limited to the last 30 days</span>
        </BannerTitle>
      </Banner>
      <p className="p-4 text-sm text-muted-foreground">Page or panel top: the banner spans the full width with square corners.</p>
    </div>
  );
}

function BannerControlled() {
  const [visible, setVisible] = useState(true);

  return (
    <div className="flex w-full flex-col items-start gap-3">
      <Banner variant="warning" inset visible={visible} onClose={() => setVisible(false)}>
        <BannerIcon icon={IconAlertTriangleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">You have unpublished changes</span>
        </BannerTitle>
        <BannerActions>
          <BannerAction onClick={() => setVisible(false)}>Publish</BannerAction>
          <BannerClose>Dismiss</BannerClose>
        </BannerActions>
      </Banner>
      {visible ? null : (
        <Button variant="outline" size="sm" onClick={() => setVisible(true)}>
          Edit again
        </Button>
      )}
    </div>
  );
}

function BannerPersistent() {
  return (
    <div className="w-full">
      <Banner variant="warning" inset>
        <BannerIcon icon={IconAlertTriangleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Maintenance in progress. Writes are paused.</span>
        </BannerTitle>
        <BannerStatus>Until 04:00 UTC</BannerStatus>
      </Banner>
    </div>
  );
}

function BannerResolving() {
  const [state, setState] = useState<'failed' | 'working' | 'resolved'>('failed');

  const retry = () => {
    setState('working');
    void wait(1600).then(() => setState('resolved'));
  };

  if (state === 'resolved') {
    return (
      <div className="flex w-full items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Layout saved. The banner leaves once the problem is gone.</p>
        <Button variant="outline" size="sm" onClick={() => setState('failed')}>
          Reset example
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Banner variant="destructive" inset>
        <BannerIcon icon={IconAlertCircleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Couldn&apos;t save the dashboard layout</span>
        </BannerTitle>
        <BannerActions>
          <BannerAction aria-busy={state === 'working' || undefined} onClick={state === 'working' ? undefined : retry}>
            {state === 'working' ? <Loader size={16} aria-hidden /> : null}
            {state === 'working' ? 'Saving…' : 'Retry save'}
          </BannerAction>
        </BannerActions>
      </Banner>
    </div>
  );
}

function BannerPrioritised() {
  const [index, setIndex] = useState(0);
  const message = QUEUED_MESSAGES[index];

  return (
    <div className="w-full">
      <Banner variant={message.variant} inset>
        <BannerIcon icon={message.icon} />
        <BannerTitle>
          <span className="truncate text-base-foreground">{message.title}</span>
        </BannerTitle>
        <BannerActions>
          <span className="text-sm text-base-foreground tabular-nums">
            {index + 1} of {QUEUED_MESSAGES.length}
          </span>
          <BannerAction onClick={() => setIndex((index + 1) % QUEUED_MESSAGES.length)}>Next</BannerAction>
        </BannerActions>
      </Banner>
    </div>
  );
}

function BannerAppShell() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-default">
      <div className="flex h-12 items-center justify-between gap-4 bg-muted-background px-4">
        <p className="text-sm text-muted-foreground">
          Nordkapp <span aria-hidden>/</span> <span className="font-medium text-base-foreground">Gas compression</span>
        </p>
        <Avatar sizes="xsm">
          <AvatarFallback>IH</AvatarFallback>
        </Avatar>
      </div>
      <Banner variant="destructive">
        <BannerIcon icon={IconAlertCircleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Extractor disconnected. Live values are paused.</span>
        </BannerTitle>
        <BannerStatus>Since 13:42</BannerStatus>
        <BannerActions>
          <BannerAction>Reconnect</BannerAction>
          <BannerAction>View status</BannerAction>
        </BannerActions>
      </Banner>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-4">
          <h4 className="text-xl font-semibold text-base-foreground">Gas compression</h4>
          <Button variant="secondary" size="sm">
            Export data
          </Button>
        </div>
        <dl className="grid grid-cols-3 gap-4">
          <div>
            <dt className="text-xs text-muted-foreground">Availability</dt>
            <dd className="text-xl font-semibold text-base-foreground tabular-nums">{PLANT_KPIS.availability.value}%</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Gas export</dt>
            <dd className="text-xl font-semibold text-base-foreground tabular-nums">
              {PLANT_KPIS.gasExport.value} <span className="text-sm font-medium text-muted-foreground">MSm³/d</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Active alarms</dt>
            <dd className="text-xl font-semibold text-base-foreground tabular-nums">{PLANT_KPIS.activeAlarms.value}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function BannerReadOnly() {
  const [requested, setRequested] = useState(false);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-default">
      <Banner>
        <BannerIcon icon={IconLockFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">{requested ? 'Edit access requested' : 'This data model is read-only for you'}</span>
        </BannerTitle>
        <BannerActions>
          <BannerAction disabled={requested} onClick={() => setRequested(true)}>
            {requested ? 'Request sent' : 'Request edit access'}
          </BannerAction>
        </BannerActions>
      </Banner>
      <div className="flex flex-col gap-1 p-4">
        <h4 className="text-base font-medium text-base-foreground">Compressor performance model</h4>
        <p className="text-sm text-muted-foreground">Version 3, published by Aisha Khan</p>
      </div>
    </div>
  );
}

function BannerTrial() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-default">
      <Banner variant="warning">
        <BannerIcon icon={IconAlertTriangleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Your trial ends in 5 days</span>
        </BannerTitle>
        <BannerActions>
          <BannerAction>Compare plans</BannerAction>
          <BannerClose>Dismiss</BannerClose>
        </BannerActions>
      </Banner>
      <div className="flex flex-col gap-1 p-4">
        <h4 className="text-base font-medium text-base-foreground">Workspace settings</h4>
        <p className="text-sm text-muted-foreground">Plan, members and billing for Nordkapp operations.</p>
      </div>
    </div>
  );
}

function BannerNewData() {
  const [pending, setPending] = useState(128);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-default">
      <Banner variant="info" visible={pending > 0}>
        <BannerIcon icon={IconInfoCircleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">{pending} new data points available</span>
        </BannerTitle>
        <BannerActions>
          <BannerAction onClick={() => setPending(0)}>Refresh chart</BannerAction>
        </BannerActions>
      </Banner>
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="flex flex-col gap-1">
          <h4 className="text-base font-medium text-base-foreground">Discharge pressure</h4>
          <p className="text-sm text-muted-foreground">{pending > 0 ? 'Showing data up to 13:42' : 'Up to date'}</p>
        </div>
        {pending > 0 ? null : (
          <Button variant="outline" size="sm" onClick={() => setPending(128)}>
            Reset example
          </Button>
        )}
      </div>
    </div>
  );
}

function BannerEnvironment() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-default">
      <Banner>
        <BannerIcon icon={IconFlask} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Changes here do not affect production</span>
        </BannerTitle>
        <BannerStatus>Staging</BannerStatus>
      </Banner>
      <div className="flex flex-col gap-1 p-4">
        <h4 className="text-base font-medium text-base-foreground">Transformations</h4>
        <p className="text-sm text-muted-foreground">12 transformations, 3 scheduled</p>
      </div>
    </div>
  );
}

function BannerInSection() {
  return (
    <section className="flex w-full flex-col gap-4 rounded-xl border border-default p-4">
      <Banner inset>
        <BannerIcon icon={IconEyeFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Anomaly detection is in preview</span>
        </BannerTitle>
        <BannerActions>
          <BannerAction>Give feedback</BannerAction>
        </BannerActions>
      </Banner>
      <div className="flex flex-col gap-1">
        <h4 className="text-base font-medium text-base-foreground">Detected anomalies</h4>
        <p className="text-sm text-muted-foreground">2 anomalies on 23-KA-9101 in the last 24 hours.</p>
      </div>
    </section>
  );
}

function BannerViewingAs() {
  const [viewing, setViewing] = useState(true);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-default">
      <Banner variant="info" visible={viewing}>
        <BannerIcon icon={IconEyeFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">You are viewing this dashboard as a control room operator</span>
        </BannerTitle>
        <BannerActions>
          <BannerAction onClick={() => setViewing(false)}>Exit view</BannerAction>
        </BannerActions>
      </Banner>
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="flex flex-col gap-1">
          <h4 className="text-base font-medium text-base-foreground">Shift handover</h4>
          <p className="text-sm text-muted-foreground">{viewing ? 'Editing is turned off in this view.' : 'Back in your own view.'}</p>
        </div>
        {viewing ? null : (
          <Button variant="outline" size="sm" onClick={() => setViewing(true)}>
            View as operator
          </Button>
        )}
      </div>
    </div>
  );
}

export default definePage({
  id: 'banner',
  title: 'Banner',
  summary:
    'Banners announce state that applies to a whole page or section and stay visible while people keep working. One line high, at the top of the area they describe.',
  docsSlug: 'banner-alert',
  guidance: {
    use: [
      'Environment or product state: maintenance, trial, preview, read-only.',
      'Page-wide problems that stay until they are resolved, with the action that resolves them.',
      'One short sentence, led by an icon that matches the variant.',
      'Dismissible, unless the state it describes is still active.',
    ],
    avoid: [
      'Stacking banners; combine the messages or show the most urgent one.',
      'Routine or transient notices such as a save confirmation (use a toast).',
      'Guidance that belongs to one task or field (use an alert or helper text).',
      'Actions that do not resolve or explain the message.',
    ],
  },
  source,
  sections: [
    {
      id: 'variants',
      title: 'Variants',
      description: 'Four levels. The colour carries the urgency, so pick the lowest one that is true.',
      specimens: [
        {
          id: 'BannerDefault',
          title: 'Default',
          note: 'Neutral state such as preview or read-only mode.',
          origin: 'aura',
          size: 'md',
          Component: BannerDefault,
        },
        {
          id: 'BannerInfo',
          title: 'Info',
          note: 'A helpful update, such as new data or a new version being available.',
          origin: 'aura',
          size: 'md',
          Component: BannerInfo,
        },
        {
          id: 'BannerWarning',
          title: 'Warning',
          note: 'An upcoming issue the user can still prevent, such as an expiring trial.',
          origin: 'aura',
          size: 'md',
          Component: BannerWarning,
        },
        {
          id: 'BannerDestructive',
          title: 'Destructive',
          note: 'A failure that affects the whole page, such as a failed save or lost connection.',
          origin: 'aura',
          size: 'md',
          Component: BannerDestructive,
        },
      ],
    },
    {
      id: 'content',
      title: 'Content and placement',
      description: 'What sits on the line next to the title, and how the banner meets its container.',
      specimens: [
        {
          id: 'BannerWithAction',
          title: 'With action',
          note: 'There is one thing to do about the message.',
          origin: 'aura',
          size: 'md',
          Component: BannerWithAction,
        },
        {
          id: 'BannerWithTwoActions',
          title: 'Action and dismiss',
          note: 'A resolving action plus a way to put the message away for now.',
          origin: 'aura',
          size: 'md',
          Component: BannerWithTwoActions,
        },
        {
          id: 'BannerWithStatus',
          title: 'With status',
          note: 'A short fact, such as a count or a time, that qualifies the title.',
          origin: 'aura',
          size: 'md',
          Component: BannerWithStatus,
        },
        {
          id: 'BannerLongTitle',
          title: 'Long title',
          note: 'Banners stay one line high: truncate and keep the full text in a tooltip or status page.',
          origin: 'aura',
          size: 'md',
          Component: BannerLongTitle,
        },
        {
          id: 'BannerDismissible',
          title: 'Dismissible',
          note: 'The state has passed and the message is only there to be acknowledged.',
          origin: 'aura',
          size: 'md',
          Component: BannerDismissible,
        },
        {
          id: 'BannerIconClose',
          title: 'Icon close',
          note: 'Space is tight and another text action already sits on the line.',
          origin: 'aura',
          size: 'md',
          Component: BannerIconClose,
        },
        {
          id: 'BannerInset',
          title: 'Inset',
          note: 'The banner sits inside padded content and should follow its edges.',
          origin: 'aura',
          size: 'md',
          Component: BannerInset,
        },
        {
          id: 'BannerEdgeToEdge',
          title: 'Edge to edge',
          note: 'The banner tops a page, panel or card and spans its full width.',
          origin: 'aura',
          size: 'md',
          Component: BannerEdgeToEdge,
        },
      ],
    },
    {
      id: 'behaviour',
      title: 'Behaviour',
      description: 'When the banner appears, when it leaves, and what to do when several compete.',
      specimens: [
        {
          id: 'BannerControlled',
          title: 'Controlled visibility',
          note: 'Your state decides when it shows, for example while there are unpublished changes.',
          origin: 'aura',
          size: 'md',
          Component: BannerControlled,
        },
        {
          id: 'BannerPersistent',
          title: 'Persistent',
          note: 'The state is still active, so there is no dismiss; it leaves when the state ends.',
          origin: 'aura',
          size: 'md',
          Component: BannerPersistent,
        },
        {
          id: 'BannerResolving',
          title: 'Resolving action',
          note: 'The action fixes the problem in place and the banner leaves with it. Click to try.',
          origin: 'custom',
          size: 'md',
          Component: BannerResolving,
        },
        {
          id: 'BannerPrioritised',
          title: 'One at a time',
          note: 'Several messages compete: show the most urgent first and let people step through.',
          origin: 'custom',
          size: 'md',
          Component: BannerPrioritised,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Banners on the page or section they describe.',
      specimens: [
        {
          id: 'BannerAppShell',
          title: 'Below the topbar',
          note: 'A system problem that affects everything on the page sits between the topbar and the page header.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: BannerAppShell,
        },
        {
          id: 'BannerReadOnly',
          title: 'Read-only page',
          note: 'Explains why nothing can be edited and offers the way to unlock it.',
          origin: 'custom',
          size: 'md',
          Component: BannerReadOnly,
        },
        {
          id: 'BannerTrial',
          title: 'Trial ending',
          note: 'Account state with a deadline; dismissible because the user cannot always act on it.',
          origin: 'custom',
          size: 'md',
          Component: BannerTrial,
        },
        {
          id: 'BannerNewData',
          title: 'New data available',
          note: 'The view is stale and refreshing would move things; let the user choose when.',
          origin: 'custom',
          size: 'md',
          Component: BannerNewData,
        },
        {
          id: 'BannerEnvironment',
          title: 'Environment',
          note: 'A non-production environment that must never be mistaken for production.',
          origin: 'custom',
          size: 'md',
          Component: BannerEnvironment,
        },
        {
          id: 'BannerInSection',
          title: 'Section preview',
          note: 'One section of a page is in preview; the banner sits inside that section only.',
          origin: 'custom',
          size: 'md',
          Component: BannerInSection,
        },
        {
          id: 'BannerViewingAs',
          title: 'Temporary mode',
          note: 'The user switched into a mode that changes what they see, with the way back out.',
          origin: 'custom',
          size: 'md',
          Component: BannerViewingAs,
        },
      ],
    },
  ],
});
