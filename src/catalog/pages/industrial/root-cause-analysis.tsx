import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { IconAlertTriangle, IconArrowNarrowRight, IconBulb, IconChartLine, IconFileText, IconPhoto } from '@cognite/aura/icons';
import { useState } from 'react';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { PriorityBadge } from '../../../library/industrial/operations/PriorityBadge';
import { SeverityBadge } from '../../../library/industrial/operations/SeverityBadge';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatDelta, formatValue } from '../../../library/industrial/status';
import type { StatusDescriptor } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { FaultTree } from '../../../library/industrial/workflows/FaultTree';
import type { FaultTreeNode } from '../../../library/industrial/workflows/FaultTree';
import { PagePreview } from '../../../library/industrial/workflows/PagePreview';
import { SignOffBlock } from '../../../library/industrial/workflows/SignOffBlock';
import type { SignOffSigner } from '../../../library/industrial/workflows/SignOffBlock';
import { StepList } from '../../../library/industrial/workflows/StepList';
import type { StepListItem } from '../../../library/industrial/workflows/StepList';
import { TagChip } from '../../../library/industrial/workflows/TagChip';
import { WhyChain } from '../../../library/industrial/workflows/WhyChain';
import type { WhyStep } from '../../../library/industrial/workflows/WhyChain';
import { causeStatus } from '../../../library/industrial/workflows/workflow';
import type { CauseState } from '../../../library/industrial/workflows/workflow';
import { definePage } from '../../types';

import source from './root-cause-analysis.tsx?raw';

/** The investigation into the recompressor trip of 12 March 2026, as it stands on 18 March. */
const INCIDENT = {
  id: 'INC-2026-031',
  title: 'Recompressor trip on high vibration',
  asset: '23-KA-9103',
  assetName: 'Recompressor',
  occurred: '12 Mar 2026, 13:46',
  lead: 'Aisha Khan',
  downtimeHours: 31,
  deferredGas: 0.42,
};

const PHASES: readonly StepListItem[] = [
  { id: 'report', label: 'Reported', detail: '12 Mar', state: 'done' },
  { id: 'evidence', label: 'Evidence', detail: '14 Mar', state: 'done' },
  { id: 'analysis', label: 'Analysis', detail: '17 Mar', state: 'done' },
  { id: 'actions', label: 'Actions', detail: '2 of 6 done', state: 'active' },
  { id: 'review', label: 'Review', state: 'pending' },
  { id: 'closed', label: 'Closed', state: 'pending' },
];

type TimelineEvent = { time: string; text: string; tag?: string; kind: 'normal' | 'warning' | 'trip' };

const TIMELINE: readonly TimelineEvent[] = [
  { time: '09:40', text: 'Lube oil filter differential pressure alarm, 0.9 bar. Acknowledged, no action taken.', tag: '23-PDT-92775', kind: 'warning' },
  { time: '11:15', text: 'Lube oil supply pressure starts to fall from 2.4 barg.', tag: '23-PT-92770', kind: 'normal' },
  { time: '12:50', text: 'Drive-end bearing temperature rises from 78 to 92 °C.', tag: '23-TT-92745', kind: 'normal' },
  { time: '13:22', text: 'High vibration alarm at 7.4 mm/s.', tag: '23-VT-92740', kind: 'warning' },
  { time: '13:41', text: 'Vibration 9.8 mm/s. Operator reduces speed by 5 %.', tag: '23-VT-92740', kind: 'normal' },
  { time: '13:46', text: 'Trip on high-high vibration, 11.6 mm/s against an 11.0 mm/s limit.', tag: '23-VT-92740', kind: 'trip' },
  { time: '13:50', text: 'Unit isolated and handed to maintenance.', kind: 'normal' },
];

const WHYS: readonly WhyStep[] = [
  { id: 'w1', question: 'Why did the recompressor trip?', answer: 'Drive-end vibration reached 11.6 mm/s, above the 11.0 mm/s trip limit.' },
  { id: 'w2', question: 'Why did vibration rise?', answer: 'The drive-end bearing ran with too little oil and overheated.' },
  { id: 'w3', question: 'Why was there too little oil?', answer: 'Lube oil supply pressure fell from 2.4 to 1.9 barg over two and a half hours.' },
  { id: 'w4', question: 'Why did the pressure fall?', answer: 'The lube oil filter was blocked; its differential pressure had been in alarm since 09:40.' },
  { id: 'w5', question: 'Why was the filter not changed?', answer: 'The filter change due on 2 March was deferred twice without a risk review.' },
];

const FAULT_TREE: FaultTreeNode = {
  id: 'top',
  label: 'Recompressor trip on high vibration',
  gate: 'OR',
  children: [
    {
      id: 'real',
      label: 'True high vibration',
      gate: 'OR',
      state: 'confirmed',
      children: [
        {
          id: 'bearing',
          label: 'Drive-end bearing degradation',
          gate: 'AND',
          state: 'confirmed',
          children: [
            { id: 'lube', label: 'Reduced lube oil flow', state: 'confirmed' },
            { id: 'load', label: 'Continued operation at load', state: 'confirmed' },
          ],
        },
        { id: 'fouling', label: 'Rotor imbalance from fouling', state: 'ruled-out' },
        { id: 'alignment', label: 'Misalignment after last overhaul', state: 'open' },
      ],
    },
    {
      id: 'spurious',
      label: 'Spurious trip',
      gate: 'OR',
      state: 'ruled-out',
      children: [
        { id: 'probe', label: 'Probe or cable fault', state: 'ruled-out' },
        { id: 'setting', label: 'Trip setting changed', state: 'ruled-out' },
      ],
    },
  ],
};

