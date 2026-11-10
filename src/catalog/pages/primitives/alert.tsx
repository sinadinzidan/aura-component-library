import {
  Alert,
  AlertActions,
  AlertButton,
  AlertDescription,
  AlertTitle,
} from '@cognite/aura/components/alert';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Loader } from '@cognite/aura/components/loader';
import { IconCircleCheckFilled, IconClockHour4, IconLock, IconPlugConnectedX } from '@cognite/aura/icons';
import { useState } from 'react';

import { createMemoryDismissalStore } from '../../../library/feedback/dismissalStore';
import { DismissibleAlert } from '../../../library/feedback/DismissibleAlert';
import { SENSORS } from '../../data/plant';
import { definePage } from '../../types';

import source from './alert.tsx?raw';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const sessionDismissals = createMemoryDismissalStore();

const BAD_QUALITY_SENSORS = SENSORS.filter((sensor) => sensor.quality !== 'good');

function AlertDefault() {
  return (
    <div className="w-full max-w-md">
      <Alert>
        <AlertTitle>Units follow the source system</AlertTitle>
        <AlertDescription>Pressure is shown in barg, as reported by the plant historian.</AlertDescription>
      </Alert>
    </div>
  );
}

function AlertInfo() {
  return (
    <div className="w-full max-w-md">
      <Alert variant="info">
        <AlertTitle>New data model version available</AlertTitle>
        <AlertDescription>Version 4 adds maintenance history to every asset.</AlertDescription>
      </Alert>
    </div>
  );
}

function AlertWarning() {
  return (
    <div className="w-full max-w-md">
      <Alert variant="warning">
        <AlertTitle>Drive-end vibration is close to its limit</AlertTitle>
        <AlertDescription>23-VT-92540 reads 6.8 mm/s. The high limit is 7.1 mm/s.</AlertDescription>
      </Alert>
    </div>
  );
}

function AlertError() {
  return (
    <div className="w-full max-w-md">
      <Alert variant="error">
        <AlertTitle>Ingestion failed</AlertTitle>
        <AlertDescription>Check your extractor configuration and try again.</AlertDescription>
      </Alert>
    </div>
  );
}

function AlertStrip() {
  return (
    <div className="w-full max-w-2xl">
      <Alert variant="info" alertStyle="strip">
        <AlertDescription>Values on this page refresh every 30 seconds.</AlertDescription>
      </Alert>
    </div>
  );
}

function AlertStripWithAction() {
  return (
    <div className="w-full max-w-2xl">
      <Alert variant="warning" alertStyle="strip">
        <AlertDescription>You are viewing data from 13:42. Newer values are available.</AlertDescription>
        <AlertActions>
          <AlertButton variant="ghost">Refresh data</AlertButton>
        </AlertActions>
      </Alert>
    </div>
  );
}

function AlertTitleOnly() {
  return (
    <div className="w-full max-w-sm">
      <Alert variant="warning">
        <AlertTitle>Schedule not saved yet</AlertTitle>
      </Alert>
    </div>
  );
}

function AlertDescriptionOnly() {
  return (
    <div className="w-full max-w-sm">
      <Alert>
        <AlertDescription>Only owners of this data set can change who has access.</AlertDescription>
      </Alert>
    </div>
  );
}

function AlertCustomIcon() {
  return (
    <div className="w-full max-w-sm">
      <Alert variant="info" icon={<IconClockHour4 aria-hidden />}>
        <AlertTitle>Maintenance window on Saturday</AlertTitle>
        <AlertDescription>Ingestion pauses from 02:00 to 04:00 UTC.</AlertDescription>
      </Alert>
    </div>
  );
}

function AlertWithoutIcon() {
  return (
    <div className="w-full max-w-sm">
      <Alert icon={null}>
        <AlertTitle>Tip</AlertTitle>
        <AlertDescription>Hold Shift while you drag to zoom the chart on one axis.</AlertDescription>
      </Alert>
    </div>
  );
}

function AlertWithActions() {
  return (
    <div className="w-full max-w-md">
      <Alert variant="warning">
        <AlertTitle>3 time series have no unit</AlertTitle>
        <AlertDescription>Charts cannot convert or compare them until a unit is set.</AlertDescription>
        <AlertActions>
          <AlertButton>Set units</AlertButton>
          <AlertButton variant="ghost">Show time series</AlertButton>
        </AlertActions>
      </Alert>
    </div>
  );
}

