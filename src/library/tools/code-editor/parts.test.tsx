import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DiffView } from './DiffView';
import { ErrorPanel } from './ErrorPanel';
import { ExpressionEditor } from './ExpressionEditor';
import { JsonPanel } from './JsonPanel';
import { QueryHistoryList, SnippetList } from './QueryLists';
import { QueryWorkbench } from './QueryWorkbench';
import { describeRows } from './resultFormat';
import { ResultsTable } from './ResultsTable';
import { SchemaBrowser } from './SchemaBrowser';
import type { Database } from './sqlTypes';

const NEVER = () => new Promise<readonly [string, string]>(() => {});

const DB: Database = [
  {
    name: 'sensors',
    columns: [
      { name: 'tag', type: 'text' },
      { name: 'value', type: 'number' },
    ],
    rows: [
      { tag: '23-PT-92531', value: 48.6 },
      { tag: '23-PT-92530', value: 12.4 },
      { tag: '40-TT-40015', value: null },
    ],
  },
  { name: 'alarms', columns: [{ name: 'severity', type: 'text' }], rows: [{ severity: 'high' }] },
];

describe(ResultsTable.name, () => {
  it('shows columns, rows and the counts', () => {
    render(<ResultsTable caption="Sensors" result={{ ok: true, columns: ['tag', 'value'], rows: [['23-PT-92531', 48.6]], rowCount: 1 }} />);

    expect(screen.getByRole('columnheader', { name: 'value' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '48.6' })).toBeInTheDocument();
    expect(screen.getByText('1 row · 2 columns')).toBeInTheDocument();
  });

  it('shows a dash for a missing value and aligns numbers right', () => {
    render(<ResultsTable caption="Sensors" result={{ ok: true, columns: ['tag', 'value'], rows: [['a', null], ['b', 1200]], rowCount: 2 }} />);

    expect(screen.getByRole('cell', { name: '—' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '1,200' })).toHaveClass('text-right');
    expect(screen.getByRole('columnheader', { name: 'value' })).toHaveClass('text-right');
  });

  it('says so in words when there are no rows', () => {
    render(<ResultsTable caption="Sensors" result={{ ok: true, columns: ['tag'], rows: [], rowCount: 0 }} />);

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('No rows match. Loosen the conditions in WHERE.')).toBeInTheDocument();
    expect(screen.getByText('0 rows · 1 column')).toBeInTheDocument();
  });

  it('describes counts with the right plurals', () => {
    expect(describeRows(1, 1)).toBe('1 row · 1 column');
    expect(describeRows(1234, 3)).toBe('1,234 rows · 3 columns');
  });
});

