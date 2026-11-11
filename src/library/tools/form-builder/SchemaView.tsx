import { CodeBlock, CodeBlockCopyButton } from '@cognite/aura/components/code-block';

import { toJsonText } from './formSchema';
import type { FormSchema } from './formSchema';

type SchemaViewProps = { schema: FormSchema };

/** The form as a JSON Schema document, ready to copy. It updates as the form is edited. */
export function SchemaView({ schema }: SchemaViewProps) {
  return (
    <div data-slot="schema-view" className="w-full min-w-0">
      <CodeBlock code={toJsonText(schema)} language="json" showLineNumbers>
        <CodeBlockCopyButton aria-label="Copy JSON schema" />
      </CodeBlock>
    </div>
  );
}
