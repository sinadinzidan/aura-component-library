import { Button } from '@cognite/aura/components/button';

import { OptionSelect } from '../../patterns/data-entry/OptionSelect';

import { describeRule, ruleValues } from './formSchema';
import type { FormFieldDef, VisibilityRule } from './formSchema';

type RuleEditorProps = {
  /** The fields this one may depend on: input fields above it. */
  sources: readonly FormFieldDef[];
  rule?: VisibilityRule;
  onChange: (rule: VisibilityRule | undefined) => void;
};

/**
 * The visibility rule of a field, written the way it reads: "Show when <field> is <value>". Only
 * fields above can be chosen, so a rule can never depend on something the user has not yet seen.
 */
export function RuleEditor({ sources, rule, onChange }: RuleEditorProps) {
  if (sources.length === 0) {
    return <p className="text-xs text-muted-foreground">Add a select, radio group, checkbox or switch above this field to make it conditional.</p>;
  }
  if (!rule) {
    return (
      <Button variant="secondary" size="sm" className="self-start" onClick={() => onChange({ fieldId: sources[0].id, equals: ruleValues(sources[0])[0]?.value ?? '' })}>
        Add visibility rule
      </Button>
    );
  }
  const source = sources.find((field) => field.id === rule.fieldId);
  const values = source ? ruleValues(source) : [];
  const pickable = sources.filter((field) => ruleValues(field).length > 0);

  return (
    <div data-slot="rule-editor" className="flex w-full flex-col gap-2">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Show when</span>
        <OptionSelect
          aria-label="Field the rule depends on"
          options={pickable.map((field) => ({ value: field.id, label: field.label }))}
          value={source ? rule.fieldId : undefined}
          placeholder="Choose a field"
          onValueChange={(fieldId) => {
            const next = sources.find((field) => field.id === fieldId);
            onChange({ fieldId, equals: next ? (ruleValues(next)[0]?.value ?? '') : '' });
          }}
        />
        <span className="text-xs font-medium text-muted-foreground">is</span>
        <OptionSelect
          aria-label="Value that shows this field"
          options={values}
          value={values.some((option) => option.value === rule.equals) ? rule.equals : undefined}
          placeholder="Choose a value"
          onValueChange={(equals) => onChange({ ...rule, equals })}
        />
      </div>
      <p className="text-xs text-muted-foreground">{describeRule(rule, sources)}.</p>
      <Button variant="ghost" size="sm" className="self-start" onClick={() => onChange(undefined)}>
        Remove rule
      </Button>
    </div>
  );
}
