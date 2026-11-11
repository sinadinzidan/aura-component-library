import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { Kbd } from '@cognite/aura/components/kbd';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { Slider } from '@cognite/aura/components/slider';
import { Switch } from '@cognite/aura/components/switch';
import { Textarea } from '@cognite/aura/components/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconDownload, IconTrash } from '@cognite/aura/icons';
import { useReducer, useState } from 'react';


import { MetadataList } from '../../../library/display/MetadataList';
import { LabelledProgress } from '../../../library/feedback/LabelledProgress';
import { FormField } from '../../../library/forms/FormField';
import { DistributionBar } from '../../../library/industrial/operations/DistributionBar';
import { WorkOrderRow } from '../../../library/industrial/operations/WorkOrderRow';
import { RadialGauge } from '../../../library/industrial/RadialGauge';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { TONE_TEXT } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { AnnotationCanvas } from '../../../library/industrial/vision/AnnotationCanvas';
import { annotationReducer, createAnnotationState, describeShape } from '../../../library/industrial/vision/annotations';
import { CameraFrame } from '../../../library/industrial/vision/CameraFrame';
import { CameraTile } from '../../../library/industrial/vision/CameraTile';
import type { CameraStatus } from '../../../library/industrial/vision/CameraTile';
import { CompareSlider } from '../../../library/industrial/vision/CompareSlider';
import { DetectionOverlay } from '../../../library/industrial/vision/DetectionOverlay';
import type { Detection } from '../../../library/industrial/vision/detections';
import { detectionReducer, filterByConfidence, formatConfidence, reviewCounts, statusOf } from '../../../library/industrial/vision/detections';
import { nearestMark, stamp } from '../../../library/industrial/vision/frameTime';
import { FrameTimeline } from '../../../library/industrial/vision/FrameTimeline';
import { PTZ_HOME, ptzReducer } from '../../../library/industrial/vision/ptz';
import type { PtzPreset } from '../../../library/industrial/vision/ptz';
import { PtzControls } from '../../../library/industrial/vision/PtzControls';
import { hottestSpot } from '../../../library/industrial/vision/thermal';
import type { HeatSpot } from '../../../library/industrial/vision/thermal';
import { ThermalFrame } from '../../../library/industrial/vision/ThermalFrame';
import { PagePreview } from '../../../library/industrial/workflows/PagePreview';
import { ALARMS, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, formatDateTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './camera-and-inspection.tsx?raw';

type CameraSpec = {
  id: string;
  name: string;
  tag: string;
  scene: string;
  status: CameraStatus;
  health: { label: string; tone: Tone };
  stateDetail?: string;
  night?: boolean;
};

const CAMERAS: readonly CameraSpec[] = [
  { id: 'c1', name: 'Compressor hall, west', tag: '23-CAM-0101', scene: 'compressor-hall', status: 'live', health: { label: 'Healthy', tone: 'success' } },
  { id: 'c2', name: 'Separator yard', tag: '20-CAM-0201', scene: 'separator-yard', status: 'live', health: { label: 'Healthy', tone: 'success' } },
  { id: 'c3', name: 'Flare stack', tag: '20-CAM-0210', scene: 'flare', status: 'recorded', health: { label: 'Healthy', tone: 'success' } },
  { id: 'c4', name: 'Export pump bay', tag: '27-CAM-0301', scene: 'pump-bay', status: 'offline', stateDetail: 'Since 11:42, 2 h 18 min', health: { label: 'Power lost', tone: 'critical' } },
  { id: 'c5', name: 'Cooler deck', tag: '23-CAM-0112', scene: 'cooler-deck', status: 'no-signal', stateDetail: 'Last frame 13:58', health: { label: 'Link degraded', tone: 'warning' } },
  { id: 'c6', name: 'Substation yard', tag: '40-CAM-0401', scene: 'substation', status: 'live', night: true, health: { label: 'Lens dirty', tone: 'warning' } },
];

const camera = (id: string): CameraSpec => CAMERAS.find((candidate) => candidate.id === id) ?? CAMERAS[0];
const NOW_STAMP = stamp(REFERENCE_NOW);

function CameraInspectTileOf({ spec, selected, onSelect }: { spec: CameraSpec; selected?: boolean; onSelect?: () => void }) {
  return (
    <CameraTile
      name={spec.name}
      tag={spec.tag}
      scene={spec.scene}
      status={spec.status}
      timestamp={spec.status === 'recorded' ? stamp(REFERENCE_NOW - 3 * HOUR) : NOW_STAMP}
      health={spec.health}
      stateDetail={spec.stateDetail}
      mode={spec.night ? 'night' : 'day'}
      selected={selected}
      onSelect={onSelect}
    />
  );
}

function CameraInspectTileLive() {
  return <CameraInspectTileOf spec={camera('c1')} />;
}

function CameraInspectTileRecorded() {
  return <CameraInspectTileOf spec={camera('c3')} />;
}

function CameraInspectTileOffline() {
  return <CameraInspectTileOf spec={camera('c4')} />;
}

function CameraInspectTileNoSignal() {
  return <CameraInspectTileOf spec={camera('c5')} />;
}

function CameraInspectTileNight() {
  return <CameraInspectTileOf spec={camera('c6')} />;
}

function CameraInspectAlarmLinked() {
  const alarm = ALARMS.find((candidate) => candidate.id === 'alm-4811');
  const spec = camera('c1');
  return (
    <CameraTile
      name={spec.name}
      tag={spec.tag}
      scene={spec.scene}
      status="live"
      timestamp={NOW_STAMP}
      health={{ label: alarm ? `Alarm ${alarm.sensorTag}` : 'Alarm', tone: 'warning' }}
    >
      <span className="absolute right-2 top-2 flex items-center gap-1.5 rounded-xs bg-warning-background px-1.5 py-1 text-xs font-medium leading-none text-warning-foreground">
        <StatusDot tone="warning" shape="square" size="sm" />
        {alarm?.message ?? 'Alarm'}
      </span>
    </CameraTile>
  );
}

function CameraInspectFleetStatus() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">Camera fleet</span>
        <span className="text-xs text-muted-foreground tabular-nums">Nordkapp plant · 6 cameras</span>
      </div>
      <DistributionBar
        label="Cameras by state"
        segments={[
          { id: 'live', label: 'Live', value: 3, tone: 'success' },
          { id: 'recorded', label: 'Recorded', value: 1, tone: 'neutral' },
          { id: 'no-signal', label: 'No signal', value: 1, tone: 'warning' },
          { id: 'offline', label: 'Offline', value: 1, tone: 'critical' },
        ]}
      />
    </div>
  );
}

