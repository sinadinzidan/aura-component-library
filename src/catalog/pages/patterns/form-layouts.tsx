import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardFooterEnd,
  CardFooterStart,
  CardHeader,
  CardHeaderCenter,
  CardTitle,
} from '@cognite/aura/components/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@cognite/aura/components/collapsible';
import { DatePicker } from '@cognite/aura/components/date-time-pickers';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemLabel,
} from '@cognite/aura/components/radio-group';
import { Separator } from '@cognite/aura/components/separator';
import { Textarea } from '@cognite/aura/components/textarea';
import { IconCheck, IconSelector } from '@cognite/aura/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useId, useRef, useState } from 'react';

import { AsyncButton } from '../../../library/actions/AsyncButton';
import { MetadataList } from '../../../library/display/MetadataList';
import { CharacterCountTextarea } from '../../../library/forms/CharacterCountTextarea';
import { ChoiceCardGroup } from '../../../library/forms/ChoiceCardGroup';
import { FormField } from '../../../library/forms/FormField';
import { MultiSelectCombobox } from '../../../library/forms/MultiSelectCombobox';
import { PasswordInput } from '../../../library/forms/PasswordInput';
import { SelectAllCheckboxList } from '../../../library/forms/SelectAllCheckboxList';
import { SettingSwitchRow } from '../../../library/forms/SettingSwitchRow';
import { UnitNumberInput } from '../../../library/forms/UnitNumberInput';
import { FormActions } from '../../../library/patterns/data-entry/FormActions';
import { FormSection } from '../../../library/patterns/data-entry/FormSection';
import { HorizontalField } from '../../../library/patterns/data-entry/HorizontalField';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { PanelFrame } from '../../../library/patterns/data-entry/PanelFrame';
import { RepeatingRows } from '../../../library/patterns/data-entry/RepeatingRows';
import { ValidationSummary } from '../../../library/patterns/data-entry/ValidationSummary';
import { ASSETS, PEOPLE, SENSORS, SITES } from '../../data/plant';
import { REFERENCE_NOW } from '../../data/series';
import { definePage } from '../../types';

import source from './form-layouts.tsx?raw';

const AREA_OPTIONS = ASSETS.filter((asset) => asset.type === 'area' || asset.type === 'system').map((asset) => ({
  value: asset.id,
  label: `${asset.tag} ${asset.name}`,
}));

const EQUIPMENT_OPTIONS = ASSETS.filter((asset) => asset.parentId !== null && asset.parentId !== 'nk').map((asset) => ({
  value: asset.id,
  label: `${asset.tag} ${asset.name}`,
}));

const PEOPLE_OPTIONS = PEOPLE.map((person) => ({ value: person.id, label: person.name }));

const PRIORITY_OPTIONS = [
  { value: 'P1', label: 'P1 – within 24 hours' },
  { value: 'P2', label: 'P2 – within 7 days' },
  { value: 'P3', label: 'P3 – next planned stop' },
  { value: 'P4', label: 'P4 – when convenient' },
];

const WORK_TYPE_OPTIONS = [
  { value: 'corrective', label: 'Corrective' },
  { value: 'preventive', label: 'Preventive' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'modification', label: 'Modification' },
];

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'operator', label: 'Operator' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'admin', label: 'Admin' },
];

const LIMIT_TYPE_OPTIONS = [
  { value: 'high-high', label: 'High-high (trip)' },
  { value: 'high', label: 'High' },
  { value: 'low', label: 'Low' },
  { value: 'low-low', label: 'Low-low (trip)' },
];

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const SOURCE_TYPE_OPTIONS = [
  { value: 'opc-ua', label: 'OPC UA server' },
  { value: 'pi', label: 'PI historian' },
  { value: 'sql', label: 'SQL database' },
  { value: 'file', label: 'File share' },
];

const TIME_ZONE_OPTIONS = [
  { value: 'utc', label: 'UTC' },
  { value: 'oslo', label: 'Europe/Oslo (CET)' },
  { value: 'london', label: 'Europe/London (GMT)' },
];

const INTERVAL_OPTIONS = [
  { value: '15m', label: 'Every 15 minutes' },
  { value: '1h', label: 'Every hour' },
  { value: '6h', label: 'Every 6 hours' },
  { value: '1d', label: 'Every day at 02:00' },
];

const DISCHARGE_PRESSURE = SENSORS[0];