type Cause = { id: string; text: string; state: CauseState };

const CAUSE_GROUPS: readonly { category: string; causes: readonly Cause[] }[] = [
  {
    category: 'Equipment',
    causes: [
      { id: 'eq1', text: 'Lube oil filter blocked', state: 'confirmed' },
      { id: 'eq2', text: 'Drive-end bearing worn', state: 'confirmed' },
      { id: 'eq3', text: 'Vibration probe faulty', state: 'ruled-out' },
    ],
  },
  {
    category: 'Process',
    causes: [
      { id: 'pr1', text: 'Unit kept at load with the filter alarm standing', state: 'confirmed' },
      { id: 'pr2', text: 'No trip on low lube oil flow', state: 'confirmed' },
    ],
  },
  {
    category: 'People',
    causes: [
      { id: 'pe1', text: 'Filter alarm acknowledged without action', state: 'confirmed' },
      { id: 'pe2', text: 'Preventive work order deferred twice without a risk review', state: 'confirmed' },
    ],
  },
  {
    category: 'Environment',
    causes: [{ id: 'en1', text: 'Dust from nearby scaffolding work entering the oil system', state: 'open' }],
  },
];

const FACTORS: readonly { id: string; text: string; category: string; weight: number }[] = [
  { id: 'f1', text: 'Filter change deferred without a risk review', category: 'People', weight: 40 },
  { id: 'f2', text: 'Filter alarm acknowledged without action', category: 'People', weight: 25 },
  { id: 'f3', text: 'No trip on low lube oil flow', category: 'Process', weight: 20 },
  { id: 'f4', text: 'Dust ingress from scaffolding work', category: 'Environment', weight: 10 },
  { id: 'f5', text: 'Bearing near end of life', category: 'Equipment', weight: 5 },
];

type Evidence = { id: string; kind: 'trend' | 'alarm' | 'document' | 'photo'; title: string; detail: string; supports: 'supports' | 'contradicts' | 'inconclusive' };

const EVIDENCE: readonly Evidence[] = [
  { id: 'E-01', kind: 'trend', title: 'Vibration and bearing temperature, 09:00–14:00', detail: '23-VT-92740, 23-TT-92745', supports: 'supports' },
  { id: 'E-02', kind: 'alarm', title: 'Filter differential pressure alarm, 09:40', detail: 'ALM-4807 · acknowledged 09:42', supports: 'supports' },
  { id: 'E-03', kind: 'document', title: 'Deferral history of the filter change', detail: 'WO-103977 · deferred 2 and 9 Mar', supports: 'supports' },
  { id: 'E-04', kind: 'photo', title: 'Blocked filter element after removal', detail: '3 photos · Tomás Barros, 13 Mar', supports: 'supports' },
  { id: 'E-05', kind: 'document', title: 'Vibration probe loop test', detail: 'Test record · Jonas Nyberg, 13 Mar', supports: 'contradicts' },
  { id: 'E-06', kind: 'document', title: 'Oil sample particle analysis', detail: 'Lab report pending', supports: 'inconclusive' },
];

const EVIDENCE_ICON = { trend: IconChartLine, alarm: IconAlertTriangle, document: IconFileText, photo: IconPhoto } as const;
const EVIDENCE_KIND: Record<Evidence['kind'], string> = { trend: 'Trend', alarm: 'Alarm', document: 'Document', photo: 'Photo' };

const SUPPORT_STATUS: Record<Evidence['supports'], StatusDescriptor> = {
  supports: { tone: 'neutral', label: 'Supports', shape: 'dot' },
  contradicts: { tone: 'neutral', label: 'Contradicts', shape: 'square' },
  inconclusive: { tone: 'neutral', label: 'Inconclusive', shape: 'ring' },
};

type Hypothesis = { id: string; title: string; state: CauseState; reasoning: string; evidence: readonly string[] };

const HYPOTHESES: readonly Hypothesis[] = [
  { id: 'H1', title: 'Loss of lubrication from a blocked filter', state: 'confirmed', reasoning: 'Filter alarm, falling oil pressure and rising bearing temperature all precede the vibration by hours.', evidence: ['E-01', 'E-02', 'E-04'] },
  { id: 'H2', title: 'Spurious trip from a probe fault', state: 'ruled-out', reasoning: 'The probe loop tested healthy and bearing temperature rose independently of the vibration signal.', evidence: ['E-05'] },
  { id: 'H3', title: 'Misalignment after the last overhaul', state: 'open', reasoning: 'Cannot be excluded until the alignment is measured with the new bearing fitted.', evidence: [] },
];

type Action = { id: string; text: string; owner: string; due: string; state: 'done' | 'in-progress' | 'open' | 'overdue'; link?: string };

