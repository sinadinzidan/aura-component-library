import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Label } from '@cognite/aura/components/label';
import { Textarea } from '@cognite/aura/components/textarea';
import {
  IconAlertTriangle,
  IconCamera,
  IconCheck,
  IconChevronRight,
  IconCircleCheck,
  IconClipboardList,
  IconCloudOff,
  IconCloudUpload,
  IconHandStop,
  IconHome,
  IconPlayerSkipForward,
  IconRefresh,
  IconScan,
  IconSearch,
  IconUser,
  IconX,
} from '@cognite/aura/icons';
import type { ReactNode } from 'react';
import { useId, useState } from 'react';

import { LabelledProgress } from '../../../library/feedback/LabelledProgress';
import { SkeletonList } from '../../../library/feedback/SkeletonList';
import { DeviceFrame } from '../../../library/industrial/analytics/DeviceFrame';
import { PriorityBadge } from '../../../library/industrial/operations/PriorityBadge';
import { TONE_TEXT, formatReading, healthStatus, runStateStatus, toneFromLimits } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { PagePreview } from '../../../library/industrial/workflows/PagePreview';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ASSETS, SENSORS, WORK_ORDERS, findAsset, sensorsOf } from '../../data/plant';
import { definePage } from '../../types';

import source from './field-screens.tsx?raw';

const FIELD_PUMP = findAsset('27-pa-2001a') ?? ASSETS[0];
const FIELD_PUMP_SENSORS = sensorsOf('27-pa-2001a');
const FIELD_ORDER = WORK_ORDERS[0];
const FIELD_BEARING = SENSORS.find((sensor) => sensor.id === 'tt-40015') ?? SENSORS[0];

/** Morning round in Gas export, as the technician sees it on the phone. */
const FIELD_ROUND = [
  { id: 'c1', name: 'Export pump A, seal leakage', tag: '27-PA-2001A', done: true },
  { id: 'c2', name: 'Export pump A, bearing temperature', tag: '27-PA-2001A', done: true },
  { id: 'c3', name: 'Export pump B, oil level', tag: '27-PA-2001B', done: false },
  { id: 'c4', name: 'Metering skid, drain valves', tag: '27-FT-20011', done: false },
] as const;

const FIELD_RESULTS = [
  { name: 'Export pump A, seal leakage', detail: 'No leakage', pass: true },
  { name: 'Bearing temperature', detail: '78.5 °C · limits 20 to 75 °C', pass: false },
  { name: 'Export pump B, oil level', detail: 'Topped up 0.5 l', pass: true },
  { name: 'Metering skid, drain valves', detail: 'Closed and capped', pass: true },
] as const;

const FIELD_TABS = [
  { id: 'home', label: 'Today', icon: IconHome },
  { id: 'rounds', label: 'Rounds', icon: IconClipboardList },
  { id: 'search', label: 'Find', icon: IconSearch },
  { id: 'me', label: 'Me', icon: IconUser },
] as const;

type FieldScreenPhoneProps = {
  label: string;
  preset?: 'field' | 'field-night';
  device?: 'phone' | 'tablet';
  connection?: 'online' | 'offline';
  height?: 'screen' | 'content';
  /** Title bar text. */
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
};

/** A device frame in the field theme, centred in the specimen, with an optional title bar. */
function FieldScreenPhone({ label, preset = 'field', device = 'phone', connection, height, title, subtitle, footer, children }: FieldScreenPhoneProps) {
  return (
    <ThemeScope preset={preset} className="flex w-full justify-center">
      <DeviceFrame
        label={label}
        device={device}
        connection={connection}
        height={height}
        footer={footer}
        header={
          title ? (
            <div className="flex flex-col gap-0.5 border-b border-default px-4 py-3">
              <p className="text-base font-semibold text-base-foreground">{title}</p>
              {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
          ) : undefined
        }
      >
        {children}
      </DeviceFrame>
    </ThemeScope>
  );
}

function FieldScreenBody({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">{children}</div>;
}

type FieldResult = 'pass' | 'fail' | 'skip';

const FIELD_RESULT_TEXT: Record<FieldResult, string> = {
  pass: 'Recorded as pass at 14:00.',
  fail: 'Recorded as fail. Add a note or photo before you continue.',
  skip: 'Skipped. Say why before you continue.',
};

function FieldScreenResultButtons({ initial = null }: { initial?: FieldResult | null }) {
  const [result, setResult] = useState<FieldResult | null>(initial);
  const options = [
    { value: 'pass', label: 'Pass', icon: IconCheck },
    { value: 'fail', label: 'Fail', icon: IconX },
    { value: 'skip', label: 'Skip', icon: IconPlayerSkipForward },
  ] as const;
  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label="Checkpoint result" className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <Button key={option.value} size="lg" className="h-14 w-full" variant={result === option.value ? 'default' : 'outline'} aria-pressed={result === option.value} onClick={() => setResult(option.value)}>
            <option.icon aria-hidden="true" />
            {option.label}
          </Button>
        ))}
      </div>
      <p role="status" className="min-h-10 text-sm text-muted-foreground">
        {result ? FIELD_RESULT_TEXT[result] : 'Choose a result to continue.'}
      </p>
    </div>
  );
}

