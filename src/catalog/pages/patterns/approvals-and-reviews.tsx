import { Alert, AlertActions, AlertButton, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemDescription, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { ItemGroup } from '@cognite/aura/components/item';
import { IconArrowForwardUp, IconClock } from '@cognite/aura/icons';
import { useState } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { EventTimeline } from '../../../library/industrial/operations/EventTimeline';
import { SignOffBlock } from '../../../library/industrial/workflows/SignOffBlock';
import type { SignOffSigner } from '../../../library/industrial/workflows/SignOffBlock';
import { EntityRow } from '../../../library/patterns/collections/EntityRow';
import { useSelection } from '../../../library/patterns/collections/useSelection';
import { PageHeader } from '../../../library/patterns/structure/PageHeader';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { ApprovalCard } from '../../../library/patterns/workflows/ApprovalCard';
import { ApprovalChain } from '../../../library/patterns/workflows/ApprovalChain';
import type { ApprovalStep } from '../../../library/patterns/workflows/ApprovalChain';
import type { ApprovalState } from '../../../library/patterns/workflows/approvalState';
import { ApprovalStateBadge } from '../../../library/patterns/workflows/ApprovalStateBadge';
import type { CompareRow } from '../../../library/patterns/workflows/compareRows';
import { CompareTable } from '../../../library/patterns/workflows/CompareTable';
import { DecisionForm } from '../../../library/patterns/workflows/DecisionForm';
import { DiffValue } from '../../../library/patterns/workflows/DiffValue';
import { SlaIndicator } from '../../../library/patterns/workflows/SlaIndicator';
import { findPerson } from '../../data/plant';
import type { Person } from '../../data/plant';
import { definePage } from '../../types';

import source from './approvals-and-reviews.tsx?raw';

function person(id: string): Person {
  const found = findPerson(id);
  if (!found) throw new Error(`Unknown person ${id}`);
  return found;
}

/** Management-of-change request used across the page: a higher alarm limit on the 1st stage compressor. */
const MOC = {
  reference: 'MOC-2231',
  kind: 'Alarm limit change',
  title: 'Raise high alarm limit on 23-TT-92532',
  requester: person('ak'),
  requestedAt: '12 Mar, 09:40',
  reason: 'The discharge temperature alarm trips during warm restarts, four times this week. The vendor allows 150 °C continuous.',
};

const MOC_ROWS: readonly CompareRow[] = [
  { id: 'high', label: 'High alarm', left: '145.0 °C', right: '148.0 °C', delta: { text: '+3.0 °C', direction: 'up' } },
  { id: 'highhigh', label: 'High-high trip', left: '155.0 °C', right: '155.0 °C' },
  { id: 'delay', label: 'Alarm delay', left: '0 s', right: '10 s', delta: { text: '+10 s', direction: 'up' } },
  { id: 'priority', label: 'Alarm priority', left: 'High', right: 'High' },
];

const MOC_CHAIN: readonly ApprovalStep[] = [
  { id: 'eng', role: 'Rotating equipment engineer', name: 'Aisha Khan', state: 'approved', at: '12 Mar, 09:40', note: 'Requested. Checked against the vendor data sheet.' },
  { id: 'sup', role: 'Shift supervisor', name: 'Liv Wold', state: 'current' },
  { id: 'plan', role: 'Maintenance planner', name: 'Magnus Solberg', state: 'waiting' },
  { id: 'mgr', role: 'Plant manager', state: 'waiting' },
];

type PendingRequest = {
  id: string;
  title: string;
  kind: string;
  requesterId: string;
  waited: string;
  due: string;
  late?: boolean;
};

const PENDING: readonly PendingRequest[] = [
  { id: 'MOC-2231', title: 'Raise high alarm limit on 23-TT-92532', kind: 'Alarm limit change', requesterId: 'ak', waited: '4 h', due: '5 h 20 min left' },
  { id: 'PTW-2291', title: 'Hot work on interstage cooler 23-HA-9114', kind: 'Permit to work', requesterId: 'tb', waited: '1 h', due: '40 min left' },
  { id: 'MV-0013', title: 'Publish vibration model v13', kind: 'Model version', requesterId: 'ak', waited: '2 d', due: 'Overdue by 6 h', late: true },
  { id: 'IMP-0418', title: 'Import 1,284 tags from nordkapp-tags.csv', kind: 'CSV import', requesterId: 'ms', waited: '20 min', due: '2 d left' },
  { id: 'ACL-0077', title: 'Write access to data set Compressor telemetry', kind: 'Access request', requesterId: 'jn', waited: '3 h', due: '1 d left' },
];

function ApprovalReviewRequestCard() {
  const [state, setState] = useState<ApprovalState>('pending');
  const words: Partial<Record<ApprovalState, string>> = {
    approved: 'Approved by you · 12 Mar, 14:00',
    rejected: 'Rejected by you · 12 Mar, 14:00',
    'changes-requested': 'Sent back by you · 12 Mar, 14:00',
  };
  return (
    <div className="flex w-full flex-col gap-2">
      <ApprovalCard
        {...MOC}
        state={state}
        decision={words[state]}
        footerNote="Step 2 of 4 · 5 h 20 min left"
        onApprove={() => setState('approved')}
        onReject={() => setState('rejected')}
        onRequestChanges={() => setState('changes-requested')}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">High alarm limit</span>
          <DiffValue before="145.0" after="148.0" unit="°C" />
        </div>
      </ApprovalCard>
      {state === 'pending' ? null : (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setState('pending')}>
          Undo decision
        </Button>
      )}
    </div>
  );
}

