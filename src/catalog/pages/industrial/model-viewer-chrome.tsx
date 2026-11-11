import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { Slider } from '@cognite/aura/components/slider';
import { Switch } from '@cognite/aura/components/switch';
import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { IconCamera, IconCopy, IconCube, IconDownload } from '@cognite/aura/icons';
import type { KeyboardEvent, ReactNode } from 'react';
import { useReducer, useState } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { frameBounds } from '../../../library/three/cameraTargets';
import type { CameraTarget, Vec3 } from '../../../library/three/cameraTargets';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { INITIAL_CLIP, clipReducer, describeClip } from '../../../library/three/viewer/clipPlane';
import { ClipPlaneControl } from '../../../library/three/viewer/ClipPlaneControl';
import { legendInUse } from '../../../library/three/viewer/colorBy';
import type { ColorMode } from '../../../library/three/viewer/colorBy';
import { ColorByControl } from '../../../library/three/viewer/ColorByControl';
import { KeyboardHelp } from '../../../library/three/viewer/KeyboardHelp';
import { LayerFilter } from '../../../library/three/viewer/LayerFilter';
import { DEFAULT_STAGES, failedAt, stagesAt } from '../../../library/three/viewer/loadingStages';
import { INITIAL_MEASURE, formatLength, measureReducer, measurementOf } from '../../../library/three/viewer/measure';
import { MeasureReadout } from '../../../library/three/viewer/MeasureReadout';
import { MiniMap } from '../../../library/three/viewer/MiniMap';
import { ModelLoadingCard } from '../../../library/three/viewer/ModelLoadingCard';
import { INITIAL_TREE_VISIBILITY, displayCounts, resolveDisplay, treeReducer } from '../../../library/three/viewer/modelTree';
import { ModelTreePanel } from '../../../library/three/viewer/ModelTreePanel';
import { PinList } from '../../../library/three/viewer/PinList';
import { createPinState, pinReducer } from '../../../library/three/viewer/pins';
import { SelectionInfoPanel } from '../../../library/three/viewer/SelectionInfoPanel';
import type { CubeFaceId, ViewPresetId } from '../../../library/three/viewer/viewCube';
import { anglesFromDirection, VIEW_PRESETS, activeFace, describeView, directionOfPose, faceTarget, frameFromDirection, presetTarget } from '../../../library/three/viewer/viewCube';
import { ViewCube } from '../../../library/three/viewer/ViewCube';
import { commandForKey } from '../../../library/three/viewer/viewerKeymap';
import type { ViewerSystem } from '../../../library/three/viewer/viewerModel';
import { VIEWER_BOUNDS, VIEWER_PARTS, VIEWER_TREE, findPart, partIdsInSystems } from '../../../library/three/viewer/viewerModel';
import { ViewerScene } from '../../../library/three/viewer/ViewerScene';
import { ViewerStage } from '../../../library/three/viewer/ViewerStage';
import { ViewerToolbar3d } from '../../../library/three/viewer/ViewerToolbar3d';
import type { ViewerMode, ViewerTool } from '../../../library/three/viewer/ViewerToolbar3d';
import { ViewpointList } from '../../../library/three/viewer/ViewpointList';
import { createViewpointState, viewpointReducer } from '../../../library/three/viewer/viewpoints';
import { definePage } from '../../types';

import source from './model-viewer-chrome.tsx?raw';

/** The full viewer's canvas is taller than wide, so its home view is framed for a narrow window. */
const FULL_HOME = frameBounds(VIEWER_BOUNDS, { view: 'isometric', aspect: 0.85, padding: 1.05 });

/** Home view for the small, wide windows: closer than the library default, which leaves air for panels. */
const SMALL_HOME = frameBounds(VIEWER_BOUNDS, { view: 'isometric', aspect: 1.8, padding: 0.78 });

const ALL_SYSTEMS: ViewerSystem[] = ['separation', 'compression', 'cooling', 'piping', 'structure'];

/** The camera of one viewer: where it should be, where it is, and the two ways it reports. */
function useViewerCamera(initial: CameraTarget = SMALL_HOME) {
  const [target, setTarget] = useState<CameraTarget>(initial);
  const [pose, setPose] = useState<CameraTarget>(initial);
  return {
    target,
    pose,
    /** Fly somewhere: the target, and the pose the gizmos read, follow at once. */
    flyTo: (next: CameraTarget) => {
      setTarget(next);
      setPose(next);
    },
    /** The user let go of the scene: keep the target in step so the next fly-to is a real change. */
    onPose: (next: CameraTarget) => {
      setTarget(next);
      setPose(next);
    },
    onLivePose: setPose,
  };
}

function ViewerChromeFallbackList({ limit = VIEWER_PARTS.length }: { limit?: number }) {
  return (
    <ul className="flex flex-col gap-1.5 rounded-lg bg-card-background p-3 text-sm">
      {VIEWER_PARTS.slice(0, limit).map((part) => (
        <li key={part.id} className="flex items-center justify-between gap-3">
          <span className="truncate text-base-foreground">{part.name}</span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">{part.tag}</span>
        </li>
      ))}
      {limit < VIEWER_PARTS.length ? <li className="text-xs text-muted-foreground">and {VIEWER_PARTS.length - limit} more in the structure panel</li> : null}
    </ul>
  );
}

/** A fixed-height window with one scene in it. */
function ViewerChromeWindow({ label, heightClass, children, overlay }: { label: string; heightClass: string; children: Parameters<typeof ViewerStage>[0]['children']; overlay?: ReactNode }) {
  return (
    <div className={`relative w-full overflow-hidden rounded-lg bg-muted-background ${heightClass}`}>
      <ViewerStage label={label} fallback={<ViewerChromeFallbackList />}>
        {children}
      </ViewerStage>
      {overlay}
    </div>
  );
}