const FIELD_FEEDBACK: Record<Tone, string> = {
  neutral: 'Inside limits',
  success: 'Inside limits',
  warning: 'Outside limits. Check the reading, then save it with a note.',
  critical: 'At trip level. Stop and call the control room.',
  info: 'Inside limits',
};

/** A numeric entry large enough for gloves. Aura's Input has no size for this, so the field is built from tokens. */
function FieldScreenReadingInput({ initial }: { initial: string }) {
  const id = useId();
  const [text, setText] = useState(initial);
  const value = text.trim() === '' ? null : Number(text.replace(',', '.'));
  const valid = value !== null && Number.isFinite(value);
  const tone = valid ? toneFromLimits(value, { low: FIELD_BEARING.lowLimit, high: FIELD_BEARING.highLimit, highHigh: FIELD_BEARING.highHighLimit }) : 'neutral';
  const abnormal = tone === 'warning' || tone === 'critical';

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Bearing temperature</Label>
      <div className={`flex items-baseline gap-3 rounded-xl border-2 bg-base-background px-4 py-3 focus-within:shadow-focus-ring ${abnormal ? (tone === 'critical' ? 'border-critical-foreground-strong' : 'border-warning-foreground-strong') : 'border-emphasized'}`}>
        <input
          id={id}
          inputMode="decimal"
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-describedby={`${id}-hint`}
          aria-invalid={text.trim() !== '' && !valid}
          className="w-full min-w-0 bg-transparent text-5xl font-semibold tabular-nums tracking-tight text-base-foreground outline-none"
        />
        <span className="shrink-0 text-xl text-muted-foreground">°C</span>
      </div>
      <p id={`${id}-hint`} role="status" className={`flex min-h-10 items-start gap-2 text-sm ${abnormal ? TONE_TEXT[tone] : 'text-muted-foreground'}`}>
        {abnormal ? <IconAlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> : null}
        <span>{text.trim() === '' ? 'Enter the value on the local gauge.' : !valid ? 'Enter a number, for example 61.5.' : FIELD_FEEDBACK[tone]}</span>
      </p>
      <p className="text-sm tabular-nums text-muted-foreground">
        Limits {FIELD_BEARING.lowLimit} to {FIELD_BEARING.highLimit} °C · trip {FIELD_BEARING.highHighLimit} °C · last round 61.2 °C
      </p>
    </div>
  );
}

