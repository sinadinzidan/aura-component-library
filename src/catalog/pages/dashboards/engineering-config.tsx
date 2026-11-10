import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconAlertTriangle, IconArrowBackUp, IconCircleCheck, IconDownload, IconSend } from '@cognite/aura/icons';
import { useState } from 'react';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardCell, DashboardGrid } from '../../../library/dashboards/DashboardGrid';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import {
  LIMIT_LABELS,
  LIMIT_ORDER,
  parseLimit,
  validateLimits,
} from '../../../library/dashboards/panels/engineering-config/limitOrder';
import type { LimitIssue, LimitKey, LimitSet } from '../../../library/dashboards/panels/engineering-config/limitOrder';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ChangeDiff } from '../../../library/patterns/collaboration/ChangeDiff';
import { EditableCell } from '../../../library/patterns/data-entry/EditableCell';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { definePage } from '../../types';

import source from './engineering-config.tsx?raw';

type EngConfigField = LimitKey | 'deadband';

type EngConfigTag = {
  id: string;
  tag: string;
  name: string;
  /** Area number, the first part of the tag. */
  area: string;
  unit: string;
  limits: LimitSet;
  deadband: number;
};

/** Edited values per tag id. A field is present only while it differs from the baseline. */
type EngConfigEdits = Readonly<Record<string, Partial<Record<EngConfigField, number | null>>>>;

type EngConfigHistoryItem = {
  id: string;
  title: string;
  by: string;
  date: string;
  state: 'applied' | 'rejected' | 'awaiting';
};

type EngConfigChange = {
  tag: EngConfigTag;
  fields: readonly { field: EngConfigField; before: number | null; after: number | null }[];
  /** The four limits as they would be after the change. */
  limits: LimitSet;
  issues: readonly LimitIssue[];
};

const ENG_CONFIG_TAGS: readonly EngConfigTag[] = [
  { id: 'tt-92532', tag: '23-TT-92532', name: 'Discharge temperature', area: '23', unit: '°C', limits: { ll: null, l: 90, h: 145, hh: 155 }, deadband: 2 },
  { id: 'vt-92540', tag: '23-VT-92540', name: 'Drive-end vibration', area: '23', unit: 'mm/s', limits: { ll: null, l: null, h: 7.1, hh: 11 }, deadband: 0.3 },
  { id: 'pt-92531', tag: '23-PT-92531', name: 'Discharge pressure', area: '23', unit: 'barg', limits: { ll: 35, l: 40, h: 52, hh: 55 }, deadband: 0.5 },
  { id: 'pt-92530', tag: '23-PT-92530', name: 'Suction pressure', area: '23', unit: 'barg', limits: { ll: 8, l: 10, h: 15, hh: 17 }, deadband: 0.2 },
  { id: 'tt-91141', tag: '23-TT-91141', name: 'Cooler outlet temperature', area: '23', unit: '°C', limits: { ll: null, l: 20, h: 40, hh: 45 }, deadband: 1 },
  { id: 'lt-10012', tag: '20-LT-10012', name: 'Separator level', area: '20', unit: '%', limits: { ll: 15, l: 30, h: 70, hh: 85 }, deadband: 2 },
  { id: 'pt-10010', tag: '20-PT-10010', name: 'Separator pressure', area: '20', unit: 'barg', limits: { ll: 9, l: 11, h: 15, hh: 17 }, deadband: 0.2 },
  { id: 'it-20013', tag: '27-IT-20013', name: 'Motor current', area: '27', unit: 'A', limits: { ll: null, l: 40, h: 95, hh: 105 }, deadband: 1 },
  { id: 'ft-20011', tag: '27-FT-20011', name: 'Export flow', area: '27', unit: 'm³/h', limits: { ll: 250, l: 300, h: 480, hh: 520 }, deadband: 5 },
];

const ENG_CONFIG_AREAS = [
  { value: 'all', label: 'All' },
  { value: '20', label: '20' },
  { value: '23', label: '23' },
  { value: '27', label: '27' },
] as const;

const ENG_CONFIG_FIELDS: readonly EngConfigField[] = [...LIMIT_ORDER, 'deadband'];

const ENG_CONFIG_FIELD_LABEL: Record<EngConfigField, string> = { ...LIMIT_LABELS, deadband: 'DB' };

const ENG_CONFIG_FIELD_NAME: Record<EngConfigField, string> = {
  ll: 'Low-low limit',
  l: 'Low limit',
  h: 'High limit',
  hh: 'High-high limit',
  deadband: 'Deadband',
};

