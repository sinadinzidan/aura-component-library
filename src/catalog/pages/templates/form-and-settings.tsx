import { Button } from '@cognite/aura/components/button';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import { Textarea } from '@cognite/aura/components/textarea';
import {
  IconArrowLeft,
  IconArrowRight,
  IconBell,
  IconBuildingFactory2,
  IconCircleCheck,
  IconFileSpreadsheet,
  IconPencil,
  IconRuler2,
  IconSettings,
  IconUsers,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { ChoiceCardGroup } from '../../../library/forms/ChoiceCardGroup';
import { FormField } from '../../../library/forms/FormField';
import { SettingSwitchRow } from '../../../library/forms/SettingSwitchRow';
import { UnitNumberInput } from '../../../library/forms/UnitNumberInput';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { formatValue } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { DropZone } from '../../../library/patterns/content/DropZone';
import { FormActions } from '../../../library/patterns/data-entry/FormActions';
import { FormSection } from '../../../library/patterns/data-entry/FormSection';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { SaveBar } from '../../../library/patterns/data-entry/SaveBar';
import { SettingRow } from '../../../library/patterns/data-entry/SettingRow';
import { WizardFrame } from '../../../library/patterns/data-entry/WizardFrame';
import { PageHeader } from '../../../library/patterns/structure/PageHeader';
import { PropertyList } from '../../../library/patterns/structure/PropertyList';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { SidebarNav } from '../../../library/patterns/structure/SidebarNav';
import type { SidebarNavGroup } from '../../../library/patterns/structure/SidebarNav';
import { Step } from '../../../library/primitives/stepper/Step';
import { Stepper } from '../../../library/primitives/stepper/Stepper';
import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableCaption } from '../../../library/primitives/table/TableCaption';
import { TableCell } from '../../../library/primitives/table/TableCell';
import { TableHead } from '../../../library/primitives/table/TableHead';
import { TableHeader } from '../../../library/primitives/table/TableHeader';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { suggestMapping } from '../../../library/patterns/workflows/columnMapping';
import type { ColumnMapping, TargetField } from '../../../library/patterns/workflows/columnMapping';
import { MappingTable } from '../../../library/patterns/workflows/MappingTable';
import type { SourceColumn } from '../../../library/patterns/workflows/MappingTable';
import { AppShell } from '../../../library/templates/AppShell';
import { AppTopbar } from '../../../library/templates/AppTopbar';
import type { AppTopbarCrumb } from '../../../library/templates/AppTopbar';
import { ContentContainer } from '../../../library/templates/ContentContainer';
import { StickyFooter } from '../../../library/templates/StickyFooter';
import { TemplateFrame } from '../../../library/templates/TemplateFrame';
import { ASSETS, PEOPLE, SENSORS, SITES, findAsset } from '../../data/plant';
import { MINUTE, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './form-and-settings.tsx?raw';

const FORM_SETTINGS_USER = PEOPLE[0];
const FORM_SETTINGS_EQUIPMENT = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));
const FORM_SETTINGS_AREAS = ASSETS.filter((asset) => asset.type === 'area' || asset.type === 'system');
const FORM_SETTINGS_TAG = SENSORS[3];

const FORM_SETTINGS_ASSET_OPTIONS = FORM_SETTINGS_EQUIPMENT.map((asset) => ({ value: asset.id, label: `${asset.tag} ${asset.name}` }));
const FORM_SETTINGS_AREA_OPTIONS = FORM_SETTINGS_AREAS.map((asset) => ({ value: asset.id, label: asset.name }));
const FORM_SETTINGS_PEOPLE_OPTIONS = PEOPLE.map((person) => ({ value: person.id, label: person.name }));
const FORM_SETTINGS_SITE_OPTIONS = SITES.map((site) => ({ value: site.id, label: site.name }));

const FORM_SETTINGS_PRIORITY_OPTIONS = [
  { value: 'P1', label: 'P1 · Immediate' },
  { value: 'P2', label: 'P2 · Urgent' },
  { value: 'P3', label: 'P3 · Normal' },
  { value: 'P4', label: 'P4 · Low' },
];

const FORM_SETTINGS_TYPE_OPTIONS = [
  { value: 'corrective', label: 'Corrective' },
  { value: 'preventive', label: 'Preventive' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'modification', label: 'Modification' },
];

const FORM_SETTINGS_CRITICALITY_OPTIONS = [
  { value: 'A', label: 'A · Production critical' },
  { value: 'B', label: 'B · Important' },
  { value: 'C', label: 'C · Non-critical' },
];

const FORM_SETTINGS_UNIT_OPTIONS = [
  { value: 'barg', label: 'barg' },
  { value: 'degC', label: '°C' },
  { value: 'mm/s', label: 'mm/s' },
  { value: 'rpm', label: 'rpm' },
];

const FORM_SETTINGS_ROUND_STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'route', label: 'Route' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'review', label: 'Review' },
];

const FORM_SETTINGS_INTERVALS = [
  { value: 'shift', label: 'Every shift', description: 'Three times a day, at shift start.' },
  { value: 'daily', label: 'Daily', description: 'Once a day on the day shift.' },
  { value: 'weekly', label: 'Weekly', description: 'Every Monday on the day shift.' },
];

const FORM_SETTINGS_CHANGE_STEPS = [
  { id: 'tag', label: 'Tag', description: '23-VT-92540' },
  { id: 'limits', label: 'New limits', description: 'High 7.1 to 7.5 mm/s' },
  { id: 'reason', label: 'Justification', description: 'Vendor recommendation' },
  { id: 'approvers', label: 'Approvers', description: '2 selected' },
  { id: 'review', label: 'Review and submit', description: 'Check before sending' },
];

const FORM_SETTINGS_NAV: readonly SidebarNavGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'general', label: 'General', icon: <IconSettings /> },
      { id: 'notifications', label: 'Notifications', icon: <IconBell /> },
      { id: 'units', label: 'Units and formats', icon: <IconRuler2 /> },
      { id: 'members', label: 'Members', icon: <IconUsers />, count: PEOPLE.length },
    ],
  },
];

const FORM_SETTINGS_NAV_TITLES: Record<string, { title: string; description: string }> = {
  general: { title: 'General', description: 'Name, default site and time zone of this workspace.' },
  notifications: { title: 'Notifications', description: 'What the workspace tells its members about, and when.' },
  units: { title: 'Units and formats', description: 'How measurements, dates and numbers are shown to everyone.' },
  members: { title: 'Members', description: 'People who can open this workspace.' },
};

const FORM_SETTINGS_EVENTS = [
  { id: 'critical', label: 'Critical alarm raised', detail: 'Any asset you follow' },
  { id: 'assigned', label: 'Work order assigned to you', detail: 'Including reassignment' },
  { id: 'overdue', label: 'Work order overdue', detail: 'Jobs you own or planned' },
  { id: 'handover', label: 'Shift handover published', detail: 'For your crew' },
];

