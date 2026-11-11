import type { ReactNode } from 'react';

import { ValidationSummary } from '../../../library/patterns/data-entry/ValidationSummary';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { FieldPalette } from '../../../library/tools/form-builder/FieldPalette';
import { FormBuilder } from '../../../library/tools/form-builder/FormBuilder';
import { FormCanvas } from '../../../library/tools/form-builder/FormCanvas';
import { FormPreview } from '../../../library/tools/form-builder/FormPreview';
import type { FormFieldDef, FormSchema } from '../../../library/tools/form-builder/formSchema';
import { OptionsEditor } from '../../../library/tools/form-builder/OptionsEditor';
import { PropertiesPanel } from '../../../library/tools/form-builder/PropertiesPanel';
import { RuleEditor } from '../../../library/tools/form-builder/RuleEditor';
import { SchemaView } from '../../../library/tools/form-builder/SchemaView';
import { definePage } from '../../types';

import source from './form-builder.tsx?raw';

const formNoop = () => undefined;

const FORM_WORK_ORDER: FormSchema = {
  title: 'Work order request',
  fields: [
    { id: 'h-what', type: 'heading', label: 'What needs doing' },
    { id: 'title', type: 'text', label: 'Short title', helper: 'Say what and where: "Replace seal, 23-KA-9101".', placeholder: 'Replace drive-end seal', required: true, max: 80 },
    {
      id: 'kind',
      type: 'radio',
      label: 'Work type',
      required: true,
      options: [
        { value: 'corrective', label: 'Corrective' },
        { value: 'preventive', label: 'Preventive' },
        { value: 'inspection', label: 'Inspection' },
      ],
    },
    { id: 'failure', type: 'textarea', label: 'Failure description', helper: 'What was seen, heard or measured.', required: true, min: 10, showWhen: { fieldId: 'kind', equals: 'corrective' } },
    {
      id: 'priority',
      type: 'select',
      label: 'Priority',
      required: true,
      placeholder: 'Choose priority',
      options: [
        { value: 'p1', label: 'P1 · Immediate' },
        { value: 'p2', label: 'P2 · This week' },
        { value: 'p3', label: 'P3 · Planned' },
      ],
    },
    { id: 'h-plan', type: 'heading', label: 'Planning' },
    { id: 'effort', type: 'number', label: 'Estimated effort', unit: 'h', min: 1, max: 80, helper: 'Between 1 and 80 hours.' },
    { id: 'due', type: 'date', label: 'Needed by' },
    { id: 'isolation', type: 'switch', label: 'Needs isolation' },
    { id: 'permit', type: 'checkbox', label: 'Work permit requested', required: true, showWhen: { fieldId: 'isolation', equals: 'true' } },
  ],
};

const FORM_INSPECTION: FormSchema = {
  title: 'Inspection checkpoint',
  fields: [
    { id: 'tag', type: 'text', label: 'Equipment tag', placeholder: '23-KA-9101', required: true, min: 6, max: 20 },
    { id: 'reading', type: 'number', label: 'Vibration, drive end', unit: 'mm/s', min: 0, max: 15, required: true },
    {
      id: 'condition',
      type: 'radio',
      label: 'Visual condition',
      required: true,
      options: [
        { value: 'good', label: 'Good' },
        { value: 'worn', label: 'Worn' },
        { value: 'failed', label: 'Failed' },
      ],
    },
    { id: 'finding', type: 'textarea', label: 'Finding', helper: 'Describe what you saw.', required: true, showWhen: { fieldId: 'condition', equals: 'failed' } },
    { id: 'followup', type: 'switch', label: 'Raise a follow-up work order' },
  ],
};

const FORM_EXAMPLES = [
  { id: 'work-order', label: 'Work order request', schema: FORM_WORK_ORDER },
  { id: 'inspection', label: 'Inspection checkpoint', schema: FORM_INSPECTION },
];

const FORM_TEXT: FormFieldDef = FORM_WORK_ORDER.fields[1];
const FORM_NUMBER: FormFieldDef = FORM_WORK_ORDER.fields[6];
const FORM_RADIO: FormFieldDef = FORM_WORK_ORDER.fields[2];
const FORM_CONDITIONAL: FormFieldDef = FORM_WORK_ORDER.fields[3];

