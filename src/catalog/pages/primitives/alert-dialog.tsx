import { Button } from '@cognite/aura/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { Label } from '@cognite/aura/components/label';
import { Textarea } from '@cognite/aura/components/textarea';
import { IconDots } from '@cognite/aura/icons';
import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { AlertDialog } from '../../../library/primitives/alert-dialog/AlertDialog';
import { AlertDialogAcknowledgement } from '../../../library/primitives/alert-dialog/AlertDialogAcknowledgement';
import { AlertDialogAction } from '../../../library/primitives/alert-dialog/AlertDialogAction';
import { AlertDialogCancel } from '../../../library/primitives/alert-dialog/AlertDialogCancel';
import { AlertDialogContent } from '../../../library/primitives/alert-dialog/AlertDialogContent';
import { AlertDialogDescription } from '../../../library/primitives/alert-dialog/AlertDialogDescription';
import { AlertDialogFooter } from '../../../library/primitives/alert-dialog/AlertDialogFooter';
import { AlertDialogHeader } from '../../../library/primitives/alert-dialog/AlertDialogHeader';
import { AlertDialogTitle } from '../../../library/primitives/alert-dialog/AlertDialogTitle';
import { AlertDialogTrigger } from '../../../library/primitives/alert-dialog/AlertDialogTrigger';
import { AlertDialogTypedConfirmation } from '../../../library/primitives/alert-dialog/AlertDialogTypedConfirmation';
import { definePage } from '../../types';

import source from './alert-dialog.tsx?raw';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

type CaseProps = {
  trigger: string;
  triggerVariant?: 'default' | 'outline' | 'destructive' | 'secondary';
  tone?: 'neutral' | 'destructive';
  title: string;
  description: ReactNode;
  action: string;
  size?: 'sm' | 'md';
  /** Parts between the description and the footer. */
  body?: ReactNode;
  cancel?: string | null;
  pendingLabel?: string;
  errorMessage?: string;
  disabled?: boolean;
  onConfirm?: () => void | Promise<void>;
};

