import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@cognite/aura/components/accordion';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  CheckboxGroup,
  CheckboxItem,
  CheckboxItemControl,
  CheckboxItemLabel,
} from '@cognite/aura/components/checkbox';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Separator } from '@cognite/aura/components/separator';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Textarea } from '@cognite/aura/components/textarea';
import {
  IconBell,
  IconClipboardList,
  IconDatabase,
  IconGauge,
  IconLock,
  IconShieldCheck,
  IconTool,
  IconUsers,
} from '@cognite/aura/icons';
import { useEffect, useState } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { SettingSwitchRow } from '../../../library/forms/SettingSwitchRow';
import { ALARMS, WORK_ORDERS, findAsset, sensorsOf } from '../../data/plant';
import { definePage } from '../../types';

import source from './accordion.tsx?raw';

const ASSET = findAsset('23-ka-9101');

const ASSET_SENSORS = sensorsOf('23-ka-9101');

const ASSET_ALARMS = ALARMS.filter((alarm) => alarm.assetId === '23-ka-9101');

const ASSET_WORK_ORDERS = WORK_ORDERS.filter((order) => order.assetId === '23-ka-9101');

const SECTION_IDS = ['identity', 'limits', 'maintenance'];

const PRESTART_CHECKS = [
  {
    id: 'isolation',
    label: 'Isolations',
    done: 3,
    checks: ['Breaker 23-EL-9101 racked in', 'Suction valve open', 'Discharge valve open'],
  },
  {
    id: 'lube',
    label: 'Lube oil system',
    done: 2,
    checks: ['Reservoir level above 60%', 'Oil temperature above 35 °C', 'Standby pump in auto', 'Filter pressure drop normal'],
  },
  {
    id: 'seal',
    label: 'Seal gas system',
    done: 0,
    checks: ['Seal gas supply above 55 barg', 'Primary vent flow normal', 'Separation gas on'],
  },
];

