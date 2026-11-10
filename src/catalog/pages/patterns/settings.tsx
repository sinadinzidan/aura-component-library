import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeaderCenter,
  CardTitle,
} from '@cognite/aura/components/card';
import {
  CheckboxGroup,
  CheckboxItem,
  CheckboxItemControl,
  CheckboxItemLabel,
} from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemDescription,
  RadioGroupItemLabel,
} from '@cognite/aura/components/radio-group';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { Separator } from '@cognite/aura/components/separator';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import { IconCheck, IconLock } from '@cognite/aura/icons';
import { useEffect, useRef, useState } from 'react';

import { AsyncButton } from '../../../library/actions/AsyncButton';
import { CopyButton } from '../../../library/actions/CopyButton';
import { SelectionCheckbox } from '../../../library/data/SelectionCheckbox';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { LabelledProgress } from '../../../library/feedback/LabelledProgress';
import { ChoiceCardGroup } from '../../../library/forms/ChoiceCardGroup';
import { FormField } from '../../../library/forms/FormField';
import { PasswordInput } from '../../../library/forms/PasswordInput';
import { SettingSwitchRow } from '../../../library/forms/SettingSwitchRow';
import { SliderField } from '../../../library/forms/SliderField';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { ConfirmDialog } from '../../../library/overlays/ConfirmDialog';
import { InfoTooltip } from '../../../library/overlays/InfoTooltip';
import { FormActions } from '../../../library/patterns/data-entry/FormActions';
import { FormSection } from '../../../library/patterns/data-entry/FormSection';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { SaveBar } from '../../../library/patterns/data-entry/SaveBar';
import { SaveStatus } from '../../../library/patterns/data-entry/SaveStatus';
import type { SaveState } from '../../../library/patterns/data-entry/SaveStatus';
import { SettingRow } from '../../../library/patterns/data-entry/SettingRow';
import { PEOPLE, SITES } from '../../data/plant';
import { definePage } from '../../types';

import source from './settings.tsx?raw';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'nb', label: 'Norsk bokmål' },
  { value: 'de', label: 'Deutsch' },
];

const TIME_ZONE_OPTIONS = [
  { value: 'utc', label: 'UTC' },
  { value: 'oslo', label: 'Europe/Oslo' },
  { value: 'london', label: 'Europe/London' },
];

const SITE_OPTIONS = SITES.map((site) => ({ value: site.id, label: site.name }));

const PRESSURE_UNITS = [
  { value: 'barg', label: 'barg' },
  { value: 'psi', label: 'psi' },
  { value: 'kPa', label: 'kPa' },
];

const TEMPERATURE_UNITS = [
  { value: 'C', label: '°C' },
  { value: 'F', label: '°F' },
  { value: 'K', label: 'K' },
];

const DATE_FORMATS = [
  { value: 'dmy', label: '12 Mar 2026' },
  { value: 'iso', label: '2026-03-12' },
  { value: 'mdy', label: 'Mar 12, 2026' },
];

const READINGS: Record<string, string> = {
  barg: '48.6 barg',
  psi: '704.9 psi',
  kPa: '4,860 kPa',
  C: '141.2 °C',
  F: '286.2 °F',
  K: '414.4 K',
};

const NOTIFICATION_EVENTS = [
  { id: 'trip', label: 'Asset tripped' },
  { id: 'alarm', label: 'Critical alarm raised' },
  { id: 'assigned', label: 'Work order assigned to me' },
  { id: 'failed', label: 'Pipeline run failed' },
];

const NOTIFICATION_CHANNELS = [
  { id: 'app', label: 'In app' },
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
];

