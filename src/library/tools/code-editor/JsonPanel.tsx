import { Button } from '@cognite/aura/components/button';
import { IconCircleCheck, IconWand } from '@cognite/aura/icons';
import { useState } from 'react';

import { CodeEditor } from './CodeEditor';
import { ErrorPanel } from './ErrorPanel';
import { checkJson, minifyJson, prettyJson } from './jsonTools';
import type { Highlighter } from './useHighlightedCode';

type JsonPanelProps = {
  label: string;
  initialValue: string;
  /** Height utility for the editor, for example `h-56`. */
  heightClassName?: string;
  readOnly?: boolean;
  highlighter?: Highlighter;
};

/**
 * A JSON editor that validates as you type: the first problem is underlined and described with
 * its line and column, valid text says so, and Format and Minify rewrite it without losing data.
 */
export function JsonPanel({ label, initialValue, heightClassName = 'h-56', readOnly = false, highlighter }: JsonPanelProps) {
  const [text, setText] = useState(initialValue);
  const checked = checkJson(text);
  const error = checked.ok ? null : { message: checked.error.message, start: checked.error.offset, end: checked.error.offset + 1 };

  return (
    <div className="flex w-full min-w-0 flex-col gap-3" data-slot="json-panel">
      {readOnly ? null : (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" disabled={!checked.ok} onClick={() => setText(prettyJson(text))}>
            <IconWand /> Format
          </Button>
          <Button variant="ghost" size="sm" disabled={!checked.ok} onClick={() => setText(minifyJson(text))}>
            Minify
          </Button>
        </div>
      )}
      <CodeEditor label={label} language="json" value={text} onChange={setText} error={error} readOnly={readOnly} heightClassName={heightClassName} highlighter={highlighter} />
      {error ? (
        <ErrorPanel text={text} error={error} title="Invalid JSON" />
      ) : (
        <p className="flex items-center gap-1.5 text-sm text-success-foreground-strong">
          <IconCircleCheck className="size-4 shrink-0" aria-hidden="true" />
          Valid JSON
        </p>
      )}
    </div>
  );
}