const EXTERNAL_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** The fixed "today" of the catalog, 12 March 2026, as a local date so every time zone agrees. */
function referenceToday(): Dayjs {
  const date = new Date(REFERENCE_NOW);
  return dayjs(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const TODAY = referenceToday();

type DateFieldProps = {
  label: string;
  defaultValue: Dayjs | null;
  required?: boolean;
  helper?: string;
};

/** Label, date picker and helper. The picker takes no `id`, so the label names a group around it. */
function DateField({ label, defaultValue, required, helper }: DateFieldProps) {
  const id = useId();
  const [value, setValue] = useState<Dayjs | null>(defaultValue);
  return (
    <div role="group" aria-labelledby={id} className="w-full">
      <Label id={id} required={required}>
        {label}
      </Label>
      <DatePicker value={value} onChange={setValue} format="D MMM YYYY" />
      {helper ? <HelperText>{helper}</HelperText> : null}
    </div>
  );
}

function FormLayoutSingleColumn() {
  const [description, setDescription] = useState('Process values from the gas compression area, 1 s resolution.');
  return (
    <form className="w-full max-w-md space-y-6" onSubmit={(event) => event.preventDefault()}>
      <div className="space-y-4">
        <FormField label="Name" required>
          {(control) => <Input {...control} defaultValue="Compressor telemetry" />}
        </FormField>
        <FormField label="External ID" required helper="Used in API calls. You cannot change it later.">
          {(control) => <Input {...control} defaultValue="nk_compressor_telemetry" />}
        </FormField>
        <FormField label="Description">
          {(control) => (
            <CharacterCountTextarea
              {...control}
              rows={3}
              maxLength={120}
              value={description}
              onValueChange={setDescription}
              helper="Shown in search results."
            />
          )}
        </FormField>
      </div>
      <FormActions>
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Create data set</Button>
      </FormActions>
    </form>
  );
}

function FormLayoutTwoColumn() {
  const [hours, setHours] = useState<number | null>(8);
  return (
    <form className="w-full max-w-2xl space-y-6" onSubmit={(event) => event.preventDefault()}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <FormField label="Title" required>
            {(control) => <Input {...control} defaultValue="Inspect recompressor drive-end bearing" />}
          </FormField>
        </div>
        <FormField label="Asset" required>
          {(control) => <OptionSelect {...control} options={EQUIPMENT_OPTIONS} defaultValue="23-ka-9103" />}
        </FormField>
        <FormField label="Type">
          {(control) => <OptionSelect {...control} options={WORK_TYPE_OPTIONS} defaultValue="corrective" />}
        </FormField>
        <FormField label="Priority" required>
          {(control) => <OptionSelect {...control} options={PRIORITY_OPTIONS} defaultValue="P1" />}
        </FormField>
        <FormField label="Estimated time">
          {(control) => (
            <UnitNumberInput {...control} value={hours} onValueChange={setHours} unit="h" min={1} max={40} />
          )}
        </FormField>
      </div>
      <FormActions>
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Create work order</Button>
      </FormActions>
    </form>
  );
}

function FormLayoutInline() {
  const [email, setEmail] = useState('');
  const [invited, setInvited] = useState<string | null>(null);
  return (
    <form
      className="flex w-full max-w-3xl flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        if (EMAIL_PATTERN.test(email)) {
          setInvited(email);
          setEmail('');
        }
      }}
    >
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <Label htmlFor="form-layout-inline-email">Email address</Label>
          <Input
            id="form-layout-inline-email"
            type="email"
            autoComplete="off"
            placeholder="name@company.com"
            aria-describedby="form-layout-inline-status"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="w-44 shrink-0">
          <Label htmlFor="form-layout-inline-role">Role</Label>
          <OptionSelect id="form-layout-inline-role" options={ROLE_OPTIONS} defaultValue="operator" width="compact" />
        </div>
        <Button type="submit">Send invite</Button>
      </div>
      <HelperText id="form-layout-inline-status" aria-live="polite">
        {invited ? `Invite sent to ${invited}.` : 'The invite link is valid for 7 days.'}
      </HelperText>
    </form>
  );
}

function FormLayoutLabelLeft() {
  return (
    <form className="w-full max-w-xl space-y-6" onSubmit={(event) => event.preventDefault()}>
      <div className="space-y-4">
        <HorizontalField label="Tag" required>
          {(control) => <Input {...control} defaultValue="23-KA-9101" />}
        </HorizontalField>
        <HorizontalField label="Name" required>
          {(control) => <Input {...control} defaultValue="1st stage compressor" />}
        </HorizontalField>
        <HorizontalField label="Area">
          {(control) => <OptionSelect {...control} options={AREA_OPTIONS} defaultValue="nk-23" />}
        </HorizontalField>
        <HorizontalField label="Criticality" helper="A stops production, B reduces it, C has no direct effect.">
          {(control) => (
            <OptionSelect
              {...control}
              options={[
                { value: 'A', label: 'A' },
                { value: 'B', label: 'B' },
                { value: 'C', label: 'C' },
              ]}
              defaultValue="A"
            />
          )}
        </HorizontalField>
      </div>
      <FormActions>
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Save asset</Button>
      </FormActions>
    </form>
  );
}

function FormLayoutReadOnlyReview() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-base-foreground">Details</h3>
          <Button variant="ghost" size="sm" aria-label="Edit details">
            Edit
          </Button>
        </div>
        <MetadataList
          items={[
            { label: 'Title', value: 'Inspect recompressor drive-end bearing' },
            { label: 'Asset', value: '23-KA-9103 Recompressor' },
            { label: 'Type', value: 'Corrective' },
          ]}
        />
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-base-foreground">Planning</h3>
          <Button variant="ghost" size="sm" aria-label="Edit planning">
            Edit
          </Button>
        </div>
        <MetadataList
          items={[
            { label: 'Priority', value: 'P1 – within 24 hours' },
            { label: 'Assignee', value: 'Tomás Barros' },
            { label: 'Due', value: '12 Mar 2026, 20:00' },
            { label: 'Cost centre' },
          ]}
        />
      </div>
    </div>
  );
}

function FormLayoutSectioned() {
  return (
    <form className="w-full max-w-md space-y-8" onSubmit={(event) => event.preventDefault()}>
      <FormSection title="Source" description="Where the extractor reads from.">
        <FormField label="Server address" required>
          {(control) => <Input {...control} defaultValue="opc.tcp://historian.nordkapp.test:4840" />}
        </FormField>
        <FormField label="Node filter" helper="Reads every node under this path.">
          {(control) => <Input {...control} defaultValue="NK/23/*" />}
        </FormField>
      </FormSection>
      <FormSection title="Destination" description="Where the data lands in the project.">
        <FormField label="Data set" required>
          {(control) => (
            <OptionSelect
              {...control}
              options={[
                { value: 'telemetry', label: 'Compressor telemetry' },
                { value: 'alarms', label: 'Alarm history' },
              ]}
              defaultValue="telemetry"
            />
          )}
        </FormField>
      </FormSection>
      <FormActions>
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Create pipeline</Button>
      </FormActions>
    </form>
  );
}