const CURRENT_USER = PEOPLE[0];

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function toggleIn(list: readonly string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function SettingsSwitchRows() {
  const [values, setValues] = useState({ sound: true, flash: false, autoAck: false });
  return (
    <div className="flex w-full max-w-md flex-col divide-y divide-default">
      <SettingSwitchRow
        label="Play a sound for new alarms"
        description="Critical and high alarms only."
        checked={values.sound}
        onCheckedChange={(sound) => setValues({ ...values, sound })}
      />
      <SettingSwitchRow
        label="Flash the alarm banner"
        description="Until the alarm is acknowledged."
        checked={values.flash}
        onCheckedChange={(flash) => setValues({ ...values, flash })}
      />
      <SettingSwitchRow
        label="Acknowledge cleared alarms automatically"
        checked={values.autoAck}
        onCheckedChange={(autoAck) => setValues({ ...values, autoAck })}
      />
    </div>
  );
}

function SettingsSelectRows() {
  return (
    <div className="flex w-full max-w-md flex-col divide-y divide-default">
      <SettingRow label="Language">
        {(control) => (
          <div className="w-44">
            <OptionSelect {...control} options={LANGUAGE_OPTIONS} defaultValue="en" width="compact" />
          </div>
        )}
      </SettingRow>
      <SettingRow label="Time zone" description="Used for every timestamp you see.">
        {(control) => (
          <div className="w-44">
            <OptionSelect {...control} options={TIME_ZONE_OPTIONS} defaultValue="oslo" width="compact" />
          </div>
        )}
      </SettingRow>
      <SettingRow label="Default site" description="Opens when you sign in.">
        {(control) => (
          <div className="w-44">
            <OptionSelect {...control} options={SITE_OPTIONS} defaultValue="nordkapp" width="compact" />
          </div>
        )}
      </SettingRow>
    </div>
  );
}

function SettingsRadioChoice() {
  return (
    <div className="flex w-full max-w-md flex-col">
      <span id="settings-radio-choice-label" className="pb-1 text-sm font-medium text-base-foreground">
        When an alarm clears
      </span>
      <p id="settings-radio-choice-hint" className="pb-2 text-xs text-muted-foreground">
        Applies to your own alarm list.
      </p>
      <RadioGroup
        defaultValue="keep"
        aria-labelledby="settings-radio-choice-label"
        aria-describedby="settings-radio-choice-hint"
      >
        <RadioGroupItem>
          <RadioGroupItemControl value="keep" />
          <RadioGroupItemLabel>Keep it until I acknowledge it</RadioGroupItemLabel>
          <RadioGroupItemDescription>Nothing leaves the list without you seeing it.</RadioGroupItemDescription>
        </RadioGroupItem>
        <RadioGroupItem>
          <RadioGroupItemControl value="hour" />
          <RadioGroupItemLabel>Remove it after one hour</RadioGroupItemLabel>
          <RadioGroupItemDescription>Cleared alarms stay visible for the rest of the hour.</RadioGroupItemDescription>
        </RadioGroupItem>
        <RadioGroupItem>
          <RadioGroupItemControl value="now" />
          <RadioGroupItemLabel>Remove it at once</RadioGroupItemLabel>
          <RadioGroupItemDescription>The list only shows what is wrong right now.</RadioGroupItemDescription>
        </RadioGroupItem>
      </RadioGroup>
    </div>
  );
}

function SettingsActionRows() {
  return (
    <div className="flex w-full max-w-md flex-col divide-y divide-default">
      <SettingRow label="Password" description="Last changed 3 months ago.">
        {() => (
          <Button variant="secondary" size="sm">
            Change password
          </Button>
        )}
      </SettingRow>
      <SettingRow label="Two-step verification" description="Authenticator app, added 4 Jan 2026.">
        {() => (
          <>
            <Badge variant="success">On</Badge>
            <Button variant="secondary" size="sm">
              Manage
            </Button>
          </>
        )}
      </SettingRow>
      <SettingRow label="Active sessions" description="3 devices are signed in.">
        {() => (
          <Button variant="secondary" size="sm">
            Sign out everywhere
          </Button>
        )}
      </SettingRow>
    </div>
  );
}

function SettingsDisabledWithReason() {
  return (
    <div className="flex w-full max-w-md flex-col divide-y divide-default">
      <SettingSwitchRow
        label="Require two-step verification"
        checked
        onCheckedChange={() => undefined}
        disabledReason="Set by your organization. Ask an admin to change it."
      />
      <SettingRow label="Session timeout" disabledReason="Fixed at 8 hours for control room accounts.">
        {(control) => (
          <div className="w-36">
            <OptionSelect {...control} options={[{ value: '8h', label: '8 hours' }]} defaultValue="8h" width="compact" />
          </div>
        )}
      </SettingRow>
      <SettingRow label="Data export" description="Download time series as CSV.">
        {() => (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <IconLock aria-hidden="true" className="size-4" /> Engineer role required
          </span>
        )}
      </SettingRow>
    </div>
  );
}

function SettingsWithHelper() {
  const [volume, setVolume] = useState([60]);
  const [refresh, setRefresh] = useState('10');
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <SliderField
        label="Alarm volume"
        value={volume}
        onValueChange={setVolume}
        unit="%"
        showScale
        helperText="Critical alarms always play at 100 %."
      />
      <Separator />
      <div className="flex flex-col">
        <div className="flex items-center gap-1 pb-1">
          <span id="settings-helper-refresh" className="text-sm font-medium text-muted-foreground">
            Refresh live values
          </span>
          <InfoTooltip label="About refresh interval">
            Refresh interval. Shorter intervals show changes sooner and use more data on mobile networks.
          </InfoTooltip>
        </div>
        <SegmentedControl
          value={refresh}
          onValueChange={(next) => {
            if (typeof next === 'string') setRefresh(next);
          }}
        >
          <SegmentedControlList aria-labelledby="settings-helper-refresh">
            <SegmentedControlButton value="1" tabContent="label-only">
              1 s
            </SegmentedControlButton>
            <SegmentedControlButton value="10" tabContent="label-only">
              10 s
            </SegmentedControlButton>
            <SegmentedControlButton value="60" tabContent="label-only">
              1 min
            </SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
      </div>
    </div>
  );
}

