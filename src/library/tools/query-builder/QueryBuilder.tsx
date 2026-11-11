import { Button } from '@cognite/aura/components/button';
import { Tabs, TabsLabel, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import { useReducer, useState } from 'react';

import { OptionSelect } from '../../patterns/data-entry/OptionSelect';

import { GroupBlock } from './GroupBlock';
import { QueryChips, QuerySentence } from './QuerySummary';
import { ROOT_ID, countConditions, createGroup, createQueryState, filterRecords, queryReducer, validateQuery } from './queryModel';
import type { Group, QueryDataset, SavedQuery } from './queryModel';
import { ResultsTable } from './ResultsTable';
import { SavedQueries } from './SavedQueries';

type QueryBuilderProps = {
  datasets: readonly QueryDataset[];
  /** Data set shown first. Defaults to the first. */
  initialDatasetId?: string;
  initialRoot?: Group;
  savedQueries?: readonly SavedQuery[];
  /** The moment relative dates are measured from, so results are repeatable. */
  now: number;
  /** Hides groups and the data-set picker for a single-level filter. */
  compact?: boolean;
  /** Leaves out the results table, e.g. when the caller shows its own. */
  hideResults?: boolean;
};

/**
 * Build a filter from nested And/Or groups of typed conditions, and see what it finds as you go.
 * The sentence and chips restate the query in words, the results table is the live evaluation
 * against the chosen data set, and named queries can be saved and loaded. State is local; the
 * model and evaluator are the pure functions in `queryModel`.
 */
export function QueryBuilder({ datasets, initialDatasetId, initialRoot, savedQueries = [], now, compact = false, hideResults = false }: QueryBuilderProps) {
  const first = datasets.find((dataset) => dataset.id === initialDatasetId) ?? datasets[0];
  const [state, dispatch] = useReducer(queryReducer, undefined, () => ({ ...createQueryState(first.id, first.fields, initialRoot ?? createGroup(ROOT_ID)), nextId: 100 }));
  const [saved, setSaved] = useState<readonly SavedQuery[]>(savedQueries);
  const dataset = datasets.find((entry) => entry.id === state.datasetId) ?? first;
  const issues = validateQuery(state.root, dataset.fields);
  const issueCount = Object.keys(issues).length;
  const incomplete = Object.keys(issues).filter((id) => issues[id] !== 'Add a condition or remove this group.').length;
  const matching = filterRecords(state.root, dataset.records, dataset.fields, now);
  const conditions = countConditions(state.root);

  return (
    <div data-slot="query-builder" className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {compact ? (
          <h3 className="text-sm font-semibold text-base-foreground">Filter {dataset.noun}</h3>
        ) : (
          <div className="w-56">
            <OptionSelect
              aria-label="Data set"
              options={datasets.map((entry) => ({ value: entry.id, label: entry.label }))}
              value={dataset.id}
              onValueChange={(id) => {
                const next = datasets.find((entry) => entry.id === id);
                if (next && next.id !== dataset.id) dispatch({ type: 'setDataset', datasetId: next.id, fields: next.fields });
              }}
            />
          </div>
        )}
        <Button variant="ghost" size="sm" disabled={conditions === 0} onClick={() => dispatch({ type: 'clear' })}>
          Clear query
        </Button>
      </div>
      <GroupBlock group={state.root} root={state.root} fields={dataset.fields} issues={issues} dispatch={dispatch} allowGroups={!compact} />
      <div className="flex flex-col gap-2">
        <QuerySentence root={state.root} fields={dataset.fields} noun={dataset.label} ignored={incomplete} />
        <QueryChips root={state.root} fields={dataset.fields} noun={dataset.noun} />
      </div>
      {hideResults ? null : (
        <Tabs defaultValue="results" className="flex w-full min-w-0 flex-col gap-3">
          <TabsList>
            <TabsTrigger value="results" badge={String(matching.length)}>
              <TabsLabel>Results</TabsLabel>
            </TabsTrigger>
            {compact ? null : (
              <TabsTrigger value="saved" badge={saved.length > 0 ? String(saved.length) : undefined}>
                <TabsLabel>Saved queries</TabsLabel>
              </TabsTrigger>
            )}
          </TabsList>
          <TabsPanel value="results">
            <ResultsTable columns={dataset.columns} rows={matching} recordKey={dataset.recordKey} total={dataset.records.length} noun={dataset.noun} />
          </TabsPanel>
          {compact ? null : (
            <TabsPanel value="saved">
              <SavedQueries
                queries={saved}
                datasets={datasets}
                onLoad={(id) => {
                  const query = saved.find((entry) => entry.id === id);
                  const target = query ? datasets.find((entry) => entry.id === query.datasetId) : undefined;
                  if (query && target) dispatch({ type: 'load', datasetId: target.id, fields: target.fields, root: query.root });
                }}
                onDelete={(id) => setSaved(saved.filter((entry) => entry.id !== id))}
                onSave={(name) => setSaved([...saved, { id: `saved-${saved.length + 1}-${name.toLowerCase().replace(/\W+/g, '-')}`, name, datasetId: dataset.id, root: state.root }])}
                saveDisabledReason={issueCount > 0 ? 'Fix the incomplete conditions before saving.' : conditions === 0 ? 'Add a condition before saving.' : undefined}
              />
            </TabsPanel>
          )}
        </Tabs>
      )}
      <div role="status" aria-live="polite" className="sr-only">
        {state.announcement}
      </div>
    </div>
  );
}