const FORM_ONE_FIELD: FormSchema = { title: 'Work order request', fields: [FORM_WORK_ORDER.fields[1], FORM_WORK_ORDER.fields[4]] };
const FORM_BROKEN: FormSchema = {
  title: 'Work order request',
  fields: [FORM_WORK_ORDER.fields[1], { id: 'cond', type: 'select', label: 'Condition', options: [{ value: 'a', label: 'Good' }] }],
};

function FormFrame({ height, children }: { height: string; children: ReactNode }) {
  return <div className={`w-full overflow-hidden rounded-xl border border-default bg-base-background ${height}`}>{children}</div>;
}

function FormBuilderFull() {
  return (
    <FormFrame height="h-[46rem]">
      <FormBuilder initialSchema={FORM_WORK_ORDER} examples={FORM_EXAMPLES} idPrefix="fb-full" />
    </FormFrame>
  );
}

function FormBuilderPreviewTab() {
  return (
    <FormFrame height="h-[46rem]">
      <FormBuilder initialSchema={FORM_WORK_ORDER} examples={FORM_EXAMPLES} defaultTab="preview" idPrefix="fb-preview-tab" />
    </FormFrame>
  );
}

function FormBuilderPreviewAlone() {
  return (
    <div className="w-full max-w-xl rounded-xl bg-card-background p-6">
      <FormPreview schema={FORM_INSPECTION} idPrefix="fb-alone" submitLabel="Record checkpoint" />
    </div>
  );
}

function FormBuilderPalette() {
  return (
    <div className="w-full max-w-xs">
      <FieldPalette onAdd={formNoop} />
    </div>
  );
}

function FormBuilderFieldRest() {
  return (
    <div className="w-full max-w-lg">
      <FormCanvas schema={FORM_ONE_FIELD} selectedId={null} onSelect={formNoop} onMove={formNoop} onMoveBy={formNoop} onRemove={formNoop} onDuplicate={formNoop} />
    </div>
  );
}

function FormBuilderFieldSelected() {
  return (
    <div className="w-full max-w-lg">
      <FormCanvas schema={FORM_ONE_FIELD} selectedId="title" onSelect={formNoop} onMove={formNoop} onMoveBy={formNoop} onRemove={formNoop} onDuplicate={formNoop} />
    </div>
  );
}

function FormBuilderFieldError() {
  return (
    <div className="w-full max-w-lg">
      <FormCanvas
        schema={FORM_BROKEN}
        selectedId={null}
        problems={{ cond: 'Add at least two options.' }}
        onSelect={formNoop}
        onMove={formNoop}
        onMoveBy={formNoop}
        onRemove={formNoop}
        onDuplicate={formNoop}
      />
    </div>
  );
}

function FormBuilderEmptyCanvas() {
  return (
    <div className="w-full max-w-lg">
      <FormCanvas schema={{ title: 'New form', fields: [] }} selectedId={null} onSelect={formNoop} onMove={formNoop} onMoveBy={formNoop} onRemove={formNoop} onDuplicate={formNoop} />
    </div>
  );
}

function FormBuilderPropsText() {
  return (
    <div className="w-full max-w-xs">
      <PropertiesPanel schema={FORM_WORK_ORDER} field={FORM_TEXT} onChange={formNoop} />
    </div>
  );
}

function FormBuilderPropsNumber() {
  return (
    <div className="w-full max-w-xs">
      <PropertiesPanel schema={FORM_WORK_ORDER} field={FORM_NUMBER} onChange={formNoop} />
    </div>
  );
}

function FormBuilderPropsSelect() {
  return (
    <div className="w-full max-w-xs">
      <PropertiesPanel schema={FORM_WORK_ORDER} field={FORM_WORK_ORDER.fields[4]} onChange={formNoop} />
    </div>
  );
}

function FormBuilderPropsConditional() {
  return (
    <div className="w-full max-w-xs">
      <PropertiesPanel schema={FORM_WORK_ORDER} field={FORM_CONDITIONAL} onChange={formNoop} />
    </div>
  );
}

function FormBuilderPropsNone() {
  return (
    <div className="w-full max-w-xs">
      <PropertiesPanel schema={FORM_WORK_ORDER} field={null} onChange={formNoop} />
    </div>
  );
}