/** A token-drawn stand-in for the canvas, for controls shown on their own. */
function ViewerChromePlaceholder({ children, heightClass = 'h-44' }: { children?: ReactNode; heightClass?: string }) {
  return (
    <div className={`relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-muted-background ${heightClass}`}>
      <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
        <IconCube aria-hidden="true" className="size-8" />
        <span className="text-xs">Model area</span>
      </div>
      {children}
    </div>
  );
}

const POSE_TEXT = (pose: CameraTarget): string => describeView(directionOfPose(pose));

const PART_OPTIONS = VIEWER_PARTS.map((part) => ({ value: part.id, label: part.name }));

function ViewerChromeFull() {
  const camera = useViewerCamera(FULL_HOME);
  const [mode, setMode] = useState<ViewerMode>('orbit');
  const [tool, setTool] = useState<ViewerTool>('select');
  const [selectedId, setSelectedId] = useState<string | null>('compressor');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [visibility, dispatchVisibility] = useReducer((state: typeof INITIAL_TREE_VISIBILITY, action: Parameters<typeof treeReducer>[2]) => treeReducer(VIEWER_TREE, state, action), INITIAL_TREE_VISIBILITY);
  const [enabled, setEnabled] = useState<ViewerSystem[]>(ALL_SYSTEMS);
  const [filterMode, setFilterMode] = useState<'hide' | 'ghost'>('ghost');
  const [colorMode, setColorMode] = useState<ColorMode>('none');
  const [explode, setExplode] = useState(0);
  const [xray, setXray] = useState(false);
  const [clip, dispatchClip] = useReducer(clipReducer, INITIAL_CLIP);
  const [measure, dispatchMeasure] = useReducer(measureReducer, INITIAL_MEASURE);
  const [pins, dispatchPins] = useReducer(pinReducer, undefined, () => createPinState());
  const [views, dispatchViews] = useReducer(viewpointReducer, undefined, () => createViewpointState());
  const [helpOpen, setHelpOpen] = useState(false);

  const display = resolveDisplay({ tree: VIEWER_TREE, visibility, filteredOut: partIdsInSystems(ALL_SYSTEMS.filter((system) => !enabled.includes(system))), filterMode });
  const counts = displayCounts(display);
  const angles = anglesFromDirection(directionOfPose(camera.pose));
  const part = selectedId ? (findPart(selectedId) ?? null) : null;
  const measurement = measurementOf(measure);

  const fit = () => camera.flyTo(frameFromDirection(VIEWER_BOUNDS, directionOfPose(camera.pose), { aspect: 0.85 }));
  const choosePreset = (preset: ViewPresetId) => camera.flyTo(presetTarget(VIEWER_BOUNDS, preset, { aspect: 0.85 }));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    const command = commandForKey(event);
    if (!command) return;
    event.preventDefault();
    switch (command.type) {
      case 'mode':
        setMode(command.mode);
        break;
      case 'tool':
        setTool(command.tool);
        break;
      case 'fit':
        fit();
        break;
      case 'home':
        camera.flyTo(FULL_HOME);
        break;
      case 'preset':
        choosePreset(command.preset);
        break;
      case 'xray':
        setXray((current) => !current);
        break;
      case 'section':
        dispatchClip({ type: 'enable', enabled: !clip.enabled });
        break;
      case 'help':
        setHelpOpen(true);
        break;
      case 'cancel':
        if (tool !== 'select') setTool('select');
        else setSelectedId(null);
        dispatchMeasure({ type: 'clear' });
        break;
    }
  };

  const onPartClick = (id: string, point: Vec3) => {
    if (tool === 'measure') dispatchMeasure({ type: 'pick', point });
    else if (tool === 'pin') dispatchPins({ type: 'add', position: point, partId: id });
    else setSelectedId((current) => (current === id ? null : id));
  };

  return (
    <TooltipProvider>
      <div
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onPointerDownCapture={(event) => {
          if (event.target instanceof HTMLCanvasElement) event.currentTarget.focus({ preventScroll: true });
        }}
        className="flex h-[46rem] w-full flex-col overflow-hidden rounded-xl border border-default bg-base-background outline-none"
      >
        <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b border-default bg-card-background px-4 py-2.5">
          <span className="font-mono text-sm font-medium text-base-foreground">23-KA-9101</span>
          <span className="text-sm text-medium-foreground">Compressor module, 3D model</span>
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {counts.solid} shown · {counts.ghost} ghosted · {counts.hidden} hidden
          </span>
          <KeyboardHelp open={helpOpen} onOpenChange={setHelpOpen} />
        </header>
        <div className="grid min-h-0 flex-1 grid-cols-[16rem_minmax(0,1fr)_18rem]">
          <aside aria-label="Model panels" className="flex min-h-0 flex-col gap-5 overflow-y-auto border-r border-default bg-card-background p-3">
            <section aria-label="Structure" className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Structure</h3>
              <ModelTreePanel
                tree={VIEWER_TREE}
                visibility={visibility}
                selectedId={selectedId}
                onToggle={(id) => dispatchVisibility({ type: 'toggle', id })}
                onIsolate={(id) => dispatchVisibility({ type: 'isolate', id })}
                onSelect={(id) => setSelectedId(findPart(id) ? id : null)}
                onShowAll={() => dispatchVisibility({ type: 'showAll' })}
              />
            </section>
            <section aria-label="Layers" className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Layers</h3>
              <LayerFilter enabled={enabled} onEnabledChange={setEnabled} mode={filterMode} onModeChange={setFilterMode} />
            </section>
            <section aria-label="Colour" className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Colour</h3>
              <ColorByControl mode={colorMode} onModeChange={setColorMode} />
            </section>
          </aside>
          <div className="relative min-h-0 min-w-0 bg-muted-background">
            <ViewerStage
              label={`3D model of compressor module 23-KA-9101. ${part ? `${part.name} is selected.` : 'Nothing is selected.'} ${measurement ? `Measured distance ${formatLength(measurement.distance)}.` : ''}`}
              fallback={<ViewerChromeFallbackList />}
              onPointerMissed={() => tool === 'select' && setSelectedId(null)}
            >
              {(colors) => (
                <ViewerScene
                  colors={colors}
                  target={camera.target}
                  mode={mode}
                  display={display}
                  colorMode={colorMode}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  explode={explode / 100}
                  xray={xray}
                  clip={clip}
                  measurePoints={measure.points}
                  pins={pins}
                  onPose={camera.onPose}
                  onLivePose={camera.onLivePose}
                  onPartClick={onPartClick}
                  onPartHover={setHoveredId}
                  onPinSelect={(id) => dispatchPins({ type: 'select', id })}
                  labelSelection
                />
              )}
            </ViewerStage>
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
              <div className="flex items-start justify-between gap-3">
                <ViewerToolbar3d className="pointer-events-auto" mode={mode} onModeChange={setMode} tool={tool} onToolChange={setTool} onFit={fit} onHome={() => camera.flyTo(FULL_HOME)} />
                <ViewCube className="pointer-events-auto" angles={angles} active={activeFace(directionOfPose(camera.pose))} onFace={(face: CubeFaceId) => camera.flyTo(faceTarget(VIEWER_BOUNDS, face, { aspect: 0.85 }))} />
              </div>
              <div className="flex items-end justify-between gap-3">
                <MiniMap className="pointer-events-auto w-40" bounds={VIEWER_BOUNDS} pose={camera.pose} highlightIds={selectedId ? [selectedId] : []} width={160} height={100} />
                <p className="rounded-md bg-[color-mix(in_oklab,var(--card-background)_90%,transparent)] px-2 py-1 text-xs text-medium-foreground" aria-live="polite">
                  {tool === 'measure' ? 'Measure: click two points on the model' : tool === 'pin' ? 'Pin: click where the note belongs' : `${POSE_TEXT(camera.pose)}`}
                </p>
              </div>
            </div>
          </div>
          <aside aria-label="Inspector" className="flex min-h-0 flex-col gap-5 overflow-y-auto border-l border-default bg-card-background p-3">
            <section aria-label={tool === 'measure' ? 'Measure' : tool === 'pin' ? 'Pins' : 'Selection'} className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{tool === 'measure' ? 'Measure' : tool === 'pin' ? 'Pins' : 'Selection'}</h3>
              {tool === 'measure' ? (
                <MeasureReadout state={measure} onUndo={() => dispatchMeasure({ type: 'undo' })} onClear={() => dispatchMeasure({ type: 'clear' })} />
              ) : tool === 'pin' ? (
                <PinList state={pins} onSelect={(id) => dispatchPins({ type: 'select', id })} onEdit={(id, text) => dispatchPins({ type: 'edit', id, text })} onDelete={(id) => dispatchPins({ type: 'delete', id })} />
              ) : (
                <SelectionInfoPanel part={part} />
              )}
            </section>
            <section aria-label="Section plane" className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Section plane</h3>
              <ClipPlaneControl state={clip} dispatch={dispatchClip} bounds={VIEWER_BOUNDS} />
            </section>
            <section aria-label="Explode and x-ray" className="flex flex-col gap-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Explode</h3>
              <div className="flex items-center gap-3">
                <Slider aria-label="Explode the module" min={0} max={100} step={1} value={[explode]} onValueChange={(next) => setExplode(next[0] ?? 0)} />
                <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{explode}%</span>
              </div>
              <Switch label="X-ray" checked={xray} onCheckedChange={(checked) => setXray(checked)} />
            </section>
            <section aria-label="Views" className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Views</h3>
              <ul aria-label="Camera presets" className="flex flex-wrap gap-1.5">
                {VIEW_PRESETS.map((preset) => (
                  <li key={preset.id}>
                    <Button variant="outline" size="sm" onClick={() => choosePreset(preset.id)}>
                      {preset.label}
                    </Button>
                  </li>
                ))}
              </ul>
              <ViewpointList
                viewpoints={views.items}
                onSave={(name) => dispatchViews({ type: 'save', target: camera.pose, name })}
                onRestore={(id) => {
                  const saved = views.items.find((item) => item.id === id);
                  if (saved) camera.flyTo(saved.target);
                }}
                onDelete={(id) => dispatchViews({ type: 'delete', id })}
              />
            </section>
          </aside>
        </div>
      </div>
    </TooltipProvider>
  );
}

