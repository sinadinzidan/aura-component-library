import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Popover, PopoverContent, PopoverTrigger } from '@cognite/aura/components/popover';
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemDescription,
  RadioGroupItemLabel,
} from '@cognite/aura/components/radio-group';
import { IconArrowsSort } from '@cognite/aura/icons';
import { useId, useState } from 'react';

import { ChoiceCardGroup } from '../../../library/forms/ChoiceCardGroup';
import { definePage } from '../../types';

import source from './radio-group.tsx?raw';

const asText = (value: unknown, fallback: string) => (typeof value === 'string' ? value : fallback);

const SORT_LABELS: Record<string, string> = {
  newest: 'Newest first',
  severity: 'Severity',
  asset: 'Asset tag',
};

function RadioGroupVertical() {
  return (
    <RadioGroup defaultValue="average" aria-label="Aggregation">
      <RadioGroupItem>
        <RadioGroupItemControl value="average" />
        <RadioGroupItemLabel>Average</RadioGroupItemLabel>
      </RadioGroupItem>
      <RadioGroupItem>
        <RadioGroupItemControl value="minimum" />
        <RadioGroupItemLabel>Minimum</RadioGroupItemLabel>
      </RadioGroupItem>
      <RadioGroupItem>
        <RadioGroupItemControl value="maximum" />
        <RadioGroupItemLabel>Maximum</RadioGroupItemLabel>
      </RadioGroupItem>
    </RadioGroup>
  );
}

function RadioGroupHorizontal() {
  return (
    <RadioGroup defaultValue="24h" orientation="horizontal" aria-label="Time range" className="gap-4">
      <RadioGroupItem>
        <RadioGroupItemControl value="1h" />
        <RadioGroupItemLabel>1 hour</RadioGroupItemLabel>
      </RadioGroupItem>
      <RadioGroupItem>
        <RadioGroupItemControl value="24h" />
        <RadioGroupItemLabel>24 hours</RadioGroupItemLabel>
      </RadioGroupItem>
      <RadioGroupItem>
        <RadioGroupItemControl value="7d" />
        <RadioGroupItemLabel>7 days</RadioGroupItemLabel>
      </RadioGroupItem>
    </RadioGroup>
  );
}

function RadioGroupWithDescription() {
  return (
    <RadioGroup defaultValue="append" aria-label="Write mode">
      <RadioGroupItem>
        <RadioGroupItemControl value="append" />
        <RadioGroupItemLabel>Append</RadioGroupItemLabel>
        <RadioGroupItemDescription>Adds new rows and keeps existing ones.</RadioGroupItemDescription>
      </RadioGroupItem>
      <RadioGroupItem>
        <RadioGroupItemControl value="replace" />
        <RadioGroupItemLabel>Replace</RadioGroupItemLabel>
        <RadioGroupItemDescription>Clears the table before each run.</RadioGroupItemDescription>
      </RadioGroupItem>
    </RadioGroup>
  );
}

function RadioGroupCard() {
  return (
    <RadioGroup defaultValue="scheduled" aria-label="Trigger">
      <RadioGroupItem variant="card">
        <RadioGroupItemControl value="scheduled" />
        <RadioGroupItemLabel>Scheduled</RadioGroupItemLabel>
        <RadioGroupItemDescription>Runs every hour, on the hour.</RadioGroupItemDescription>
      </RadioGroupItem>
      <RadioGroupItem variant="card">
        <RadioGroupItemControl value="manual" />
        <RadioGroupItemLabel>Manual</RadioGroupItemLabel>
        <RadioGroupItemDescription>Runs only when someone starts it.</RadioGroupItemDescription>
      </RadioGroupItem>
    </RadioGroup>
  );
}

function RadioGroupCardLabelOnly() {
  return (
    <RadioGroup defaultValue="metric" orientation="horizontal" aria-label="Unit system" className="w-full">
      <RadioGroupItem variant="card" className="w-full">
        <RadioGroupItemControl value="metric" />
        <RadioGroupItemLabel>Metric</RadioGroupItemLabel>
      </RadioGroupItem>
      <RadioGroupItem variant="card" className="w-full">
        <RadioGroupItemControl value="imperial" />
        <RadioGroupItemLabel>Imperial</RadioGroupItemLabel>
      </RadioGroupItem>
    </RadioGroup>
  );
}