function AlertWithDetails() {
  return (
    <div className="w-full max-w-md">
      <Alert variant="error">
        <AlertTitle>Transformation stopped after 3 errors</AlertTitle>
        <AlertDescription>
          <ul className="list-disc space-y-1 pl-4">
            <li>Row 214: tag 23-KA-9104 does not exist.</li>
            <li>Row 388: timestamp is in the future.</li>
            <li>Row 412: value is not a number.</li>
          </ul>
        </AlertDescription>
        <AlertActions>
          <AlertButton variant="ghost">Download error log</AlertButton>
        </AlertActions>
      </Alert>
    </div>
  );
}

function AlertDismissible() {
  const [version, setVersion] = useState(0);
  const [closed, setClosed] = useState(false);

  const showAgain = () => {
    setVersion(version + 1);
    setClosed(false);
  };

  return (
    <div className="flex w-full max-w-md flex-col items-start gap-3">
      <Alert key={version} variant="info" onClose={() => setClosed(true)}>
        <AlertTitle>Charts now support dual axes</AlertTitle>
        <AlertDescription>Add a second axis from the series menu.</AlertDescription>
      </Alert>
      {closed ? (
        <Button variant="outline" size="sm" onClick={showAgain}>
          Show alert again
        </Button>
      ) : null}
    </div>
  );
}

function AlertControlled() {
  const [visible, setVisible] = useState(true);

  return (
    <div className="flex w-full max-w-md flex-col items-start gap-3">
      <Alert variant="warning" visible={visible} onClose={() => setVisible(false)}>
        <AlertTitle>Unsaved threshold changes</AlertTitle>
        <AlertDescription>Save before you leave, or the old limits stay active.</AlertDescription>
      </Alert>
      {visible ? null : (
        <Button variant="outline" size="sm" onClick={() => setVisible(true)}>
          Show alert again
        </Button>
      )}
    </div>
  );
}

function AlertStripDismissible() {
  const [visible, setVisible] = useState(true);

  return (
    <div className="flex w-full max-w-2xl flex-col items-start gap-3">
      <Alert alertStyle="strip" visible={visible} onClose={() => setVisible(false)}>
        <AlertDescription>Filters from your last visit are still applied.</AlertDescription>
        <AlertActions>
          <AlertButton variant="ghost">Clear filters</AlertButton>
        </AlertActions>
      </Alert>
      {visible ? null : (
        <Button variant="outline" size="sm" onClick={() => setVisible(true)}>
          Show alert again
        </Button>
      )}
    </div>
  );
}

function AlertRememberedDismissal() {
  const [mountKey, setMountKey] = useState(0);
  const [dismissed, setDismissed] = useState(() => sessionDismissals.isDismissed('maintenance-window'));

  const forget = () => {
    sessionDismissals.restore('maintenance-window');
    setDismissed(false);
    setMountKey(mountKey + 1);
  };

  return (
    <div className="flex w-full max-w-md flex-col items-start gap-3">
      <DismissibleAlert
        key={mountKey}
        id="maintenance-window"
        store={sessionDismissals}
        variant="info"
        onDismiss={() => setDismissed(true)}
      >
        <AlertTitle>Maintenance window on Saturday</AlertTitle>
        <AlertDescription>Ingestion pauses from 02:00 to 04:00 UTC.</AlertDescription>
      </DismissibleAlert>
      {dismissed ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setMountKey(mountKey + 1)}>
            Remount
          </Button>
          <Button variant="ghost" size="sm" onClick={forget}>
            Forget dismissal
          </Button>
          <span className="text-xs text-muted-foreground">Remounting keeps it closed.</span>
        </div>
      ) : null}
    </div>
  );
}