function ViewerChromeSection() {
  const camera = useViewerCamera(frameBounds(VIEWER_BOUNDS, { view: 'perspective', aspect: 1.8, padding: 0.78 }));
  const [clip, dispatchClip] = useReducer(clipReducer, { ...INITIAL_CLIP, enabled: true, position: 0.62 });
  return (
    <div className="flex w-full flex-col gap-4">
      <ViewerChromeWindow label={`3D model with a section plane. ${describeClip(VIEWER_BOUNDS, clip)}`} heightClass="h-72">
        {(colors) => <ViewerScene colors={colors} target={camera.target} clip={clip} onPose={camera.onPose} />}
      </ViewerChromeWindow>
      <ClipPlaneControl state={clip} dispatch={dispatchClip} bounds={VIEWER_BOUNDS} />
    </div>
  );
}

const MEASURE_POINTS: readonly Vec3[] = [
  [-7.4, 3.7, 2.1],
  [4.4, 2.5, 0],
];
const MEASURE_SEED = { points: MEASURE_POINTS };

function ViewerChromeMeasure() {
  const camera = useViewerCamera();
  const [measure, dispatch] = useReducer(measureReducer, MEASURE_SEED);
  return (
    <div className="flex w-full flex-col gap-4">
      <ViewerChromeWindow label="3D model with the measure tool. Click two points on the model to read the distance between them." heightClass="h-72">
        {(colors) => (
          <ViewerScene
            colors={colors}
            target={camera.target}
            measurePoints={measure.points}
            onPose={camera.onPose}
            onPartClick={(_id, point) => dispatch({ type: 'pick', point })}
          />
        )}
      </ViewerChromeWindow>
      <MeasureReadout state={measure} onUndo={() => dispatch({ type: 'undo' })} onClear={() => dispatch({ type: 'clear' })} />
    </div>
  );
}