function RadioGroupWithLabel() {
  const id = useId();
  return (
    <div className="flex flex-col">
      <Label id={`${id}-label`}>Work order type</Label>
      <RadioGroup defaultValue="corrective" aria-labelledby={`${id}-label`} aria-describedby={`${id}-help`}>
        <RadioGroupItem>
          <RadioGroupItemControl value="corrective" />
          <RadioGroupItemLabel>Corrective</RadioGroupItemLabel>
        </RadioGroupItem>
        <RadioGroupItem>
          <RadioGroupItemControl value="preventive" />
          <RadioGroupItemLabel>Preventive</RadioGroupItemLabel>
        </RadioGroupItem>
        <RadioGroupItem>
          <RadioGroupItemControl value="inspection" />
          <RadioGroupItemLabel>Inspection</RadioGroupItemLabel>
        </RadioGroupItem>
      </RadioGroup>
      <HelperText id={`${id}-help`}>The type decides which approval flow applies.</HelperText>
    </div>
  );
}

function RadioGroupLongLabels() {
  return (
    <RadioGroup defaultValue="keep" aria-label="When a sensor stops reporting" className="w-full max-w-64">
      <RadioGroupItem>
        <RadioGroupItemControl value="keep" />
        <RadioGroupItemLabel>Keep the last good value until the signal returns</RadioGroupItemLabel>
      </RadioGroupItem>
      <RadioGroupItem>
        <RadioGroupItemControl value="gap" />
        <RadioGroupItemLabel>Leave a gap in the trend and raise a signal quality alarm</RadioGroupItemLabel>
      </RadioGroupItem>
    </RadioGroup>
  );
}

function RadioGroupWithBadge() {
  return (
    <RadioGroup defaultValue="p2" aria-label="Priority">
      <RadioGroupItem>
        <RadioGroupItemControl value="p1" />
        <RadioGroupItemLabel className="flex items-center gap-2">
          <Badge variant="error">P1</Badge> Within 24 hours
        </RadioGroupItemLabel>
      </RadioGroupItem>
      <RadioGroupItem>
        <RadioGroupItemControl value="p2" />
        <RadioGroupItemLabel className="flex items-center gap-2">
          <Badge variant="warning">P2</Badge> Within 7 days
        </RadioGroupItemLabel>
      </RadioGroupItem>
      <RadioGroupItem>
        <RadioGroupItemControl value="p3" />
        <RadioGroupItemLabel className="flex items-center gap-2">
          <Badge variant="archived">P3</Badge> Next planned stop
        </RadioGroupItemLabel>
      </RadioGroupItem>
    </RadioGroup>
  );
}

function RadioGroupTwoColumns() {
  return (
    <RadioGroup defaultValue="15m" aria-label="Sampling interval" className="grid-cols-2 gap-x-6">
      <RadioGroupItem>
        <RadioGroupItemControl value="1m" />
        <RadioGroupItemLabel>1 minute</RadioGroupItemLabel>
      </RadioGroupItem>
      <RadioGroupItem>
        <RadioGroupItemControl value="15m" />
        <RadioGroupItemLabel>15 minutes</RadioGroupItemLabel>
      </RadioGroupItem>
      <RadioGroupItem>
        <RadioGroupItemControl value="1h" />
        <RadioGroupItemLabel>1 hour</RadioGroupItemLabel>
      </RadioGroupItem>
      <RadioGroupItem>
        <RadioGroupItemControl value="1d" />
        <RadioGroupItemLabel>1 day</RadioGroupItemLabel>
      </RadioGroupItem>
    </RadioGroup>
  );
}

function RadioGroupControlled() {
  const [unit, setUnit] = useState('barg');
  return (
    <div className="flex flex-col gap-2">
      <RadioGroup
        value={unit}
        onValueChange={(next) => setUnit(asText(next, 'barg'))}
        orientation="horizontal"
        aria-label="Pressure unit"
        className="gap-4"
      >
        <RadioGroupItem>
          <RadioGroupItemControl value="barg" />
          <RadioGroupItemLabel>barg</RadioGroupItemLabel>
        </RadioGroupItem>
        <RadioGroupItem>
          <RadioGroupItemControl value="psi" />
          <RadioGroupItemLabel>psi</RadioGroupItemLabel>
        </RadioGroupItem>
      </RadioGroup>
      <p className="text-sm tabular-nums text-muted-foreground">
        Discharge pressure: {unit === 'barg' ? '48.6 barg' : '704.9 psi'}
      </p>
    </div>
  );
}