function FormLayoutInCard() {
  const [high, setHigh] = useState<number | null>(DISCHARGE_PRESSURE.highLimit);
  const [trip, setTrip] = useState<number | null>(DISCHARGE_PRESSURE.highHighLimit ?? null);
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Alarm limits</CardTitle>
          <CardDescription>
            {DISCHARGE_PRESSURE.tag} · {DISCHARGE_PRESSURE.name}
          </CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <div className="grid w-full grid-cols-2 gap-4">
          <FormField label="High limit">
            {(control) => (
              <UnitNumberInput {...control} value={high} onValueChange={setHigh} unit="barg" step={0.5} hideStepper />
            )}
          </FormField>
          <FormField label="Trip limit">
            {(control) => (
              <UnitNumberInput {...control} value={trip} onValueChange={setTrip} unit="barg" step={0.5} hideStepper />
            )}
          </FormField>
        </div>
      </CardContent>
      <CardFooter>
        <CardFooterStart>
          <span className="text-xs text-muted-foreground">Changed 4 Mar by Aisha Khan</span>
        </CardFooterStart>
        <CardFooterEnd className="gap-2">
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button size="sm">Save limits</Button>
        </CardFooterEnd>
      </CardFooter>
    </Card>
  );
}

function FormLayoutSectionedAside() {
  const [retries, setRetries] = useState<number | null>(3);
  return (
    <form className="w-full max-w-4xl space-y-8" onSubmit={(event) => event.preventDefault()}>
      <FormSection layout="aside" title="General" description="How the pipeline shows up in lists and in search.">
        <FormField label="Name" required>
          {(control) => <Input {...control} defaultValue="Compressor telemetry ingest" />}
        </FormField>
        <FormField label="Owner" helper="Gets the email when a run fails.">
          {(control) => <OptionSelect {...control} options={PEOPLE_OPTIONS} defaultValue="ak" />}
        </FormField>
      </FormSection>
      <Separator />
      <FormSection
        layout="aside"
        title="Schedule"
        description="When the pipeline runs and what happens when a run fails."
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Interval">
            {(control) => <OptionSelect {...control} options={INTERVAL_OPTIONS} defaultValue="15m" />}
          </FormField>
          <FormField label="Retries">
            {(control) => (
              <UnitNumberInput {...control} value={retries} onValueChange={setRetries} unit="times" min={0} max={10} />
            )}
          </FormField>
        </div>
      </FormSection>
      <FormActions>
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Save pipeline</Button>
      </FormActions>
    </form>
  );
}

function FormLayoutInDialog() {
  return (
    <div className="w-full max-w-md">
      <PanelFrame
        title="Shelve alarm"
        description="A shelved alarm stays in the list but does not sound."
        onClose={() => undefined}
        closeLabel="Close dialog"
        footer={
          <FormActions>
            <Button variant="ghost">Cancel</Button>
            <Button>Shelve alarm</Button>
          </FormActions>
        }
      >
        <div className="space-y-4">
          <FormField label="Shelve for" required>
            {(control) => (
              <OptionSelect
                {...control}
                options={[
                  { value: '1h', label: '1 hour' },
                  { value: '8h', label: 'Rest of the shift (8 hours)' },
                  { value: '24h', label: '24 hours' },
                ]}
                defaultValue="8h"
              />
            )}
          </FormField>
          <FormField label="Reason" required helper="Shown to the next shift in the alarm log.">
            {(control) => <Textarea {...control} rows={2} defaultValue="Transmitter replacement planned, WO-104479." />}
          </FormField>
        </div>
      </PanelFrame>
    </div>
  );
}

function FormLayoutStickyFooter() {
  return (
    <form
      className="h-80 w-full max-w-md overflow-y-auto rounded-lg"
      aria-label="Edit asset"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="space-y-4 px-1 pb-6 pt-1">
        <FormField label="Tag" required>
          {(control) => <Input {...control} defaultValue="27-PA-2001A" />}
        </FormField>
        <FormField label="Name" required>
          {(control) => <Input {...control} defaultValue="Export pump A" />}
        </FormField>
        <FormField label="Area">
          {(control) => <OptionSelect {...control} options={AREA_OPTIONS} defaultValue="nk-27" />}
        </FormField>
        <FormField label="Manufacturer">{(control) => <Input {...control} defaultValue="Sulzer" />}</FormField>
        <FormField label="Model">{(control) => <Input {...control} defaultValue="MSD-D 6x8x13" />}</FormField>
        <FormField label="Notes">
          {(control) => <Textarea {...control} rows={3} defaultValue="Seal replaced during the 2025 turnaround." />}
        </FormField>
      </div>
      <FormActions sticky status="Unsaved changes">
        <Button type="button" variant="ghost">
          Discard
        </Button>
        <Button type="submit">Save asset</Button>
      </FormActions>
    </form>
  );
}

function FormLayoutMarkRequired() {
  return (
    <form className="w-full max-w-md space-y-4" onSubmit={(event) => event.preventDefault()}>
      <p className="text-sm text-muted-foreground">
        Fields marked <span className="text-critical-foreground-strong">*</span> are required.
      </p>
      <FormField label="Title" required>
        {(control) => <Input {...control} defaultValue="Standby start test, export pump B" />}
      </FormField>
      <FormField label="Cost centre">{(control) => <Input {...control} />}</FormField>
      <FormField label="Purchase order">{(control) => <Input {...control} />}</FormField>
      <FormField label="Notes">{(control) => <Textarea {...control} rows={2} />}</FormField>
    </form>
  );
}

