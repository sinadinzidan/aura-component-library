import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import type { ComponentProps, RefObject } from 'react';

import { CodeEditor } from './CodeEditor';
import type { CodeEditorHandle } from './CodeEditor';

describe(CodeEditor.name, () => {
  it('labels the text field', () => {
    renderEditor();

    expect(field()).toBeInTheDocument();
  });

  it('numbers the lines and follows the text', async () => {
    const { container } = renderEditor({ value: 'a\nb' });
    expect(container.querySelectorAll('[aria-hidden="true"] > div > div')).toHaveLength(2);

    await userEvent.type(field(), '{Enter}c');

    expect(container.querySelectorAll('[aria-hidden="true"] > div > div').length).toBe(3);
  });

  it('highlights the current line', () => {
    const { container } = renderEditor({ value: 'a\nb\nc' });
    placeCaret(2);

    expect(container.querySelector('[data-slot="current-line"]')?.getAttribute('style')).toContain('* 9 ');
  });

  it('shows the text unhighlighted until the highlighter answers, then the highlighted copy', async () => {
    let finish: (html: readonly [string, string]) => void = () => {};
    const highlighter = vi.fn(() => new Promise<readonly [string, string]>((resolve) => (finish = resolve)));
    const { container } = renderEditor({ value: 'SELECT 1', language: 'sql', highlighter });
    expect(container.querySelector('[data-slot="mirror"]')).toHaveTextContent('SELECT 1');
    expect(container.querySelector('.shiki')).toBeNull();

    finish(['<pre class="shiki" tabindex="0"><code>LIGHT</code></pre>', '<pre class="shiki"><code>DARK</code></pre>']);

    await waitFor(() => expect(container.querySelector('.shiki')).toBeInTheDocument());
    expect(container.querySelector('pre[tabindex]')).toBeNull();
  });

  it('falls back to plain text when the highlighter fails', async () => {
    const highlighter = vi.fn(() => Promise.reject(new Error('offline')));
    const { container } = renderEditor({ value: 'SELECT 1', language: 'sql', highlighter });

    await waitFor(() => expect(highlighter).toHaveBeenCalled());

    expect(container.querySelector('[data-slot="mirror"]')).toHaveTextContent('SELECT 1');
  });

  it('does not call the highlighter for plain text', () => {
    const highlighter = vi.fn();
    renderEditor({ value: 'x', language: 'text', highlighter });

    expect(highlighter).not.toHaveBeenCalled();
  });

  it('indents with Tab and outdents with Shift+Tab', async () => {
    renderEditor({ value: 'SELECT 1' });
    placeCaret(0);

    await userEvent.keyboard('{Tab}');
    expect(field()).toHaveValue('  SELECT 1');
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(field()).toHaveValue('SELECT 1');
  });

  it('lets Tab leave the field after Escape', async () => {
    renderEditor({ value: 'a' });
    field().focus();

    await userEvent.keyboard('{Escape}{Tab}');

    expect(field()).not.toHaveFocus();
    expect(field()).toHaveValue('a');
  });

  it('closes brackets and quotes and steps over the closer', async () => {
    renderEditor({ value: '', language: 'sql' });
    field().focus();

    await userEvent.keyboard("count(*");
    expect(field()).toHaveValue('count(*)');
    await userEvent.keyboard(')');
    expect(field()).toHaveValue('count(*)');
    await userEvent.keyboard(" = '");
    expect(field()).toHaveValue("count(*) = ''");
  });

  it('deletes an empty pair with one Backspace', async () => {
    renderEditor({ value: '', language: 'sql' });
    field().focus();

    await userEvent.keyboard("'{Backspace}");

    expect(field()).toHaveValue('');
  });

  it('keeps the indent on Enter', async () => {
    renderEditor({ value: '  SELECT a' });
    field().focus();

    await userEvent.keyboard('{Enter}');

    expect(field()).toHaveValue('  SELECT a\n  ');
  });

  it('toggles a comment with Ctrl+/', async () => {
    renderEditor({ value: 'SELECT 1', language: 'sql' });
    field().focus();

    await userEvent.keyboard('{Control>}/{/Control}');
    expect(field()).toHaveValue('-- SELECT 1');
    await userEvent.keyboard('{Control>}/{/Control}');
    expect(field()).toHaveValue('SELECT 1');
  });

  it('leaves Ctrl+/ alone where the language has no comments', async () => {
    renderEditor({ value: '{}', language: 'json' });
    field().focus();

    await userEvent.keyboard('{Control>}/{/Control}');

    expect(field()).toHaveValue('{}');
  });

  it('runs with Ctrl+Enter and with Meta+Enter', async () => {
    const { onRun } = renderEditor({ value: 'SELECT 1' });
    field().focus();

    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    await userEvent.keyboard('{Meta>}{Enter}{/Meta}');

    expect(onRun).toHaveBeenCalledTimes(2);
    expect(field()).toHaveValue('SELECT 1');
  });

  it('undoes and redoes with the keyboard', async () => {
    renderEditor({ value: 'a' });
    placeCaret(0);
    await userEvent.keyboard('{Tab}');
    expect(field()).toHaveValue('  a');

    await userEvent.keyboard('{Control>}z{/Control}');
    expect(field()).toHaveValue('a');
    await userEvent.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(field()).toHaveValue('  a');
  });

  it('takes a change from outside as one undo step', async () => {
    render(<Loader />);
    await userEvent.click(screen.getByRole('button', { name: 'Load snippet' }));
    expect(field()).toHaveValue('SELECT * FROM assets');

    field().focus();
    await userEvent.keyboard('{Control>}z{/Control}');

    expect(field()).toHaveValue('a');
  });

  it('inserts text at the caret through its handle', async () => {
    const handle = createRef<CodeEditorHandle>();
    render(<Controlled handle={handle} initial="SELECT  FROM assets" />);
    placeCaret(7);

    act(() => handle.current?.insertText('tag'));

    await waitFor(() => expect(field()).toHaveValue('SELECT tag FROM assets'));
  });

  it('marks an error range and describes the field as invalid', () => {
    const { container } = renderEditor({ value: 'SELECT nope FROM assets', error: { start: 7, end: 11 } });

    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelector('[data-slot="error-marker"]')).toHaveTextContent('SELECT nope FROM assets');
  });

  it('does not change a read-only field', async () => {
    renderEditor({ value: 'a', readOnly: true });
    field().focus();

    await userEvent.keyboard('{Tab}x');

    expect(field()).toHaveValue('a');
  });

  it('keeps a single-line field on one line and runs on Enter', async () => {
    const { onRun } = renderEditor({ value: 'a + b', singleLine: true });
    field().focus();

    await userEvent.keyboard('{Enter}');

    expect(onRun).toHaveBeenCalledTimes(1);
    expect(field()).toHaveValue('a + b');
  });
});