function RadioGroupRequiredUnselected() {
  const id = useId();
  return (
    <div className="flex flex-col">
      <Label id={`${id}-label`} required>
        Does the work need a shutdown
      </Label>
      <RadioGroup required name="shutdown" orientation="horizontal" aria-labelledby={`${id}-label`} className="gap-4">
        <RadioGroupItem>
          <RadioGroupItemControl value="yes" />
          <RadioGroupItemLabel>Yes</RadioGroupItemLabel>
        </RadioGroupItem>
        <RadioGroupItem>
          <RadioGroupItemControl value="no" />
          <RadioGroupItemLabel>No</RadioGroupItemLabel>
        </RadioGroupItem>
      </RadioGroup>
    </div>
  );
}

function RadioGroupInvalid() {
  const id = useId();
  const [value, setValue] = useState('');
  const invalid = value === '';
  return (
    <div className="flex flex-col">
      <Label id={`${id}-label`} required>
        Root cause
      </Label>
      <RadioGroup
        value={value}
        onValueChange={(next) => setValue(asText(next, ''))}
        aria-labelledby={`${id}-label`}
        aria-describedby={invalid ? `${id}-error` : undefined}
        aria-invalid={invalid ? true : undefined}
      >
        <RadioGroupItem>
          <RadioGroupItemControl value="mechanical" />
          <RadioGroupItemLabel>Mechanical failure</RadioGroupItemLabel>
        </RadioGroupItem>
        <RadioGroupItem>
          <RadioGroupItemControl value="instrument" />
          <RadioGroupItemLabel>Instrument fault</RadioGroupItemLabel>
        </RadioGroupItem>
        <RadioGroupItem>
          <RadioGroupItemControl value="process" />
          <RadioGroupItemLabel>Process upset</RadioGroupItemLabel>
        </RadioGroupItem>
      </RadioGroup>
      {invalid ? (
        <HelperText id={`${id}-error`} isError>
          Select a root cause to close the work order.
        </HelperText>
      ) : null}
    </div>
  );
}

function RadioGroupDisabledWithReason() {
  const id = useId();
  return (
    <div className="flex flex-col">
      <Label id={`${id}-label`}>Write mode</Label>
      <RadioGroup disabled defaultValue="append" aria-labelledby={`${id}-label`} aria-describedby={`${id}-reason`}>
        <RadioGroupItem>
          <RadioGroupItemControl value="append" />
          <RadioGroupItemLabel>Append</RadioGroupItemLabel>
        </RadioGroupItem>
        <RadioGroupItem>
          <RadioGroupItemControl value="replace" />
          <RadioGroupItemLabel>Replace</RadioGroupItemLabel>
        </RadioGroupItem>
      </RadioGroup>
      <HelperText id={`${id}-reason`}>Stop the pipeline to change its write mode.</HelperText>
    </div>
  );
}

function RadioGroupDisabledOption() {
  return (
    <RadioGroup defaultValue="csv" aria-label="Export format">
      <RadioGroupItem>
        <RadioGroupItemControl value="csv" />
        <RadioGroupItemLabel>CSV</RadioGroupItemLabel>
      </RadioGroupItem>
      <RadioGroupItem>
        <RadioGroupItemControl value="parquet" />
        <RadioGroupItemLabel>Parquet</RadioGroupItemLabel>
      </RadioGroupItem>
      <RadioGroupItem>
        <RadioGroupItemControl value="xlsx" disabled />
        <RadioGroupItemLabel>Excel</RadioGroupItemLabel>
        <RadioGroupItemDescription>Not available above 1 million rows.</RadioGroupItemDescription>
      </RadioGroupItem>
    </RadioGroup>
  );
}

function RadioGroupCardDisabled() {
  return (
    <RadioGroup defaultValue="scheduled" aria-label="Trigger">
      <RadioGroupItem variant="card">
        <RadioGroupItemControl value="scheduled" />
        <RadioGroupItemLabel>Scheduled</RadioGroupItemLabel>
        <RadioGroupItemDescription>Runs every hour, on the hour.</RadioGroupItemDescription>
      </RadioGroupItem>
      <RadioGroupItem variant="card">
        <RadioGroupItemControl value="event" disabled />
        <RadioGroupItemLabel>On new data</RadioGroupItemLabel>
        <RadioGroupItemDescription>Needs a streaming source.</RadioGroupItemDescription>
      </RadioGroupItem>
    </RadioGroup>
  );
}

