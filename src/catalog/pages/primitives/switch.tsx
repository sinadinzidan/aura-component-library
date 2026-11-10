import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Label } from '@cognite/aura/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { Switch } from '@cognite/aura/components/switch';
import { IconDownload, IconFilter } from '@cognite/aura/icons';
import { useEffect, useId, useState } from 'react';

import { SettingSwitchRow } from '../../../library/forms/SettingSwitchRow';
import { StateTextSwitch } from '../../../library/forms/StateTextSwitch';
import { definePage } from '../../types';

import source from './switch.tsx?raw';

const PIPELINES = [
  { id: 'opc-ua', name: 'OPC UA extractor', schedule: 'Continuous' },
  { id: 'sap-pm', name: 'SAP work orders', schedule: 'Every 15 minutes' },
  { id: 'pi-backfill', name: 'PI historian backfill', schedule: 'Daily at 02:00' },
];

const SCHEDULE_ITEMS = [
  { value: 'hourly', label: 'Every hour' },
  { value: 'daily', label: 'Every day at 06:00' },
  { value: 'weekly', label: 'Every Monday at 06:00' },
];

function SwitchBare() {
  return <Switch aria-label="Live updates" />;
}

function SwitchWithLabel() {
  return <Switch label="Live updates" defaultChecked />;
}

function SwitchStateTextRight() {
  return <StateTextSwitch aria-label="Anomaly detection" defaultChecked />;
}

function SwitchStateTextLeft() {
  return <StateTextSwitch aria-label="Anomaly detection" textSide="before" />;
}

function SwitchSplitText() {
  return <Switch aria-label="Trend scale" textLeft textRight uncheckedText="Linear" checkedText="Logarithmic" />;
}

function SwitchCustomStateText() {
  return <StateTextSwitch aria-label="OPC UA extractor" checkedText="Running" uncheckedText="Paused" defaultChecked />;
}

function SwitchLabelAndStateText() {
  return <StateTextSwitch label="Alarm sounds" checkedText="On" uncheckedText="Muted" />;
}

function SwitchExternalLabel() {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <Switch id={id} defaultChecked />
      <label htmlFor={id} className="cursor-pointer text-sm font-medium text-base-foreground">
        Show operating limits
      </label>
    </div>
  );
}

function SwitchLabelAbove() {
  const id = useId();
  return (
    <div className="flex flex-col items-start">
      <Label htmlFor={id}>Auto-acknowledge cleared alarms</Label>
      <Switch id={id} aria-describedby={`${id}-help`} />
      <HelperText id={`${id}-help`}>Applies to low and medium severity.</HelperText>
    </div>
  );
}

function SwitchSpaceBetween() {
  const id = useId();
  return (
    <div className="flex w-full max-w-64 items-center justify-between gap-4">
      <label htmlFor={id} className="cursor-pointer text-sm font-medium text-base-foreground">
        Show shelved alarms
      </label>
      <Switch id={id} />
    </div>
  );
}

function SwitchOnOff() {
  return (
    <div className="flex flex-col gap-3">
      <Switch label="Off" />
      <Switch label="On" defaultChecked />
    </div>
  );
}

function SwitchControlled() {
  const [live, setLive] = useState(true);
  return (
    <div className="flex flex-col items-center gap-3">
      <Switch label="Live updates" checked={live} onCheckedChange={(next) => setLive(next)} />
      <Badge variant={live ? 'success' : 'archived'}>{live ? 'Updating every 5 seconds' : 'Paused at 14:00'}</Badge>
    </div>
  );
}

function SwitchDisabledWithReason() {
  const id = useId();
  return (
    <div className="flex flex-col items-start">
      <Switch label="Write back to source" disabled aria-describedby={`${id}-reason`} />
      <HelperText id={`${id}-reason`}>Only plant admins can turn on write-back.</HelperText>
    </div>
  );
}

function SwitchLockedOn() {
  const id = useId();
  return (
    <div className="flex flex-col items-start">
      <Switch label="Audit log" checked disabled aria-describedby={`${id}-reason`} />
      <HelperText id={`${id}-reason`}>Required by your organisation and cannot be turned off.</HelperText>
    </div>
  );
}