function FormBuilderOptions() {
  return (
    <div className="w-full max-w-xs">
      <OptionsEditor options={FORM_RADIO.options ?? []} onChange={formNoop} />
    </div>
  );
}

function FormBuilderRule() {
  return (
    <div className="w-full max-w-xs">
      <RuleEditor sources={FORM_WORK_ORDER.fields.slice(0, 3)} rule={FORM_CONDITIONAL.showWhen} onChange={formNoop} />
    </div>
  );
}

function FormBuilderSchema() {
  return (
    <div className="max-h-[26rem] w-full overflow-y-auto">
      <SchemaView schema={FORM_INSPECTION} />
    </div>
  );
}

function FormBuilderValidation() {
  return (
    <div className="w-full max-w-md">
      <ValidationSummary
        errors={[
          { fieldId: 'fb-val-title', label: 'Short title', message: 'Enter short title.' },
          { fieldId: 'fb-val-priority', label: 'Priority', message: 'Choose priority.' },
          { fieldId: 'fb-val-effort', label: 'Estimated effort', message: 'Estimated effort must be at most 80 h.' },
        ]}
        focusField={formNoop}
      />
    </div>
  );
}

function FormBuilderDark() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <FormFrame height="h-[40rem]">
        <FormBuilder initialSchema={FORM_INSPECTION} idPrefix="fb-dark" />
      </FormFrame>
    </ThemeScope>
  );
}