const FORM_SETTINGS_IMPORT_STEPS = [
  { id: 'upload', label: 'Upload file' },
  { id: 'map', label: 'Map columns' },
  { id: 'validate', label: 'Validate' },
  { id: 'import', label: 'Import' },
];

const FORM_SETTINGS_IMPORT_COLUMNS: readonly SourceColumn[] = [
  { name: 'Tag no', samples: ['23-PT-92531', '23-TT-92532'] },
  { name: 'Description', samples: ['Discharge pressure', 'Discharge temperature'] },
  { name: 'UoM', samples: ['barg', '°C'] },
  { name: 'Hi limit', samples: ['52', '145'] },
  { name: 'Loop sheet', samples: ['LS-0412', 'LS-0413'] },
];

const FORM_SETTINGS_IMPORT_FIELDS: readonly TargetField[] = [
  { id: 'tag', label: 'Tag', required: true, aliases: ['tag no', 'tag number'] },
  { id: 'name', label: 'Name', required: true, aliases: ['description'] },
  { id: 'unit', label: 'Unit', aliases: ['uom'] },
  { id: 'highLimit', label: 'High limit', aliases: ['hi limit'] },
  { id: 'lowLimit', label: 'Low limit', aliases: ['lo limit'] },
];

const FORM_SETTINGS_IMPORT_SUGGESTED = suggestMapping(
  FORM_SETTINGS_IMPORT_COLUMNS.map((column) => column.name),
  FORM_SETTINGS_IMPORT_FIELDS
);

const FORM_SETTINGS_PREVIEW_SERIES = makeSeries({
  seed: FORM_SETTINGS_TAG.seed,
  points: 96,
  base: 6.2,
  amplitude: 0.7,
  noise: 0.25,
  drift: 0.6,
  cycles: 3,
  stepMs: 15 * MINUTE,
});

const FORM_SETTINGS_RECORD = {
  name: 'Interstage cooler',
  tag: '23-HA-9114',
  area: 'nk-23',
  criticality: 'B',
  manufacturer: 'Alfa Laval',
  model: 'Compabloc CP 50',
  duty: 4200,
  notes: 'Tube side on cooling water. Clean the bundle when outlet temperature drifts above 40 °C at design duty.',
};

const formSettingsTrail = (...labels: string[]): AppTopbarCrumb[] => labels.map((label, index) => ({ id: String(index), label }));

const formSettingsLabel = (options: readonly { value: string; label: string }[], value: string) =>
  options.find((option) => option.value === value)?.label ?? value;

/** How many times the series rises through a limit: the alarms it would have raised. */
function formSettingsCrossings(values: readonly number[], limit: number): number {
  return values.filter((value, index) => index > 0 && value >= limit && values[index - 1] < limit).length;
}

/** The app chrome around every page here. With `footer`, the page fills the height and the footer stays in view. */
function FormSettingsShell({
  title,
  address,
  trail,
  children,
  footer,
  scroll = true,
  surface = 'base',
}: {
  title: string;
  address: string;
  trail: readonly AppTopbarCrumb[];
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  surface?: 'base' | 'muted';
}) {
  return (
    <TemplateFrame title={`${title} · Plant operations`} address={address}>
      <AppShell
        contentLabel={title}
        scroll={scroll}
        surface={surface}
        topbarSpan="window"
        topbar={<AppTopbar icon={<IconBuildingFactory2 />} trail={trail} userName={FORM_SETTINGS_USER.name} />}
      >
        {footer ? (
          <div className="flex min-h-full flex-col">
            <div className="flex-1">{children}</div>
            {footer}
          </div>
        ) : (
          children
        )}
      </AppShell>
    </TemplateFrame>
  );
}

/** The back button that leads a form page header. */
function FormSettingsBack({ label }: { label: string }) {
  return (
    <Button variant="ghost" size="icon-sm" aria-label={label}>
      <IconArrowLeft />
    </Button>
  );
}

function FormSettingsTemplateCentred() {
  const [title, setTitle] = useState('Inspect recompressor drive-end bearing');
  const [hours, setHours] = useState<number | null>(8);
  const [notify, setNotify] = useState(true);
  const missing = title.trim() === '';

  return (
    <FormSettingsShell
      title="Create work order"
      address="/maintain/work-orders/new"
      trail={formSettingsTrail('Maintain', 'Work orders', 'New')}
      footer={
        <StickyFooter status={missing ? 'Add a title to create the work order.' : 'Nothing is saved until you create the work order.'}>
          <Button variant="ghost">Cancel</Button>
          <Button disabled={missing}>Create work order</Button>
        </StickyFooter>
      }
    >
      <ContentContainer width="form" gap="groups">
        <PageHeader
          leading={<FormSettingsBack label="Back to work orders" />}
          title="Create work order"
          description="Describe the job, then plan and assign it. You can change everything later."
        />
        <FormSection title="Job" description="What needs doing, and on which equipment.">
          <FormField label="Title" required error={missing ? 'Enter a title.' : undefined}>
            {(control) => <Input {...control} value={title} onChange={(event) => setTitle(event.target.value)} />}
          </FormField>
          <FormField label="Asset" required>
            {(control) => <OptionSelect {...control} options={FORM_SETTINGS_ASSET_OPTIONS} defaultValue="23-ka-9103" />}
          </FormField>
          <FormField label="Description" helper="Say what was observed and what done looks like.">
            {(control) => (
              <Textarea {...control} rows={3} defaultValue="Tripped on high vibration at 13:46. Open the drive-end bearing, inspect pads and journal, measure clearance." />
            )}
          </FormField>
        </FormSection>
        <FormSection title="Planning" description="Priority decides the order in the planner.">
          <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
            <FormField label="Priority" required>
              {(control) => <OptionSelect {...control} options={FORM_SETTINGS_PRIORITY_OPTIONS} defaultValue="P1" />}
            </FormField>
            <FormField label="Type">
              {(control) => <OptionSelect {...control} options={FORM_SETTINGS_TYPE_OPTIONS} defaultValue="corrective" />}
            </FormField>
            <FormField label="Due date" required>
              {(control) => <Input {...control} type="date" defaultValue="2026-03-12" />}
            </FormField>
            <FormField label="Estimated time">
              {(control) => <UnitNumberInput {...control} value={hours} onValueChange={setHours} unit="h" min={1} max={80} />}
            </FormField>
          </div>
        </FormSection>
        <FormSection title="People" description="Who does the work and who hears about it.">
          <FormField label="Assignee" optional>
            {(control) => <OptionSelect {...control} options={FORM_SETTINGS_PEOPLE_OPTIONS} defaultValue="tb" />}
          </FormField>
          <SettingSwitchRow
            label="Notify the shift supervisor"
            description="Liv Wold gets a notification when the work order is created."
            checked={notify}
            onCheckedChange={setNotify}
          />
        </FormSection>
      </ContentContainer>
    </FormSettingsShell>
  );
}