function FormLayoutMarkOptional() {
  return (
    <form className="w-full max-w-md space-y-4" onSubmit={(event) => event.preventDefault()}>
      <FormField label="Title">
        {(control) => <Input {...control} required defaultValue="Standby start test, export pump B" />}
      </FormField>
      <FormField label="Asset">
        {(control) => <OptionSelect {...control} options={EQUIPMENT_OPTIONS} defaultValue="27-pa-2001b" />}
      </FormField>
      <FormField label="Priority">
        {(control) => <OptionSelect {...control} options={PRIORITY_OPTIONS} defaultValue="P3" />}
      </FormField>
      <FormField label="Notes" optional>
        {(control) => <Textarea {...control} rows={2} />}
      </FormField>
    </form>
  );
}

function FormLayoutValidationSummary() {
  const [title, setTitle] = useState('');
  const [asset, setAsset] = useState('');
  const [hours, setHours] = useState('0');
  const [submitted, setSubmitted] = useState(true);

  const titleError = title.trim() === '' ? 'Enter a title.' : undefined;
  const assetError = asset === '' ? 'Select the asset the work is for.' : undefined;
  const hoursNumber = Number(hours);
  const hoursError =
    hours.trim() === '' || Number.isNaN(hoursNumber) || hoursNumber < 1 || hoursNumber > 40
      ? 'Enter a number between 1 and 40.'
      : undefined;

  const errors = [
    { fieldId: 'form-layout-summary-title', label: 'Title', message: titleError },
    { fieldId: 'form-layout-summary-asset', label: 'Asset', message: assetError },
    { fieldId: 'form-layout-summary-hours', label: 'Estimated hours', message: hoursError },
  ].flatMap((entry) => (entry.message ? [{ ...entry, message: entry.message }] : []));

  return (
    <form
      noValidate
      className="w-full max-w-2xl space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        const first = errors[0];
        if (first) document.getElementById(first.fieldId)?.focus();
      }}
    >
      {submitted ? <ValidationSummary errors={errors} /> : null}
      <FormField id="form-layout-summary-title" label="Title" required error={submitted ? titleError : undefined}>
        {(control) => <Input {...control} value={title} onChange={(event) => setTitle(event.target.value)} />}
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField id="form-layout-summary-asset" label="Asset" required error={submitted ? assetError : undefined}>
          {(control) => (
            <OptionSelect
              {...control}
              options={EQUIPMENT_OPTIONS}
              value={asset}
              onValueChange={setAsset}
              placeholder="Select an asset"
            />
          )}
        </FormField>
        <FormField
          id="form-layout-summary-hours"
          label="Estimated hours"
          required
          error={submitted ? hoursError : undefined}
        >
          {(control) => (
            <Input {...control} inputMode="numeric" value={hours} onChange={(event) => setHours(event.target.value)} />
          )}
        </FormField>
      </div>
      <FormActions>
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Create work order</Button>
      </FormActions>
    </form>
  );
}

function FormLayoutValidateOnBlur() {
  const [value, setValue] = useState('NK Compressor');
  const [touched, setTouched] = useState(true);
  const error =
    touched && !EXTERNAL_ID_PATTERN.test(value)
      ? 'Use lowercase letters, numbers, hyphens and underscores only.'
      : undefined;
  return (
    <form className="w-full max-w-xs space-y-6" onSubmit={(event) => event.preventDefault()}>
      <FormField label="External ID" required helper="Used in API calls." error={error}>
        {(control) => (
          <Input
            {...control}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setTouched(false);
            }}
            onBlur={() => setTouched(true)}
          />
        )}
      </FormField>
      <FormActions>
        <Button type="submit">Save</Button>
      </FormActions>
    </form>
  );
}

function FormLayoutDependentSwitch() {
  const [notify, setNotify] = useState(true);
  const [recipients, setRecipients] = useState(['lw', 'ak']);
  const [delay, setDelay] = useState<number | null>(5);
  return (
    <form className="w-full max-w-md" onSubmit={(event) => event.preventDefault()}>
      <SettingSwitchRow
        label="Notify on trip"
        description="Send an email when this asset trips."
        checked={notify}
        onCheckedChange={setNotify}
      />
      {notify ? (
        <div className="space-y-4 pt-1">
          <FormField label="Recipients" required>
            {(control) => (
              <MultiSelectCombobox
                id={control.id}
                options={PEOPLE_OPTIONS}
                value={recipients}
                onValueChange={setRecipients}
                placeholder="Select people"
                searchPlaceholder="Search people…"
              />
            )}
          </FormField>
          <FormField label="Delay" helper="Wait this long before sending, in case the asset restarts.">
            {(control) => (
              <UnitNumberInput {...control} value={delay} onValueChange={setDelay} unit="min" min={0} max={60} />
            )}
          </FormField>
        </div>
      ) : null}
    </form>
  );
}

