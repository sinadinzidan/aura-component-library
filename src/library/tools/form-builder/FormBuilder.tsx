import { Input } from '@cognite/aura/components/input';
import { Tabs, TabsLabel, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import { useReducer } from 'react';

import { FormField } from '../../forms/FormField';
import { OptionSelect } from '../../patterns/data-entry/OptionSelect';

import { FieldPalette } from './FieldPalette';
import { FormCanvas } from './FormCanvas';
import { FormPreview } from './FormPreview';
import { builderReducer, createBuilderState, validateSchema } from './formSchema';
import type { FormSchema } from './formSchema';
import { PropertiesPanel } from './PropertiesPanel';
import { SchemaView } from './SchemaView';

type FormBuilderProps = {
  /** The form to start from. */
  initialSchema: FormSchema;
  /** Other forms the user can load, by id. */
  examples?: readonly { id: string; label: string; schema: FormSchema }[];
  defaultTab?: 'build' | 'preview' | 'schema';
  /** Prefix for control ids. */
  idPrefix?: string;
};

/**
 * Three panes for composing a form: field types on the left, the form being built in the middle
 * and the selected field's properties on the right. Preview renders the real form from the
 * schema, validation and conditional rules included, and the JSON tab shows the schema it
 * produces. Everything is local state; nothing is saved.
 */
export function FormBuilder({ initialSchema, examples = [], defaultTab = 'build', idPrefix = 'form-builder' }: FormBuilderProps) {
  const [state, dispatch] = useReducer(builderReducer, initialSchema, createBuilderState);
  const { schema, selectedId } = state;
  const selected = schema.fields.find((field) => field.id === selectedId) ?? null;
  const problems = validateSchema(schema);
  const problemCount = Object.keys(problems).length;

  return (
    <div data-slot="form-builder" className="flex h-full w-full min-w-0 flex-col">
      <Tabs defaultValue={defaultTab} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-default pr-4 pl-4">
          <TabsList showSeparator={false}>
            <TabsTrigger value="build" badge={problemCount > 0 ? String(problemCount) : undefined}>
              <TabsLabel>Build</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="preview">
              <TabsLabel>Preview</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="schema">
              <TabsLabel>JSON schema</TabsLabel>
            </TabsTrigger>
          </TabsList>
          {examples.length > 0 ? (
            <div className="w-56 py-2">
              <OptionSelect
                size="sm"
                aria-label="Load an example form"
                placeholder="Load an example"
                options={examples.map((example) => ({ value: example.id, label: example.label }))}
                onValueChange={(id) => {
                  const example = examples.find((entry) => entry.id === id);
                  if (example) dispatch({ type: 'load', schema: example.schema });
                }}
              />
            </div>
          ) : null}
        </div>
        <TabsPanel value="build" className="min-h-0 flex-1">
          <div className="grid h-full min-h-0 grid-cols-[15rem_minmax(0,1fr)_17rem]">
            <aside aria-label="Field palette" className="min-h-0 overflow-y-auto border-r border-default p-3">
              <FieldPalette onAdd={(fieldType) => dispatch({ type: 'add', fieldType })} />
            </aside>
            <section aria-label="Form canvas" className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto bg-muted-background p-4">
              <FormField label="Form title">{(control) => <Input {...control} value={schema.title} onChange={(event) => dispatch({ type: 'setTitle', title: event.target.value })} />}</FormField>
              <FormCanvas
                schema={schema}
                selectedId={selectedId}
                problems={problems}
                onSelect={(id) => dispatch({ type: 'select', id })}
                onMove={(id, to) => dispatch({ type: 'move', id, to })}
                onMoveBy={(id, delta) => dispatch({ type: 'moveBy', id, delta })}
                onRemove={(id) => dispatch({ type: 'remove', id })}
                onDuplicate={(id) => dispatch({ type: 'duplicate', id })}
              />
            </section>
            <aside aria-label="Field properties" className="min-h-0 overflow-y-auto border-l border-default p-4">
              <PropertiesPanel schema={schema} field={selected} problem={selected ? problems[selected.id] : undefined} onChange={(id, patch) => dispatch({ type: 'update', id, patch })} />
            </aside>
          </div>
        </TabsPanel>
        <TabsPanel value="preview" className="min-h-0 flex-1 overflow-y-auto bg-muted-background p-6">
          <div className="mx-auto w-full max-w-xl rounded-xl bg-card-background p-6">
            <FormPreview key={JSON.stringify(schema)} schema={schema} idPrefix={`${idPrefix}-preview`} />
          </div>
        </TabsPanel>
        <TabsPanel value="schema" className="min-h-0 flex-1 overflow-y-auto p-4">
          <SchemaView schema={schema} />
        </TabsPanel>
      </Tabs>
      <div role="status" aria-live="polite" className="sr-only">
        {state.announcement}
      </div>
    </div>
  );
}