const ACTIONS: readonly Action[] = [
  { id: 'CA-1', text: 'Replace lube oil filter and flush the oil system', owner: 'Tomás Barros', due: '13 Mar', state: 'done', link: 'WO-104495' },
  { id: 'CA-2', text: 'Replace drive-end bearing', owner: 'Tomás Barros', due: '14 Mar', state: 'done', link: 'WO-104482' },
  { id: 'CA-3', text: 'Measure shaft alignment with the new bearing', owner: 'Aisha Khan', due: '16 Mar', state: 'overdue', link: 'WO-104498' },
  { id: 'CA-4', text: 'Make the filter alarm high priority with a required response', owner: 'Ingrid Haugen', due: '20 Mar', state: 'in-progress' },
  { id: 'CA-5', text: 'Require a risk review to defer preventive work on criticality A equipment', owner: 'Magnus Solberg', due: '27 Mar', state: 'open' },
  { id: 'CA-6', text: 'Evaluate a trip on low lube oil flow', owner: 'Aisha Khan', due: '10 Apr', state: 'open' },
];

const ACTION_STATE: Record<Action['state'], StatusDescriptor> = {
  done: { tone: 'success', label: 'Done', shape: 'dot' },
  'in-progress': { tone: 'info', label: 'In progress', shape: 'ring' },
  open: { tone: 'neutral', label: 'Open', shape: 'ring' },
  overdue: { tone: 'critical', label: 'Overdue', shape: 'diamond' },
};

const COMPARISON: readonly { label: string; tag: string; before: number; after: number; unit: string; decimals: number }[] = [
  { label: 'Lube oil supply pressure', tag: '23-PT-92770', before: 1.9, after: 2.5, unit: 'barg', decimals: 1 },
  { label: 'Filter differential pressure', tag: '23-PDT-92775', before: 0.9, after: 0.2, unit: 'bar', decimals: 1 },
  { label: 'Drive-end bearing temperature', tag: '23-TT-92745', before: 92, after: 64, unit: '°C', decimals: 0 },
  { label: 'Drive-end vibration', tag: '23-VT-92740', before: 11.6, after: 2.1, unit: 'mm/s', decimals: 1 },
];

const SIMILAR: readonly { id: string; title: string; site: string; date: string; match: number; shared: string }[] = [
  { id: 'INC-2024-112', title: '1st stage compressor trip on low lube oil pressure', site: 'Nordkapp', date: 'Nov 2024', match: 82, shared: 'Blocked filter, deferred maintenance' },
  { id: 'INC-2025-047', title: 'Export pump A bearing failure', site: 'Nordkapp', date: 'May 2025', match: 64, shared: 'Bearing wear, alarm not acted on' },
  { id: 'INC-2023-090', title: 'Recompressor vibration trip after fouling', site: 'Hammerfest LNG', date: 'Sep 2023', match: 51, shared: 'Same compressor type' },
];

const LINKED_ORDERS: readonly { id: string; title: string; priority: 'P1' | 'P2' | 'P3'; status: 'done' | 'in-progress' | 'open'; role: string }[] = [
  { id: 'WO-104482', title: 'Inspect recompressor drive-end bearing', priority: 'P1', status: 'done', role: 'Repair' },
  { id: 'WO-104495', title: 'Replace lube oil filter and flush system', priority: 'P1', status: 'done', role: 'Repair' },
  { id: 'WO-104498', title: 'Measure shaft alignment', priority: 'P2', status: 'in-progress', role: 'Corrective action' },
  { id: 'WO-103977', title: 'Change recompressor lube oil filter', priority: 'P3', status: 'open', role: 'Deferred before the trip' },
];

const APPROVERS: readonly SignOffSigner[] = [
  { id: 'lead', role: 'Lead investigator', name: 'Aisha Khan', state: 'signed', at: '18 Mar, 10:12' },
  { id: 'maintenance', role: 'Maintenance planner', name: 'Magnus Solberg', state: 'signed', at: '18 Mar, 11:40' },
  { id: 'supervisor', role: 'Shift supervisor', name: 'Liv Wold', state: 'pending' },
  { id: 'manager', role: 'Plant manager', state: 'pending' },
];

/** Vibration on 12 March, one value every 10 minutes from 09:00 to the trip at 13:46. */
const VIBRATION = [2.1, 2.2, 2.1, 2.3, 2.2, 2.4, 2.3, 2.5, 2.6, 2.8, 2.9, 3.1, 3.4, 3.6, 3.9, 4.2, 4.6, 5.0, 5.4, 5.9, 6.3, 6.8, 7.1, 7.4, 8.0, 8.6, 9.2, 9.8, 11.6];

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

const TIMELINE_DOT: Record<TimelineEvent['kind'], string> = {
  normal: 'size-2 rounded-full bg-neutral-foreground-strong',
  warning: 'size-2 rounded-xs bg-warning-foreground-strong',
  trip: 'size-2.5 rotate-45 rounded-xs bg-critical-foreground-strong',
};

const TIMELINE_WORD: Record<TimelineEvent['kind'], string> = { normal: 'Event', warning: 'Alarm', trip: 'Trip' };

function EvidenceRow({ item }: { item: Evidence }) {
  const Icon = EVIDENCE_ICON[item.kind];
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted-background text-muted-foreground">
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-base-foreground">{item.title}</span>
        <span className="truncate text-xs text-muted-foreground">
          <span className="font-mono">{item.id}</span> · {EVIDENCE_KIND[item.kind]} · {item.detail}
        </span>
      </div>
      <span className="w-24 shrink-0">
        <StatusIndicator size="sm" {...SUPPORT_STATUS[item.supports]} />
      </span>
    </li>
  );
}