function FormLayoutDependentSelect() {
  const [sourceType, setSourceType] = useState('sql');
  return (
    <form className="w-full max-w-md space-y-4" onSubmit={(event) => event.preventDefault()}>
      <FormField label="Source type" required>
        {(control) => (
          <OptionSelect {...control} options={SOURCE_TYPE_OPTIONS} value={sourceType} onValueChange={setSourceType} />
        )}
      </FormField>
      {sourceType === 'sql' ? (
        <>
          <FormField label="Connection string" required>
            {(control) => <Input {...control} defaultValue="Server=sql.nordkapp.test;Database=maintenance" />}
          </FormField>
          <FormField label="Query" helper="Runs on every schedule tick.">
            {(control) => (
              <Textarea {...control} rows={2} defaultValue="SELECT * FROM work_orders WHERE changed > @last_run" />
            )}
          </FormField>
        </>
      ) : null}
      {sourceType === 'opc-ua' || sourceType === 'pi' ? (
        <FormField label="Server address" required>
          {(control) => <Input {...control} defaultValue="opc.tcp://historian.nordkapp.test:4840" />}
        </FormField>
      ) : null}
      {sourceType === 'file' ? (
        <FormField label="Folder path" required helper="Reads new CSV files as they arrive.">
          {(control) => <Input {...control} defaultValue="\\\\nordkapp.test\\exports\\lab" />}
        </FormField>
      ) : null}
    </form>
  );
}

type LimitRow = { id: string; type: string; value: number | null; severity: string };

function FormLayoutRepeatingRows() {
  const nextId = useRef(3);
  const [rows, setRows] = useState<LimitRow[]>([
    { id: 'limit-1', type: 'high-high', value: 55, severity: 'critical' },
    { id: 'limit-2', type: 'high', value: 52, severity: 'high' },
  ]);

  const update = (id: string, patch: Partial<LimitRow>) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <div className="grid grid-cols-3 gap-3 pr-11 text-sm font-medium text-muted-foreground" aria-hidden="true">
        <span>Limit</span>
        <span>Value</span>
        <span>Severity</span>
      </div>
      <RepeatingRows
        label="Alarm limits for 23-PT-92531"
        rows={rows}
        minRows={1}
        maxRows={4}
        maxReason="A tag can have up to 4 limits."
        addLabel="Add limit"
        removeLabel={(_row, index) => `Remove limit ${index + 1}`}
        onAdd={() => {
          setRows((current) => [
            ...current,
            { id: `limit-${nextId.current}`, type: 'low', value: 40, severity: 'medium' },
          ]);
          nextId.current += 1;
        }}
        onRemove={(id) => setRows((current) => current.filter((row) => row.id !== id))}
        renderRow={(row, index) => (
          <div className="grid grid-cols-3 gap-3">
            <OptionSelect
              aria-label={`Limit ${index + 1} type`}
              options={LIMIT_TYPE_OPTIONS}
              value={row.type}
              onValueChange={(type) => update(row.id, { type })}
              width="compact"
            />
            <UnitNumberInput
              aria-label={`Limit ${index + 1} value`}
              value={row.value}
              onValueChange={(value) => update(row.id, { value })}
              unit="barg"
              step={0.5}
              hideStepper
            />
            <OptionSelect
              aria-label={`Limit ${index + 1} severity`}
              options={SEVERITY_OPTIONS}
              value={row.severity}
              onValueChange={(severity) => update(row.id, { severity })}
              width="compact"
            />
          </div>
        )}
      />
    </div>
  );
}

function FormLayoutAdvancedCollapsed() {
  return (
    <form className="w-full max-w-xs" onSubmit={(event) => event.preventDefault()}>
      <FormField label="Pipeline name" required>
        {(control) => <Input {...control} defaultValue="Lab results import" />}
      </FormField>
      <Collapsible className="pt-2">
        <CollapsibleTrigger
          render={
            <Button variant="ghost" className="-ml-2 w-full justify-between">
              Advanced options
              <IconSelector />
            </Button>
          }
        />
        <CollapsibleContent>
          <div className="space-y-4 pt-2">
            <FormField label="Batch size">
              {(control) => <Input {...control} type="number" defaultValue={10000} />}
            </FormField>
            <FormField label="Retries">{(control) => <Input {...control} type="number" defaultValue={3} />}</FormField>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </form>
  );
}

function FormLayoutUnitsAndRange() {
  const sensor = DISCHARGE_PRESSURE;
  const [low, setLow] = useState<number | null>(sensor.lowLimit);
  const [high, setHigh] = useState<number | null>(38);
  const [deadband, setDeadband] = useState<number | null>(0.5);
  const rangeError =
    low !== null && high !== null && high <= low ? `Enter a value above the low limit of ${low} barg.` : undefined;

  return (
    <form className="w-full max-w-md space-y-4" onSubmit={(event) => event.preventDefault()}>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Low limit" helper={`Range starts at ${sensor.rangeMin} barg.`}>
          {(control) => (
            <UnitNumberInput
              {...control}
              value={low}
              onValueChange={setLow}
              unit="barg"
              min={sensor.rangeMin}
              max={sensor.rangeMax}
              step={0.5}
            />
          )}
        </FormField>
        <FormField label="High limit" helper={`Range ends at ${sensor.rangeMax} barg.`} error={rangeError}>
          {(control) => (
            <UnitNumberInput
              {...control}
              value={high}
              onValueChange={setHigh}
              unit="barg"
              min={sensor.rangeMin}
              max={sensor.rangeMax}
              step={0.5}
            />
          )}
        </FormField>
      </div>
      <FormField label="Deadband" helper="The value must move this far back inside the limit before the alarm clears.">
        {(control) => (
          <UnitNumberInput
            {...control}
            value={deadband}
            onValueChange={setDeadband}
            unit="barg"
            min={0}
            max={5}
            step={0.1}
          />
        )}
      </FormField>
    </form>
  );
}

