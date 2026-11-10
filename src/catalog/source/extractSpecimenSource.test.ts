import { extractFunctionSource, extractSpecimenSource } from './extractSpecimenSource';

const MODULE = `import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { IconPlus, IconTrash } from '@cognite/aura/icons';
import { useState } from 'react';

import { SplitButton } from '../../../library/actions/SplitButton';
import { definePage } from '../../types';

import source from './sample.tsx?raw';

const LABELS = ['One', 'Two'];

type Row = { id: string };

function Frame({ rows }: { rows: Row[] }) {
  return <div>{rows.length}</div>;
}

function SampleStatic() {
  return (
    <Button>
      <IconPlus /> {LABELS[0]}
    </Button>
  );
}

function SampleLibrary() {
  return <SplitButton />;
}

function SampleStateful() {
  const [count, setCount] = useState(0);
  return (
    <Button onClick={() => setCount(count + 1)}>
      <Frame rows={[]} />
    </Button>
  );
}

export default definePage({ id: 'sample', title: 'Sample', summary: '', source, sections: [] });
`;

describe(extractFunctionSource.name, () => {
  it('returns the whole top-level function', () => {
    const result = extractFunctionSource(MODULE, 'SampleStatic');

    expect(result).toMatch(/^function SampleStatic\(\) \{/);
    expect(result).toMatch(/\}$/);
    expect(result).not.toContain('SampleStateful');
  });

  it('returns null for an unknown function', () => {
    expect(extractFunctionSource(MODULE, 'Missing')).toBeNull();
  });

  it('does not match a function whose name only starts with the requested name', () => {
    expect(extractFunctionSource(MODULE, 'Sample')).toBeNull();
  });
});

describe(extractSpecimenSource.name, () => {
  it('includes only the imports the specimen uses', () => {
    const result = extractSpecimenSource(MODULE, 'SampleStatic');

    expect(result).toContain("import { Button } from '@cognite/aura/components/button';");
    expect(result).toContain("import { IconPlus, IconTrash } from '@cognite/aura/icons';");
    expect(result).not.toContain('badge');
    expect(result).not.toContain("from 'react'");
  });

  it('includes module-level constants the specimen references', () => {
    const result = extractSpecimenSource(MODULE, 'SampleStatic');

    expect(result).toContain("const LABELS = ['One', 'Two'];");
  });

  it('includes helper components and the types they need', () => {
    const result = extractSpecimenSource(MODULE, 'SampleStateful');

    expect(result).toContain('function Frame(');
    expect(result).toContain('type Row = { id: string };');
    expect(result).toContain("import { useState } from 'react';");
    expect(result).not.toContain('LABELS');
  });

  it('never includes the raw self-import or the page definition', () => {
    const result = extractSpecimenSource(MODULE, 'SampleStateful');

    expect(result).not.toContain('?raw');
    expect(result).not.toContain('definePage');
  });

  it('rewrites relative library imports to the app alias', () => {
    const result = extractSpecimenSource(MODULE, 'SampleLibrary');

    expect(result).toContain("import { SplitButton } from '@/library/actions/SplitButton';");
  });

  it('keeps multi-statement helpers and multi-line declarations whole', () => {
    const module = `import { useState } from 'react';

type Reading = {
  tag: string;
  value: number;
};

const READINGS: Reading[] = [
  { tag: '23-PT-92531', value: 48.6 },
  { tag: '23-TT-92532', value: 141.2 },
];

const formatReading = (reading: Reading) => {
  const rounded = reading.value.toFixed(1);
  return \`\${reading.tag}: \${rounded}\`;
};

function useToggle() {
  const [on, setOn] = useState(false);
  const toggle = () => setOn(!on);
  return { on, toggle };
}

function SampleComplex() {
  const { on, toggle } = useToggle();
  return <button onClick={toggle}>{on ? formatReading(READINGS[0]) : 'Show'}</button>;
}
`;

    const result = extractSpecimenSource(module, 'SampleComplex');

    expect(result).toContain('type Reading = {\n  tag: string;\n  value: number;\n};');
    expect(result).toContain("  { tag: '23-TT-92532', value: 141.2 },\n];");
    expect(result).toContain('  return `${reading.tag}: ${rounded}`;\n};');
    expect(result).toContain('  return { on, toggle };\n}');
  });

  it('returns null for an unknown specimen', () => {
    expect(extractSpecimenSource(MODULE, 'Missing')).toBeNull();
  });
});