function ApprovalReviewRequestedChange() {
  return (
    <div className="flex w-full flex-col gap-3">
      <SectionHeader
        as="h3"
        size="sm"
        title="Requested change"
        description={
          <>
            Alarm settings for <span className="font-mono">23-TT-92532</span> Discharge temperature
          </>
        }
      />
      <CompareTable label="Requested change to 23-TT-92532" leftLabel="Current" rightLabel="Requested" fieldLabel="Setting" rows={MOC_ROWS} />
    </div>
  );
}

function ApprovalReviewStateBadges() {
  return (
    <div className="flex max-w-xs flex-wrap items-center justify-center gap-2">
      <ApprovalStateBadge state="pending" />
      <ApprovalStateBadge state="approved" />
      <ApprovalStateBadge state="rejected" />
      <ApprovalStateBadge state="changes-requested" />
      <ApprovalStateBadge state="expired" />
    </div>
  );
}

function ApprovalReviewSla() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-5">
      <SlaIndicator label="Time to decide" remaining="5 h 20 min left" elapsed={0.34} state="on-track" due="Due 12 Mar, 19:20" />
      <SlaIndicator label="Time to decide" remaining="40 min left" elapsed={0.86} state="due-soon" due="Due 12 Mar, 14:40" />
      <SlaIndicator label="Time to decide" remaining="6 h overdue" elapsed={1.2} state="overdue" due="Was due 12 Mar, 08:00" />
    </div>
  );
}

function ApprovalReviewDelegation() {
  const [active, setActive] = useState(true);
  const delegate = person('ms');
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      {active ? (
        <div className="flex items-start gap-3 rounded-lg bg-info-background p-3 text-info-foreground">
          <IconArrowForwardUp aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div className="flex min-w-0 flex-col gap-1 text-sm">
            <p>
              <span className="font-medium">Delegated to {delegate.name}</span> until 20 Mar. Requests for the shift supervisor go to him while Liv Wold is on
              leave.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Approvals come to you. No delegation is active.</p>
      )}
      <Button variant="outline" size="sm" className="self-start" onClick={() => setActive(!active)}>
        {active ? 'End delegation' : 'Delegate approvals'}
      </Button>
    </div>
  );
}

function ApprovalReviewApproved() {
  return (
    <ApprovalCard
      reference="MV-0012"
      kind="Model version"
      title="Publish vibration model v12"
      requester={person('ak')}
      requestedAt="3 Mar, 11:15"
      reason="Retrained on the January bearing data. False alarms on 23-KA-9101 drop from 9 to 2 a week."
      state="approved"
      decision="Approved by Liv Wold · 3 Mar, 15:02"
    />
  );
}

function ApprovalReviewRejected() {
  return (
    <ApprovalCard
      reference="MOC-2198"
      kind="Alarm limit change"
      title="Raise high-high trip on 23-VT-92540"
      requester={person('tb')}
      requestedAt="26 Feb, 08:20"
      reason="The compressor tripped twice on vibration during start-up."
      state="rejected"
      decision="Rejected by Aisha Khan · 26 Feb, 13:45"
    >
      <div className="flex flex-col gap-0.5 rounded-lg bg-muted-background p-3">
        <span className="text-xs text-muted-foreground">Reason for rejecting</span>
        <p className="text-sm text-base-foreground">11.0 mm/s is the machine protection limit. Extend the start-up alarm delay instead.</p>
      </div>
    </ApprovalCard>
  );
}

