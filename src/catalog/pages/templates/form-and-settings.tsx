import { Button } from '@cognite/aura/components/button';
import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import { Switch } from '@cognite/aura/components/switch';
import { Textarea } from '@cognite/aura/components/textarea';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconBell,
  IconBuildingFactory2,
  IconCalendarRepeat,
  IconChartLine,
  IconCircleCheck,
  IconClipboardList,
  IconFlame,
  IconGauge,
  IconLayoutDashboard,
  IconLock,
  IconPencil,
  IconPlugConnected,
  IconRoute,
  IconSettings,
  IconShieldCheck,
  IconTopologyStar3,
  IconUsers,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { FormField } from '../../../library/forms/FormField';
import { SliderNumberInput } from '../../../library/forms/SliderNumberInput';
import { UnitNumberInput } from '../../../library/forms/UnitNumberInput';
import { BrowserFrame } from '../../../library/kit/app-shells/BrowserFrame';
import { Crumbs } from '../../../library/kit/app-shells/Crumbs';
import { Pane } from '../../../library/kit/app-shells/Pane';
import { Panes } from '../../../library/kit/app-shells/Panes';
import { PersonChip } from '../../../library/kit/app-shells/PersonChip';
import { SubNav, type SubNavGroup } from '../../../library/kit/app-shells/SubNav';
import { TabStrip } from '../../../library/kit/app-shells/TabStrip';
import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { EmptyPanel } from '../../../library/kit/EmptyPanel';
import { ChoiceCards } from '../../../library/kit/form-and-settings/ChoiceCards';
import { DropArea } from '../../../library/kit/form-and-settings/DropArea';
import { FormSection } from '../../../library/kit/form-and-settings/FormSection';
import { SaveBar } from '../../../library/kit/form-and-settings/SaveBar';
import { SettingRow } from '../../../library/kit/form-and-settings/SettingRow';
import { Steps } from '../../../library/kit/form-and-settings/Steps';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { Properties } from '../../../library/kit/list-and-detail/Properties';
import { Panel } from '../../../library/kit/Panel';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { TrendLine } from '../../../library/kit/TrendLine';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { ASSETS, PEOPLE, SENSORS, childrenOf } from '../../data/plant';
import { HOUR, REFERENCE_NOW, formatTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './form-and-settings.tsx?raw';

const FS_NAV: AppFrameNavItem[] = [
  { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
  { id: 'alarms', label: 'Alarms', icon: <IconBell />, badge: '4' },
  { id: 'trends', label: 'Trends', icon: <IconChartLine /> },
  { id: 'assets', label: 'Assets', icon: <IconTopologyStar3 /> },
  { id: 'work', label: 'Work orders', icon: <IconClipboardList /> },
  { id: 'settings', label: 'Settings', icon: <IconSettings /> },
];

const FS_ASSET_OPTIONS = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type)).map((asset) => ({ value: asset.id, label: `${asset.name} · ${asset.tag}` }));

const FS_AREA_OPTIONS = childrenOf('nk').map((area) => ({ value: area.id, label: area.name }));

const FS_PEOPLE_OPTIONS = PEOPLE.map((person) => ({ value: person.id, label: `${person.name} · ${person.role}` }));

const FS_PRIORITY_OPTIONS = [
  { value: 'P1', label: 'P1 · within the shift' },
  { value: 'P2', label: 'P2 · within a week' },
  { value: 'P3', label: 'P3 · next planned stop' },
  { value: 'P4', label: 'P4 · when convenient' },
];

const FS_UNIT_OPTIONS = [
  { value: 'barg', label: 'barg' },
  { value: 'degc', label: '°C' },
  { value: 'mms', label: 'mm/s' },
  { value: 'rpm', label: 'rpm' },
];

const FS_HOURS = Array.from({ length: 25 }, (_, index) => formatTime(REFERENCE_NOW - (24 - index) * HOUR));

const FS_TEMPERATURE = [...makeValues({ seed: 13, points: 24, base: 139.4, amplitude: 3.2, noise: 0.9, cycles: 1.3, decimals: 1 }), 141.2];

const FS_VIBRATION = [...makeValues({ seed: 14, points: 24, base: 6.3, amplitude: 0.25, noise: 0.08, cycles: 1.2, drift: 0.4, decimals: 1 }), 6.8];

function FsUser({ compact = false }: { compact?: boolean }) {
  return <PersonChip name="Aisha Khan" initials="AK" role="Engineer" tone="pink" compact={compact} />;
}

function FsConsoleTools() {
  return (
    <>
      <span>Engineer · A. Khan</span>
      <span className="font-medium tabular-nums">14:00:00 UTC</span>
    </>
  );
}

function FsSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (next: boolean) => void }) {
  return <Switch aria-label={label} checked={checked} onCheckedChange={(next) => onChange(next)} />;
}

function FormSettingsCentred() {
  const [title, setTitle] = useState('Inspect recompressor drive-end bearing');
  const [hours, setHours] = useState<number | null>(8);
  const invalid = title.trim() === '';
  return (
    <BrowserFrame url="nordkapp.example.test/work-orders/new" look="studio" tab="New work order">
      <AppFrame variant="topbar" brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }} nav={FS_NAV.slice(0, 5)} current="work" tools={<FsUser compact />} padding="none">
        <div className="shell-grow flex flex-col">
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-6 py-8">
            <Crumbs items={['Work orders', 'New work order']} />
            <SectionHeader size="lg" level={2} title="New work order" description="Describe the job and when it is needed. Planning assigns the crew after you submit." />
            <Panel>
              <div className="flex flex-col gap-7">
                <FormSection title="The job" description="What is wrong and where.">
                  <FormField label="Title" required error={invalid ? 'Give the work order a title.' : undefined}>
                    {(control) => <Input {...control} value={title} onChange={(event) => setTitle(event.target.value)} />}
                  </FormField>
                  <FormField label="Asset" required helper="The functional location the work is booked on.">
                    {(control) => <OptionSelect {...control} options={FS_ASSET_OPTIONS} defaultValue="23-ka-9103" />}
                  </FormField>
                  <FormField label="Description" optional>
                    {(control) => <Textarea {...control} rows={3} defaultValue="Tripped on high vibration at 13:46. Open the drive-end bearing, inspect pads and journal, measure clearance." />}
                  </FormField>
                </FormSection>
                <FormSection title="Schedule" description="Priority sets the response time; the estimate books the crew.">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Priority" required>
                      {(control) => <OptionSelect {...control} options={FS_PRIORITY_OPTIONS} defaultValue="P1" />}
                    </FormField>
                    <FormField label="Estimated time">{(control) => <UnitNumberInput {...control} value={hours} onValueChange={setHours} unit="h" min={1} max={80} />}</FormField>
                  </div>
                </FormSection>
              </div>
            </Panel>
          </div>
          <SaveBar
            message={invalid ? 'One field needs attention before you can submit.' : 'Draft saved 14:00 · 2 required fields complete'}
            tone={invalid ? 'warning' : 'neutral'}
            actions={
              <>
                <Button variant="ghost">Cancel</Button>
                <Button variant="outline">Save draft</Button>
                <Button disabled={invalid}>Submit work order</Button>
              </>
            }
          />
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