function SettingsGroupedCard() {
  const [values, setValues] = useState({ digest: true, mentions: true, product: false });
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Email</CardTitle>
          <CardDescription>Sent to {CURRENT_USER.name.toLowerCase().replace(' ', '.')}@nordkapp.test</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <div className="flex w-full flex-col divide-y divide-default">
          <SettingSwitchRow
            label="Shift handover digest"
            description="One email at 06:00 and 18:00."
            checked={values.digest}
            onCheckedChange={(digest) => setValues({ ...values, digest })}
          />
          <SettingSwitchRow
            label="Mentions and assignments"
            checked={values.mentions}
            onCheckedChange={(mentions) => setValues({ ...values, mentions })}
          />
          <SettingSwitchRow
            label="Product updates"
            checked={values.product}
            onCheckedChange={(product) => setValues({ ...values, product })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsDangerZone() {
  const [open, setOpen] = useState(false);
  const [archived, setArchived] = useState(false);
  return (
    <section aria-labelledby="settings-danger-title" className="flex w-full max-w-md flex-col">
      <h3 id="settings-danger-title" className="pb-1 text-base font-semibold text-base-foreground">
        Danger zone
      </h3>
      <div className="flex flex-col divide-y divide-default">
        <SettingRow
          label="Archive data set"
          description={archived ? 'Archived. Pipelines can no longer write to it.' : 'Stops new writes. You can restore it later.'}
        >
          {() => (
            <Button variant="secondary" size="sm" onClick={() => setArchived((value) => !value)}>
              {archived ? 'Restore data set' : 'Archive data set'}
            </Button>
          )}
        </SettingRow>
        <SettingRow label="Delete data set" description="Removes 1,284 time series and their history for everyone.">
          {() => (
            <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
              Delete data set
            </Button>
          )}
        </SettingRow>
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Compressor telemetry?"
        description="1,284 time series and their history will be permanently removed. This can't be undone."
        confirmLabel="Delete data set"
        confirmText="Compressor telemetry"
        destructive
        onConfirm={() => wait(800)}
      />
    </section>
  );
}

function SettingsNotificationMatrix() {
  const [enabled, setEnabled] = useState(['trip:app', 'trip:email', 'trip:sms', 'alarm:app', 'alarm:email', 'assigned:app', 'failed:email']);
  return (
    <table className="w-full max-w-2xl border-collapse">
      <caption className="pb-2 text-left text-sm font-semibold text-base-foreground">Notify me when</caption>
      <thead>
        <tr>
          <th className="py-2 pr-3 text-left text-xs font-medium text-muted-foreground">Event</th>
          {NOTIFICATION_CHANNELS.map((channel) => (
            <th key={channel.id} className="w-20 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              {channel.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {NOTIFICATION_EVENTS.map((event) => (
          <tr key={event.id} className="border-t border-default">
            <th scope="row" className="py-2.5 pr-3 text-left text-sm font-normal text-base-foreground">
              {event.label}
            </th>
            {NOTIFICATION_CHANNELS.map((channel) => {
              const key = `${event.id}:${channel.id}`;
              const locked = event.id === 'trip' && channel.id === 'app';
              return (
                <td key={channel.id} className="px-3 py-2.5">
                  <SelectionCheckbox
                    label={`${event.label}, ${channel.label}${locked ? ', always on' : ''}`}
                    checked={enabled.includes(key)}
                    disabled={locked}
                    onChange={() => setEnabled(toggleIn(enabled, key))}
                  />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={4} className="pt-2 text-xs text-muted-foreground">
            Trips always notify you in the app.
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

function SettingsQuietHours() {
  const [quiet, setQuiet] = useState(true);
  const hours = ['18:00', '20:00', '22:00', '06:00', '07:00'].map((hour) => ({ value: hour, label: hour }));
  return (
    <div className="flex w-full max-w-xs flex-col">
      <SettingSwitchRow
        label="Quiet hours"
        description="Hold email and SMS. Trips still get through."
        checked={quiet}
        onCheckedChange={setQuiet}
      />
      {quiet ? (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="From">
            {(control) => <OptionSelect {...control} options={hours} defaultValue="22:00" width="compact" />}
          </FormField>
          <FormField label="To">
            {(control) => <OptionSelect {...control} options={hours} defaultValue="06:00" width="compact" />}
          </FormField>
        </div>
      ) : null}
    </div>
  );
}

function SettingsAppearance() {
  const [theme, setTheme] = useState('system');
  const [density, setDensity] = useState('comfortable');
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <ChoiceCardGroup
        label="Theme"
        layout="grid"
        value={theme}
        onValueChange={setTheme}
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'system', label: 'System' },
        ]}
        helperText="System follows your device, and switches with it at night."
      />
      <SettingRow label="Density" description="Compact fits more rows on control room wall screens.">
        {() => (
          <SegmentedControl
            value={density}
            onValueChange={(next) => {
              if (typeof next === 'string') setDensity(next);
            }}
          >
            <SegmentedControlList aria-label="Density" size="small">
              <SegmentedControlButton value="comfortable" tabContent="label-only" size="small">
                Comfortable
              </SegmentedControlButton>
              <SegmentedControlButton value="compact" tabContent="label-only" size="small">
                Compact
              </SegmentedControlButton>
            </SegmentedControlList>
          </SegmentedControl>
        )}
      </SettingRow>
    </div>
  );
}

function SettingsUnitsAndLocale() {
  const [pressure, setPressure] = useState('barg');
  const [temperature, setTemperature] = useState('C');
  const [dateFormat, setDateFormat] = useState('dmy');
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <div className="flex flex-col divide-y divide-default">
        <SettingRow label="Pressure">
          {(control) => (
            <div className="w-36">
              <OptionSelect {...control} options={PRESSURE_UNITS} value={pressure} onValueChange={setPressure} width="compact" />
            </div>
          )}
        </SettingRow>
        <SettingRow label="Temperature">
          {(control) => (
            <div className="w-36">
              <OptionSelect
                {...control}
                options={TEMPERATURE_UNITS}
                value={temperature}
                onValueChange={setTemperature}
                width="compact"
              />
            </div>
          )}
        </SettingRow>
        <SettingRow label="Date format">
          {(control) => (
            <div className="w-36">
              <OptionSelect
                {...control}
                options={DATE_FORMATS}
                value={dateFormat}
                onValueChange={setDateFormat}
                width="compact"
              />
            </div>
          )}
        </SettingRow>
      </div>
      <p aria-live="polite" className="rounded-lg bg-muted-background px-3 py-2 text-sm tabular-nums text-muted-foreground">
        Preview: <span className="text-base-foreground">{READINGS[pressure]}</span> ·{' '}
        <span className="text-base-foreground">{READINGS[temperature]}</span> ·{' '}
        <span className="text-base-foreground">{DATE_FORMATS.find((format) => format.value === dateFormat)?.label}</span>
      </p>
    </div>
  );
}

function SettingsProfile() {
  return (
    <form className="w-full max-w-md space-y-6" onSubmit={(event) => event.preventDefault()}>
      <div className="flex items-center gap-4">
        <PersonAvatar name={CURRENT_USER.name} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-base-foreground">{CURRENT_USER.name}</span>
          <span className="truncate text-xs text-muted-foreground">{CURRENT_USER.role} · Nordkapp</span>
        </div>
        <Button type="button" variant="secondary" size="sm" className="ml-auto">
          Change photo
        </Button>
      </div>
      <div className="space-y-4">
        <FormField label="Display name" required>
          {(control) => <Input {...control} autoComplete="name" defaultValue={CURRENT_USER.name} />}
        </FormField>
        <FormField label="Email address" helper="Managed by your organization's sign-in.">
          {(control) => <Input {...control} readOnly defaultValue="ingrid.haugen@nordkapp.test" />}
        </FormField>
        <FormField label="Phone number" optional helper="Used for SMS when an asset trips.">
          {(control) => <Input {...control} type="tel" autoComplete="tel" defaultValue="+47 412 34 567" />}
        </FormField>
      </div>
      <FormActions>
        <Button type="submit">Save profile</Button>
      </FormActions>
    </form>
  );
}

function SettingsShiftPreferences() {
  const [channels, setChannels] = useState(['handover', 'alarms']);
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <SettingRow label="Shift" description="Decides which handover notes you get.">
        {(control) => (
          <div className="w-40">
            <OptionSelect
              {...control}
              options={[
                { value: 'day', label: 'Day, 06–18' },
                { value: 'night', label: 'Night, 18–06' },
              ]}
              defaultValue="day"
              width="compact"
            />
          </div>
        )}
      </SettingRow>
      <div className="flex flex-col">
        <span id="settings-shift-start" className="pb-2 text-sm font-medium text-base-foreground">
          Show at the start of my shift
        </span>
        <CheckboxGroup aria-labelledby="settings-shift-start">
          {[
            { id: 'handover', label: 'Handover notes from the last shift' },
            { id: 'alarms', label: 'Alarms raised while I was away' },
            { id: 'orders', label: 'Work orders due today' },
          ].map((item) => (
            <CheckboxItem key={item.id}>
              <CheckboxItemControl
                checked={channels.includes(item.id)}
                onCheckedChange={() => setChannels(toggleIn(channels, item.id))}
              />
              <CheckboxItemLabel>{item.label}</CheckboxItemLabel>
            </CheckboxItem>
          ))}
        </CheckboxGroup>
      </div>
    </div>
  );
}

type Integration = { id: string; name: string; detail: string; state: 'connected' | 'attention' | 'off' };

function SettingsIntegrations() {
  const [items, setItems] = useState<Integration[]>([
    { id: 'sap', name: 'SAP Plant Maintenance', detail: 'Work orders, synced 2 min ago', state: 'connected' },
    { id: 'pi', name: 'PI historian', detail: 'Sign-in expired on 10 Mar', state: 'attention' },
    { id: 'teams', name: 'Microsoft Teams', detail: 'Post alarms to a channel', state: 'off' },
  ]);
  const setState = (id: string, state: Integration['state'], detail: string) =>
    setItems((current) => current.map((item) => (item.id === id ? { ...item, state, detail } : item)));

  return (
    <ul className="flex w-full max-w-2xl list-none flex-col divide-y divide-default">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-4 py-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm font-medium text-base-foreground">{item.name}</span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              {item.state === 'connected' ? <StatusDot tone="success" size="sm" /> : null}
              {item.state === 'attention' ? <StatusDot tone="warning" shape="diamond" size="sm" /> : null}
              {item.state === 'off' ? <StatusDot tone="neutral" shape="ring" size="sm" /> : null}
              <span>
                {item.state === 'connected' ? 'Connected · ' : item.state === 'attention' ? 'Needs attention · ' : 'Not connected · '}
                {item.detail}
              </span>
            </span>
          </div>
          {item.state === 'connected' ? (
            <Button variant="ghost" size="sm" onClick={() => setState(item.id, 'off', 'Disconnected just now')}>
              Disconnect
            </Button>
          ) : null}
          {item.state === 'attention' ? (
            <AsyncButton
              variant="secondary"
              size="sm"
              pendingLabel="Reconnecting…"
              onAction={() => wait(1000).then(() => setState(item.id, 'connected', 'Time series, synced just now'))}
            >
              Reconnect
            </AsyncButton>
          ) : null}
          {item.state === 'off' ? (
            <AsyncButton
              variant="secondary"
              size="sm"
              pendingLabel="Connecting…"
              onAction={() => wait(1000).then(() => setState(item.id, 'connected', 'Connected just now'))}
            >
              Connect
            </AsyncButton>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function SettingsApiKey() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-base-foreground">Project API key</span>
        <span className="text-xs text-muted-foreground">Created 4 Jan 2026 · last used 2 min ago</span>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-lg bg-medium-background py-1 pl-3 pr-1">
        <code className="truncate font-mono text-sm text-base-foreground">nk_live_••••••••7f3a</code>
        <CopyButton variant="ghost" size="icon-sm" text="nk_live_91c2e07d4b5a7f3a" label="Copy API key" iconOnly />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm">
          Rotate key
        </Button>
        <Button variant="ghost" size="sm">
          View usage
        </Button>
      </div>
    </div>
  );
}

function SettingsWebhook() {
  const [events, setEvents] = useState(['alarm.raised', 'alarm.cleared']);
  const [delivered, setDelivered] = useState(false);
  return (
    <form className="w-full max-w-md space-y-6" onSubmit={(event) => event.preventDefault()}>
      <div className="space-y-4">
        <FormField label="Endpoint URL" required>
          {(control) => <Input {...control} type="url" defaultValue="https://hooks.nordkapp.test/alarms" />}
        </FormField>
        <FormField label="Signing secret" helper="Sent in the X-Signature header so you can verify each call.">
          {(control) => (
            <PasswordInput
              {...control}
              autoComplete="off"
              defaultValue="whsec_3f9a71c2d4"
              showLabel="Show signing secret"
              hideLabel="Hide signing secret"
            />
          )}
        </FormField>
        <div className="flex flex-col">
          <span id="settings-webhook-events" className="pb-2 text-sm font-medium text-muted-foreground">
            Send these events
          </span>
          <CheckboxGroup aria-labelledby="settings-webhook-events">
            {[
              { id: 'alarm.raised', label: 'Alarm raised' },
              { id: 'alarm.cleared', label: 'Alarm cleared' },
              { id: 'workorder.created', label: 'Work order created' },
            ].map((item) => (
              <CheckboxItem key={item.id}>
                <CheckboxItemControl
                  checked={events.includes(item.id)}
                  onCheckedChange={() => setEvents(toggleIn(events, item.id))}
                />
                <CheckboxItemLabel>{item.label}</CheckboxItemLabel>
              </CheckboxItem>
            ))}
          </CheckboxGroup>
        </div>
      </div>
      <FormActions
        status={
          delivered ? (
            <span className="flex items-center gap-1.5">
              <IconCheck aria-hidden="true" className="size-4" /> Test delivered, 200 OK
            </span>
          ) : undefined
        }
      >
        <AsyncButton
          type="button"
          variant="secondary"
          pendingLabel="Sending…"
          onAction={() => wait(1000).then(() => setDelivered(true))}
        >
          Send test event
        </AsyncButton>
        <Button type="submit">Save webhook</Button>
      </FormActions>
    </form>
  );
}

function SettingsUsageLimits() {
  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-base-foreground">Operations plan</span>
          <span className="text-xs text-muted-foreground">Renews 1 Apr 2026</span>
        </div>
        <Button variant="secondary" size="sm">
          Change plan
        </Button>
      </div>
      <LabelledProgress label="Time series" value={8420} max={10000} valueText="8,420 of 10,000" size="sm" />
      <LabelledProgress
        label="Data points this month"
        value={96}
        max={100}
        valueText="4.8 of 5.0 billion"
        size="sm"
        hint="At the limit, new data points are held for 24 hours, then dropped."
      />
      <LabelledProgress label="Members" value={18} max={50} valueText="18 of 50" size="sm" />
    </div>
  );
}

function SettingsSaveOnChange() {
  const [values, setValues] = useState({ sound: true, banner: true });
  const [state, setState] = useState<SaveState>('idle');
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    []
  );

  const change = (next: typeof values) => {
    setValues(next);
    setState('saving');
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('saved'), 700);
  };

  return (
    <div className="flex w-full max-w-md flex-col">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-base-foreground">Alarm alerts</h3>
        <SaveStatus state={state} idleText="Changes save automatically" />
      </div>
      <div className="flex flex-col divide-y divide-default">
        <SettingSwitchRow
          label="Play a sound"
          checked={values.sound}
          onCheckedChange={(sound) => change({ ...values, sound })}
        />
        <SettingSwitchRow
          label="Show a banner"
          checked={values.banner}
          onCheckedChange={(banner) => change({ ...values, banner })}
        />
      </div>
    </div>
  );
}

function SettingsExplicitSave() {
  const saved = { name: 'Nordkapp operations', zone: 'oslo' };
  const [name, setName] = useState('Nordkapp gas operations');
  const [zone, setZone] = useState('utc');
  const dirtyCount = Number(name !== saved.name) + Number(zone !== saved.zone);
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="space-y-4">
        <FormField label="Project name">
          {(control) => <Input {...control} value={name} onChange={(event) => setName(event.target.value)} />}
        </FormField>
        <FormField label="Project time zone" helper="Changes every schedule in the project.">
          {(control) => <OptionSelect {...control} options={TIME_ZONE_OPTIONS} value={zone} onValueChange={setZone} />}
        </FormField>
      </div>
      <SaveBar
        dirtyCount={dirtyCount}
        cleanText="All changes saved"
        onSave={() => undefined}
        onDiscard={() => {
          setName(saved.name);
          setZone(saved.zone);
        }}
      />
    </div>
  );
}

function SettingsLeftNav() {
  const [values, setValues] = useState({ sound: true, flash: false });
  return (
    <Tabs defaultValue="alarms" orientation="vertical" className="flex w-full gap-8">
      <TabsList orientation="vertical" aria-label="Settings sections" className="w-44 shrink-0">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="alarms">Alarms</TabsTrigger>
        <TabsTrigger value="units">Units and locale</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
      </TabsList>
      <TabsPanel value="general" className="min-w-0 max-w-xl flex-1">
        <h3 className="pb-1 text-lg font-semibold text-base-foreground">General</h3>
        <div className="flex flex-col divide-y divide-default">
          <SettingRow label="Language">
            {(control) => (
              <div className="w-44">
                <OptionSelect {...control} options={LANGUAGE_OPTIONS} defaultValue="en" width="compact" />
              </div>
            )}
          </SettingRow>
          <SettingRow label="Default site" description="Opens when you sign in.">
            {(control) => (
              <div className="w-44">
                <OptionSelect {...control} options={SITE_OPTIONS} defaultValue="nordkapp" width="compact" />
              </div>
            )}
          </SettingRow>
        </div>
      </TabsPanel>
      <TabsPanel value="alarms" className="min-w-0 max-w-xl flex-1">
        <h3 className="text-lg font-semibold text-base-foreground">Alarms</h3>
        <p className="pb-2 text-sm text-muted-foreground">How alarms get your attention in the control room.</p>
        <div className="flex flex-col divide-y divide-default">
          <SettingSwitchRow
            label="Play a sound for new alarms"
            description="Critical and high alarms only."
            checked={values.sound}
            onCheckedChange={(sound) => setValues({ ...values, sound })}
          />
          <SettingSwitchRow
            label="Flash the alarm banner"
            description="Until the alarm is acknowledged."
            checked={values.flash}
            onCheckedChange={(flash) => setValues({ ...values, flash })}
          />
          <SettingRow label="Shelving limit" description="The longest an operator can shelve an alarm.">
            {(control) => (
              <div className="w-36">
                <OptionSelect
                  {...control}
                  options={[
                    { value: '8h', label: '8 hours' },
                    { value: '24h', label: '24 hours' },
                  ]}
                  defaultValue="8h"
                  width="compact"
                />
              </div>
            )}
          </SettingRow>
        </div>
      </TabsPanel>
      <TabsPanel value="units" className="min-w-0 max-w-xl flex-1">
        <h3 className="pb-1 text-lg font-semibold text-base-foreground">Units and locale</h3>
        <div className="flex flex-col divide-y divide-default">
          <SettingRow label="Pressure">
            {(control) => (
              <div className="w-36">
                <OptionSelect {...control} options={PRESSURE_UNITS} defaultValue="barg" width="compact" />
              </div>
            )}
          </SettingRow>
          <SettingRow label="Temperature">
            {(control) => (
              <div className="w-36">
                <OptionSelect {...control} options={TEMPERATURE_UNITS} defaultValue="C" width="compact" />
              </div>
            )}
          </SettingRow>
        </div>
      </TabsPanel>
      <TabsPanel value="integrations" className="min-w-0 max-w-xl flex-1">
        <h3 className="pb-1 text-lg font-semibold text-base-foreground">Integrations</h3>
        <p className="text-sm text-muted-foreground">No integrations are connected to this project yet.</p>
      </TabsPanel>
    </Tabs>
  );
}

function SettingsSectionedPage() {
  const [values, setValues] = useState({ digest: true, sms: false });
  return (
    <div className="w-full max-w-4xl space-y-8">
      <FormSection layout="aside" title="Notifications" description="What reaches you outside the app.">
        <div className="flex flex-col divide-y divide-default">
          <SettingSwitchRow
            label="Shift handover digest"
            description="One email at 06:00 and 18:00."
            checked={values.digest}
            onCheckedChange={(digest) => setValues({ ...values, digest })}
          />
          <SettingSwitchRow
            label="SMS when an asset trips"
            description="Sent to +47 412 34 567."
            checked={values.sms}
            onCheckedChange={(sms) => setValues({ ...values, sms })}
          />
        </div>
      </FormSection>
      <Separator />
      <FormSection layout="aside" title="Units" description="How measurements are shown to you. Stored values do not change.">
        <div className="flex flex-col divide-y divide-default">
          <SettingRow label="Pressure">
            {(control) => (
              <div className="w-36">
                <OptionSelect {...control} options={PRESSURE_UNITS} defaultValue="barg" width="compact" />
              </div>
            )}
          </SettingRow>
          <SettingRow label="Temperature">
            {(control) => (
              <div className="w-36">
                <OptionSelect {...control} options={TEMPERATURE_UNITS} defaultValue="C" width="compact" />
              </div>
            )}
          </SettingRow>
        </div>
      </FormSection>
    </div>
  );
}

export default definePage({
  id: 'settings',
  title: 'Settings',
  summary:
    'Preference rows and the groups, pages and save models built from them. A settings row is a label, a sentence on what it does and one control; everything else on this page is a way of grouping rows and telling the user when a change took effect.',
  guidance: {
    use: [
      'A switch for anything that takes effect at once; a select or radio group when there are more than two states.',
      'One sentence of description per row, written as what happens, not how the control works.',
      'Save on change for independent switches; an explicit save bar when changes belong together.',
      'A reason on every disabled row, and a confirmation that names the object for anything destructive.',
    ],
    avoid: [
      'Mixing save-on-change and a Save button on the same page.',
      'A toast for every saved switch; use one quiet "Saved" indicator.',
      'Destructive actions among ordinary rows instead of in their own group at the end.',
      'Long forms inside a settings row; link to a page or open a dialog.',
    ],
  },
  source,
  sections: [
    {
      id: 'rows',
      title: 'Rows',
      description: 'One setting per line, with the control that fits its values.',
      specimens: [
        {
          id: 'SettingsSwitchRows',
          title: 'Switch rows',
          note: 'For on/off settings that take effect at once; the whole text block is the switch label.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/SettingSwitchRow.tsx'],
          Component: SettingsSwitchRows,
        },
        {
          id: 'SettingsSelectRows',
          title: 'Select in a row',
          note: 'When a setting has more than two values but still fits on one line next to its label.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/SettingRow.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: SettingsSelectRows,
        },
        {
          id: 'SettingsRadioChoice',
          title: 'Radio choice',
          note: 'When each option needs a sentence to be understood, so all of them should be visible at once.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: SettingsRadioChoice,
        },
        {
          id: 'SettingsActionRows',
          title: 'Rows with an action',
          note: 'For settings that open a flow instead of changing in place; the row shows the current state and one button.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/SettingRow.tsx'],
          Component: SettingsActionRows,
        },
        {
          id: 'SettingsDisabledWithReason',
          title: 'Disabled with a reason',
          note: 'When policy or role locks a setting: keep the row, show its value and say who can change it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/SettingSwitchRow.tsx', 'patterns/data-entry/SettingRow.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: SettingsDisabledWithReason,
        },
        {
          id: 'SettingsWithHelper',
          title: 'Description, helper and hint',
          note: 'For settings with a consequence worth spelling out: helper text for what always applies, a tooltip for background.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/SliderField.tsx', 'overlays/InfoTooltip.tsx'],
          Component: SettingsWithHelper,
        },
      ],
    },
    {
      id: 'groups',
      title: 'Groups',
      description: 'Rows that belong together, and the groups that need special care.',
      specimens: [
        {
          id: 'SettingsGroupedCard',
          title: 'Grouped settings card',
          note: 'To set one group of rows apart on a page of several, with a title that says what the group controls.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/SettingSwitchRow.tsx'],
          Component: SettingsGroupedCard,
        },
        {
          id: 'SettingsDangerZone',
          title: 'Danger zone',
          note: 'For irreversible actions: last on the page, each with its consequence, and a typed confirmation for the worst.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/SettingRow.tsx', 'overlays/ConfirmDialog.tsx'],
          Component: SettingsDangerZone,
        },
        {
          id: 'SettingsNotificationMatrix',
          title: 'Notification matrix',
          note: 'When the same choices repeat for every event: events down, channels across, and a locked cell where policy decides.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['data/SelectionCheckbox.tsx'],
          Component: SettingsNotificationMatrix,
        },
        {
          id: 'SettingsQuietHours',
          title: 'Switch with details',
          note: 'When turning a setting on needs a couple of values; they appear under the switch and disappear with it.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['forms/SettingSwitchRow.tsx', 'forms/FormField.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: SettingsQuietHours,
        },
      ],
    },
    {
      id: 'preferences',
      title: 'Personal preferences',
      description: 'Appearance, units, profile and shift.',
      specimens: [
        {
          id: 'SettingsAppearance',
          title: 'Theme and density',
          note: 'For appearance: choice cards for the theme, a segmented control for a two-state display option.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/ChoiceCardGroup.tsx', 'patterns/data-entry/SettingRow.tsx'],
          Component: SettingsAppearance,
        },
        {
          id: 'SettingsUnitsAndLocale',
          title: 'Units and locale',
          note: 'For display units and formats: a live preview shows the effect before anyone has to go and look.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/SettingRow.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: SettingsUnitsAndLocale,
        },
        {
          id: 'SettingsProfile',
          title: 'Profile',
          note: 'For identity fields that save together; fields owned by the identity provider are read-only and say so.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx', 'forms/FormField.tsx', 'patterns/data-entry/FormActions.tsx'],
          Component: SettingsProfile,
        },
        {
          id: 'SettingsShiftPreferences',
          title: 'Row plus checklist',
          note: 'When one setting picks a mode and a short checklist tunes it; keep both in the same group.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/SettingRow.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: SettingsShiftPreferences,
        },
      ],
    },
    {
      id: 'integrations',
      title: 'Integrations and limits',
      description: 'Connections to other systems, credentials and plan usage.',
      specimens: [
        {
          id: 'SettingsIntegrations',
          title: 'Integrations with status',
          note: 'For connections to other systems: state in words and shape, the last sync, and the one action that fits the state.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/StatusDot.tsx', 'actions/AsyncButton.tsx'],
          Component: SettingsIntegrations,
        },
        {
          id: 'SettingsApiKey',
          title: 'API key',
          note: 'For a secret that is shown masked: copy without revealing, rotate as the main action.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['actions/CopyButton.tsx'],
          Component: SettingsApiKey,
        },
        {
          id: 'SettingsWebhook',
          title: 'Webhook',
          note: 'For outgoing calls: where to send, how to verify, which events, and a test that reports the response.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'forms/FormField.tsx',
            'forms/PasswordInput.tsx',
            'actions/AsyncButton.tsx',
            'patterns/data-entry/FormActions.tsx',
          ],
          Component: SettingsWebhook,
        },
        {
          id: 'SettingsUsageLimits',
          title: 'Plan and usage',
          note: 'To show how close a project is to its limits, with what happens at the limit next to the bar that is nearly full.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/LabelledProgress.tsx'],
          Component: SettingsUsageLimits,
        },
      ],
    },
    {
      id: 'saving-and-layout',
      title: 'Saving and page layout',
      description: 'When changes take effect, and how groups become a page.',
      specimens: [
        {
          id: 'SettingsSaveOnChange',
          title: 'Save on change',
          note: 'For independent switches: each change saves itself and one quiet indicator confirms it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/SettingSwitchRow.tsx', 'patterns/data-entry/SaveStatus.tsx'],
          Component: SettingsSaveOnChange,
        },
        {
          id: 'SettingsExplicitSave',
          title: 'Explicit save bar',
          note: 'When changes must be applied together or are risky: the bar counts unsaved changes and offers Discard.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/SaveBar.tsx', 'forms/FormField.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: SettingsExplicitSave,
        },
        {
          id: 'SettingsLeftNav',
          title: 'Left navigation layout',
          note: 'Once settings need more than one screen: categories on the left, one category of rows on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'forms/SettingSwitchRow.tsx',
            'patterns/data-entry/SettingRow.tsx',
            'patterns/data-entry/OptionSelect.tsx',
          ],
          Component: SettingsLeftNav,
        },
        {
          id: 'SettingsSectionedPage',
          title: 'Single page with sections',
          note: 'For a handful of groups that fit on one page: headings in a left column, rows at form width on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/data-entry/FormSection.tsx',
            'forms/SettingSwitchRow.tsx',
            'patterns/data-entry/SettingRow.tsx',
            'patterns/data-entry/OptionSelect.tsx',
          ],
          Component: SettingsSectionedPage,
        },
      ],
    },
  ],
});