function CameraInspectGridTwoByTwo() {
  const [selected, setSelected] = useState('c1');
  const shown = ['c1', 'c2', 'c3', 'c6'];
  return (
    <div className="flex w-full flex-col gap-3">
      <ul aria-label="Cameras" className="grid grid-cols-2 gap-2">
        {shown.map((id) => (
          <li key={id}>
            <CameraInspectTileOf spec={camera(id)} selected={id === selected} onSelect={() => setSelected(id)} />
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="text-xs text-muted-foreground">
        Selected: {camera(selected).name}
      </p>
    </div>
  );
}

function CameraInspectGridFocus() {
  const [selected, setSelected] = useState('c1');
  const main = camera(selected);
  const others = CAMERAS.filter((spec) => spec.id !== selected);
  return (
    <div className="grid w-full grid-cols-3 gap-3" data-slot="focus-grid">
      <div className="col-span-2 row-span-2 flex min-h-0 flex-col gap-2" data-slot="focus-camera">
        <CameraFrame
          scene={main.scene}
          label={`${main.name}, focused camera, ${main.status}`}
          timestamp={NOW_STAMP}
          caption={`${main.tag} · ${main.name}`}
          mode={main.night ? 'night' : 'day'}
          className="aspect-auto h-full min-h-0 flex-1"
        />
      </div>
      {others.map((spec) => (
        <div key={spec.id} className="min-w-0">
          <CameraInspectTileOf spec={spec} onSelect={() => setSelected(spec.id)} />
        </div>
      ))}
    </div>
  );
}

const PTZ_PRESETS: readonly PtzPreset[] = [
  { id: 'overview', name: 'Overview', state: PTZ_HOME },
  { id: 'pump-a', name: 'Pump A', state: { pan: -40, tilt: -5, zoom: 3 } },
  { id: 'pump-b', name: 'Pump B', state: { pan: 40, tilt: -5, zoom: 3 } },
];

function CameraInspectPtz() {
  const [view, dispatch] = useReducer(ptzReducer, PTZ_HOME);
  return (
    <div className="flex w-full flex-col gap-4">
      <CameraFrame scene="pump-bay" label={`Export pump bay camera, pan ${view.pan} degrees, tilt ${view.tilt} degrees, zoom ${view.zoom} times`} timestamp={NOW_STAMP} caption="27-CAM-0301" view={view} />
      <PtzControls state={view} dispatch={dispatch} presets={PTZ_PRESETS} />
    </div>
  );
}

const TIMELINE_FROM = REFERENCE_NOW - HOUR;
const TIMELINE_MARKS = [
  { id: 'e1', at: REFERENCE_NOW - 48 * MINUTE, label: 'Motion', tone: 'neutral' as const },
  { id: 'e2', at: REFERENCE_NOW - 31 * MINUTE, label: 'Person in area', tone: 'info' as const },
  { id: 'e3', at: REFERENCE_NOW - 17 * MINUTE, label: 'Alarm 23-TT-92532', tone: 'warning' as const },
];

function CameraInspectTimeline() {
  const [time, setTime] = useState(REFERENCE_NOW - 31 * MINUTE);
  const mark = nearestMark(TIMELINE_MARKS, time, 90_000);
  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <CameraFrame scene="compressor-hall" label={`Compressor hall, recorded ${stamp(time)}${mark ? `, event: ${mark.label}` : ''}`} timestamp={stamp(time)} caption="23-CAM-0101 · Recorded">
        {mark ? (
          <span className="absolute right-2 top-2 rounded-xs bg-info-background px-1.5 py-1 text-xs font-medium leading-none text-info-foreground">{mark.label}</span>
        ) : null}
      </CameraFrame>
      <FrameTimeline from={TIMELINE_FROM} to={REFERENCE_NOW} value={time} onValueChange={setTime} marks={TIMELINE_MARKS} format={(value) => stamp(value).slice(-8)} label="Recording position" />
    </div>
  );
}

function CameraInspectCompare() {
  return (
    <div className="flex w-full flex-col gap-2">
      <CompareSlider
        label="Export pump bay before and after the coupling guard was fitted"
        beforeLabel="12 Feb"
        afterLabel="12 Mar"
        initial={0.3}
        before={<CameraFrame scene="pump-bay" label="Export pump bay on 12 February, coupling exposed" timestamp="12 Feb 2026 09:14:00" />}
        after={
          <CameraFrame scene="pump-bay" label="Export pump bay on 12 March, coupling guard fitted" timestamp="12 Mar 2026 09:20:00">
            <span aria-hidden="true" className="absolute left-[68%] top-[44%] h-[26%] w-[16%] rounded-xs border-2 border-success-foreground-strong" />
          </CameraFrame>
        }
      />
      <p className="text-xs text-muted-foreground">Drag the handle, click the frame, or focus the handle and use the arrow keys. Shift or Page keys take bigger steps.</p>
    </div>
  );
}

function CameraInspectPrivacy() {
  return (
    <div className="flex w-full flex-col gap-3">
      <CameraFrame scene="separator-yard" label="Separator yard camera with the neighbouring building masked" timestamp={NOW_STAMP} caption="20-CAM-0201" masks={[{ x: 0.66, y: 0.12, w: 0.24, h: 0.36 }]} />
      <MetadataList
        items={[
          { label: 'Masked zones', value: '1 of 4 allowed' },
          { label: 'Applied', value: 'On the camera, before recording' },
          { label: 'Changed by', value: 'Site security, 3 Feb 2026' },
        ]}
      />
      <p className="text-xs text-muted-foreground">Masked areas are blanked at source. Recordings, snapshots and exports never contain them, and a mask cannot be removed from this view.</p>
    </div>
  );
}

const ANNOTATION_SEED = [
  { id: 'a1', label: 'Corrosion', shape: { kind: 'rect', x: 0.58, y: 0.44, w: 0.16, h: 0.26 } },
  { id: 'a2', label: 'Gauge 20-PI-1002', shape: { kind: 'point', x: 0.3, y: 0.38 } },
] as const;

function CameraInspectAnnotate() {
  const [state, dispatch] = useReducer(annotationReducer, ANNOTATION_SEED, (items) => createAnnotationState(items));
  const selected = state.items.find((item) => item.id === state.selectedId);
  return (
    <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <AnnotationCanvas state={state} dispatch={dispatch} defaultLabel="Defect">
        <CameraFrame scene="separator-yard" label="Separator yard frame to annotate" timestamp="12 Mar 2026 13:41:12" caption="20-CAM-0201" />
      </AnnotationCanvas>
      <section aria-label="Annotations" className="flex min-w-0 flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-base-foreground">Annotations</span>
          <span className="text-xs text-muted-foreground tabular-nums">{state.items.length}</span>
        </div>
        {state.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing marked yet. Draw a rectangle round a defect, or place a point on a gauge.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {state.items.map((item) => (
              <li key={item.id} className="flex items-center gap-1">
                <Button variant={item.id === state.selectedId ? 'secondary' : 'ghost'} size="sm" className="min-w-0 flex-1 justify-start" aria-pressed={item.id === state.selectedId} onClick={() => dispatch({ type: 'select', id: item.id })}>
                  <span className="truncate">{item.label}</span>
                  <span className="ml-auto shrink-0 text-xs font-normal text-muted-foreground">{item.shape.kind === 'rect' ? 'Rectangle' : 'Point'}</span>
                </Button>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label={`Delete ${item.label}`} onClick={() => dispatch({ type: 'delete', id: item.id })}>
                        <IconTrash />
                      </Button>
                    }
                  />
                  <TooltipContent>Delete {item.label}</TooltipContent>
                </Tooltip>
              </li>
            ))}
          </ul>
        )}
        {selected ? (
          <FormField label="Label" helper={describeShape(selected.shape)}>
            {(control) => (
              <Input
                {...control}
                key={selected.id}
                defaultValue={selected.label}
                onBlur={(event) => dispatch({ type: 'rename', id: selected.id, label: event.target.value.trim() || 'Unlabelled' })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                }}
              />
            )}
          </FormField>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Keyboard: <Kbd>R</Kbd> rectangle, <Kbd>P</Kbd> point, arrows move, <Kbd>Alt</Kbd> + arrows resize, <Kbd>Delete</Kbd> removes, <Kbd>Ctrl</Kbd> + <Kbd>Z</Kbd> undoes.
        </p>
      </section>
    </div>
  );
}

const DEFECT_TYPES = [
  { value: 'corrosion', label: 'Corrosion' },
  { value: 'leak', label: 'Leak' },
  { value: 'crack', label: 'Crack' },
  { value: 'guard', label: 'Missing guard' },
  { value: 'insulation', label: 'Insulation damage' },
];

function CameraInspectDefectForm() {
  const [type, setType] = useState('corrosion');
  const [severity, setSeverity] = useState('major');
  const [size, setSize] = useState('120');
  const [saved, setSaved] = useState<string | null>(null);
  const sizeValue = Number(size);
  const invalid = size.trim() === '' || !Number.isFinite(sizeValue) || sizeValue <= 0;
  const typeLabel = DEFECT_TYPES.find((item) => item.value === type)?.label ?? type;

  return (
    <form
      className="flex w-full max-w-md flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(invalid ? null : `${typeLabel}, ${severity}, ${sizeValue} mm, tagged on 20-VA-1001`);
      }}
    >
      <FormField label="Defect type" required>
        {(control) => (
          <Select items={DEFECT_TYPES} value={type} onValueChange={(next) => typeof next === 'string' && setType(next)}>
            <SelectTrigger {...control} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEFECT_TYPES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-base-foreground">Severity</span>
        <SegmentedControl
          value={severity}
          onValueChange={(next: unknown) => {
            if (typeof next === 'string') setSeverity(next);
          }}
        >
          <SegmentedControlList aria-label="Severity">
            <SegmentedControlButton value="minor" tabContent="label-only">
              Minor
            </SegmentedControlButton>
            <SegmentedControlButton value="major" tabContent="label-only">
              Major
            </SegmentedControlButton>
            <SegmentedControlButton value="critical" tabContent="label-only">
              Critical
            </SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
      </div>
      <FormField label="Largest dimension, mm" required helper="Measure against the scale in the frame." error={invalid ? 'Enter a size above 0.' : undefined}>
        {(control) => <Input {...control} inputMode="decimal" value={size} onChange={(event) => setSize(event.target.value)} />}
      </FormField>
      <FormField label="Note" optional>
        {(control) => <Textarea {...control} rows={2} defaultValue="Coating blistered along the lower weld seam." />}
      </FormField>
      <div className="flex items-center gap-3">
        <Button type="submit">Tag defect</Button>
        {saved ? (
          <span role="status" className="text-sm text-medium-foreground">
            Saved: {saved}
          </span>
        ) : null}
      </div>
    </form>
  );
}

type CameraPhoto = { id: string; title: string; type: string; assetId: string; takenAt: number; severity: 'minor' | 'major' | 'critical'; byId: string };

const PHOTOS: readonly CameraPhoto[] = [
  { id: 'p1', title: 'Drive-end bearing housing', type: 'Corrosion', assetId: '23-ka-9103', takenAt: REFERENCE_NOW - 3 * HOUR, severity: 'major', byId: 'tb' },
  { id: 'p2', title: 'Seal flange, discharge side', type: 'Leak', assetId: '23-ka-9101', takenAt: REFERENCE_NOW - 1 * DAY, severity: 'critical', byId: 'tb' },
  { id: 'p3', title: 'Lagging on interstage cooler', type: 'Insulation', assetId: '23-ha-9114', takenAt: REFERENCE_NOW - 1 * DAY, severity: 'minor', byId: 'ms' },
  { id: 'p4', title: 'Coupling guard removed', type: 'Guarding', assetId: '27-pa-2001a', takenAt: REFERENCE_NOW - 2 * DAY, severity: 'major', byId: 'lw' },
  { id: 'p5', title: 'Inlet separator nozzle N3', type: 'Corrosion', assetId: '20-va-1001', takenAt: REFERENCE_NOW - 4 * DAY, severity: 'minor', byId: 'tb' },
  { id: 'p6', title: 'Pump base plate grout', type: 'Corrosion', assetId: '40-pa-4001', takenAt: REFERENCE_NOW - 6 * DAY, severity: 'minor', byId: 'ms' },
  { id: 'p7', title: 'Drain valve packing', type: 'Leak', assetId: '20-xv-1105', takenAt: REFERENCE_NOW - 7 * DAY, severity: 'minor', byId: 'jn' },
  { id: 'p8', title: 'Walkway handrail, deck 2', type: 'Guarding', assetId: 'nk-23', takenAt: REFERENCE_NOW - 9 * DAY, severity: 'major', byId: 'lw' },
];

const PHOTO_TYPES = ['All', 'Corrosion', 'Leak', 'Insulation', 'Guarding'];

function CameraInspectGallery() {
  const [type, setType] = useState('All');
  const [seriousOnly, setSeriousOnly] = useState(false);
  const shown = PHOTOS.filter((photo) => (type === 'All' || photo.type === type) && (!seriousOnly || photo.severity !== 'minor'));
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          value={type}
          onValueChange={(next: unknown) => {
            if (typeof next === 'string') setType(next);
          }}
        >
          <SegmentedControlList aria-label="Defect type" size="small">
            {PHOTO_TYPES.map((item) => (
              <SegmentedControlButton key={item} value={item} size="small" tabContent="label-only">
                {item}
              </SegmentedControlButton>
            ))}
          </SegmentedControlList>
        </SegmentedControl>
        <Switch label="Major and critical only" checked={seriousOnly} onCheckedChange={(checked) => setSeriousOnly(checked)} />
      </div>
      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-muted-background px-6 py-10 text-center">
          <p className="text-sm font-medium text-base-foreground">No photos match these filters</p>
          <p className="text-sm text-muted-foreground">Try another defect type or include minor findings.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setType('All');
              setSeriousOnly(false);
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <ul aria-label={`${shown.length} inspection photos`} className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {shown.map((photo) => {
            const asset = findAsset(photo.assetId);
            const tone: Tone = photo.severity === 'critical' ? 'critical' : photo.severity === 'major' ? 'warning' : 'neutral';
            return (
              <li key={photo.id} className="flex min-w-0 flex-col gap-1.5">
                <PagePreview kind="photo" label={`Photo: ${photo.title}`} caption={photo.type} />
                <span className="truncate text-sm font-medium text-base-foreground">{photo.title}</span>
                <span className="truncate font-mono text-xs text-muted-foreground">{asset?.tag ?? photo.assetId}</span>
                <div className="flex items-center justify-between gap-2">
                  <StatusIndicator tone={tone} shape={photo.severity === 'critical' ? 'diamond' : photo.severity === 'major' ? 'square' : 'ring'} label={photo.severity === 'critical' ? 'Critical' : photo.severity === 'major' ? 'Major' : 'Minor'} size="sm" />
                  <span className="text-xs text-muted-foreground tabular-nums">{formatDateTime(photo.takenAt)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CameraInspectPhotoDetail() {
  const photo = PHOTOS[0];
  const asset = findAsset(photo.assetId);
  const by = findPerson(photo.byId);
  const order = WORK_ORDERS.find((candidate) => candidate.id === 'WO-104482');
  const assignee = findPerson(order?.assigneeId ?? null);
  return (
    <div className="flex w-full flex-col gap-4">
      <PagePreview kind="photo" label={`Photo: ${photo.title}, ${asset?.tag}`} caption={`${photo.type} · ${photo.title}`} />
      <MetadataList
        items={[
          { label: 'Taken', value: formatDateTime(photo.takenAt) },
          { label: 'By', value: by ? `${by.name}, ${by.role.toLowerCase()}` : undefined },
          { label: 'Device', value: 'Handheld camera, 12 MP' },
          { label: 'Asset', value: asset ? <span><span className="font-mono">{asset.tag}</span> {asset.name}</span> : undefined },
          { label: 'Finding', value: 'Corrosion, major, 120 mm' },
        ]}
      />
      {order ? (
        <ul aria-label="Linked work order">
          <WorkOrderRow
            order={order}
            assetTag={asset?.tag}
            assetName={asset?.name}
            due={formatDateTime(order.dueAt)}
            assignee={assignee ? { id: assignee.id, name: assignee.name, initials: assignee.initials } : undefined}
            density="compact"
          />
        </ul>
      ) : null}
    </div>
  );
}

const THERMAL_SPOTS: readonly HeatSpot[] = [
  { id: 'brg', label: 'Bearing DE', x: 0.3, y: 0.52, peak: 92, radius: 0.09 },
  { id: 'cpl', label: 'Coupling', x: 0.52, y: 0.5, peak: 71, radius: 0.08 },
  { id: 'cas', label: 'Casing', x: 0.74, y: 0.48, peak: 58, radius: 0.11 },
];
const THERMAL_LIMIT = 85;

function CameraInspectThermal() {
  const [selected, setSelected] = useState<string | null>('brg');
  const hottest = hottestSpot(THERMAL_SPOTS);
  return (
    <div className="flex w-full flex-col gap-4">
      <ThermalFrame
        label={`Thermal image of the compressor, ${hottest?.label} hottest at ${hottest?.peak} degrees Celsius, above the ${THERMAL_LIMIT} degree limit`}
        spots={THERMAL_SPOTS}
        min={30}
        max={100}
        ambient={32}
        readouts={THERMAL_SPOTS.map((spot) => spot.id)}
        highlightId={selected}
      />
      <ul aria-label="Spot readings" className="flex flex-col gap-1">
        {THERMAL_SPOTS.map((spot) => {
          const over = spot.peak > THERMAL_LIMIT;
          return (
            <li key={spot.id}>
              <Button variant={selected === spot.id ? 'secondary' : 'ghost'} size="sm" className="w-full justify-between" aria-pressed={selected === spot.id} onClick={() => setSelected(selected === spot.id ? null : spot.id)}>
                <span>{spot.label}</span>
                <span className="flex items-center gap-3">
                  {over ? <span className={`text-xs font-medium ${TONE_TEXT.warning}`}>Above {THERMAL_LIMIT} °C limit</span> : null}
                  <ValueReadout value={spot.peak} unit="°C" decimals={1} size="xs" tone={over ? 'warning' : 'neutral'} />
                </span>
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const DETECTIONS: readonly Detection[] = [
  { id: 'd1', label: 'Corrosion', confidence: 0.93, box: { x: 0.62, y: 0.34, w: 0.18, h: 0.3 } },
  { id: 'd2', label: 'Missing guard', confidence: 0.78, box: { x: 0.13, y: 0.38, w: 0.2, h: 0.28 } },
  { id: 'd3', label: 'Leak', confidence: 0.58, box: { x: 0.44, y: 0.74, w: 0.12, h: 0.14 } },
  { id: 'd4', label: 'Person', confidence: 0.52, box: { x: 0.84, y: 0.5, w: 0.08, h: 0.3 } },
];

function CameraInspectDetections() {
  const [review, dispatch] = useReducer(detectionReducer, {});
  const [minimum, setMinimum] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>('d1');
  const shown = filterByConfidence(DETECTIONS, minimum / 100);
  const counts = reviewCounts(shown, review);
  return (
    <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-3">
        <CameraFrame scene="separator-yard" label={`Separator yard frame with ${shown.length} AI detections at ${minimum} percent confidence or above`} timestamp="12 Mar 2026 13:41:12" caption="20-CAM-0201">
          <DetectionOverlay detections={shown} review={review} selectedId={selectedId} onSelect={setSelectedId} />
        </CameraFrame>
        <div className="flex items-center gap-4">
          <span className="shrink-0 text-sm text-base-foreground">Minimum confidence</span>
          <Slider aria-label="Minimum confidence" min={40} max={100} step={1} value={[minimum]} onValueChange={(next) => setMinimum(next[0] ?? 50)} />
          <span className="w-12 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{minimum} %</span>
        </div>
      </div>
      <section aria-label="Review detections" className="flex min-w-0 flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-base-foreground">{shown.length} detections</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {counts.pending} to review · {counts.accepted} accepted · {counts.rejected} rejected
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {shown.map((detection) => {
            const status = statusOf(review, detection.id);
            return (
              <li key={detection.id} className="flex items-center gap-2">
                <Button variant={detection.id === selectedId ? 'secondary' : 'ghost'} size="sm" className="min-w-0 flex-1 justify-start" aria-pressed={detection.id === selectedId} onClick={() => setSelectedId(detection.id)}>
                  <span className="truncate">{detection.label}</span>
                  <span className="ml-auto shrink-0 text-xs font-normal text-muted-foreground tabular-nums">{formatConfidence(detection.confidence)}</span>
                </Button>
                {status === 'pending' ? (
                  <>
                    <Button variant="outline" size="sm" aria-label={`Accept ${detection.label}`} onClick={() => dispatch({ type: 'accept', id: detection.id })}>
                      Accept
                    </Button>
                    <Button variant="ghost" size="sm" aria-label={`Reject ${detection.label}`} onClick={() => dispatch({ type: 'reject', id: detection.id })}>
                      Reject
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-medium text-medium-foreground">{status === 'accepted' ? 'Accepted' : 'Rejected'}</span>
                    <Button variant="ghost" size="sm" aria-label={`Undo review of ${detection.label}`} onClick={() => dispatch({ type: 'reset', id: detection.id })}>
                      Undo
                    </Button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
        {shown.length === 0 ? <p className="text-sm text-muted-foreground">Nothing at this confidence. Lower the minimum to see weaker detections.</p> : null}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" disabled={counts.pending === 0} onClick={() => dispatch({ type: 'accept-all', ids: shown.map((item) => item.id) })}>
            Accept all remaining
          </Button>
          <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'clear' })}>
            Reset review
          </Button>
        </div>
      </section>
    </div>
  );
}

function CameraInspectGaugeReading() {
  const [accepted, setAccepted] = useState(false);
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-5">
        <div role="img" aria-label="Cropped frame of pressure gauge 23-PI-9211" className="flex shrink-0 items-center justify-center rounded-lg bg-muted-background p-3">
          <RadialGauge label="Gauge 23-PI-9211" value={48.4} min={0} max={60} unit="barg" decimals={1} limits={{ high: 52, highHigh: 55 }} size="md" showLabel={false} />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Read from image</span>
          <ValueReadout value={48.4} unit="barg" decimals={1} size="md" />
          <span className="text-xs text-muted-foreground tabular-nums">Confidence 94 %</span>
        </div>
      </div>
      <MetadataList
        items={[
          { label: 'Gauge', value: <span className="font-mono">23-PI-9211</span> },
          { label: 'Transmitter 23-PT-92531', value: '48.6 barg' },
          { label: 'Difference', value: '−0.2 barg, within ±1.0' },
        ]}
      />
      <div className="flex items-center gap-3">
        <Button disabled={accepted} onClick={() => setAccepted(true)}>
          Accept reading
        </Button>
        <Button variant="outline" disabled={accepted}>
          Enter manually
        </Button>
        {accepted ? (
          <span role="status" className="text-sm text-medium-foreground">
            Reading saved to the round
          </span>
        ) : null}
      </div>
    </div>
  );
}

const FLAME_TREND = makeValues({ seed: 52, points: 36, base: 14, amplitude: 2, noise: 1.2, cycles: 3, stepMs: 10 * MINUTE, decimals: 1 });

function CameraInspectLeakFlare() {
  return (
    <div className="flex w-full flex-col gap-3">
      <CameraFrame scene="flare" label="Flare stack camera: pilot lit, no smoke" timestamp={NOW_STAMP} caption="20-CAM-0210" />
      <ul aria-label="Flare monitoring" className="flex flex-col gap-2 text-sm">
        <li className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Pilot flame</span>
          <StatusIndicator tone="success" label="Lit" size="sm" />
        </li>
        <li className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Smoke index</span>
          <span className="tabular-nums text-base-foreground">1 of 5</span>
        </li>
        <li className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Gas cloud near deck</span>
          <StatusIndicator tone="success" label="None detected" size="sm" />
        </li>
      </ul>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Flame area, last 6 hours</span>
        <Sparkline values={FLAME_TREND} label="Flame area in the frame, last 6 hours" unit="%" variant="area" height={40} />
      </div>
    </div>
  );
}

const EXPORTS = [
  { id: 'x1', name: 'Compressor hall, west', range: '12 Mar 13:00 to 14:00', size: '482 MB', state: 'ready' as const },
  { id: 'x2', name: 'Separator yard', range: '12 Mar 09:00 to 10:00', size: '455 MB', state: 'preparing' as const },
  { id: 'x3', name: 'Flare stack', range: '11 Mar 22:00 to 23:00', size: 'Failed', state: 'failed' as const },
];

function CameraInspectExport() {
  return (
    <ul aria-label="Recording exports" className="flex w-full flex-col divide-y divide-default">
      {EXPORTS.map((item) => (
        <li key={item.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-base-foreground">{item.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {item.range} · MP4 · {item.size}
              </span>
            </div>
            {item.state === 'ready' ? (
              <Button variant="outline" size="sm">
                <IconDownload /> Download
              </Button>
            ) : item.state === 'failed' ? (
              <div className="flex items-center gap-2">
                <StatusIndicator tone="critical" shape="diamond" label="Failed" size="sm" />
                <Button variant="outline" size="sm">
                  Retry export
                </Button>
              </div>
            ) : null}
          </div>
          {item.state === 'preparing' ? <LabelledProgress label="Preparing export" value={62} size="sm" hint="About 2 min left" /> : null}
        </li>
      ))}
    </ul>
  );
}

export default definePage({
  id: 'camera-and-inspection',
  title: 'Camera and inspection',
  summary:
    'Camera feeds and inspection evidence for a plant: tiles and grids in every state, PTZ control, a recorded-video scrubber, before/after comparison, image annotation, defect tagging, photo records, thermal frames, AI detections to review and gauge readings from images.',
  guidance: {
    use: [
      'Say the state of a camera in words and shape: live, recorded, offline and no signal each look different.',
      'Keep evidence connected: a photo or frame links to its asset, its time and the work order it started.',
      'Let people correct AI: show confidence, make accept and reject one click, and keep rejected boxes visible but dimmed.',
      'Give every pointer action a keyboard route, and announce what changed.',
    ],
    avoid: [
      'Black rectangles for cameras that are down. Say what is wrong and since when.',
      'Colour as the only sign of severity or review state.',
      'Letting a user remove a privacy mask from a viewing screen.',
    ],
  },
  source,
  sections: [
    {
      id: 'tiles',
      title: 'Camera tiles',
      description: 'One camera: its frame, name, state and health. Frames here are token-drawn placeholders for the real feed.',
      specimens: [
        {
          id: 'CameraInspectTileLive',
          title: 'Live camera',
          note: 'Pick it for a working feed: live badge, burned-in time stamp, health beneath.',
          origin: 'custom',
          uses: ['industrial/vision/CameraTile.tsx', 'industrial/vision/CameraFrame.tsx'],
          size: 'sm',
          align: 'stretch',
          Component: CameraInspectTileLive,
        },
        {
          id: 'CameraInspectTileRecorded',
          title: 'Recorded footage',
          note: 'Pick it when the tile plays back an earlier moment; the grey state and time stamp say so.',
          origin: 'custom',
          uses: ['industrial/vision/CameraTile.tsx'],
          size: 'sm',
          align: 'stretch',
          Component: CameraInspectTileRecorded,
        },
        {
          id: 'CameraInspectTileNight',
          title: 'Night and degraded health',
          note: 'Pick it for infra-red view; health says what to fix, here a dirty lens.',
          origin: 'custom',
          uses: ['industrial/vision/CameraTile.tsx'],
          size: 'sm',
          align: 'stretch',
          Component: CameraInspectTileNight,
        },
        {
          id: 'CameraInspectTileOffline',
          title: 'Camera offline',
          note: 'Pick it when the device is down: no black box, but the cause and how long.',
          origin: 'custom',
          uses: ['industrial/vision/CameraTile.tsx'],
          size: 'sm',
          align: 'stretch',
          Component: CameraInspectTileOffline,
        },
        {
          id: 'CameraInspectTileNoSignal',
          title: 'No signal',
          note: 'Pick it when the camera is on but the link is lost; the last good frame time helps.',
          origin: 'custom',
          uses: ['industrial/vision/CameraTile.tsx'],
          size: 'sm',
          align: 'stretch',
          Component: CameraInspectTileNoSignal,
        },
        {
          id: 'CameraInspectAlarmLinked',
          title: 'Alarm-linked camera',
          note: 'Pick it to put eyes on an alarm: the tile carries the alarm that pointed at this camera.',
          origin: 'custom',
          uses: ['industrial/vision/CameraTile.tsx', 'industrial/StatusDot.tsx'],
          size: 'sm',
          align: 'stretch',
          Component: CameraInspectAlarmLinked,
        },
      ],
    },
    {
      id: 'grids',
      title: 'Grids, PTZ and playback',
      description: 'Watching several cameras, steering one and scrubbing a recording.',
      specimens: [
        {
          id: 'CameraInspectFleetStatus',
          title: 'Fleet status',
          note: 'Pick it above a camera wall: how many are live, recorded, silent or down.',
          origin: 'custom',
          uses: ['industrial/operations/DistributionBar.tsx'],
          size: 'full',
          align: 'stretch',
          Component: CameraInspectFleetStatus,
        },
        {
          id: 'CameraInspectGridTwoByTwo',
          title: 'Grid, 2 × 2',
          note: 'Pick it for four cameras of equal weight; select one to focus it elsewhere.',
          origin: 'custom',
          uses: ['industrial/vision/CameraTile.tsx'],
          size: 'md',
          align: 'stretch',
          Component: CameraInspectGridTwoByTwo,
        },
        {
          id: 'CameraInspectPtz',
          title: 'PTZ controls',
          note: 'Pick it for steerable cameras: direction pad, zoom, presets and the position in words.',
          origin: 'custom',
          uses: ['industrial/vision/PtzControls.tsx', 'industrial/vision/ptz.ts', 'industrial/vision/CameraFrame.tsx'],
          size: 'md',
          align: 'stretch',
          Component: CameraInspectPtz,
        },
        {
          id: 'CameraInspectGridFocus',
          title: 'Grid, 1 + 5',
          note: 'Pick it for a control room: one camera large, the rest as a strip; click a small one to swap.',
          origin: 'custom',
          uses: ['industrial/vision/CameraTile.tsx'],
          size: 'full',
          align: 'stretch',
          Component: CameraInspectGridFocus,
        },
        {
          id: 'CameraInspectTimeline',
          title: 'Timeline scrubber',
          note: 'Pick it for recorded video: drag across the hour or jump to an event mark.',
          origin: 'custom',
          uses: ['industrial/vision/FrameTimeline.tsx', 'industrial/vision/frameTime.ts'],
          size: 'full',
          align: 'stretch',
          Component: CameraInspectTimeline,
        },
      ],
    },
    {
      id: 'review',
      title: 'Comparison and markup',
      description: 'Compare two moments, hide what must not be seen, and mark up a frame.',
      specimens: [
        {
          id: 'CameraInspectCompare',
          title: 'Before and after',
          note: 'Pick it to prove a repair: drag the divider, or use the arrow keys on the handle.',
          origin: 'custom',
          uses: ['industrial/vision/CompareSlider.tsx', 'industrial/vision/compareSlider.ts'],
          size: 'md',
          align: 'stretch',
          Component: CameraInspectCompare,
        },
        {
          id: 'CameraInspectPrivacy',
          title: 'Privacy mask',
          note: 'Pick it where a camera sees beyond the fence; masks are applied at source and cannot be lifted here.',
          origin: 'custom',
          uses: ['industrial/vision/CameraFrame.tsx', 'display/MetadataList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: CameraInspectPrivacy,
        },
        {
          id: 'CameraInspectAnnotate',
          title: 'Image annotation',
          note: 'Pick it to mark defects: draw rectangles and points, rename them, move and resize from the keyboard, undo.',
          origin: 'custom',
          uses: ['industrial/vision/AnnotationCanvas.tsx', 'industrial/vision/annotations.ts', 'industrial/vision/CameraFrame.tsx'],
          size: 'full',
          align: 'stretch',
          Component: CameraInspectAnnotate,
        },
      ],
    },
    {
      id: 'records',
      title: 'Inspection records',
      description: 'What an inspector saves: a tagged defect, a gallery of evidence, one photo with its links.',
      specimens: [
        {
          id: 'CameraInspectDefectForm',
          title: 'Defect tagging form',
          note: 'Pick it to turn a finding into a record: type, severity, size and a note, with validation.',
          origin: 'custom',
          uses: ['forms/FormField.tsx'],
          size: 'md',
          align: 'stretch',
          Component: CameraInspectDefectForm,
        },
        {
          id: 'CameraInspectPhotoDetail',
          title: 'Photo detail',
          note: 'Pick it for one piece of evidence: metadata, the asset and the work order it belongs to.',
          origin: 'custom',
          uses: ['industrial/workflows/PagePreview.tsx', 'industrial/operations/WorkOrderRow.tsx', 'display/MetadataList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: CameraInspectPhotoDetail,
        },
        {
          id: 'CameraInspectGallery',
          title: 'Photo gallery with filters',
          note: 'Pick it to browse evidence: filter by type and severity, with an empty state that offers a way out.',
          origin: 'custom',
          uses: ['industrial/workflows/PagePreview.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: CameraInspectGallery,
        },
      ],
    },
    {
      id: 'analysis',
      title: 'Analysis from images',
      description: 'Thermal frames, AI detections, instrument readings and flare monitoring.',
      specimens: [
        {
          id: 'CameraInspectThermal',
          title: 'Thermal frame',
          note: 'Pick it for hot-spot surveys: heat-map steps, labelled spots and a limit that is stated, not only coloured.',
          origin: 'custom',
          uses: ['industrial/vision/ThermalFrame.tsx', 'industrial/vision/thermal.ts', 'industrial/charts/HeatScaleLegend.tsx'],
          size: 'md',
          align: 'stretch',
          Component: CameraInspectThermal,
        },
        {
          id: 'CameraInspectGaugeReading',
          title: 'Gauge reading from image',
          note: 'Pick it when a camera reads a dial: value, confidence, cross-check against the transmitter, then accept.',
          origin: 'custom',
          uses: ['industrial/RadialGauge.tsx', 'display/MetadataList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: CameraInspectGaugeReading,
        },
        {
          id: 'CameraInspectDetections',
          title: 'AI detections to review',
          note: 'Pick it to keep people in the loop: boxes with confidence, a threshold, accept and reject.',
          origin: 'custom',
          uses: ['industrial/vision/DetectionOverlay.tsx', 'industrial/vision/detections.ts'],
          size: 'full',
          align: 'stretch',
          Component: CameraInspectDetections,
        },
        {
          id: 'CameraInspectLeakFlare',
          title: 'Leak and flare monitor',
          note: 'Pick it for a camera that judges for you: pilot, smoke and gas states with a flame-area trend.',
          origin: 'custom',
          uses: ['industrial/vision/CameraFrame.tsx', 'industrial/Sparkline.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: CameraInspectLeakFlare,
        },
        {
          id: 'CameraInspectExport',
          title: 'Recording export',
          note: 'Pick it for evidence requests: each export shows its range and size, then ready, preparing or failed.',
          origin: 'custom',
          uses: ['feedback/LabelledProgress.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: CameraInspectExport,
        },
      ],
    },
  ],
});
