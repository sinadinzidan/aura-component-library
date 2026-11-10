import { Alert, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  CheckboxGroup,
  CheckboxItem,
  CheckboxItemControl,
  CheckboxItemLabel,
} from '@cognite/aura/components/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@cognite/aura/components/collapsible';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Separator } from '@cognite/aura/components/separator';
import { Switch } from '@cognite/aura/components/switch';
import { IconChevronDown, IconChevronRight, IconSelector, IconUpload } from '@cognite/aura/icons';
import { useState } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { ShowMore } from '../../../library/overlays/ShowMore';
import { ALARMS, ASSETS, WORK_ORDERS, findAsset, findPerson, sensorsOf } from '../../data/plant';
import { formatDate } from '../../data/series';
import { definePage } from '../../types';

import source from './collapsible.tsx?raw';

const SELECTOR = 'transition-transform duration-200 group-data-panel-open/collapsible-trigger:rotate-180';

const CHEVRON = 'transition-transform duration-200 group-data-panel-open/collapsible-trigger:rotate-90';

const AREAS = ASSETS.filter((asset) => asset.type === 'area' || asset.type === 'system');

const SENSORS_9101 = sensorsOf('23-ka-9101');

const RAW_EVENT = `{
  "externalId": "alm-4812",
  "type": "alarm",
  "subtype": "vibration-high-high",
  "assetExternalId": "23-KA-9103",
  "source": "23-VT-92740",
  "value": 11.6,
  "limit": 11.0
}`;

