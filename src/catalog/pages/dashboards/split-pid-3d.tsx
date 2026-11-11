import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Switch } from '@cognite/aura/components/switch';
import { IconArrowsLeftRight, IconCheck, IconCube, IconLink, IconSchema, IconX } from '@cognite/aura/icons';
import { useReducer, useState } from 'react';
import type { Dispatch, KeyboardEvent } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { IconChip } from '../../../library/kit/IconChip';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import {
  COMPRESSION_SHEET,
  COMPRESSION_SHEET_ALARMS,
  COMPRESSION_SHEET_READINGS,
  pinsForTags,
  sheetElementOfTag,
  tagOfSheetElement,
} from '../../../library/kit/split-pid-3d/compressionSheet';
import { PidSheet } from '../../../library/kit/split-pid-3d/PidSheet';
import { LINK_STATUS_LABEL, LINK_STATUS_TONE, reconcile, settledCount, settledPercent, type ReconciliationRow } from '../../../library/kit/split-pid-3d/reconciliation';
import { Stat } from '../../../library/kit/Stat';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { COMPRESSION_INFO, COMPRESSION_LINKS } from '../../../library/three/fields/compressionArea';
import { INITIAL_LINKED_SELECTION, hoverTagOn, linkedSelectionReducer, primaryTag } from '../../../library/three/fields/linkedSelection';
import type { LinkedSelectionAction, LinkedSelectionState } from '../../../library/three/fields/linkedSelection';
import { LinkedSplit } from '../../../library/three/fields/LinkedSplit';
import { SplitScene } from '../../../library/three/fields/SplitScene';
import { linkForTag } from '../../../library/three/fields/tagMapping';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { StillScene } from '../../../library/three/scenes/StillScene';
import type { PidSelection } from '../../../library/tools/pid/pidReducer';
import { definePage } from '../../types';

import source from './split-pid-3d.tsx?raw';

const SPLITPID_ROWS = reconcile(COMPRESSION_LINKS);

const SPLITPID_MISMATCHES = SPLITPID_ROWS.filter((row) => row.status !== 'matched');

const SPLITPID_NOT_IN_MODEL = SPLITPID_ROWS.filter((row) => row.status === 'missing-in-model').map((row) => row.tag);

/** A numbered pin on the drawing over every symbol the 3D model does not have. */
const SPLITPID_PINS = pinsForTags(COMPRESSION_SHEET, SPLITPID_NOT_IN_MODEL, 'Not in the 3D model');

/** Scene labels come from the shared 3D library; here they are set in the UI sans like everything else. */
const SPLITPID_SCENE = '[&_[data-slot=scene-label]_.font-mono]:font-sans [&_[data-slot=scene-label]_.font-mono]:tabular-nums';

const SPLITPID_FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-default)]';

type SplitPidDispatch = Dispatch<LinkedSelectionAction>;

function splitPidState(tag: string): { label: string; tone: Tone } | null {
  const info = COMPRESSION_INFO[tag];
  if (!info) return null;
  if (info.valve) return info.valve === 'open' ? { label: 'Open', tone: 'success' } : info.valve === 'closed' ? { label: 'Closed', tone: 'neutral' } : { label: 'In travel', tone: 'info' };
  if (info.run === 'running') return { label: 'Running', tone: 'success' };
  if (info.run === 'tripped') return { label: 'Tripped', tone: 'critical' };
  return info.run ? { label: info.run === 'standby' ? 'Standby' : info.run === 'maintenance' ? 'Maintenance' : 'Stopped', tone: 'neutral' } : null;
}

function splitPidSheetSelection(state: LinkedSelectionState, lineId: string | null): PidSelection {
  const element = sheetElementOfTag(COMPRESSION_SHEET, state.selected.drawing);
  if (element) return { kind: 'tag', id: element };
  return lineId ? { kind: 'line', id: lineId } : null;
}