function ViewerChromeCubeLive() {
  const camera = useViewerCamera();
  const angles = anglesFromDirection(directionOfPose(camera.pose));
  return (
    <div className="flex w-full flex-col gap-3">
      <ViewerChromeWindow
        label="3D model with a view cube. Dragging the model turns the cube; clicking a face of the cube turns the model."
        heightClass="h-72"
        overlay={<ViewCube className="absolute right-3 top-3" angles={angles} active={activeFace(directionOfPose(camera.pose))} onFace={(face) => camera.flyTo(faceTarget(VIEWER_BOUNDS, face, { aspect: 1.6 }))} />}
      >
        {(colors) => <ViewerScene colors={colors} target={camera.target} onPose={camera.onPose} onLivePose={camera.onLivePose} />}
      </ViewerChromeWindow>
      <p aria-live="polite" className="text-sm text-medium-foreground">
        {POSE_TEXT(camera.pose)}. Drag the model, or click a cube face.
      </p>
    </div>
  );
}

const PIN_SEED = createPinState([
  { id: 'n1', position: [-0.5, 2.9, 0], text: 'Vibration probe loose', partId: 'compressor' },
  { id: 'n2', position: [1.9, 1.9, -2.7], text: 'Failed partial stroke test', partId: 'antisurge' },
]);

function ViewerChromePins() {
  const camera = useViewerCamera();
  const [pins, dispatch] = useReducer(pinReducer, PIN_SEED);
  return (
    <div className="flex w-full flex-col gap-4">
      <ViewerChromeWindow label={`3D model with ${pins.items.length} pinned notes. Click the model to add a pin; the list beside it does the same from the keyboard.`} heightClass="h-72">
        {(colors) => (
          <ViewerScene
            colors={colors}
            target={camera.target}
            pins={pins}
            onPose={camera.onPose}
            onPartClick={(id, point) => dispatch({ type: 'add', position: point, partId: id })}
            onPinSelect={(id) => dispatch({ type: 'select', id })}
          />
        )}
      </ViewerChromeWindow>
      <PinList state={pins} onSelect={(id) => dispatch({ type: 'select', id })} onEdit={(id, text) => dispatch({ type: 'edit', id, text })} onDelete={(id) => dispatch({ type: 'delete', id })} />
    </div>
  );
}

function ViewerChromeSplit() {
  const a = useViewerCamera();
  const b = useViewerCamera();
  const [synced, setSynced] = useState(true);
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Switch label="Synchronise cameras" checked={synced} onCheckedChange={(checked) => setSynced(checked)} />
        <span className="text-xs text-muted-foreground">Move either view and the other follows while synchronised.</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Colour by run state</span>
          <ViewerChromeWindow label="Left view: the module coloured by run state." heightClass="h-72">
            {(colors) => (
              <ViewerScene
                colors={colors}
                target={a.target}
                colorMode="status"
                onPose={(pose) => {
                  a.onPose(pose);
                  if (synced) b.flyTo(pose);
                }}
              />
            )}
          </ViewerChromeWindow>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Colour by health</span>
          <ViewerChromeWindow label="Right view: the same module coloured by health." heightClass="h-72">
            {(colors) => (
              <ViewerScene
                colors={colors}
                target={b.target}
                colorMode="health"
                onPose={(pose) => {
                  b.onPose(pose);
                  if (synced) a.flyTo(pose);
                }}
              />
            )}
          </ViewerChromeWindow>
        </div>
      </div>
    </div>
  );
}

function ViewerChromeAutoRotate() {
  const camera = useViewerCamera();
  const [rotating, setRotating] = useState(true);
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="relative h-72 w-full overflow-hidden rounded-lg bg-muted-background">
        <ViewerStage label="3D model turning slowly for presentation" fallback={<ViewerChromeFallbackList />} frameloop={rotating ? 'always' : 'demand'}>
          {(colors) => <ViewerScene colors={colors} target={camera.target} autoRotate={rotating} onPose={camera.onPose} />}
        </ViewerStage>
      </div>
      <Switch label="Turn the model" checked={rotating} onCheckedChange={(checked) => setRotating(checked)} />
      <p className="text-xs text-muted-foreground">The only scene on this page that renders every frame. It stops when switched off, when scrolled out of view and under reduced motion.</p>
    </div>
  );
}

type Quality = 'low' | 'balanced' | 'high';

const QUALITIES: readonly Quality[] = ['low', 'balanced', 'high'];

const QUALITY_NOTES: Record<Quality, { label: string; pixels: string; edges: string; labels: string; target: string }> = {
  low: { label: 'Low', pixels: '1× pixel ratio', edges: 'No edge smoothing', labels: 'Labels only for the selection', target: 'Laptops without a graphics card' },
  balanced: { label: 'Balanced', pixels: 'Up to 1.5× pixel ratio', edges: 'Edge smoothing on', labels: 'Labels within 40 m', target: 'Most work machines' },
  high: { label: 'High', pixels: 'Up to 2× pixel ratio', edges: 'Edge smoothing and outlines', labels: 'All labels', target: 'Workstations and large screens' },
};

