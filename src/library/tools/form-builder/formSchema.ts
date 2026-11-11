/**
 * The model behind the form builder: a schema of fields, the reducer that edits it, the rule that
 * decides which fields are visible, and the validator that checks a filled-in form. All pure.
 */

export type FieldType = 'text' | 'number' | 'select' | 'checkbox' | 'radio' | 'switch' | 'date' | 'textarea' | 'heading';

export type FieldOption = { value: string; label: string };

/** Show a field only while another field holds a given value. Booleans compare as "true" / "false". */
export type VisibilityRule = { fieldId: string; equals: string };

export type FormFieldDef = {
  id: string;
  type: FieldType;
  label: string;
  helper?: string;
  placeholder?: string;
  required?: boolean;
  /** Number fields: the unit shown after the value. */
  unit?: string;
  /** Number fields: smallest value. Text and textarea: shortest length. */
  min?: number;
  /** Number fields: largest value. Text and textarea: longest length. */
  max?: number;
  /** Select and radio fields. */
  options?: readonly FieldOption[];
  showWhen?: VisibilityRule;
};

export type FormSchema = { title: string; fields: readonly FormFieldDef[] };

export type FormValue = string | boolean;
export type FormValues = Readonly<Record<string, FormValue | undefined>>;

export type FieldTypeInfo = { type: FieldType; label: string; description: string };

export const FIELD_TYPES: readonly FieldTypeInfo[] = [
  { type: 'text', label: 'Text', description: 'One line of text.' },
  { type: 'number', label: 'Number with unit', description: 'A number with a unit and a range.' },
  { type: 'select', label: 'Select', description: 'One choice from a list.' },
  { type: 'checkbox', label: 'Checkbox', description: 'A yes or no confirmation.' },
  { type: 'radio', label: 'Radio group', description: 'One choice with every option visible.' },
  { type: 'switch', label: 'Switch', description: 'A setting that is on or off.' },
  { type: 'date', label: 'Date', description: 'A calendar date.' },
  { type: 'textarea', label: 'Text area', description: 'Several lines of text.' },
  { type: 'heading', label: 'Section heading', description: 'Starts a new group of fields.' },
];

export const fieldTypeLabel = (type: FieldType): string => FIELD_TYPES.find((entry) => entry.type === type)?.label ?? type;

export const hasOptions = (type: FieldType): boolean => type === 'select' || type === 'radio';
export const isInput = (type: FieldType): boolean => type !== 'heading';
export const isBoolean = (type: FieldType): boolean => type === 'checkbox' || type === 'switch';

/** What a new field of each type starts with. */
export function defaultField(type: FieldType, id: string): FormFieldDef {
  const label = fieldTypeLabel(type);
  switch (type) {
    case 'number':
      return { id, type, label: 'Measurement', unit: 'mm' };
    case 'select':
    case 'radio':
      return {
        id,
        type,
        label: type === 'select' ? 'Select' : 'Radio group',
        options: [
          { value: 'option-1', label: 'Option 1' },
          { value: 'option-2', label: 'Option 2' },
        ],
      };
    case 'heading':
      return { id, type, label: 'New section' };
    default:
      return { id, type, label };
  }
}

export type BuilderState = {
  schema: FormSchema;
  selectedId: string | null;
  nextId: number;
  /** The latest result in words, for an `aria-live` region. */
  announcement: string;
};

export type BuilderAction =
  | { type: 'add'; fieldType: FieldType; index?: number }
  | { type: 'remove'; id: string }
  | { type: 'duplicate'; id: string }
  | { type: 'move'; id: string; to: number }
  | { type: 'moveBy'; id: string; delta: number }
  | { type: 'select'; id: string | null }
  | { type: 'update'; id: string; patch: Partial<Omit<FormFieldDef, 'id' | 'type'>> }
  | { type: 'setTitle'; title: string }
  | { type: 'load'; schema: FormSchema };

export function createBuilderState(schema: FormSchema): BuilderState {
  return { schema, selectedId: null, nextId: schema.fields.length + 1, announcement: '' };
}