/** The drawing half: the P&ID tool's sheet in a card. Picking a symbol, a bubble or a flagged pin selects its tag. */
function SplitPidDrawingPane({ state, dispatch, lineId, onLine }: { state: LinkedSelectionState; dispatch: SplitPidDispatch; lineId: string | null; onLine: (id: string | null) => void }) {
  const select = (selection: NonNullable<PidSelection>) => {
    if (selection.kind === 'line') {
      dispatch({ type: 'clear' });
      onLine(selection.id === lineId ? null : selection.id);
      return;
    }
    const tag = selection.kind === 'pin' ? (SPLITPID_NOT_IN_MODEL[SPLITPID_PINS.findIndex((pin) => pin.id === selection.id)] ?? null) : tagOfSheetElement(COMPRESSION_SHEET, selection.id);
    onLine(null);
    if (tag) dispatch({ type: 'select', side: 'drawing', tag });
  };

  return (
    <Panel
      className="h-full"
      padding="none"
      icon={
        <IconChip tone="blue" size="sm">
          <IconSchema />
        </IconChip>
      }
      title="P&ID"
      subtitle={`${COMPRESSION_SHEET.number} · rev ${COMPRESSION_SHEET.revision} · ${COMPRESSION_SHEET.status.toLowerCase()}`}
      footer={
        <span className="flex items-center justify-between gap-4 text-sm text-medium-foreground">
          <span className="truncate">6 tags, 2 instruments</span>
          <span className="truncate">Pin 1: not in the model</span>
        </span>
      }
    >
      <PidSheet
        drawing={COMPRESSION_SHEET}
        readings={COMPRESSION_SHEET_READINGS}
        alarms={COMPRESSION_SHEET_ALARMS}
        selection={splitPidSheetSelection(state, lineId)}
        pins={SPLITPID_PINS}
        onSelect={select}
        className="flex-1 px-3 pb-3"
      />
    </Panel>
  );
}

function SplitPidFallback() {
  return (
    <ul className="flex flex-col gap-1.5 p-3 text-sm">
      {COMPRESSION_LINKS.filter((link) => link.sceneId !== null).map((link) => (
        <li key={link.tag} className="flex items-center justify-between gap-3">
          <TagId>{link.tag}</TagId>
          <span className="text-medium-foreground">{COMPRESSION_INFO[link.tag]?.name}</span>
        </li>
      ))}
    </ul>
  );
}

/** The model half: the compression area in 3D in a card, with a key for what selection and ghosting look like. */
function SplitPidScenePane({ state, dispatch, still, onPick }: { state: LinkedSelectionState; dispatch: SplitPidDispatch; still: boolean; onPick?: () => void }) {
  return (
    <Panel
      className="h-full"
      padding="none"
      icon={
        <IconChip tone="purple" size="sm">
          <IconCube />
        </IconChip>
      }
      title="3D model"
      subtitle="NK-23 gas compression · rev 12 · 7 objects"
      footer={
        <ul aria-label="Scene key" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-medium-foreground">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3 rounded-full border-2 border-[var(--kit-accent)]" /> Selected
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3 rounded-sm border border-dashed border-[var(--kit-rule-strong)] bg-[var(--kit-track)]" /> Ghosted: not on the drawing
          </li>
        </ul>
      }
    >
      <div className={`relative min-h-0 flex-1 bg-[radial-gradient(ellipse_at_50%_30%,color-mix(in_oklab,var(--kit-line-purple)_10%,transparent),transparent_70%)] ${SPLITPID_SCENE}`}>
        <SceneCanvas
          label={`3D model of the compression area${state.selected.scene ? `, ${state.selected.scene} selected` : ''}${state.drawingOnly ? ', showing only what is on the drawing' : ''}`}
          fallback={<SplitPidFallback />}
          onPointerMissed={() => dispatch({ type: 'clear' })}
        >
          <StillScene still={still}>
            <SplitScene
              links={COMPRESSION_LINKS}
              selectedTag={state.selected.scene}
              hoverTag={hoverTagOn(state, 'scene')}
              focusTag={state.focusTag}
              drawingOnly={state.drawingOnly}
              onSelect={(tag) => {
                onPick?.();
                dispatch({ type: 'select', side: 'scene', tag });
              }}
              onHover={(tag) => dispatch({ type: 'hover', side: 'scene', tag })}
            />
          </StillScene>
        </SceneCanvas>
      </div>
    </Panel>
  );
}