function field(): HTMLTextAreaElement {
  const element = screen.getByRole('textbox', { name: 'Query' });
  if (!(element instanceof HTMLTextAreaElement)) throw new Error('Expected a textarea');
  return element;
}

function placeCaret(start: number, end: number = start) {
  field().focus();
  field().setSelectionRange(start, end);
  act(() => {
    // React derives its select event from key and mouse events, not from the native one.
    field().dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }));
  });
}

function Controlled({ handle, initial }: { handle: RefObject<CodeEditorHandle>; initial: string }) {
  const [text, setText] = useState(initial);
  return <CodeEditor ref={handle} label="Query" value={text} onChange={setText} language="sql" highlighter={() => new Promise(() => {})} />;
}

function Loader() {
  const [text, setText] = useState('a');
  return (
    <>
      <button type="button" onClick={() => setText('SELECT * FROM assets')}>
        Load snippet
      </button>
      <CodeEditor label="Query" value={text} onChange={setText} highlighter={() => new Promise(() => {})} />
    </>
  );
}

function renderEditor(props: Partial<ComponentProps<typeof CodeEditor>> = {}) {
  const onRun = vi.fn();
  const view = render(<ControlledEditor onRun={onRun} {...props} />);
  return { ...view, onRun };
}

function ControlledEditor({ value = '', onChange, ...rest }: Partial<ComponentProps<typeof CodeEditor>>) {
  const [text, setText] = useState(value);
  return (
    <CodeEditor
      label="Query"
      value={text}
      highlighter={() => new Promise(() => {})}
      {...rest}
      onChange={(next) => {
        setText(next);
        onChange?.(next);
      }}
    />
  );
}