function ViewerChromeQuality() {
  const [quality, setQuality] = useState<Quality>('balanced');
  const note = QUALITY_NOTES[quality];
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-base-foreground">Rendering quality</span>
        <SegmentedControl
          value={quality}
          onValueChange={(next: unknown) => {
            if (next === 'low' || next === 'balanced' || next === 'high') setQuality(next);
          }}
        >
          <SegmentedControlList aria-label="Rendering quality">
            {QUALITIES.map((key) => (
              <SegmentedControlButton key={key} value={key} tabContent="label-only">
                {QUALITY_NOTES[key].label}
              </SegmentedControlButton>
            ))}
          </SegmentedControlList>
        </SegmentedControl>
      </div>
      <MetadataList
        items={[
          { label: 'Resolution', value: note.pixels },
          { label: 'Edges', value: note.edges },
          { label: 'Labels', value: note.labels },
          { label: 'Suits', value: note.target },
        ]}
      />
      <p aria-live="polite" className="text-xs text-muted-foreground">
        Quality is a viewer setting, not a property of the model. Lower it when the frame rate drops, and remember the choice per device.
      </p>
    </div>
  );
}

function ViewerChromeToolbarAlone() {
  const [mode, setMode] = useState<ViewerMode>('orbit');
  const [tool, setTool] = useState<ViewerTool>('select');
  const [last, setLast] = useState('No action yet');
  return (
    <TooltipProvider>
      <div className="flex w-full flex-col gap-3">
        <ViewerChromePlaceholder>
          <ViewerToolbar3d
            className="absolute left-3 top-3"
            mode={mode}
            onModeChange={(next) => {
              setMode(next);
              setLast(`Drag now ${next === 'orbit' ? 'orbits' : next === 'pan' ? 'pans' : 'zooms'}`);
            }}
            tool={tool}
            onToolChange={(next) => {
              setTool(next);
              setLast(`Click now ${next === 'select' ? 'selects' : next === 'measure' ? 'measures' : 'adds a pin'}`);
            }}
            onFit={() => setLast('Fitted the model in view')}
            onHome={() => setLast('Returned to the home view')}
          />
        </ViewerChromePlaceholder>
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {last}
        </p>
      </div>
    </TooltipProvider>
  );
}

function ViewerChromeCubeAlone() {
  const [direction, setDirection] = useState<CameraTarget>(presetTarget(VIEWER_BOUNDS, 'iso'));
  const angles = anglesFromDirection(directionOfPose(direction));
  const face = activeFace(directionOfPose(direction));
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <ViewCube angles={angles} active={face} onFace={(next) => setDirection(faceTarget(VIEWER_BOUNDS, next))} />
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {POSE_TEXT(direction)}
      </p>
    </div>
  );
}

function ViewerChromePresets() {
  const [preset, setPreset] = useState<ViewPresetId>('iso');
  const target = presetTarget(VIEWER_BOUNDS, preset);
  return (
    <div className="flex w-full flex-col gap-3">
      <ul aria-label="Camera presets" className="flex flex-wrap gap-1.5">
        {VIEW_PRESETS.map((item) => (
          <li key={item.id}>
            <Button variant={item.id === preset ? 'secondary' : 'outline'} size="sm" aria-pressed={item.id === preset} onClick={() => setPreset(item.id)}>
              {item.label}
              <span className="text-xs font-normal text-muted-foreground">{item.shortcut}</span>
            </Button>
          </li>
        ))}
      </ul>
      <MetadataList
        items={[
          { label: 'Looking from', value: POSE_TEXT(target) },
          { label: 'Camera (x, y, z)', value: <span className="tabular-nums">{target.position.map((value) => value.toFixed(1)).join(', ')} m</span> },
        ]}
      />
    </div>
  );
}

function ViewerChromeTree() {
  const [visibility, dispatch] = useReducer((state: typeof INITIAL_TREE_VISIBILITY, action: Parameters<typeof treeReducer>[2]) => treeReducer(VIEWER_TREE, state, action), { hiddenIds: ['lube-oil'], isolatedId: null });
  const [selected, setSelected] = useState<string | null>('compressor');
  return (
    <TooltipProvider>
      <ModelTreePanel
        tree={VIEWER_TREE}
        visibility={visibility}
        selectedId={selected}
        onToggle={(id) => dispatch({ type: 'toggle', id })}
        onIsolate={(id) => dispatch({ type: 'isolate', id })}
        onSelect={setSelected}
        onShowAll={() => dispatch({ type: 'showAll' })}
      />
    </TooltipProvider>
  );
}

function ViewerChromeMiniMap() {
  const [heading, setHeading] = useState(30);
  const radians = (heading * Math.PI) / 180;
  const pose: CameraTarget = { position: [Math.sin(radians) * -18, 8, Math.cos(radians) * 14], lookAt: [0, 0, 0] };
  return (
    <div className="flex w-full flex-col gap-3">
      <MiniMap bounds={VIEWER_BOUNDS} pose={pose} highlightIds={['compressor']} width={220} height={130} />
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-sm text-base-foreground">Camera</span>
        <Slider aria-label="Move the camera round the module" min={-180} max={180} step={5} value={[heading]} onValueChange={(next) => setHeading(next[0] ?? 0)} />
        <span className="w-12 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{heading}°</span>
      </div>
    </div>
  );
}

function ViewerChromeSelection() {
  const [id, setId] = useState('antisurge');
  return (
    <div className="flex w-full flex-col gap-4">
      <Select items={PART_OPTIONS} value={id} onValueChange={(next) => typeof next === 'string' && setId(next)}>
        <SelectTrigger aria-label="Selected part" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PART_OPTIONS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SelectionInfoPanel part={findPart(id) ?? null} />
    </div>
  );
}

function ViewerChromeLayers() {
  const [enabled, setEnabled] = useState<ViewerSystem[]>(['compression', 'piping', 'structure']);
  const [mode, setMode] = useState<'hide' | 'ghost'>('ghost');
  const filtered = partIdsInSystems(ALL_SYSTEMS.filter((system) => !enabled.includes(system)));
  const counts = displayCounts(resolveDisplay({ tree: VIEWER_TREE, visibility: INITIAL_TREE_VISIBILITY, filteredOut: filtered, filterMode: mode }));
  return (
    <div className="flex w-full flex-col gap-3">
      <LayerFilter enabled={enabled} onEnabledChange={setEnabled} mode={mode} onModeChange={setMode} />
      <p aria-live="polite" className="text-xs text-muted-foreground tabular-nums">
        {counts.solid} shown, {counts.ghost} ghosted, {counts.hidden} hidden
      </p>
    </div>
  );
}