function FormSettingsTemplateAside() {
  const [high, setHigh] = useState<number | null>(52);
  const [trip, setTrip] = useState<number | null>(55);

  return (
    <FormSettingsShell title="Register tag" address="/data/tags/new" trail={formSettingsTrail('Data', 'Tags', 'New')}>
      <ContentContainer width="detail" gap="groups">
        <PageHeader title="Register tag" description="Add an instrument tag so its time series can be found, trended and alarmed on." divider />
        <FormSection layout="aside" title="Identity" description="The tag follows the plant numbering standard: area, function and loop number.">
          <FormField label="Tag" required helper="For example 23-PT-92531.">
            {(control) => <Input {...control} defaultValue="23-PT-92533" />}
          </FormField>
          <FormField label="Name" required>
            {(control) => <Input {...control} defaultValue="Interstage pressure" />}
          </FormField>
        </FormSection>
        <div className="border-t border-default" />
        <FormSection layout="aside" title="Location" description="Where the instrument sits in the asset hierarchy. This decides who sees its alarms.">
          <FormField label="Site" required>
            {(control) => <OptionSelect {...control} options={FORM_SETTINGS_SITE_OPTIONS} defaultValue="nordkapp" />}
          </FormField>
          <FormField label="Asset" required>
            {(control) => <OptionSelect {...control} options={FORM_SETTINGS_ASSET_OPTIONS} defaultValue="23-ka-9101" />}
          </FormField>
        </FormSection>
        <div className="border-t border-default" />
        <FormSection layout="aside" title="Measurement" description="Unit and operating limits. A value outside the limits raises an alarm on the asset.">
          <FormField label="Unit" required>
            {(control) => <OptionSelect {...control} options={FORM_SETTINGS_UNIT_OPTIONS} defaultValue="barg" />}
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="High limit">
              {(control) => <UnitNumberInput {...control} value={high} onValueChange={setHigh} unit="barg" hideStepper />}
            </FormField>
            <FormField label="Trip limit" error={high !== null && trip !== null && trip <= high ? 'Must be above the high limit.' : undefined}>
              {(control) => <UnitNumberInput {...control} value={trip} onValueChange={setTrip} unit="barg" hideStepper />}
            </FormField>
          </div>
        </FormSection>
        <div className="border-t border-default pt-6">
          <FormActions>
            <Button variant="ghost">Cancel</Button>
            <Button>Register tag</Button>
          </FormActions>
        </div>
      </ContentContainer>
    </FormSettingsShell>
  );
}

function FormSettingsTemplateWizard() {
  const [step, setStep] = useState(0);
  const [created, setCreated] = useState(false);
  const [name, setName] = useState('Compression deck walk-down');
  const [area, setArea] = useState('nk-23');
  const [stops, setStops] = useState<readonly string[]>(['23-ka-9101', '23-ka-9102', '23-ha-9114']);
  const [interval, setInterval] = useState('daily');
  const candidates = FORM_SETTINGS_EQUIPMENT.filter((asset) => asset.parentId === area);
  const chosen = candidates.filter((asset) => stops.includes(asset.id));
  const blockedReason =
    step === 0 && name.trim() === '' ? 'Name the round to continue.' : step === 1 && chosen.length === 0 ? 'Pick at least one stop.' : undefined;

  return (
    <FormSettingsShell title="Create inspection round" address="/maintain/rounds/new" trail={formSettingsTrail('Maintain', 'Inspection rounds', 'New')} surface="muted">
      <ContentContainer width="form">
        {created ? (
          <div role="status" className="flex flex-col items-center gap-3 rounded-xl border border-default bg-base-background p-8 text-center">
            <IconCircleCheck aria-hidden="true" className="size-8 text-success-foreground-strong" />
            <h1 className="text-xl font-semibold text-base-foreground">{name} is scheduled</h1>
            <p className="max-w-prose text-sm text-muted-foreground">
              The first round is due at the start of the next day shift, with {chosen.length} stops in {formSettingsLabel(FORM_SETTINGS_AREA_OPTIONS, area)}.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setCreated(false);
                setStep(0);
              }}
            >
              Create another round
            </Button>
          </div>
        ) : (
          <WizardFrame
            title="Create inspection round"
            steps={FORM_SETTINGS_ROUND_STEPS}
            current={step}
            onBack={() => setStep(step - 1)}
            onNext={() => setStep(step + 1)}
            onFinish={() => setCreated(true)}
            onCancel={() => setStep(0)}
            finishLabel="Create round"
            blockedReason={blockedReason}
          >
            {step === 0 ? (
              <div className="space-y-4">
                <FormField label="Name" required>
                  {(control) => <Input {...control} value={name} onChange={(event) => setName(event.target.value)} />}
                </FormField>
                <FormField label="Area" required helper="The round visits equipment in one area.">
                  {(control) => <OptionSelect {...control} options={FORM_SETTINGS_AREA_OPTIONS} value={area} onValueChange={setArea} />}
                </FormField>
              </div>
            ) : null}
            {step === 1 ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">Pick the stops, in walking order. Each stop gets the standard checks for its equipment type.</p>
                <CheckboxGroup aria-label="Stops">
                  {candidates.map((asset) => (
                    <CheckboxItem key={asset.id}>
                      <CheckboxItemControl
                        checked={stops.includes(asset.id)}
                        onCheckedChange={(checked) => setStops(checked ? [...stops, asset.id] : stops.filter((id) => id !== asset.id))}
                      />
                      <CheckboxItemLabel>
                        {asset.name} <span className="font-mono text-xs text-muted-foreground">{asset.tag}</span>
                      </CheckboxItemLabel>
                    </CheckboxItem>
                  ))}
                </CheckboxGroup>
              </div>
            ) : null}
            {step === 2 ? <ChoiceCardGroup label="How often" options={FORM_SETTINGS_INTERVALS} value={interval} onValueChange={setInterval} /> : null}
            {step === 3 ? (
              <PropertyList
                items={[
                  { label: 'Name', value: name },
                  { label: 'Area', value: formSettingsLabel(FORM_SETTINGS_AREA_OPTIONS, area) },
                  { label: 'Stops', value: chosen.map((asset) => asset.name).join(', ') },
                  { label: 'Interval', value: formSettingsLabel(FORM_SETTINGS_INTERVALS, interval) },
                  { label: 'First round', value: 'Next day shift, 07:00' },
                ]}
              />
            ) : null}
          </WizardFrame>
        )}
      </ContentContainer>
    </FormSettingsShell>
  );
}