function AlertResolving() {
  const [state, setState] = useState<'failed' | 'working' | 'resolved'>('failed');

  const reconnect = () => {
    setState('working');
    void wait(1600).then(() => setState('resolved'));
  };

  if (state === 'resolved') {
    return (
      <div className="w-full max-w-md">
        <Alert icon={<IconCircleCheckFilled aria-hidden />}>
          <AlertTitle>Extractor reconnected</AlertTitle>
          <AlertDescription>Ingestion resumed. Missing values are being backfilled.</AlertDescription>
          <AlertActions>
            <AlertButton variant="ghost" onClick={() => setState('failed')}>
              Reset example
            </AlertButton>
          </AlertActions>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <Alert variant="error">
        <AlertTitle>Extractor disconnected</AlertTitle>
        <AlertDescription>No values have arrived from the plant historian since 13:42.</AlertDescription>
        <AlertActions>
          <AlertButton aria-busy={state === 'working' || undefined} onClick={state === 'working' ? undefined : reconnect}>
            {state === 'working' ? <Loader size={16} aria-hidden /> : null}
            {state === 'working' ? 'Reconnecting…' : 'Reconnect extractor'}
          </AlertButton>
        </AlertActions>
      </Alert>
    </div>
  );
}

function AlertInForm() {
  return (
    <form className="flex w-full max-w-md flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
      <Alert variant="error">
        <AlertTitle>Couldn&apos;t create data set</AlertTitle>
        <AlertDescription>Fix the external ID below and try again. Your other input is kept.</AlertDescription>
      </Alert>
      <div className="flex flex-col">
        <Label htmlFor="alert-form-name">Name</Label>
        <Input id="alert-form-name" defaultValue="Compressor vibration" />
      </div>
      <div className="flex flex-col">
        <Label htmlFor="alert-form-external-id">External ID</Label>
        <Input
          id="alert-form-external-id"
          defaultValue="compressor vibration"
          aria-invalid
          aria-describedby="alert-form-external-id-error"
        />
        <HelperText id="alert-form-external-id-error" isError>
          Use letters, numbers, hyphens and underscores only.
        </HelperText>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Create data set</Button>
      </div>
    </form>
  );
}

function AlertInCard() {
  return (
    <section className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-default p-4">
      <div className="flex items-baseline justify-between gap-4">
        <h4 className="text-sm font-medium text-base-foreground">Cooler outlet temperature</h4>
        <span className="text-xs text-muted-foreground">23-TT-91141</span>
      </div>
      <p className="text-2xl font-semibold text-base-foreground tabular-nums">
        38.9 <span className="text-sm font-medium text-muted-foreground">°C</span>
      </p>
      <Alert variant="warning">
        <AlertDescription>Signal quality is uncertain. Treat this value as indicative until the transmitter is checked.</AlertDescription>
      </Alert>
    </section>
  );
}

function AlertAboveTable() {
  return (
    <div className="flex w-full flex-col gap-4">
      <Alert variant="info" alertStyle="strip">
        <AlertDescription>Showing work orders for Nordkapp only. 14 more match at other sites.</AlertDescription>
        <AlertActions>
          <AlertButton variant="ghost">Show all sites</AlertButton>
        </AlertActions>
      </Alert>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-default text-xs text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Work order</th>
            <th className="py-2 pr-4 font-medium">Title</th>
            <th className="py-2 font-medium">Priority</th>
          </tr>
        </thead>
        <tbody className="text-base-foreground">
          <tr>
            <td className="py-2 pr-4 tabular-nums">WO-104482</td>
            <td className="py-2 pr-4">Inspect recompressor drive-end bearing</td>
            <td className="py-2">P1</td>
          </tr>
          <tr>
            <td className="py-2 pr-4 tabular-nums">WO-104479</td>
            <td className="py-2 pr-4">Replace bearing temperature transmitter</td>
            <td className="py-2">P2</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function AlertGroupedSummary() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Alert variant="warning">
        <AlertTitle>{BAD_QUALITY_SENSORS.length} sensors report degraded signal quality</AlertTitle>
        <AlertDescription>Calculations that use them are paused until quality is good again.</AlertDescription>
      </Alert>
      <ul className="flex flex-col gap-3 text-sm">
        {BAD_QUALITY_SENSORS.map((sensor) => (
          <li key={sensor.id} className="flex items-center justify-between gap-4">
            <span className="min-w-0 truncate text-base-foreground">
              {sensor.name} <span className="text-muted-foreground">{sensor.tag}</span>
            </span>
            <Badge variant={sensor.quality === 'bad' ? 'error' : 'warning'}>
              {sensor.quality === 'bad' ? 'Bad' : 'Uncertain'}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AlertPermission() {
  const [requested, setRequested] = useState(false);

  return (
    <div className="w-full max-w-md">
      <Alert icon={<IconLock aria-hidden />}>
        <AlertTitle>You have view access to this pipeline</AlertTitle>
        <AlertDescription>
          {requested
            ? 'Request sent to the data set owners. You will get a notification when they answer.'
            : 'Ask an owner of the data set for edit access to change its schedule.'}
        </AlertDescription>
        {requested ? null : (
          <AlertActions>
            <AlertButton onClick={() => setRequested(true)}>Request edit access</AlertButton>
          </AlertActions>
        )}
      </Alert>
    </div>
  );
}

function AlertDestructiveConsequence() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-muted-background p-4">
      <div className="flex flex-col gap-1">
        <h4 className="text-base font-medium text-base-foreground">Delete pipeline &quot;Historian sync&quot;?</h4>
        <p className="text-sm text-muted-foreground">Its run history and schedule are removed. This cannot be undone.</p>
      </div>
      <Alert variant="warning">
        <AlertDescription>2 dashboards read from this pipeline and will stop updating.</AlertDescription>
      </Alert>
      <div className="flex justify-end gap-2">
        <Button variant="ghost">Keep pipeline</Button>
        <Button variant="destructive">Delete pipeline</Button>
      </div>
    </div>
  );
}

function AlertConnectionLost() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-base font-medium text-base-foreground">Live values</h4>
        <Badge variant="archived">Paused</Badge>
      </div>
      <Alert variant="error" icon={<IconPlugConnectedX aria-hidden />}>
        <AlertTitle>Connection lost</AlertTitle>
        <AlertDescription>Values below are from 13:42. Reconnecting automatically.</AlertDescription>
        <AlertActions>
          <AlertButton variant="ghost">Retry now</AlertButton>
        </AlertActions>
      </Alert>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Discharge pressure</dt>
          <dd className="text-muted-foreground tabular-nums">48.6 barg</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Suction pressure</dt>
          <dd className="text-muted-foreground tabular-nums">12.4 barg</dd>
        </div>
      </dl>
    </div>
  );
}

export default definePage({
  id: 'alert',
  title: 'Alert',
  summary:
    'Alerts put medium-emphasis information inline, next to the task it concerns. They inform or warn without blocking, and can carry the action that resolves them.',
  docsSlug: 'alert',
  guidance: {
    use: [
      'Guidance, warnings and failures that belong to the current view or task.',
      'One alert per section that sums up the situation, with per-item state on badges.',
      'Card style where content wraps, strip style for one line in a wide area.',
      'Actions only when they resolve or dismiss the alert.',
    ],
    avoid: [
      'An alert where field-level validation says it better.',
      'Page-wide system state (use a banner) or brief confirmation (use a toast).',
      'Lists of repeated alerts, one per item.',
      'Error colour for anything the user does not have to resolve.',
    ],
  },
  source,
  sections: [
    {
      id: 'variants',
      title: 'Variants',
      description: 'Four levels of meaning. Pick by what the user has to do, not by how loud it should be.',
      specimens: [
        {
          id: 'AlertDefault',
          title: 'Default',
          note: 'Neutral guidance that explains how something works.',
          origin: 'aura',
          size: 'md',
          Component: AlertDefault,
        },
        {
          id: 'AlertInfo',
          title: 'Info',
          note: 'Helpful context the user should notice but does not have to act on.',
          origin: 'aura',
          size: 'md',
          Component: AlertInfo,
        },
        {
          id: 'AlertWarning',
          title: 'Warning',
          note: 'Something needs attention soon but does not block the task.',
          origin: 'aura',
          size: 'md',
          Component: AlertWarning,
        },
        {
          id: 'AlertError',
          title: 'Error',
          note: 'A failure the user has to resolve to continue; say what failed and what to do.',
          origin: 'aura',
          size: 'md',
          Component: AlertError,
        },
      ],
    },
    {
      id: 'style-and-content',
      title: 'Style and content',
      description: 'Card or strip, and how much goes inside: title, description, icon, actions.',
      specimens: [
        {
          id: 'AlertStrip',
          title: 'Strip',
          note: 'A single short line across a wide area such as the top of a table.',
          origin: 'aura',
          size: 'lg',
          Component: AlertStrip,
        },
        {
          id: 'AlertTitleOnly',
          title: 'Title only',
          note: 'The message fits in a few words and needs no explanation.',
          origin: 'aura',
          Component: AlertTitleOnly,
        },
        {
          id: 'AlertStripWithAction',
          title: 'Strip with action',
          note: 'One line plus the one action that resolves it, kept on the same row.',
          origin: 'aura',
          size: 'lg',
          Component: AlertStripWithAction,
        },
        {
          id: 'AlertDescriptionOnly',
          title: 'Description only',
          note: 'A full sentence of guidance where a title would only repeat it.',
          origin: 'aura',
          Component: AlertDescriptionOnly,
        },
        {
          id: 'AlertCustomIcon',
          title: 'Custom icon',
          note: 'The topic is more useful than the level, such as time, access or connection.',
          origin: 'aura',
          size: 'md',
          Component: AlertCustomIcon,
        },
        {
          id: 'AlertWithoutIcon',
          title: 'Without icon',
          note: 'Low-key tips in dense panels where an icon adds noise.',
          origin: 'aura',
          size: 'md',
          Component: AlertWithoutIcon,
        },
        {
          id: 'AlertWithActions',
          title: 'With actions',
          note: 'The fix is one click away: a primary resolving action and one quieter alternative.',
          origin: 'aura',
          size: 'md',
          Component: AlertWithActions,
        },
        {
          id: 'AlertWithDetails',
          title: 'With details',
          note: 'A few specific causes belong to one failure; list them in one alert, not three.',
          origin: 'aura',
          size: 'md',
          Component: AlertWithDetails,
        },
      ],
    },
    {
      id: 'dismissal-and-state',
      title: 'Dismissal and state',
      description: 'Who closes the alert, whether it stays closed, and what happens once it is resolved.',
      specimens: [
        {
          id: 'AlertDismissible',
          title: 'Dismissible',
          note: 'Information the user can acknowledge and remove; the alert manages its own visibility.',
          origin: 'aura',
          size: 'md',
          Component: AlertDismissible,
        },
        {
          id: 'AlertControlled',
          title: 'Controlled visibility',
          note: 'Your state decides when it shows, for example until a form is saved.',
          origin: 'aura',
          size: 'md',
          Component: AlertControlled,
        },
        {
          id: 'AlertStripDismissible',
          title: 'Dismissible strip',
          note: 'A one-line notice with an action and a close button in the same row.',
          origin: 'aura',
          size: 'full',
          Component: AlertStripDismissible,
        },
        {
          id: 'AlertRememberedDismissal',
          title: 'Remembered dismissal',
          note: 'Announcements that must not come back on the next visit once they are closed.',
          origin: 'custom',
          size: 'md',
          uses: ['feedback/DismissibleAlert.tsx', 'feedback/dismissalStore.ts'],
          Component: AlertRememberedDismissal,
        },
        {
          id: 'AlertResolving',
          title: 'Resolving action',
          note: 'The alert carries its own fix, shows it working, then confirms in place. Click to try.',
          origin: 'custom',
          size: 'md',
          Component: AlertResolving,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Where alerts sit on real screens: aligned with the content they describe, one per section.',
      specimens: [
        {
          id: 'AlertInForm',
          title: 'Form submission error',
          note: 'A failed submit: summarise at the top, keep the input, and mark the field that needs fixing.',
          origin: 'custom',
          size: 'md',
          Component: AlertInForm,
        },
        {
          id: 'AlertDestructiveConsequence',
          title: 'Consequence in a confirmation',
          note: 'A side effect the user should weigh before confirming a destructive action.',
          origin: 'custom',
          size: 'md',
          surface: 'muted',
          Component: AlertDestructiveConsequence,
        },
        {
          id: 'AlertInCard',
          title: 'Inside a card',
          note: 'A caveat about one value sits in the card that shows it, not at the top of the page.',
          origin: 'custom',
          size: 'md',
          Component: AlertInCard,
        },
        {
          id: 'AlertGroupedSummary',
          title: 'Grouped summary',
          note: 'Many items share a problem: one alert for the situation, a badge per item.',
          origin: 'custom',
          size: 'md',
          Component: AlertGroupedSummary,
        },
        {
          id: 'AlertPermission',
          title: 'Limited access',
          note: 'Explains why controls are read-only and offers the way to unlock them.',
          origin: 'custom',
          size: 'md',
          Component: AlertPermission,
        },
        {
          id: 'AlertConnectionLost',
          title: 'Stale data',
          note: 'A region keeps showing its last values while the connection is down.',
          origin: 'custom',
          size: 'md',
          Component: AlertConnectionLost,
        },
        {
          id: 'AlertAboveTable',
          title: 'Above a table',
          note: 'Tells people the list is scoped or filtered, with the action that widens it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: AlertAboveTable,
        },
      ],
    },
  ],
});