const ENG_CONFIG_SEED_EDITS: EngConfigEdits = { 'tt-92532': { h: 148 }, 'vt-92540': { hh: 6.5 } };

const ENG_CONFIG_HISTORY: readonly EngConfigHistoryItem[] = [
  { id: 'MOC-2291', title: 'Lowered H on 23-TT-91141 to 40 °C', by: 'Aisha Khan', date: '11 Mar', state: 'applied' },
  { id: 'MOC-2288', title: 'Added HH on 27-IT-20013 at 105 A', by: 'Jonas Nyberg', date: '9 Mar', state: 'applied' },
  { id: 'MOC-2285', title: 'Widened deadband on 20-LT-10012 to 5 %', by: 'Jonas Nyberg', date: '6 Mar', state: 'rejected' },
  { id: 'MOC-2279', title: 'Raised L on 23-PT-92530 to 10 barg', by: 'Aisha Khan', date: '2 Mar', state: 'applied' },
  { id: 'MOC-2274', title: 'Set LL and HH on 27-FT-20011', by: 'Aisha Khan', date: '26 Feb', state: 'applied' },
];

const ENG_CONFIG_HISTORY_STATE = {
  applied: { tone: 'neutral', label: 'Applied', shape: 'dot' },
  rejected: { tone: 'critical', label: 'Rejected', shape: 'square' },
  awaiting: { tone: 'info', label: 'Awaiting approval', shape: 'ring' },
} as const;

const ENG_CONFIG_NO_VALUE = '—';

function engConfigBaseline(tag: EngConfigTag, field: EngConfigField): number | null {
  return field === 'deadband' ? tag.deadband : tag.limits[field];
}

function engConfigCurrent(tag: EngConfigTag, edits: EngConfigEdits, field: EngConfigField): number | null {
  const edited = edits[tag.id]?.[field];
  return edited === undefined ? engConfigBaseline(tag, field) : edited;
}

function engConfigText(value: number | null): string {
  return value === null ? ENG_CONFIG_NO_VALUE : String(value);
}

/** The pending change set: every tag with at least one edited field, checked against the limit rules. */
function engConfigChanges(edits: EngConfigEdits): EngConfigChange[] {
  return ENG_CONFIG_TAGS.flatMap((tag) => {
    const fields = ENG_CONFIG_FIELDS.flatMap((field) => {
      const after = edits[tag.id]?.[field];
      return after === undefined ? [] : [{ field, before: engConfigBaseline(tag, field), after }];
    });
    if (fields.length === 0) return [];
    const limits: LimitSet = {
      ll: engConfigCurrent(tag, edits, 'll'),
      l: engConfigCurrent(tag, edits, 'l'),
      h: engConfigCurrent(tag, edits, 'h'),
      hh: engConfigCurrent(tag, edits, 'hh'),
    };
    return [{ tag, fields, limits, issues: validateLimits(limits, engConfigCurrent(tag, edits, 'deadband') ?? 0) }];
  });
}

function engConfigValidateCell(field: EngConfigField) {
  return (text: string): string | null => {
    const parsed = parseLimit(text);
    if (parsed === undefined) return 'Enter a number';
    if (parsed === null && field === 'deadband') return 'A deadband is required';
    return null;
  };
}

type EngConfigState = {
  edits: EngConfigEdits;
  changes: readonly EngConfigChange[];
  history: readonly EngConfigHistoryItem[];
  submittedId: string | null;
  setField: (tagId: string, field: EngConfigField, value: number | null) => void;
  revertTag: (tagId: string) => void;
  discard: () => void;
  submit: () => void;
};

function useEngConfigState(initialEdits: EngConfigEdits): EngConfigState {
  const [edits, setEdits] = useState<EngConfigEdits>(initialEdits);
  const [history, setHistory] = useState(ENG_CONFIG_HISTORY);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const changes = engConfigChanges(edits);

  const setField = (tagId: string, field: EngConfigField, value: number | null) => {
    const tag = ENG_CONFIG_TAGS.find((candidate) => candidate.id === tagId);
    if (!tag) return;
    setSubmittedId(null);
    setEdits((current) => {
      const next = { ...current[tagId] };
      if (value === engConfigBaseline(tag, field)) delete next[field];
      else next[field] = value;
      return { ...current, [tagId]: next };
    });
  };

  const revertTag = (tagId: string) => setEdits((current) => ({ ...current, [tagId]: {} }));

  const discard = () => setEdits({});

  const submit = () => {
    const id = `MOC-${2292 + history.length - ENG_CONFIG_HISTORY.length}`;
    const fieldCount = changes.reduce((sum, change) => sum + change.fields.length, 0);
    const title = `${fieldCount} limit ${fieldCount === 1 ? 'change' : 'changes'} on ${changes.map((change) => change.tag.tag).join(', ')}`;
    setHistory((current) => [{ id, title, by: 'Ingrid Haugen', date: '12 Mar', state: 'awaiting' }, ...current]);
    setSubmittedId(id);
    setEdits({});
  };

  return { edits, changes, history, submittedId, setField, revertTag, discard, submit };
}