function SwitchSaving() {
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!saving) return;
    const handle = window.setTimeout(() => setSaving(false), 1400);
    return () => window.clearTimeout(handle);
  }, [saving]);

  return (
    <div className="flex flex-col items-start" aria-busy={saving}>
      <Switch
        label="Email me when a pipeline fails"
        checked={checked}
        disabled={saving}
        onCheckedChange={(next) => {
          setChecked(next);
          setSaving(true);
        }}
      />
      <HelperText aria-live="polite">{saving ? 'Saving…' : 'Changes are saved automatically.'}</HelperText>
    </div>
  );
}

function SwitchSaveFailed() {
  const id = useId();
  const [failed, setFailed] = useState(true);
  return (
    <div className="flex flex-col items-start">
      <Switch
        label="Sync to data warehouse"
        checked={false}
        aria-describedby={`${id}-status`}
        onCheckedChange={() => setFailed(true)}
      />
      {failed ? (
        <HelperText id={`${id}-status`} isError>
          Could not turn on sync. Check the warehouse credentials and try again.
        </HelperText>
      ) : null}
    </div>
  );
}

function SwitchSettingRow() {
  const [enabled, setEnabled] = useState(true);
  return (
    <div className="w-full max-w-md">
      <SettingSwitchRow
        label="Email me when an asset trips"
        description="One email per trip, sent to your work address."
        checked={enabled}
        onCheckedChange={setEnabled}
      />
    </div>
  );
}

function SwitchSettingRowDisabled() {
  return (
    <div className="w-full max-w-md">
      <SettingSwitchRow
        label="Single sign-on"
        description="Sign in with your company account."
        checked
        onCheckedChange={() => undefined}
        disabledReason="Managed by your identity provider."
      />
    </div>
  );
}

function SwitchSettingsList() {
  const [settings, setSettings] = useState({ alarms: true, workOrders: true, digest: false });
  return (
    <section className="flex w-full max-w-md flex-col" aria-labelledby="switch-settings-heading">
      <h3 id="switch-settings-heading" className="pb-1 text-sm font-semibold text-base-foreground">
        Notifications
      </h3>
      <SettingSwitchRow
        label="Critical alarms"
        description="As soon as a critical alarm is raised."
        checked={settings.alarms}
        onCheckedChange={(alarms) => setSettings({ ...settings, alarms })}
      />
      <SettingSwitchRow
        label="Work orders assigned to me"
        description="When a planner assigns or reschedules one."
        checked={settings.workOrders}
        onCheckedChange={(workOrders) => setSettings({ ...settings, workOrders })}
      />
      <SettingSwitchRow
        label="Weekly digest"
        description="A summary of plant KPIs every Monday."
        checked={settings.digest}
        onCheckedChange={(digest) => setSettings({ ...settings, digest })}
      />
    </section>
  );
}

function SwitchMasterWithChildren() {
  const [all, setAll] = useState(true);
  const [channels, setChannels] = useState({ email: true, push: false });
  const pausedReason = all ? undefined : 'Turn on notifications to change this.';
  return (
    <div className="flex w-full max-w-md flex-col">
      <SettingSwitchRow
        label="Notifications"
        description="Pause everything without losing your choices."
        checked={all}
        onCheckedChange={setAll}
      />
      <div className="flex flex-col pl-6">
        <SettingSwitchRow
          label="Email"
          checked={all && channels.email}
          onCheckedChange={(email) => setChannels({ ...channels, email })}
          disabledReason={pausedReason}
        />
        <SettingSwitchRow
          label="Push to mobile"
          checked={all && channels.push}
          onCheckedChange={(push) => setChannels({ ...channels, push })}
          disabledReason={pausedReason}
        />
      </div>
    </div>
  );
}