function ViewerChromeColorBy() {
  const [mode, setMode] = useState<ColorMode>('health');
  return (
    <div className="flex w-full flex-col gap-3">
      <ColorByControl mode={mode} onModeChange={setMode} />
      <p className="text-xs text-muted-foreground tabular-nums">{legendInUse(mode, VIEWER_PARTS).length} colours in use</p>
    </div>
  );
}

function ViewerChromeViewpoints() {
  const [preset, setPreset] = useState<ViewPresetId>('front');
  const [state, dispatch] = useReducer(viewpointReducer, undefined, () => createViewpointState([{ id: 'v1', name: 'Pump side', target: presetTarget(VIEWER_BOUNDS, 'side') }]));
  const [restored, setRestored] = useState('Camera on the front view');
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Current camera</span>
        <SegmentedControl
          value={preset}
          onValueChange={(next: unknown) => {
            if (next === 'top' || next === 'front' || next === 'side' || next === 'iso') {
              setPreset(next);
              setRestored(`Camera on the ${next === 'iso' ? 'isometric' : next} view`);
            }
          }}
        >
          <SegmentedControlList aria-label="Current camera" size="small">
            {VIEW_PRESETS.map((item) => (
              <SegmentedControlButton key={item.id} value={item.id} size="small" tabContent="label-only">
                {item.label}
              </SegmentedControlButton>
            ))}
          </SegmentedControlList>
        </SegmentedControl>
      </div>
      <ViewpointList
        viewpoints={state.items}
        onSave={(name) => dispatch({ type: 'save', target: presetTarget(VIEWER_BOUNDS, preset), name })}
        onRestore={(id) => {
          const saved = state.items.find((item) => item.id === id);
          if (saved) setRestored(`Flew to ${saved.name}`);
        }}
        onDelete={(id) => dispatch({ type: 'delete', id })}
      />
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {restored}
      </p>
    </div>
  );
}

function ViewerChromeExplode() {
  const [amount, setAmount] = useState(40);
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-base-foreground">Explode</span>
        <span className="text-sm tabular-nums text-muted-foreground">{amount}%</span>
      </div>
      <Slider aria-label="Explode the module" min={0} max={100} step={1} value={[amount]} onValueChange={(next) => setAmount(next[0] ?? 0)} />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Assembled</span>
        <span>Exploded</span>
      </div>
      <p className="text-xs text-muted-foreground">{amount === 0 ? 'Parts are in place.' : amount === 100 ? 'Every part is clear of its neighbours.' : 'Parts lift away from the frame in sequence, by system.'}</p>
    </div>
  );
}

function ViewerChromeXray() {
  const [on, setOn] = useState(false);
  const levels = [
    { label: 'Solid', opacity: 'opacity-100' },
    { label: 'X-ray', opacity: 'opacity-30' },
    { label: 'Ghost', opacity: 'opacity-10' },
  ];
  return (
    <div className="flex w-full flex-col gap-4">
      <Switch label="X-ray" checked={on} onCheckedChange={(checked) => setOn(checked)} />
      <ul aria-label="How parts are drawn" className="grid grid-cols-3 gap-2">
        {levels.map((level) => (
          <li key={level.label} className="flex flex-col items-center gap-1.5">
            <span aria-hidden="true" className={`h-8 w-full rounded-md bg-chart-neutral-450 ${level.opacity}`} />
            <span className="text-xs text-muted-foreground">{level.label}</span>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {on ? 'Solid parts are drawn at 30 percent so what is inside shows. Ghosted parts stay at 10 percent.' : 'Solid parts hide what is inside them.'}
      </p>
    </div>
  );
}

function ViewerChromeLoading() {
  const [index, setIndex] = useState(1);
  const [failed, setFailed] = useState(false);
  const base = stagesAt(index, index === 1 ? { geometry: '12 of 48 geometry files' } : {});
  const stages = failed ? failedAt(base, 'geometry', 'Connection lost after 12 of 48 files') : base;
  return (
    <div className="flex w-full flex-col gap-4">
      <ModelLoadingCard model="Compressor module" stages={stages} activeFraction={index === 1 ? 0.25 : 0.5} />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={failed || index >= DEFAULT_STAGES.length}
          onClick={() => setIndex((current) => Math.min(DEFAULT_STAGES.length, current + 1))}
        >
          Next stage
        </Button>
        <Button variant="ghost" size="sm" disabled={failed || index !== 1} onClick={() => setFailed(true)}>
          Simulate failure
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIndex(0);
            setFailed(false);
          }}
        >
          Start again
        </Button>
      </div>
    </div>
  );
}

function ViewerChromeUnavailable() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="h-72 w-full overflow-hidden rounded-lg">
        <SceneCanvas label="3D model of compressor module 23-KA-9101" forceFallback fallback={<ViewerChromeFallbackList limit={3} />}>
          {null}
        </SceneCanvas>
      </div>
      <div className="flex flex-col gap-2 rounded-lg bg-muted-background p-4">
        <p className="text-sm font-medium text-base-foreground">Model not available</p>
        <p className="text-sm text-muted-foreground">The 3D model of 23-KA-9101 has not been processed yet, or you do not have access to it. The structure above is still available as a list.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Request access
          </Button>
          <Button variant="ghost" size="sm">
            Open in the data catalog
          </Button>
        </div>
      </div>
    </div>
  );
}

function ViewerChromeShortcuts() {
  return (
    <div className="flex w-full flex-col items-start gap-3">
      <KeyboardHelp />
      <p className="text-xs text-muted-foreground">The overlay stays closed until asked for. In the viewer, press ? to open it.</p>
    </div>
  );
}