function RadioGroupChoiceCards() {
  const [mode, setMode] = useState('rolling');
  return (
    <div className="w-full max-w-sm">
      <ChoiceCardGroup
        label="Baseline for anomaly detection"
        value={mode}
        onValueChange={setMode}
        options={[
          {
            value: 'rolling',
            label: 'Rolling 30 days',
            description: 'Follows slow drift in the process.',
            tag: 'Recommended',
          },
          { value: 'fixed', label: 'Fixed period', description: 'Compares against a period you pick.' },
          { value: 'design', label: 'Design values', description: 'Uses the limits from the datasheet.' },
        ]}
        helperText="You can change the baseline later without losing history."
      />
    </div>
  );
}

function RadioGroupChoiceCardGrid() {
  const [plan, setPlan] = useState('hourly');
  return (
    <div className="my-auto w-full">
    <ChoiceCardGroup
      label="Run schedule"
      layout="grid"
      value={plan}
      onValueChange={setPlan}
      options={[
        { value: 'hourly', label: 'Every hour', description: 'For dashboards that operators watch.' },
        { value: 'daily', label: 'Every day', description: 'For reports read the next morning.' },
        { value: 'manual', label: 'Manually', description: 'For one-off backfills and tests.' },
      ]}
    />
    </div>
  );
}

function RadioGroupChoiceCardUnavailable() {
  const [target, setTarget] = useState('test');
  return (
    <div className="w-full max-w-sm">
      <ChoiceCardGroup
        label="Deploy to"
        value={target}
        onValueChange={setTarget}
        options={[
          { value: 'test', label: 'Test project', description: 'Safe to try: uses a copy of the data.' },
          {
            value: 'production',
            label: 'Production project',
            disabledReason: 'Needs approval from a plant admin.',
          },
        ]}
      />
    </div>
  );
}

function RadioGroupRevealOnSelect() {
  const id = useId();
  const [retention, setRetention] = useState('90');
  return (
    <div className="flex w-full max-w-xs flex-col">
      <Label id={`${id}-label`}>Keep raw data for</Label>
      <RadioGroup
        value={retention}
        onValueChange={(next) => setRetention(asText(next, '90'))}
        aria-labelledby={`${id}-label`}
      >
        <RadioGroupItem>
          <RadioGroupItemControl value="90" />
          <RadioGroupItemLabel>90 days</RadioGroupItemLabel>
        </RadioGroupItem>
        <RadioGroupItem>
          <RadioGroupItemControl value="365" />
          <RadioGroupItemLabel>1 year</RadioGroupItemLabel>
        </RadioGroupItem>
        <RadioGroupItem>
          <RadioGroupItemControl value="custom" />
          <RadioGroupItemLabel>Custom</RadioGroupItemLabel>
        </RadioGroupItem>
      </RadioGroup>
      {retention === 'custom' ? (
        <div className="flex items-center gap-2 pl-6">
          <Input aria-label="Days to keep raw data" inputMode="numeric" defaultValue="180" className="w-24" />
          <span className="text-sm text-muted-foreground">days</span>
        </div>
      ) : null}
    </div>
  );
}

function RadioGroupSettingRow() {
  const id = useId();
  return (
    <div className="flex w-full max-w-lg items-center justify-between gap-6">
      <div className="flex min-w-0 flex-col gap-1">
        <span id={`${id}-label`} className="text-sm font-medium text-base-foreground">
          Table density
        </span>
        <span className="text-xs text-muted-foreground">Applies to every data grid in this workspace.</span>
      </div>
      <RadioGroup
        defaultValue="comfortable"
        orientation="horizontal"
        aria-labelledby={`${id}-label`}
        className="shrink-0 gap-4"
      >
        <RadioGroupItem>
          <RadioGroupItemControl value="compact" />
          <RadioGroupItemLabel>Compact</RadioGroupItemLabel>
        </RadioGroupItem>
        <RadioGroupItem>
          <RadioGroupItemControl value="comfortable" />
          <RadioGroupItemLabel>Comfortable</RadioGroupItemLabel>
        </RadioGroupItem>
      </RadioGroup>
    </div>
  );
}