function ApprovalReviewChangesRequested() {
  const [resubmitted, setResubmitted] = useState(false);
  return (
    <ApprovalCard
      reference="IMP-0412"
      kind="CSV import"
      title="Import 212 tags from cooling-water-tags.csv"
      requester={person('ms')}
      requestedAt="10 Mar, 10:05"
      state={resubmitted ? 'pending' : 'changes-requested'}
      decision="Sent back by Jonas Nyberg · 10 Mar, 12:30"
      footerNote="Resubmitted · waiting for Jonas Nyberg"
    >
      <div className="flex flex-col gap-0.5 rounded-lg bg-muted-background p-3">
        <span className="text-xs text-muted-foreground">What needs to change</span>
        <p className="text-sm text-base-foreground">14 tags lack a unit. Fill the unit column or leave those rows out.</p>
      </div>
      {resubmitted ? null : (
        <Button variant="secondary" size="sm" className="self-start" onClick={() => setResubmitted(true)}>
          Resubmit request
        </Button>
      )}
    </ApprovalCard>
  );
}

function ApprovalReviewExpired() {
  return (
    <ApprovalCard
      reference="PTW-2274"
      kind="Permit to work"
      title="Confined space entry, test separator 20-VA-1002"
      requester={person('tb')}
      requestedAt="5 Mar, 06:50"
      state="expired"
      decision="Expired 6 Mar, 06:50 · nobody decided within 24 h"
    >
      <Button variant="secondary" size="sm" className="self-start">
        Request again
      </Button>
    </ApprovalCard>
  );
}

function ApprovalReviewApproveComment() {
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <p className="text-sm text-base-foreground">
        Approve <span className="font-mono">MOC-2231</span>: raise high alarm limit on <span className="font-mono">23-TT-92532</span>
      </p>
      {sent === null ? (
        <DecisionForm decision="approve" helper="The requester and the next approver see your comment." onSubmit={setSent} onCancel={() => undefined} />
      ) : (
        <div className="flex flex-col items-start gap-2">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Approved{sent === '' ? ' without a comment' : `: "${sent}"`}. Next: Magnus Solberg.
          </p>
          <Button variant="ghost" size="sm" onClick={() => setSent(null)}>
            Start over
          </Button>
        </div>
      )}
    </div>
  );
}

function ApprovalReviewRejectReason() {
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <p className="text-sm text-base-foreground">
        Reject <span className="font-mono">MOC-2231</span>: raise high alarm limit on <span className="font-mono">23-TT-92532</span>
      </p>
      {sent === null ? (
        <DecisionForm decision="reject" helper="Aisha Khan is told why. The request closes and can be raised again." onSubmit={setSent} onCancel={() => undefined} />
      ) : (
        <div className="flex flex-col items-start gap-2">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Rejected: "{sent}"
          </p>
          <Button variant="ghost" size="sm" onClick={() => setSent(null)}>
            Start over
          </Button>
        </div>
      )}
    </div>
  );
}

const REVIEW_CHECKS = [
  { id: 'trip', label: 'New limit is below the trip limit', description: '148.0 °C is 7.0 °C under the high-high trip.' },
  { id: 'vendor', label: 'Within the vendor rating', description: 'Data sheet allows 150 °C continuous.' },
  { id: 'hazop', label: 'No HAZOP action depends on the old limit', description: 'Checked against node 23-04.' },
  { id: 'operators', label: 'Operators are informed', description: 'Noted in the shift log for all three shifts.' },
];

function ApprovalReviewChecklist() {
  const [done, setDone] = useState<readonly string[]>(['trip', 'vendor']);
  const left = REVIEW_CHECKS.length - done.length;
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <SectionHeader as="h3" size="sm" title="Review checklist" count={`${done.length} of ${REVIEW_CHECKS.length}`} />
      <CheckboxGroup aria-label="Review checklist">
        {REVIEW_CHECKS.map((check) => (
          <CheckboxItem key={check.id}>
            <CheckboxItemControl
              checked={done.includes(check.id)}
              onCheckedChange={(checked) => setDone((current) => (checked ? [...current, check.id] : current.filter((id) => id !== check.id)))}
            />
            <CheckboxItemLabel>{check.label}</CheckboxItemLabel>
            <CheckboxItemDescription>{check.description}</CheckboxItemDescription>
          </CheckboxItem>
        ))}
      </CheckboxGroup>
      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {left === 0 ? 'All checks confirmed.' : `Confirm ${left} more ${left === 1 ? 'check' : 'checks'} to approve.`}
        </p>
        <Button size="sm" disabled={left > 0}>
          Approve
        </Button>
      </div>
    </div>
  );
}