function FormSettingsTemplateReview() {
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const groups = [
    {
      id: 'tag',
      title: 'Tag',
      items: [
        { label: 'Tag', value: <span className="font-mono">{FORM_SETTINGS_TAG.tag}</span> },
        { label: 'Measurement', value: `${FORM_SETTINGS_TAG.name}, ${findAsset(FORM_SETTINGS_TAG.assetId)?.name}` },
      ],
    },
    {
      id: 'limits',
      title: 'New limits',
      items: [
        { label: 'High limit', value: '7.1 to 7.5 mm/s' },
        { label: 'Trip limit', value: '11.0 mm/s, unchanged' },
        { label: 'Valid until', value: '30 Apr 2026, then reverts' },
      ],
    },
    {
      id: 'reason',
      title: 'Justification',
      items: [
        { label: 'Reason', value: 'Vendor confirms 7.5 mm/s is acceptable until the bearing is replaced under WO-104466.' },
        { label: 'Risk', value: 'Low. The trip limit and the weekly vibration survey stay in place.' },
      ],
    },
    {
      id: 'approvers',
      title: 'Approvers',
      items: [
        { label: 'Technical', value: `${PEOPLE[2].name}, ${PEOPLE[2].role.toLowerCase()}` },
        { label: 'Operations', value: `${PEOPLE[4].name}, ${PEOPLE[4].role.toLowerCase()}` },
      ],
    },
  ];

  return (
    <FormSettingsShell
      title="Request limit change"
      address="/engineering/changes/new/review"
      trail={formSettingsTrail('Engineering', 'Limit changes', 'New request')}
      footer={
        <StickyFooter width="detail" status={submitted ? 'Sent for approval. Both approvers have been notified.' : confirmed ? 'Ready to submit.' : 'Tick the confirmation at the end of the page to submit.'}>
          <Button variant="secondary" disabled={submitted}>
            <IconArrowLeft /> Back
          </Button>
          <Button disabled={!confirmed || submitted} onClick={() => setSubmitted(true)}>
            Submit for approval
          </Button>
        </StickyFooter>
      }
    >
      <ContentContainer width="detail">
        <PageHeader title="Review and submit" description="Check the request. Nothing changes in the control system until both approvers accept it." />
        <div className="grid grid-cols-1 gap-8 @3xl:grid-cols-4">
          <div className="@3xl:col-span-1">
            <Stepper label="Request steps" current={4} orientation="vertical">
              {FORM_SETTINGS_CHANGE_STEPS.map((item) => (
                <Step key={item.id} label={item.label} description={item.description} />
              ))}
            </Stepper>
          </div>
          <div className="flex min-w-0 flex-col gap-6 @3xl:col-span-3">
            {groups.map((group) => (
              <section key={group.id} className="flex flex-col gap-3 border-b border-default pb-6">
                <SectionHeader
                  title={group.title}
                  size="sm"
                  actions={
                    <Button variant="ghost" size="sm" disabled={submitted} aria-label={`Edit ${group.title.toLowerCase()}`}>
                      <IconPencil /> Edit
                    </Button>
                  }
                />
                <PropertyList items={group.items} />
              </section>
            ))}
            <CheckboxItem>
              <CheckboxItemControl checked={confirmed} disabled={submitted} onCheckedChange={setConfirmed} />
              <CheckboxItemLabel>I have checked the new limit against the equipment data sheet.</CheckboxItemLabel>
            </CheckboxItem>
          </div>
        </div>
      </ContentContainer>
    </FormSettingsShell>
  );
}