function CollapsibleBasic() {
  return (
    <Collapsible className="max-w-md">
      <CollapsibleTrigger
        render={
          <Button variant="ghost" className="w-full justify-between">
            Advanced settings
            <IconSelector className={SELECTOR} />
          </Button>
        }
      />
      <CollapsibleContent>
        <p className="px-3 py-2">
          Retries, batch size and time-out. The defaults suit most sources, so change them only when a run fails.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CollapsibleDefaultOpen() {
  return (
    <Collapsible defaultOpen className="max-w-md">
      <CollapsibleTrigger
        render={
          <Button variant="ghost" className="w-full justify-between">
            Why this alarm was raised
            <IconSelector className={SELECTOR} />
          </Button>
        }
      />
      <CollapsibleContent>
        <p className="px-3 py-2">
          Drive-end vibration on the recompressor reached 11.6 mm/s, above the 11.0 mm/s trip limit, and stayed there
          for more than two seconds.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CollapsiblePlainTrigger() {
  return (
    <Collapsible className="max-w-md">
      <CollapsibleTrigger>Source details</CollapsibleTrigger>
      <CollapsibleContent>
        <p className="px-3 py-2">OPC UA historian at Nordkapp, server NK-HIST-01, read every hour.</p>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CollapsibleLeadingChevron() {
  return (
    <Collapsible className="max-w-md">
      <CollapsibleTrigger
        render={
          <Button variant="ghost" className="w-full justify-start">
            <IconChevronRight className={CHEVRON} />
            Linked documents
          </Button>
        }
      />
      <CollapsibleContent>
        <ul className="space-y-1 py-2 pl-9 pr-3">
          <li>P&amp;ID NK-23-0041, gas compression</li>
          <li>Datasheet 23-KA-9101</li>
          <li>Performance test report, 2025</li>
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CollapsibleWithCount() {
  const alarms = ALARMS.filter((alarm) => alarm.state === 'cleared');

  return (
    <Collapsible className="max-w-md">
      <CollapsibleTrigger
        render={
          <Button variant="ghost" className="w-full justify-between">
            <span className="flex flex-1 items-center gap-2">
              Cleared alarms <Badge variant="secondary">{alarms.length}</Badge>
            </span>
            <IconSelector className={SELECTOR} />
          </Button>
        }
      />
      <CollapsibleContent>
        <ul className="space-y-1 px-3 py-2">
          {alarms.map((alarm) => (
            <li key={alarm.id}>{alarm.message}</li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CollapsibleWithSummary() {
  return (
    <Collapsible className="max-w-md">
      <CollapsibleTrigger
        render={
          <Button variant="ghost" className="w-full justify-between">
            <span className="flex-1 text-left">Schedule</span>
            <span className="text-sm font-normal text-muted-foreground">Every hour</span>
            <IconSelector className={SELECTOR} />
          </Button>
        }
      />
      <CollapsibleContent>
        <div className="px-3 py-2">
          <MetadataList
            items={[
              { label: 'Runs', value: 'Five minutes past every hour' },
              { label: 'Full reload', value: 'Sundays at 02:00' },
              { label: 'Time zone', value: 'Europe/Oslo' },
            ]}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CollapsibleShowMoreText() {
  return (
    <div className="w-full max-w-md">
      <ShowMore summary="Recompressor tripped on high drive-end vibration at 13:46. The standby train carried the load and export was not affected.">
        Vibration had been rising for two days after the last restart. The bearing is being inspected under WO-104482,
        and the compressor stays isolated until the clearances are measured and signed off by the rotating equipment
        engineer.
      </ShowMore>
    </div>
  );
}

function CollapsibleShowMoreList() {
  const first = SENSORS_9101.slice(0, 3);
  const rest = SENSORS_9101.slice(3);

  return (
    <div className="w-full max-w-md">
      <ShowMore
        moreLabel={`Show ${rest.length} more`}
        lessLabel="Show fewer"
        summary={
          <MetadataList
            items={first.map((sensor) => ({
              label: sensor.name,
              value: `${sensor.value.toFixed(sensor.decimals)} ${sensor.unit}`,
            }))}
          />
        }
      >
        <MetadataList
          items={rest.map((sensor) => ({
            label: sensor.name,
            value: `${sensor.value.toFixed(sensor.decimals)} ${sensor.unit}`,
          }))}
        />
      </ShowMore>
    </div>
  );
}

function CollapsibleRawPayload() {
  return (
    <Collapsible className="max-w-md">
      <CollapsibleTrigger
        render={
          <Button variant="ghost" className="w-full justify-between">
            Raw event
            <IconSelector className={SELECTOR} />
          </Button>
        }
      />
      <CollapsibleContent>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-muted-background p-3 font-mono text-xs text-base-foreground">
          {RAW_EVENT}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CollapsibleLabelSwap() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="max-w-md">
      <div className="flex items-center justify-between gap-4 px-3">
        <p className="text-sm font-medium text-base-foreground">3 of 12 checks need attention</p>
        <div className="w-fit shrink-0">
          <CollapsibleTrigger
            render={
              <Button variant="outline" size="sm">
                {open ? 'Hide checks' : 'Show checks'}
              </Button>
            }
          />
        </div>
      </div>
      <CollapsibleContent>
        <ul className="list-disc space-y-1 py-2 pl-8 pr-3">
          <li>Lube oil filter pressure drop is high.</li>
          <li>Seal gas supply is below 55 barg.</li>
          <li>Standby pump is in manual.</li>
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CollapsibleHeaderAction() {
  return (
    <Collapsible defaultOpen className="max-w-md">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <CollapsibleTrigger
            render={
              <Button variant="ghost" className="w-full justify-start">
                <IconChevronRight className={CHEVRON} />
                Attachments <Badge variant="secondary">2</Badge>
              </Button>
            }
          />
        </div>
        <Button variant="outline" size="sm" className="shrink-0">
          <IconUpload /> Upload file
        </Button>
      </div>
      <CollapsibleContent>
        <ul className="space-y-1 py-2 pl-9 pr-3">
          <li>Bearing inspection photos.zip</li>
          <li>Vibration spectrum 12 March.pdf</li>
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CollapsibleDisabled() {
  return (
    <div className="w-full max-w-md">
      <Collapsible disabled>
        <CollapsibleTrigger
          render={
            <Button variant="ghost" disabled className="w-full justify-between">
              Trip settings
              <IconSelector />
            </Button>
          }
        />
        <CollapsibleContent>
          <p className="px-3 py-2">High-high 55.0 barg with a two-second delay.</p>
        </CollapsibleContent>
      </Collapsible>
      <p className="px-3 pt-1 text-sm text-muted-foreground">Only shift supervisors can view trip settings.</p>
    </div>
  );
}

function CollapsibleControlled() {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full max-w-md">
      <div className="px-3 pb-2">
        <Switch label="Show limits on the chart" checked={open} onCheckedChange={(checked) => setOpen(checked)} />
      </div>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleContent>
          <div className="px-3 py-2">
            <MetadataList
              items={[
                { label: 'High-high', value: '55.0 barg' },
                { label: 'High', value: '52.0 barg' },
                { label: 'Low', value: '40.0 barg' },
              ]}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function CollapsibleKeepsValues() {
  return (
    <Collapsible className="max-w-md">
      <CollapsibleTrigger
        render={
          <Button variant="ghost" className="w-full justify-between">
            Add a comment
            <IconSelector className={SELECTOR} />
          </Button>
        }
      />
      <CollapsibleContent>
        <div className="px-3 py-2">
          <Label htmlFor="collapsible-keeps-comment">Comment</Label>
          <Input id="collapsible-keeps-comment" defaultValue="Checked on site, guard refitted." />
          <HelperText>Close and reopen: what you typed is still here.</HelperText>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CollapsibleUnmounted() {
  return (
    <Collapsible className="max-w-md">
      <CollapsibleTrigger
        render={
          <Button variant="ghost" className="w-full justify-between">
            Enter a one-time code
            <IconSelector className={SELECTOR} />
          </Button>
        }
      />
      <CollapsibleContent keepMounted={false}>
        <div className="px-3 py-2">
          <Label htmlFor="collapsible-unmounted-code">Code</Label>
          <Input id="collapsible-unmounted-code" inputMode="numeric" autoComplete="off" />
          <HelperText>Close and reopen: the field starts empty again.</HelperText>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CollapsibleFilterGroup() {
  const [areas, setAreas] = useState<readonly string[]>(['nk-23']);

  const toggle = (id: string, checked: boolean) => {
    setAreas(checked ? [...areas, id] : areas.filter((item) => item !== id));
  };

  return (
    <Collapsible defaultOpen className="max-w-xs">
      <CollapsibleTrigger
        render={
          <Button variant="ghost" className="w-full justify-between">
            <span className="flex flex-1 items-center gap-2">
              Area {areas.length > 0 ? <Badge variant="secondary">{areas.length}</Badge> : null}
            </span>
            <IconChevronDown className={SELECTOR} />
          </Button>
        }
      />
      <CollapsibleContent>
        <CheckboxGroup aria-label="Area" className="px-3 py-1">
          {AREAS.map((area) => (
            <CheckboxItem key={area.id}>
              <CheckboxItemControl
                checked={areas.includes(area.id)}
                onCheckedChange={(checked) => toggle(area.id, checked)}
              />
              <CheckboxItemLabel>{area.name}</CheckboxItemLabel>
            </CheckboxItem>
          ))}
        </CheckboxGroup>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CollapsibleAdvancedOptions() {
  return (
    <form className="w-full max-w-md" onSubmit={(event) => event.preventDefault()}>
      <div className="space-y-4 px-3">
        <div>
          <Label htmlFor="collapsible-advanced-name" required>
            Pipeline name
          </Label>
          <Input id="collapsible-advanced-name" defaultValue="Compressor telemetry ingest" />
        </div>
        <div>
          <Label htmlFor="collapsible-advanced-source">Source address</Label>
          <Input id="collapsible-advanced-source" defaultValue="opc.tcp://historian.nordkapp.test:4840" />
        </div>
      </div>
      <Collapsible className="pt-2">
        <CollapsibleTrigger
          render={
            <Button variant="ghost" className="w-full justify-between">
              Advanced options
              <IconSelector className={SELECTOR} />
            </Button>
          }
        />
        <CollapsibleContent>
          <div className="grid grid-cols-2 gap-4 px-3 py-2">
            <div>
              <Label htmlFor="collapsible-advanced-batch">Batch size</Label>
              <Input id="collapsible-advanced-batch" type="number" defaultValue={10000} />
            </div>
            <div>
              <Label htmlFor="collapsible-advanced-retries">Retries</Label>
              <Input id="collapsible-advanced-retries" type="number" defaultValue={3} />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      <div className="flex justify-end gap-2 px-3 pt-4">
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Create pipeline</Button>
      </div>
    </form>
  );
}

function CollapsibleSidebarSection() {
  return (
    <nav aria-label="Saved views" className="w-full max-w-60">
      <Collapsible defaultOpen>
        <CollapsibleTrigger
          render={
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <IconChevronRight className={CHEVRON} />
              Saved views
            </Button>
          }
        />
        <CollapsibleContent>
          <ul className="flex flex-col pl-5">
            <li>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                Tripped and critical
              </Button>
            </li>
            <li>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                My work orders
              </Button>
            </li>
            <li>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                Overdue inspections
              </Button>
            </li>
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </nav>
  );
}

function CollapsibleCardDetails() {
  const order = WORK_ORDERS[0];
  const asset = findAsset(order.assetId);

  return (
    <div className="w-full max-w-md rounded-xl bg-muted-background p-4">
      <div className="flex items-start justify-between gap-3 px-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-base-foreground">{order.title}</p>
          <p className="pt-0.5 font-mono text-xs text-muted-foreground">{order.id}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <Collapsible className="pt-2">
        <CollapsibleTrigger
          render={
            <Button variant="ghost" size="sm" className="w-full justify-between">
              Details
              <IconSelector className={SELECTOR} />
            </Button>
          }
        />
        <CollapsibleContent>
          <div className="px-3 pt-2">
            <MetadataList
              items={[
                { label: 'Asset', value: asset?.tag },
                { label: 'Assignee', value: findPerson(order.assigneeId)?.name },
                { label: 'Due', value: formatDate(order.dueAt) },
                { label: 'Estimate', value: `${order.estimatedHours} h` },
              ]}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function CollapsibleErrorDetails() {
  return (
    <div className="w-full max-w-md">
      <Alert variant="error">
        <AlertTitle>Run failed</AlertTitle>
        <AlertDescription>The historian did not answer within 30 seconds. The next run is at 15:05.</AlertDescription>
      </Alert>
      <Collapsible className="pt-2">
        <CollapsibleTrigger
          render={
            <Button variant="ghost" size="sm" className="w-full justify-between">
              Technical details
              <IconSelector className={SELECTOR} />
            </Button>
          }
        />
        <CollapsibleContent>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-muted-background p-3 font-mono text-xs text-base-foreground">
            {'BadTimeout: opc.tcp://historian.nordkapp.test:4840\nattempt 3 of 3, waited 30000 ms\nrun 7f3a9c12'}
          </pre>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function CollapsibleStacked() {
  return (
    <div className="w-full max-w-md">
      <Collapsible defaultOpen>
        <CollapsibleTrigger
          render={
            <Button variant="ghost" className="w-full justify-between">
              Reasoning
              <IconSelector className={SELECTOR} />
            </Button>
          }
        />
        <CollapsibleContent>
          <p className="px-3 py-2">
            Vibration rose 40% over two days while speed and load were steady, which points to the bearing and not to
            the process.
          </p>
        </CollapsibleContent>
      </Collapsible>
      <Separator className="my-2" />
      <Collapsible>
        <CollapsibleTrigger
          render={
            <Button variant="ghost" className="w-full justify-between">
              Sources
              <IconSelector className={SELECTOR} />
            </Button>
          }
        />
        <CollapsibleContent>
          <p className="px-3 py-2">23-VT-92740, 23-ST-92701 and the last two vibration survey reports.</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function CollapsibleRowDetails() {
  const alarm = ALARMS[1];

  return (
    <Collapsible className="max-w-md">
      <div className="flex items-center gap-2">
        <div className="w-fit shrink-0">
          <CollapsibleTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label={`Details for ${alarm.message}`}>
                <IconChevronRight className={CHEVRON} />
              </Button>
            }
          />
        </div>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-base-foreground">{alarm.message}</span>
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{alarm.value}</span>
      </div>
      <CollapsibleContent>
        <div className="py-2 pl-9 pr-1">
          <MetadataList
            items={[
              { label: 'Source', value: alarm.sensorTag },
              { label: 'Limit', value: alarm.limit },
              { label: 'Asset', value: findAsset(alarm.assetId)?.name },
            ]}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default definePage({
  id: 'collapsible',
  title: 'Collapsible',
  summary:
    'A collapsible shows or hides one optional block of content in place, such as advanced settings, reasoning or the rest of a long text.',
  docsSlug: 'collapsible',
  guidance: {
    use: [
      'One optional block that is useful but not needed for the main task.',
      'A trigger label that says what is inside: "Advanced settings", not "More".',
      'Collapsed by default, unless the content is the point of the view.',
      'A separator between two collapsibles that follow each other.',
    ],
    avoid: [
      'Several stacked sections; that is an accordion.',
      'Errors, required fields or anything the task depends on.',
      'A collapsible inside a collapsible.',
      'Navigation or filtering between views; use tabs or filter controls.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'One trigger, one region. The trigger is usually a ghost button with an icon that turns.',
      specimens: [
        {
          id: 'CollapsibleBasic',
          title: 'Basic',
          note: 'The default: a full-width ghost button with a selector icon at the end.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CollapsibleBasic,
        },
        {
          id: 'CollapsibleDefaultOpen',
          title: 'Open by default',
          note: 'Content most users want, that a few will want out of the way.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CollapsibleDefaultOpen,
        },
        {
          id: 'CollapsiblePlainTrigger',
          title: 'Plain trigger',
          note: 'The built-in trigger with no button or icon, for the quietest disclosure in dense panels.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CollapsiblePlainTrigger,
        },
        {
          id: 'CollapsibleLeadingChevron',
          title: 'Leading chevron',
          note: 'Tree-like panels where the turning chevron lines up with other expandable rows.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CollapsibleLeadingChevron,
        },
      ],
    },
    {
      id: 'content',
      title: 'Trigger and content',
      description: 'What the trigger can say about the hidden part, and what the hidden part can be.',
      specimens: [
        {
          id: 'CollapsibleWithCount',
          title: 'With count',
          note: 'The count says how much is hidden before the user opens it.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CollapsibleWithCount,
        },
        {
          id: 'CollapsibleWithSummary',
          title: 'With current value',
          note: 'The trigger shows the setting as it stands, so most users never need to open it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: CollapsibleWithSummary,
        },
        {
          id: 'CollapsibleShowMoreText',
          title: 'Show more text',
          note: 'A long note or description: the first sentences stay, the rest opens below.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['overlays/ShowMore.tsx'],
          Component: CollapsibleShowMoreText,
        },
        {
          id: 'CollapsibleShowMoreList',
          title: 'Show more rows',
          note: 'A list where the first few rows answer most questions; the label counts what is left.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['overlays/ShowMore.tsx', 'display/MetadataList.tsx'],
          Component: CollapsibleShowMoreList,
        },
        {
          id: 'CollapsibleRawPayload',
          title: 'Raw payload',
          note: 'Technical detail for the few who need it, kept out of everyone else’s way.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: CollapsibleRawPayload,
        },
        {
          id: 'CollapsibleHeaderAction',
          title: 'With header action',
          note: 'An action for the section, such as add or upload, stays reachable while it is folded.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: CollapsibleHeaderAction,
        },
        {
          id: 'CollapsibleLabelSwap',
          title: 'Separate toggle button',
          note: 'A summary line stays put and a small button beside it shows or hides the detail.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: CollapsibleLabelSwap,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Disabled, controlled from another control, and what happens to hidden content.',
      specimens: [
        {
          id: 'CollapsibleDisabled',
          title: 'Disabled with reason',
          note: 'The section exists but this user cannot open it; the reason sits right below.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CollapsibleDisabled,
        },
        {
          id: 'CollapsibleControlled',
          title: 'Controlled by a switch',
          note: 'Another control owns the state, and the region follows it without a trigger of its own.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: CollapsibleControlled,
        },
        {
          id: 'CollapsibleKeepsValues',
          title: 'Keeps its values',
          note: 'The default: hidden content stays mounted, so a half-filled field survives a close.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CollapsibleKeepsValues,
        },
        {
          id: 'CollapsibleUnmounted',
          title: 'Unmounts when closed',
          note: 'Heavy content, or a field that should reset, is removed from the page while closed.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CollapsibleUnmounted,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'A single disclosure inside forms, cards, lists and side panels.',
      specimens: [
        {
          id: 'CollapsibleAdvancedOptions',
          title: 'Advanced options in a form',
          note: 'Optional fields with good defaults stay folded under the required ones.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: CollapsibleAdvancedOptions,
        },
        {
          id: 'CollapsibleCardDetails',
          title: 'Card with details',
          note: 'A card that leads with its headline and keeps the properties one click away.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx', 'display/MetadataList.tsx'],
          Component: CollapsibleCardDetails,
        },
        {
          id: 'CollapsibleErrorDetails',
          title: 'Error with technical details',
          note: 'The message stays readable; the trace is there for whoever files the ticket.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: CollapsibleErrorDetails,
        },
        {
          id: 'CollapsibleStacked',
          title: 'Two with a separator',
          note: 'Two independent disclosures in a row. More than two is an accordion.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CollapsibleStacked,
        },
        {
          id: 'CollapsibleRowDetails',
          title: 'Expandable row',
          note: 'A list row whose detail opens underneath it instead of in a panel.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: CollapsibleRowDetails,
        },
        {
          id: 'CollapsibleFilterGroup',
          title: 'Filter group',
          note: 'One facet beside a table that can fold away while keeping its active count visible.',
          origin: 'custom',
          Component: CollapsibleFilterGroup,
        },
        {
          id: 'CollapsibleSidebarSection',
          title: 'Sidebar section',
          note: 'A group of links in a side panel that users can fold to make room.',
          origin: 'custom',
          Component: CollapsibleSidebarSection,
        },
      ],
    },
  ],
});