const BULK_IDS = ['ACL-0077', 'ACL-0078', 'ACL-0079', 'ACL-0081'];

const BULK_REQUESTS: Record<string, { who: string; what: string }> = {
  'ACL-0077': { who: 'jn', what: 'Write access to Compressor telemetry' },
  'ACL-0078': { who: 'tb', what: 'Read access to Alarm history' },
  'ACL-0079': { who: 'ih', what: 'Read access to Lab results' },
  'ACL-0081': { who: 'ms', what: 'Write access to Work order sync' },
};

function ApprovalReviewBulk() {
  const [open, setOpen] = useState<readonly string[]>(BULK_IDS);
  const selection = useSelection(open, ['ACL-0078', 'ACL-0079']);
  const [message, setMessage] = useState('');
  const approve = () => {
    setMessage(`Approved ${selection.count} ${selection.count === 1 ? 'request' : 'requests'}.`);
    setOpen(open.filter((id) => !selection.isSelected(id)));
    selection.clear();
  };
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <CheckboxItem>
          <CheckboxItemControl
            checked={selection.allSelected}
            indeterminate={selection.partiallySelected}
            disabled={open.length === 0}
            onCheckedChange={(checked) => selection.toggleAll(checked)}
          />
          <CheckboxItemLabel>{selection.count === 0 ? 'Select all' : `${selection.count} selected`}</CheckboxItemLabel>
        </CheckboxItem>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled={selection.count === 0}>
            Reject
          </Button>
          <Button size="sm" disabled={selection.count === 0} onClick={approve}>
            Approve{selection.count > 0 ? ` ${selection.count}` : ''}
          </Button>
        </div>
      </div>
      {open.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">No access requests are waiting.</p>
      ) : (
        <ItemGroup aria-label="Access requests">
          {open.map((id) => {
            const request = BULK_REQUESTS[id];
            const requester = person(request.who);
            return (
              <EntityRow
                key={id}
                title={request.what}
                description={
                  <>
                    <span className="font-mono">{id}</span> · {requester.name}
                  </>
                }
                selection={{ checked: selection.isSelected(id), onChange: (checked) => selection.toggle(id, checked), label: `Select ${id}` }}
              />
            );
          })}
        </ItemGroup>
      )}
      <p aria-live="polite" className="min-h-4 text-xs text-muted-foreground">
        {message || (selection.count === 0 && open.length > 0 ? 'Select requests to decide on them together.' : '')}
      </p>
      {open.length < BULK_IDS.length ? (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => {
            setOpen(BULK_IDS);
            setMessage('');
          }}
        >
          Restore requests
        </Button>
      ) : null}
    </div>
  );
}

function ApprovalReviewChain() {
  return (
    <div className="w-full max-w-md">
      <ApprovalChain label="Approval chain for MOC-2231" steps={MOC_CHAIN} />
    </div>
  );
}

function ApprovalReviewHistory() {
  return (
    <div className="w-full max-w-md">
      <EventTimeline
        label="Approval history for MOC-2198"
        events={[
          { id: 'h1', time: '26 Feb, 08:20', title: 'Requested by Tomás Barros', detail: 'Raise high-high trip on 23-VT-92540 from 11.0 to 12.5 mm/s.' },
          { id: 'h2', time: '26 Feb, 09:05', title: 'Approved by Liv Wold', detail: 'Shift supervisor. "Agree it trips too early on start-up."' },
          { id: 'h3', time: '26 Feb, 11:30', title: 'Changes requested by Aisha Khan', detail: 'Asked for the vendor protection limit.', tone: 'warning', shape: 'diamond' },
          { id: 'h4', time: '26 Feb, 12:10', title: 'Resubmitted by Tomás Barros', detail: 'Attached data sheet DS-23-9101.' },
          { id: 'h5', time: '26 Feb, 13:45', title: 'Rejected by Aisha Khan', detail: '11.0 mm/s is the machine protection limit.', tone: 'critical', shape: 'square' },
        ]}
      />
    </div>
  );
}