function FormSettingsAside() {
  return (
    <BrowserFrame url="nordkapp.example.test/instruments/new" look="editorial" tab="Register an instrument" minHeight={760}>
      <AppFrame
        brand={{ name: 'Nordkapp register' }}
        nav={[
          { id: 'identity', label: 'Identity' },
          { id: 'range', label: 'Range and limits' },
          { id: 'source', label: 'Data source' },
        ]}
        current="identity"
        title="Register an instrument"
        subtitle="Three short sections. The left column says what each one is for; the right column is all you fill in."
        tools={<span className="text-sm text-medium-foreground">Draft · saved 14:00</span>}
      >
        <div className="flex flex-col gap-10">
          <FormSection layout="aside" title="Identity" description="The tag is how operators find the instrument in the control system. It cannot be changed once readings exist.">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Tag" required helper="Area, type and loop number.">
                {(control) => <Input {...control} defaultValue="23-PT-92533" />}
              </FormField>
              <FormField label="Name" required>
                {(control) => <Input {...control} defaultValue="Interstage pressure" />}
              </FormField>
            </div>
            <FormField label="Asset" required>
              {(control) => <OptionSelect {...control} options={FS_ASSET_OPTIONS} defaultValue="23-ka-9102" />}
            </FormField>
          </FormSection>
          <FormSection layout="aside" title="Range and limits" description="The range sets the scale of every gauge and trend. Limits raise alarms; the trip limit stops the machine.">
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Unit" required>
                {(control) => <OptionSelect {...control} options={FS_UNIT_OPTIONS} defaultValue="barg" />}
              </FormField>
              <FormField label="Range minimum">{(control) => <Input {...control} inputMode="decimal" defaultValue="0" />}</FormField>
              <FormField label="Range maximum">{(control) => <Input {...control} inputMode="decimal" defaultValue="60" />}</FormField>
              <FormField label="Low limit">{(control) => <Input {...control} inputMode="decimal" defaultValue="24" />}</FormField>
              <FormField label="High limit">{(control) => <Input {...control} inputMode="decimal" defaultValue="32" />}</FormField>
              <FormField label="Trip limit" optional>
                {(control) => <Input {...control} inputMode="decimal" defaultValue="36" />}
              </FormField>
            </div>
          </FormSection>
          <FormSection layout="aside" title="Data source" description="Where the readings come from. The time series is created when the first value arrives.">
            <FormField label="Historian tag" helper="Leave empty to use the instrument tag.">
              {(control) => <Input {...control} placeholder="23-PT-92533.PV" />}
            </FormField>
            <div className="flex gap-2">
              <Button>Register instrument</Button>
              <Button variant="outline">Save as draft</Button>
            </div>
          </FormSection>
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

const FS_ROUND_STEPS = [
  { id: 'type', label: 'Round type', description: 'How often' },
  { id: 'stops', label: 'Stops', description: 'What to visit' },
  { id: 'crew', label: 'Crew', description: 'Who walks it' },
  { id: 'review', label: 'Review', description: 'Check and create' },
];

const FS_ROUND_TYPES = [
  { id: 'daily', label: 'Daily', description: 'Walked once every day shift. Best for rotating equipment under watch.', icon: <IconCalendarRepeat /> },
  { id: 'weekly', label: 'Weekly', description: 'Walked every Monday. Best for static equipment and safety valves.', icon: <IconRoute /> },
  { id: 'condition', label: 'On condition', description: 'Started by an alarm or a health score drop, not by the calendar.', icon: <IconGauge /> },
];

const FS_ROUND_CANDIDATES = childrenOf('nk-23');

function FormSettingsWizard() {
  const [step, setStep] = useState(1);
  const [type, setType] = useState('daily');
  const [stops, setStops] = useState<readonly string[]>(['23-ka-9101', '23-ka-9103', '23-ha-9114']);
  const [crew, setCrew] = useState('tb');
  const typeLabel = FS_ROUND_TYPES.find((entry) => entry.id === type)?.label ?? '';
  return (
    <BrowserFrame url="nordkapp.example.test/rounds/new?step=stops" look="soft" tab="New inspection round">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }}
        nav={FS_NAV.slice(0, 5)}
        current="work"
        tools={<FsUser compact />}
        title="Create an inspection round"
        subtitle="Four short steps. Nothing is created until you confirm on the last one."
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
          <Panel tone="purple">
            <Steps label="Create an inspection round" items={FS_ROUND_STEPS} current={step} />
          </Panel>
          <Panel
            title={FS_ROUND_STEPS[step].label}
            subtitle={`Step ${step + 1} of ${FS_ROUND_STEPS.length}`}
            footer={
              <>
                <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
                  <IconArrowLeft /> Back
                </Button>
                <span className="ml-auto text-sm">{step === 1 ? `${stops.length} stops selected` : ''}</span>
                <Button disabled={step === 1 && stops.length === 0} onClick={() => setStep(step === FS_ROUND_STEPS.length - 1 ? 0 : step + 1)}>
                  {step === FS_ROUND_STEPS.length - 1 ? 'Create round' : 'Continue'} <IconArrowRight />
                </Button>
              </>
            }
          >
            {step === 0 ? <ChoiceCards label="Round type" options={FS_ROUND_TYPES} value={type} onChange={setType} /> : null}
            {step === 1 ? (
              <div className="grid grid-cols-2 gap-3">
                {FS_ROUND_CANDIDATES.map((asset) => (
                  <div key={asset.id} className="rounded-2xl bg-muted-background px-4 py-3">
                    <CheckboxItem>
                      <CheckboxItemControl checked={stops.includes(asset.id)} onCheckedChange={(checked) => setStops(checked ? [...stops, asset.id] : stops.filter((id) => id !== asset.id))} />
                      <CheckboxItemLabel>
                        {asset.name} · {asset.tag}
                      </CheckboxItemLabel>
                    </CheckboxItem>
                  </div>
                ))}
              </div>
            ) : null}
            {step === 2 ? (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Walked by" required>
                  {(control) => <OptionSelect {...control} options={FS_PEOPLE_OPTIONS} value={crew} onValueChange={setCrew} />}
                </FormField>
                <FormField label="Starts at" helper="Local plant time.">
                  {(control) => <Input {...control} type="time" defaultValue="07:30" />}
                </FormField>
              </div>
            ) : null}
            {step === 3 ? (
              <Properties
                label="Round summary"
                items={[
                  { label: 'Round type', value: typeLabel },
                  { label: 'Area', value: 'Gas compression' },
                  { label: 'Stops', value: `${stops.length} units` },
                  { label: 'Walked by', value: PEOPLE.find((person) => person.id === crew)?.name ?? '' },
                  { label: 'Starts at', value: '07:30' },
                ]}
              />
            ) : null}
          </Panel>
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

type FsLimitChange = { tag: string; name: string; from: string; to: string; effect: string };

const FS_LIMIT_CHANGES: FsLimitChange[] = [
  { tag: '23-VT-92540', name: 'Drive-end vibration, high', from: '7.1 mm/s', to: '6.5 mm/s', effect: 'Alarm 0.3 mm/s under today’s reading' },
  { tag: '23-VT-92540', name: 'Drive-end vibration, trip', from: '11.0 mm/s', to: '10.0 mm/s', effect: 'Earlier trip, as on the recompressor' },
  { tag: '23-TT-92532', name: 'Discharge temperature, high', from: '145.0 °C', to: '143.0 °C', effect: 'Alarm active at today’s 141.2 °C peak' },
];

const FS_LIMIT_COLUMNS: DataTableColumn<FsLimitChange>[] = [
  { id: 'name', header: 'Limit', cell: (change) => change.name },
  { id: 'tag', header: 'Tag', nowrap: true, cell: (change) => <TagId>{change.tag}</TagId> },
  { id: 'from', header: 'Current', numeric: true, nowrap: true, muted: true, cell: (change) => change.from },
  { id: 'to', header: 'Proposed', numeric: true, nowrap: true, cell: (change) => <span className="font-semibold">{change.to}</span> },
  { id: 'effect', header: 'Effect', cell: (change) => change.effect },
];

function FormSettingsReview() {
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  return (
    <BrowserFrame url="nordkapp.example.test/changes/MOC-0412/review" look="blueprint" tab="MOC-0412 · Review">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Management of change', mark: <IconFlame /> }}
        nav={[
          { id: 'draft', label: 'Draft' },
          { id: 'review', label: 'Review' },
        ]}
        current="review"
        tools={
          <>
            <div>
              <p className="text-xs">Change</p>
              <p className="text-sm font-semibold">MOC-0412</p>
            </div>
            <div>
              <p className="text-xs">Revision</p>
              <p className="text-sm font-semibold">B · 12 Mar 2026</p>
            </div>
          </>
        }
      >
        <Grid>
          <Panel className="col-span-12" title="Progress" subtitle="Step 4 of 4" icon={<IconRoute className="size-4" />}>
            <Steps
              label="Change request steps"
              current={submitted ? 4 : 3}
              items={[
                { id: 'tag', label: 'Tag' },
                { id: 'limits', label: 'New limits' },
                { id: 'why', label: 'Justification' },
                { id: 'review', label: 'Review and submit' },
              ]}
            />
          </Panel>
          <Panel className="col-span-8" title="Proposed limits" subtitle="1st stage compressor · 3 changes" icon={<IconGauge className="size-4" />}>
            <DataTable label="Proposed limit changes" columns={FS_LIMIT_COLUMNS} rows={FS_LIMIT_CHANGES} rowKey={(change) => change.name} />
            <p className="mt-4 text-sm">
              Justification: the recompressor tripped at 11.6 mm/s after a 24 hour rise that the current high limit did not flag. Tightening the 1st stage limits gives the same warning one day earlier.
            </p>
          </Panel>
          <Panel className="col-span-4" title="Approval" subtitle="Two signatures" icon={<IconShieldCheck className="size-4" />}>
            <div className="flex flex-1 flex-col justify-between gap-5">
              <div className="flex flex-col gap-4">
                <PersonChip name="Aisha Khan" initials="AK" role="Requested · 12 Mar 13:10" tone="pink" />
                <PersonChip name="Liv Wold" initials="LW" role="Operations approval · pending" tone="blue" />
                <PersonChip name="Magnus Solberg" initials="MS" role="Maintenance approval · pending" tone="purple" />
              </div>
              <div className="flex flex-col gap-3">
                <CheckboxItem>
                  <CheckboxItemControl checked={confirmed} disabled={submitted} onCheckedChange={(checked) => setConfirmed(checked === true)} />
                  <CheckboxItemLabel>I have checked the new limits against the equipment data sheet.</CheckboxItemLabel>
                </CheckboxItem>
                {submitted ? (
                  <StatusPill tone="success" icon={<IconCircleCheck />}>
                    Sent for approval
                  </StatusPill>
                ) : (
                  <div className="flex gap-2">
                    <Button disabled={!confirmed} onClick={() => setSubmitted(true)}>
                      Submit for approval
                    </Button>
                    <Button variant="outline">Back</Button>
                  </div>
                )}
              </div>
            </div>
          </Panel>
          <Panel className="col-span-12" title="Effect on the last 24 hours" subtitle="Drive-end vibration · mm/s · current and proposed high limit" icon={<IconChartLine className="size-4" />}>
            <TrendLine
              label="Drive-end vibration over the last 24 hours against the current and the proposed high limit"
              labels={FS_HOURS}
              unit="mm/s"
              decimals={1}
              height={170}
              highlightLast
              yDomain={[5.5, 7.5]}
              series={[{ id: 'vibration', label: 'Drive-end vibration', values: FS_VIBRATION, tone: 'accent' }]}
              limits={[
                { value: 7.1, label: 'Current', tone: 'neutral' },
                { value: 6.5, label: 'Proposed', tone: 'warning' },
              ]}
            />
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

type FsColumn = { id: string; source: string; sample: string };

const FS_IMPORT_COLUMNS: FsColumn[] = [
  { id: 'c1', source: 'TAG_NO', sample: '23-PT-92533' },
  { id: 'c2', source: 'DESCRIPTION', sample: 'Interstage pressure' },
  { id: 'c3', source: 'EU', sample: 'barg' },
  { id: 'c4', source: 'HI_ALM', sample: '32.0' },
  { id: 'c5', source: 'HIHI_TRIP', sample: '36.0' },
  { id: 'c6', source: 'LOOP_SHEET', sample: 'LS-23-0417' },
];

const FS_TARGET_OPTIONS = [
  { value: 'tag', label: 'Tag' },
  { value: 'name', label: 'Name' },
  { value: 'unit', label: 'Unit' },
  { value: 'high', label: 'High limit' },
  { value: 'trip', label: 'Trip limit' },
  { value: 'skip', label: 'Do not import' },
];

const FS_INITIAL_MAPPING: Record<string, string> = { c1: 'tag', c2: 'name', c3: 'unit', c4: 'high', c5: 'trip', c6: 'skip' };

function FormSettingsImport() {
  const [mapping, setMapping] = useState<Record<string, string>>(FS_INITIAL_MAPPING);
  const mapped = Object.values(mapping).filter((target) => target !== 'skip').length;
  const columns: DataTableColumn<FsColumn>[] = [
    { id: 'source', header: 'Column in file', nowrap: true, cell: (column) => column.source },
    { id: 'sample', header: 'First row', nowrap: true, muted: true, cell: (column) => column.sample },
    {
      id: 'target',
      header: 'Imports as',
      cell: (column) => (
        <OptionSelect
          aria-label={`Field for ${column.source}`}
          size="sm"
          width="compact"
          options={FS_TARGET_OPTIONS}
          value={mapping[column.id]}
          onValueChange={(next) => setMapping({ ...mapping, [column.id]: next })}
        />
      ),
    },
    {
      id: 'state',
      header: 'State',
      nowrap: true,
      cell: (column) => (mapping[column.id] === 'skip' ? <StatusPill tone="neutral">Skipped</StatusPill> : <StatusPill tone="success">Mapped</StatusPill>),
    },
  ];
  return (
    <BrowserFrame url="control.nordkapp.example.test/instruments/import?step=map" look="console" tab="Import instruments">
      <AppFrame brand={{ name: 'Nordkapp', detail: 'Engineering', mark: <IconFlame /> }} nav={FS_NAV.slice(2, 6)} current="assets" padding="none" tools={<FsConsoleTools />}>
        <div className="shell-grow flex flex-col">
          <Steps
            label="Import instruments"
            current={1}
            items={[
              { id: 'file', label: 'File', description: 'instrument-index.csv' },
              { id: 'map', label: 'Map columns', description: `${mapped} of 6 mapped` },
              { id: 'check', label: 'Validate', description: 'Not started' },
              { id: 'import', label: 'Import', description: '42 rows' },
            ]}
          />
          <Grid className="flex-1 grid-rows-[auto_1fr]">
            <StatGroup columns={4} label="File summary" className="col-span-12">
              <Stat variant="plain" size="lg" label="Rows in file" value={42} />
              <Stat variant="plain" size="lg" label="Columns mapped" value={mapped} unit="of 6" tone={mapped >= 3 ? 'success' : 'warning'} />
              <Stat variant="plain" size="lg" label="New instruments" value={38} tone="accent" />
              <Stat variant="plain" size="lg" label="Already registered" value={4} tone="warning" target="Will be updated" />
            </StatGroup>
            <Panel className="col-span-8" title="Column mapping" subtitle="Matched by header name; change any that are wrong" padding="none">
              <DataTable label="Column mapping" flush columns={columns} rows={FS_IMPORT_COLUMNS} rowKey={(column) => column.id} rowTone={(column) => (mapping[column.id] === 'skip' ? undefined : 'success')} />
            </Panel>
            <Panel className="col-span-4" title="Source file" subtitle="Step 1, done">
              <div className="flex flex-1 flex-col gap-3.5">
                <DropArea
                  title="Drop a CSV or Excel file"
                  file={{ name: 'instrument-index.csv', detail: '42 rows · 6 columns · 18 kB' }}
                  action={
                    <Button size="sm" variant="outline">
                      Replace
                    </Button>
                  }
                />
                <Properties
                  label="File facts"
                  items={[
                    { label: 'Delimiter', value: 'Semicolon' },
                    { label: 'Decimal mark', value: 'Point' },
                    { label: 'Header row', value: 'Row 1' },
                    { label: 'Encoding', value: 'UTF-8' },
                  ]}
                />
              </div>
            </Panel>
          </Grid>
          <SaveBar
            message={mapped < 3 ? 'Map at least tag, name and unit to continue.' : `${mapped} columns mapped, ${6 - mapped} skipped. Nothing is written until the last step.`}
            tone={mapped < 3 ? 'warning' : 'neutral'}
            actions={
              <>
                <Button size="sm" variant="outline">
                  Back
                </Button>
                <Button size="sm" disabled={mapped < 3}>
                  Validate 42 rows
                </Button>
              </>
            }
          />
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

const FS_SETTINGS_GROUPS: SubNavGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'general', label: 'General', icon: <IconBuildingFactory2 /> },
      { id: 'members', label: 'Members', icon: <IconUsers />, count: '6' },
      { id: 'notifications', label: 'Notifications', icon: <IconBell /> },
    ],
  },
  {
    id: 'plant',
    label: 'Plant data',
    items: [
      { id: 'sources', label: 'Data sources', icon: <IconPlugConnected />, count: '1', tone: 'warning' },
      { id: 'security', label: 'Access and security', icon: <IconLock /> },
    ],
  },
];

function FormSettingsNav() {
  const [section, setSection] = useState('general');
  const [digest, setDigest] = useState(true);
  const [mentions, setMentions] = useState(true);
  const [quiet, setQuiet] = useState(false);
  const label = FS_SETTINGS_GROUPS.flatMap((group) => group.items).find((item) => item.id === section)?.label ?? '';
  return (
    <BrowserFrame url={`nordkapp.example.test/settings/${section}`} look="studio" tab="Settings · Nordkapp">
      <AppFrame brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }} nav={FS_NAV} current="settings" tools={<FsUser />} padding="none">
        <Panes label="Settings" columns="15rem minmax(0, 1fr)">
          <Pane title="Settings" surface="well" padding="tight">
            <SubNav label="Settings sections" groups={FS_SETTINGS_GROUPS} current={section} onSelect={setSection} />
          </Pane>
          <Pane surface="canvas">
            <SectionHeader level={2} title={label} description="Changes apply to everyone in the Nordkapp operations workspace." />
            {section === 'notifications' ? (
              <Panel title="Email and in-app" subtitle="Sent to all members unless they opt out">
                <SettingRow title="Daily digest" description="A summary of open alarms and overdue work at 06:30." control={<FsSwitch label="Daily digest" checked={digest} onChange={setDigest} />} />
                <SettingRow title="Mentions" description="When someone names you in a work order or a shift log." control={<FsSwitch label="Mentions" checked={mentions} onChange={setMentions} />} />
                <SettingRow title="Quiet hours" description="Hold everything but critical alarms between 22:00 and 06:00." control={<FsSwitch label="Quiet hours" checked={quiet} onChange={setQuiet} />} />
              </Panel>
            ) : null}
            {section !== 'notifications' && section !== 'general' ? (
              <Panel>
                <EmptyPanel
                  icon={<IconSettings />}
                  title={`${label} follows the same layout`}
                  description="Groups of settings in panels, one decision per row, each applied or saved on its own. General and Notifications are filled in here."
                  action={
                    <Button size="sm" variant="outline" onClick={() => setSection('general')}>
                      Back to General
                    </Button>
                  }
                />
              </Panel>
            ) : null}
            {section === 'general' ? (
              <>
                <Panel title="Workspace" subtitle="How the workspace appears to its members">
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Workspace name" required>
                        {(control) => <Input {...control} defaultValue="Nordkapp operations" />}
                      </FormField>
                      <FormField label="Default area" helper="Opened when a member signs in.">
                        {(control) => <OptionSelect {...control} options={FS_AREA_OPTIONS} defaultValue="nk-23" />}
                      </FormField>
                    </div>
                    <FormField label="Description" optional>
                      {(control) => <Textarea {...control} rows={2} defaultValue="Control room, maintenance and engineering for the Nordkapp gas processing plant." />}
                    </FormField>
                    <div>
                      <Button>Save changes</Button>
                    </div>
                  </div>
                </Panel>
                <Panel title="Regional format" subtitle="Used in every table, chart and export">
                  <SettingRow title="Time zone" description="Timestamps are stored in UTC and shown in this zone." control={<OptionSelect aria-label="Time zone" width="compact" options={[{ value: 'utc', label: 'UTC' }, { value: 'cet', label: 'Europe/Oslo' }]} defaultValue="utc" />} />
                  <SettingRow title="Units" description="Pressure in barg, temperature in °C, flow in Sm³/h." control={<OptionSelect aria-label="Units" width="compact" options={[{ value: 'si', label: 'Metric' }, { value: 'us', label: 'US customary' }]} defaultValue="si" />} />
                  <SettingRow
                    title="Delete workspace"
                    description="Removes dashboards and settings. Plant data is not touched."
                    badge={<StatusPill tone="critical">Admin only</StatusPill>}
                    control={
                      <Button variant="outline" size="sm">
                        Delete workspace
                      </Button>
                    }
                  />
                </Panel>
              </>
            ) : null}
          </Pane>
        </Panes>
      </AppFrame>
    </BrowserFrame>
  );
}