export default definePage({
  id: 'form-builder',
  title: 'Form builder',
  summary: 'Compose a form from field blocks: palette, canvas, properties, a live preview that really validates, and the schema it produces.',
  guidance: {
    use: [
      'Keep three panes: what you can add, the form as it will look, and the settings of the one field you selected.',
      'Draw fields with the real controls so the canvas and the finished form never disagree.',
      'Offer both drag and buttons for reordering, and announce where the field landed.',
    ],
    avoid: [
      'Letting a visibility rule depend on a field below it; the user could never have answered it yet.',
      'Hiding problems until publish. Mark the field that cannot work and say how to fix it.',
      'Asking authors to type ids. Derive option values from labels.',
    ],
  },
  source,
  sections: [
    {
      id: 'builder',
      title: 'The builder',
      description: 'Working builders: add, select, edit, reorder, preview and read the schema.',
      specimens: [
        {
          id: 'FormBuilderFull',
          title: 'Full builder',
          note: 'Pick it to author a form end to end; switch examples to see how a different form reads on the canvas.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/form-builder/FormBuilder.tsx', 'tools/form-builder/FormCanvas.tsx', 'tools/form-builder/PropertiesPanel.tsx', 'tools/form-builder/FieldPalette.tsx'],
          Component: FormBuilderFull,
        },
        {
          id: 'FormBuilderPreviewTab',
          title: 'Preview tab',
          note: 'Pick it to test the form as a respondent: submit empty, then choose Corrective to reveal the conditional field.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/form-builder/FormBuilder.tsx', 'tools/form-builder/FormPreview.tsx'],
          Component: FormBuilderPreviewTab,
        },
      ],
    },
    {
      id: 'form',
      title: 'The form it makes',
      description: 'What respondents get: the real form with validation and conditional fields.',
      specimens: [
        {
          id: 'FormBuilderPreviewAlone',
          title: 'Rendered form',
          note: 'Pick it for the finished form: required fields, a range with a unit, and a field that appears when the condition is Failed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/form-builder/FormPreview.tsx', 'tools/form-builder/FormFieldControl.tsx'],
          Component: FormBuilderPreviewAlone,
        },
        {
          id: 'FormBuilderSchema',
          title: 'Schema view',
          note: 'Pick it to hand the form to a developer: JSON Schema with the builder extras under x- keys.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/form-builder/SchemaView.tsx'],
          Component: FormBuilderSchema,
        },
        {
          id: 'FormBuilderValidation',
          title: 'Validation summary',
          note: 'Pick it above a form after a failed submit: every error is a link to its field.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/ValidationSummary.tsx'],
          Component: FormBuilderValidation,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The palette, the canvas rows and the pieces of the properties panel.',
      specimens: [
        {
          id: 'FormBuilderPalette',
          title: 'Field palette',
          note: 'Pick it for the list of field types; each row has its own Add button.',
          origin: 'custom',
          uses: ['tools/form-builder/FieldPalette.tsx'],
          Component: FormBuilderPalette,
        },
        {
          id: 'FormBuilderOptions',
          title: 'Options editor',
          note: 'Pick it for select and radio choices: edit, reorder, remove and add without typing ids.',
          origin: 'custom',
          uses: ['tools/form-builder/OptionsEditor.tsx'],
          Component: FormBuilderOptions,
        },
        {
          id: 'FormBuilderRule',
          title: 'Conditional rule editor',
          note: 'Pick it to make a field depend on an earlier answer; the rule reads back as a sentence.',
          origin: 'custom',
          uses: ['tools/form-builder/RuleEditor.tsx'],
          Component: FormBuilderRule,
        },
        {
          id: 'FormBuilderFieldRest',
          title: 'Canvas field, resting',
          note: 'Pick it for unselected rows: the real control, its type and a quiet grip.',
          origin: 'custom',
          size: 'md',
          uses: ['tools/form-builder/FormCanvas.tsx'],
          Component: FormBuilderFieldRest,
        },
        {
          id: 'FormBuilderFieldSelected',
          title: 'Canvas field, selected',
          note: 'Pick it for the row being edited: an outline, and move, duplicate and delete actions. Hover shows the same actions.',
          origin: 'custom',
          size: 'md',
          uses: ['tools/form-builder/FormCanvas.tsx'],
          Component: FormBuilderFieldSelected,
        },
        {
          id: 'FormBuilderFieldError',
          title: 'Canvas field, invalid',
          note: 'Pick it for a field that cannot work yet: a red outline and the reason under it.',
          origin: 'custom',
          size: 'md',
          uses: ['tools/form-builder/FormCanvas.tsx'],
          Component: FormBuilderFieldError,
        },
        {
          id: 'FormBuilderEmptyCanvas',
          title: 'Empty canvas',
          note: 'Pick it for a new form: say there are no fields and where to add one.',
          origin: 'custom',
          size: 'md',
          uses: ['tools/form-builder/FormCanvas.tsx'],
          Component: FormBuilderEmptyCanvas,
        },
      ],
    },
    {
      id: 'properties',
      title: 'Properties panel',
      description: 'What the panel offers changes with the field type.',
      specimens: [
        {
          id: 'FormBuilderPropsText',
          title: 'Text field',
          note: 'Pick it for text: label, helper, placeholder, length limits and required.',
          origin: 'custom',
          uses: ['tools/form-builder/PropertiesPanel.tsx'],
          Component: FormBuilderPropsText,
        },
        {
          id: 'FormBuilderPropsNumber',
          title: 'Number field',
          note: 'Pick it for measurements: unit and allowed range.',
          origin: 'custom',
          uses: ['tools/form-builder/PropertiesPanel.tsx'],
          Component: FormBuilderPropsNumber,
        },
        {
          id: 'FormBuilderPropsSelect',
          title: 'Select field',
          note: 'Pick it for a list of choices: the options editor sits in the panel.',
          origin: 'custom',
          uses: ['tools/form-builder/PropertiesPanel.tsx', 'tools/form-builder/OptionsEditor.tsx'],
          Component: FormBuilderPropsSelect,
        },
        {
          id: 'FormBuilderPropsConditional',
          title: 'Conditional field',
          note: 'Pick it to show a field with a rule: the rule reads back as a sentence.',
          origin: 'custom',
          uses: ['tools/form-builder/PropertiesPanel.tsx', 'tools/form-builder/RuleEditor.tsx'],
          Component: FormBuilderPropsConditional,
        },
        {
          id: 'FormBuilderPropsNone',
          title: 'Nothing selected',
          note: 'Pick it when no field is selected: tell people how to start editing.',
          origin: 'custom',
          uses: ['tools/form-builder/PropertiesPanel.tsx'],
          Component: FormBuilderPropsNone,
        },
      ],
    },
    {
      id: 'themes',
      title: 'Themes',
      specimens: [
        {
          id: 'FormBuilderDark',
          title: 'Dark scope',
          note: 'Pick it to check outlines, controls and the code block on a dark control-room surface.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/form-builder/FormBuilder.tsx', 'themes/ThemeScope.tsx'],
          Component: FormBuilderDark,
        },
      ],
    },
  ],
});