function HypothesisCard({ hypothesis }: { hypothesis: Hypothesis }) {
  return (
    <Card className="min-w-0 gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-muted-foreground">{hypothesis.id}</span>
        <StatusIndicator size="sm" {...causeStatus(hypothesis.state)} />
      </div>
      <span className={`text-sm font-medium ${hypothesis.state === 'ruled-out' ? 'text-muted-foreground' : 'text-base-foreground'}`}>{hypothesis.title}</span>
      <p className="text-sm text-muted-foreground">{hypothesis.reasoning}</p>
      <div className="mt-auto flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {hypothesis.evidence.length === 0 ? 'No evidence yet' : 'Evidence'}
        {hypothesis.evidence.map((id) => (
          <TagChip key={id} tag={id} className="bg-base-background" />
        ))}
      </div>
    </Card>
  );
}

function RootCauseIncidentHeader() {
  return (
    <div className="flex w-full flex-wrap items-start justify-between gap-x-8 gap-y-4">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{INCIDENT.id}</span>
          <SeverityBadge severity="high" />
          <StatusIndicator variant="badge" tone="info" label="Actions in progress" />
        </div>
        <h3 className="text-xl font-semibold text-base-foreground">{INCIDENT.title}</h3>
        <p className="text-sm text-muted-foreground tabular-nums">
          <span className="font-mono">{INCIDENT.asset}</span> {INCIDENT.assetName} · Nordkapp · {INCIDENT.occurred}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <PersonAvatar name={INCIDENT.lead} sizes="xsm" />
          <span className="text-sm text-base-foreground">{INCIDENT.lead}</span>
          <span className="text-sm text-muted-foreground">· Lead investigator</span>
        </div>
      </div>
      <dl className="flex gap-8">
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Downtime</dt>
          <dd>
            <ValueReadout value={INCIDENT.downtimeHours} unit="h" />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Deferred gas</dt>
          <dd>
            <ValueReadout value={INCIDENT.deferredGas} unit="MSm³" decimals={2} />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Actions done</dt>
          <dd>
            <ValueReadout value={2} unit="of 6" />
          </dd>
        </div>
      </dl>
    </div>
  );
}