function FormLayoutChoiceFirst() {
  const [mode, setMode] = useState('interval');
  return (
    <form className="w-full max-w-md space-y-4" onSubmit={(event) => event.preventDefault()}>
      <ChoiceCardGroup
        label="Run"
        value={mode}
        onValueChange={setMode}
        options={[
          { value: 'interval', label: 'On an interval', description: 'Runs at a fixed pace, such as every hour.' },
          { value: 'cron', label: 'On a cron schedule', description: 'Runs at exact times you describe.' },
        ]}
      />
      {mode === 'interval' ? (
        <FormField label="Interval">
          {(control) => <OptionSelect {...control} options={INTERVAL_OPTIONS} defaultValue="1h" />}
        </FormField>
      ) : (
        <FormField label="Cron expression" helper="Five fields: minute, hour, day, month, weekday.">
          {(control) => <Input {...control} defaultValue="0 2 * * 1-5" />}
        </FormField>
      )}
    </form>
  );
}

function FormLayoutConfigureAlarm() {
  const sensor = DISCHARGE_PRESSURE;
  const [limit, setLimit] = useState<number | null>(sensor.highLimit);
  const [delay, setDelay] = useState<number | null>(2);
  const [enabled, setEnabled] = useState(true);
  return (
    <form className="w-full max-w-md space-y-6" onSubmit={(event) => event.preventDefault()}>
      <div className="space-y-4">
        <FormField label="Time series">
          {(control) => <Input {...control} readOnly defaultValue={`${sensor.tag} · ${sensor.name}`} />}
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Limit type" required>
            {(control) => (
              <OptionSelect {...control} options={LIMIT_TYPE_OPTIONS} defaultValue="high" width="compact" />
            )}
          </FormField>
          <FormField label="Limit value" required>
            {(control) => (
              <UnitNumberInput {...control} value={limit} onValueChange={setLimit} unit={sensor.unit} step={0.5} />
            )}
          </FormField>
        </div>
        <div className="flex flex-col">
          <span id="form-layout-alarm-severity" className="pb-2 text-sm font-medium text-muted-foreground">
            Severity
          </span>
          <RadioGroup
            defaultValue="high"
            orientation="horizontal"
            aria-labelledby="form-layout-alarm-severity"
            className="gap-4"
          >
            {SEVERITY_OPTIONS.map((option) => (
              <RadioGroupItem key={option.value}>
                <RadioGroupItemControl value={option.value} />
                <RadioGroupItemLabel>{option.label}</RadioGroupItemLabel>
              </RadioGroupItem>
            ))}
          </RadioGroup>
        </div>
        <FormField label="On delay" helper="The value must stay past the limit this long before the alarm is raised.">
          {(control) => (
            <UnitNumberInput {...control} value={delay} onValueChange={setDelay} unit="s" min={0} max={60} />
          )}
        </FormField>
        <SettingSwitchRow
          label="Enable alarm"
          description="A disabled alarm keeps its limit but is never raised."
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>
      <FormActions>
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Save alarm limit</Button>
      </FormActions>
    </form>
  );
}

function FormLayoutScheduleTransformation() {
  const [notify, setNotify] = useState(true);
  return (
    <form className="w-full max-w-md space-y-6" onSubmit={(event) => event.preventDefault()}>
      <div className="space-y-4">
        <FormField label="Transformation">
          {(control) => <Input {...control} readOnly defaultValue="Work orders to data model" />}
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Cron expression" required helper="Weekdays at 02:00.">
            {(control) => <Input {...control} defaultValue="0 2 * * 1-5" />}
          </FormField>
          <FormField label="Time zone" required>
            {(control) => <OptionSelect {...control} options={TIME_ZONE_OPTIONS} defaultValue="oslo" width="compact" />}
          </FormField>
        </div>
        <DateField label="First run" defaultValue={TODAY.add(1, 'day')} helper="Next run: 13 Mar 2026, 02:00 CET." />
        <SettingSwitchRow
          label="Email me when a run fails"
          description="One email per failed run, with a link to the log."
          checked={notify}
          onCheckedChange={setNotify}
        />
      </div>
      <FormActions>
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Schedule transformation</Button>
      </FormActions>
    </form>
  );
}

function FormLayoutInviteUser() {
  const [role, setRole] = useState('operator');
  const [sites, setSites] = useState(['nordkapp']);
  return (
    <form className="w-full max-w-md space-y-6" onSubmit={(event) => event.preventDefault()}>
      <div className="space-y-4">
        <FormField label="Email address" required>
          {(control) => (
            <Input {...control} type="email" autoComplete="off" defaultValue="jonas.nyberg@nordkapp.test" />
          )}
        </FormField>
        <ChoiceCardGroup
          label="Role"
          value={role}
          onValueChange={setRole}
          options={[
            { value: 'operator', label: 'Operator', description: 'Views data and acknowledges alarms.' },
            { value: 'engineer', label: 'Engineer', description: 'Also edits limits, pipelines and dashboards.' },
          ]}
        />
        <SelectAllCheckboxList
          label="Sites"
          selectAllLabel="All sites"
          options={SITES.map((site) => ({ id: site.id, label: site.name, description: site.region }))}
          value={sites}
          onValueChange={setSites}
          formatCount={() => ''}
        />
      </div>
      <FormActions>
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Send invite</Button>
      </FormActions>
    </form>
  );
}

