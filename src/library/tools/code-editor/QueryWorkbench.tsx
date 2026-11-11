import { Button } from '@cognite/aura/components/button';
import { Kbd } from '@cognite/aura/components/kbd';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { IconPlayerPlay, IconWand } from '@cognite/aura/icons';
import { useReducer, useRef, useState } from 'react';

import { CodeEditor } from './CodeEditor';
import type { CodeEditorHandle } from './CodeEditor';
import { ErrorPanel } from './ErrorPanel';
import { QueryHistoryList, SnippetList } from './QueryLists';
import { ResultsTable, describeRows } from './ResultsTable';
import { SchemaBrowser } from './SchemaBrowser';
import { runQuery } from './sqlEvaluator';
import { formatSql } from './sqlFormat';
import type { Database, QueryResult } from './sqlTypes';
import type { Highlighter } from './useHighlightedCode';
import { createWorkbenchState, workbenchReducer } from './workbenchState';
import type { HistoryEntry, Snippet } from './workbenchState';

type SideTab = 'schema' | 'history' | 'snippets';

const TAB_LABEL: Readonly<Record<SideTab, string>> = { schema: 'Schema', history: 'History', snippets: 'Snippets' };

function isSideTab(value: unknown): value is SideTab {
  return value === 'schema' || value === 'history' || value === 'snippets';
}

type QueryWorkbenchProps = {
  /** The tables the query runs against. */
  database: Database;
  initialQuery?: string;
  /** Run the initial query on first render, so results are already showing. */
  runOnStart?: boolean;
  snippets?: readonly Snippet[];
  history?: readonly HistoryEntry[];
  defaultTab?: SideTab;
  /** Fills the height of the container; the editor and results share it. */
  className?: string;
  highlighter?: Highlighter;
};

/**
 * A working query workbench: a code editor, Run (Ctrl/⌘+Enter) and Format, results or an error
 * panel that points at the offending token, and a sidebar with the schema, query history and
 * saved snippets. Queries run against the tables it is given; nothing leaves the page.
 */
export function QueryWorkbench({ database, initialQuery = '', runOnStart = false, snippets = [], history = [], defaultTab = 'schema', className = 'h-full', highlighter }: QueryWorkbenchProps) {
  const editorRef = useRef<CodeEditorHandle>(null);
  const [text, setText] = useState(initialQuery);
  const [result, setResult] = useState<QueryResult | null>(() => (runOnStart ? runQuery(initialQuery, database) : null));
  const [ranText, setRanText] = useState(runOnStart ? initialQuery : '');
  const [tab, setTab] = useState<SideTab>(defaultTab);
  const [state, dispatch] = useReducer(workbenchReducer, undefined, () => createWorkbenchState(snippets, history));

  const run = () => {
    if (text.trim() === '') return;
    const next = runQuery(text, database);
    setResult(next);
    setRanText(text);
    dispatch({ type: 'ran', sql: text, ok: next.ok, summary: next.ok ? describeRows(next.rowCount, next.columns.length) : next.error.message });
  };

  const load = (sql: string) => {
    setText(sql);
    editorRef.current?.focus();
  };

  return (
    <div className={`@container flex min-h-0 min-w-0 flex-col gap-3 @3xl:grid @3xl:grid-cols-[15rem_minmax(0,1fr)] ${className}`} data-slot="query-workbench">
      <aside className="flex min-h-0 flex-col gap-3 @3xl:border-r @3xl:border-default @3xl:pr-3">
        <SegmentedControl
          value={tab}
          onValueChange={(next) => {
            if (isSideTab(next)) setTab(next);
          }}
        >
          <SegmentedControlList size="small" aria-label="Sidebar">
            {(Object.keys(TAB_LABEL) as SideTab[]).map((key) => (
              <SegmentedControlButton key={key} value={key}>
                {TAB_LABEL[key]}
              </SegmentedControlButton>
            ))}
          </SegmentedControlList>
        </SegmentedControl>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tab === 'schema' ? <SchemaBrowser database={database} defaultOpen={database.slice(0, 1).map((table) => table.name)} onInsert={(name) => editorRef.current?.insertText(name)} /> : null}
          {tab === 'history' ? <QueryHistoryList entries={state.history} onPick={load} onClear={() => dispatch({ type: 'clear-history' })} /> : null}
          {tab === 'snippets' ? (
            <SnippetList snippets={state.snippets} onPick={load} onRemove={(id) => dispatch({ type: 'remove-snippet', id })} onSave={(name) => dispatch({ type: 'save-snippet', name, sql: text })} canSave={text.trim() !== ''} />
          ) : null}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={run} disabled={text.trim() === ''}>
            <IconPlayerPlay /> Run query
            <Kbd>Ctrl</Kbd>
            <Kbd>↵</Kbd>
          </Button>
          <Button variant="secondary" onClick={() => setText(formatSql(text))} disabled={text.trim() === ''}>
            <IconWand /> Format
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">Esc, then Tab leaves the editor</span>
        </div>
        <div className="min-h-32 flex-[3]">
          <CodeEditor
            ref={editorRef}
            label="Query"
            hideLabel
            language="sql"
            value={text}
            onChange={setText}
            onRun={run}
            error={result && !result.ok && ranText === text ? result.error : null}
            heightClassName="h-full"
            placeholder="SELECT * FROM assets LIMIT 10"
            highlighter={highlighter}
          />
        </div>
        <div className="min-h-0 flex-[2] overflow-y-auto" aria-live="polite">
          {result === null ? (
            <p className="text-sm text-muted-foreground">Write a query and press Ctrl+Enter. Click a table or column in the schema to insert it.</p>
          ) : result.ok ? (
            <ResultsTable result={result} caption="Query results" heightClassName="max-h-56" />
          ) : (
            <ErrorPanel text={ranText} error={result.error} />
          )}
        </div>
      </div>
    </div>
  );
}