function SwitchRevealsOptions() {
  const id = useId();
  const [scheduled, setScheduled] = useState(true);
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <SettingSwitchRow
        label="Send the report on a schedule"
        description="Recipients get a PDF without opening the app."
        checked={scheduled}
        onCheckedChange={setScheduled}
      />
      {scheduled ? (
        <div className="flex flex-col">
          <Label htmlFor={id}>Frequency</Label>
          <Select defaultValue="daily" items={SCHEDULE_ITEMS}>
            <SelectTrigger id={id}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCHEDULE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  );
}

function SwitchInToolbar() {
  return (
    <div className="flex w-full max-w-lg items-center gap-2">
      <Button variant="ghost" size="sm">
        <IconFilter /> Filter
      </Button>
      <Button variant="ghost" size="sm">
        <IconDownload /> Export
      </Button>
      <div className="ml-auto">
        <StateTextSwitch label="Live" defaultChecked />
      </div>
    </div>
  );
}

function SwitchListRows() {
  const [enabled, setEnabled] = useState(['opc-ua', 'sap-pm']);
  return (
    <ul className="flex w-full max-w-md flex-col gap-3">
      {PIPELINES.map((pipeline) => (
        <li key={pipeline.id} className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-sm font-medium text-base-foreground">{pipeline.name}</span>
            <span className="text-xs text-muted-foreground">{pipeline.schedule}</span>
          </div>
          <StateTextSwitch
            aria-label={`Run ${pipeline.name}`}
            textSide="before"
            checkedText="Enabled"
            uncheckedText="Paused"
            checked={enabled.includes(pipeline.id)}
            onCheckedChange={(next) =>
              setEnabled(next ? [...enabled, pipeline.id] : enabled.filter((id) => id !== pipeline.id))
            }
          />
        </li>
      ))}
    </ul>
  );
}

function SwitchCardHeader() {
  const id = useId();
  const [enabled, setEnabled] = useState(true);
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-muted-background p-4">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="cursor-pointer text-sm font-semibold text-base-foreground">
          Vibration anomaly detection
        </label>
        <Switch id={id} checked={enabled} onCheckedChange={(next) => setEnabled(next)} />
      </div>
      <p className="text-sm text-muted-foreground">
        {enabled
          ? 'Watching 6 sensors on the 1st stage compressor. Last anomaly 2 hours ago.'
          : 'Detection is off. No alarms are raised from vibration patterns.'}
      </p>
    </div>
  );
}