function FormLayoutConnectSource() {
  const [tested, setTested] = useState(false);
  return (
    <form className="w-full max-w-md space-y-6" onSubmit={(event) => event.preventDefault()}>
      <div className="space-y-4">
        <FormField label="Source type" required>
          {(control) => <OptionSelect {...control} options={SOURCE_TYPE_OPTIONS} defaultValue="opc-ua" />}
        </FormField>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <FormField label="Host" required>
              {(control) => <Input {...control} defaultValue="historian.nordkapp.test" />}
            </FormField>
          </div>
          <FormField label="Port" required>
            {(control) => <Input {...control} inputMode="numeric" defaultValue="4840" />}
          </FormField>
        </div>
        <FormField label="Client ID" required>
          {(control) => <Input {...control} autoComplete="off" defaultValue="nk-opcua-extractor" />}
        </FormField>
        <FormField label="Client secret" required helper="Stored encrypted. You cannot read it back later.">
          {(control) => (
            <PasswordInput
              {...control}
              autoComplete="off"
              defaultValue="nk-extractor-7f3a91c2"
              showLabel="Show client secret"
              hideLabel="Hide client secret"
            />
          )}
        </FormField>
      </div>
      <FormActions
        status={
          tested ? (
            <span className="flex items-center gap-1.5">
              <IconCheck aria-hidden="true" className="size-4" /> Connected, 1,284 nodes found
            </span>
          ) : (
            'Not tested yet'
          )
        }
      >
        <AsyncButton
          type="button"
          variant="secondary"
          pendingLabel="Testing…"
          onAction={() => wait(1200).then(() => setTested(true))}
        >
          Test connection
        </AsyncButton>
        <Button type="submit">Connect source</Button>
      </FormActions>
    </form>
  );
}