function AlertDialogPrimCase({
  trigger,
  triggerVariant = 'outline',
  tone = 'neutral',
  title,
  description,
  action,
  size = 'md',
  body,
  cancel = 'Cancel',
  pendingLabel,
  errorMessage,
  disabled,
  onConfirm,
}: CaseProps) {
  return (
    <AlertDialog tone={tone}>
      <AlertDialogTrigger render={<Button variant={triggerVariant}>{trigger}</Button>} />
      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {body}
        <AlertDialogFooter>
          {cancel === null ? null : <AlertDialogCancel>{cancel}</AlertDialogCancel>}
          <AlertDialogAction
            onConfirm={onConfirm}
            pendingLabel={pendingLabel}
            errorMessage={errorMessage}
            disabled={disabled}
          >
            {action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AlertDialogPrimDelete() {
  return (
    <AlertDialogPrimCase
      trigger="Delete pipeline"
      triggerVariant="destructive"
      tone="destructive"
      size="sm"
      title="Delete pipeline?"
      description="All runs and history are permanently removed. This can't be undone."
      action="Delete pipeline"
    />
  );
}

function AlertDialogPrimDiscard() {
  return (
    <AlertDialogPrimCase
      trigger="Close editor"
      tone="destructive"
      size="sm"
      title="Discard changes?"
      description="Your edits to the alert rule are lost. This can't be undone."
      cancel="Keep editing"
      action="Discard changes"
    />
  );
}

function AlertDialogPrimNeutral() {
  return (
    <AlertDialogPrimCase
      trigger="Publish data model"
      triggerVariant="default"
      size="sm"
      title="Publish version 4?"
      description="Applications that use the model pick up the new version at their next deploy."
      action="Publish version"
    />
  );
}

function AlertDialogPrimNotice() {
  return (
    <AlertDialogPrimCase
      trigger="Open maintenance notice"
      size="sm"
      title="Historian offline tonight"
      description="Trends before 02:00 stay available. New readings appear again around 04:30."
      cancel={null}
      action="Got it"
    />
  );
}

function AlertDialogPrimIrreversible() {
  return (
    <AlertDialogPrimCase
      trigger="Delete data set"
      triggerVariant="destructive"
      tone="destructive"
      size="sm"
      title="Delete data set?"
      description="The 14 time series in it are removed for everyone. This can't be undone."
      action="Delete data set"
    />
  );
}

function AlertDialogPrimReversible() {
  return (
    <AlertDialogPrimCase
      trigger="Archive data set"
      size="sm"
      title="Archive data set?"
      description="It is hidden from search and stops receiving data. You can restore it from Archived data sets."
      action="Archive data set"
    />
  );
}

function AlertDialogPrimTypedName() {
  return (
    <AlertDialogPrimCase
      trigger="Delete asset"
      triggerVariant="destructive"
      tone="destructive"
      title="Delete 23-KA-9103?"
      description="The asset, its 3 time series and its maintenance history are permanently removed."
      action="Delete asset"
      body={<AlertDialogTypedConfirmation text="23-KA-9103" />}
    />
  );
}

function AlertDialogPrimConsequences() {
  return (
    <AlertDialogPrimCase
      trigger="Remove integration"
      triggerVariant="destructive"
      tone="destructive"
      title="Remove the OPC UA integration?"
      description="Removing it has these effects:"
      action="Remove integration"
      body={
        <ul className="list-disc space-y-1 pl-5 pt-2 text-sm text-base-foreground">
          <li>Live readings from 212 tags stop within a minute.</li>
          <li>Alarms based on those tags stop evaluating.</li>
          <li>History already stored is kept.</li>
        </ul>
      }
    />
  );
}

function AlertDialogPrimAcknowledge() {
  return (
    <AlertDialogPrimCase
      trigger="Disable alarm"
      tone="destructive"
      title="Disable high discharge temperature alarm?"
      description="Operators will not be warned when 23-TT-92532 passes 145 °C."
      action="Disable alarm"
      body={<AlertDialogAcknowledgement>I understand operators will not be warned</AlertDialogAcknowledgement>}
    />
  );
}

function AlertDialogPrimTwoAcknowledgements() {
  return (
    <AlertDialogPrimCase
      trigger="Release permit"
      tone="destructive"
      title="Release permit PTW-8841?"
      description="Work on the recompressor can start as soon as you release it."
      action="Release permit"
      body={
        <div className="flex flex-col">
          <AlertDialogAcknowledgement>The isolation is checked and locked</AlertDialogAcknowledgement>
          <AlertDialogAcknowledgement>The area authority has signed</AlertDialogAcknowledgement>
        </div>
      }
    />
  );
}

function AlertDialogPrimTypedAndAcknowledge() {
  return (
    <AlertDialogPrimCase
      trigger="Delete site"
      triggerVariant="destructive"
      tone="destructive"
      title="Delete Stord terminal?"
      description="All assets, time series and work orders at the site are permanently removed."
      action="Delete site"
      body={
        <div className="flex flex-col">
          <AlertDialogTypedConfirmation text="Stord terminal" />
          <AlertDialogAcknowledgement>I have exported the data I need</AlertDialogAcknowledgement>
        </div>
      }
    />
  );
}

function AlertDialogPrimPending() {
  return (
    <AlertDialogPrimCase
      trigger="Delete run history"
      triggerVariant="destructive"
      tone="destructive"
      size="sm"
      title="Delete run history?"
      description="The last 90 days of runs are removed. This can't be undone."
      action="Delete history"
      pendingLabel="Deleting…"
      onConfirm={() => wait(1800)}
    />
  );
}

function AlertDialogPrimFailed() {
  const attempts = useRef(0);
  return (
    <AlertDialogPrimCase
      trigger="Remove extractor"
      triggerVariant="destructive"
      tone="destructive"
      size="sm"
      title="Remove extractor?"
      description="It stops sending data right away. This can't be undone."
      action="Remove extractor"
      pendingLabel="Removing…"
      errorMessage="Could not reach the gateway. Check the connection and try again."
      onConfirm={async () => {
        attempts.current += 1;
        await wait(900);
        if (attempts.current === 1) throw new Error('Gateway unreachable');
      }}
    />
  );
}

function AlertDialogPrimBulk() {
  return (
    <AlertDialogPrimCase
      trigger="Delete 12 time series"
      triggerVariant="destructive"
      tone="destructive"
      title="Delete 12 time series?"
      description="Their datapoints are permanently removed. Dashboards that use them show empty charts. This can't be undone."
      action="Delete 12 time series"
      pendingLabel="Deleting 12…"
      onConfirm={() => wait(1200)}
    />
  );
}

function AlertDialogPrimSessionExpiry() {
  return (
    <AlertDialogPrimCase
      trigger="Show session warning"
      size="sm"
      title="Your session ends in 2 minutes"
      description="Unsaved changes are lost when it ends. Stay signed in to keep working."
      cancel="Sign out"
      action="Stay signed in"
    />
  );
}

function AlertDialogPrimDontAskAgain() {
  return (
    <AlertDialogPrimCase
      trigger="Clear chart selection"
      size="sm"
      title="Clear the selection?"
      description="The 6 selected series are removed from the chart. You can add them again."
      action="Clear selection"
      body={<AlertDialogAcknowledgement required={false}>Don&apos;t ask again</AlertDialogAcknowledgement>}
    />
  );
}

function AlertDialogPrimStartEquipment() {
  const [reason, setReason] = useState('');
  const id = useId();
  return (
    <AlertDialogPrimCase
      trigger="Start compressor"
      triggerVariant="default"
      title="Start 23-KA-9102?"
      description="The 2nd stage compressor ramps to 8,400 rpm over 6 minutes. Make sure the discharge line is clear."
      action="Start compressor"
      pendingLabel="Starting…"
      disabled={reason.trim() === ''}
      onConfirm={() => wait(1200)}
      body={
        <div className="flex flex-col gap-0 pt-2">
          <AlertDialogAcknowledgement>The discharge line and the area are clear</AlertDialogAcknowledgement>
          <Label htmlFor={id} required>
            Reason for starting
          </Label>
          <Textarea id={id} rows={2} value={reason} onChange={(event) => setReason(event.target.value)} />
        </div>
      }
    />
  );
}

function AlertDialogPrimStopEquipment() {
  const [reason, setReason] = useState('');
  const id = useId();
  return (
    <AlertDialogPrimCase
      trigger="Stop compressor"
      triggerVariant="destructive"
      tone="destructive"
      title="Stop 23-KA-9101?"
      description="Gas export drops by about 40% until the unit is restarted. Restarting takes 25 minutes."
      action="Stop compressor"
      pendingLabel="Stopping…"
      disabled={reason.trim() === ''}
      onConfirm={() => wait(1200)}
      body={
        <div className="flex flex-col pt-2">
          <AlertDialogTypedConfirmation text="23-KA-9101" />
          <Label htmlFor={id} required>
            Reason for stopping
          </Label>
          <Textarea id={id} rows={2} value={reason} onChange={(event) => setReason(event.target.value)} />
        </div>
      }
    />
  );
}

function AlertDialogPrimRemoveMember() {
  return (
    <AlertDialogPrimCase
      trigger="Remove Aisha Khan"
      tone="destructive"
      size="sm"
      title="Remove Aisha Khan?"
      description="She loses access to all shared resources immediately. You can invite her again later."
      action="Remove member"
    />
  );
}

function AlertDialogPrimShelve() {
  const [reason, setReason] = useState('');
  const id = useId();
  return (
    <AlertDialogPrimCase
      trigger="Shelve alarm"
      title="Shelve bearing temperature alarm?"
      description="The alarm stays quiet for 8 hours while the transmitter is replaced. It returns on its own."
      action="Shelve for 8 hours"
      disabled={reason.trim() === ''}
      body={
        <div className="flex flex-col pt-2">
          <Label htmlFor={id} required>
            Reason
          </Label>
          <Textarea id={id} rows={2} value={reason} onChange={(event) => setReason(event.target.value)} />
        </div>
      }
    />
  );
}

function AlertDialogPrimOverwrite() {
  return (
    <AlertDialogPrimCase
      trigger="Import configuration"
      size="sm"
      title="Replace the current configuration?"
      description="The 18 limits you changed since Monday are overwritten by the imported file. Export first to keep them."
      action="Replace configuration"
    />
  );
}

function AlertDialogPrimCancelRun() {
  return (
    <AlertDialogPrimCase
      trigger="Cancel scheduled run"
      size="sm"
      title="Cancel tonight's run?"
      description="The 02:00 extraction is skipped once. The schedule continues tomorrow."
      cancel="Keep run"
      action="Cancel run"
    />
  );
}

function AlertDialogPrimFromMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="icon" aria-label="More actions for 23-KA-9101">
              <IconDots />
            </Button>
          }
        />
        <DropdownMenuContent>
          <DropdownMenuItem>Open asset</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setOpen(true)}>
            Delete asset
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog tone="destructive" open={open} onOpenChange={setOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete 23-KA-9101?</AlertDialogTitle>
            <AlertDialogDescription>The asset and its history are permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction>Delete asset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const U = (...names: string[]) => names.map((name) => `primitives/alert-dialog/${name}.tsx`);

export default definePage({
  id: 'alert-dialog',
  title: 'Alert dialog',
  summary:
    'An alert dialog interrupts for one clear decision before a consequential action. It states the consequence, names the action, ignores outside clicks and starts on the safe choice.',
  guidance: {
    use: [
      'Confirming a destructive or irreversible action: say what is lost, whether it can be undone, name the action.',
      'Label the button with the action ("Delete pipeline"), never "OK" or "Yes".',
      'Typed confirmation only when the damage is wide and permanent.',
      'Safety-critical actions: ask for a reason and an acknowledgement.',
    ],
    avoid: [
      '"Are you sure?" with no consequence; say what happens.',
      'Confirming reversible, low-risk actions every time; offer undo or "Don\'t ask again".',
      'Forms and multi-field input; use a dialog.',
      'Closing while the action runs, or without showing a failed result.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'The decision, the consequence and the action.',
      specimens: [
        { id: 'AlertDialogPrimDelete', title: 'Delete confirmation', note: 'The standard destructive confirm: consequence, reversibility, then the specific action.', origin: 'custom', uses: U('AlertDialog', 'AlertDialogContent'), Component: AlertDialogPrimDelete },
        { id: 'AlertDialogPrimDiscard', title: 'Discard changes', note: 'Name what is kept in Cancel ("Keep editing") so the safe path is obvious.', origin: 'custom', uses: U('AlertDialogCancel'), Component: AlertDialogPrimDiscard },
        { id: 'AlertDialogPrimNeutral', title: 'Neutral tone', note: 'A consequential but not destructive action: the default button, no red.', origin: 'custom', uses: U('AlertDialogAction'), Component: AlertDialogPrimNeutral },
        { id: 'AlertDialogPrimNotice', title: 'Single acknowledge', note: 'Information that must be seen once before carrying on; one action, no choice.', origin: 'custom', uses: U('AlertDialogAction'), Component: AlertDialogPrimNotice },
        { id: 'AlertDialogPrimIrreversible', title: 'Irreversible wording', note: 'Says "This can\'t be undone" and names what disappears for others.', origin: 'custom', uses: U('AlertDialogDescription'), Component: AlertDialogPrimIrreversible },
        { id: 'AlertDialogPrimReversible', title: 'Reversible wording', note: 'Says how to get it back; the neutral tone tells people this is not a loss.', origin: 'custom', uses: U('AlertDialogDescription'), Component: AlertDialogPrimReversible },
      ],
    },
    {
      id: 'gates',
      title: 'Gates',
      description: 'Friction that matches the damage.',
      specimens: [
        { id: 'AlertDialogPrimTypedName', title: 'Typed name', note: 'Wide, permanent deletes: type the tag to unlock the action.', origin: 'custom', uses: U('AlertDialogTypedConfirmation'), Component: AlertDialogPrimTypedName },
        { id: 'AlertDialogPrimConsequences', title: 'Consequence list', note: 'When three or more effects follow, list them instead of packing a sentence.', origin: 'custom', uses: U('AlertDialogContent'), Component: AlertDialogPrimConsequences },
        { id: 'AlertDialogPrimAcknowledge', title: 'Acknowledge checkbox', note: 'One specific consequence the person has to tick before the action unlocks.', origin: 'custom', uses: U('AlertDialogAcknowledgement'), Component: AlertDialogPrimAcknowledge },
        { id: 'AlertDialogPrimTwoAcknowledgements', title: 'Several acknowledgements', note: 'A checklist of conditions, all required, for a handover of responsibility.', origin: 'custom', uses: U('AlertDialogAcknowledgement'), Component: AlertDialogPrimTwoAcknowledgements },
        { id: 'AlertDialogPrimTypedAndAcknowledge', title: 'Typed name and acknowledgement', note: 'The heaviest gate: reserve it for deleting a whole site.', origin: 'custom', uses: U('AlertDialogTypedConfirmation', 'AlertDialogAcknowledgement'), Component: AlertDialogPrimTypedAndAcknowledge },
        { id: 'AlertDialogPrimDontAskAgain', title: 'Don\'t ask again', note: 'Only for low-risk, undoable actions: an optional checkbox that never blocks.', origin: 'custom', uses: U('AlertDialogAcknowledgement'), Component: AlertDialogPrimDontAskAgain },
      ],
    },
    {
      id: 'async',
      title: 'Pending and failed',
      description: 'The action takes time and can fail.',
      specimens: [
        { id: 'AlertDialogPrimPending', title: 'Pending confirm', note: 'The button shows progress and every way of closing is paused until it settles.', origin: 'custom', uses: U('AlertDialogAction'), Component: AlertDialogPrimPending },
        { id: 'AlertDialogPrimFailed', title: 'Failed confirm', note: 'The first attempt fails: the dialog stays open, says why and allows a retry.', origin: 'custom', uses: U('AlertDialogFooter'), Component: AlertDialogPrimFailed },
        { id: 'AlertDialogPrimBulk', title: 'Bulk count', note: 'Put the number in the title and on the button so scale is never hidden.', origin: 'custom', uses: U('AlertDialogAction'), Component: AlertDialogPrimBulk },
        { id: 'AlertDialogPrimSessionExpiry', title: 'Session expiry', note: 'A time-boxed warning where the safe choice is to stay.', origin: 'custom', uses: U('AlertDialogCancel'), Component: AlertDialogPrimSessionExpiry },
      ],
    },
    {
      id: 'safety',
      title: 'Safety-critical actions',
      description: 'Operating equipment and alarms.',
      specimens: [
        { id: 'AlertDialogPrimStartEquipment', title: 'Start equipment', note: 'Starting needs an acknowledged clear area and a recorded reason.', origin: 'custom', uses: U('AlertDialogAcknowledgement', 'AlertDialogAction'), Component: AlertDialogPrimStartEquipment },
        { id: 'AlertDialogPrimStopEquipment', title: 'Stop equipment', note: 'Stopping costs production: type the tag and give a reason before it unlocks.', origin: 'custom', uses: U('AlertDialogTypedConfirmation', 'AlertDialogAction'), Component: AlertDialogPrimStopEquipment },
        { id: 'AlertDialogPrimShelve', title: 'Shelve with reason', note: 'A temporary silence needs a reason in the log; the action stays locked without one.', origin: 'custom', uses: U('AlertDialogAction'), Component: AlertDialogPrimShelve },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Where alert dialogs are triggered from.',
      specimens: [
        { id: 'AlertDialogPrimRemoveMember', title: 'Remove a member', note: 'Say what they lose and that an invitation can bring them back.', origin: 'custom', uses: U('AlertDialog'), Component: AlertDialogPrimRemoveMember },
        { id: 'AlertDialogPrimOverwrite', title: 'Overwrite configuration', note: 'A neutral warning where the loss is concrete: 18 limits.', origin: 'custom', uses: U('AlertDialog'), Component: AlertDialogPrimOverwrite },
        { id: 'AlertDialogPrimCancelRun', title: 'Cancel a scheduled run', note: 'Name the one run that is skipped, and that the schedule continues.', origin: 'custom', uses: U('AlertDialog'), Component: AlertDialogPrimCancelRun },
        { id: 'AlertDialogPrimFromMenu', title: 'From a row menu', note: 'Open it from a menu item with controlled state; focus returns to the menu button.', origin: 'custom', uses: U('AlertDialog'), Component: AlertDialogPrimFromMenu },
      ],
    },
  ],
});