export default definePage({
  id: 'switch',
  title: 'Switch',
  summary:
    'A switch turns one setting on or off and applies it at once, with no save step. If the change waits for a form to be submitted, use a checkbox.',
  docsSlug: 'switch',
  guidance: {
    use: [
      'A setting that takes effect the moment it is toggled.',
      'A label that names the setting, not the state: "Live updates", not "Turn on".',
      'State text when on and off have domain names such as Running and Paused.',
      'A visible reason next to any switch the user cannot change.',
    ],
    avoid: [
      'Choices that apply on save — use a checkbox.',
      'One-off or destructive actions — use a button.',
      'Switches inside menus — use menu checkmarks.',
      'A switch with no accessible name.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'The switch on its own, with its built-in label and with state text.',
      specimens: [
        {
          id: 'SwitchBare',
          title: 'Control only',
          note: 'When the surrounding row already names the setting; give it an aria-label.',
          origin: 'aura',
          Component: SwitchBare,
        },
        {
          id: 'SwitchWithLabel',
          title: 'With label',
          note: 'The default: the label prop renders and wires a label in front of the switch.',
          origin: 'aura',
          Component: SwitchWithLabel,
        },
        {
          id: 'SwitchSplitText',
          title: 'Two named sides',
          note: 'A choice between two modes rather than on and off; the active side is emphasised.',
          origin: 'aura',
          Component: SwitchSplitText,
        },
        {
          id: 'SwitchStateTextRight',
          title: 'State text after',
          note: 'Spells out On or Off for users who should not rely on position and colour alone.',
          origin: 'custom',
          uses: ['forms/StateTextSwitch.tsx'],
          Component: SwitchStateTextRight,
        },
        {
          id: 'SwitchStateTextLeft',
          title: 'State text before',
          note: 'The same, for switches aligned to the right edge of a row.',
          origin: 'custom',
          uses: ['forms/StateTextSwitch.tsx'],
          Component: SwitchStateTextLeft,
        },
        {
          id: 'SwitchCustomStateText',
          title: 'Custom state text',
          note: 'When on and off have names in the domain, such as Running and Paused.',
          origin: 'custom',
          uses: ['forms/StateTextSwitch.tsx'],
          Component: SwitchCustomStateText,
        },
        {
          id: 'SwitchLabelAndStateText',
          title: 'Label and state text',
          note: 'A named setting whose off state deserves its own word.',
          origin: 'custom',
          uses: ['forms/StateTextSwitch.tsx'],
          Component: SwitchLabelAndStateText,
        },
      ],
    },
    {
      id: 'labelling',
      title: 'Label placement',
      description: 'Where the label sits when the built-in one does not fit the layout.',
      specimens: [
        {
          id: 'SwitchExternalLabel',
          title: 'Label after the switch',
          note: 'Lists that mix switches with checkboxes, so the controls share a left edge.',
          origin: 'aura',
          Component: SwitchExternalLabel,
        },
        {
          id: 'SwitchSpaceBetween',
          title: 'Label and switch apart',
          note: 'Narrow panels: labels align left, switches align right.',
          origin: 'aura',
          Component: SwitchSpaceBetween,
        },
        {
          id: 'SwitchLabelAbove',
          title: 'Label above with helper text',
          note: 'A switch stacked in a form column with other labelled fields.',
          origin: 'aura',
          Component: SwitchLabelAbove,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'On, off, unavailable, saving and failed.',
      specimens: [
        {
          id: 'SwitchOnOff',
          title: 'Off and on',
          note: 'The two resting states side by side, for reference.',
          origin: 'aura',
          Component: SwitchOnOff,
        },
        {
          id: 'SwitchControlled',
          title: 'Controlled',
          note: 'When the view reacts at once; toggle it to see the status follow.',
          origin: 'aura',
          Component: SwitchControlled,
        },
        {
          id: 'SwitchDisabledWithReason',
          title: 'Disabled with reason',
          note: 'A setting the user may not change, with the reason next to it.',
          origin: 'aura',
          Component: SwitchDisabledWithReason,
        },
        {
          id: 'SwitchLockedOn',
          title: 'Locked on',
          note: 'A setting enforced by policy: shown as on so nobody wonders whether it is.',
          origin: 'aura',
          Component: SwitchLockedOn,
        },
        {
          id: 'SwitchSaving',
          title: 'Saving',
          note: 'A change that takes a moment to reach the server; blocked until it settles. Toggle to try.',
          origin: 'custom',
          Component: SwitchSaving,
        },
        {
          id: 'SwitchSaveFailed',
          title: 'Change failed',
          note: 'The switch returns to its real state and the message says what to fix.',
          origin: 'custom',
          Component: SwitchSaveFailed,
        },
      ],
    },
    {
      id: 'settings',
      title: 'Settings rows',
      description: 'A reusable row with label, description and switch, and lists built from it.',
      specimens: [
        {
          id: 'SwitchSettingRow',
          title: 'Settings row',
          note: 'The standard line in a settings page: what it does on the left, the switch on the right.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/SettingSwitchRow.tsx'],
          Component: SwitchSettingRow,
        },
        {
          id: 'SwitchSettingRowDisabled',
          title: 'Settings row with a reason',
          note: 'A managed setting: the reason takes the place of the description.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/SettingSwitchRow.tsx'],
          Component: SwitchSettingRowDisabled,
        },
        {
          id: 'SwitchSettingsList',
          title: 'Settings list',
          note: 'Several independent settings under one heading, separated by space only.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/SettingSwitchRow.tsx'],
          Component: SwitchSettingsList,
        },
        {
          id: 'SwitchMasterWithChildren',
          title: 'Master switch',
          note: 'One switch pauses a group; the children keep their values and say why they are locked.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/SettingSwitchRow.tsx'],
          Component: SwitchMasterWithChildren,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Switches in toolbars, lists, cards and progressive forms.',
      specimens: [
        {
          id: 'SwitchRevealsOptions',
          title: 'Switch that reveals options',
          note: 'Follow-up fields appear only while the feature they belong to is on.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/SettingSwitchRow.tsx'],
          Component: SwitchRevealsOptions,
        },
        {
          id: 'SwitchListRows',
          title: 'One switch per row',
          note: 'Enable or pause items in a list; each switch is named after its row.',
          origin: 'custom',
          uses: ['forms/StateTextSwitch.tsx'],
          size: 'md',
          Component: SwitchListRows,
        },
        {
          id: 'SwitchInToolbar',
          title: 'In a toolbar',
          note: 'A view-level mode such as live updates, set apart from the action buttons.',
          origin: 'custom',
          uses: ['forms/StateTextSwitch.tsx'],
          size: 'md',
          Component: SwitchInToolbar,
        },
        {
          id: 'SwitchCardHeader',
          title: 'Card header switch',
          note: 'A feature card that can be turned off as a whole; the body explains the current state.',
          origin: 'custom',
          size: 'md',
          Component: SwitchCardHeader,
        },
      ],
    },
  ],
});