const FS_ALERT_RULES = [
  { id: 'critical', title: 'Critical alarms', description: 'Trips and anything above a trip limit. Cannot be switched off.', locked: true },
  { id: 'high', title: 'High alarms', description: 'A reading crosses its high limit on your areas.', locked: false },
  { id: 'orders', title: 'Work orders assigned to you', description: 'New, reassigned or due within the shift.', locked: false },
  { id: 'handover', title: 'Shift handover', description: 'The log is ready to read 30 minutes before your shift.', locked: false },
];

type FsSettingsTab = 'alerts' | 'profile';

function FormSettingsTabs() {
  const [tab, setTab] = useState<FsSettingsTab>('alerts');
  const [enabled, setEnabled] = useState<readonly string[]>(['critical', 'high', 'orders']);
  return (
    <BrowserFrame url="nordkapp.example.test/settings/me" look="poster" tab="Your settings">
      <AppFrame brand={{ name: 'Nordkapp' }} nav={FS_NAV.slice(0, 5)} current="overview" title="Your settings" subtitle="What reaches you, and how you appear to the rest of the plant." tools={<FsUser compact />}>
        <div className="flex flex-col gap-5">
          <TabStrip
            label="Settings sections"
            value={tab}
            onChange={(next) => setTab(next === 'profile' ? 'profile' : 'alerts')}
            items={[
              { id: 'alerts', label: 'Alerts', count: String(enabled.length) },
              { id: 'profile', label: 'Profile' },
            ]}
          />
          {tab === 'alerts' ? (
            <Grid>
              <Panel className="col-span-8" title="What reaches you" subtitle="By push and email">
                {FS_ALERT_RULES.map((rule) => (
                  <SettingRow
                    key={rule.id}
                    title={rule.title}
                    description={rule.description}
                    badge={rule.locked ? <StatusPill tone="critical">Always on</StatusPill> : undefined}
                    control={
                      <Switch
                        aria-label={rule.title}
                        checked={enabled.includes(rule.id)}
                        disabled={rule.locked}
                        onCheckedChange={(next) => setEnabled(next ? [...enabled, rule.id] : enabled.filter((id) => id !== rule.id))}
                      />
                    }
                  />
                ))}
              </Panel>
              <Stat className="col-span-4" size="hero" tone="teal" label="Alerts on" value={enabled.length} unit="of 4" target="About 6 a day at this setting" />
            </Grid>
          ) : (
            <Panel title="Profile" subtitle="Shown on work orders and in the shift log">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Name" required>
                  {(control) => <Input {...control} defaultValue="Aisha Khan" />}
                </FormField>
                <FormField label="Role" disabled helper="Set by your workspace admin.">
                  {(control) => <Input {...control} defaultValue="Rotating equipment engineer" />}
                </FormField>
                <FormField label="Home area">{(control) => <OptionSelect {...control} options={FS_AREA_OPTIONS} defaultValue="nk-23" />}</FormField>
                <FormField label="On-call phone" optional>
                  {(control) => <Input {...control} type="tel" defaultValue="+47 555 01 42" />}
                </FormField>
              </div>
              <div className="mt-5">
                <Button>Save profile</Button>
              </div>
            </Panel>
          )}
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

function FormSettingsSinglePage() {
  const [live, setLive] = useState(true);
  const [animate, setAnimate] = useState(false);
  const [limits, setLimits] = useState(true);
  const [sound, setSound] = useState(false);
  return (
    <BrowserFrame url="nordkapp.example.test/settings/display" look="glass" tab="Display settings">
      <AppFrame
        brand={{ name: 'Nordkapp', mark: <IconFlame /> }}
        nav={FS_NAV}
        current="settings"
        tools={<FsUser compact />}
        title="Display settings"
        subtitle="Everything on one page. Each switch applies as you flip it; there is nothing to save."
        status={
          <StatusPill tone="success" size="lg" icon={<IconCircleCheck />}>
            All changes saved
          </StatusPill>
        }
      >
        <Grid>
          <Panel className="col-span-6" title="Live data" subtitle="How charts and figures update">
            <SettingRow title="Live updates" description="Refresh figures every two seconds while the page is open." control={<FsSwitch label="Live updates" checked={live} onChange={setLive} />} />
            <SettingRow title="Animate changes" description="Ease lines and figures to their new value." control={<FsSwitch label="Animate changes" checked={animate} onChange={setAnimate} />} />
            <SettingRow
              title="Default time range"
              description="The range every trend opens with."
              control={<OptionSelect aria-label="Default time range" width="compact" options={[{ value: '8h', label: '8 hours' }, { value: '24h', label: '24 hours' }, { value: '7d', label: '7 days' }]} defaultValue="24h" />}
            />
          </Panel>
          <Panel className="col-span-6" title="Alarms" subtitle="How limits and alarms are shown">
            <SettingRow title="Limit lines on trends" description="Draw high and trip limits on every chart that has them." control={<FsSwitch label="Limit lines on trends" checked={limits} onChange={setLimits} />} />
            <SettingRow title="Alarm sound" description="Play a tone for new critical alarms on this device." control={<FsSwitch label="Alarm sound" checked={sound} onChange={setSound} />} />
            <SettingRow
              title="Severity shown"
              description="Hide lower severities from lists and counts."
              control={<OptionSelect aria-label="Severity shown" width="compact" options={[{ value: 'all', label: 'All' }, { value: 'high', label: 'High and above' }, { value: 'critical', label: 'Critical only' }]} defaultValue="all" />}
            />
          </Panel>
          <Panel className="col-span-12" title="Preview" subtitle={`Discharge temperature · ${live ? 'live' : 'paused'} · limits ${limits ? 'shown' : 'hidden'}`} tone="accent">
            <TrendLine
              label="Discharge temperature over the last 24 hours, as the settings above draw it"
              labels={FS_HOURS}
              unit="°C"
              decimals={1}
              height={170}
              fill
              highlightLast={live}
              series={[{ id: 'temp', label: 'Discharge temperature', values: FS_TEMPERATURE, tone: 'accent' }]}
              limits={limits ? [{ value: 145, label: 'High limit', tone: 'warning' }] : []}
            />
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

const FS_PUMP_INITIAL = { name: 'Export pump B', duty: 'standby', interval: 30, notes: 'Standby unit. Started monthly to prove availability.' };

function FormSettingsUnsaved() {
  const [draft, setDraft] = useState({ ...FS_PUMP_INITIAL, name: 'Export pump B (standby)', interval: 14 });
  const changes = [draft.name !== FS_PUMP_INITIAL.name, draft.duty !== FS_PUMP_INITIAL.duty, draft.interval !== FS_PUMP_INITIAL.interval, draft.notes !== FS_PUMP_INITIAL.notes].filter(Boolean).length;
  return (
    <BrowserFrame url="nordkapp.example.test/assets/27-PA-2001B/edit" look="soft" tab="Edit export pump B">
      <AppFrame
        variant="sidebar"
        brand={{ name: 'Nordkapp', detail: 'Gas plant', mark: <IconFlame /> }}
        nav={FS_NAV}
        current="assets"
        tools={<FsUser />}
        title="Edit export pump B"
        subtitle="27-PA-2001B · Gas export"
        padding="none"
      >
        <div className="shell-grow flex flex-col">
          <div className="flex-1 p-7">
            <Grid>
              <Panel className="col-span-7" title="Identity" subtitle="How the pump is named and used">
                <div className="flex flex-col gap-4">
                  <FormField label="Name" required>
                    {(control) => <Input {...control} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />}
                  </FormField>
                  <ChoiceCards
                    label="Duty"
                    columns={2}
                    value={draft.duty}
                    onChange={(duty) => setDraft({ ...draft, duty })}
                    options={[
                      { id: 'duty', label: 'Duty', description: 'Runs continuously.' },
                      { id: 'standby', label: 'Standby', description: 'Starts when the duty pump stops.' },
                    ]}
                  />
                  <FormField label="Notes" optional>
                    {(control) => <Textarea {...control} rows={2} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />}
                  </FormField>
                </div>
              </Panel>
              <Panel className="col-span-5" tone="teal" title="Standby test" subtitle="How often the start test is due">
                <div className="flex flex-1 flex-col justify-between gap-5">
                  <SliderNumberInput label="Test interval" value={draft.interval} onValueChange={(interval) => setDraft({ ...draft, interval })} min={7} max={60} step={1} unit="days" />
                  <Properties
                    label="Standby test facts"
                    items={[
                      { label: 'Last test', value: '6 Feb, passed' },
                      { label: 'Next due', value: draft.interval === 30 ? '8 Mar, overdue' : `${draft.interval} days after the next pass` },
                      { label: 'Open order', value: 'WO-104458' },
                    ]}
                  />
                </div>
              </Panel>
            </Grid>
          </div>
          <SaveBar
            message={changes === 0 ? 'No unsaved changes' : `${changes} unsaved ${changes === 1 ? 'change' : 'changes'}. Leaving the page will discard them.`}
            tone={changes === 0 ? 'neutral' : 'warning'}
            actions={
              <>
                <Button variant="outline" disabled={changes === 0} onClick={() => setDraft(FS_PUMP_INITIAL)}>
                  Discard
                </Button>
                <Button disabled={changes === 0}>Save changes</Button>
              </>
            }
          />
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

function FormSettingsPreview() {
  const [high, setHigh] = useState<number | null>(141);
  const [trip, setTrip] = useState<number | null>(155);
  const [delay, setDelay] = useState(10);
  const limit = high ?? 145;
  const above = FS_TEMPERATURE.filter((value) => value > limit).length;
  return (
    <BrowserFrame url="nordkapp.example.test/instruments/23-TT-92532/limits" look="studio" tab="Alarm limits">
      <AppFrame
        variant="rail"
        brand={{ name: 'Nordkapp', mark: <IconFlame /> }}
        nav={FS_NAV}
        current="assets"
        tools={<FsUser compact />}
        title="Alarm limits"
        subtitle="Discharge temperature · 23-TT-92532 · 1st stage compressor"
        actions={
          <>
            <Button variant="outline" size="sm">
              Reset
            </Button>
            <Button size="sm">Propose change</Button>
          </>
        }
      >
        <Grid>
          <Panel className="col-span-4" title="Limits" subtitle="Change a value and the preview follows" icon={<IconChip tone="amber"><IconGauge /></IconChip>}>
            <div className="flex flex-1 flex-col gap-4">
              <FormField label="High limit" helper="Raises a high alarm.">
                {(control) => <UnitNumberInput {...control} value={high} onValueChange={setHigh} unit="°C" min={120} max={154} step={0.5} />}
              </FormField>
              <FormField label="Trip limit" helper="Stops the compressor.">
                {(control) => <UnitNumberInput {...control} value={trip} onValueChange={setTrip} unit="°C" min={146} max={170} step={0.5} />}
              </FormField>
              <SliderNumberInput label="Alarm delay" value={delay} onValueChange={setDelay} min={0} max={60} step={5} unit="s" />
            </div>
          </Panel>
          <Grid stack className="col-span-8">
            <Panel title="Preview on the last 24 hours" subtitle="What these limits would have done yesterday" tone={above > 0 ? 'warning' : 'neutral'}>
              <TrendLine
                label="Discharge temperature over the last 24 hours against the proposed limits"
                labels={FS_HOURS}
                unit="°C"
                decimals={1}
                height={230}
                highlightLast
                yDomain={[130, Math.max(160, (trip ?? 155) + 3)]}
                series={[{ id: 'temp', label: 'Discharge temperature', values: FS_TEMPERATURE, tone: 'accent' }]}
                limits={[
                  { value: limit, label: 'High', tone: 'warning' },
                  { value: trip ?? 155, label: 'Trip', tone: 'critical' },
                ]}
              />
            </Panel>
            <Grid columns={3}>
              <Stat label="Hours above high" value={above} unit="of 24" tone={above > 0 ? 'warning' : 'success'} icon={<IconAlertTriangle />} />
              <Stat label="Margin to trip" value={(trip ?? 155) - 141.2} decimals={1} unit="°C" tone="blue" icon={<IconShieldCheck />} />
              <Stat label="Alarm delay" value={delay} unit="s" tone="purple" icon={<IconBell />} target={delay === 0 ? 'Alarms at once' : 'Filters short spikes'} />
            </Grid>
          </Grid>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

const FS_SHEET_INITIAL = { name: 'Interstage cooler', manufacturer: 'Fjordheat AS', duty: '4.2 MW', design: '65 barg at 180 °C', inspection: '24 months' };

function FsSheetField({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange: (next: string) => void }): ReactNode {
  if (!editing) return value;
  return <Input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} />;
}

function FormSettingsReadOnly() {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(FS_SHEET_INITIAL);
  const [draft, setDraft] = useState(FS_SHEET_INITIAL);
  const cooler = SENSORS.find((sensor) => sensor.id === 'tt-91141');
  return (
    <BrowserFrame url="nordkapp.example.test/assets/23-HA-9114/data-sheet" look="blueprint" tab="Data sheet 23-HA-9114">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Equipment data sheet', mark: <IconFlame /> }}
        nav={[
          { id: 'sheet', label: 'Data sheet' },
          { id: 'history', label: 'Revisions' },
        ]}
        current="sheet"
        tools={
          <>
            <div>
              <p className="text-xs">Sheet</p>
              <p className="text-sm font-semibold">DS-23-HA-9114</p>
            </div>
            <div>
              <p className="text-xs">State</p>
              <p className="text-sm font-semibold">{editing ? 'Editing · revision D' : 'Issued · revision C'}</p>
            </div>
          </>
        }
      >
        <Panes label="Data sheet" columns="minmax(0, 1fr) 20rem">
          <Pane
            title={saved.name}
            subtitle="23-HA-9114 · Shell and tube exchanger"
            actions={
              editing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDraft(saved);
                      setEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSaved(draft);
                      setEditing(false);
                    }}
                  >
                    Save revision D
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  <IconPencil /> Edit
                </Button>
              )
            }
          >
            <FormSection title="General" description="Who made it and what it is called.">
              <Properties
                label="General data"
                columns={2}
                items={[
                  { label: 'Name', value: <FsSheetField label="Name" value={draft.name} editing={editing} onChange={(name) => setDraft({ ...draft, name })} /> },
                  { label: 'Manufacturer', value: <FsSheetField label="Manufacturer" value={draft.manufacturer} editing={editing} onChange={(manufacturer) => setDraft({ ...draft, manufacturer })} /> },
                  { label: 'Functional location', value: <TagId>23-HA-9114</TagId> },
                  { label: 'Commissioned', value: 'June 2014' },
                ]}
              />
            </FormSection>
            <FormSection title="Design" description="Limits the equipment was built for. A change needs a management of change request.">
              <Properties
                label="Design data"
                columns={2}
                items={[
                  { label: 'Duty', value: <FsSheetField label="Duty" value={draft.duty} editing={editing} onChange={(duty) => setDraft({ ...draft, duty })} /> },
                  { label: 'Design conditions', value: <FsSheetField label="Design conditions" value={draft.design} editing={editing} onChange={(design) => setDraft({ ...draft, design })} /> },
                  { label: 'Tube material', value: 'Duplex 22Cr' },
                  { label: 'Inspection interval', value: <FsSheetField label="Inspection interval" value={draft.inspection} editing={editing} onChange={(inspection) => setDraft({ ...draft, inspection })} /> },
                ]}
              />
            </FormSection>
            <FormSection title="Inspection" description="Read from the maintenance system; change it in the work order, not here.">
              <Properties
                label="Inspection data"
                columns={2}
                items={[
                  { label: 'Last inspection', value: '14 Apr 2024, passed' },
                  { label: 'Next due', value: '14 Apr 2026' },
                  { label: 'Open work order', value: <TagId>WO-104471</TagId> },
                  { label: 'Tube plugging', value: '3 of 412 tubes' },
                ]}
              />
            </FormSection>
          </Pane>
          <Pane title="Live reading" subtitle={cooler?.tag} surface="well">
            <div>
              <Stat variant="plain" size="lg" label="Cooler outlet temperature" value={cooler?.value ?? 0} decimals={1} unit="°C" target="High limit 40.0 °C" />
            </div>
            <Properties
              label="Revision facts"
              items={[
                { label: 'Revision', value: editing ? 'D, draft' : 'C' },
                { label: 'Issued', value: '4 Nov 2025' },
                { label: 'Issued by', value: 'Aisha Khan' },
                { label: 'Open order', value: 'WO-104471' },
              ]}
            />
            <p className="text-sm">{editing ? 'Fields with a box can be changed. Saving issues revision D and keeps C in the history.' : 'The sheet is read-only until you choose Edit. Every save issues a new revision.'}</p>
          </Pane>
        </Panes>
      </AppFrame>
    </BrowserFrame>
  );
}

const FS_HANDOVER_STATES = [
  { id: 'normal', label: 'Normal', description: 'Nothing the next shift must act on.' },
  { id: 'reduced', label: 'Reduced capacity', description: 'Running, with equipment out or limits in place.' },
  { id: 'upset', label: 'Upset', description: 'Trips or flaring in progress.' },
];

function FormSettingsSignOff() {
  const [state, setState] = useState('reduced');
  const [checks, setChecks] = useState({ alarms: true, permits: true, isolation: false });
  const ready = checks.alarms && checks.permits && checks.isolation;
  return (
    <BrowserFrame url="wall.nordkapp.example.test/handover/sign-off" look="signal" tab="Handover sign-off">
      <AppFrame
        brand={{ name: 'Nordkapp' }}
        title="Hand over the desk"
        subtitle="Day shift to night shift · Thursday 12 March · 14:00 UTC"
        status={
          <StatusPill tone={ready ? 'success' : 'warning'} size="lg">
            {ready ? 'Ready to sign' : '1 check left'}
          </StatusPill>
        }
        padding="none"
      >
        <div className="shell-grow flex flex-col gap-2 p-2">
          <Panel title="Plant state at handover" subtitle="Pick the one that is true right now">
            <div data-tone={state === 'normal' ? 'success' : state === 'reduced' ? 'warning' : 'critical'}>
              <ChoiceCards label="Plant state at handover" options={FS_HANDOVER_STATES} value={state} onChange={setState} />
            </div>
          </Panel>
          <Panel className="flex-1" title="Confirm before you sign" subtitle="Each one is a statement you are making to the next shift">
            <SettingRow
              tone={checks.alarms ? 'success' : 'neutral'}
              title="Open alarms reviewed together"
              description="5 open: 1 critical, 2 high, 2 other."
              control={<FsSwitch label="Open alarms reviewed together" checked={checks.alarms} onChange={(alarms) => setChecks({ ...checks, alarms })} />}
            />
            <SettingRow
              tone={checks.permits ? 'success' : 'neutral'}
              title="Active permits checked against the board"
              description="3 active, including PTW-2291 on the recompressor."
              control={<FsSwitch label="Active permits checked against the board" checked={checks.permits} onChange={(permits) => setChecks({ ...checks, permits })} />}
            />
            <SettingRow
              tone={checks.isolation ? 'success' : 'warning'}
              title="Recompressor isolation confirmed in the field"
              description="Breaker 23-EH-0103 locked out. Not confirmed yet."
              control={<FsSwitch label="Recompressor isolation confirmed in the field" checked={checks.isolation} onChange={(isolation) => setChecks({ ...checks, isolation })} />}
            />
          </Panel>
          <SaveBar
            message={ready ? 'Everything is confirmed. Signing hands the desk to Liv Wold.' : 'Confirm the recompressor isolation to sign.'}
            tone={ready ? 'success' : 'warning'}
            actions={
              <>
                <Button variant="outline">Add a note</Button>
                <Button disabled={!ready}>Sign and hand over</Button>
              </>
            }
          />
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

export default definePage({
  id: 'form-and-settings',
  title: 'Form and settings pages',
  summary:
    'Pages where people enter and change things: single forms, wizards, settings and edit pages. Twelve layouts in eight looks, each with working fields, validation and the bar that says what happens next.',
  guidance: {
    use: [
      'One column of fields at reading width; a second column only for a description, a preview or live context.',
      'A wizard when later steps depend on earlier answers; one page when they do not.',
      'A docked bar that says the state of the form in words — draft saved, 3 unsaved changes — next to its actions.',
    ],
    avoid: [
      'A Save button on settings that already apply as they are switched.',
      'Disabling the primary action without saying which field is missing.',
      'Multi-column forms that make the reading order ambiguous.',
    ],
  },
  source,
  sections: [
    {
      id: 'forms',
      title: 'Form pages',
      description: 'One job, entered in one sitting.',
      specimens: [
        {
          id: 'FormSettingsCentred',
          title: 'Centred form with docked actions',
          note: 'Pick it as the default create page: one reading-width column and a bar that keeps the actions in view.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/form-and-settings/FormSection.tsx', 'kit/form-and-settings/SaveBar.tsx', 'forms/FormField.tsx', 'forms/UnitNumberInput.tsx', 'kit/app-shells/Crumbs.tsx', 'kit/Panel.tsx'],
          Component: FormSettingsCentred,
        },
        {
          id: 'FormSettingsAside',
          title: 'Sections with descriptions aside',
          note: 'Pick it when each group of fields needs a sentence of explanation, such as a registration people fill in rarely.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/form-and-settings/FormSection.tsx', 'forms/FormField.tsx', 'kit/AppFrame.tsx'],
          Component: FormSettingsAside,
        },
      ],
    },
    {
      id: 'wizards',
      title: 'Wizards',
      description: 'A job split into steps, with the way back always open.',
      specimens: [
        {
          id: 'FormSettingsWizard',
          title: 'Create wizard',
          note: 'Pick it when later steps depend on earlier choices and the whole job takes under a minute.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/form-and-settings/Steps.tsx', 'kit/form-and-settings/ChoiceCards.tsx', 'kit/list-and-detail/Properties.tsx', 'forms/FormField.tsx', 'kit/Panel.tsx'],
          Component: FormSettingsWizard,
        },
        {
          id: 'FormSettingsReview',
          title: 'Review and submit',
          note: 'Pick it as the last step of a change that others must approve: what changes, why, and who signs.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/form-and-settings/Steps.tsx', 'kit/DataTable.tsx', 'kit/app-shells/PersonChip.tsx', 'kit/Panel.tsx'],
          Component: FormSettingsReview,
        },
        {
          id: 'FormSettingsImport',
          title: 'Import with column mapping',
          note: 'Pick it for bulk entry from a file: show the file, map its columns, and say what will be written before it is.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/form-and-settings/Steps.tsx', 'kit/form-and-settings/DropArea.tsx', 'kit/form-and-settings/SaveBar.tsx', 'kit/DataTable.tsx', 'kit/StatGroup.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: FormSettingsImport,
        },
      ],
    },
    {
      id: 'settings',
      title: 'Settings pages',
      description: 'Preferences people return to. Find the setting fast, change it, see that it took.',
      specimens: [
        {
          id: 'FormSettingsNav',
          title: 'Settings with section navigation',
          note: 'Pick it when settings fall into five or more groups; the section list stays put while the content changes.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/app-shells/SubNav.tsx', 'kit/app-shells/Panes.tsx', 'kit/form-and-settings/SettingRow.tsx', 'forms/FormField.tsx', 'kit/Panel.tsx'],
          Component: FormSettingsNav,
        },
        {
          id: 'FormSettingsTabs',
          title: 'Settings with tabs',
          note: 'Pick it for two to four groups of personal settings that fit a tab each.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/app-shells/TabStrip.tsx', 'kit/form-and-settings/SettingRow.tsx', 'kit/Stat.tsx', 'forms/FormField.tsx'],
          Component: FormSettingsTabs,
        },
        {
          id: 'FormSettingsSinglePage',
          title: 'Single-page settings',
          note: 'Pick it when every setting fits one screen and applies the moment it is switched.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/form-and-settings/SettingRow.tsx', 'kit/Panel.tsx', 'kit/TrendLine.tsx', 'kit/AppFrame.tsx'],
          Component: FormSettingsSinglePage,
        },
      ],
    },
    {
      id: 'editing',
      title: 'Editing pages',
      description: 'Changing something that already exists, with the consequences in view.',
      specimens: [
        {
          id: 'FormSettingsUnsaved',
          title: 'Edit with unsaved-changes bar',
          note: 'Pick it for records edited in place: the bar counts what changed and offers to discard it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/form-and-settings/SaveBar.tsx', 'kit/form-and-settings/ChoiceCards.tsx', 'forms/SliderNumberInput.tsx', 'kit/list-and-detail/Properties.tsx'],
          Component: FormSettingsUnsaved,
        },
        {
          id: 'FormSettingsPreview',
          title: 'Configuration with live preview',
          note: 'Pick it when a number is hard to judge on its own: show what it would have done on real data.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['forms/UnitNumberInput.tsx', 'forms/SliderNumberInput.tsx', 'kit/TrendLine.tsx', 'kit/Stat.tsx', 'kit/Panel.tsx'],
          Component: FormSettingsPreview,
        },
        {
          id: 'FormSettingsReadOnly',
          title: 'Read-only record with edit mode',
          note: 'Pick it for controlled documents that are read far more often than they are changed.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/list-and-detail/Properties.tsx', 'kit/form-and-settings/FormSection.tsx', 'kit/app-shells/Panes.tsx', 'kit/app-shells/Pane.tsx', 'kit/Stat.tsx'],
          Component: FormSettingsReadOnly,
        },
        {
          id: 'FormSettingsSignOff',
          title: 'Sign-off on a shared screen',
          note: 'Pick it for a confirmation made standing at a wall screen or tablet: large targets, state as colour and words.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/form-and-settings/ChoiceCards.tsx', 'kit/form-and-settings/SettingRow.tsx', 'kit/form-and-settings/SaveBar.tsx', 'kit/Panel.tsx'],
          Component: FormSettingsSignOff,
        },
      ],
    },
  ],
});