function FieldScreenTabs({ active }: { active: string }) {
  return (
    <nav aria-label="Main sections" className="grid grid-cols-4">
      {FIELD_TABS.map((tab) => {
        const current = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            aria-current={current ? 'page' : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs focus-visible:shadow-focus-ring focus-visible:outline-none ${current ? 'font-semibold text-base-foreground' : 'text-muted-foreground'}`}
          >
            <tab.icon aria-hidden="true" className="size-5" />
            {tab.label}
            <span aria-hidden="true" className={`h-0.5 w-6 rounded-full ${current ? 'bg-primary-background' : 'bg-transparent'}`} />
          </button>
        );
      })}
    </nav>
  );
}

function FieldScreenRoundRows() {
  return (
    <ul aria-label="Checkpoints on the morning round" className="flex flex-col divide-y divide-default">
      {FIELD_ROUND.map((point) => (
        <li key={point.id}>
          <button type="button" className="flex min-h-16 w-full items-center gap-3 px-4 py-2 text-left focus-visible:shadow-focus-ring focus-visible:outline-none">
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${point.done ? 'bg-success-background text-success-foreground' : 'border border-emphasized text-muted-foreground'}`}>
              {point.done ? <IconCheck aria-hidden="true" className="size-4" /> : null}
              <span className="sr-only">{point.done ? 'Done' : 'Not checked'}</span>
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-base text-base-foreground">{point.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{point.tag}</span>
            </span>
            <IconChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function FieldScreenOfflineStrip() {
  return (
    <div role="status" className="flex items-start gap-3 bg-warning-background px-4 py-3 text-warning-foreground">
      <IconCloudOff aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="flex flex-col">
        <p className="text-sm font-semibold">Working offline</p>
        <p className="text-sm">Your entries are saved on this device and sent when you are back in range.</p>
      </div>
    </div>
  );
}

function FieldScreenActions() {
  return (
    <div className="flex gap-2 p-3">
      <Button variant="outline" size="lg" className="h-14 flex-1">
        Back
      </Button>
      <Button size="lg" className="h-14 flex-[2]">
        Save and continue
      </Button>
    </div>
  );
}

function FieldScreenTaskCard() {
  return (
    <FieldScreenPhone label="Next task on a phone" title="Today" subtitle="Tomás Barros · day shift" footer={<FieldScreenTabs active="home" />}>
      <FieldScreenBody>
        <section aria-label="Next task" className="flex flex-col gap-4 rounded-xl bg-card-background p-4">
          <div className="flex items-center justify-between gap-3">
            <PriorityBadge priority={FIELD_ORDER.priority} showMeaning />
            <span className="text-sm tabular-nums text-muted-foreground">Due 20:00</span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xl font-semibold text-base-foreground">{FIELD_ORDER.title}</p>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono">{FIELD_ORDER.id}</span> · <span className="font-mono">23-KA-9103</span> · Compressor hall, level 2
            </p>
          </div>
          <Button size="lg" className="h-14 w-full">
            Start task
          </Button>
          <Button variant="outline" size="lg" className="h-14 w-full">
            Show on map
          </Button>
        </section>
        <p className="text-sm text-muted-foreground">2 more tasks today · morning round 2 of 4 done</p>
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenCheckpoint() {
  return (
    <FieldScreenPhone label="Checkpoint on a phone" title="Morning round" subtitle="Checkpoint 3 of 4" footer={<FieldScreenActions />}>
      <FieldScreenBody>
        <div className="flex flex-col gap-1">
          <p className="text-xl font-semibold text-base-foreground">Export pump B, oil level</p>
          <p className="font-mono text-sm text-muted-foreground">27-PA-2001B</p>
        </div>
        <p className="text-base text-medium-foreground">Oil is between the two marks on the sight glass and clear, with no foam.</p>
        <FieldScreenResultButtons />
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenReadingEntry() {
  return (
    <FieldScreenPhone label="Reading entry on a phone" title="Morning round" subtitle="Checkpoint 2 of 4" footer={<FieldScreenActions />}>
      <FieldScreenBody>
        <div className="flex flex-col gap-1">
          <p className="text-xl font-semibold text-base-foreground">Cooling water pump</p>
          <p className="font-mono text-sm text-muted-foreground">40-PA-4001 · 40-TT-40015</p>
        </div>
        <FieldScreenReadingInput initial="78.5" />
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenAssetLookup() {
  return (
    <FieldScreenPhone label="Asset lookup result on a phone" title="Find" subtitle="Result for 27-PA-2001A" footer={<FieldScreenTabs active="search" />}>
      <FieldScreenBody>
        <div className="flex flex-col gap-1">
          <p className="text-xl font-semibold text-base-foreground">{FIELD_PUMP.name}</p>
          <p className="font-mono text-sm text-muted-foreground">{FIELD_PUMP.tag} · Gas export</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <StatusIndicator {...runStateStatus(FIELD_PUMP.state)} />
          <StatusIndicator {...healthStatus(FIELD_PUMP.health)} detail={`score ${FIELD_PUMP.healthScore}`} />
        </div>
        <ul aria-label="Live readings" className="flex flex-col divide-y divide-default">
          {FIELD_PUMP_SENSORS.map((sensor) => (
            <li key={sensor.id} className="flex min-h-14 items-center justify-between gap-3">
              <span className="flex min-w-0 flex-col">
                <span className="text-base text-base-foreground">{sensor.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{sensor.tag}</span>
              </span>
              <ValueReadout size="sm" value={sensor.value} unit={sensor.unit} decimals={sensor.decimals} />
            </li>
          ))}
        </ul>
        <Button variant="outline" size="lg" className="h-14 w-full">
          Open work orders (0)
        </Button>
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenScanStep() {
  return (
    <FieldScreenPhone label="Scan tag step on a phone" title="Confirm location" subtitle="Step 1 of 3">
      <FieldScreenBody>
        <p className="text-base text-medium-foreground">Scan the tag plate on the equipment to confirm you are at the right place.</p>
        <div role="img" aria-label="Camera view placeholder with a scan frame" className="relative flex aspect-square w-full items-center justify-center rounded-xl bg-medium-background">
          <span aria-hidden="true" className="absolute inset-8 rounded-lg border-2 border-dashed border-emphasized" />
          <IconScan aria-hidden="true" className="size-12 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Expected <span className="font-mono text-base-foreground">23-KA-9103</span> · Recompressor
        </p>
        <Button variant="outline" size="lg" className="h-14 w-full">
          Enter tag by hand
        </Button>
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenWorkOrder() {
  const [state, setState] = useState<'ready' | 'started' | 'done'>('ready');
  return (
    <FieldScreenPhone
      label="Work order summary on a phone"
      title={FIELD_ORDER.id}
      subtitle="Corrective · 8 h estimated"
      footer={
        <div className="flex flex-col gap-2 p-3">
          {state === 'ready' ? (
            <Button size="lg" className="h-14 w-full" onClick={() => setState('started')}>
              Start work
            </Button>
          ) : (
            <Button size="lg" className="h-14 w-full" disabled={state === 'done'} onClick={() => setState('done')}>
              {state === 'done' ? 'Completed 14:00' : 'Complete work'}
            </Button>
          )}
        </div>
      }
    >
      <FieldScreenBody>
        <div className="flex items-center gap-3">
          <PriorityBadge priority={FIELD_ORDER.priority} />
          <Badge variant={state === 'ready' ? 'secondary' : state === 'started' ? 'inProgress' : 'success'}>{state === 'ready' ? 'Ready to start' : state === 'started' ? 'In progress' : 'Completed'}</Badge>
        </div>
        <p className="text-xl font-semibold text-base-foreground">{FIELD_ORDER.title}</p>
        <dl className="flex flex-col divide-y divide-default text-base">
          {[
            ['Equipment', '23-KA-9103 · Recompressor'],
            ['Location', 'Compressor hall, level 2'],
            ['Permit', 'PTW-26-0419 · active'],
            ['Due', '12 Mar, 20:00'],
          ].map(([label, value]) => (
            <div key={label} className="flex min-h-12 items-center justify-between gap-4">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right text-base-foreground tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <p role="status" className="text-sm text-muted-foreground">
          {state === 'ready' ? 'Starting records the time and tells the control room you are on the job.' : state === 'started' ? 'Started 14:00. The control room has been told.' : 'Completed. Hand back the permit at the control room.'}
        </p>
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenPhotoNote() {
  const id = useId();
  return (
    <FieldScreenPhone label="Photo and note on a phone" title="Add evidence" subtitle="Export pump B, oil level" footer={<FieldScreenActions />}>
      <FieldScreenBody>
        <PagePreview kind="photo" label="Photo 1, sight glass on export pump B" caption="Photo 1 · Sight glass" className="w-full" />
        <Button variant="outline" size="lg" className="h-14 w-full">
          <IconCamera aria-hidden="true" />
          Take another photo
        </Button>
        <div className="flex flex-col">
          <Label htmlFor={id}>Note</Label>
          <Textarea id={id} rows={3} defaultValue="Oil level at the lower mark. Topped up 0.5 l, no leak found." />
        </div>
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenSignature() {
  const [signed, setSigned] = useState(false);
  return (
    <FieldScreenPhone label="Confirm and sign on a phone" title="Confirm and sign" subtitle="Morning round · Gas export">
      <FieldScreenBody>
        <p className="text-base text-medium-foreground">I have completed the round as recorded: 3 passed, 1 failed, 0 skipped.</p>
        <div className={`flex h-32 flex-col items-center justify-center gap-1 rounded-xl border-2 ${signed ? 'border-emphasized' : 'border-dashed border-emphasized'}`}>
          {signed ? (
            <>
              <p className="text-2xl font-semibold italic text-base-foreground">Tomás Barros</p>
              <p className="text-sm tabular-nums text-muted-foreground">Signed 12 Mar, 14:00</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sign here with your finger</p>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Tomás Barros · Mechanical technician</p>
        <Button size="lg" className="h-14 w-full" disabled={signed} onClick={() => setSigned(true)}>
          {signed ? 'Signed' : 'Sign with PIN'}
        </Button>
        <Button variant="outline" size="lg" className="h-14 w-full" disabled={!signed} onClick={() => setSigned(false)}>
          Clear signature
        </Button>
        {!signed ? <p className="text-xs text-muted-foreground">Clear signature is available once you have signed.</p> : null}
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenCompletion() {
  return (
    <FieldScreenPhone label="Completion summary on a phone" title="Round complete" subtitle="Morning round · Gas export" footer={<FieldScreenTabs active="rounds" />}>
      <FieldScreenBody>
        <div className="flex items-center gap-3">
          <IconCircleCheck aria-hidden="true" className={`size-10 shrink-0 ${TONE_TEXT.success}`} />
          <div className="flex flex-col">
            <p className="text-xl font-semibold text-base-foreground">4 of 4 checked</p>
            <p className="text-sm tabular-nums text-muted-foreground">06:42 to 07:18 · 36 min</p>
          </div>
        </div>
        <ul aria-label="Results" className="flex flex-col divide-y divide-default">
          {FIELD_RESULTS.map((row) => (
            <li key={row.name} className="flex min-h-14 items-center gap-3 py-2">
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${row.pass ? 'bg-success-background text-success-foreground' : 'bg-critical-background text-critical-foreground'}`}>
                {row.pass ? <IconCheck aria-hidden="true" className="size-4" /> : <IconX aria-hidden="true" className="size-4" />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-base text-base-foreground">{row.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{row.detail}</span>
              </span>
              <span className={`shrink-0 text-sm font-medium ${row.pass ? 'text-muted-foreground' : TONE_TEXT.critical}`}>{row.pass ? 'Pass' : 'Fail'}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">1 failed checkpoint was sent to the shift supervisor as a notification.</p>
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenOfflineBanner() {
  return (
    <FieldScreenPhone label="Offline banner on a phone" connection="offline" height="content" title="Morning round" subtitle="Checkpoint 3 of 4">
      <FieldScreenOfflineStrip />
      <FieldScreenBody>
        <p className="text-base text-medium-foreground">The banner sits under the title on every screen while the device is out of range, and leaves when it reconnects.</p>
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenSyncQueue() {
  return (
    <FieldScreenPhone label="Queued sync indicator on a phone" connection="offline" height="content" title="Me" subtitle="Tomás Barros">
      <FieldScreenBody>
        <div className="flex items-start gap-3">
          <IconCloudUpload aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-base font-semibold text-base-foreground">5 entries waiting to send</p>
            <p className="text-sm text-muted-foreground">3 readings, 1 photo, 1 note · oldest from 13:12</p>
          </div>
        </div>
        <LabelledProgress label="Saved on this device" value={5} max={5} valueText="5 of 5 safe" hint="Nothing is lost if the app closes. Sending starts by itself." />
        <Button variant="outline" size="lg" className="h-14 w-full" disabled>
          Send now
        </Button>
        <p className="text-xs text-muted-foreground">Send now needs a connection.</p>
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenRefreshRow() {
  const [refreshed, setRefreshed] = useState(false);
  return (
    <FieldScreenPhone label="Refresh row on a phone" height="content" title="Rounds" subtitle="Gas export">
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-default px-4">
        <p role="status" className="text-sm tabular-nums text-muted-foreground">
          {refreshed ? 'Updated just now' : 'Updated 13:48 · 12 min ago'}
        </p>
        <Button variant="outline" size="lg" onClick={() => setRefreshed(true)}>
          <IconRefresh aria-hidden="true" />
          Refresh
        </Button>
      </div>
      <FieldScreenBody>
        <p className="text-base text-medium-foreground">A visible button instead of pull-to-refresh: it works with gloves and wet screens, and says how old the list is.</p>
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenActionBar() {
  return (
    <FieldScreenPhone label="Bottom action bar on a phone" height="content" title="Morning round" subtitle="Checkpoint 3 of 4" footer={<FieldScreenActions />}>
      <FieldScreenBody>
        <p className="text-base text-medium-foreground">The primary action is always in the same place, in reach of the thumb, and twice as wide as the way back.</p>
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenTabBar() {
  return (
    <FieldScreenPhone label="Bottom tab bar on a phone" height="content" title="Rounds" subtitle="2 due today" footer={<FieldScreenTabs active="rounds" />}>
      <FieldScreenBody>
        <p className="text-base text-medium-foreground">Four destinations at most, each with an icon and a word. The current one is bold and underlined.</p>
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenListRows() {
  return (
    <FieldScreenPhone label="Glove-friendly list on a phone" height="content" title="Morning round" subtitle="2 of 4 done">
      <FieldScreenRoundRows />
    </FieldScreenPhone>
  );
}

function FieldScreenStopWork() {
  return (
    <FieldScreenPhone label="Stop work action on a phone" height="content" title={FIELD_ORDER.id} subtitle="In progress since 13:20">
      <FieldScreenBody>
        <section aria-label="Stop work" className="flex flex-col gap-3 rounded-xl border border-emphasized p-4">
          <div className="flex items-start gap-3">
            <IconHandStop aria-hidden="true" className={`mt-0.5 size-6 shrink-0 ${TONE_TEXT.critical}`} />
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-base-foreground">Something is not safe</p>
              <p className="text-sm text-muted-foreground">Stopping pauses this job, suspends permit PTW-26-0419 and calls the control room. Anyone can stop work.</p>
            </div>
          </div>
          <Button variant="destructive" size="lg" className="h-14 w-full">
            Stop work
          </Button>
        </section>
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenLoading() {
  return (
    <FieldScreenPhone label="Loading list on a phone" height="content" title="Rounds" subtitle="Loading">
      <FieldScreenBody>
        <SkeletonList rows={3} media description label="Loading rounds" />
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenEmpty() {
  return (
    <FieldScreenPhone label="Nothing due on a phone" height="content" title="Today" subtitle="Tomás Barros · day shift">
      <FieldScreenBody>
        <div className="flex flex-col items-start gap-2 py-4">
          <IconCircleCheck aria-hidden="true" className="size-8 text-muted-foreground" />
          <p className="text-xl font-semibold text-base-foreground">Nothing due right now</p>
          <p className="text-base text-muted-foreground">The afternoon round opens at 15:00. New tasks appear here as they are assigned.</p>
        </div>
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenNightCheckpoint() {
  return (
    <FieldScreenPhone preset="field-night" label="Checkpoint on a phone, night theme" title="Night round" subtitle="Checkpoint 3 of 4" footer={<FieldScreenActions />}>
      <FieldScreenBody>
        <div className="flex flex-col gap-1">
          <p className="text-xl font-semibold text-base-foreground">Export pump B, oil level</p>
          <p className="font-mono text-sm text-muted-foreground">27-PA-2001B</p>
        </div>
        <p className="text-base text-medium-foreground">Oil is between the two marks on the sight glass and clear, with no foam.</p>
        <FieldScreenResultButtons initial="pass" />
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenNightReading() {
  return (
    <FieldScreenPhone preset="field-night" label="Reading entry on a phone, night theme" title="Night round" subtitle="Checkpoint 2 of 4" footer={<FieldScreenActions />}>
      <FieldScreenBody>
        <div className="flex flex-col gap-1">
          <p className="text-xl font-semibold text-base-foreground">Cooling water pump</p>
          <p className="font-mono text-sm text-muted-foreground">40-PA-4001 · 40-TT-40015</p>
        </div>
        <FieldScreenReadingInput initial="61.5" />
      </FieldScreenBody>
    </FieldScreenPhone>
  );
}

function FieldScreenNightList() {
  return (
    <FieldScreenPhone preset="field-night" connection="offline" label="Round list on a phone, night theme, offline" title="Night round" subtitle="2 of 4 done" footer={<FieldScreenTabs active="rounds" />}>
      <FieldScreenOfflineStrip />
      <FieldScreenRoundRows />
    </FieldScreenPhone>
  );
}

function FieldScreenTabletLayout({ preset }: { preset: 'field' | 'field-night' }) {
  return (
    <FieldScreenPhone preset={preset} device="tablet" label={`Round on a tablet, ${preset === 'field' ? 'day' : 'night'} theme`} title="Morning round · Gas export" subtitle="Checkpoint 3 of 4 · Tomás Barros">
      <div className="grid min-w-0 flex-1 grid-cols-1 md:grid-cols-5">
        <div className="border-b border-default md:col-span-2 md:border-b-0 md:border-r">
          <FieldScreenRoundRows />
        </div>
        <div className="flex min-w-0 flex-col md:col-span-3">
          <FieldScreenBody>
            <div className="flex flex-col gap-1">
              <p className="text-xl font-semibold text-base-foreground">Export pump B, oil level</p>
              <p className="font-mono text-sm text-muted-foreground">27-PA-2001B · last checked {formatReading(8, 'h ago')}</p>
            </div>
            <p className="text-base text-medium-foreground">Oil is between the two marks on the sight glass and clear, with no foam.</p>
            <FieldScreenResultButtons />
          </FieldScreenBody>
          <div className="border-t border-default">
            <FieldScreenActions />
          </div>
        </div>
      </div>
    </FieldScreenPhone>
  );
}

function FieldScreenTablet() {
  return <FieldScreenTabletLayout preset="field" />;
}

function FieldScreenTabletNight() {
  return <FieldScreenTabletLayout preset="field-night" />;
}

export default definePage({
  id: 'field-screens',
  title: 'Field screens',
  summary:
    'Phone and tablet components for work on site, shown in a device frame in the field theme: one task per screen, targets large enough for gloves, entries judged against limits as they are typed, and no dependence on a connection.',
  guidance: {
    use: [
      'One question per screen, with the primary action fixed at the bottom in reach of the thumb.',
      'Targets of at least 56 px and rows of at least 56 px; text at text-base or larger.',
      'Judge a reading against its limits while it is entered, in words as well as colour.',
      'Save locally first and show what is waiting to send; never block work on a connection.',
    ],
    avoid: [
      'Gestures as the only way to do something: swipe, long press and pull to refresh fail with gloves.',
      'Tables, side panels and hover; a phone shows a list, then one item.',
      'Alarming styling for the stop-work action; it must be calm, findable and explained.',
      'Small secondary text for anything the technician needs in bright sun.',
    ],
  },
  source,
  sections: [
    {
      id: 'tasks-and-checks',
      title: 'Tasks and checks',
      description: 'The screens a round or a job is made of.',
      specimens: [
        {
          id: 'FieldScreenTaskCard',
          title: 'Large-button task card',
          note: 'Pick it as the first thing a technician sees: the next job, where it is and one button to start.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'industrial/operations/PriorityBadge.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenTaskCard,
        },
        {
          id: 'FieldScreenCheckpoint',
          title: 'Checkpoint with pass, fail and skip',
          note: 'Pick it for a visual check: the criterion in one sentence and three large, labelled answers.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenCheckpoint,
        },
        {
          id: 'FieldScreenReadingEntry',
          title: 'Reading entry with limit feedback',
          note: 'Pick it for a gauge reading: a large numeric field that says at once whether the value is inside its limits.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'industrial/status.ts', 'themes/ThemeScope.tsx'],
          Component: FieldScreenReadingEntry,
        },
        {
          id: 'FieldScreenAssetLookup',
          title: 'Asset lookup result',
          note: 'Pick it after a search or scan: what the equipment is, how it is running and its live readings.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenAssetLookup,
        },
        {
          id: 'FieldScreenScanStep',
          title: 'Scan tag step',
          note: 'Pick it to confirm location before work starts; typing the tag is always offered beside the scan.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenScanStep,
        },
        {
          id: 'FieldScreenWorkOrder',
          title: 'Work order summary',
          note: 'Pick it for a job on site: the facts needed at the equipment and one button that starts, then completes.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'industrial/operations/PriorityBadge.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenWorkOrder,
        },
      ],
    },
    {
      id: 'capture-and-confirm',
      title: 'Capture and confirm',
      description: 'Evidence, sign-off and the summary at the end.',
      specimens: [
        {
          id: 'FieldScreenPhotoNote',
          title: 'Photo and note',
          note: 'Pick it after a failed check: a photo of what was found and a short note, saved with the checkpoint.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'industrial/workflows/PagePreview.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenPhotoNote,
        },
        {
          id: 'FieldScreenSignature',
          title: 'Signature and confirm step',
          note: 'Pick it to close a round or a permit: what is being confirmed, who signs and a way to undo.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenSignature,
        },
        {
          id: 'FieldScreenCompletion',
          title: 'Completion summary',
          note: 'Pick it as the last screen: what was checked, what failed and what happens with the failures.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenCompletion,
        },
      ],
    },
    {
      id: 'connectivity',
      title: 'Offline and sync',
      description: 'Out of range is the normal case on a plant.',
      specimens: [
        {
          id: 'FieldScreenOfflineBanner',
          title: 'Offline banner',
          note: 'Pick it whenever the device is out of range: it says work continues and where the entries are.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenOfflineBanner,
        },
        {
          id: 'FieldScreenSyncQueue',
          title: 'Queued sync indicator',
          note: 'Pick it to show what is waiting to send, and that it is safe on the device in the meantime.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'feedback/LabelledProgress.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenSyncQueue,
        },
        {
          id: 'FieldScreenRefreshRow',
          title: 'Refresh row',
          note: 'Pick it instead of pull-to-refresh: a visible button with the age of the data beside it.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenRefreshRow,
        },
      ],
    },
    {
      id: 'navigation-and-actions',
      title: 'Navigation, lists and actions',
      description: 'The fixed parts of a field app.',
      specimens: [
        {
          id: 'FieldScreenActionBar',
          title: 'Bottom action bar',
          note: 'Pick it on every step of a flow: back and the primary action, fixed at the bottom.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenActionBar,
        },
        {
          id: 'FieldScreenTabBar',
          title: 'Bottom tab bar',
          note: 'Pick it for the top level of the app: up to four destinations, never together with an action bar.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenTabBar,
        },
        {
          id: 'FieldScreenListRows',
          title: 'Glove-friendly list rows',
          note: 'Pick it for any list on site: rows at least 56 px tall, the whole row is the target.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenListRows,
        },
        {
          id: 'FieldScreenStopWork',
          title: 'Stop-work action',
          note: 'Pick it on every job screen: calm, always in the same place, and clear about what stopping does.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenStopWork,
        },
        {
          id: 'FieldScreenLoading',
          title: 'Loading list',
          note: 'Pick it while a list loads from the device or the network; rows keep their final height.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'feedback/SkeletonList.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenLoading,
        },
        {
          id: 'FieldScreenEmpty',
          title: 'Nothing due',
          note: 'Pick it when there is no work: say so, and say when the next task opens.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenEmpty,
        },
      ],
    },
    {
      id: 'night',
      title: 'Night theme',
      description: 'The same screens in the field-night theme, for rounds after dark.',
      specimens: [
        {
          id: 'FieldScreenNightCheckpoint',
          title: 'Checkpoint at night',
          note: 'Pick the night theme after dark: a dark surface keeps night vision, with the same sizes and contrast.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenNightCheckpoint,
        },
        {
          id: 'FieldScreenNightReading',
          title: 'Reading entry at night',
          note: 'Pick it to check that limit feedback still reads on dark: here the value is inside its limits.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'industrial/status.ts', 'themes/ThemeScope.tsx'],
          Component: FieldScreenNightReading,
        },
        {
          id: 'FieldScreenNightList',
          title: 'Round list at night, offline',
          note: 'Pick it as the worst case to design for: dark, out of range and halfway through a round.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenNightList,
        },
      ],
    },
    {
      id: 'tablet',
      title: 'Tablet',
      description: 'With more width, the list and the current checkpoint sit side by side.',
      specimens: [
        {
          id: 'FieldScreenTablet',
          title: 'Round on a tablet',
          note: 'Pick it for tablets on a stand or in a vehicle: the round on the left, the checkpoint on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenTablet,
        },
        {
          id: 'FieldScreenTabletNight',
          title: 'Round on a tablet at night',
          note: 'Pick it to see the tablet layout in the night theme.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/analytics/DeviceFrame.tsx', 'themes/ThemeScope.tsx'],
          Component: FieldScreenTabletNight,
        },
      ],
    },
  ],
});