describe(ErrorPanel.name, () => {
  it('gives the position, the message and a marker under the token', () => {
    render(<ErrorPanel text={'SELECT *\nFORM sensors'} error={{ message: 'Expected FROM but found "FORM".', start: 9, end: 13 }} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Query failed');
    expect(alert).toHaveTextContent('Line 2, column 1');
    expect(alert).toHaveTextContent('Expected FROM but found "FORM".');
    expect(alert.querySelector('pre')?.textContent).toBe('FORM sensors\n^^^^');
  });

  it('marks the end of the text when the error is there', () => {
    render(<ErrorPanel text="SELECT" error={{ message: 'Expected a column.', start: 6, end: 6 }} />);

    expect(screen.getByRole('alert').querySelector('pre')?.textContent).toBe('SELECT\n      ^');
  });
});

describe(SchemaBrowser.name, () => {
  it('lists tables and opens their columns', async () => {
    render(<SchemaBrowser database={DB} onInsert={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Insert column tag' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Show columns of sensors' }));

    expect(screen.getByRole('button', { name: 'Insert column tag' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide columns of sensors' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('inserts a table and a column name', async () => {
    const onInsert = vi.fn();
    render(<SchemaBrowser database={DB} onInsert={onInsert} defaultOpen={['sensors']} />);

    await userEvent.click(screen.getByRole('button', { name: 'Insert table alarms' }));
    await userEvent.click(screen.getByRole('button', { name: 'Insert column value' }));

    expect(onInsert).toHaveBeenNthCalledWith(1, 'alarms');
    expect(onInsert).toHaveBeenNthCalledWith(2, 'value');
  });

  it('filters tables and columns and says when nothing matches', async () => {
    render(<SchemaBrowser database={DB} onInsert={vi.fn()} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Filter tables and columns' }), 'sev');
    expect(screen.queryByRole('button', { name: 'Insert table sensors' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Insert column severity' })).toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox', { name: 'Filter tables and columns' }), 'xyz');
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
  });
});

describe(QueryHistoryList.name, () => {
  const entries = [
    { id: 2, sql: 'SELECT nope FROM sensors', ok: false, summary: 'Column "nope" does not exist' },
    { id: 1, sql: '-- hot\nSELECT * FROM sensors', ok: true, summary: '3 rows · 2 columns' },
  ];

  it('shows each outcome in words and the first line of the query', () => {
    render(<QueryHistoryList entries={entries} onPick={vi.fn()} />);

    expect(screen.getByText('Failed: Column "nope" does not exist')).toBeInTheDocument();
    expect(screen.getByText('SELECT * FROM sensors')).toBeInTheDocument();
  });

  it('loads a query when its row is chosen', async () => {
    const onPick = vi.fn();
    render(<QueryHistoryList entries={entries} onPick={onPick} />);

    await userEvent.click(screen.getByRole('button', { name: /SELECT \* FROM sensors/ }));

    expect(onPick).toHaveBeenCalledWith('-- hot\nSELECT * FROM sensors');
  });

  it('explains the empty state', () => {
    render(<QueryHistoryList entries={[]} onPick={vi.fn()} />);

    expect(screen.getByText(/Queries you run appear here/)).toBeInTheDocument();
  });

  it('clears the history', async () => {
    const onClear = vi.fn();
    render(<QueryHistoryList entries={entries} onPick={vi.fn()} onClear={onClear} />);

    await userEvent.click(screen.getByRole('button', { name: 'Clear history' }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

describe(SnippetList.name, () => {
  const snippets = [{ id: 's1', name: 'Hot tags', sql: 'SELECT tag FROM sensors' }];

  it('loads and deletes a snippet', async () => {
    const onPick = vi.fn();
    const onRemove = vi.fn();
    render(
      <TooltipProvider>
        <SnippetList snippets={snippets} onPick={onPick} onRemove={onRemove} />
      </TooltipProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: /^Hot tags/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete snippet Hot tags' }));

    expect(onPick).toHaveBeenCalledWith('SELECT tag FROM sensors');
    expect(onRemove).toHaveBeenCalledWith('s1');
  });

  it('saves the current query under the typed name and clears the field', async () => {
    const onSave = vi.fn();
    render(
      <TooltipProvider>
        <SnippetList snippets={[]} onPick={vi.fn()} onRemove={vi.fn()} onSave={onSave} />
      </TooltipProvider>
    );

    await userEvent.type(screen.getByRole('textbox', { name: 'Save current query' }), 'Open alarms');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith('Open alarms');
    expect(screen.getByRole('textbox', { name: 'Save current query' })).toHaveValue('');
  });

  it('does not save when there is no query', () => {
    render(
      <TooltipProvider>
        <SnippetList snippets={[]} onPick={vi.fn()} onRemove={vi.fn()} onSave={vi.fn()} canSave={false} />
      </TooltipProvider>
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByText('No saved queries yet.')).toBeInTheDocument();
  });
});

describe(DiffView.name, () => {
  it('shows added and removed lines with signs and spoken prefixes', () => {
    render(<DiffView label="Changes" before={'SELECT *\nLIMIT 5'} after={'SELECT *\nLIMIT 10'} />);

    const rows = within(screen.getByRole('list', { name: 'Changes' })).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([' Unchanged: SELECT *', '+Added: LIMIT 10', '−Removed: LIMIT 5']);
    expect(screen.getByText('1 added · 1 removed')).toBeInTheDocument();
  });

  it('says when nothing changed', () => {
    render(<DiffView label="Changes" before="a" after="a" />);

    expect(screen.getByText('No changes')).toBeInTheDocument();
  });
});

describe(JsonPanel.name, () => {
  it('says the text is valid and formats it', async () => {
    render(<JsonPanel label="Config" initialValue={'{"a":[1,2]}'} highlighter={NEVER} />);
    expect(screen.getByText('Valid JSON')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Format' }));

    expect(screen.getByRole('textbox', { name: 'Config' })).toHaveValue('{\n  "a": [\n    1,\n    2\n  ]\n}');
  });

  it('describes the first problem with its line and column and blocks formatting', () => {
    render(<JsonPanel label="Config" initialValue={'{\n  "a": 1,\n}'} highlighter={NEVER} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid JSON');
    expect(screen.getByRole('alert')).toHaveTextContent('Line 2, column 9');
    expect(screen.getByRole('alert')).toHaveTextContent('A trailing comma is not allowed in JSON.');
    expect(screen.getByRole('button', { name: 'Format' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Config' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('minifies valid text', async () => {
    render(<JsonPanel label="Config" initialValue={'{ "a": 1 }'} highlighter={NEVER} />);

    await userEvent.click(screen.getByRole('button', { name: 'Minify' }));

    expect(screen.getByRole('textbox', { name: 'Config' })).toHaveValue('{"a":1}');
  });

  it('offers no editing tools when read-only', () => {
    render(<JsonPanel label="Config" initialValue="{}" readOnly highlighter={NEVER} />);

    expect(screen.queryByRole('button', { name: 'Format' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Config' })).toHaveAttribute('readonly');
  });
});

describe(ExpressionEditor.name, () => {
  const inputs = { discharge: 48.6, suction: 12.4 };

  it('shows the sample result of a valid expression', () => {
    render(<ExpressionEditor label="Expression" initialValue="round(discharge / suction, 2)" inputs={inputs} unit="ratio" />);

    expect(screen.getByText('3.92 ratio')).toBeInTheDocument();
  });

  it('explains a mistake and marks the field invalid', () => {
    render(<ExpressionEditor label="Expression" initialValue="discharge / suctio" inputs={inputs} />);

    expect(screen.getByText(/Unknown input "suctio"/)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Expression' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('inserts an input name at the caret', async () => {
    render(<ExpressionEditor label="Expression" initialValue="" inputs={inputs} />);

    await userEvent.click(screen.getByRole('button', { name: 'Insert input discharge' }));

    expect(screen.getByRole('textbox', { name: 'Expression' })).toHaveValue('discharge');
  });

  it('updates the result as you type', async () => {
    render(<ExpressionEditor label="Expression" initialValue="" inputs={inputs} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Expression' }), '2 * 3');

    expect(screen.getByText('6')).toBeInTheDocument();
  });
});

describe(QueryWorkbench.name, () => {
  const renderBench = (props: Partial<Parameters<typeof QueryWorkbench>[0]> = {}) =>
    render(
      <TooltipProvider>
        <QueryWorkbench database={DB} highlighter={NEVER} {...props} />
      </TooltipProvider>
    );
  const editor = (): HTMLTextAreaElement => {
    const element = screen.getByRole('textbox', { name: 'Query' });
    if (!(element instanceof HTMLTextAreaElement)) throw new Error('Expected a textarea');
    return element;
  };

  it('prompts for a query before anything has run', () => {
    renderBench();

    expect(screen.getByText(/Write a query and press Ctrl\+Enter/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run query/ })).toBeDisabled();
  });

  it('runs the query and shows rows with the count', async () => {
    renderBench({ initialQuery: "SELECT tag FROM sensors WHERE tag LIKE '23%'" });

    await userEvent.click(screen.getByRole('button', { name: /Run query/ }));

    expect(screen.getByText('2 rows · 1 column')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '23-PT-92531' })).toBeInTheDocument();
  });

  it('runs with Ctrl+Enter', async () => {
    renderBench({ initialQuery: 'SELECT * FROM alarms' });
    editor().focus();

    await userEvent.keyboard('{Control>}{Enter}{/Control}');

    expect(screen.getByRole('cell', { name: 'high' })).toBeInTheDocument();
  });

  it('shows an error that points at the offending token and marks the editor', async () => {
    renderBench({ initialQuery: 'SELECT tag FROM sensor' });

    await userEvent.click(screen.getByRole('button', { name: /Run query/ }));

    expect(screen.getByRole('alert')).toHaveTextContent('Table "sensor" does not exist. Did you mean sensors?');
    expect(screen.getByRole('alert')).toHaveTextContent('Line 1, column 17');
    expect(editor()).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears the error mark as soon as the text changes', async () => {
    renderBench({ initialQuery: 'SELECT tag FROM sensor' });
    await userEvent.click(screen.getByRole('button', { name: /Run query/ }));

    await userEvent.type(editor(), 's');

    expect(editor()).not.toHaveAttribute('aria-invalid');
  });

  it('shows an empty result in words', async () => {
    renderBench({ initialQuery: "SELECT tag FROM sensors WHERE tag = 'none'" });

    await userEvent.click(screen.getByRole('button', { name: /Run query/ }));

    expect(screen.getByText('No rows match. Loosen the conditions in WHERE.')).toBeInTheDocument();
  });

  it('formats the query', async () => {
    renderBench({ initialQuery: 'select tag from sensors where value>1' });

    await userEvent.click(screen.getByRole('button', { name: /Format/ }));

    expect(editor()).toHaveValue('SELECT tag\nFROM sensors\nWHERE value > 1');
  });

  it('records runs in the history and loads one back', async () => {
    renderBench({ initialQuery: 'SELECT * FROM alarms' });
    await userEvent.click(screen.getByRole('button', { name: /Run query/ }));
    await userEvent.click(screen.getByRole('tab', { name: 'History' }));
    expect(screen.getAllByText('1 row · 1 column')).toHaveLength(2);

    await userEvent.clear(editor());
    await userEvent.click(screen.getByRole('button', { name: /SELECT \* FROM alarms/ }));

    expect(editor()).toHaveValue('SELECT * FROM alarms');
  });

  it('saves and reloads a snippet', async () => {
    renderBench({ initialQuery: 'SELECT * FROM alarms' });
    await userEvent.click(screen.getByRole('tab', { name: 'Snippets' }));

    await userEvent.type(screen.getByRole('textbox', { name: 'Save current query' }), 'All alarms');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await userEvent.clear(editor());
    await userEvent.click(screen.getByRole('button', { name: /^All alarms/ }));

    expect(editor()).toHaveValue('SELECT * FROM alarms');
  });

  it('inserts a schema name at the caret', async () => {
    renderBench({ initialQuery: 'SELECT  FROM sensors' });
    editor().focus();
    editor().setSelectionRange(7, 7);
    editor().dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }));

    await userEvent.click(screen.getByRole('button', { name: 'Insert column tag' }));

    expect(editor()).toHaveValue('SELECT tag FROM sensors');
  });

  it('can start with results showing', () => {
    renderBench({ initialQuery: 'SELECT * FROM alarms', runOnStart: true });

    expect(screen.getByRole('cell', { name: 'high' })).toBeInTheDocument();
  });
});