type EngConfigFilterProps = {
  query: string;
  area: string;
  onQueryChange: (query: string) => void;
  onAreaChange: (area: string) => void;
};

function EngConfigFilter({ query, area, onQueryChange, onAreaChange }: EngConfigFilterProps) {
  return (
    <div className="flex w-full flex-wrap items-center gap-3">
      <div className="min-w-40 flex-1">
        <Input
          aria-label="Filter tags by tag or name"
          placeholder="Filter by tag or name"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>
      <SegmentedControl value={area} onValueChange={(value) => onAreaChange(String(value))}>
        <SegmentedControlList size="small" aria-label="Area">
          {ENG_CONFIG_AREAS.map((option) => (
            <SegmentedControlButton key={option.value} value={option.value}>
              {option.label}
            </SegmentedControlButton>
          ))}
        </SegmentedControlList>
      </SegmentedControl>
    </div>
  );
}

type EngConfigTablePanelProps = Pick<EngConfigState, 'edits' | 'setField'>;

/** The left half: the baseline with every limit cell editable in place. */
function EngConfigTablePanel({ edits, setField }: EngConfigTablePanelProps) {
  const [query, setQuery] = useState('');
  const [area, setArea] = useState('all');
  const needle = query.trim().toLowerCase();
  const matches = ENG_CONFIG_TAGS.filter(
    (tag) =>
      (area === 'all' || tag.area === area) &&
      (needle === '' || tag.tag.toLowerCase().includes(needle) || tag.name.toLowerCase().includes(needle))
  );
  const rows = matches.slice(0, 8);

  return (
    <DashboardPanel
      title="Alarm limits"
      description="Baseline of 11 Mar · select a cell to edit it"
      footnote={`Showing ${rows.length} of ${matches.length} matching tags, ${ENG_CONFIG_TAGS.length} in the baseline. Edited cells are bold and shaded.`}
    >
      <EngConfigFilter query={query} area={area} onQueryChange={setQuery} onAreaChange={setArea} />
      {rows.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">No tag matches the filter. Clear the text or pick another area.</p>
      ) : (
        <table className="w-full table-fixed text-left text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th scope="col" className="pb-2 pr-2 font-medium">
                Tag
              </th>
              {ENG_CONFIG_FIELDS.map((field) => (
                <th key={field} scope="col" className="w-[14%] pb-2 pr-2 text-right font-medium">
                  <abbr title={ENG_CONFIG_FIELD_NAME[field]} className="no-underline">
                    {ENG_CONFIG_FIELD_LABEL[field]}
                  </abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((tag) => (
              <tr key={tag.id} className="border-t border-default align-top">
                <th scope="row" className="py-1.5 pr-2 font-normal">
                  <p className="font-mono text-xs text-base-foreground">
                    {tag.tag} <span className="text-muted-foreground">{tag.unit}</span>
                  </p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{tag.name}</p>
                </th>
                {ENG_CONFIG_FIELDS.map((field) => {
                  const edited = edits[tag.id]?.[field] !== undefined;
                  const text = engConfigText(engConfigCurrent(tag, edits, field));
                  return (
                    <td key={field} className={`py-0.5 ${edited ? 'bg-medium-background' : ''}`}>
                      <EditableCell
                        value={text}
                        label={`${ENG_CONFIG_FIELD_NAME[field]} for ${tag.tag}`}
                        align="end"
                        inputMode="decimal"
                        validate={engConfigValidateCell(field)}
                        display={
                          <span className={`font-mono text-xs ${edited ? 'font-semibold' : ''}`}>
                            {text}
                            {edited ? <span className="sr-only"> (edited)</span> : null}
                          </span>
                        }
                        onSave={(next) => {
                          const parsed = parseLimit(next);
                          if (parsed !== undefined) setField(tag.id, field, parsed);
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DashboardPanel>
  );
}

type EngConfigChangesProps = Pick<EngConfigState, 'changes' | 'revertTag'>;

/** The right half, top: the change set as before and after, one block per tag. */
function EngConfigPendingPanel({ changes, revertTag }: EngConfigChangesProps) {
  const fieldCount = changes.reduce((sum, change) => sum + change.fields.length, 0);
  return (
    <DashboardPanel
      title="Pending changes"
      description={
        changes.length === 0
          ? 'Nothing edited yet'
          : `${fieldCount} ${fieldCount === 1 ? 'value' : 'values'} on ${changes.length} ${changes.length === 1 ? 'tag' : 'tags'}, baseline to proposed`
      }
    >
      {changes.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">
          Edit a limit in the table and it appears here as a before and after pair, ready to check and submit.
        </p>
      ) : (
        <ul className="flex w-full flex-col">
          {changes.map((change) => (
            <li key={change.tag.id} className="flex items-start gap-3 border-t border-default py-3 first:border-t-0 first:pt-0">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="text-sm text-base-foreground">
                  <span className="font-mono text-xs">{change.tag.tag}</span> · {change.tag.name}
                </p>
                {change.fields.map((entry) => (
                  <ChangeDiff
                    key={entry.field}
                    field={ENG_CONFIG_FIELD_NAME[entry.field]}
                    before={`${engConfigText(entry.before)} ${change.tag.unit}`}
                    after={`${engConfigText(entry.after)} ${change.tag.unit}`}
                    mono
                  />
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={() => revertTag(change.tag.id)}>
                <IconArrowBackUp /> Revert
              </Button>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}

function EngConfigValidationPanel({ changes }: Pick<EngConfigState, 'changes'>) {
  const failed = changes.filter((change) => change.issues.length > 0).length;
  return (
    <DashboardPanel
      title="Validation"
      description="Limit order LL < L < H < HH and a deadband inside the L to H band"
      footnote={
        changes.length === 0
          ? 'Checks run on every edit.'
          : failed === 0
            ? 'Every changed tag passes. The change set can be submitted.'
            : `${failed} of ${changes.length} changed tags fail a check. Edit the limit or revert the tag.`
      }
    >
      {changes.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">No changes to check.</p>
      ) : (
        <ul className="flex w-full flex-col gap-3">
          {changes.map((change) => (
            <li key={change.tag.id} className="flex items-start gap-2">
              {change.issues.length === 0 ? (
                <IconCircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              ) : (
                <IconAlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-critical-foreground-strong" />
              )}
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-base-foreground">
                  <span className="font-mono text-xs">{change.tag.tag}</span>{' '}
                  <span className={change.issues.length === 0 ? 'text-medium-foreground' : 'font-medium text-critical-foreground-strong'}>
                    {change.issues.length === 0 ? 'Passed' : 'Failed'}
                  </span>
                </p>
                {change.issues.length === 0 ? (
                  <p className="font-mono text-xs text-muted-foreground">
                    {LIMIT_ORDER.filter((key) => change.limits[key] !== null)
                      .map((key) => `${LIMIT_LABELS[key]} ${engConfigText(change.limits[key])}`)
                      .join(' < ')}
                  </p>
                ) : (
                  change.issues.map((issue) => (
                    <p key={issue.message} className="text-xs text-medium-foreground">
                      {issue.message}
                    </p>
                  ))
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}

type EngConfigSubmitBarProps = Pick<EngConfigState, 'changes' | 'submittedId' | 'discard' | 'submit'>;

function EngConfigSubmitBar({ changes, submittedId, discard, submit }: EngConfigSubmitBarProps) {
  const failed = changes.filter((change) => change.issues.length > 0).length;
  const blocked = changes.length === 0 || failed > 0;
  let message = `${changes.length} ${changes.length === 1 ? 'tag' : 'tags'} changed, all checks passed. Aisha Khan approves limit changes in area 23.`;
  if (failed > 0) message = `Submitting is blocked: ${failed} ${failed === 1 ? 'tag fails' : 'tags fail'} validation.`;
  else if (changes.length === 0) {
    message = submittedId
      ? `Sent for approval as ${submittedId}. The baseline changes when it is approved.`
      : 'Nothing to submit. Edit a limit to start a change set.';
  }

  return (
    <div
      role="group"
      aria-label="Submit change set"
      className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-xl bg-card-background p-4"
    >
      <p aria-live="polite" className="min-w-64 flex-1 text-sm text-medium-foreground">
        {message}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="sm" disabled={changes.length === 0} onClick={discard}>
          Discard all
        </Button>
        <Button size="sm" disabled={blocked} onClick={submit}>
          <IconSend /> Submit for approval
        </Button>
      </div>
    </div>
  );
}

function EngConfigHistoryPanel({ history }: Pick<EngConfigState, 'history'>) {
  return (
    <DashboardPanel title="Change history" description="Latest change sets on the Nordkapp baseline, newest first">
      <ol className="grid w-full grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-5">
        {history.slice(0, 5).map((item) => (
          <li key={item.id} className="flex min-w-0 flex-col gap-1 border-t border-emphasized pt-3">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <span className="font-mono text-xs text-base-foreground">{item.id}</span>
              <StatusIndicator {...ENG_CONFIG_HISTORY_STATE[item.state]} size="sm" />
            </div>
            <p className="line-clamp-2 text-sm text-base-foreground">{item.title}</p>
            <p className="text-xs text-muted-foreground">
              {item.by} · {item.date}
            </p>
          </li>
        ))}
      </ol>
    </DashboardPanel>
  );
}

/**
 * Archetype: split screen with a diff — the baseline on the left, the proposed change on the right.
 * Dominant element: the editable limit table that fills the left half.
 * Interaction: editing a cell on the left adds a before and after pair on the right, re-runs the
 * limit order check and unlocks or blocks the submit bar; submitting moves the set into the history strip.
 */
function EngConfigDashboard() {
  const state = useEngConfigState(ENG_CONFIG_SEED_EDITS);
  const pending = state.changes.length;

  return (
    <DashboardFrame
      title="Engineering configuration"
      subtitle="Alarm limits · Nordkapp gas processing plant · baseline of 11 Mar 2026"
      status={
        pending > 0 ? (
          <StatusIndicator tone="info" shape="ring" label={`${pending} ${pending === 1 ? 'tag' : 'tags'} with pending changes`} />
        ) : (
          <StatusIndicator tone="neutral" label="No pending changes" />
        )
      }
      actions={
        <Button variant="outline" size="sm">
          <IconDownload /> Export baseline
        </Button>
      }
    >
      <DashboardGrid>
        <DashboardCell span={6}>
          <EngConfigTablePanel edits={state.edits} setField={state.setField} />
        </DashboardCell>
        <DashboardCell span={6}>
          <div className="flex flex-col gap-4 [&>*:first-child]:flex-1">
            <EngConfigPendingPanel changes={state.changes} revertTag={state.revertTag} />
            <EngConfigValidationPanel changes={state.changes} />
            <EngConfigSubmitBar
              changes={state.changes}
              submittedId={state.submittedId}
              discard={state.discard}
              submit={state.submit}
            />
          </div>
        </DashboardCell>
        <DashboardCell span={12}>
          <EngConfigHistoryPanel history={state.history} />
        </DashboardCell>
      </DashboardGrid>
    </DashboardFrame>
  );
}

function EngConfigDashSignature() {
  return (
    <ThemeScope preset="schematic" className="w-full">
      <EngConfigDashboard />
    </ThemeScope>
  );
}

function EngConfigDashAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <EngConfigDashboard />
    </ThemeScope>
  );
}

function EngConfigDashBlueprint() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <EngConfigDashboard />
    </ThemeScope>
  );
}

function EngConfigDashTerminal() {
  return (
    <ThemeScope preset="terminal" className="w-full">
      <EngConfigDashboard />
    </ThemeScope>
  );
}

function EngConfigDashLimitTable() {
  const state = useEngConfigState({ 'pt-92531': { h: 51 } });
  return <EngConfigTablePanel edits={state.edits} setField={state.setField} />;
}

function EngConfigDashPending() {
  const state = useEngConfigState({ 'tt-92532': { h: 148, hh: 158 }, 'lt-10012': { deadband: 3 } });
  return <EngConfigPendingPanel changes={state.changes} revertTag={state.revertTag} />;
}

function EngConfigDashValidation() {
  const state = useEngConfigState({ 'tt-92532': { h: 148 }, 'vt-92540': { hh: 6.5 }, 'pt-10010': { deadband: 4 } });
  return <EngConfigValidationPanel changes={state.changes} />;
}

function EngConfigDashSubmitReady() {
  const state = useEngConfigState({ 'tt-92532': { h: 148 } });
  return <EngConfigSubmitBar changes={state.changes} submittedId={state.submittedId} discard={state.discard} submit={state.submit} />;
}

function EngConfigDashSubmitBlocked() {
  const state = useEngConfigState({ 'vt-92540': { hh: 6.5 } });
  return <EngConfigSubmitBar changes={state.changes} submittedId={state.submittedId} discard={state.discard} submit={state.submit} />;
}

function EngConfigDashFilter() {
  const [query, setQuery] = useState('92');
  const [area, setArea] = useState('23');
  return <EngConfigFilter query={query} area={area} onQueryChange={setQuery} onAreaChange={setArea} />;
}

function EngConfigDashHistory() {
  return <EngConfigHistoryPanel history={ENG_CONFIG_HISTORY} />;
}

export default definePage({
  id: 'engineering-config',
  title: 'Engineering configuration',
  summary:
    'Change alarm limits without losing track of what changed: the baseline is edited in place on the left, and the right half shows the change set as before and after, checks it and sends it for approval.',
  guidance: {
    use: [
      'For limits, setpoints and other configuration that needs review before it applies.',
      'When the person editing must see the whole proposal, not only the cell in front of them.',
      'Check the rules on every edit and say which pair of limits clashes.',
      'Keep the history in view, so a new change is read against the last few.',
    ],
    avoid: [
      'Saving each cell on its own when the limits of a tag only make sense together.',
      'Blocking the cell on an order error; let it through and block the submit with the reason.',
      'Marking edited cells by colour alone.',
      'Hiding who approves: say it beside the submit button.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Shown in the Schematic theme. Edit a limit on the left and follow it on the right.',
      specimens: [
        {
          id: 'EngConfigDashSignature',
          title: 'Engineering configuration',
          note: 'Pick it for a limit, setpoint or tag configuration tool with an approval step.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardGrid.tsx',
            'dashboards/DashboardPanel.tsx',
            'dashboards/panels/engineering-config/limitOrder.ts',
            'patterns/data-entry/EditableCell.tsx',
            'patterns/collaboration/ChangeDiff.tsx',
            'industrial/StatusIndicator.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: EngConfigDashSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same dashboard, unchanged, in three more presets.',
      specimens: [
        {
          id: 'EngConfigDashAura',
          title: 'Aura',
          note: 'Pick it when configuration is one page of a product in the default theme.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: EngConfigDashAura,
        },
        {
          id: 'EngConfigDashBlueprint',
          title: 'Blueprint',
          note: 'Pick it for engineering users who prefer proportional type and blue-tinted panels.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: EngConfigDashBlueprint,
        },
        {
          id: 'EngConfigDashTerminal',
          title: 'Terminal',
          note: 'Pick it for a dark, monospaced configuration console.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: EngConfigDashTerminal,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, ready to drop into another dashboard.',
      specimens: [
        {
          id: 'EngConfigDashLimitTable',
          title: 'Editable limit table',
          note: 'Pick it when a handful of numeric columns are edited in place across many tags.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'patterns/data-entry/EditableCell.tsx', 'dashboards/panels/engineering-config/limitOrder.ts'],
          Component: EngConfigDashLimitTable,
        },
        {
          id: 'EngConfigDashPending',
          title: 'Pending changes',
          note: 'Pick it to show a change set as before and after pairs with a way back per item.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'patterns/collaboration/ChangeDiff.tsx'],
          Component: EngConfigDashPending,
        },
        {
          id: 'EngConfigDashValidation',
          title: 'Validation results',
          note: 'Pick it to list which changed items pass the rules and exactly why the others fail.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'dashboards/panels/engineering-config/limitOrder.ts'],
          Component: EngConfigDashValidation,
        },
        {
          id: 'EngConfigDashSubmitBlocked',
          title: 'Submit bar, blocked',
          note: 'Pick it when a failed check must stop the submission and say so beside the button.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: EngConfigDashSubmitBlocked,
        },
        {
          id: 'EngConfigDashSubmitReady',
          title: 'Submit bar, ready',
          note: 'Pick it under a change set that passed: it names the approver and offers the one action.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: EngConfigDashSubmitReady,
        },
        {
          id: 'EngConfigDashFilter',
          title: 'Tag filter',
          note: 'Pick it above a configuration table: free text for the tag, a switch for the area.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: EngConfigDashFilter,
        },
        {
          id: 'EngConfigDashHistory',
          title: 'Change history strip',
          note: 'Pick it along the bottom of a configuration screen to keep the last five changes in view.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: EngConfigDashHistory,
        },
      ],
    },
  ],
});
