import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { toast } from '@cognite/aura/components/sonner-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconCalendarEvent, IconTrash } from '@cognite/aura/icons';
import { useState } from 'react';

import { SingleToaster } from '../../../library/feedback/SingleToaster';
import { definePage } from '../../types';

import source from './sonner-toast.tsx?raw';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const failAfter = (ms: number) => wait(ms).then(() => Promise.reject(new Error('Gateway timeout')));

const SAVED_VIEWS = [
  { id: 'vibration', name: 'Compressor vibration' },
  { id: 'export', name: 'Gas export, last 7 days' },
  { id: 'alarms', name: 'Active alarms by area' },
] as const;

function ToastDefault() {
  return (
    <>
      <Button variant="secondary" onClick={() => toast('Filter applied to 3 charts')}>
        Apply filter
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastSuccess() {
  return (
    <>
      <Button variant="secondary" onClick={() => toast.success('Changes saved')}>
        Save changes
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastInfo() {
  return (
    <>
      <Button variant="secondary" onClick={() => toast.info('Export queued. It starts after the current run.')}>
        Export data
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastWarning() {
  return (
    <>
      <Button variant="secondary" onClick={() => toast.warning('Saved, but 2 time series have no unit')}>
        Save chart
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastError() {
  return (
    <>
      <Button variant="secondary" onClick={() => toast.error("Couldn't refresh the chart. Try again.")}>
        Refresh chart
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastLoading() {
  const start = () => {
    const id = toast.loading('Starting pipeline…');
    void wait(2400).then(() => toast.dismiss(id));
  };

  return (
    <>
      <Button variant="secondary" onClick={start}>
        Start pipeline
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastWithDescription() {
  const show = () =>
    toast('Work order created', {
      description: 'WO-104483 is assigned to Tomás Barros and due tomorrow.',
    });

  return (
    <>
      <Button variant="secondary" onClick={show}>
        Create work order
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastWithAction() {
  const show = () =>
    toast.success('Dashboard published', {
      action: { label: 'View', onClick: () => undefined },
    });

  return (
    <>
      <Button variant="secondary" onClick={show}>
        Publish dashboard
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastWithCancel() {
  const show = () =>
    toast('Sending report in 5 seconds', {
      duration: 5000,
      cancel: { label: 'Cancel', onClick: () => toast('Report not sent') },
    });

  return (
    <>
      <Button variant="secondary" onClick={show}>
        Send report
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastWithCloseButton() {
  return (
    <>
      <Button variant="secondary" onClick={() => toast.info('Alarm shelved for 1 hour', { closeButton: true })}>
        Shelve alarm
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastLongTitle() {
  const show = () =>
    toast.success(
      'Transformation "Historian sync to asset hierarchy, Nordkapp gas compression" finished with 18 240 rows written to 3 tables'
    );

  return (
    <>
      <Button variant="secondary" onClick={show}>
        Run transformation
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastCustomIcon() {
  const show = () =>
    toast('Inspection scheduled for 14 March', {
      icon: <IconCalendarEvent className="size-4" aria-hidden />,
    });

  return (
    <>
      <Button variant="secondary" onClick={show}>
        Schedule inspection
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastPersistent() {
  const show = () =>
    toast.warning('Export finished with 3 skipped rows', {
      duration: Number.POSITIVE_INFINITY,
      closeButton: true,
      action: { label: 'View rows', onClick: () => undefined },
    });

  return (
    <>
      <Button variant="secondary" onClick={show}>
        Export rows
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastLongerDuration() {
  const show = () =>
    toast('Alarm acknowledged', {
      description: 'Recompressor tripped on high vibration',
      duration: 8000,
      action: { label: 'Undo', onClick: () => toast('Acknowledgement undone') },
    });

  return (
    <>
      <Button variant="secondary" onClick={show}>
        Acknowledge alarm
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastDeduplicated() {
  const [count, setCount] = useState(0);

  const pin = () => {
    const next = count + 1;
    setCount(next);
    toast.success(`${next} ${next === 1 ? 'sensor' : 'sensors'} pinned`, { id: 'pin-sensors' });
  };

  return (
    <>
      <Button variant="secondary" onClick={pin}>
        Pin sensor
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastUpdateInPlace() {
  const deploy = () => {
    const id = toast.loading('Deploying function…');
    void wait(2000).then(() => toast.success('Function deployed', { id }));
  };

  return (
    <>
      <Button variant="secondary" onClick={deploy}>
        Deploy function
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastPromise() {
  const run = () =>
    toast.promise(wait(2000), {
      loading: 'Running transformation…',
      success: 'Transformation finished',
      error: "Couldn't run the transformation. Try again.",
    });

  return (
    <>
      <Button variant="secondary" onClick={run}>
        Run transformation
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastPromiseFailure() {
  const run = () =>
    toast.promise(failAfter(2000), {
      loading: 'Testing connection…',
      success: 'Connection works',
      error: "Couldn't reach the historian. Check the gateway and test again.",
    });

  return (
    <>
      <Button variant="secondary" onClick={run}>
        Test connection
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastPosition() {
  return (
    <>
      <Button variant="secondary" onClick={() => toast('Layout locked', { position: 'top-center' })}>
        Lock layout
      </Button>
      <SingleToaster />
    </>
  );
}

function ToastDismissAll() {
  const notify = () => {
    toast('Alarm cleared: separator level deviation');
    toast('Alarm cleared: motor current high');
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={notify}>
          Clear 2 alarms
        </Button>
        <Button variant="ghost" onClick={() => toast.dismiss()}>
          Dismiss all
        </Button>
      </div>
      <SingleToaster />
    </>
  );
}

function ToastUndoDelete() {
  const [deleted, setDeleted] = useState<readonly string[]>([]);
  const views = SAVED_VIEWS.filter((view) => !deleted.includes(view.id));

  const remove = (id: string, name: string) => {
    setDeleted((current) => [...current, id]);
    toast(`"${name}" deleted`, {
      duration: 8000,
      action: {
        label: 'Undo',
        onClick: () => setDeleted((current) => current.filter((deletedId) => deletedId !== id)),
      },
    });
  };

  return (
    <>
      <div className="flex w-full max-w-sm flex-col gap-2">
        <h4 className="text-sm font-medium text-base-foreground">Saved views</h4>
        {views.length === 0 ? (
          <div className="flex items-center justify-between gap-4 py-1">
            <p className="text-sm text-muted-foreground">No saved views.</p>
            <Button variant="outline" size="sm" onClick={() => setDeleted([])}>
              Reset example
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col">
            {views.map((view) => (
              <li key={view.id} className="flex items-center justify-between gap-4 py-1 text-sm text-base-foreground">
                <span className="min-w-0 truncate">{view.name}</span>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${view.name}`}
                        onClick={() => remove(view.id, view.name)}
                      >
                        <IconTrash />
                      </Button>
                    }
                  />
                  <TooltipContent>Delete view</TooltipContent>
                </Tooltip>
              </li>
            ))}
          </ul>
        )}
      </div>
      <SingleToaster />
    </>
  );
}

function ToastSaveForm() {
  const [name, setName] = useState('Compressor vibration');

  const save = () => toast.success('Changes saved', { id: 'save-view' });

  return (
    <>
      <form
        className="flex w-full max-w-sm items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <Label htmlFor="toast-view-name">View name</Label>
          <Input id="toast-view-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <Button type="submit">Save changes</Button>
      </form>
      <SingleToaster />
    </>
  );
}

function ToastBulkAction() {
  const assign = () =>
    toast.success('12 work orders assigned to Tomás Barros', {
      id: 'bulk-assign',
      action: { label: 'Undo', onClick: () => toast('Assignment undone', { id: 'bulk-assign' }) },
    });

  return (
    <>
      <div className="flex w-full max-w-sm items-center justify-between gap-4 rounded-lg bg-muted-background px-4 py-2">
        <span className="text-sm text-base-foreground tabular-nums">12 selected</span>
        <Button size="sm" onClick={assign}>
          Assign to Tomás
        </Button>
      </div>
      <SingleToaster />
    </>
  );
}

function ToastBackgroundJob() {
  const [running, setRunning] = useState(false);

  const start = () => {
    setRunning(true);
    void wait(2600).then(() => {
      setRunning(false);
      toast.success('Backfill finished', {
        description: '23-PT-92531, 1 Jan to 12 Mar. 1.2 million points written.',
        action: { label: 'View run', onClick: () => undefined },
      });
    });
  };

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <Button variant="secondary" disabled={running} onClick={start}>
          Start backfill
        </Button>
        <p className="text-sm text-muted-foreground">
          {running ? 'Running in the background. Keep working.' : 'Takes a few seconds in this example.'}
        </p>
      </div>
      <SingleToaster />
    </>
  );
}

export default definePage({
  id: 'sonner-toast',
  title: 'Toast',
  summary:
    'Toasts confirm the outcome of an action without interrupting. They appear in a corner, stay for a few seconds and leave on their own, so nothing in them may be essential.',
  docsSlug: 'sonner',
  guidance: {
    use: [
      'Confirming a save, delete, copy or background job: past tense, specific, brief.',
      'One toast per gesture, even when the gesture touched many items.',
      'An Undo action for reversible deletes and bulk changes.',
      'One Toaster mounted once near the app root.',
    ],
    avoid: [
      'Errors the user must act on; a toast disappears, so use an alert or banner.',
      'A toast as the only safety net for irreversible work.',
      'A toast on every auto-save; use a quiet "Saved" indicator.',
      '"Successfully" and exclamation marks; the pattern already says it worked.',
    ],
  },
  source,
  sections: [
    {
      id: 'types',
      title: 'Types',
      description: 'Six kinds of message. Click a button to fire the toast in the corner of the screen.',
      specimens: [
        {
          id: 'ToastDefault',
          title: 'Default',
          note: 'A neutral acknowledgement that something happened, with no status attached.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastDefault,
        },
        {
          id: 'ToastSuccess',
          title: 'Success',
          note: 'The action the user started has completed.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastSuccess,
        },
        {
          id: 'ToastInfo',
          title: 'Info',
          note: 'The action was accepted but the outcome comes later.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastInfo,
        },
        {
          id: 'ToastWarning',
          title: 'Warning',
          note: 'It worked, with a caveat the user may want to follow up.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastWarning,
        },
        {
          id: 'ToastError',
          title: 'Error',
          note: 'A low-stakes failure the user can simply retry; never the only place an error lives.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastError,
        },
        {
          id: 'ToastLoading',
          title: 'Loading',
          note: 'A short background step the user does not have to wait for; dismiss or update it when done.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastLoading,
        },
      ],
    },
    {
      id: 'content',
      title: 'Content',
      description: 'What a toast can carry besides its title.',
      specimens: [
        {
          id: 'ToastWithDescription',
          title: 'With description',
          note: 'One more line of context, such as the ID or assignee of what was created.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastWithDescription,
        },
        {
          id: 'ToastWithAction',
          title: 'With action',
          note: 'A shortcut to the thing that was just created or changed.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastWithAction,
        },
        {
          id: 'ToastWithCancel',
          title: 'With cancel',
          note: 'A delayed action the user can still stop before it runs.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastWithCancel,
        },
        {
          id: 'ToastWithCloseButton',
          title: 'With close button',
          note: 'The toast may cover something the user needs right now.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastWithCloseButton,
        },
        {
          id: 'ToastLongTitle',
          title: 'Long title',
          note: 'Titles clamp at two lines, so put the outcome first and the name last.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastLongTitle,
        },
        {
          id: 'ToastCustomIcon',
          title: 'Custom icon',
          note: 'The topic says more than a status would, such as a date or a destination.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastCustomIcon,
        },
      ],
    },
    {
      id: 'behaviour',
      title: 'Behaviour',
      description: 'How long a toast stays, where it shows, and how repeated or long-running actions avoid a pile-up.',
      specimens: [
        {
          id: 'ToastPersistent',
          title: 'Persistent',
          note: 'A result the user should not miss: it stays until closed, so it needs a close button.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastPersistent,
        },
        {
          id: 'ToastLongerDuration',
          title: 'Longer duration',
          note: 'Toasts with an action need more than the default four seconds to be read and clicked.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastLongerDuration,
        },
        {
          id: 'ToastDeduplicated',
          title: 'Deduplicated',
          note: 'A repeated action reuses one toast through a stable id. Click several times.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastDeduplicated,
        },
        {
          id: 'ToastUpdateInPlace',
          title: 'Updated in place',
          note: 'Loading turns into the result in the same toast, by id.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastUpdateInPlace,
        },
        {
          id: 'ToastPromise',
          title: 'Promise',
          note: 'Let the toast follow a promise through loading and success with one call.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastPromise,
        },
        {
          id: 'ToastPromiseFailure',
          title: 'Promise that fails',
          note: 'The rejected branch says what failed and what to do next.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastPromiseFailure,
        },
        {
          id: 'ToastPosition',
          title: 'Position',
          note: 'Bottom right is the default; move one toast only when that corner is occupied.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastPosition,
        },
        {
          id: 'ToastDismissAll',
          title: 'Dismiss all',
          note: 'Clear the stack from code, for example when the user navigates away.',
          origin: 'aura',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastDismissAll,
        },
      ],
    },
    {
      id: 'patterns',
      title: 'Patterns',
      description: 'Toasts where they belong: right after the action that caused them.',
      specimens: [
        {
          id: 'ToastUndoDelete',
          title: 'Delete with undo',
          note: 'A cheap, reversible delete: remove at once and offer Undo instead of asking first.',
          origin: 'custom',
          size: 'md',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastUndoDelete,
        },
        {
          id: 'ToastSaveForm',
          title: 'Save confirmation',
          note: 'An explicit save that leaves the user on the same form.',
          origin: 'custom',
          size: 'md',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastSaveForm,
        },
        {
          id: 'ToastBulkAction',
          title: 'Bulk action',
          note: 'One gesture on many items gets one toast that names the count.',
          origin: 'custom',
          size: 'md',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastBulkAction,
        },
        {
          id: 'ToastBackgroundJob',
          title: 'Background job finished',
          note: 'Work that outlives the click reports back with a link to the result.',
          origin: 'custom',
          size: 'md',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ToastBackgroundJob,
        },
      ],
    },
  ],
});