function RootCauseTimeline() {
  return (
    <ol aria-label="Events leading to the trip, 12 March" className="flex w-full max-w-lg flex-col">
      {TIMELINE.map((event, index) => (
        <li key={event.time + event.text} className="relative grid grid-cols-[2.75rem_1rem_minmax(0,1fr)] gap-x-2 pb-3 last:pb-0">
          <time className={`pt-0.5 text-xs tabular-nums ${event.kind === 'trip' ? 'font-medium text-base-foreground' : 'text-muted-foreground'}`}>{event.time}</time>
          <span className="relative flex justify-center pt-1.5">
            {index < TIMELINE.length - 1 ? <span aria-hidden className="absolute top-4 -bottom-3 border-l border-emphasized" /> : null}
            <span aria-hidden className={`relative ${TIMELINE_DOT[event.kind]}`} />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className={`text-sm ${event.kind === 'trip' ? 'font-medium text-critical-foreground-strong' : 'text-base-foreground'}`}>
              <span className="sr-only">{TIMELINE_WORD[event.kind]}: </span>
              {event.text}
            </span>
            {event.tag ? <span className="font-mono text-xs text-muted-foreground">{event.tag}</span> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function RootCauseProgress() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Investigation progress</span>
        <span className="text-xs text-muted-foreground">Phase 4 of 6 · day 6</span>
      </div>
      <StepList orientation="horizontal" label={`Investigation progress, ${INCIDENT.id}`} steps={PHASES} />
    </div>
  );
}

function RootCauseCauseStates() {
  return (
    <div className="flex flex-col gap-3">
      <StatusIndicator {...causeStatus('confirmed')} />
      <StatusIndicator {...causeStatus('open')} />
      <StatusIndicator {...causeStatus('ruled-out')} />
    </div>
  );
}

function RootCauseHypotheses() {
  return (
    <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
      {HYPOTHESES.map((hypothesis) => (
        <HypothesisCard key={hypothesis.id} hypothesis={hypothesis} />
      ))}
    </div>
  );
}

function RootCauseFiveWhys() {
  return (
    <div className="w-full max-w-lg">
      <WhyChain label={`Five whys, ${INCIDENT.title.toLowerCase()}`} steps={WHYS} />
    </div>
  );
}

function RootCauseFaultTree() {
  return (
    <div className="w-full max-w-lg">
      <FaultTree label={`Fault tree, ${INCIDENT.title.toLowerCase()}`} root={FAULT_TREE} />
    </div>
  );
}

function RootCauseCauseEffect() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      {CAUSE_GROUPS.map((group) => (
        <section key={group.category} className="flex flex-col gap-2">
          <h4 className="flex items-baseline justify-between gap-3 border-b border-default pb-1 text-xs font-medium text-muted-foreground">
            <span>{group.category}</span>
            <span className="font-normal tabular-nums">
              {group.causes.filter((cause) => cause.state === 'confirmed').length} of {group.causes.length} confirmed
            </span>
          </h4>
          <ul className="flex flex-col gap-2">
            {group.causes.map((cause) => (
              <li key={cause.id} className="flex items-baseline justify-between gap-3">
                <span className={`min-w-0 text-sm ${cause.state === 'ruled-out' ? 'text-muted-foreground' : 'text-base-foreground'}`}>{cause.text}</span>
                <span className="w-24 shrink-0">
                  <StatusIndicator size="sm" {...causeStatus(cause.state)} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function RootCauseRanking() {
  const peak = Math.max(...FACTORS.map((factor) => factor.weight));
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Contributing factors</span>
        <span className="text-xs text-muted-foreground">Share of contribution, team estimate</span>
      </div>
      <ol className="flex flex-col gap-3">
        {FACTORS.map((factor, index) => (
          <li key={factor.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)_2.5rem] items-center gap-x-2 gap-y-1">
            <span className="text-xs text-muted-foreground tabular-nums">{index + 1}</span>
            <span className="truncate text-sm text-base-foreground">
              {factor.text} <span className="text-xs text-muted-foreground">· {factor.category}</span>
            </span>
            <span className="text-right text-sm text-base-foreground tabular-nums">{factor.weight} %</span>
            <span />
            <span role="img" aria-label={`${factor.text}: ${factor.weight} percent`} className="col-span-2 block h-1.5 rounded-full bg-muted-background">
              <span className="block h-full rounded-full bg-chart-1-450" style={{ width: `${(factor.weight / peak) * 100}%` }} />
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RootCauseEvidenceList() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Evidence</span>
        <span className="text-xs text-muted-foreground tabular-nums">{EVIDENCE.length} items · against hypothesis H1</span>
      </div>
      <ul className="flex flex-col divide-y divide-default">
        {EVIDENCE.map((item) => (
          <EvidenceRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

function RootCauseEvidenceTrend() {
  return (
    <Card className="w-full max-w-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium text-base-foreground">Drive-end vibration before the trip</span>
          <span className="text-xs text-muted-foreground">
            <span className="font-mono">E-01</span> · <span className="font-mono">23-VT-92740</span> · 12 Mar 09:00–13:46
          </span>
        </div>
        <ValueReadout size="sm" value={11.6} unit="mm/s" decimals={1} tone="critical" />
      </div>
      <div className="flex w-full flex-col gap-1">
        <Sparkline values={VIBRATION} label="Drive-end vibration, 12 March 09:00 to 13:46, with the 11.0 mm/s trip limit" unit="mm/s" limit={11} tone="critical" variant="area" height={72} showLast domain={[0, 12]} />
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>09:00</span>
          <span>Dashed line: trip limit 11.0 mm/s</span>
          <span>13:46</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Vibration climbs steadily for four hours rather than stepping up, which points at a developing mechanical fault and away from a probe failure.</p>
    </Card>
  );
}

function RootCausePhotoEvidence() {
  return (
    <figure className="flex w-full max-w-56 flex-col gap-2">
      <PagePreview kind="photo" label="Photo of the blocked lube oil filter element after removal" />
      <figcaption className="flex flex-col">
        <span className="text-sm text-base-foreground">Blocked filter element</span>
        <span className="text-xs text-muted-foreground">
          <span className="font-mono">E-04</span> · photo 1 of 3 · Tomás Barros, 13 Mar
        </span>
      </figcaption>
    </figure>
  );
}

function RootCauseEvidenceStrength() {
  const counts = (support: Evidence['supports']) => EVIDENCE.filter((item) => item.supports === support).length;
  return (
    <div className="flex w-full max-w-56 flex-col gap-3">
      <span className="text-xs text-muted-foreground">
        Evidence for <span className="font-mono">H1</span>
      </span>
      <StatusIndicator {...SUPPORT_STATUS.supports} detail={String(counts('supports'))} />
      <StatusIndicator {...SUPPORT_STATUS.contradicts} detail={String(counts('contradicts'))} />
      <StatusIndicator {...SUPPORT_STATUS.inconclusive} detail={String(counts('inconclusive'))} />
    </div>
  );
}

function RootCauseImpact() {
  return (
    <Card className="w-full max-w-64 gap-3">
      <span className="text-xs text-muted-foreground">Impact of the incident</span>
      <ValueReadout value={INCIDENT.downtimeHours} unit="h downtime" />
      <dl className="flex flex-col gap-2 border-t border-default pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs text-muted-foreground">Deferred gas</dt>
          <dd>
            <ValueReadout size="xs" value={INCIDENT.deferredGas} unit="MSm³" decimals={2} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs text-muted-foreground">Flared</dt>
          <dd>
            <ValueReadout size="xs" value={18} unit="kSm³" />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs text-muted-foreground">Injuries</dt>
          <dd>
            <ValueReadout size="xs" value={0} />
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function RootCauseBeforeAfter() {
  return (
    <div className="w-full max-w-lg overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Reading
            </th>
            <th scope="col" className={`${TH} text-right`}>
              At trip
            </th>
            <th scope="col" className={`${TH} text-right`}>
              After repair
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Change
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map((row) => (
            <tr key={row.tag} className="border-t border-default">
              <td className={TD}>
                <div className="flex min-w-0 flex-col">
                  <span className="text-base-foreground">{row.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">{row.tag}</span>
                </div>
              </td>
              <td className={`${TD} text-right whitespace-nowrap text-muted-foreground tabular-nums`}>{formatValue(row.before, row.decimals)}</td>
              <td className={`${TD} text-right`}>
                <ValueReadout size="xs" value={row.after} unit={row.unit} decimals={row.decimals} />
              </td>
              <td className={`${TD} text-right whitespace-nowrap text-base-foreground tabular-nums`}>{formatDelta(row.after - row.before, row.decimals)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RootCauseSimilarIncidents() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Similar past incidents</span>
        <span className="text-xs text-muted-foreground">Ranked by shared causes</span>
      </div>
      <ul className="flex flex-col divide-y divide-default">
        {SIMILAR.map((incident) => (
          <li key={incident.id} className="grid grid-cols-[minmax(0,1fr)_4rem_2.5rem] items-center gap-3 py-2">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm text-base-foreground">{incident.title}</span>
              <span className="truncate text-xs text-muted-foreground">
                <span className="font-mono">{incident.id}</span> · {incident.site} · {incident.date} · {incident.shared}
              </span>
            </div>
            <span role="img" aria-label={`${incident.match} percent similar`} className="block h-1.5 rounded-full bg-muted-background">
              <span className="block h-full rounded-full bg-chart-1-450" style={{ width: `${incident.match}%` }} />
            </span>
            <span className="text-right text-sm text-base-foreground tabular-nums">{incident.match} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RootCauseLinkedWorkOrders() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Linked work orders</span>
        <span className="text-xs text-muted-foreground tabular-nums">{LINKED_ORDERS.length} linked</span>
      </div>
      <ul className="flex flex-col divide-y divide-default">
        {LINKED_ORDERS.map((order) => (
          <li key={order.id} className="flex items-center gap-3 py-2">
            <PriorityBadge priority={order.priority} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-base-foreground">{order.title}</span>
              <span className="truncate text-xs text-muted-foreground">
                <span className="font-mono">{order.id}</span> · {order.role}
              </span>
            </div>
            <StatusBadge status={order.status} outline />
          </li>
        ))}
      </ul>
    </div>
  );
}

function RootCauseLessons() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3 rounded-xl bg-muted-background p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-base-foreground">
        <IconBulb aria-hidden className="size-4 text-muted-foreground" />
        Lessons learned
      </div>
      <p className="text-sm text-base-foreground">
        A deferred filter change looked harmless on its own. Deferring it twice, on equipment with no trip on low oil flow, removed the last barrier before the bearing. Deferral of preventive work on criticality A
        equipment now needs a named risk owner.
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        Applies to
        <Badge variant="secondary">All compressors</Badge>
        <Badge variant="secondary">Maintenance planning</Badge>
        <Badge variant="secondary">Alarm response</Badge>
      </div>
    </div>
  );
}

function RootCauseActionsTable() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-3xl border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Action
            </th>
            <th scope="col" className={TH}>
              Owner
            </th>
            <th scope="col" className={TH}>
              Status
            </th>
            <th scope="col" className={TH}>
              Work order
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Due
            </th>
          </tr>
        </thead>
        <tbody>
          {ACTIONS.map((action) => (
            <tr key={action.id} className="border-t border-default">
              <td className={TD}>
                <span className="font-mono text-xs text-muted-foreground">{action.id}</span> <span className="text-base-foreground">{action.text}</span>
              </td>
              <td className={TD}>
                <span className="flex items-center gap-2 whitespace-nowrap text-base-foreground">
                  <PersonAvatar name={action.owner} sizes="xxsm" />
                  {action.owner}
                </span>
              </td>
              <td className={TD}>
                <StatusIndicator size="sm" {...ACTION_STATE[action.state]} />
              </td>
              <td className={`${TD} font-mono text-xs whitespace-nowrap text-muted-foreground`}>{action.link ?? '—'}</td>
              <td className={`${TD} text-right whitespace-nowrap tabular-nums ${action.state === 'overdue' ? 'font-medium text-critical-foreground-strong' : 'text-muted-foreground'}`}>{action.due}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RootCauseActionSummary() {
  const count = (state: Action['state']) => ACTIONS.filter((action) => action.state === state).length;
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Corrective actions</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {count('done')} of {ACTIONS.length} done
        </span>
      </div>
      <div role="img" aria-label={`${count('done')} done, ${count('in-progress')} in progress, ${count('open')} open, ${count('overdue')} overdue`} className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
        <span className="bg-chart-1-450" style={{ flexGrow: count('done') }} />
        <span className="bg-chart-1-300" style={{ flexGrow: count('in-progress') }} />
        <span className="bg-chart-critical-450" style={{ flexGrow: count('overdue') }} />
        <span className="bg-muted-background" style={{ flexGrow: count('open') }} />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <StatusIndicator size="sm" {...ACTION_STATE.done} detail={String(count('done'))} />
        <StatusIndicator size="sm" {...ACTION_STATE['in-progress']} detail={String(count('in-progress'))} />
        <StatusIndicator size="sm" {...ACTION_STATE.overdue} detail={String(count('overdue'))} />
        <StatusIndicator size="sm" {...ACTION_STATE.open} detail={String(count('open'))} />
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-mono">CA-3</span> is 2 days overdue: shaft alignment, Aisha Khan. The investigation cannot close while it is open.
      </p>
    </div>
  );
}

function RootCauseApproval() {
  const [signers, setSigners] = useState(APPROVERS);
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Approval of findings</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {signers.filter((signer) => signer.state === 'signed').length} of {signers.length} signed
        </span>
      </div>
      <SignOffBlock
        label={`Approval of findings, ${INCIDENT.id}`}
        signers={signers}
        currentSignerId="supervisor"
        signLabel="Approve findings"
        onSign={(id) => setSigners((current) => current.map((signer) => (signer.id === id ? { ...signer, state: 'signed', at: '18 Mar, 14:00' } : signer)))}
      />
    </div>
  );
}

function RootCauseReport() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{INCIDENT.title}</CardTitle>
          <CardDescription>
            <span className="font-mono">{INCIDENT.id}</span> · <span className="font-mono">{INCIDENT.asset}</span> {INCIDENT.assetName} · {INCIDENT.occurred} · lead {INCIDENT.lead}
          </CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <Button variant="outline" size="sm">
            Export report
          </Button>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <StepList orientation="horizontal" label={`Investigation progress, ${INCIDENT.id}`} steps={PHASES} />
        <div className="grid w-full grid-cols-1 gap-x-8 gap-y-6 border-t border-default pt-4 lg:grid-cols-3">
          <section className="flex min-w-0 flex-col gap-3">
            <h4 className="text-xs font-medium text-muted-foreground">Root cause</h4>
            <p className="text-sm font-medium text-base-foreground">{WHYS[4].answer}</p>
            <p className="text-sm text-muted-foreground">Reached through five whys and confirmed by the fault tree: reduced lube oil flow with continued operation at load.</p>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              Evidence
              {HYPOTHESES[0].evidence.map((id) => (
                <TagChip key={id} tag={id} className="bg-base-background" />
              ))}
            </div>
          </section>
          <section className="flex min-w-0 flex-col gap-3">
            <h4 className="text-xs font-medium text-muted-foreground">Hypotheses</h4>
            <ul className="flex flex-col gap-2">
              {HYPOTHESES.map((hypothesis) => (
                <li key={hypothesis.id} className="flex items-baseline justify-between gap-3">
                  <span className={`min-w-0 text-sm ${hypothesis.state === 'ruled-out' ? 'text-muted-foreground' : 'text-base-foreground'}`}>
                    <span className="font-mono text-xs text-muted-foreground">{hypothesis.id}</span> {hypothesis.title}
                  </span>
                  <span className="w-24 shrink-0">
                    <StatusIndicator size="sm" {...causeStatus(hypothesis.state)} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="flex min-w-0 flex-col gap-3">
            <h4 className="text-xs font-medium text-muted-foreground">Corrective actions</h4>
            <ul className="flex flex-col gap-2">
              {ACTIONS.slice(0, 4).map((action) => (
                <li key={action.id} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-sm text-base-foreground">
                    <span className="font-mono text-xs text-muted-foreground">{action.id}</span> {action.text}
                  </span>
                  <span className="w-24 shrink-0">
                    <StatusIndicator size="sm" {...ACTION_STATE[action.state]} />
                  </span>
                </li>
              ))}
            </ul>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              2 more actions <IconArrowNarrowRight aria-hidden className="size-4" />
            </p>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}

export default definePage({
  id: 'root-cause-analysis',
  title: 'Root cause analysis',
  summary:
    'An investigation from the incident to its close-out: what happened and in what order, the reasoning that leads to a root cause, the evidence behind it, and the actions that keep it from happening again.',
  guidance: {
    use: [
      'Keep the sequence of events on a timeline with the tag behind each one.',
      'Give every suspected cause a state — confirmed, open or ruled out — and keep the ruled-out ones visible.',
      'Tie each hypothesis to numbered evidence, and say whether the evidence supports or contradicts it.',
      'Give every corrective action an owner and a due date, and call out the overdue ones.',
    ],
    avoid: [
      'Green for "confirmed" — a confirmed cause is a finding, not good news.',
      'A root cause with no trail of reasoning or evidence behind it.',
      'Naming a person as the cause; name the missing barrier.',
      'Closing an investigation while actions are open without saying so.',
    ],
  },
  source,
  sections: [
    {
      id: 'incident',
      title: 'Incident and timeline',
      description: 'What happened, in what order, and where the investigation stands.',
      specimens: [
        {
          id: 'RootCauseIncidentHeader',
          title: 'Incident summary header',
          note: 'Pick it at the top of an investigation: what, where, when, who leads it, and the impact in three figures.',
          origin: 'custom',
          uses: ['industrial/operations/SeverityBadge.tsx', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx', 'display/PersonAvatar.tsx'],
          size: 'full',
          align: 'stretch',
          Component: RootCauseIncidentHeader,
        },
        {
          id: 'RootCauseTimeline',
          title: 'Timeline to the trip',
          note: 'Pick it to lay out the sequence: events as dots, alarms as squares, the trip as a diamond, each with its tag.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: RootCauseTimeline,
        },
        {
          id: 'RootCauseProgress',
          title: 'Investigation progress',
          note: 'Pick it to show which phase the investigation is in and when the earlier ones closed.',
          origin: 'custom',
          uses: ['industrial/workflows/StepList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: RootCauseProgress,
        },
      ],
    },
    {
      id: 'reasoning',
      title: 'Reasoning',
      description: 'From symptoms to causes: hypotheses, five whys, a fault tree, and causes grouped and ranked.',
      specimens: [
        {
          id: 'RootCauseCauseStates',
          title: 'Cause states',
          note: 'Pick these three words and shapes for every suspected cause, in trees, lists and cards alike.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/workflows/workflow.ts'],
          Component: RootCauseCauseStates,
        },
        {
          id: 'RootCauseHypotheses',
          title: 'Hypothesis cards',
          note: 'Pick it to keep competing explanations side by side: the state, the reasoning, and the evidence each rests on.',
          origin: 'custom',
          uses: ['industrial/workflows/TagChip.tsx', 'industrial/StatusIndicator.tsx', 'industrial/workflows/workflow.ts'],
          size: 'lg',
          align: 'stretch',
          Component: RootCauseHypotheses,
        },
        {
          id: 'RootCauseFiveWhys',
          title: 'Five whys',
          note: 'Pick it for a single causal chain: each answer becomes the next question, and the last is marked as the root cause.',
          origin: 'custom',
          uses: ['industrial/workflows/WhyChain.tsx'],
          size: 'md',
          align: 'stretch',
          Component: RootCauseFiveWhys,
        },
        {
          id: 'RootCauseFaultTree',
          title: 'Fault tree',
          note: 'Pick it when causes branch: an indented tree with AND and OR gates and the state of each event.',
          origin: 'custom',
          uses: ['industrial/workflows/FaultTree.tsx'],
          size: 'md',
          align: 'stretch',
          Component: RootCauseFaultTree,
        },
        {
          id: 'RootCauseCauseEffect',
          title: 'Causes by category',
          note: 'Pick it as a fishbone in list form: causes under equipment, process, people and environment.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/workflows/workflow.ts'],
          size: 'md',
          align: 'stretch',
          Component: RootCauseCauseEffect,
        },
        {
          id: 'RootCauseRanking',
          title: 'Contributing-factor ranking',
          note: 'Pick it to decide where actions go first: factors ranked by how much they contributed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: RootCauseRanking,
        },
      ],
    },
    {
      id: 'evidence',
      title: 'Evidence and comparison',
      description: 'What the conclusions rest on, what changed after the repair, and what has happened before.',
      specimens: [
        {
          id: 'RootCauseEvidenceList',
          title: 'Evidence list',
          note: 'Pick it to number the evidence: trends, alarms, documents and photos, each marked as supporting or not.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: RootCauseEvidenceList,
        },
        {
          id: 'RootCauseEvidenceTrend',
          title: 'Trend as evidence',
          note: 'Pick it when a trend carries the argument: the curve with its limit, and one sentence on what it shows.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx', 'industrial/ValueReadout.tsx'],
          size: 'md',
          align: 'stretch',
          Component: RootCauseEvidenceTrend,
        },
        {
          id: 'RootCausePhotoEvidence',
          title: 'Photo evidence',
          note: 'Pick it for a photo in the evidence set: a placeholder until it loads, with number, author and date.',
          origin: 'custom',
          uses: ['industrial/workflows/PagePreview.tsx'],
          align: 'stretch',
          Component: RootCausePhotoEvidence,
        },
        {
          id: 'RootCauseEvidenceStrength',
          title: 'Evidence balance',
          note: 'Pick it on a hypothesis: how many items support it, contradict it or are inconclusive.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          align: 'stretch',
          Component: RootCauseEvidenceStrength,
        },
        {
          id: 'RootCauseImpact',
          title: 'Impact tile',
          note: 'Pick it to state the consequence in numbers: downtime first, then production, flaring and people.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx'],
          align: 'stretch',
          Component: RootCauseImpact,
        },
        {
          id: 'RootCauseBeforeAfter',
          title: 'Before and after',
          note: 'Pick it to show the repair worked: the readings at the trip beside the same readings after.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx', 'industrial/status.ts'],
          size: 'md',
          align: 'stretch',
          Component: RootCauseBeforeAfter,
        },
        {
          id: 'RootCauseSimilarIncidents',
          title: 'Similar past incidents',
          note: 'Pick it to check whether this has happened before: past incidents ranked by what they share with this one.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: RootCauseSimilarIncidents,
        },
        {
          id: 'RootCauseLinkedWorkOrders',
          title: 'Linked work orders',
          note: 'Pick it to connect the investigation to the work: the repair, the actions, and the order that was deferred.',
          origin: 'custom',
          uses: ['industrial/operations/PriorityBadge.tsx', 'display/StatusBadge.tsx'],
          size: 'md',
          align: 'stretch',
          Component: RootCauseLinkedWorkOrders,
        },
        {
          id: 'RootCauseLessons',
          title: 'Lessons learned note',
          note: 'Pick it for the one paragraph other sites should read, with where it applies.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: RootCauseLessons,
        },
      ],
    },
    {
      id: 'close-out',
      title: 'Actions and close-out',
      description: 'Corrective actions with owners and dates, approval of the findings, and the investigation on one page.',
      specimens: [
        {
          id: 'RootCauseActionsTable',
          title: 'Corrective actions table',
          note: 'Pick it as the action register: what, who, status, the work order behind it and the due date.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: RootCauseActionsTable,
        },
        {
          id: 'RootCauseActionSummary',
          title: 'Action summary',
          note: 'Pick it above the table or on a dashboard: how many actions are done, moving, open and overdue.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: RootCauseActionSummary,
        },
        {
          id: 'RootCauseApproval',
          title: 'Approval block',
          note: 'Pick it to close the analysis: each approver with state and time, and the button on your own row. Click to try.',
          origin: 'custom',
          uses: ['industrial/workflows/SignOffBlock.tsx'],
          size: 'md',
          align: 'stretch',
          Component: RootCauseApproval,
        },
        {
          id: 'RootCauseReport',
          title: 'Investigation summary',
          note: 'Pick it as the one-page view for readers who were not in the room: progress, root cause, hypotheses and actions.',
          origin: 'custom',
          uses: ['industrial/workflows/StepList.tsx', 'industrial/workflows/TagChip.tsx', 'industrial/StatusIndicator.tsx', 'industrial/workflows/workflow.ts'],
          size: 'full',
          align: 'stretch',
          Component: RootCauseReport,
        },
      ],
    },
  ],
});