const indexOfField = (fields: readonly FormFieldDef[], id: string): number => fields.findIndex((field) => field.id === id);

function insertAt<T>(items: readonly T[], index: number, item: T): T[] {
  const at = Math.min(Math.max(index, 0), items.length);
  return [...items.slice(0, at), item, ...items.slice(at)];
}

function moveTo<T>(items: readonly T[], from: number, to: number): T[] {
  const target = Math.min(Math.max(to, 0), items.length - 1);
  const rest = items.filter((_, position) => position !== from);
  return insertAt(rest, target, items[from]);
}

/** Removes rules that point at a field that no longer exists or no longer comes first. */
export function pruneRules(fields: readonly FormFieldDef[]): FormFieldDef[] {
  return fields.map((field, position) => {
    if (!field.showWhen) return field;
    const source = indexOfField(fields, field.showWhen.fieldId);
    if (source !== -1 && source < position) return field;
    const { showWhen: _dropped, ...rest } = field;
    return rest;
  });
}

function freshId(state: BuilderState, type: FieldType): string {
  return `${type}-${state.nextId}`;
}

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  const { fields } = state.schema;
  switch (action.type) {
    case 'add': {
      const id = freshId(state, action.fieldType);
      const index = action.index ?? fields.length;
      const field = defaultField(action.fieldType, id);
      return {
        ...state,
        schema: { ...state.schema, fields: insertAt(fields, index, field) },
        selectedId: id,
        nextId: state.nextId + 1,
        announcement: `Added ${field.label} at position ${Math.min(index, fields.length) + 1}.`,
      };
    }
    case 'remove': {
      const position = indexOfField(fields, action.id);
      if (position === -1) return state;
      const next = pruneRules(fields.filter((field) => field.id !== action.id));
      const neighbour = next[Math.min(position, next.length - 1)];
      return {
        ...state,
        schema: { ...state.schema, fields: next },
        selectedId: state.selectedId === action.id ? (neighbour?.id ?? null) : state.selectedId,
        announcement: `Removed ${fields[position].label}.`,
      };
    }
    case 'duplicate': {
      const position = indexOfField(fields, action.id);
      if (position === -1) return state;
      const id = freshId(state, fields[position].type);
      const { showWhen: _rule, ...source } = fields[position];
      const copy: FormFieldDef = { ...source, id, label: `${source.label} copy` };
      return {
        ...state,
        schema: { ...state.schema, fields: insertAt(fields, position + 1, copy) },
        selectedId: id,
        nextId: state.nextId + 1,
        announcement: `Duplicated ${source.label}.`,
      };
    }
    case 'move': {
      const from = indexOfField(fields, action.id);
      if (from === -1) return state;
      const to = Math.min(Math.max(action.to, 0), fields.length - 1);
      if (to === from) return state;
      return {
        ...state,
        schema: { ...state.schema, fields: pruneRules(moveTo(fields, from, to)) },
        announcement: `Moved ${fields[from].label} to position ${to + 1} of ${fields.length}.`,
      };
    }
    case 'moveBy': {
      const from = indexOfField(fields, action.id);
      if (from === -1) return state;
      const to = from + action.delta;
      if (to < 0 || to >= fields.length) {
        return { ...state, announcement: `${fields[from].label} is already ${to < 0 ? 'first' : 'last'}.` };
      }
      return builderReducer(state, { type: 'move', id: action.id, to });
    }
    case 'select':
      return { ...state, selectedId: action.id };
    case 'update': {
      if (indexOfField(fields, action.id) === -1) return state;
      const next = fields.map((field) => (field.id === action.id ? { ...field, ...action.patch } : field));
      return { ...state, schema: { ...state.schema, fields: next } };
    }
    case 'setTitle':
      return { ...state, schema: { ...state.schema, title: action.title } };
    case 'load':
      return { ...createBuilderState(action.schema), announcement: `Loaded ${action.schema.title}.` };
    default:
      return state;
  }
}