function AccordionSingle() {
  return (
    <Accordion defaultValue="what" className="w-full max-w-md">
      <AccordionItem value="what">
        <AccordionTrigger>What the pipeline does</AccordionTrigger>
        <AccordionContent>Reads compressor tags from the OPC UA historian and writes them as time series.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="when">
        <AccordionTrigger>When it runs</AccordionTrigger>
        <AccordionContent>Every hour, five minutes past, with a full reload on Sundays at 02:00.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="who">
        <AccordionTrigger>Who owns it</AccordionTrigger>
        <AccordionContent>The rotating equipment team. Aisha Khan is the contact for schema changes.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionCollapsible() {
  return (
    <Accordion collapsible className="w-full max-w-md">
      <AccordionItem value="source">
        <AccordionTrigger>Source</AccordionTrigger>
        <AccordionContent>OPC UA historian at Nordkapp, server NK-HIST-01.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="destination">
        <AccordionTrigger>Destination</AccordionTrigger>
        <AccordionContent>Data set Nordkapp compressor telemetry, 1,284 time series.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="schedule">
        <AccordionTrigger>Schedule</AccordionTrigger>
        <AccordionContent>Hourly, with a retry after ten minutes when the source is unreachable.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionMultiple() {
  return (
    <Accordion type="multiple" defaultValue={['pressure', 'temperature']} className="w-full max-w-md">
      <AccordionItem value="pressure">
        <AccordionTrigger>Pressure</AccordionTrigger>
        <AccordionContent>Suction 12.4 barg, discharge 48.6 barg. Both inside operating limits.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="temperature">
        <AccordionTrigger>Temperature</AccordionTrigger>
        <AccordionContent>Discharge 141.2 °C against a high limit of 145 °C.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="vibration">
        <AccordionTrigger>Vibration</AccordionTrigger>
        <AccordionContent>Drive end 6.8 mm/s, approaching the 7.1 mm/s limit.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionAllClosed() {
  return (
    <Accordion type="multiple" className="w-full max-w-md">
      <AccordionItem value="retention">
        <AccordionTrigger>Data retention</AccordionTrigger>
        <AccordionContent>Raw values are kept for 10 years, aggregates indefinitely.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="access">
        <AccordionTrigger>Access control</AccordionTrigger>
        <AccordionContent>Readable by everyone at Nordkapp, writable by the pipeline service account.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="lineage">
        <AccordionTrigger>Lineage</AccordionTrigger>
        <AccordionContent>Produced by Compressor telemetry ingest, consumed by 6 charts and 2 models.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionWithIcons() {
  return (
    <Accordion type="multiple" defaultValue={['alarms']} className="w-full max-w-md">
      <AccordionItem value="alarms">
        <AccordionTrigger icon={IconBell}>Alarm notifications</AccordionTrigger>
        <AccordionContent>Critical and high alarms page the on-call operator. Lower severities wait for the shift log.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="access">
        <AccordionTrigger icon={IconLock}>Access and roles</AccordionTrigger>
        <AccordionContent>Operators acknowledge and shelve. Only supervisors change limits.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="data">
        <AccordionTrigger icon={IconDatabase}>Data sources</AccordionTrigger>
        <AccordionContent>Alarms come from the control system event journal, refreshed every 10 seconds.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionWithCounts() {
  return (
    <Accordion type="multiple" className="w-full max-w-md">
      <AccordionItem value="sensors">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            Time series <Badge variant="secondary">{ASSET_SENSORS.length}</Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-1">
            {ASSET_SENSORS.map((sensor) => (
              <li key={sensor.id}>
                <span className="font-mono">{sensor.tag}</span> · {sensor.name}
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="alarms">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            Alarms <Badge variant="secondary">{ASSET_ALARMS.length}</Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-1">
            {ASSET_ALARMS.map((alarm) => (
              <li key={alarm.id}>{alarm.message}</li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="orders">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            Work orders <Badge variant="secondary">{ASSET_WORK_ORDERS.length}</Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-1">
            {ASSET_WORK_ORDERS.map((order) => (
              <li key={order.id}>
                <span className="font-mono">{order.id}</span> · {order.title}
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionWithStatus() {
  return (
    <Accordion collapsible defaultValue="recompressor" className="w-full max-w-md">
      <AccordionItem value="first">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            1st stage compressor <StatusBadge status="running" />
          </span>
        </AccordionTrigger>
        <AccordionContent>Running at 9,840 rpm. Drive-end vibration is being watched.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="second">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            2nd stage compressor <StatusBadge status="running" />
          </span>
        </AccordionTrigger>
        <AccordionContent>Running within all limits.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="recompressor">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            Recompressor <StatusBadge status="tripped" />
          </span>
        </AccordionTrigger>
        <AccordionContent>Tripped on high vibration 14 minutes ago. WO-104482 is in progress.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionWithDescription() {
  return (
    <Accordion collapsible className="w-full max-w-md">
      <AccordionItem value="hourly">
        <AccordionTrigger>
          <span className="flex flex-col gap-0.5">
            Hourly extraction
            <span className="text-sm text-muted-foreground">Last run 14 minutes ago</span>
          </span>
        </AccordionTrigger>
        <AccordionContent>Wrote 182,400 rows in 2 min 41 s. No rows were rejected.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="weekly">
        <AccordionTrigger>
          <span className="flex flex-col gap-0.5">
            Weekly full reload
            <span className="text-sm text-muted-foreground">Next run Sunday at 02:00</span>
          </span>
        </AccordionTrigger>
        <AccordionContent>Rebuilds every time series from the historian archive. Takes about 40 minutes.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionRichContent() {
  return (
    <Accordion collapsible defaultValue="isolate" className="w-full max-w-md">
      <AccordionItem value="isolate">
        <AccordionTrigger>Isolating the compressor</AccordionTrigger>
        <AccordionContent>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Stop the compressor from the control room and wait for zero speed.</li>
            <li>Lock out breaker 23-EL-9101 and attach your personal lock.</li>
            <li>Close and tag the suction and discharge valves.</li>
            <li>Depressurise the casing to flare and confirm 0 barg.</li>
          </ol>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="reinstate">
        <AccordionTrigger>Reinstating after work</AccordionTrigger>
        <AccordionContent>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Remove tools and refit guards.</li>
            <li>Have the area authority inspect the site.</li>
            <li>Remove locks in the reverse order they were applied.</li>
          </ol>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionLongTitles() {
  return (
    <Accordion collapsible className="w-full max-w-sm">
      <AccordionItem value="first">
        <AccordionTrigger>
          What happens to alarms that are raised while an asset is isolated for maintenance?
        </AccordionTrigger>
        <AccordionContent>They are recorded but suppressed from the alarm list until the isolation is lifted.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="second">
        <AccordionTrigger>Can a shelved alarm come back before its shelving time runs out?</AccordionTrigger>
        <AccordionContent>Yes, if its severity rises or a supervisor unshelves it.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionDisabledItem() {
  return (
    <Accordion collapsible defaultValue="general" className="w-full max-w-md">
      <AccordionItem value="general">
        <AccordionTrigger>General</AccordionTrigger>
        <AccordionContent>Name, description and owner of the pipeline.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="schedule">
        <AccordionTrigger>Schedule</AccordionTrigger>
        <AccordionContent>How often the pipeline runs.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="credentials" disabled>
        <AccordionTrigger>
          <span className="flex flex-col gap-0.5">
            Credentials
            <span className="text-sm">Only pipeline owners can view credentials.</span>
          </span>
        </AccordionTrigger>
        <AccordionContent>Service account and secret rotation.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionDisabledAll() {
  return (
    <div className="w-full max-w-md">
      <Accordion type="multiple" disabled defaultValue={['limits']}>
        <AccordionItem value="limits">
          <AccordionTrigger>Operating limits</AccordionTrigger>
          <AccordionContent>High 52.0 barg, low 40.0 barg.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="trip">
          <AccordionTrigger>Trip settings</AccordionTrigger>
          <AccordionContent>High-high 55.0 barg with a two-second delay.</AccordionContent>
        </AccordionItem>
      </Accordion>
      <p className="px-3 pt-2 text-sm text-muted-foreground">Sections are locked while the asset is in maintenance.</p>
    </div>
  );
}

function AccordionControlled() {
  const [open, setOpen] = useState<string[]>(['identity']);
  const allOpen = open.length === SECTION_IDS.length;

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-end pb-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(allOpen ? [] : SECTION_IDS)}>
          {allOpen ? 'Collapse all' : 'Expand all'}
        </Button>
      </div>
      <Accordion type="multiple" value={open} onValueChange={setOpen}>
        <AccordionItem value="identity">
          <AccordionTrigger>Identity</AccordionTrigger>
          <AccordionContent>
            {ASSET?.tag}, {ASSET?.name}. Criticality {ASSET?.criticality}.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="limits">
          <AccordionTrigger>Limits</AccordionTrigger>
          <AccordionContent>Six time series with operating limits, three with trip limits.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="maintenance">
          <AccordionTrigger>Maintenance</AccordionTrigger>
          <AccordionContent>One open inspection, due in two days.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function AccordionInvalidSection() {
  return (
    <Accordion type="multiple" defaultValue={['schedule']} className="w-full max-w-md">
      <AccordionItem value="source">
        <AccordionTrigger>Source</AccordionTrigger>
        <AccordionContent>OPC UA historian, server NK-HIST-01.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="schedule">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            Schedule <Badge variant="error">1 error</Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <Label htmlFor="accordion-invalid-cron" required>
            Cron expression
          </Label>
          <Input id="accordion-invalid-cron" defaultValue="5 * * *" aria-invalid aria-describedby="accordion-invalid-help" />
          <HelperText id="accordion-invalid-help" isError>
            Enter five fields: minute, hour, day, month and weekday.
          </HelperText>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionLazyContent() {
  const [open, setOpen] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (open !== 'history' || loaded) return;
    const handle = window.setTimeout(() => setLoaded(true), 1400);
    return () => window.clearTimeout(handle);
  }, [open, loaded]);

  return (
    <Accordion collapsible value={open} onValueChange={setOpen} className="w-full max-w-md">
      <AccordionItem value="summary">
        <AccordionTrigger>Summary</AccordionTrigger>
        <AccordionContent>Three runs today, all succeeded.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="history">
        <AccordionTrigger>Run history</AccordionTrigger>
        <AccordionContent>
          {loaded ? (
            <MetadataList
              items={[
                { label: '13:05', value: '182,400 rows' },
                { label: '12:05', value: '181,960 rows' },
                { label: '11:05', value: '182,112 rows' },
              ]}
            />
          ) : (
            <div className="flex flex-col gap-2" role="status" aria-label="Loading run history">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionInCard() {
  return (
    <div className="w-full max-w-md rounded-xl bg-muted-background p-4">
      <p className="px-3 text-sm font-semibold text-base-foreground">{ASSET?.name}</p>
      <p className="px-3 pb-3 font-mono text-xs text-muted-foreground">{ASSET?.tag}</p>
      <Accordion type="multiple" defaultValue={['readings']}>
        <AccordionItem value="readings">
          <AccordionTrigger>Latest readings</AccordionTrigger>
          <AccordionContent>
            <MetadataList
              items={ASSET_SENSORS.slice(0, 3).map((sensor) => ({
                label: sensor.name,
                value: `${sensor.value.toFixed(sensor.decimals)} ${sensor.unit}`,
              }))}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="orders">
          <AccordionTrigger>Open work orders</AccordionTrigger>
          <AccordionContent>{ASSET_WORK_ORDERS[0]?.title}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function AccordionFaq() {
  return (
    <div className="w-full max-w-lg">
      <h3 className="px-3 pb-2 text-xl font-semibold text-base-foreground">Alarm handling</h3>
      <Accordion collapsible>
        <AccordionItem value="ack">
          <AccordionTrigger>What does acknowledging an alarm do?</AccordionTrigger>
          <AccordionContent>
            It records that an operator has seen the alarm and stops the audible signal. The alarm stays in the list
            until the condition clears.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="shelve">
          <AccordionTrigger>When should I shelve an alarm?</AccordionTrigger>
          <AccordionContent>
            When a known fault keeps raising it and a work order exists. Shelving hides it for up to one shift and is
            logged with your name.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="limits">
          <AccordionTrigger>Who can change an alarm limit?</AccordionTrigger>
          <AccordionContent>
            Shift supervisors, after a management of change review. Operators can propose a change from the alarm
            details.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="export">
          <AccordionTrigger>Can I export the alarm history?</AccordionTrigger>
          <AccordionContent>Yes. Filter the alarm list, then choose Export as CSV from the toolbar.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function AccordionSettingsGroups() {
  const [settings, setSettings] = useState({ page: true, digest: false, sound: true, mfa: true });

  return (
    <Accordion type="multiple" defaultValue={['notifications']} className="w-full max-w-md">
      <AccordionItem value="notifications">
        <AccordionTrigger icon={IconBell}>Notifications</AccordionTrigger>
        <AccordionContent>
          <SettingSwitchRow
            label="Page me for critical alarms"
            description="Sends a push notification while you are on call."
            checked={settings.page}
            onCheckedChange={(page) => setSettings({ ...settings, page })}
          />
          <SettingSwitchRow
            label="Daily digest"
            description="A summary of the last 24 hours at 07:00."
            checked={settings.digest}
            onCheckedChange={(digest) => setSettings({ ...settings, digest })}
          />
          <SettingSwitchRow
            label="Alarm sound"
            description="Plays in the browser when a new alarm is raised."
            checked={settings.sound}
            onCheckedChange={(sound) => setSettings({ ...settings, sound })}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="security">
        <AccordionTrigger icon={IconShieldCheck}>Security</AccordionTrigger>
        <AccordionContent>
          <SettingSwitchRow
            label="Two-step verification"
            checked={settings.mfa}
            onCheckedChange={(mfa) => setSettings({ ...settings, mfa })}
            disabledReason="Required by your organisation."
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="team">
        <AccordionTrigger icon={IconUsers}>Team</AccordionTrigger>
        <AccordionContent>You are a member of Nordkapp operations and Rotating equipment.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionFormSections() {
  return (
    <form className="w-full max-w-md" onSubmit={(event) => event.preventDefault()}>
      <Accordion type="multiple" defaultValue={['job']}>
        <AccordionItem value="job">
          <AccordionTrigger icon={IconClipboardList}>Job</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="accordion-form-title" required>
                  Title
                </Label>
                <Input id="accordion-form-title" defaultValue="Vibration survey, 1st stage compressor" />
              </div>
              <div>
                <Label htmlFor="accordion-form-scope">Scope</Label>
                <Textarea id="accordion-form-scope" defaultValue="Measure drive-end and non-drive-end bearings." />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="planning">
          <AccordionTrigger icon={IconTool}>Planning</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accordion-form-hours">Estimate (h)</Label>
                <Input id="accordion-form-hours" type="number" defaultValue={4} />
              </div>
              <div>
                <Label htmlFor="accordion-form-crew">Crew size</Label>
                <Input id="accordion-form-crew" type="number" defaultValue={2} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <div className="flex justify-end gap-2 px-3 pt-4">
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Create work order</Button>
      </div>
    </form>
  );
}

function AccordionFilterPanel() {
  const [states, setStates] = useState<readonly string[]>(['tripped']);

  const toggle = (id: string, checked: boolean) => {
    setStates(checked ? [...states, id] : states.filter((item) => item !== id));
  };

  return (
    <div className="w-full max-w-xs">
      <Accordion type="multiple" defaultValue={['state']}>
        <AccordionItem value="state">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              Run state {states.length > 0 ? <Badge variant="secondary">{states.length}</Badge> : null}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <CheckboxGroup aria-label="Run state">
              <CheckboxItem>
                <CheckboxItemControl
                  checked={states.includes('running')}
                  onCheckedChange={(checked) => toggle('running', checked)}
                />
                <CheckboxItemLabel>Running</CheckboxItemLabel>
              </CheckboxItem>
              <CheckboxItem>
                <CheckboxItemControl
                  checked={states.includes('standby')}
                  onCheckedChange={(checked) => toggle('standby', checked)}
                />
                <CheckboxItemLabel>Standby</CheckboxItemLabel>
              </CheckboxItem>
              <CheckboxItem>
                <CheckboxItemControl
                  checked={states.includes('tripped')}
                  onCheckedChange={(checked) => toggle('tripped', checked)}
                />
                <CheckboxItemLabel>Tripped</CheckboxItemLabel>
              </CheckboxItem>
            </CheckboxGroup>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="criticality">
          <AccordionTrigger>Criticality</AccordionTrigger>
          <AccordionContent>
            <CheckboxGroup aria-label="Criticality">
              <CheckboxItem>
                <CheckboxItemControl />
                <CheckboxItemLabel>A, safety or production critical</CheckboxItemLabel>
              </CheckboxItem>
              <CheckboxItem>
                <CheckboxItemControl />
                <CheckboxItemLabel>B, important</CheckboxItemLabel>
              </CheckboxItem>
              <CheckboxItem>
                <CheckboxItemControl />
                <CheckboxItemLabel>C, low impact</CheckboxItemLabel>
              </CheckboxItem>
            </CheckboxGroup>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function AccordionWithSeparators() {
  return (
    <Accordion collapsible className="w-full max-w-md">
      <AccordionItem value="overview">
        <AccordionTrigger>Overview</AccordionTrigger>
        <AccordionContent>Gas compression raises inlet gas from 12 to 48 barg in two stages.</AccordionContent>
      </AccordionItem>
      <Separator className="my-2" />
      <AccordionItem value="equipment">
        <AccordionTrigger>Equipment</AccordionTrigger>
        <AccordionContent>Three compressors, one interstage cooler and one gas turbine driver.</AccordionContent>
      </AccordionItem>
      <Separator className="my-2" />
      <AccordionItem value="documents">
        <AccordionTrigger>Documents</AccordionTrigger>
        <AccordionContent>12 P&amp;IDs, 4 datasheets and the latest performance test report.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionChecklist() {
  return (
    <Accordion type="multiple" defaultValue={['lube']} className="w-full max-w-md">
      {PRESTART_CHECKS.map((group) => (
        <AccordionItem key={group.id} value={group.id}>
          <AccordionTrigger icon={IconGauge}>
            <span className="flex items-center gap-2">
              {group.label}
              <span className="text-sm tabular-nums text-muted-foreground">
                {group.done} of {group.checks.length}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <CheckboxGroup aria-label={group.label}>
              {group.checks.map((check, index) => (
                <CheckboxItem key={check}>
                  <CheckboxItemControl defaultChecked={index < group.done} />
                  <CheckboxItemLabel>{check}</CheckboxItemLabel>
                </CheckboxItem>
              ))}
            </CheckboxGroup>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default definePage({
  id: 'accordion',
  title: 'Accordion',
  summary:
    'An accordion stacks related sections under their titles and lets users open the ones they need, so a long panel stays scannable.',
  docsSlug: 'accordion',
  guidance: {
    use: [
      'Several related sections in a settings, filter or details panel.',
      'Specific titles that say what is inside: "Alarm notifications", not "More".',
      'Multiple mode when users compare sections; single mode when one at a time is enough.',
      'Icons on every trigger or on none.',
    ],
    avoid: [
      'One optional section; that is a collapsible.',
      'Content users must compare side by side or cannot afford to miss.',
      'An error or a required field left inside a closed section.',
      'An accordion inside an accordion.',
    ],
  },
  source,
  sections: [
    {
      id: 'expand-modes',
      title: 'Expand modes',
      description: 'How many sections can be open at once, and what is open on arrival.',
      specimens: [
        {
          id: 'AccordionSingle',
          title: 'Single',
          note: 'One section is always open and opening another replaces it; for content read one part at a time.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: AccordionSingle,
        },
        {
          id: 'AccordionCollapsible',
          title: 'Single, collapsible',
          note: 'One at a time, but the open section can be closed again to get back to the bare list.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: AccordionCollapsible,
        },
        {
          id: 'AccordionMultiple',
          title: 'Multiple',
          note: 'Any number open at once, when users read across sections.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: AccordionMultiple,
        },
        {
          id: 'AccordionAllClosed',
          title: 'All closed',
          note: 'Reference sections nobody needs on arrival; the titles alone are the overview.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: AccordionAllClosed,
        },
      ],
    },
    {
      id: 'trigger-content',
      title: 'Trigger and panel content',
      description: 'What a trigger can carry besides its title, and what a panel can hold.',
      specimens: [
        {
          id: 'AccordionWithIcons',
          title: 'With icons',
          note: 'Sections of different kinds that are easier to find by picture.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: AccordionWithIcons,
        },
        {
          id: 'AccordionWithCounts',
          title: 'With counts',
          note: 'The count tells users whether a section is worth opening.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: AccordionWithCounts,
        },
        {
          id: 'AccordionWithStatus',
          title: 'With status',
          note: 'Each section is a thing with a state; the one that needs attention starts open.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: AccordionWithStatus,
        },
        {
          id: 'AccordionWithDescription',
          title: 'With description',
          note: 'A second line gives the headline fact without opening the section.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: AccordionWithDescription,
        },
        {
          id: 'AccordionRichContent',
          title: 'Rich content',
          note: 'Procedures and other structured text, not only a sentence.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: AccordionRichContent,
        },
        {
          id: 'AccordionLongTitles',
          title: 'Long titles',
          note: 'Question-length titles wrap and the chevron stays aligned to the right.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: AccordionLongTitles,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Disabled, controlled from outside, invalid and loading.',
      specimens: [
        {
          id: 'AccordionDisabledItem',
          title: 'Disabled item',
          note: 'One section the user cannot open, with the reason in its second line.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: AccordionDisabledItem,
        },
        {
          id: 'AccordionDisabledAll',
          title: 'Disabled accordion',
          note: 'The whole group is frozen as it stands, with one shared reason below.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: AccordionDisabledAll,
        },
        {
          id: 'AccordionControlled',
          title: 'Expand and collapse all',
          note: 'Long panels where users want everything open to search, then closed again.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: AccordionControlled,
        },
        {
          id: 'AccordionInvalidSection',
          title: 'Section with an error',
          note: 'A section holding an invalid field opens and says so on its trigger; errors never hide.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: AccordionInvalidSection,
        },
        {
          id: 'AccordionLazyContent',
          title: 'Loads on open',
          note: 'Expensive content is fetched the first time its section opens. Open Run history to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: AccordionLazyContent,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Accordions as the structure of a panel, a form or a help page.',
      specimens: [
        {
          id: 'AccordionFaq',
          title: 'FAQ',
          note: 'Help content where each title is the question a user would ask.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: AccordionFaq,
        },
        {
          id: 'AccordionSettingsGroups',
          title: 'Settings groups',
          note: 'A settings panel grouped by topic, with switches that work in place.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/SettingSwitchRow.tsx'],
          Component: AccordionSettingsGroups,
        },
        {
          id: 'AccordionFormSections',
          title: 'Form sections',
          note: 'A longer form split into parts; the required part starts open and the actions stay outside.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: AccordionFormSections,
        },
        {
          id: 'AccordionInCard',
          title: 'In a card',
          note: 'Detail sections for one record inside a side panel or card.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: AccordionInCard,
        },
        {
          id: 'AccordionFilterPanel',
          title: 'Filter panel',
          note: 'Facets beside a table; each trigger shows how many of its options are active.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: AccordionFilterPanel,
        },
        {
          id: 'AccordionChecklist',
          title: 'Checklist groups',
          note: 'Grouped checks with progress on the trigger, so finished groups can stay closed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: AccordionChecklist,
        },
        {
          id: 'AccordionWithSeparators',
          title: 'With separators',
          note: 'On a plain page with nothing else to tell sections apart, a line between them helps.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: AccordionWithSeparators,
        },
      ],
    },
  ],
});