const SIGNERS: readonly SignOffSigner[] = [
  { id: 'ak', role: 'Rotating equipment engineer', name: 'Aisha Khan', state: 'signed', at: '12 Mar, 09:40' },
  { id: 'lw', role: 'Shift supervisor', name: 'Liv Wold', state: 'pending' },
  { id: 'pm', role: 'Plant manager', state: 'pending' },
];

function ApprovalReviewSignOff() {
  const [signers, setSigners] = useState(SIGNERS);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <SectionHeader as="h3" size="sm" title="Sign-off" description="Signing confirms you reviewed the change and accept the new limit." />
      <SignOffBlock
        label="Sign-off for MOC-2231"
        signers={signers}
        currentSignerId="lw"
        signLabel="Sign as supervisor"
        onSign={(id) => setSigners(signers.map((signer) => (signer.id === id ? { ...signer, state: 'signed', at: '12 Mar, 14:00' } : signer)))}
      />
    </div>
  );
}

function ApprovalReviewEscalation() {
  const [escalated, setEscalated] = useState(false);
  return (
    <div className="w-full max-w-md">
      {escalated ? (
        <Alert variant="info">
          <AlertTitle>Escalated to the plant manager</AlertTitle>
          <AlertDescription>MV-0013 now waits for the plant manager. Liv Wold can still decide until they do.</AlertDescription>
          <AlertActions>
            <AlertButton variant="ghost" onClick={() => setEscalated(false)}>
              Undo
            </AlertButton>
          </AlertActions>
        </Alert>
      ) : (
        <Alert variant="warning">
          <AlertTitle>Approval is 6 hours overdue</AlertTitle>
          <AlertDescription>MV-0013 has waited two days for the shift supervisor. Model v12 stays in use until someone decides.</AlertDescription>
          <AlertActions>
            <AlertButton onClick={() => setEscalated(true)}>Escalate to plant manager</AlertButton>
            <AlertButton variant="ghost">Send reminder</AlertButton>
          </AlertActions>
        </Alert>
      )}
    </div>
  );
}

function ApprovalReviewMyPending() {
  return (
    <div className="flex w-full flex-col gap-2">
      <SectionHeader as="h3" size="sm" title="Waiting for you" count={PENDING.length} />
      <ItemGroup aria-label="Requests waiting for you">
        {PENDING.map((request) => {
          const requester = person(request.requesterId);
          return (
            <EntityRow
              key={request.id}
              onOpen={() => undefined}
              leading={<PersonAvatar name={requester.name} initials={requester.initials} colorKey={requester.id} sizes="xsm" />}
              title={request.title}
              description={
                <>
                  <span className="font-mono">{request.id}</span> · {request.kind} · {requester.name}
                </>
              }
              meta={
                <span className={`flex items-center gap-1 whitespace-nowrap tabular-nums ${request.late ? 'font-medium text-critical-foreground-strong' : ''}`}>
                  <IconClock aria-hidden="true" className="size-3.5 shrink-0" />
                  {request.due}
                </span>
              }
            />
          );
        })}
      </ItemGroup>
    </div>
  );
}