/** The floating toolbar: what is open on each side and how the two views are tied together. */
function SplitPidToolbar({ state, dispatch }: { state: LinkedSelectionState; dispatch: SplitPidDispatch }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[var(--kit-radius)] border border-[var(--kit-rule)] bg-[var(--kit-surface)] px-4 py-3 shadow-[var(--kit-panel-shadow)]">
      <div className="flex min-w-0 items-center gap-3">
        <IconChip tone="accent">
          <IconLink />
        </IconChip>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-6 tracking-tight text-base-foreground">Gas compression</h2>
          <p className="text-sm text-medium-foreground">Drawing and model, side by side</p>
        </div>
      </div>
      <StatusPill tone={state.sync ? 'success' : 'neutral'} size="lg" icon={<IconArrowsLeftRight />}>
        {state.sync ? 'Views linked' : 'Views independent'}
      </StatusPill>
      <div className="ml-auto flex flex-wrap items-center gap-x-6 gap-y-2">
        <Switch label="Link selection" checked={state.sync} onCheckedChange={(value) => dispatch({ type: 'setSync', value })} />
        <Switch label="Fly to selection" checked={state.follow} onCheckedChange={(value) => dispatch({ type: 'setFollow', value })} />
        <Switch label="Ghost what the drawing lacks" checked={state.drawingOnly} onCheckedChange={(value) => dispatch({ type: 'setDrawingOnly', value })} />
      </div>
    </div>
  );
}

/** One side's id for the selected tag, or a flag when that side does not have it. */
function SplitPidSideId({ side, id }: { side: 'Drawing' | 'Model'; id: string | null }) {
  return (
    <span className="flex items-center gap-2 text-sm">
      <span className="text-medium-foreground">{side}</span>
      {id ? <TagId variant="chip">{id}</TagId> : <StatusPill tone="warning">Missing</StatusPill>}
    </span>
  );
}

