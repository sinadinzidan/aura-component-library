import { CodeBlock, CodeBlockCopyButton } from '@cognite/aura/components/code-block';

type CodeViewProps = { code: string };

export default function CodeView({ code }: CodeViewProps) {
  return (
    <CodeBlock code={code} language="tsx">
      <CodeBlockCopyButton aria-label="Copy code" />
    </CodeBlock>
  );
}