function RadioGroupInPopover() {
  const [sort, setSort] = useState('newest');
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <IconArrowsSort /> Sort: {SORT_LABELS[sort]}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-52">
        <RadioGroup
          value={sort}
          onValueChange={(next) => setSort(asText(next, 'newest'))}
          aria-label="Sort alarms by"
          className="w-full"
        >
          <RadioGroupItem>
            <RadioGroupItemControl value="newest" />
            <RadioGroupItemLabel>Newest first</RadioGroupItemLabel>
          </RadioGroupItem>
          <RadioGroupItem>
            <RadioGroupItemControl value="severity" />
            <RadioGroupItemLabel>Severity</RadioGroupItemLabel>
          </RadioGroupItem>
          <RadioGroupItem>
            <RadioGroupItemControl value="asset" />
            <RadioGroupItemLabel>Asset tag</RadioGroupItemLabel>
          </RadioGroupItem>
        </RadioGroup>
      </PopoverContent>
    </Popover>
  );
}

function RadioGroupDialogBody() {
  const id = useId();
  const [scope, setScope] = useState('selection');
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-muted-background p-4">
      <div className="flex flex-col">
        <span id={`${id}-label`} className="pb-1 text-sm font-semibold text-base-foreground">
          Export time series
        </span>
        <RadioGroup
          value={scope}
          onValueChange={(next) => setScope(asText(next, 'selection'))}
          aria-labelledby={`${id}-label`}
        >
          <RadioGroupItem>
            <RadioGroupItemControl value="selection" />
            <RadioGroupItemLabel>Selected rows</RadioGroupItemLabel>
            <RadioGroupItemDescription>3 time series</RadioGroupItemDescription>
          </RadioGroupItem>
          <RadioGroupItem>
            <RadioGroupItemControl value="filtered" />
            <RadioGroupItemLabel>Everything that matches the filter</RadioGroupItemLabel>
            <RadioGroupItemDescription>13 time series</RadioGroupItemDescription>
          </RadioGroupItem>
        </RadioGroup>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost">Cancel</Button>
        <Button>{scope === 'selection' ? 'Export 3 time series' : 'Export 13 time series'}</Button>
      </div>
    </div>
  );
}