function ViewerChromeExport() {
  const [format, setFormat] = useState('png');
  const [message, setMessage] = useState('');
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          items={[
            { value: 'png', label: 'PNG' },
            { value: 'jpeg', label: 'JPEG' },
          ]}
          value={format}
          onValueChange={(next) => typeof next === 'string' && setFormat(next)}
        >
          <SelectTrigger aria-label="Screenshot format" className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="png">PNG</SelectItem>
            <SelectItem value="jpeg">JPEG</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setMessage(`Saved screenshot as ${format.toUpperCase()}, 1 920 × 1 080`)}>
          <IconCamera /> Save screenshot
        </Button>
        <Button variant="outline" size="sm" onClick={() => setMessage('Copied a link to this view')}>
          <IconCopy /> Copy link to view
        </Button>
        <Button variant="outline" size="sm" disabled aria-describedby="export-reason">
          <IconDownload /> Export measurements
        </Button>
      </div>
      <p id="export-reason" className="text-xs text-muted-foreground">
        Export measurements is off until you have measured something.
      </p>
      <p aria-live="polite" className="min-h-5 text-sm text-medium-foreground">
        {message}
      </p>
    </div>
  );
}

export default definePage({
  id: 'model-viewer-chrome',
  title: '3D viewer controls',
  summary:
    'The chrome around a 3D model viewer, shown on real scenes: toolbar, view cube, camera presets, section plane, measure tool, model tree with isolate, layers with ghosting, colour-by with legend, saved views, pins, explode, x-ray, mini-map, loading, unavailable and keyboard help.',
  guidance: {
    use: [
      'Give every pointer-only control a button route: a tree and lists beside the canvas, shortcuts for the toolbar.',
      'Fade what is not in focus rather than hiding it, so people keep their bearings.',
      'Say what colour means whenever it is applied to the model, with a legend in words.',
      'Show loading in stages and keep failures where they happened.',
    ],
    avoid: [
      'Several live canvases on one screen. Use one, and demonstrate the other controls on a placeholder.',
      'Controls whose only effect is inside the canvas. Announce changes so people who cannot see it know.',
      'Colour as the only difference between states in the model.',
    ],
  },
  source,
  sections: [
    {
      id: 'viewer',
      title: 'The whole viewer',
      description: 'Every control around one canvas. Drag to orbit, scroll to zoom, click a part; press ? for shortcuts.',
      specimens: [
        {
          id: 'ViewerChromeFull',
          title: 'Model viewer',
          note: 'Pick it as the starting point for a 3D screen: structure, layers and colour on the left, properties and tools on the right.',
          origin: 'custom',
          uses: [
            'three/viewer/ViewerScene.tsx',
            'three/viewer/ViewerStage.tsx',
            'three/viewer/ViewerToolbar3d.tsx',
            'three/viewer/ViewCube.tsx',
            'three/viewer/ModelTreePanel.tsx',
            'three/viewer/LayerFilter.tsx',
            'three/viewer/ColorByControl.tsx',
            'three/viewer/ClipPlaneControl.tsx',
            'three/viewer/MeasureReadout.tsx',
            'three/viewer/PinList.tsx',
            'three/viewer/ViewpointList.tsx',
            'three/viewer/MiniMap.tsx',
            'three/viewer/KeyboardHelp.tsx',
          ],
          size: 'full',
          align: 'stretch',
          Component: ViewerChromeFull,
        },
      ],
    },
    {
      id: 'tools',
      title: 'Tools on a canvas',
      description: 'One control each, with a small live scene to try it on.',
      specimens: [
        {
          id: 'ViewerChromeSection',
          title: 'Section plane',
          note: 'Pick it to look inside: slide a clipping plane through the model, switch axis, keep either side.',
          origin: 'custom',
          uses: ['three/viewer/ClipPlaneControl.tsx', 'three/viewer/clipPlane.ts', 'three/viewer/ViewerScene.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ViewerChromeSection,
        },
        {
          id: 'ViewerChromeMeasure',
          title: 'Measure tool',
          note: 'Pick it for distances: click two points on the model, read the total and its east–west, height and north–south parts.',
          origin: 'custom',
          uses: ['three/viewer/MeasureReadout.tsx', 'three/viewer/measure.ts', 'three/viewer/MeasureLayer.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ViewerChromeMeasure,
        },
        {
          id: 'ViewerChromeCubeLive',
          title: 'View cube on a model',
          note: 'Pick it to keep people oriented: the cube turns with the camera and each face flies the camera to that side.',
          origin: 'custom',
          uses: ['three/viewer/ViewCube.tsx', 'three/viewer/viewCube.ts', 'three/viewer/ViewerRig.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ViewerChromeCubeLive,
        },
        {
          id: 'ViewerChromePins',
          title: 'Pins and notes',
          note: 'Pick it to annotate the model: numbered pins in the scene and the same list beside it.',
          origin: 'custom',
          uses: ['three/viewer/PinList.tsx', 'three/viewer/PinLayer.tsx', 'three/viewer/pins.ts'],
          size: 'md',
          align: 'stretch',
          Component: ViewerChromePins,
        },
        {
          id: 'ViewerChromeSplit',
          title: 'Split view',
          note: 'Pick it to compare two readings of the same model: two colourings with cameras that follow each other.',
          origin: 'custom',
          uses: ['three/viewer/ViewerScene.tsx', 'three/viewer/colorBy.ts'],
          size: 'full',
          align: 'stretch',
          Component: ViewerChromeSplit,
        },
        {
          id: 'ViewerChromeAutoRotate',
          title: 'Presentation turn',
          note: 'Pick it for a wall display or a first look: the model turns slowly, and a switch stops it.',
          origin: 'custom',
          uses: ['three/viewer/ViewerRig.tsx', 'three/viewer/ViewerScene.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ViewerChromeAutoRotate,
        },
        {
          id: 'ViewerChromeQuality',
          title: 'Quality setting',
          note: 'Pick it when the frame rate varies: a plain choice with what each level costs and buys.',
          origin: 'custom',
          uses: ['display/MetadataList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ViewerChromeQuality,
        },
      ],
    },
    {
      id: 'navigation',
      title: 'Navigation on their own',
      description: 'The controls without a canvas, on a placeholder, so they can be read and copied alone.',
      specimens: [
        {
          id: 'ViewerChromeToolbarAlone',
          title: 'Viewer toolbar',
          note: 'Pick it for the top-left of the canvas: what a drag does, what a click does, fit and home.',
          origin: 'custom',
          uses: ['three/viewer/ViewerToolbar3d.tsx', 'actions/ToggleGroup.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ViewerChromeToolbarAlone,
        },
        {
          id: 'ViewerChromeTree',
          title: 'Model tree',
          note: 'Pick it for structure: an eye per part or group, isolate to fade the rest, and a name to select.',
          origin: 'custom',
          uses: ['three/viewer/ModelTreePanel.tsx', 'three/viewer/modelTree.ts'],
          size: 'md',
          align: 'stretch',
          Component: ViewerChromeTree,
        },
        {
          id: 'ViewerChromeCubeAlone',
          title: 'View cube',
          note: 'Pick it as an orientation gizmo; the face the camera looks at is outlined.',
          origin: 'custom',
          uses: ['three/viewer/ViewCube.tsx', 'three/viewer/viewCube.ts'],
          size: 'sm',
          align: 'stretch',
          Component: ViewerChromeCubeAlone,
        },
        {
          id: 'ViewerChromePresets',
          title: 'Camera presets',
          note: 'Pick it for one-click standard views, each with a number key.',
          origin: 'custom',
          uses: ['three/viewer/viewCube.ts', 'display/MetadataList.tsx'],
          size: 'sm',
          align: 'stretch',
          Component: ViewerChromePresets,
        },
        {
          id: 'ViewerChromeMiniMap',
          title: 'Plan inset',
          note: 'Pick it when users get lost close to the model: a plan with the camera and what it sees.',
          origin: 'custom',
          uses: ['three/viewer/MiniMap.tsx', 'three/viewer/plan.ts'],
          size: 'sm',
          align: 'stretch',
          Component: ViewerChromeMiniMap,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels and filters',
      description: 'What is shown, how it is coloured and what is selected.',
      specimens: [
        {
          id: 'ViewerChromeSelection',
          title: 'Selection info',
          note: 'Pick it for the properties of the part under the pointer: tag, state and health in words.',
          origin: 'custom',
          uses: ['three/viewer/SelectionInfoPanel.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'sm',
          align: 'stretch',
          Component: ViewerChromeSelection,
        },
        {
          id: 'ViewerChromeLayers',
          title: 'Layers with ghosting',
          note: 'Pick it to filter by system; ghost the rest to keep context, or hide it to focus.',
          origin: 'custom',
          uses: ['three/viewer/LayerFilter.tsx', 'three/viewer/modelTree.ts'],
          size: 'sm',
          align: 'stretch',
          Component: ViewerChromeLayers,
        },
        {
          id: 'ViewerChromeColorBy',
          title: 'Colour by',
          note: 'Pick it to encode a property on the model; the legend lists only colours that are in use.',
          origin: 'custom',
          uses: ['three/viewer/ColorByControl.tsx', 'three/viewer/colorBy.ts'],
          size: 'sm',
          align: 'stretch',
          Component: ViewerChromeColorBy,
        },
        {
          id: 'ViewerChromeViewpoints',
          title: 'Saved views',
          note: 'Pick it to bookmark camera positions: name a view, fly back to it later.',
          origin: 'custom',
          uses: ['three/viewer/ViewpointList.tsx', 'three/viewer/viewpoints.ts'],
          size: 'lg',
          align: 'stretch',
          Component: ViewerChromeViewpoints,
        },
        {
          id: 'ViewerChromeExplode',
          title: 'Explode',
          note: 'Pick it to pull a model apart along its own structure.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: ViewerChromeExplode,
        },
        {
          id: 'ViewerChromeXray',
          title: 'X-ray',
          note: 'Pick it to see through solid parts without losing them; the three drawing levels are shown.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ViewerChromeXray,
        },
        {
          id: 'ViewerChromeShortcuts',
          title: 'Keyboard help',
          note: 'Pick it for power users: every shortcut in groups, behind a button, closed until asked.',
          origin: 'custom',
          uses: ['three/viewer/KeyboardHelp.tsx', 'three/viewer/viewerKeymap.ts'],
          size: 'md',
          align: 'stretch',
          Component: ViewerChromeShortcuts,
        },
      ],
    },
    {
      id: 'states',
      title: 'States and help',
      description: 'Loading, failure, no 3D, shortcuts and export.',
      specimens: [
        {
          id: 'ViewerChromeLoading',
          title: 'Loading with stages',
          note: 'Pick it for large models: overall progress, each stage in words, and a failure that stays in place.',
          origin: 'custom',
          uses: ['three/viewer/ModelLoadingCard.tsx', 'three/viewer/loadingStages.ts', 'feedback/LabelledProgress.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ViewerChromeLoading,
        },
        {
          id: 'ViewerChromeUnavailable',
          title: 'Model not available',
          note: 'Pick it when there is no WebGL or no model: the structure as a list and a way forward.',
          origin: 'custom',
          uses: ['three/SceneCanvas.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ViewerChromeUnavailable,
        },
        {
          id: 'ViewerChromeExport',
          title: 'Screenshot and export',
          note: 'Pick it for hand-off: a screenshot, a link to this exact view, and exports that say why they are off.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: ViewerChromeExport,
        },
      ],
    },
  ],
});