function ApprovalReviewInboxSummary() {
  const rows = [
    { id: 'waiting', label: 'Waiting for you', value: 5 },
    { id: 'today', label: 'Due today', value: 2 },
    { id: 'overdue', label: 'Overdue', value: 1 },
    { id: 'sent', label: 'Requested by you', value: 3 },
  ];
  return (
    <dl className="flex w-full max-w-xs flex-col">
      {rows.map((row) => (
        <div key={row.id} className="flex items-baseline justify-between gap-3 border-b border-default py-2 last:border-b-0">
          <dt className="text-sm text-muted-foreground">{row.label}</dt>
          <dd className={`text-xl font-semibold tabular-nums ${row.id === 'overdue' ? 'text-critical-foreground-strong' : 'text-base-foreground'}`}>
            {row.value}
            {row.id === 'overdue' ? <span className="sr-only"> overdue</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ApprovalReviewMocHeader() {
  return (
    <PageHeader
      as="h2"
      title={MOC.title}
      status={<ApprovalStateBadge state="pending" label="Awaiting you" />}
      description="Management of change. Alarm limit change on the 1st stage compressor, 23-KA-9101."
      meta={
        <MetadataList
          layout="inline"
          items={[
            { label: 'Request', value: <span className="font-mono">{MOC.reference}</span> },
            { label: 'Requested by', value: MOC.requester.name },
            { label: 'Requested', value: MOC.requestedAt },
            { label: 'Risk class', value: 'Medium' },
            { label: 'Step', value: '2 of 4' },
          ]}
        />
      }
      actions={
        <>
          <Button variant="ghost">Request changes</Button>
          <Button variant="secondary">Reject</Button>
          <Button>Approve</Button>
        </>
      }
    />
  );
}

function ApprovalReviewMocReview() {
  const [state, setState] = useState<ApprovalState>('pending');
  const [mode, setMode] = useState<'approve' | 'reject' | null>(null);
  const chain = MOC_CHAIN.map((step): ApprovalStep => {
    if (step.id === 'sup' && state === 'approved') return { ...step, state: 'approved', at: '12 Mar, 14:00' };
    if (step.id === 'sup' && state === 'rejected') return { ...step, state: 'rejected', at: '12 Mar, 14:00' };
    if (step.id === 'plan' && state === 'approved') return { ...step, state: 'current' };
    return step;
  });
  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        as="h2"
        size="compact"
        divider
        title={MOC.title}
        status={<ApprovalStateBadge state={state} label={state === 'pending' ? 'Awaiting you' : undefined} />}
        meta={
          <span className="text-xs text-muted-foreground">
            <span className="font-mono">{MOC.reference}</span> · {MOC.kind} · requested by {MOC.requester.name}, {MOC.requestedAt}
          </span>
        }
      />
      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-start gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Reason</span>
            <p className="max-w-prose text-sm text-base-foreground">{MOC.reason}</p>
          </div>
          <CompareTable label="Requested change to 23-TT-92532" leftLabel="Current" rightLabel="Requested" fieldLabel="Setting" rows={MOC_ROWS} />
          {state !== 'pending' ? (
            <div className="flex flex-col items-start gap-2">
              <p aria-live="polite" className="text-sm text-muted-foreground">
                {state === 'approved' ? 'You approved this change. It now waits for Magnus Solberg.' : 'You rejected this change. Aisha Khan has been told why.'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setState('pending');
                  setMode(null);
                }}
              >
                Undo decision
              </Button>
            </div>
          ) : mode === null ? (
            <div className="flex items-center gap-2">
              <Button onClick={() => setMode('approve')}>Approve</Button>
              <Button variant="secondary" onClick={() => setMode('reject')}>
                Reject
              </Button>
            </div>
          ) : (
            <div className="max-w-md">
              <DecisionForm key={mode} decision={mode} onCancel={() => setMode(null)} onSubmit={() => setState(mode === 'approve' ? 'approved' : 'rejected')} />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <SlaIndicator
            label="Time to decide"
            remaining={state === 'pending' ? '5 h 20 min left' : 'Decided in 4 h 20 min'}
            elapsed={0.34}
            state="on-track"
            due="Due 12 Mar, 19:20"
          />
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-base-foreground">Approval chain</h3>
            <ApprovalChain label="Approval chain for MOC-2231" steps={chain} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ApprovalReviewInbox() {
  const [selectedId, setSelectedId] = useState('PTW-2291');
  const [decided, setDecided] = useState<Readonly<Record<string, ApprovalState>>>({});
  const request = PENDING.find((candidate) => candidate.id === selectedId) ?? PENDING[0];
  const requester = person(request.requesterId);
  const state = decided[request.id] ?? 'pending';
  const decide = (next: ApprovalState) => setDecided({ ...decided, [request.id]: next });
  const open = PENDING.filter((candidate) => (decided[candidate.id] ?? 'pending') === 'pending').length;
  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-start gap-6">
      <div className="flex min-w-0 flex-col gap-2">
        <SectionHeader as="h3" size="sm" title="Waiting for you" count={open} />
        <ItemGroup aria-label="Requests waiting for you">
          {PENDING.map((candidate) => {
            const candidateState = decided[candidate.id] ?? 'pending';
            return (
              <EntityRow
                key={candidate.id}
                selected={candidate.id === request.id}
                onOpen={() => setSelectedId(candidate.id)}
                title={candidate.title}
                description={
                  <>
                    <span className="font-mono">{candidate.id}</span> · {candidate.kind}
                  </>
                }
                meta={
                  candidateState === 'pending' ? (
                    <span className={`whitespace-nowrap tabular-nums ${candidate.late ? 'font-medium text-critical-foreground-strong' : ''}`}>{candidate.due}</span>
                  ) : (
                    <ApprovalStateBadge state={candidateState} />
                  )
                }
              />
            );
          })}
        </ItemGroup>
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <ApprovalCard
          reference={request.id}
          kind={request.kind}
          title={request.title}
          requester={requester}
          requestedAt={`${request.waited} ago`}
          state={state}
          decision={state === 'approved' ? 'Approved by you · 12 Mar, 14:00' : 'Rejected by you · 12 Mar, 14:00'}
          footerNote={request.due}
          onApprove={() => decide('approved')}
          onReject={() => decide('rejected')}
        />
        {state === 'pending' ? null : (
          <Button variant="ghost" size="sm" className="self-start" onClick={() => decide('pending')}>
            Undo decision
          </Button>
        )}
      </div>
    </div>
  );
}

export default definePage({
  id: 'approvals-and-reviews',
  title: 'Approvals and reviews',
  summary:
    'Asking for a decision and giving one: request cards that carry who, what and why, the states a request moves through, the chain of approvers and the record it leaves.',
  guidance: {
    use: [
      'Everything needed to decide on the card: requester, the change itself and the reason.',
      'A reason field that is required for rejecting and sending back, optional for approving.',
      'The approval chain in order, with whose turn it is and when each person decided.',
      'Time left in words, and an escalation path once a decision is overdue.',
    ],
    avoid: [
      'A destructive red "Reject" beside "Approve"; keep both calm and confirm the rejection with a reason.',
      'States told apart by colour only. Each state has its own icon and word.',
      'Bulk approval for requests that each need reading, such as limit changes.',
      'Hiding who decided. A decided request names the person and the time.',
    ],
  },
  source,
  sections: [
    {
      id: 'requests',
      title: 'Requests',
      description: 'The request itself, and the small indicators that travel with it.',
      specimens: [
        {
          id: 'ApprovalReviewRequestCard',
          title: 'Approval request card',
          note: 'A request the approver can answer from where they read it. The buttons give way to the decision.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/ApprovalCard.tsx', 'patterns/workflows/DiffValue.tsx', 'patterns/workflows/ApprovalStateBadge.tsx'],
          Component: ApprovalReviewRequestCard,
        },
        {
          id: 'ApprovalReviewRequestedChange',
          title: 'Requested change summary',
          note: 'Current beside requested, field by field, so the approver sees exactly what changes and what stays.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/CompareTable.tsx', 'patterns/workflows/ChangeMarker.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: ApprovalReviewRequestedChange,
        },
        {
          id: 'ApprovalReviewStateBadges',
          title: 'Request states',
          note: 'The five states of a request, each with its own icon and word.',
          origin: 'custom',
          uses: ['patterns/workflows/ApprovalStateBadge.tsx', 'patterns/workflows/approvalState.ts'],
          Component: ApprovalReviewStateBadges,
        },
        {
          id: 'ApprovalReviewSla',
          title: 'Time remaining',
          note: 'Requests with a response time: neutral while on track, coloured once it is due soon or overdue.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/SlaIndicator.tsx'],
          Component: ApprovalReviewSla,
        },
        {
          id: 'ApprovalReviewDelegation',
          title: 'Delegation notice',
          note: 'Someone else decides for a while: say who, until when and why, wherever approvals are listed.',
          origin: 'custom',
          align: 'stretch',
          Component: ApprovalReviewDelegation,
        },
      ],
    },
    {
      id: 'states',
      title: 'Decided and closed',
      description: 'What a request card shows once it is no longer waiting.',
      specimens: [
        {
          id: 'ApprovalReviewApproved',
          title: 'Approved',
          note: 'The record of a yes: who approved and when replaces the buttons.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/ApprovalCard.tsx'],
          Component: ApprovalReviewApproved,
        },
        {
          id: 'ApprovalReviewRejected',
          title: 'Rejected with reason',
          note: 'A no always comes with the reason, quoted on the card for the requester.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/ApprovalCard.tsx'],
          Component: ApprovalReviewRejected,
        },
        {
          id: 'ApprovalReviewChangesRequested',
          title: 'Changes requested',
          note: 'Back with the requester: what to fix, and the action that sends it round again.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/ApprovalCard.tsx'],
          Component: ApprovalReviewChangesRequested,
        },
        {
          id: 'ApprovalReviewExpired',
          title: 'Expired',
          note: 'Nobody decided in time. Say so plainly and offer to raise the request again.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/ApprovalCard.tsx'],
          Component: ApprovalReviewExpired,
        },
      ],
    },
    {
      id: 'deciding',
      title: 'Deciding',
      description: 'The step between reading a request and answering it.',
      specimens: [
        {
          id: 'ApprovalReviewApproveComment',
          title: 'Approve with comment',
          note: 'An optional note for the record and the next approver. Submitting empty is fine.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/DecisionForm.tsx', 'forms/FormField.tsx'],
          Component: ApprovalReviewApproveComment,
        },
        {
          id: 'ApprovalReviewRejectReason',
          title: 'Reject with required reason',
          note: 'Rejecting without a reason is blocked with a message. Try submitting empty.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/DecisionForm.tsx', 'forms/FormField.tsx'],
          Component: ApprovalReviewRejectReason,
        },
        {
          id: 'ApprovalReviewChecklist',
          title: 'Review checklist',
          note: 'Reviews with fixed criteria: approval unlocks when every check is confirmed, and says how many are left.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx'],
          Component: ApprovalReviewChecklist,
        },
        {
          id: 'ApprovalReviewBulk',
          title: 'Bulk approve',
          note: 'Many small, similar requests, such as access. Select, then decide once; the button carries the count.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'patterns/collections/useSelection.ts'],
          Component: ApprovalReviewBulk,
        },
      ],
    },
    {
      id: 'chain-and-record',
      title: 'Chain and record',
      description: 'Who decides in which order, and what is kept afterwards.',
      specimens: [
        {
          id: 'ApprovalReviewChain',
          title: 'Approval chain',
          note: 'Sequential approval: who has decided, whose turn it is and who is still to come.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/ApprovalChain.tsx'],
          Component: ApprovalReviewChain,
        },
        {
          id: 'ApprovalReviewHistory',
          title: 'Approval history',
          note: 'The audit trail of one request, oldest first, with every hand-off and comment.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/operations/EventTimeline.tsx'],
          Component: ApprovalReviewHistory,
        },
        {
          id: 'ApprovalReviewSignOff',
          title: 'Sign-off block',
          note: 'Formal sign-off by role: name, role and time per signature, with your own row carrying the button.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/workflows/SignOffBlock.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: ApprovalReviewSignOff,
        },
        {
          id: 'ApprovalReviewEscalation',
          title: 'Escalation banner',
          note: 'An overdue decision that holds something up: what waits, for whom, and the way past them.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ApprovalReviewEscalation,
        },
      ],
    },
    {
      id: 'lists-and-headers',
      title: 'Lists and headers',
      description: 'Finding the requests that wait for you, and opening one.',
      specimens: [
        {
          id: 'ApprovalReviewMyPending',
          title: 'My pending approvals',
          note: 'An approver inbox: each row says what, from whom and how long is left.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'patterns/structure/SectionHeader.tsx', 'display/PersonAvatar.tsx'],
          Component: ApprovalReviewMyPending,
        },
        {
          id: 'ApprovalReviewInboxSummary',
          title: 'Inbox summary',
          note: 'A dashboard corner: how many requests wait, how many are due and how many you raised.',
          origin: 'custom',
          align: 'stretch',
          Component: ApprovalReviewInboxSummary,
        },
        {
          id: 'ApprovalReviewMocHeader',
          title: 'Management-of-change header',
          note: 'The top of a request page: the change, its state, the facts and the three answers.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx', 'display/MetadataList.tsx', 'patterns/workflows/ApprovalStateBadge.tsx'],
          Component: ApprovalReviewMocHeader,
        },
      ],
    },
    {
      id: 'full-reviews',
      title: 'Full reviews',
      description: 'Complete review screens. Decisions change the state, the chain and the inbox.',
      specimens: [
        {
          id: 'ApprovalReviewMocReview',
          title: 'Change review',
          note: 'One management-of-change request end to end: reason, change, time left, chain and the decision with its comment.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/workflows/CompareTable.tsx',
            'patterns/workflows/ApprovalChain.tsx',
            'patterns/workflows/DecisionForm.tsx',
            'patterns/workflows/SlaIndicator.tsx',
            'patterns/structure/PageHeader.tsx',
          ],
          Component: ApprovalReviewMocReview,
        },
        {
          id: 'ApprovalReviewInbox',
          title: 'Approver inbox',
          note: 'Working through a queue: the list on the left, the selected request and its answer on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'patterns/workflows/ApprovalCard.tsx', 'patterns/workflows/ApprovalStateBadge.tsx'],
          Component: ApprovalReviewInbox,
        },
      ],
    },
  ],
});