export default definePage({
  id: 'radio-group',
  title: 'Radio group',
  summary:
    'A radio group picks exactly one option from a small set that stays visible, so the alternatives can be compared before choosing.',
  docsSlug: 'radio',
  guidance: {
    use: [
      'Two to five mutually exclusive options that are worth seeing side by side.',
      'A sensible default pre-selected whenever one exists.',
      'Descriptions or card items when the options need a sentence of explanation.',
      'A group label that asks the question the options answer.',
    ],
    avoid: [
      'More than five options, or tight space — use a select or combobox.',
      'Several selections at once — use checkboxes.',
      'A binary setting that applies immediately — use a switch.',
      'Switching between views — use a segmented control or tabs.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'Two orientations and two item variants.',
      specimens: [
        {
          id: 'RadioGroupVertical',
          title: 'Vertical',
          note: 'The default: one option per line, easy to scan and compare.',
          origin: 'aura',
          Component: RadioGroupVertical,
        },
        {
          id: 'RadioGroupHorizontal',
          title: 'Horizontal',
          note: 'Two or three short options that fit on one line of a form or toolbar.',
          origin: 'aura',
          Component: RadioGroupHorizontal,
        },
        {
          id: 'RadioGroupWithDescription',
          title: 'With description',
          note: 'Options whose consequences differ in a way the label cannot carry.',
          origin: 'aura',
          Component: RadioGroupWithDescription,
        },
        {
          id: 'RadioGroupCard',
          title: 'Card items',
          note: 'A weighty choice between two or three options; the whole card is the target.',
          origin: 'aura',
          Component: RadioGroupCard,
        },
        {
          id: 'RadioGroupCardLabelOnly',
          title: 'Card items, label only',
          note: 'A prominent either-or choice where the labels explain themselves.',
          origin: 'aura',
          align: 'stretch',
          Component: RadioGroupCardLabelOnly,
        },
      ],
    },
    {
      id: 'content',
      title: 'Labels and content',
      description: 'Naming the group and arranging what each option shows.',
      specimens: [
        {
          id: 'RadioGroupWithLabel',
          title: 'Group label and helper text',
          note: 'A group inside a form: the label asks the question, the helper text gives the consequence.',
          origin: 'aura',
          Component: RadioGroupWithLabel,
        },
        {
          id: 'RadioGroupLongLabels',
          title: 'Wrapping labels',
          note: 'Options written as full sentences; text wraps and the radio stays on the first line.',
          origin: 'aura',
          Component: RadioGroupLongLabels,
        },
        {
          id: 'RadioGroupWithBadge',
          title: 'Label with status badge',
          note: 'Options that map to a status the user already knows by its colour and code.',
          origin: 'aura',
          Component: RadioGroupWithBadge,
        },
        {
          id: 'RadioGroupTwoColumns',
          title: 'Two columns',
          note: 'Four short options in half the height; reading order stays left to right.',
          origin: 'aura',
          Component: RadioGroupTwoColumns,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Controlled, required, invalid and unavailable.',
      specimens: [
        {
          id: 'RadioGroupControlled',
          title: 'Controlled',
          note: 'When the rest of the view follows the choice; switch unit to see the value convert.',
          origin: 'aura',
          Component: RadioGroupControlled,
        },
        {
          id: 'RadioGroupRequiredUnselected',
          title: 'Required, no default',
          note: 'A question with no safe default: the user has to answer it deliberately.',
          origin: 'aura',
          Component: RadioGroupRequiredUnselected,
        },
        {
          id: 'RadioGroupInvalid',
          title: 'Invalid',
          note: 'A required group left empty on submit; the error clears as soon as one is picked.',
          origin: 'aura',
          Component: RadioGroupInvalid,
        },
        {
          id: 'RadioGroupDisabledWithReason',
          title: 'Disabled with reason',
          note: 'A locked setting that still shows its current value and how to unlock it.',
          origin: 'aura',
          Component: RadioGroupDisabledWithReason,
        },
        {
          id: 'RadioGroupDisabledOption',
          title: 'One option disabled',
          note: 'An option that exists but does not apply right now; its description says why.',
          origin: 'aura',
          Component: RadioGroupDisabledOption,
        },
        {
          id: 'RadioGroupCardDisabled',
          title: 'Disabled card item',
          note: 'An unavailable card option, kept visible so the full set stays known.',
          origin: 'aura',
          Component: RadioGroupCardDisabled,
        },
      ],
    },
    {
      id: 'choice-cards',
      title: 'Choice cards',
      description: 'A reusable card group with a label, equal widths, tags and reasons.',
      specimens: [
        {
          id: 'RadioGroupChoiceCards',
          title: 'Stacked choice cards',
          note: 'A setup decision with a recommended option, in a form column.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/ChoiceCardGroup.tsx'],
          Component: RadioGroupChoiceCards,
        },
        {
          id: 'RadioGroupChoiceCardUnavailable',
          title: 'Choice card with a reason',
          note: 'One option needs something first; the reason replaces its description.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/ChoiceCardGroup.tsx'],
          Component: RadioGroupChoiceCardUnavailable,
        },
        {
          id: 'RadioGroupChoiceCardGrid',
          title: 'Choice cards in a row',
          note: 'Three peer options across a wide form or wizard step.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['forms/ChoiceCardGroup.tsx'],
          Component: RadioGroupChoiceCardGrid,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Radio groups in settings, popovers and dialogs.',
      specimens: [
        {
          id: 'RadioGroupSettingRow',
          title: 'Settings row',
          note: 'A two-option preference in a settings list, label left and choice right.',
          origin: 'custom',
          size: 'lg',
          Component: RadioGroupSettingRow,
        },
        {
          id: 'RadioGroupInPopover',
          title: 'Sort order in a popover',
          note: 'A single choice changed now and then; the trigger shows the current one. Click to open.',
          origin: 'custom',
          Component: RadioGroupInPopover,
        },
        {
          id: 'RadioGroupDialogBody',
          title: 'Scope choice in a dialog',
          note: 'The choice changes what the primary button will do, and the button says so.',
          origin: 'custom',
          size: 'md',
          Component: RadioGroupDialogBody,
        },
        {
          id: 'RadioGroupRevealOnSelect',
          title: 'Option that reveals a field',
          note: 'Presets plus a custom value: the input appears only when it is needed.',
          origin: 'custom',
          Component: RadioGroupRevealOnSelect,
        },
      ],
    },
  ],
});