/** The fields a rule may depend on: input fields that come before this one. */
export function ruleSources(fields: readonly FormFieldDef[], id: string): FormFieldDef[] {
  const position = indexOfField(fields, id);
  return fields.slice(0, Math.max(position, 0)).filter((field) => isInput(field.type));
}

/** The values a rule can compare against for a source field. */
export function ruleValues(field: FormFieldDef): FieldOption[] {
  if (isBoolean(field.type)) {
    return [
      { value: 'true', label: field.type === 'switch' ? 'On' : 'Checked' },
      { value: 'false', label: field.type === 'switch' ? 'Off' : 'Not checked' },
    ];
  }
  return [...(field.options ?? [])];
}

const valueText = (value: FormValue | undefined): string => (value === undefined ? '' : String(value));

/** True when the field should be shown for the current answers. */
export function isVisible(field: FormFieldDef, values: FormValues, fields: readonly FormFieldDef[]): boolean {
  if (!field.showWhen) return true;
  const source = fields.find((entry) => entry.id === field.showWhen?.fieldId);
  if (!source || !isVisible(source, values, fields)) return false;
  const current = values[source.id];
  const text = isBoolean(source.type) && current === undefined ? 'false' : valueText(current);
  return text === field.showWhen.equals;
}

export function visibleFields(schema: FormSchema, values: FormValues): FormFieldDef[] {
  return schema.fields.filter((field) => isVisible(field, values, schema.fields));
}

/** Checks one answer against its field. Returns the message to show, or undefined when it is fine. */
export function validateField(field: FormFieldDef, value: FormValue | undefined): string | undefined {
  if (!isInput(field.type)) return undefined;
  const text = valueText(value).trim();
  const label = field.label;
  if (isBoolean(field.type)) {
    return field.required && value !== true ? (field.type === 'checkbox' ? `Confirm ${label.toLowerCase()} to continue.` : `Turn on ${label.toLowerCase()} to continue.`) : undefined;
  }
  if (text === '') return field.required ? (hasOptions(field.type) || field.type === 'date' ? `Choose ${label.toLowerCase()}.` : `Enter ${label.toLowerCase()}.`) : undefined;
  if (field.type === 'number') {
    const parsed = Number(text);
    if (!Number.isFinite(parsed)) return `${label} must be a number.`;
    const unit = field.unit ? ` ${field.unit}` : '';
    if (field.min !== undefined && parsed < field.min) return `${label} must be at least ${field.min}${unit}.`;
    if (field.max !== undefined && parsed > field.max) return `${label} must be at most ${field.max}${unit}.`;
  }
  if (field.type === 'text' || field.type === 'textarea') {
    if (field.min !== undefined && text.length < field.min) return `${label} needs at least ${field.min} characters.`;
    if (field.max !== undefined && text.length > field.max) return `${label} can have at most ${field.max} characters.`;
  }
  if (hasOptions(field.type) && !(field.options ?? []).some((option) => option.value === text)) return `Choose one of the listed options for ${label.toLowerCase()}.`;
  if (field.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(text)) return `Enter ${label.toLowerCase()} as a date.`;
  return undefined;
}

/** Errors by field id for everything visible; hidden fields are never checked. */
export function validateValues(schema: FormSchema, values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of visibleFields(schema, values)) {
    const message = validateField(field, values[field.id]);
    if (message) errors[field.id] = message;
  }
  return errors;
}

/** Problems with the form itself, by field id: things that would make the built form unusable. */
export function validateSchema(schema: FormSchema): Record<string, string> {
  const problems: Record<string, string> = {};
  schema.fields.forEach((field, position) => {
    if (field.label.trim() === '') problems[field.id] = 'Give this field a label.';
    else if (hasOptions(field.type) && (field.options ?? []).length < 2) problems[field.id] = 'Add at least two options.';
    else if (hasOptions(field.type) && (field.options ?? []).some((option) => option.label.trim() === '')) problems[field.id] = 'Every option needs a label.';
    else if (field.min !== undefined && field.max !== undefined && field.min > field.max) problems[field.id] = 'The minimum is larger than the maximum.';
    else if (field.showWhen) {
      const source = indexOfField(schema.fields, field.showWhen.fieldId);
      if (source === -1 || source >= position) problems[field.id] = 'The field this one depends on is missing or comes later.';
      else if (field.showWhen.equals === '') problems[field.id] = 'Pick the value that shows this field.';
    }
  });
  return problems;
}

