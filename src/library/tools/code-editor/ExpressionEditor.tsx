import { HelperText } from '@cognite/aura/components/helper-text';
import { useRef, useState } from 'react';

import { CodeEditor } from './CodeEditor';
import type { CodeEditorHandle } from './CodeEditor';
import { evaluateExpression } from './expression';

type ExpressionEditorProps = {
  label: string;
  initialValue: string;
  /** Named inputs with a sample value, such as the latest reading of each source tag. */
  inputs: Readonly<Record<string, number>>;
  /** Unit of the result, shown after the sample value. */
  unit?: string;
  decimals?: number;
};

/**
 * A single-line editor for calculated tags. It evaluates the expression with sample values as
 * you type: the result shows below, and a mistake is underlined with a message that says what
 * to change. Named inputs are buttons that insert the name at the caret.
 */
export function ExpressionEditor({ label, initialValue, inputs, unit, decimals = 2 }: ExpressionEditorProps) {
  const ref = useRef<CodeEditorHandle>(null);
  const [text, setText] = useState(initialValue);
  const result = evaluateExpression(text, inputs);

  return (
    <div className="flex w-full min-w-0 flex-col gap-2" data-slot="expression-editor">
      <CodeEditor ref={ref} label={label} language="text" singleLine value={text} onChange={setText} error={result.ok ? null : result.error} placeholder="discharge / suction" />
      {result.ok ? (
        <HelperText>
          Sample result{' '}
          <span className="font-mono tabular-nums text-base-foreground">
            {result.value.toLocaleString('en-US', { maximumFractionDigits: decimals })}
            {unit ? ` ${unit}` : ''}
          </span>
        </HelperText>
      ) : (
        <HelperText isError>{result.error.message}</HelperText>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Inputs</span>
        {Object.entries(inputs).map(([name, value]) => (
          <button
            key={name}
            type="button"
            aria-label={`Insert input ${name}`}
            className="rounded-md border border-default px-1.5 py-0.5 font-mono text-xs text-base-foreground outline-none hover:bg-medium-background focus-visible:shadow-focus-ring"
            onClick={() => ref.current?.insertText(name)}
          >
            {name} <span className="tabular-nums text-muted-foreground">{value.toLocaleString('en-US')}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