/** One pane of the workspace settings, picked by the navigation or the tab. */
function FormSettingsWorkspacePane({ pane }: { pane: string }) {
  const [digest, setDigest] = useState(true);
  const [critical, setCritical] = useState(true);
  const [quiet, setQuiet] = useState(false);

  if (pane === 'notifications') {
    return (
      <div className="flex flex-col divide-y divide-default">
        <SettingSwitchRow label="Critical alarms" description="Notify members on shift as soon as a critical alarm is raised." checked={critical} onCheckedChange={setCritical} />
        <SettingSwitchRow label="Daily digest" description="A summary of open alarms and overdue work at 06:30." checked={digest} onCheckedChange={setDigest} />
        <SettingSwitchRow label="Quiet hours" description="Hold everything except critical alarms between 22:00 and 06:00." checked={quiet} onCheckedChange={setQuiet} />
      </div>
    );
  }
  if (pane === 'units') {
    return (
      <div className="flex flex-col divide-y divide-default">
        <SettingRow label="Pressure" description="Used on readouts, trends and limits.">
          {(control) => <OptionSelect {...control} options={[{ value: 'barg', label: 'barg' }, { value: 'kPa', label: 'kPa' }, { value: 'psi', label: 'psi' }]} defaultValue="barg" width="compact" />}
        </SettingRow>
        <SettingRow label="Temperature">{(control) => <OptionSelect {...control} options={[{ value: 'c', label: '°C' }, { value: 'f', label: '°F' }]} defaultValue="c" width="compact" />}</SettingRow>
        <SettingRow label="Time zone" description="Timestamps are stored in UTC and shown in this zone.">
          {(control) => <OptionSelect {...control} options={[{ value: 'utc', label: 'UTC' }, { value: 'oslo', label: 'Europe/Oslo' }]} defaultValue="utc" width="compact" />}
        </SettingRow>
        <SettingRow label="Decimal separator">
          {(control) => <OptionSelect {...control} options={[{ value: 'point', label: 'Point (48.6)' }, { value: 'comma', label: 'Comma (48,6)' }]} defaultValue="point" width="compact" />}
        </SettingRow>
      </div>
    );
  }
  if (pane === 'members') {
    return (
      <ul className="flex flex-col divide-y divide-default">
        {PEOPLE.map((person) => (
          <li key={person.id} className="flex items-center gap-3 py-3">
            <PersonAvatar name={person.name} sizes="xsm" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-base-foreground">{person.name}</span>
              <span className="truncate text-xs text-muted-foreground">{person.role}</span>
            </span>
            <div className="w-32 shrink-0">
              <OptionSelect aria-label={`Role of ${person.name}`} size="sm" options={[{ value: 'admin', label: 'Admin' }, { value: 'editor', label: 'Editor' }, { value: 'viewer', label: 'Viewer' }]} defaultValue={person.id === 'lw' ? 'admin' : 'editor'} />
            </div>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="max-w-md space-y-4">
      <FormField label="Workspace name" required>
        {(control) => <Input {...control} defaultValue="Nordkapp operations" />}
      </FormField>
      <FormField label="Default site" helper="Opened when a member signs in.">
        {(control) => <OptionSelect {...control} options={FORM_SETTINGS_SITE_OPTIONS} defaultValue="nordkapp" />}
      </FormField>
      <FormField label="Description" optional>
        {(control) => <Textarea {...control} rows={3} defaultValue="Control room, maintenance and engineering for the Nordkapp gas processing plant." />}
      </FormField>
      <Button>Save changes</Button>
    </div>
  );
}

function FormSettingsTemplateSettingsNav() {
  const [pane, setPane] = useState('notifications');
  const meta = FORM_SETTINGS_NAV_TITLES[pane];

  return (
    <FormSettingsShell title="Settings" address={`/settings/${pane}`} trail={formSettingsTrail('Settings', meta.title)}>
      <ContentContainer width="detail">
        <PageHeader title="Settings" description="Workspace settings apply to every member." divider />
        <div className="grid grid-cols-1 gap-8 @3xl:grid-cols-4">
          <div className="@3xl:col-span-1">
            <SidebarNav label="Settings" groups={FORM_SETTINGS_NAV} activeId={pane} onSelect={setPane} />
          </div>
          <section className="flex min-w-0 flex-col gap-4 @3xl:col-span-3">
            <SectionHeader title={meta.title} description={meta.description} />
            <FormSettingsWorkspacePane key={pane} pane={pane} />
          </section>
        </div>
      </ContentContainer>
    </FormSettingsShell>
  );
}

function FormSettingsTemplateSettingsTabs() {
  const [tab, setTab] = useState('notifications');
  const [channels, setChannels] = useState<readonly string[]>(['critical-app', 'critical-email', 'assigned-app', 'overdue-app', 'handover-email']);
  const [density, setDensity] = useState('compact');
  const toggle = (id: string, checked: boolean) => setChannels(checked ? [...channels, id] : channels.filter((other) => other !== id));

  return (
    <FormSettingsShell title="Your account" address={`/account/${tab}`} trail={formSettingsTrail('Your account')}>
      <ContentContainer width="detail">
        <Tabs
          value={tab}
          onValueChange={(next) => {
            if (typeof next === 'string') setTab(next);
          }}
          className="flex w-full flex-col gap-6"
        >
          <PageHeader
            leading={<PersonAvatar name={FORM_SETTINGS_USER.name} />}
            title={FORM_SETTINGS_USER.name}
            description={FORM_SETTINGS_USER.role}
            tabs={
              <TabsList showSeparator className="w-full">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
              </TabsList>
            }
          />
          <TabsPanel value="profile" className="max-w-md space-y-4">
            <FormField label="Full name" required>
              {(control) => <Input {...control} defaultValue={FORM_SETTINGS_USER.name} />}
            </FormField>
            <FormField label="Role" disabled helper="Set by your workspace admin.">
              {(control) => <Input {...control} defaultValue={FORM_SETTINGS_USER.role} />}
            </FormField>
            <FormField label="Home site">{(control) => <OptionSelect {...control} options={FORM_SETTINGS_SITE_OPTIONS} defaultValue="nordkapp" />}</FormField>
            <Button>Save profile</Button>
          </TabsPanel>
          <TabsPanel value="notifications">
            <Table density="comfortable">
              <TableCaption srOnly>Notification channels per event</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead align="center" className="w-24">
                    In app
                  </TableHead>
                  <TableHead align="center" className="w-24">
                    Email
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FORM_SETTINGS_EVENTS.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell rowHeader>
                      <span className="block">{event.label}</span>
                      <span className="block text-xs font-normal text-muted-foreground">{event.detail}</span>
                    </TableCell>
                    {['app', 'email'].map((channel) => (
                      <TableCell key={channel} align="center">
                        <span className="inline-flex">
                          <CheckboxItemControl
                            aria-label={`${event.label}, ${channel === 'app' ? 'in app' : 'email'}`}
                            checked={channels.includes(`${event.id}-${channel}`)}
                            onCheckedChange={(checked) => toggle(`${event.id}-${channel}`, checked)}
                          />
                        </span>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsPanel>
          <TabsPanel value="appearance" className="max-w-xl">
            <ChoiceCardGroup
              label="Density"
              layout="grid"
              value={density}
              onValueChange={setDensity}
              options={[
                { value: 'comfortable', label: 'Comfortable', description: 'More space between rows. Easier on a tablet.' },
                { value: 'compact', label: 'Compact', description: 'More rows on screen. Suits control room monitors.' },
              ]}
            />
          </TabsPanel>
        </Tabs>
      </ContentContainer>
    </FormSettingsShell>
  );
}

function FormSettingsTemplateSinglePage() {
  const [autoAck, setAutoAck] = useState(false);
  const [shelving, setShelving] = useState(true);
  const [retention, setRetention] = useState<number | null>(24);

  return (
    <FormSettingsShell title="Site settings" address="/sites/nordkapp/settings" trail={formSettingsTrail('Sites', 'Nordkapp', 'Settings')}>
      <ContentContainer width="form" gap="groups">
        <PageHeader title="Site settings" description="Nordkapp gas processing plant. Changes are saved as you make them." />
        <section className="flex flex-col gap-2">
          <SectionHeader title="Site" divider />
          <div className="flex flex-col divide-y divide-default">
            <SettingRow label="Region" description="Decides the default time zone and reporting calendar.">
              {(control) => <OptionSelect {...control} options={[{ value: 'ns', label: 'Norwegian Sea' }, { value: 'north', label: 'North Sea' }, { value: 'barents', label: 'Barents Sea' }]} defaultValue="ns" width="compact" />}
            </SettingRow>
            <SettingRow label="Shift pattern">
              {(control) => <OptionSelect {...control} options={[{ value: '3x8', label: 'Three 8 h shifts' }, { value: '2x12', label: 'Two 12 h shifts' }]} defaultValue="3x8" width="compact" />}
            </SettingRow>
          </div>
        </section>
        <section className="flex flex-col gap-2">
          <SectionHeader title="Alarms" divider />
          <div className="flex flex-col divide-y divide-default">
            <SettingSwitchRow label="Allow shelving" description="Operators can shelve a nuisance alarm for up to 8 hours with a reason." checked={shelving} onCheckedChange={setShelving} />
            <SettingSwitchRow label="Acknowledge cleared alarms automatically" description="Alarms that return to normal within 60 seconds are acknowledged for the operator." checked={autoAck} onCheckedChange={setAutoAck} />
          </div>
        </section>
        <section className="flex flex-col gap-2">
          <SectionHeader title="Data" divider />
          <div className="flex flex-col divide-y divide-default">
            <SettingRow label="Keep raw samples for" description="Older data is kept as hourly aggregates.">
              {(control) => (
                <div className="w-36">
                  <UnitNumberInput {...control} value={retention} onValueChange={setRetention} unit="months" min={6} max={120} step={6} />
                </div>
              )}
            </SettingRow>
            <SettingRow label="Historian connection" description="OPC UA, historian.nordkapp.test">
              {() => (
                <>
                  <StatusIndicator tone="success" label="Connected" size="sm" />
                  <Button variant="outline" size="sm">
                    Test connection
                  </Button>
                </>
              )}
            </SettingRow>
          </div>
        </section>
        <section className="flex flex-col gap-2">
          <SectionHeader title="Archive" divider />
          <SettingRow label="Archive this site" description="Hides the site from navigation. Its data and history are kept.">
            {() => <Button variant="destructive">Archive site</Button>}
          </SettingRow>
        </section>
      </ContentContainer>
    </FormSettingsShell>
  );
}

function FormSettingsTemplateUnsaved() {
  const [saved, setSaved] = useState({ name: 'Cooling water pump', criticality: 'C', area: 'nk-40', notes: 'Standby unit 40-PA-4002 is not installed.' });
  const [draft, setDraft] = useState({ ...saved, name: 'Cooling water pump A', criticality: 'B' });
  const dirtyCount = [draft.name !== saved.name, draft.criticality !== saved.criticality, draft.area !== saved.area, draft.notes !== saved.notes].filter(Boolean).length;

  return (
    <FormSettingsShell
      title="Edit 40-PA-4001"
      address="/assets/40-pa-4001/edit"
      trail={formSettingsTrail('Assets', 'Cooling water', '40-PA-4001', 'Edit')}
      footer={
        <div className="sticky bottom-0 z-10 px-6 pb-4">
          <div className="mx-auto w-full max-w-2xl">
            <SaveBar dirtyCount={dirtyCount} onSave={() => setSaved(draft)} onDiscard={() => setDraft(saved)} cleanText="All changes saved" />
          </div>
        </div>
      }
    >
      <ContentContainer width="form" gap="groups">
        <PageHeader
          leading={<FormSettingsBack label="Back to asset" />}
          title="Edit asset"
          meta={<p className="font-mono text-sm text-muted-foreground">40-PA-4001</p>}
          description="Changes are applied together when you save."
        />
        <FormSection title="Master data">
          <FormField label="Name" required>
            {(control) => <Input {...control} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />}
          </FormField>
          <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
            <FormField label="Area">
              {(control) => <OptionSelect {...control} options={FORM_SETTINGS_AREA_OPTIONS} value={draft.area} onValueChange={(area) => setDraft({ ...draft, area })} />}
            </FormField>
            <FormField label="Criticality" helper="Drives work order priority.">
              {(control) => (
                <OptionSelect {...control} options={FORM_SETTINGS_CRITICALITY_OPTIONS} value={draft.criticality} onValueChange={(criticality) => setDraft({ ...draft, criticality })} />
              )}
            </FormField>
          </div>
          <FormField label="Notes" optional>
            {(control) => <Textarea {...control} rows={3} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />}
          </FormField>
        </FormSection>
      </ContentContainer>
    </FormSettingsShell>
  );
}

function FormSettingsTemplateImport() {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState('nordkapp-tags-rev7.csv');
  const [mapping, setMapping] = useState<ColumnMapping>(FORM_SETTINGS_IMPORT_SUGGESTED);
  const mapped = Object.values(mapping).filter((field) => field !== null).length;
  const last = step === FORM_SETTINGS_IMPORT_STEPS.length - 1;

  return (
    <FormSettingsShell
      title="Import tags"
      address={`/data/tags/import/${FORM_SETTINGS_IMPORT_STEPS[step].id}`}
      trail={formSettingsTrail('Data', 'Tags', 'Import')}
      footer={
        <StickyFooter width="detail" status={`Step ${step + 1} of ${FORM_SETTINGS_IMPORT_STEPS.length}`}>
          {step > 0 && !last ? (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>
              <IconArrowLeft /> Back
            </Button>
          ) : null}
          {last ? (
            <Button onClick={() => setStep(0)}>Import another file</Button>
          ) : (
            <Button onClick={() => setStep(step + 1)}>
              {step === 2 ? 'Import 246 tags' : 'Next'} <IconArrowRight />
            </Button>
          )}
        </StickyFooter>
      }
    >
      <ContentContainer width="detail">
        <PageHeader title="Import tags" description="Bring instrument tags in from a spreadsheet. Nothing is created before the last step." />
        <Stepper label="Import steps" current={step} onStepSelect={last ? undefined : setStep}>
          {FORM_SETTINGS_IMPORT_STEPS.map((item) => (
            <Step key={item.id} label={item.label} />
          ))}
        </Stepper>
        {step === 0 ? (
          <div className="flex flex-col gap-4">
            <DropZone
              label="Upload a spreadsheet of tags"
              title="Drop a CSV or Excel file here"
              hint="One tag per row, with a header row. Up to 10,000 rows."
              accept=".csv,.xlsx"
              multiple={false}
              onFiles={(files) => setFileName(files[0]?.name ?? fileName)}
            />
            <div className="flex items-center gap-3 rounded-lg bg-muted-background px-4 py-3">
              <IconFileSpreadsheet aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-base-foreground">{fileName}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">248 rows · 5 columns</span>
            </div>
          </div>
        ) : null}
        {step === 1 ? (
          <div className="flex flex-col gap-3">
            <SectionHeader title="Match your columns to tag fields" description={`${mapped} of ${FORM_SETTINGS_IMPORT_COLUMNS.length} columns will be imported from ${fileName}.`} size="sm" />
            <MappingTable
              label="Column mapping"
              columns={FORM_SETTINGS_IMPORT_COLUMNS}
              fields={FORM_SETTINGS_IMPORT_FIELDS}
              mapping={mapping}
              suggested={FORM_SETTINGS_IMPORT_SUGGESTED}
              onChange={(column, fieldId) => setMapping({ ...mapping, [column]: fieldId })}
            />
          </div>
        ) : null}
        {step === 2 ? (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-3 gap-4">
              {[
                { label: 'Ready to import', value: 246, tone: 'text-base-foreground' },
                { label: 'Will update existing tags', value: 12, tone: 'text-base-foreground' },
                { label: 'Rows skipped', value: 2, tone: 'text-warning-foreground-strong' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1 rounded-xl bg-card-background p-4">
                  <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                  <dd className={`text-2xl font-semibold tabular-nums ${stat.tone}`}>{stat.value}</dd>
                </div>
              ))}
            </dl>
            <SectionHeader title="Skipped rows" count={2} size="sm" />
            <ul className="flex flex-col divide-y divide-default text-sm">
              <li className="flex gap-4 py-2">
                <span className="w-16 shrink-0 tabular-nums text-muted-foreground">Row 87</span>
                <span className="text-medium-foreground">
                  Tag <span className="font-mono">23-PT-9253</span> does not match the numbering standard.
                </span>
              </li>
              <li className="flex gap-4 py-2">
                <span className="w-16 shrink-0 tabular-nums text-muted-foreground">Row 203</span>
                <span className="text-medium-foreground">High limit is not a number: “see data sheet”.</span>
              </li>
            </ul>
          </div>
        ) : null}
        {last ? (
          <div role="status" className="flex flex-col items-center gap-2 py-8 text-center">
            <IconCircleCheck aria-hidden="true" className="size-8 text-success-foreground-strong" />
            <p className="text-base font-semibold text-base-foreground">246 tags imported</p>
            <p className="max-w-prose text-sm text-muted-foreground">234 created and 12 updated from {fileName}. The two skipped rows are listed in the import log.</p>
          </div>
        ) : null}
      </ContentContainer>
    </FormSettingsShell>
  );
}

function FormSettingsTemplatePreview() {
  const tag = FORM_SETTINGS_TAG;
  const [high, setHigh] = useState<number | null>(tag.highLimit);
  const [trip, setTrip] = useState<number | null>(tag.highHighLimit ?? 11);
  const [delay, setDelay] = useState<number | null>(10);
  const [enabled, setEnabled] = useState(true);
  const highValue = high ?? tag.highLimit;
  const tripValue = trip ?? 11;
  const alarms = formSettingsCrossings(
    FORM_SETTINGS_PREVIEW_SERIES.map((point) => point.v),
    highValue
  );

  return (
    <FormSettingsShell title="Alarm limits" address={`/engineering/tags/${tag.tag}/limits`} trail={formSettingsTrail('Engineering', 'Tags', tag.tag, 'Alarm limits')} scroll={false}>
      <div className="grid min-h-0 flex-1 grid-cols-5 divide-x divide-default">
        <section aria-label="Limit settings" className="col-span-2 flex min-h-0 min-w-0 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
            <PageHeader as="h1" size="compact" title="Alarm limits" meta={<p className="text-sm text-muted-foreground">{tag.name} · <span className="font-mono">{tag.tag}</span></p>} />
            <div className="space-y-4">
              <SettingSwitchRow label="High alarm enabled" description="Turn off only while the instrument is out of service." checked={enabled} onCheckedChange={setEnabled} />
              <FormField label="High limit" disabled={!enabled} helper={enabled ? 'Raises a high-severity alarm.' : 'Enable the alarm to change its limit.'}>
                {(control) => <UnitNumberInput {...control} value={high} onValueChange={setHigh} unit={tag.unit} min={0} max={tripValue} step={0.1} />}
              </FormField>
              <FormField label="Trip limit" error={tripValue <= highValue ? 'Must be above the high limit.' : undefined}>
                {(control) => <UnitNumberInput {...control} value={trip} onValueChange={setTrip} unit={tag.unit} min={0} max={tag.rangeMax} step={0.5} />}
              </FormField>
              <FormField label="On-delay" helper="The value must stay above the limit this long before the alarm is raised.">
                {(control) => <UnitNumberInput {...control} value={delay} onValueChange={setDelay} unit="s" min={0} max={120} step={5} />}
              </FormField>
            </div>
          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t border-default p-4">
            <Button
              variant="ghost"
              onClick={() => {
                setHigh(tag.highLimit);
                setTrip(tag.highHighLimit ?? 11);
              }}
            >
              Reset
            </Button>
            <Button>Save limits</Button>
          </div>
        </section>
        <section aria-label="Preview" className="col-span-3 flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto bg-muted-background p-6">
          <SectionHeader title="Preview" description="The last 24 hours replayed against the limits on the left." size="sm" />
          <div className="rounded-xl bg-base-background p-4">
            <TrendChart
              label={`${tag.name} over the last 24 hours against a high limit of ${formatValue(highValue, 1)} and a trip limit of ${formatValue(tripValue, 1)} millimetres per second`}
              series={[{ key: 'value', label: tag.name, points: FORM_SETTINGS_PREVIEW_SERIES }]}
              limits={[
                ...(enabled ? [{ value: highValue, label: `High ${formatValue(highValue, 1)}`, tone: 'warning' as const }] : []),
                { value: tripValue, label: `Trip ${formatValue(tripValue, 1)}`, tone: 'critical' as const },
              ]}
              highlight={enabled ? { seriesKey: 'value', above: highValue, tone: 'warning' } : undefined}
              yDomain={[4, 12]}
              unit={tag.unit}
              decimals={1}
              heightClassName="h-64"
              maxTicks={5}
            />
          </div>
          <p role="status" className="text-sm text-medium-foreground">
            {enabled
              ? `With a high limit of ${formatValue(highValue, 1)} ${tag.unit}, this tag would have raised ${alarms} ${alarms === 1 ? 'alarm' : 'alarms'} in the last 24 hours.`
              : 'The high alarm is off. Only the trip limit protects this measurement.'}
          </p>
        </section>
      </div>
    </FormSettingsShell>
  );
}

function FormSettingsTemplateReadOnly() {
  const [record, setRecord] = useState(FORM_SETTINGS_RECORD);
  const [draft, setDraft] = useState(FORM_SETTINGS_RECORD);
  const [editing, setEditing] = useState(false);

  return (
    <FormSettingsShell title={record.tag} address={`/assets/${record.tag.toLowerCase()}/master-data`} trail={formSettingsTrail('Assets', 'Gas compression', record.tag)}>
      <ContentContainer width="detail">
        <PageHeader
          title={record.name}
          meta={<p className="font-mono text-sm text-muted-foreground">{record.tag}</p>}
          actions={
            editing ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDraft(record);
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setRecord(draft);
                    setEditing(false);
                  }}
                >
                  Save changes
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <IconPencil /> Edit
              </Button>
            )
          }
          divider
        />
        <section className="flex flex-col gap-4">
          <SectionHeader title="Master data" description={editing ? 'Editing. The tag cannot be changed after registration.' : 'Read-only until you choose Edit.'} size="sm" />
          {editing ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 @2xl:grid-cols-2">
              <FormField label="Name" required>
                {(control) => <Input {...control} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />}
              </FormField>
              <FormField label="Functional location" disabled helper="Set at registration.">
                {(control) => <Input {...control} value={draft.tag} readOnly />}
              </FormField>
              <FormField label="Area">
                {(control) => <OptionSelect {...control} options={FORM_SETTINGS_AREA_OPTIONS} value={draft.area} onValueChange={(area) => setDraft({ ...draft, area })} />}
              </FormField>
              <FormField label="Criticality">
                {(control) => (
                  <OptionSelect {...control} options={FORM_SETTINGS_CRITICALITY_OPTIONS} value={draft.criticality} onValueChange={(criticality) => setDraft({ ...draft, criticality })} />
                )}
              </FormField>
              <FormField label="Manufacturer">
                {(control) => <Input {...control} value={draft.manufacturer} onChange={(event) => setDraft({ ...draft, manufacturer: event.target.value })} />}
              </FormField>
              <FormField label="Model">
                {(control) => <Input {...control} value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} />}
              </FormField>
              <FormField label="Design duty">
                {(control) => <UnitNumberInput {...control} value={draft.duty} onValueChange={(duty) => setDraft({ ...draft, duty: duty ?? 0 })} unit="kW" step={100} />}
              </FormField>
              <div className="@2xl:col-span-2">
                <FormField label="Notes" optional>
                  {(control) => <Textarea {...control} rows={3} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />}
                </FormField>
              </div>
            </div>
          ) : (
            <PropertyList
              layout="stacked"
              columns={2}
              items={[
                { label: 'Name', value: record.name },
                { label: 'Functional location', value: <span className="font-mono">{record.tag}</span> },
                { label: 'Area', value: formSettingsLabel(FORM_SETTINGS_AREA_OPTIONS, record.area) },
                { label: 'Criticality', value: formSettingsLabel(FORM_SETTINGS_CRITICALITY_OPTIONS, record.criticality) },
                { label: 'Manufacturer', value: record.manufacturer },
                { label: 'Model', value: record.model },
                { label: 'Design duty', value: `${formatValue(record.duty, 0)} kW` },
                { label: 'Notes', value: record.notes },
              ]}
            />
          )}
        </section>
      </ContentContainer>
    </FormSettingsShell>
  );
}

export default definePage({
  id: 'form-and-settings',
  title: 'Form and settings pages',
  summary:
    'Pages where people enter, review and change things: creation forms, wizards, settings and editors. Eleven whole pages with working steps, validation and save states.',
  guidance: {
    use: [
      'A single centred column for forms, capped at a readable width, with the actions in a footer that stays in view.',
      'A wizard when steps depend on each other; a review step before anything is created or sent.',
      'Left navigation for settings with many categories; tabs for three or four; one page for a handful of rows.',
      'An explicit save bar when changes apply together; save on change for independent switches.',
    ],
    avoid: [
      'Multi-column forms for fields that are read top to bottom.',
      'Disabling the primary action without saying what is missing.',
      'Mixing save-on-change rows and a Save button on the same page.',
      'A wizard for settings people come back to edit: use a settings page.',
    ],
  },
  source,
  sections: [
    {
      id: 'forms',
      title: 'Form pages',
      description: 'Creating one thing on a page of its own.',
      specimens: [
        {
          id: 'FormSettingsTemplateCentred',
          title: 'Centred form with sticky footer',
          note: 'Pick it as the default creation page: one column of grouped fields, actions always in view.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/AppTopbar.tsx',
            'templates/ContentContainer.tsx',
            'templates/StickyFooter.tsx',
            'patterns/structure/PageHeader.tsx',
            'patterns/data-entry/FormSection.tsx',
            'forms/FormField.tsx',
            'forms/UnitNumberInput.tsx',
          ],
          Component: FormSettingsTemplateCentred,
        },
        {
          id: 'FormSettingsTemplateAside',
          title: 'Two-column form with descriptions',
          note: 'Pick it when each group needs a sentence of explanation: headings on the left, fields on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'patterns/data-entry/FormSection.tsx',
            'patterns/data-entry/FormActions.tsx',
            'forms/FormField.tsx',
          ],
          Component: FormSettingsTemplateAside,
        },
      ],
    },
    {
      id: 'wizards',
      title: 'Wizards',
      description: 'Steps that depend on each other, ending in a review.',
      specimens: [
        {
          id: 'FormSettingsTemplateWizard',
          title: 'Create wizard',
          note: 'Pick it for a creation flow of three to five steps; Next says what is missing instead of going quiet.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'patterns/data-entry/WizardFrame.tsx',
            'forms/ChoiceCardGroup.tsx',
            'patterns/structure/PropertyList.tsx',
          ],
          Component: FormSettingsTemplateWizard,
        },
        {
          id: 'FormSettingsTemplateReview',
          title: 'Review and submit',
          note: 'Pick it as the last step of a request that others approve: everything entered, with a way back to each part.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'templates/StickyFooter.tsx',
            'primitives/stepper/Stepper.tsx',
            'primitives/stepper/Step.tsx',
            'patterns/structure/PropertyList.tsx',
            'patterns/structure/SectionHeader.tsx',
          ],
          Component: FormSettingsTemplateReview,
        },
        {
          id: 'FormSettingsTemplateImport',
          title: 'Import wizard page',
          note: 'Pick it for bringing data in from a file: upload, map, validate, then import, each step a full page.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'templates/StickyFooter.tsx',
            'primitives/stepper/Stepper.tsx',
            'primitives/stepper/Step.tsx',
            'patterns/workflows/MappingTable.tsx',
            'patterns/content/DropZone.tsx',
          ],
          Component: FormSettingsTemplateImport,
        },
      ],
    },
    {
      id: 'settings',
      title: 'Settings pages',
      description: 'Preferences people return to, grouped three ways.',
      specimens: [
        {
          id: 'FormSettingsTemplateSettingsNav',
          title: 'Settings with left navigation',
          note: 'Pick it when settings fall into five or more categories, or when the list will grow.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'patterns/structure/SidebarNav.tsx',
            'patterns/structure/SectionHeader.tsx',
            'forms/SettingSwitchRow.tsx',
            'patterns/data-entry/SettingRow.tsx',
          ],
          Component: FormSettingsTemplateSettingsNav,
        },
        {
          id: 'FormSettingsTemplateSettingsTabs',
          title: 'Settings with top tabs',
          note: 'Pick it for three or four categories, and as the tablet layout of the left-navigation page.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'patterns/structure/PageHeader.tsx',
            'forms/FormField.tsx',
            'forms/ChoiceCardGroup.tsx',
            'primitives/table/Table.tsx',
            'primitives/table/TableHeader.tsx',
            'primitives/table/TableBody.tsx',
            'primitives/table/TableRow.tsx',
            'primitives/table/TableHead.tsx',
            'primitives/table/TableCell.tsx',
            'primitives/table/TableCaption.tsx',
          ],
          Component: FormSettingsTemplateSettingsTabs,
        },
        {
          id: 'FormSettingsTemplateSinglePage',
          title: 'Single-page settings',
          note: 'Pick it for a dozen rows or fewer: every setting on one page, saved as it changes.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'patterns/structure/SectionHeader.tsx',
            'patterns/data-entry/SettingRow.tsx',
            'forms/SettingSwitchRow.tsx',
          ],
          Component: FormSettingsTemplateSinglePage,
        },
      ],
    },
    {
      id: 'editing',
      title: 'Editing pages',
      description: 'Changing a record that already exists.',
      specimens: [
        {
          id: 'FormSettingsTemplateUnsaved',
          title: 'Edit page with unsaved-changes bar',
          note: 'Pick it when several fields are saved together: the bar counts the changes and offers to discard them.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'patterns/data-entry/SaveBar.tsx',
            'patterns/data-entry/FormSection.tsx',
            'forms/FormField.tsx',
          ],
          Component: FormSettingsTemplateUnsaved,
        },
        {
          id: 'FormSettingsTemplatePreview',
          title: 'Configuration with live preview',
          note: 'Pick it when the effect of a setting is easier to see than to describe: form on the left, result on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'forms/UnitNumberInput.tsx',
            'forms/SettingSwitchRow.tsx',
            'industrial/charts/TrendChart.tsx',
          ],
          Component: FormSettingsTemplatePreview,
        },
        {
          id: 'FormSettingsTemplateReadOnly',
          title: 'Read-only record with edit mode',
          note: 'Pick it for master data that is read far more often than it is changed; Edit swaps values for fields in place.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'patterns/structure/PageHeader.tsx',
            'patterns/structure/PropertyList.tsx',
            'forms/FormField.tsx',
          ],
          Component: FormSettingsTemplateReadOnly,
        },
      ],
    },
  ],
});