/** A readable sentence for a rule: "Shown when Work type is Corrective". */
export function describeRule(rule: VisibilityRule, fields: readonly FormFieldDef[]): string {
  const source = fields.find((field) => field.id === rule.fieldId);
  if (!source) return 'Shown when a field that no longer exists has a value';
  const match = ruleValues(source).find((option) => option.value === rule.equals);
  return `Shown when ${source.label} is ${match?.label ?? rule.equals}`;
}

/** A form's own starting answers: switches and checkboxes start off, everything else empty. */
export function initialValues(schema: FormSchema): FormValues {
  const values: Record<string, FormValue> = {};
  for (const field of schema.fields) {
    if (isBoolean(field.type)) values[field.id] = false;
  }
  return values;
}

type JsonProperty = Record<string, unknown>;

function toProperty(field: FormFieldDef): JsonProperty {
  const base: JsonProperty = { title: field.label };
  if (field.helper) base.description = field.helper;
  switch (field.type) {
    case 'number':
      return { ...base, type: 'number', ...(field.unit ? { 'x-unit': field.unit } : {}), ...(field.min !== undefined ? { minimum: field.min } : {}), ...(field.max !== undefined ? { maximum: field.max } : {}) };
    case 'checkbox':
    case 'switch':
      return { ...base, type: 'boolean', 'x-control': field.type };
    case 'select':
    case 'radio':
      return { ...base, type: 'string', 'x-control': field.type, enum: (field.options ?? []).map((option) => option.value), 'x-enumLabels': (field.options ?? []).map((option) => option.label) };
    case 'date':
      return { ...base, type: 'string', format: 'date' };
    case 'textarea':
      return { ...base, type: 'string', 'x-control': 'textarea', ...(field.min !== undefined ? { minLength: field.min } : {}), ...(field.max !== undefined ? { maxLength: field.max } : {}) };
    default:
      return { ...base, type: 'string', ...(field.placeholder ? { 'x-placeholder': field.placeholder } : {}), ...(field.min !== undefined ? { minLength: field.min } : {}), ...(field.max !== undefined ? { maxLength: field.max } : {}) };
  }
}

/** The schema as a JSON Schema document, with the builder's extras under `x-` keys. */
export function toJsonSchema(schema: FormSchema): Record<string, unknown> {
  const inputs = schema.fields.filter((field) => isInput(field.type));
  const properties: Record<string, JsonProperty> = {};
  for (const field of inputs) {
    const property = toProperty(field);
    if (field.showWhen) property['x-showWhen'] = { field: field.showWhen.fieldId, equals: field.showWhen.equals };
    properties[field.id] = property;
  }
  const sections = schema.fields.filter((field) => field.type === 'heading').map((field) => ({ before: schema.fields.findIndex((entry) => entry.id === field.id), title: field.label }));
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: schema.title,
    type: 'object',
    properties,
    required: inputs.filter((field) => field.required).map((field) => field.id),
    ...(sections.length > 0 ? { 'x-sections': sections } : {}),
  };
}

export const toJsonText = (schema: FormSchema): string => JSON.stringify(toJsonSchema(schema), null, 2);

/**
 * The index a dragged field takes: the number of other rows whose middle is above the pointer.
 * `middles` holds the vertical middle of every row, the dragged one included at `from`.
 */
export function dropIndex(middles: readonly number[], pointerY: number, from: number): number {
  return middles.filter((middle, position) => position !== from && middle < pointerY).length;
}

const slug = (label: string): string =>
  label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** A value that is not used by another option, built from the label: "Poor condition" becomes "poor-condition". */
export function uniqueValue(label: string, taken: readonly string[]): string {
  const base = slug(label) || 'option';
  if (!taken.includes(base)) return base;
  let suffix = 2;
  while (taken.includes(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