export default definePage({
  id: 'form-layouts',
  title: 'Form layouts',
  summary:
    'How fields are arranged into complete forms: columns, sections, containers, validation and the fields that appear, repeat or depend on each other. Every field is a Label, a control and helper text that carry their own spacing; the layout only decides where fields and actions go.',
  guidance: {
    use: [
      'One column by default; two columns only for short, related fields such as a limit pair.',
      'space-y-4 between fields, space-y-8 between sections, and no gap inside a field.',
      'Actions at the end of the form, primary last, labelled with the outcome.',
      'Errors inline on the field, plus a summary at the top when the form is longer than the screen.',
    ],
    avoid: [
      'Placeholder text as the only label, or as the place for instructions.',
      'A disabled submit button with no visible reason.',
      'Validating on every keystroke, or clearing input after a failed submission.',
      'More than about seven fields without a section heading.',
    ],
  },
  source,
  sections: [
    {
      id: 'structure',
      title: 'Structure',
      description: 'Where labels, fields and actions sit.',
      specimens: [
        {
          id: 'FormLayoutSingleColumn',
          title: 'Single column',
          note: 'The default for any form: one field per row reads top to bottom and never needs a second look.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx', 'forms/CharacterCountTextarea.tsx', 'patterns/data-entry/FormActions.tsx'],
          Component: FormLayoutSingleColumn,
        },
        {
          id: 'FormLayoutTwoColumn',
          title: 'Two-column grid',
          note: 'When short, related fields would make a single column needlessly tall; long fields still span both columns.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'forms/FormField.tsx',
            'forms/UnitNumberInput.tsx',
            'patterns/data-entry/OptionSelect.tsx',
            'patterns/data-entry/FormActions.tsx',
          ],
          Component: FormLayoutTwoColumn,
        },
        {
          id: 'FormLayoutInline',
          title: 'Inline, one row',
          note: 'For a two- or three-field action repeated often, such as inviting people one after another.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/data-entry/OptionSelect.tsx'],
          Component: FormLayoutInline,
        },
        {
          id: 'FormLayoutLabelLeft',
          title: 'Labels on the left',
          note: 'For dense property forms with short labels, where people scan down the label column to find a field.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'patterns/data-entry/HorizontalField.tsx',
            'patterns/data-entry/OptionSelect.tsx',
            'patterns/data-entry/FormActions.tsx',
          ],
          Component: FormLayoutLabelLeft,
        },
        {
          id: 'FormLayoutReadOnlyReview',
          title: 'Read-only review',
          note: 'To show saved or about-to-be-submitted values as text, with an Edit action per section instead of disabled inputs.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: FormLayoutReadOnlyReview,
        },
      ],
    },
    {
      id: 'grouping',
      title: 'Grouping and containers',
      description: 'Sections for longer forms, and the frames a form can live in.',
      specimens: [
        {
          id: 'FormLayoutSectioned',
          title: 'Sections with headings',
          note: 'Once a form passes about seven fields, or mixes two subjects, so each group can be found by its heading.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'patterns/data-entry/FormSection.tsx',
            'forms/FormField.tsx',
            'patterns/data-entry/OptionSelect.tsx',
            'patterns/data-entry/FormActions.tsx',
          ],
          Component: FormLayoutSectioned,
        },
        {
          id: 'FormLayoutInCard',
          title: 'In a card',
          note: 'For a small, self-contained edit that sits among other content on a page, with its actions in the card footer.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx', 'forms/UnitNumberInput.tsx'],
          Component: FormLayoutInCard,
        },
        {
          id: 'FormLayoutSectionedAside',
          title: 'Section headings beside the fields',
          note: 'On a wide settings or edit page, where a heading column makes the sections scannable and keeps fields at form width.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/data-entry/FormSection.tsx',
            'forms/FormField.tsx',
            'forms/UnitNumberInput.tsx',
            'patterns/data-entry/OptionSelect.tsx',
            'patterns/data-entry/FormActions.tsx',
          ],
          Component: FormLayoutSectionedAside,
        },
        {
          id: 'FormLayoutInDialog',
          title: 'In a dialog',
          note: 'For a short task that needs a decision before work continues; keep it to a few fields and name the outcome on the button.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'patterns/data-entry/PanelFrame.tsx',
            'patterns/data-entry/FormActions.tsx',
            'forms/FormField.tsx',
            'patterns/data-entry/OptionSelect.tsx',
          ],
          Component: FormLayoutInDialog,
        },
        {
          id: 'FormLayoutStickyFooter',
          title: 'Sticky footer',
          note: 'When the form is taller than its container, so saving and the unsaved state stay in view while it scrolls.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/FormActions.tsx', 'forms/FormField.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: FormLayoutStickyFooter,
        },
      ],
    },
    {
      id: 'conventions',
      title: 'Conventions and validation',
      description: 'How a form says what is needed and what went wrong.',
      specimens: [
        {
          id: 'FormLayoutMarkRequired',
          title: 'Mark the required fields',
          note: 'When most fields are optional: flag the few required ones and explain the marker once above the form.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: FormLayoutMarkRequired,
        },
        {
          id: 'FormLayoutMarkOptional',
          title: 'Mark the optional fields',
          note: 'When most fields are required: leave them plain and label the exceptions "(optional)".',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: FormLayoutMarkOptional,
        },
        {
          id: 'FormLayoutValidationSummary',
          title: 'Error summary and inline errors',
          note: 'After a failed submission of a long form: the summary says how much is wrong and links to each field.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: [
            'patterns/data-entry/ValidationSummary.tsx',
            'forms/FormField.tsx',
            'patterns/data-entry/OptionSelect.tsx',
            'patterns/data-entry/FormActions.tsx',
          ],
          Component: FormLayoutValidationSummary,
        },
        {
          id: 'FormLayoutValidateOnBlur',
          title: 'Validate on blur',
          note: 'For format rules: check when the user leaves the field, and drop the error as soon as they start fixing it.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['forms/FormField.tsx', 'patterns/data-entry/FormActions.tsx'],
          Component: FormLayoutValidateOnBlur,
        },
      ],
    },
    {
      id: 'dynamic',
      title: 'Dynamic fields',
      description: 'Fields that appear, repeat or constrain each other.',
      specimens: [
        {
          id: 'FormLayoutDependentSwitch',
          title: 'Switch reveals fields',
          note: 'When a group of fields only matters once a feature is on; hide them rather than disable them.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'forms/SettingSwitchRow.tsx',
            'forms/FormField.tsx',
            'forms/MultiSelectCombobox.tsx',
            'forms/UnitNumberInput.tsx',
          ],
          Component: FormLayoutDependentSwitch,
        },
        {
          id: 'FormLayoutDependentSelect',
          title: 'Choice changes the fields',
          note: 'When the type picked first decides which fields follow, such as a source type and its connection details.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: FormLayoutDependentSelect,
        },
        {
          id: 'FormLayoutRepeatingRows',
          title: 'Repeating rows',
          note: 'For a list of the same small record, such as alarm limits: add and remove rows, with a stated minimum and maximum.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: [
            'patterns/data-entry/RepeatingRows.tsx',
            'patterns/data-entry/OptionSelect.tsx',
            'forms/UnitNumberInput.tsx',
          ],
          Component: FormLayoutRepeatingRows,
        },
        {
          id: 'FormLayoutAdvancedCollapsed',
          title: 'Advanced options collapsed',
          note: 'For rarely changed fields with good defaults; they stay out of the way but keep their values when closed.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: FormLayoutAdvancedCollapsed,
        },
        {
          id: 'FormLayoutUnitsAndRange',
          title: 'Units and a low–high range',
          note: 'For limit pairs: the unit sits in the field, the allowed range in the helper, and the pair is checked against each other.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx', 'forms/UnitNumberInput.tsx'],
          Component: FormLayoutUnitsAndRange,
        },
        {
          id: 'FormLayoutChoiceFirst',
          title: 'Choice cards, then details',
          note: 'When two or three modes each need a sentence of explanation before the user fills in the details for one.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/ChoiceCardGroup.tsx', 'forms/FormField.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: FormLayoutChoiceFirst,
        },
      ],
    },
    {
      id: 'complete',
      title: 'Complete forms',
      description: 'The layouts above applied to real tasks.',
      specimens: [
        {
          id: 'FormLayoutConfigureAlarm',
          title: 'Configure alarm limit',
          note: 'A reference for mixing a read-only context field, a limit with its unit, a radio choice and a switch in one form.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'forms/FormField.tsx',
            'forms/UnitNumberInput.tsx',
            'forms/SettingSwitchRow.tsx',
            'patterns/data-entry/OptionSelect.tsx',
            'patterns/data-entry/FormActions.tsx',
          ],
          Component: FormLayoutConfigureAlarm,
        },
        {
          id: 'FormLayoutScheduleTransformation',
          title: 'Schedule transformation',
          note: 'A reference for time fields: expression and time zone side by side, with the next run spelled out in the helper.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'forms/FormField.tsx',
            'forms/SettingSwitchRow.tsx',
            'patterns/data-entry/OptionSelect.tsx',
            'patterns/data-entry/FormActions.tsx',
          ],
          Component: FormLayoutScheduleTransformation,
        },
        {
          id: 'FormLayoutInviteUser',
          title: 'Invite user',
          note: 'A reference for access forms: who, which role and which sites, with choices explained where they are made.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'forms/FormField.tsx',
            'forms/ChoiceCardGroup.tsx',
            'forms/SelectAllCheckboxList.tsx',
            'patterns/data-entry/FormActions.tsx',
          ],
          Component: FormLayoutInviteUser,
        },
        {
          id: 'FormLayoutConnectSource',
          title: 'Connect a data source',
          note: 'A reference for connection forms: a secret field, a test action beside the submit, and the test result in the footer.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'forms/FormField.tsx',
            'forms/PasswordInput.tsx',
            'actions/AsyncButton.tsx',
            'patterns/data-entry/OptionSelect.tsx',
            'patterns/data-entry/FormActions.tsx',
          ],
          Component: FormLayoutConnectSource,
        },
      ],
    },
  ],
});
