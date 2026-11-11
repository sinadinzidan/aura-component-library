import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import { Loader } from '@cognite/aura/components/loader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import { Textarea } from '@cognite/aura/components/textarea';
import { IconFilter, IconTrash } from '@cognite/aura/icons';
import { useState } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { FormField } from '../../../library/forms/FormField';
import { severityStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { AlertDialog } from '../../../library/primitives/alert-dialog/AlertDialog';
import { AlertDialogAction } from '../../../library/primitives/alert-dialog/AlertDialogAction';
import { AlertDialogCancel } from '../../../library/primitives/alert-dialog/AlertDialogCancel';
import { AlertDialogContent } from '../../../library/primitives/alert-dialog/AlertDialogContent';
import { AlertDialogDescription } from '../../../library/primitives/alert-dialog/AlertDialogDescription';
import { AlertDialogFooter } from '../../../library/primitives/alert-dialog/AlertDialogFooter';
import { AlertDialogHeader } from '../../../library/primitives/alert-dialog/AlertDialogHeader';
import { AlertDialogTitle } from '../../../library/primitives/alert-dialog/AlertDialogTitle';
import { Drawer } from '../../../library/primitives/drawer/Drawer';
import { DrawerBody } from '../../../library/primitives/drawer/DrawerBody';
import { DrawerClose } from '../../../library/primitives/drawer/DrawerClose';
import { DrawerContent } from '../../../library/primitives/drawer/DrawerContent';
import { DrawerDescription } from '../../../library/primitives/drawer/DrawerDescription';
import { DrawerFooter } from '../../../library/primitives/drawer/DrawerFooter';
import { DrawerHeader } from '../../../library/primitives/drawer/DrawerHeader';
import { DrawerTitle } from '../../../library/primitives/drawer/DrawerTitle';
import { DrawerTrigger } from '../../../library/primitives/drawer/DrawerTrigger';
import { ALARMS, ASSETS, SENSORS, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import { REFERENCE_NOW, formatAgo, formatDateTime } from '../../data/series';
import { definePage } from '../../types';

import source from './drawer.tsx?raw';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const EQUIPMENT = ASSETS.filter((asset) => asset.type !== 'site' && asset.type !== 'area' && asset.type !== 'system');

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;

const AREAS = ['NK-20 Inlet and separation', 'NK-23 Gas compression', 'NK-27 Gas export', 'NK-40 Cooling water'];

const NAV_ENTRIES = ['Overview', 'Assets', 'Time series', 'Alarms', 'Work orders', 'Reports'];

const LONG_PROCEDURE = [
  'Confirm the compressor is shut down and the trip is reset in the control system.',
  'Isolate the recompressor electrically and lock out breaker 23-EL-9103.',
  'Close and tag suction valve 23-XV-9130 and discharge valve 23-XV-9131.',
  'Depressurise the casing to flare and confirm 0 barg on 23-PT-92731.',
  'Purge with nitrogen until the gas test reads below 1% LEL.',
  'Barrier off the compressor deck and post the permit at the access point.',
  'Remove the drive-end bearing cover and record the clearance readings.',
  'Photograph the bearing shell and journal before any cleaning.',
  'Replace the bearing shell if the wear exceeds 0.08 mm.',
  'Refit the cover with new gaskets and torque the bolts to 120 Nm.',
  'Remove locks and tags in reverse order and record each in the permit.',
  'Run the compressor unloaded for 20 minutes and log vibration at 5-minute intervals.',
];

function DrawerPrimAssetFacts({ assetId }: { assetId: string }) {
  const asset = findAsset(assetId);
  if (!asset) return null;
  const sensors = SENSORS.filter((sensor) => sensor.assetId === asset.id).slice(0, 4);
  return (
    <div className="flex flex-col gap-5">
      <MetadataList
        items={[
          { label: 'Tag', value: <span className="font-mono">{asset.tag}</span> },
          { label: 'Type', value: asset.type },
          { label: 'Criticality', value: asset.criticality },
          { label: 'Health score', value: <span className="tabular-nums">{asset.healthScore} / 100</span> },
        ]}
      />
      <section aria-label="Latest readings" className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-base-foreground">Latest readings</h3>
        {sensors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No time series are linked to this asset.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sensors.map((sensor) => (
              <li key={sensor.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-muted-foreground">{sensor.name}</span>
                <span className="shrink-0 font-medium text-base-foreground tabular-nums">
                  {sensor.value.toLocaleString('en-US')} <span className="font-normal text-muted-foreground">{sensor.unit}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DrawerPrimSide({ side, label }: { side: 'right' | 'left' | 'top' | 'bottom'; label: string }) {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline">{label}</Button>} />
      <DrawerContent side={side} size={side === 'top' || side === 'bottom' ? 'sm' : 'md'}>
        <DrawerHeader>
          <DrawerTitle>Interstage cooler</DrawerTitle>
          <DrawerDescription>
            <span className="font-mono">23-HA-9114</span> · attached to the {side} edge
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <DrawerPrimAssetFacts assetId="23-ha-9114" />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerPrimRight() {
  return <DrawerPrimSide side="right" label="Open asset details" />;
}

function DrawerPrimLeft() {
  return <DrawerPrimSide side="left" label="Open navigation" />;
}

function DrawerPrimTop() {
  return <DrawerPrimSide side="top" label="Open alarm banner" />;
}

function DrawerPrimBottom() {
  return <DrawerPrimSide side="bottom" label="Open quick facts" />;
}

function DrawerPrimSized({ size, label }: { size: 'sm' | 'md' | 'lg' | 'full'; label: string }) {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline">{label}</Button>} />
      <DrawerContent size={size}>
        <DrawerHeader>
          <DrawerTitle>Work order WO-104482</DrawerTitle>
          <DrawerDescription>Inspect recompressor drive-end bearing</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <MetadataList
            items={[
              { label: 'Priority', value: 'P1' },
              { label: 'Asset', value: <span className="font-mono">23-KA-9103</span> },
              { label: 'Assignee', value: 'Tomás Barros' },
              { label: 'Estimate', value: <span className="tabular-nums">8 h</span> },
            ]}
          />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerPrimSizeSmall() {
  return <DrawerPrimSized size="sm" label="Open small drawer" />;
}

function DrawerPrimSizeMedium() {
  return <DrawerPrimSized size="md" label="Open medium drawer" />;
}

function DrawerPrimSizeLarge() {
  return <DrawerPrimSized size="lg" label="Open large drawer" />;
}

function DrawerPrimSizeFull() {
  return <DrawerPrimSized size="full" label="Open full-width drawer" />;
}

function DrawerPrimForm() {
  const [open, setOpen] = useState(false);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger render={<Button>Edit work order</Button>} />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit work order</DrawerTitle>
          <DrawerDescription>WO-104466 · Vibration survey, 1st stage compressor</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <form id="drawer-prim-form" className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
            <FormField label="Title">
              {(control) => <Input {...control} defaultValue="Vibration survey, 1st stage compressor" />}
            </FormField>
            <FormField label="Priority">
              {(control) => (
                <Select defaultValue="P2">
                  <SelectTrigger id={control.id}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['P1', 'P2', 'P3', 'P4'].map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
            <FormField label="Estimated hours" helper="Include the permit and isolation time.">
              {(control) => <Input {...control} inputMode="decimal" defaultValue="4" />}
            </FormField>
            <FormField label="Notes" optional>
              {(control) => <Textarea {...control} rows={4} defaultValue="Take readings at 80% and 100% load." />}
            </FormField>
          </form>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost">Cancel</Button>} />
          <Button type="submit" form="drawer-prim-form" onClick={() => setOpen(false)}>
            Save changes
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerPrimRowDetail() {
  const [selected, setSelected] = useState<string | null>(null);
  const alarm = ALARMS.find((candidate) => candidate.id === selected);
  const asset = alarm ? findAsset(alarm.assetId) : undefined;
  return (
    <div className="w-full max-w-lg">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Active alarms</caption>
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-medium">Alarm</th>
            <th scope="col" className="py-2 pr-3 font-medium">Asset</th>
            <th scope="col" className="py-2 text-right font-medium">Raised</th>
          </tr>
        </thead>
        <tbody>
          {ALARMS.slice(0, 4).map((row) => (
            <tr key={row.id} className="border-t border-default">
              <td className="py-1 pr-3">
                <Button variant="ghost" size="sm" onClick={() => setSelected(row.id)}>
                  {row.message}
                </Button>
              </td>
              <td className="py-1 pr-3 font-mono text-xs text-muted-foreground">{findAsset(row.assetId)?.tag}</td>
              <td className="py-1 text-right text-muted-foreground tabular-nums">{formatAgo(row.raisedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Drawer open={selected !== null} onOpenChange={(next) => (next ? undefined : setSelected(null))}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{alarm?.message ?? 'Alarm'}</DrawerTitle>
            <DrawerDescription>
              <span className="font-mono">{alarm?.id}</span> on {asset?.name}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            {alarm ? (
              <MetadataList
                items={[
                  { label: 'Severity', value: <StatusIndicator {...severityStatus(alarm.severity)} /> },
                  { label: 'Signal', value: <span className="font-mono">{alarm.sensorTag}</span> },
                  { label: 'Value', value: <span className="tabular-nums">{alarm.value}</span> },
                  { label: 'Limit', value: <span className="tabular-nums">{alarm.limit}</span> },
                  { label: 'Raised', value: formatDateTime(alarm.raisedAt) },
                ]}
              />
            ) : null}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function DrawerPrimFilters() {
  const [severities, setSeverities] = useState<string[]>(['critical', 'high']);
  const [area, setArea] = useState(AREAS[1]);
  const toggle = (severity: string) =>
    setSeverities((current) => (current.includes(severity) ? current.filter((item) => item !== severity) : [...current, severity]));
  return (
    <Drawer>
      <DrawerTrigger
        render={
          <Button variant="outline">
            <IconFilter /> Filter alarms
          </Button>
        }
      />
      <DrawerContent side="right" size="sm">
        <DrawerHeader>
          <DrawerTitle>Filter alarms</DrawerTitle>
          <DrawerDescription>Narrow the list by severity and area.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <div className="flex flex-col gap-5">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium text-base-foreground">Severity</legend>
              {SEVERITIES.map((severity) => (
                <CheckboxItem key={severity}>
                  <CheckboxItemControl checked={severities.includes(severity)} onCheckedChange={() => toggle(severity)} />
                  <CheckboxItemLabel>{severity[0].toUpperCase() + severity.slice(1)}</CheckboxItemLabel>
                </CheckboxItem>
              ))}
            </fieldset>
            <FormField label="Area">
              {(control) => (
                <Select value={area} onValueChange={(value) => setArea(value ?? AREAS[0])}>
                  <SelectTrigger id={control.id}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="ghost" onClick={() => { setSeverities([]); setArea(AREAS[0]); }}>
            Clear filters
          </Button>
          <DrawerClose render={<Button>Show {severities.length === 0 ? 'all alarms' : `${severities.length} severities`}</Button>} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerPrimNested() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline">Open work order</Button>} />
      <DrawerContent size="lg">
        <DrawerHeader>
          <DrawerTitle>WO-104482 · Inspect recompressor bearing</DrawerTitle>
          <DrawerDescription>The first drawer shifts back while a second one stacks on top.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <p className="pb-3 text-sm text-muted-foreground">Asset 23-KA-9103 tripped on high vibration 14 minutes ago.</p>
          <Drawer>
            <DrawerTrigger render={<Button variant="outline">View asset 23-KA-9103</Button>} />
            <DrawerContent size="md">
              <DrawerHeader>
                <DrawerTitle>Recompressor</DrawerTitle>
                <DrawerDescription>
                  <span className="font-mono">23-KA-9103</span> · opened from the work order
                </DrawerDescription>
              </DrawerHeader>
              <DrawerBody>
                <DrawerPrimAssetFacts assetId="23-ka-9103" />
              </DrawerBody>
              <DrawerFooter>
                <DrawerClose render={<Button variant="ghost">Back to work order</Button>} />
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerPrimTabs() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline">Open pipeline run</Button>} />
      <DrawerContent size="lg">
        <Tabs defaultValue="summary" className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader className="border-b-0 pb-2">
            <DrawerTitle>Run 2026-03-12 02:00</DrawerTitle>
            <DrawerDescription>Nordkapp compressor telemetry · extraction pipeline</DrawerDescription>
          </DrawerHeader>
          <TabsList className="px-5">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>
          <DrawerBody>
            <TabsPanel value="summary">
              <MetadataList
                items={[
                  { label: 'Status', value: <StatusBadge status="done" label="Succeeded" /> },
                  { label: 'Duration', value: <span className="tabular-nums">4 min 12 s</span> },
                  { label: 'Rows written', value: <span className="tabular-nums">182,400</span> },
                ]}
              />
            </TabsPanel>
            <TabsPanel value="logs">
              <pre className="font-mono text-xs leading-5 text-muted-foreground">
                {'02:00:03  Connected to historian\n02:01:44  Read 182,400 rows\n02:04:15  Wrote 182,400 rows\n02:04:15  Run finished'}
              </pre>
            </TabsPanel>
            <TabsPanel value="config">
              <MetadataList
                items={[
                  { label: 'Schedule', value: 'Every day at 02:00' },
                  { label: 'Target', value: <span className="font-mono">nk-compressors</span> },
                ]}
              />
            </TabsPanel>
          </DrawerBody>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerPrimLongContent() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline">Open permit conditions</Button>} />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Permit conditions</DrawerTitle>
          <DrawerDescription>Header and footer stay put; the body scrolls.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm text-base-foreground">
            {LONG_PROCEDURE.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost">Close</Button>} />
          <DrawerClose render={<Button>Accept conditions</Button>} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerPrimStatusHeader() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline">Open recompressor</Button>} />
      <DrawerContent showCloseButton={false}>
        <DrawerHeader className="pr-5">
          <div className="flex items-center justify-between gap-3">
            <DrawerTitle>Recompressor</DrawerTitle>
            <StatusBadge status="tripped" />
          </div>
          <DrawerDescription>
            <span className="font-mono">23-KA-9103</span> · Gas compression
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <DrawerPrimAssetFacts assetId="23-ka-9103" />
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose render={<Button variant="secondary">Close</Button>} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerPrimBlockedWhileSaving() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    await wait(1800);
    setSaving(false);
    setOpen(false);
  };
  return (
    <Drawer open={open} onOpenChange={setOpen} dismissible={!saving}>
      <DrawerTrigger render={<Button>Edit alert rule</Button>} />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit alert rule</DrawerTitle>
          <DrawerDescription>High discharge temperature on 23-KA-9101</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <FormField label="Threshold (°C)" helper={saving ? 'Saving the rule. Closing is paused until it finishes.' : undefined}>
            {(control) => <Input {...control} inputMode="decimal" defaultValue="145" disabled={saving} />}
          </FormField>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost">Cancel</Button>} />
          <Button disabled={saving} aria-busy={saving || undefined} onClick={save}>
            {saving ? <Loader size={16} aria-hidden /> : null}
            {saving ? 'Saving…' : 'Save rule'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerPrimUnsavedGuard() {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [asking, setAsking] = useState(false);
  const requestOpen = (next: boolean) => {
    if (!next && dirty) {
      setAsking(true);
      return;
    }
    setOpen(next);
  };
  const discard = () => {
    setAsking(false);
    setDirty(false);
    setOpen(false);
  };
  return (
    <Drawer open={open} onOpenChange={requestOpen}>
      <DrawerTrigger render={<Button>Rename data set</Button>} />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Rename data set</DrawerTitle>
          <DrawerDescription>Closing with edits asks before it discards them.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <FormField label="Name">
            {(control) => (
              <Input {...control} defaultValue="Nordkapp compressor telemetry" onChange={() => setDirty(true)} />
            )}
          </FormField>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="ghost" onClick={() => requestOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setDirty(false);
              setOpen(false);
            }}
          >
            Save name
          </Button>
        </DrawerFooter>
        <AlertDialog tone="destructive" open={asking} onOpenChange={setAsking}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Discard changes?</AlertDialogTitle>
              <AlertDialogDescription>Your edits to the name are lost. This can&apos;t be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep editing</AlertDialogCancel>
              <AlertDialogAction onConfirm={discard}>Discard changes</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerPrimInspectorBeside() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(EQUIPMENT[0].id);
  const asset = findAsset(selected);
  return (
    <Drawer open={open} onOpenChange={setOpen} modal={false}>
      <div className="flex h-96 w-full overflow-hidden rounded-xl border border-default bg-base-background">
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="flex items-center justify-between gap-3 border-b border-default px-4 py-3">
            <h3 className="text-sm font-medium text-base-foreground">Equipment</h3>
            <DrawerTrigger render={<Button variant="outline" size="sm">Open inspector</Button>} />
          </div>
          <ul>
            {EQUIPMENT.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={item.id === selected}
                  onClick={() => setSelected(item.id)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm outline-none hover:bg-base-background-hover focus-visible:shadow-focus-ring aria-pressed:bg-muted-background"
                >
                  <span className="w-28 shrink-0 font-mono text-xs text-muted-foreground">{item.tag}</span>
                  <span className="min-w-0 flex-1 truncate text-base-foreground">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <DrawerContent docked size="sm" closeButtonLabel="Close inspector">
          <DrawerHeader>
            <DrawerTitle>{asset?.name}</DrawerTitle>
            <DrawerDescription>
              <span className="font-mono">{asset?.tag}</span>
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody>{asset ? <DrawerPrimAssetFacts assetId={asset.id} /> : null}</DrawerBody>
        </DrawerContent>
      </div>
    </Drawer>
  );
}

function DrawerPrimBottomSheet() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline">Open actions sheet</Button>} />
      <DrawerContent side="bottom" size="sm" className="mx-auto max-w-lg">
        <DrawerHeader>
          <DrawerTitle>Alarm 4812 actions</DrawerTitle>
          <DrawerDescription>A bottom sheet keeps the actions in thumb reach on a narrow screen.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <div className="flex flex-col gap-2">
            <DrawerClose render={<Button variant="secondary" className="w-full">Acknowledge alarm</Button>} />
            <DrawerClose render={<Button variant="secondary" className="w-full">Create work order</Button>} />
            <DrawerClose render={<Button variant="ghost" className="w-full">Cancel</Button>} />
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerPrimNavigation() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline">Open menu</Button>} />
      <DrawerContent side="left" size="sm" closeButtonLabel="Close menu">
        <DrawerHeader>
          <DrawerTitle>Nordkapp</DrawerTitle>
          <DrawerDescription>Gas processing plant</DrawerDescription>
        </DrawerHeader>
        <DrawerBody flush>
          <nav aria-label="Plant sections">
            <ul className="p-2">
              {NAV_ENTRIES.map((entry) => (
                <li key={entry}>
                  <DrawerClose render={<Button variant="ghost" className="w-full justify-start">{entry}</Button>} />
                </li>
              ))}
            </ul>
          </nav>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerPrimAssetDetail() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button>Open 1st stage compressor</Button>} />
      <DrawerContent size="md">
        <DrawerHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DrawerTitle>1st stage compressor</DrawerTitle>
            <StatusBadge status="running" />
          </div>
          <DrawerDescription>
            <span className="font-mono">23-KA-9101</span> · Gas compression
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <DrawerPrimAssetFacts assetId="23-ka-9101" />
          <section aria-label="Open work orders" className="flex flex-col gap-2 pt-5">
            <h3 className="text-sm font-medium text-base-foreground">Open work orders</h3>
            <ul className="flex flex-col gap-1 text-sm">
              {WORK_ORDERS.filter((order) => order.assetId === '23-ka-9101').map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-base-foreground">{order.title}</span>
                  <Badge variant="secondary">{order.priority}</Badge>
                </li>
              ))}
            </ul>
          </section>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost">Close</Button>} />
          <Button variant="secondary">Open in asset view</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerPrimAlarmDetail() {
  const alarm = ALARMS[0];
  const asset = findAsset(alarm.assetId);
  const order = WORK_ORDERS[0];
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="destructive">Open critical alarm</Button>} />
      <DrawerContent size="md">
        <DrawerHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DrawerTitle>{alarm.message}</DrawerTitle>
          </div>
          <DrawerDescription>
            <span className="font-mono">{alarm.id}</span> · raised {formatAgo(alarm.raisedAt, REFERENCE_NOW)}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <MetadataList
            items={[
              { label: 'Severity', value: <StatusIndicator {...severityStatus(alarm.severity)} /> },
              { label: 'Asset', value: `${asset?.name} (${asset?.tag})` },
              { label: 'Signal', value: <span className="font-mono">{alarm.sensorTag}</span> },
              { label: 'Value', value: <span className="tabular-nums">{alarm.value}</span> },
              { label: 'Trip limit', value: <span className="tabular-nums">{alarm.limit}</span> },
              { label: 'Linked work order', value: `${order.id} · ${findPerson(order.assigneeId)?.name}` },
            ]}
          />
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost">Close</Button>} />
          <Button variant="secondary">Shelve alarm</Button>
          <Button>Acknowledge alarm</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerPrimDestructiveFooter() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline">Open data set settings</Button>} />
      <DrawerContent size="md">
        <DrawerHeader>
          <DrawerTitle>Data set settings</DrawerTitle>
          <DrawerDescription>Nordkapp compressor telemetry</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <FormField label="Description">
            {(control) => <Textarea {...control} rows={4} defaultValue="Raw compressor telemetry from the historian." />}
          </FormField>
        </DrawerBody>
        <DrawerFooter className="justify-between">
          <Button variant="ghost">
            <IconTrash /> Delete data set
          </Button>
          <div className="flex items-center gap-2">
            <DrawerClose render={<Button variant="ghost">Cancel</Button>} />
            <DrawerClose render={<Button>Save settings</Button>} />
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default definePage({
  id: 'drawer',
  title: 'Drawer',
  summary:
    'A drawer slides in from an edge for filters, the detail of a selected record or a medium-length form, without leaving the page. Modal by default, or docked beside the content as an inspector.',
  guidance: {
    use: [
      'Detail of a selected row, filters and medium-length forms that support the main view.',
      'Right for detail and filters, left for navigation, bottom for actions on narrow screens.',
      'A sticky footer for the actions of an editable drawer, so Save is never below the fold.',
      'Non-modal and docked when people need to keep working in the list beside it.',
    ],
    avoid: [
      'Tasks that need full attention or several steps; use a dialog or a page.',
      'Very short content; use a popover or show it inline.',
      'Closing while a save is in flight; block it and say why.',
      'Stacking more than two drawers; the second should return to the first.',
    ],
  },
  source,
  sections: [
    {
      id: 'sides',
      title: 'Sides',
      description: 'Which edge the drawer is attached to.',
      specimens: [
        { id: 'DrawerPrimRight', title: 'Right', note: 'The default for record detail and filters: the list stays visible on the left.', origin: 'custom', uses: ['primitives/drawer/DrawerContent.tsx'], Component: DrawerPrimRight },
        { id: 'DrawerPrimLeft', title: 'Left', note: 'Navigation and scoping that belongs at the start of the reading direction.', origin: 'custom', uses: ['primitives/drawer/DrawerContent.tsx'], Component: DrawerPrimLeft },
        { id: 'DrawerPrimTop', title: 'Top', note: 'Short banners and notices that push down from the header.', origin: 'custom', uses: ['primitives/drawer/DrawerContent.tsx'], Component: DrawerPrimTop },
        { id: 'DrawerPrimBottom', title: 'Bottom', note: 'A sheet of facts or actions that stays near the thumb on narrow screens.', origin: 'custom', uses: ['primitives/drawer/DrawerContent.tsx'], Component: DrawerPrimBottom },
      ],
    },
    {
      id: 'sizes',
      title: 'Sizes',
      description: 'Width for side drawers; height for top and bottom ones.',
      specimens: [
        { id: 'DrawerPrimSizeSmall', title: 'Small', note: 'A few fields or one facts list; filters usually fit here.', origin: 'custom', uses: ['primitives/drawer/DrawerContent.tsx'], Component: DrawerPrimSizeSmall },
        { id: 'DrawerPrimSizeMedium', title: 'Medium', note: 'The default for a record with sections and a form.', origin: 'custom', uses: ['primitives/drawer/DrawerContent.tsx'], Component: DrawerPrimSizeMedium },
        { id: 'DrawerPrimSizeLarge', title: 'Large', note: 'Tabs, logs and tables that need more line length.', origin: 'custom', uses: ['primitives/drawer/DrawerContent.tsx'], Component: DrawerPrimSizeLarge },
        { id: 'DrawerPrimSizeFull', title: 'Full width', note: 'A focused review that should cover the page but stay dismissible.', origin: 'custom', uses: ['primitives/drawer/DrawerContent.tsx'], Component: DrawerPrimSizeFull },
      ],
    },
    {
      id: 'content',
      title: 'Content',
      description: 'What goes in the header, body and footer.',
      specimens: [
        { id: 'DrawerPrimForm', title: 'Form with sticky footer', note: 'An edit form: the body scrolls, Cancel and Save stay in view.', origin: 'custom', uses: ['primitives/drawer/DrawerContent.tsx', 'primitives/drawer/DrawerFooter.tsx', 'forms/FormField.tsx'], Component: DrawerPrimForm },
        { id: 'DrawerPrimRowDetail', title: 'Detail of a selected row', note: 'Open the record from a table row without losing the list behind the scrim.', origin: 'custom', size: 'md', align: 'stretch', uses: ['primitives/drawer/DrawerContent.tsx', 'display/MetadataList.tsx', 'industrial/StatusIndicator.tsx'], Component: DrawerPrimRowDetail },
        { id: 'DrawerPrimFilters', title: 'Filters', note: 'Many filters that would crowd a toolbar; apply them together from the footer.', origin: 'custom', uses: ['primitives/drawer/DrawerContent.tsx', 'forms/FormField.tsx'], Component: DrawerPrimFilters },
        { id: 'DrawerPrimTabs', title: 'With tabs', note: 'A record with parallel views; the tabs sit under the header and the body scrolls.', origin: 'custom', uses: ['primitives/drawer/DrawerContent.tsx', 'display/StatusBadge.tsx'], Component: DrawerPrimTabs },
        { id: 'DrawerPrimLongContent', title: 'Scrollable long content', note: 'Procedures and permits: the body scrolls, the actions stay in view.', origin: 'custom', uses: ['primitives/drawer/DrawerBody.tsx'], Component: DrawerPrimLongContent },
        { id: 'DrawerPrimStatusHeader', title: 'Status in the header', note: 'Show the state next to the title when it is the first thing to know.', origin: 'custom', uses: ['primitives/drawer/DrawerHeader.tsx', 'display/StatusBadge.tsx'], Component: DrawerPrimStatusHeader },
        { id: 'DrawerPrimNavigation', title: 'Navigation list', note: 'Section links in a left drawer on narrow screens; choosing one closes it.', origin: 'custom', uses: ['primitives/drawer/DrawerContent.tsx'], Component: DrawerPrimNavigation },
      ],
    },
    {
      id: 'states',
      title: 'States and guards',
      description: 'Keeping people from losing work.',
      specimens: [
        { id: 'DrawerPrimBlockedWhileSaving', title: 'Blocked while saving', note: 'Escape, the scrim and Cancel pause for the seconds a save is in flight.', origin: 'custom', uses: ['primitives/drawer/Drawer.tsx', 'primitives/drawer/DrawerClose.tsx'], Component: DrawerPrimBlockedWhileSaving },
        { id: 'DrawerPrimUnsavedGuard', title: 'Unsaved-changes guard', note: 'Closing a dirty form asks before it discards, with an alert dialog.', origin: 'custom', uses: ['primitives/drawer/Drawer.tsx', 'primitives/alert-dialog/AlertDialog.tsx'], Component: DrawerPrimUnsavedGuard },
        { id: 'DrawerPrimNested', title: 'Nested and stacked', note: 'Open a related record from inside a drawer; the first shifts back and Back returns.', origin: 'custom', uses: ['primitives/drawer/DrawerContent.tsx'], Component: DrawerPrimNested },
        { id: 'DrawerPrimDestructiveFooter', title: 'Destructive action in the footer', note: 'Keep Delete apart from Save, on the opposite side of the footer.', origin: 'custom', uses: ['primitives/drawer/DrawerFooter.tsx'], Component: DrawerPrimDestructiveFooter },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Drawers in believable plant screens.',
      specimens: [
        { id: 'DrawerPrimInspectorBeside', title: 'Non-modal inspector beside content', note: 'People keep selecting in the list while the inspector follows; no scrim, no trap.', origin: 'custom', size: 'full', align: 'stretch', uses: ['primitives/drawer/DrawerContent.tsx', 'primitives/drawer/Drawer.tsx'], Component: DrawerPrimInspectorBeside },
        { id: 'DrawerPrimBottomSheet', title: 'Bottom sheet for narrow screens', note: 'Actions on one alarm, reachable with a thumb.', origin: 'custom', uses: ['primitives/drawer/DrawerContent.tsx'], Component: DrawerPrimBottomSheet },
        { id: 'DrawerPrimAssetDetail', title: 'Asset detail', note: 'Facts, readings and open work in one place, with a way into the full view.', origin: 'custom', uses: ['primitives/drawer/DrawerContent.tsx', 'display/MetadataList.tsx', 'display/StatusBadge.tsx'], Component: DrawerPrimAssetDetail },
        { id: 'DrawerPrimAlarmDetail', title: 'Alarm detail', note: 'What tripped, how far past the limit and the work already raised, with acknowledge in reach.', origin: 'custom', uses: ['primitives/drawer/DrawerContent.tsx', 'industrial/StatusIndicator.tsx', 'display/MetadataList.tsx'], Component: DrawerPrimAlarmDetail },
      ],
    },
  ],
});