/** What is selected, once, for both views: the tag, its state, each side's own id and the three figures that matter. */
function SplitPidSelection({ state, dispatch, lineId = null }: { state: LinkedSelectionState; dispatch: SplitPidDispatch; lineId?: string | null }) {
  const tag = primaryTag(state);
  const info = tag ? COMPRESSION_INFO[tag] : undefined;
  const link = linkForTag(COMPRESSION_LINKS, tag);
  const status = tag ? splitPidState(tag) : null;
  const line = COMPRESSION_SHEET.lines.find((candidate) => candidate.id === lineId);

  if (!tag || !info) {
    return (
      <Panel className="h-full" title={line ? 'Process line' : 'Nothing selected'} subtitle={line ? 'Lines live on the drawing only' : 'Pick on either side; the other follows'}>
        {line ? (
          <div className="flex flex-1 flex-col justify-center gap-1">
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-base-foreground">{line.number}</p>
            <p className="text-sm text-medium-foreground">{line.service}. The 3D model carries pipe geometry without line numbers, so there is nothing to select on the other side.</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-center gap-3">
            <p className="text-sm text-medium-foreground">Click a symbol on the P&ID or a machine in the 3D model. Start with one of these:</p>
            <div className="flex flex-wrap gap-2">
              {['23-KA-9101', '23-HA-9114', '23-HV-9162'].map((quick) => (
                <Button key={quick} variant="outline" size="sm" onClick={() => dispatch({ type: 'select', side: 'drawing', tag: quick })}>
                  {quick}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Panel>
    );
  }

  return (
    <Panel
      className="h-full"
      title={info.name}
      subtitle={state.origin === 'scene' ? 'Picked in the 3D model' : 'Picked on the drawing'}
      actions={
        <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'clear' })}>
          <IconX /> Clear
        </Button>
      }
    >
      <div className="flex flex-1 flex-wrap content-center items-center gap-x-8 gap-y-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-base-foreground">{tag}</span>
            {status ? <StatusPill tone={status.tone}>{status.label}</StatusPill> : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <SplitPidSideId side="Drawing" id={link?.drawingId ?? null} />
            <IconArrowsLeftRight aria-hidden="true" className="size-4 text-muted-foreground" />
            <SplitPidSideId side="Model" id={link?.sceneId ?? null} />
          </div>
        </div>
        <div className="grid min-w-[19rem] flex-1 grid-cols-3 gap-4">
          {info.readings.map((reading) => (
            <Stat key={reading.label} variant="plain" size="sm" label={reading.label} value={reading.value} unit={reading.unit} decimals={reading.decimals ?? 0} />
          ))}
        </div>
      </div>
    </Panel>
  );
}

/** The model check: how much of the two sides agrees, and the tags that do not, each a button that selects it. */
function SplitPidModelCheck({ onSelect }: { onSelect?: (row: ReconciliationRow) => void }) {
  const matched = settledCount(SPLITPID_ROWS, []);

  return (
    <Panel className="h-full" title="Model check" subtitle={`${matched} of ${SPLITPID_ROWS.length} tags on both sides`}>
      <div className="flex flex-1 items-center gap-5">
        <RingGauge label="Tags matched" value={settledPercent(SPLITPID_ROWS, [])} tone="warning" size={104} hideLabel />
        <ul className="flex min-w-0 flex-1 flex-col">
          {SPLITPID_MISMATCHES.map((row) => (
            <li key={row.tag} className="border-b border-[var(--kit-rule)] last:border-b-0">
              <button
                type="button"
                disabled={!onSelect}
                onClick={() => onSelect?.(row)}
                className={`flex w-full items-center justify-between gap-3 rounded-[var(--kit-radius-sm)] py-2 text-left ${SPLITPID_FOCUS} ${onSelect ? 'cursor-pointer hover:bg-[var(--kit-well)]' : ''}`}
              >
                <TagId>{row.tag}</TagId>
                <StatusPill tone={LINK_STATUS_TONE[row.status]}>{LINK_STATUS_LABEL[row.status]}</StatusPill>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

function SplitPidWorkspace({ initial = INITIAL_LINKED_SELECTION, initialRatio = 50, still = false }: { initial?: LinkedSelectionState; initialRatio?: number; still?: boolean }) {
  // Archetype: a split workspace. The P&ID and the 3D model are two cards either side of a
  //   divider that drags; a floating toolbar ties them together; one selection card under both
  //   says what is picked, whichever side it was picked on.
  // Interaction: click a symbol, an instrument bubble or a pin on the drawing, or a machine in
  //   the model. The other side selects the same tag and the camera flies to it. Escape clears.
  const [state, dispatch] = useReducer(linkedSelectionReducer, initial);
  const [ratio, setRatio] = useState(initialRatio);
  const [lineId, setLineId] = useState<string | null>(null);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && (primaryTag(state) !== null || lineId !== null)) {
      event.preventDefault();
      setLineId(null);
      dispatch({ type: 'clear' });
    }
  };

  return (
    <Canvas className="h-[59.5rem]">
      <div
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onPointerDownCapture={(event) => {
          // Orbit controls swallow the pointer event, so take focus by hand to keep Escape working.
          if (event.target instanceof HTMLCanvasElement) event.currentTarget.focus({ preventScroll: true });
        }}
        className="flex h-full min-h-0 flex-col gap-4 outline-none"
      >
        <SplitPidToolbar state={state} dispatch={dispatch} />
        <LinkedSplit
          startLabel="Drawing"
          endLabel="3D model"
          ratio={ratio}
          onRatioChange={setRatio}
          limits={{ min: 44, max: 62, step: 2 }}
          start={<SplitPidDrawingPane state={state} dispatch={dispatch} lineId={lineId} onLine={setLineId} />}
          end={<SplitPidScenePane state={state} dispatch={dispatch} still={still} onPick={() => setLineId(null)} />}
        />
        <div className="grid h-60 shrink-0 grid-cols-12 gap-4">
          <div className="col-span-7 min-w-0">
            <SplitPidSelection state={state} dispatch={dispatch} lineId={lineId} />
          </div>
          <div className="col-span-5 min-w-0">
            <SplitPidModelCheck
              onSelect={(row) => {
                setLineId(null);
                dispatch({ type: 'select', side: row.status === 'missing-in-model' ? 'drawing' : 'scene', tag: row.tag });
              }}
            />
          </div>
        </div>
      </div>
    </Canvas>
  );
}

function SplitPidSignature() {
  return (
    <LookScope look="studio">
      <SplitPidWorkspace />
    </LookScope>
  );
}

const SPLITPID_SELECTED: LinkedSelectionState = { ...INITIAL_LINKED_SELECTION, selected: { drawing: '23-KA-9102', scene: '23-KA-9102' }, focusTag: '23-KA-9102', origin: 'drawing' };

const SPLITPID_GHOSTED: LinkedSelectionState = { ...INITIAL_LINKED_SELECTION, drawingOnly: true, selected: { drawing: '23-HA-9114', scene: '23-HA-9114' }, focusTag: '23-HA-9114', origin: 'scene' };

const SPLITPID_ACTION: Readonly<Record<ReconciliationRow['status'], string>> = {
  matched: 'Nothing to do',
  'missing-in-model': 'Add to the model backlog',
  'missing-on-drawing': 'Raise a drawing change',
};

function SplitPidReview() {
  // A different screen of the same product: the model check as a review. The table leads; the
  // model, ghosted to what the drawing shows, is the evidence; resolving a row moves the ring.
  const [tag, setTag] = useState('23-XV-9171');
  const [resolved, setResolved] = useState<readonly string[]>([]);
  const row = SPLITPID_ROWS.find((candidate) => candidate.tag === tag) ?? SPLITPID_ROWS[0];
  const sceneTag = row && row.sceneId !== null ? row.tag : null;
  const scene: LinkedSelectionState = { ...INITIAL_LINKED_SELECTION, drawingOnly: true, selected: { drawing: null, scene: sceneTag }, focusTag: sceneTag };
  const done = row ? row.status === 'matched' || resolved.includes(row.tag) : true;
  const columns: DataTableColumn<ReconciliationRow>[] = [
    {
      id: 'tag',
      header: 'Tag',
      cell: (entry) => (
        <button type="button" aria-pressed={entry.tag === tag} onClick={() => setTag(entry.tag)} className={`flex cursor-pointer flex-col rounded-[var(--kit-radius-sm)] text-left ${SPLITPID_FOCUS}`}>
          <TagId>{entry.tag}</TagId>
          <span className="text-sm text-medium-foreground">{COMPRESSION_INFO[entry.tag]?.name}</span>
        </button>
      ),
    },
    { id: 'drawing', header: 'Drawing id', cell: (entry) => entry.drawingId ?? '—', muted: true, nowrap: true },
    { id: 'model', header: 'Model id', cell: (entry) => entry.sceneId ?? '—', muted: true, nowrap: true },
    {
      id: 'status',
      header: 'Check',
      nowrap: true,
      cell: (entry) =>
        resolved.includes(entry.tag) ? (
          <StatusPill tone="info" icon={<IconCheck />}>
            Resolved
          </StatusPill>
        ) : (
          <StatusPill tone={LINK_STATUS_TONE[entry.status]}>{LINK_STATUS_LABEL[entry.status]}</StatusPill>
        ),
    },
  ];

  return (
    <LookScope look="studio">
      <Canvas className="grid h-[41rem] grid-cols-12 grid-rows-[minmax(0,1fr)] gap-4">
        <Panel
          className="col-span-7 min-h-0 overflow-y-auto"
          padding="none"
          title="Model check review"
          subtitle={`${COMPRESSION_SHEET.number} against model NK-23 · ${settledCount(SPLITPID_ROWS, resolved)} of ${SPLITPID_ROWS.length} tags settled`}
          actions={<RingGauge label="Tags settled" value={settledPercent(SPLITPID_ROWS, resolved)} tone={settledPercent(SPLITPID_ROWS, resolved) === 100 ? 'success' : 'warning'} size={56} hideLabel />}
        >
          <DataTable
            label="Tags on the drawing and in the model"
            flush
            columns={columns}
            rows={SPLITPID_ROWS}
            rowKey={(entry) => entry.tag}
            rowTone={(entry) => (entry.tag === tag ? 'accent' : entry.status !== 'matched' && !resolved.includes(entry.tag) ? 'warning' : undefined)}
          />
        </Panel>
        <div className="col-span-5 flex min-h-0 flex-col gap-4">
          <div className="min-h-0 flex-1">
            <SplitPidScenePane state={scene} dispatch={() => undefined} still />
          </div>
          {row ? (
            <Panel
              className="h-auto shrink-0"
              title={COMPRESSION_INFO[row.tag]?.name ?? row.tag}
              subtitle={row.tag}
              actions={resolved.includes(row.tag) ? <StatusPill tone="info">Resolved</StatusPill> : <StatusPill tone={LINK_STATUS_TONE[row.status]}>{LINK_STATUS_LABEL[row.status]}</StatusPill>}
            >
              <p className="text-sm text-medium-foreground">
                {row.status === 'matched'
                  ? 'The drawing and the model agree on this tag. Selecting it on either side finds it on the other.'
                  : row.status === 'missing-in-model'
                    ? 'The drawing shows this valve on the recycle line, but nothing in the model carries its tag. It was most likely added after the last laser scan.'
                    : 'The model has this object, but revision C of the drawing does not show it. Either the drawing is behind or the object belongs to another sheet.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" disabled={done} onClick={() => setResolved([...resolved, row.tag])}>
                  {SPLITPID_ACTION[row.status]}
                </Button>
                <Button variant="outline" size="sm" disabled={!resolved.includes(row.tag)} onClick={() => setResolved(resolved.filter((entry) => entry !== row.tag))}>
                  Reopen
                </Button>
              </div>
            </Panel>
          ) : null}
        </div>
      </Canvas>
    </LookScope>
  );
}

function SplitPidTablet() {
  // The same linked selection at tablet width: no room for two panes, so one is shown at a time
  // and the selection card under it carries the pick across when the view is switched.
  const [state, dispatch] = useReducer(linkedSelectionReducer, SPLITPID_SELECTED);
  const [view, setView] = useState('drawing');
  const [lineId, setLineId] = useState<string | null>(null);

  return (
    <LookScope look="studio">
      <Canvas className="flex justify-center">
        <div className="flex w-full max-w-[46rem] flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--kit-radius)] border border-[var(--kit-rule)] bg-[var(--kit-surface)] px-4 py-3 shadow-[var(--kit-panel-shadow)]">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-6 tracking-tight text-base-foreground">Gas compression</h2>
              <p className="text-sm text-medium-foreground">The selection stays when you switch view</p>
            </div>
            <SegmentedControl value={view} onValueChange={(next) => setView(String(next))}>
              <SegmentedControlList aria-label="View">
                <SegmentedControlButton value="drawing">P&ID</SegmentedControlButton>
                <SegmentedControlButton value="model">3D model</SegmentedControlButton>
              </SegmentedControlList>
            </SegmentedControl>
          </div>
          <div className="h-[36rem]">
            {view === 'drawing' ? <SplitPidDrawingPane state={state} dispatch={dispatch} lineId={lineId} onLine={setLineId} /> : <SplitPidScenePane state={state} dispatch={dispatch} still onPick={() => setLineId(null)} />}
          </div>
          <div className="h-60">
            <SplitPidSelection state={state} dispatch={dispatch} lineId={lineId} />
          </div>
        </div>
      </Canvas>
    </LookScope>
  );
}

function SplitPidPartToolbar() {
  const [state, dispatch] = useReducer(linkedSelectionReducer, INITIAL_LINKED_SELECTION);

  return (
    <LookScope look="studio">
      <Canvas>
        <SplitPidToolbar state={state} dispatch={dispatch} />
      </Canvas>
    </LookScope>
  );
}

function SplitPidPartDrawing() {
  const [state, dispatch] = useReducer(linkedSelectionReducer, { ...INITIAL_LINKED_SELECTION, selected: { drawing: '23-KA-9101', scene: '23-KA-9101' }, origin: 'drawing' });
  const [lineId, setLineId] = useState<string | null>(null);

  return (
    <LookScope look="studio">
      <Canvas>
        <div className="h-[36rem]">
          <SplitPidDrawingPane state={state} dispatch={dispatch} lineId={lineId} onLine={setLineId} />
        </div>
      </Canvas>
    </LookScope>
  );
}

function SplitPidPartScene() {
  const [state, dispatch] = useReducer(linkedSelectionReducer, SPLITPID_GHOSTED);

  return (
    <LookScope look="studio">
      <Canvas className="flex flex-col gap-4">
        <div className="h-[28rem]">
          <SplitPidScenePane state={state} dispatch={dispatch} still />
        </div>
        <Switch label="Ghost what the drawing lacks" checked={state.drawingOnly} onCheckedChange={(value) => dispatch({ type: 'setDrawingOnly', value })} />
      </Canvas>
    </LookScope>
  );
}

function SplitPidPartSelection() {
  const [state, dispatch] = useReducer(linkedSelectionReducer, SPLITPID_SELECTED);

  return (
    <LookScope look="studio">
      <Canvas>
        <div className="h-60">
          <SplitPidSelection state={state} dispatch={dispatch} />
        </div>
      </Canvas>
    </LookScope>
  );
}

function SplitPidPartMissing() {
  const [state, dispatch] = useReducer(linkedSelectionReducer, { ...INITIAL_LINKED_SELECTION, selected: { drawing: '23-HV-9162', scene: '23-HV-9162' }, origin: 'drawing' });

  return (
    <LookScope look="studio">
      <Canvas>
        <div className="h-60">
          <SplitPidSelection state={state} dispatch={dispatch} />
        </div>
      </Canvas>
    </LookScope>
  );
}

function SplitPidPartModelCheck() {
  return (
    <LookScope look="studio">
      <Canvas>
        <div className="h-60">
          <SplitPidModelCheck />
        </div>
      </Canvas>
    </LookScope>
  );
}

function SplitPidPartDivider() {
  const [ratio, setRatio] = useState(40);

  return (
    <LookScope look="studio">
      <Canvas>
        <div className="flex h-44">
          <LinkedSplit
            startLabel="Drawing"
            endLabel="3D model"
            ratio={ratio}
            onRatioChange={setRatio}
            start={
              <Panel className="h-full" title="P&ID">
                <p className="text-3xl font-semibold tabular-nums text-base-foreground">{Math.round(ratio)}%</p>
              </Panel>
            }
            end={
              <Panel className="h-full" title="3D model" subtitle="Drag the divider, or focus it and use the arrow keys">
                <p className="text-3xl font-semibold tabular-nums text-base-foreground">{100 - Math.round(ratio)}%</p>
              </Panel>
            }
          />
        </div>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'split-pid-3d',
  title: 'P&ID beside 3D',
  summary:
    'A split workspace that ties a P&ID to the 3D model of the same area by functional location tag: pick a symbol or a machine and the other side selects it, a card under both says what it is, and a model check lists the tags only one side has.',
  guidance: {
    use: [
      'When engineers move between a drawing and the physical layout and need to keep their place in both.',
      'Key the link on the tag, not on either side’s own id, and show both ids so a mismatch can be traced.',
      'Say what is selected once, outside the two views, so it reads the same whichever side it came from.',
    ],
    avoid: [
      'Linking that cannot be switched off: sometimes the two views are needed independently.',
      'Hiding what one side lacks — flag it on the drawing, ghost it in the model and list it in the check.',
      'Shrinking the drawing until its text is unreadable; let the pane scroll instead.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Click a symbol, an instrument bubble or the pin on the drawing, or a machine in the model: the other side follows and the camera flies in. Drag the divider, switch linking off in the toolbar, press Escape to clear.',
      specimens: [
        {
          id: 'SplitPidSignature',
          title: 'Linked workspace',
          note: 'Pick it when a drawing and a model of the same area are read together and selection has to carry across.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: [
            'kit/split-pid-3d/PidSheet.tsx',
            'kit/split-pid-3d/compressionSheet.ts',
            'kit/split-pid-3d/reconciliation.ts',
            'tools/pid/PidCanvas.tsx',
            'three/fields/SplitScene.tsx',
            'three/fields/LinkedSplit.tsx',
            'three/fields/linkedSelection.ts',
            'kit/Panel.tsx',
            'kit/Stat.tsx',
          ],
          Component: SplitPidSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The model check as a review that is worked through row by row, and the linked selection at tablet width with one view at a time.',
      specimens: [
        {
          id: 'SplitPidReview',
          title: 'Model check review',
          note: 'Pick it for the person who keeps the twin honest: every tag in a table, the evidence beside it and an action per mismatch.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/split-pid-3d/reconciliation.ts', 'kit/DataTable.tsx', 'kit/RingGauge.tsx', 'three/fields/SplitScene.tsx'],
          Component: SplitPidReview,
        },
        {
          id: 'SplitPidTablet',
          title: 'One view at a time',
          note: 'Pick it where two panes do not fit: the selection card carries the pick from the drawing to the model and back.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/split-pid-3d/PidSheet.tsx', 'three/fields/SplitScene.tsx', 'three/fields/linkedSelection.ts'],
          Component: SplitPidTablet,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The cards of the workspace on their own.',
      specimens: [
        {
          id: 'SplitPidPartToolbar',
          title: 'Link toolbar',
          note: 'Pick it above two linked views: what is open and the three ways the views are tied together.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/IconChip.tsx', 'kit/StatusPill.tsx', 'three/fields/linkedSelection.ts'],
          Component: SplitPidPartToolbar,
        },
        {
          id: 'SplitPidPartDrawing',
          title: 'P&ID card',
          note: 'Pick it to show a sheet from the P&ID tool at a readable size, with live values, an alarm and a flagged symbol.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/split-pid-3d/PidSheet.tsx', 'kit/split-pid-3d/compressionSheet.ts', 'tools/pid/PidCanvas.tsx'],
          Component: SplitPidPartDrawing,
        },
        {
          id: 'SplitPidPartScene',
          title: '3D card with ghosting',
          note: 'Pick it to show which objects of a model a drawing covers: the rest fades back and cannot be selected.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['three/fields/SplitScene.tsx', 'three/SceneCanvas.tsx'],
          Component: SplitPidPartScene,
        },
        {
          id: 'SplitPidPartSelection',
          title: 'Selection card',
          note: 'Pick it under two linked views: the tag once, each side’s own id and the figures that matter.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Stat.tsx', 'kit/TagId.tsx', 'three/fields/tagMapping.ts'],
          Component: SplitPidPartSelection,
        },
        {
          id: 'SplitPidPartMissing',
          title: 'Selection missing on one side',
          note: 'Pick it for the case the link cannot be followed: the side without the tag is flagged instead of left blank.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/StatusPill.tsx'],
          Component: SplitPidPartMissing,
        },
        {
          id: 'SplitPidPartModelCheck',
          title: 'Model check card',
          note: 'Pick it to keep the mismatch between drawing and model in view while working in either.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/split-pid-3d/reconciliation.ts', 'kit/RingGauge.tsx'],
          Component: SplitPidPartModelCheck,
        },
        {
          id: 'SplitPidPartDivider',
          title: 'Split divider',
          note: 'Pick it between two views that share a width: it drags, takes arrow keys and announces the new share.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['three/fields/LinkedSplit.tsx', 'three/fields/splitRatio.ts'],
          Component: SplitPidPartDivider,
        },
      ],
    },
  ],
});
