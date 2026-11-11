import {
  builderReducer,
  createBuilderState,
  defaultField,
  describeRule,
  dropIndex,
  initialValues,
  isVisible,
  pruneRules,
  ruleSources,
  ruleValues,
  toJsonSchema,
  uniqueValue,
  validateField,
  validateSchema,
  validateValues,
  visibleFields,
} from './formSchema';
import type { BuilderAction, BuilderState, FormFieldDef, FormSchema } from './formSchema';

const field = (id: string, patch: Partial<FormFieldDef> = {}): FormFieldDef => ({ id, type: 'text', label: id, ...patch });

const SCHEMA: FormSchema = {
  title: 'Work order request',
  fields: [
    field('kind', { type: 'select', label: 'Work type', required: true, options: [{ value: 'corrective', label: 'Corrective' }, { value: 'preventive', label: 'Preventive' }] }),
    field('safe', { type: 'switch', label: 'Isolated' }),
    field('reason', { label: 'Failure description', showWhen: { fieldId: 'kind', equals: 'corrective' }, required: true }),
    field('hours', { type: 'number', label: 'Estimated effort', unit: 'h', min: 1, max: 40 }),
  ],
};

const run = (state: BuilderState, ...actions: BuilderAction[]): BuilderState => actions.reduce(builderReducer, state);
const ids = (state: BuilderState): string[] => state.schema.fields.map((entry) => entry.id);

describe(builderReducer.name, () => {
  const start = () => createBuilderState(SCHEMA);

  it('adds a field at the end, selects it and announces it', () => {
    const state = run(start(), { type: 'add', fieldType: 'date' });

    expect(ids(state)).toEqual(['kind', 'safe', 'reason', 'hours', 'date-5']);
    expect(state.selectedId).toBe('date-5');
    expect(state.announcement).toBe('Added Date at position 5.');
  });

  it('adds a field at a given position', () => {
    expect(ids(run(start(), { type: 'add', fieldType: 'heading', index: 1 }))[1]).toBe('heading-5');
  });

  it('gives each added field a new id', () => {
    const state = run(start(), { type: 'add', fieldType: 'text' }, { type: 'add', fieldType: 'text' });

    expect(new Set(ids(state)).size).toBe(6);
  });

  it('starts select fields with two options', () => {
    expect(defaultField('select', 'x').options).toHaveLength(2);
    expect(defaultField('number', 'x').unit).toBe('mm');
  });

  it('removes a field and selects its neighbour', () => {
    const state = run(start(), { type: 'select', id: 'safe' }, { type: 'remove', id: 'safe' });

    expect(ids(state)).toEqual(['kind', 'reason', 'hours']);
    expect(state.selectedId).toBe('reason');
  });

  it('drops a rule whose source was removed', () => {
    const state = run(start(), { type: 'remove', id: 'kind' });

    expect(state.schema.fields.find((entry) => entry.id === 'reason')?.showWhen).toBeUndefined();
  });

  it('duplicates a field without copying its rule', () => {
    const state = run(start(), { type: 'duplicate', id: 'reason' });

    const copy = state.schema.fields[3];
    expect(copy.label).toBe('Failure description copy');
    expect(copy.showWhen).toBeUndefined();
    expect(state.selectedId).toBe(copy.id);
  });

  it('moves a field to a position', () => {
    expect(ids(run(start(), { type: 'move', id: 'hours', to: 1 }))).toEqual(['kind', 'hours', 'safe', 'reason']);
  });

  it('moves a field up or down by one and announces the place', () => {
    const state = run(start(), { type: 'moveBy', id: 'safe', delta: -1 });

    expect(ids(state)).toEqual(['safe', 'kind', 'reason', 'hours']);
    expect(state.announcement).toBe('Moved Isolated to position 1 of 4.');
  });

  it('removes a rule when its field is moved above its source', () => {
    const state = run(start(), { type: 'move', id: 'reason', to: 0 });

    expect(state.schema.fields[0].showWhen).toBeUndefined();
  });

  it('says so at the ends of the list', () => {
    expect(run(start(), { type: 'moveBy', id: 'kind', delta: -1 }).announcement).toBe('Work type is already first.');
    expect(run(start(), { type: 'moveBy', id: 'hours', delta: 1 }).announcement).toBe('Estimated effort is already last.');
  });

  it('updates a field and leaves the others alone', () => {
    const state = run(start(), { type: 'update', id: 'hours', patch: { max: 24, helper: 'Planner estimate' } });

    expect(state.schema.fields[3]).toMatchObject({ max: 24, helper: 'Planner estimate', min: 1 });
    expect(state.schema.fields[0]).toBe(SCHEMA.fields[0]);
  });

  it('sets the title and loads a whole schema', () => {
    expect(run(start(), { type: 'setTitle', title: 'Inspection' }).schema.title).toBe('Inspection');
    const loaded = run(start(), { type: 'load', schema: { title: 'Inspection', fields: [field('a')] } });
    expect(ids(loaded)).toEqual(['a']);
    expect(loaded.selectedId).toBeNull();
  });

  it('ignores an unknown id', () => {
    const state = start();

    expect(run(state, { type: 'remove', id: 'nope' })).toBe(state);
    expect(run(state, { type: 'update', id: 'nope', patch: { label: 'x' } })).toBe(state);
    expect(run(state, { type: 'duplicate', id: 'nope' })).toBe(state);
  });
});

describe(pruneRules.name, () => {
  it('keeps a rule that points at an earlier field', () => {
    expect(pruneRules(SCHEMA.fields)[2].showWhen).toBeDefined();
  });
});

describe('visibility', () => {
  it('shows a field with no rule', () => {
    expect(isVisible(SCHEMA.fields[0], {}, SCHEMA.fields)).toBe(true);
  });

  it('shows a ruled field only when the source has the value', () => {
    expect(isVisible(SCHEMA.fields[2], { kind: 'corrective' }, SCHEMA.fields)).toBe(true);
    expect(isVisible(SCHEMA.fields[2], { kind: 'preventive' }, SCHEMA.fields)).toBe(false);
    expect(isVisible(SCHEMA.fields[2], {}, SCHEMA.fields)).toBe(false);
  });

  it('treats an untouched switch as off', () => {
    const fields = [field('on', { type: 'switch' }), field('why', { showWhen: { fieldId: 'on', equals: 'false' } })];

    expect(isVisible(fields[1], {}, fields)).toBe(true);
    expect(isVisible(fields[1], { on: true }, fields)).toBe(false);
  });

  it('hides a field whose source is itself hidden', () => {
    const fields = [field('a', { type: 'switch' }), field('b', { showWhen: { fieldId: 'a', equals: 'true' } }), field('c', { showWhen: { fieldId: 'b', equals: 'x' } })];

    expect(isVisible(fields[2], { a: false, b: 'x' }, fields)).toBe(false);
    expect(isVisible(fields[2], { a: true, b: 'x' }, fields)).toBe(true);
  });

  it('lists the visible fields', () => {
    expect(visibleFields(SCHEMA, { kind: 'preventive' }).map((entry) => entry.id)).toEqual(['kind', 'safe', 'hours']);
  });
});

describe(ruleSources.name, () => {
  it('offers only input fields above the field', () => {
    const fields = [field('h', { type: 'heading' }), field('a'), field('b')];

    expect(ruleSources(fields, 'b').map((entry) => entry.id)).toEqual(['a']);
    expect(ruleSources(fields, 'a')).toEqual([]);
  });
});

describe(ruleValues.name, () => {
  it('offers the options of a select', () => {
    expect(ruleValues(SCHEMA.fields[0]).map((option) => option.value)).toEqual(['corrective', 'preventive']);
  });

  it('offers on and off for a switch', () => {
    expect(ruleValues(SCHEMA.fields[1])).toEqual([
      { value: 'true', label: 'On' },
      { value: 'false', label: 'Off' },
    ]);
  });

  it('offers nothing for a free-text field', () => {
    expect(ruleValues(field('a'))).toEqual([]);
  });
});

describe(validateField.name, () => {
  it('asks for a required text value', () => {
    expect(validateField(field('reason', { label: 'Failure description', required: true }), '  ')).toBe('Enter failure description.');
  });

  it('accepts an empty optional field', () => {
    expect(validateField(field('a'), undefined)).toBeUndefined();
  });

  it('asks to choose for a select', () => {
    expect(validateField(SCHEMA.fields[0], undefined)).toBe('Choose work type.');
  });

  it('rejects an option that is not listed', () => {
    expect(validateField(SCHEMA.fields[0], 'other')).toBe('Choose one of the listed options for work type.');
  });

  it('requires a checked box or an on switch', () => {
    expect(validateField(field('c', { type: 'checkbox', label: 'Permit checked', required: true }), false)).toBe('Confirm permit checked to continue.');
    expect(validateField(field('c', { type: 'switch', label: 'Isolated', required: true }), false)).toBe('Turn on isolated to continue.');
    expect(validateField(field('c', { type: 'checkbox', required: true }), true)).toBeUndefined();
  });

  it('checks a number against its range and unit', () => {
    expect(validateField(SCHEMA.fields[3], '0')).toBe('Estimated effort must be at least 1 h.');
    expect(validateField(SCHEMA.fields[3], '41')).toBe('Estimated effort must be at most 40 h.');
    expect(validateField(SCHEMA.fields[3], '12.5')).toBeUndefined();
  });

  it('rejects text that is not a number', () => {
    expect(validateField(SCHEMA.fields[3], 'abc')).toBe('Estimated effort must be a number.');
  });

  it('checks text length', () => {
    const tag = field('tag', { label: 'Tag', min: 3, max: 5 });

    expect(validateField(tag, 'ab')).toBe('Tag needs at least 3 characters.');
    expect(validateField(tag, 'abcdef')).toBe('Tag can have at most 5 characters.');
    expect(validateField(tag, 'abcd')).toBeUndefined();
  });

  it('checks the shape of a date', () => {
    const due = field('due', { type: 'date', label: 'Due date' });

    expect(validateField(due, '12/03/2026')).toBe('Enter due date as a date.');
    expect(validateField(due, '2026-03-12')).toBeUndefined();
  });

  it('never complains about a heading', () => {
    expect(validateField(field('h', { type: 'heading', required: true }), undefined)).toBeUndefined();
  });
});

describe(validateValues.name, () => {
  it('reports errors for visible fields only', () => {
    expect(validateValues(SCHEMA, { kind: 'preventive' })).toEqual({});
  });

  it('reports a revealed required field', () => {
    expect(validateValues(SCHEMA, { kind: 'corrective' })).toEqual({ reason: 'Enter failure description.' });
  });

  it('reports every problem at once', () => {
    expect(Object.keys(validateValues(SCHEMA, { hours: '99' }))).toEqual(['kind', 'hours']);
  });
});

describe(validateSchema.name, () => {
  const check = (fields: FormFieldDef[]) => validateSchema({ title: 'T', fields });

  it('passes a sound schema', () => {
    expect(check([...SCHEMA.fields])).toEqual({});
  });

  it('flags an empty label', () => {
    expect(check([field('a', { label: ' ' })])).toEqual({ a: 'Give this field a label.' });
  });

  it('flags a select with fewer than two options', () => {
    expect(check([field('a', { type: 'select', options: [{ value: 'x', label: 'X' }] })])).toEqual({ a: 'Add at least two options.' });
  });

  it('flags an option without a label', () => {
    const options = [{ value: 'x', label: 'X' }, { value: 'y', label: '' }];

    expect(check([field('a', { type: 'radio', options })])).toEqual({ a: 'Every option needs a label.' });
  });

  it('flags a minimum above the maximum', () => {
    expect(check([field('a', { type: 'number', min: 5, max: 1 })])).toEqual({ a: 'The minimum is larger than the maximum.' });
  });

  it('flags a rule that points at a later or missing field', () => {
    expect(Object.keys(check([field('a', { showWhen: { fieldId: 'b', equals: 'x' } }), field('b')]))).toEqual(['a']);
    expect(Object.keys(check([field('a', { showWhen: { fieldId: 'gone', equals: 'x' } })]))).toEqual(['a']);
  });

  it('flags a rule with no value', () => {
    expect(check([field('a'), field('b', { showWhen: { fieldId: 'a', equals: '' } })])).toEqual({ b: 'Pick the value that shows this field.' });
  });
});

describe(describeRule.name, () => {
  it('names the field and the value by label', () => {
    expect(describeRule({ fieldId: 'kind', equals: 'corrective' }, SCHEMA.fields)).toBe('Shown when Work type is Corrective');
  });

  it('copes with a missing source', () => {
    expect(describeRule({ fieldId: 'gone', equals: 'x' }, SCHEMA.fields)).toBe('Shown when a field that no longer exists has a value');
  });
});

describe(initialValues.name, () => {
  it('starts switches and checkboxes off', () => {
    expect(initialValues(SCHEMA)).toEqual({ safe: false });
  });
});

describe(toJsonSchema.name, () => {
  const json = toJsonSchema(SCHEMA);

  it('lists required input fields', () => {
    expect(json.required).toEqual(['kind', 'reason']);
  });

  it('maps a select to an enum with labels', () => {
    expect(json.properties).toMatchObject({ kind: { type: 'string', enum: ['corrective', 'preventive'], 'x-enumLabels': ['Corrective', 'Preventive'] } });
  });

  it('maps a number with unit and range', () => {
    expect(json.properties).toMatchObject({ hours: { type: 'number', minimum: 1, maximum: 40, 'x-unit': 'h' } });
  });

  it('keeps the visibility rule', () => {
    expect(json.properties).toMatchObject({ reason: { 'x-showWhen': { field: 'kind', equals: 'corrective' } } });
  });

  it('leaves headings out of the properties but keeps their place', () => {
    const withHeading = toJsonSchema({ title: 'T', fields: [field('h', { type: 'heading', label: 'Details' }), field('a')] });

    expect(Object.keys(withHeading.properties as object)).toEqual(['a']);
    expect(withHeading['x-sections']).toEqual([{ before: 0, title: 'Details' }]);
  });
});

describe(dropIndex.name, () => {
  const middles = [20, 80, 140, 200];

  it('is the first place above the first row', () => {
    expect(dropIndex(middles, 5, 2)).toBe(0);
  });

  it('counts the other rows above the pointer', () => {
    expect(dropIndex(middles, 100, 0)).toBe(1);
    expect(dropIndex(middles, 100, 3)).toBe(2);
  });

  it('is the last place below every row', () => {
    expect(dropIndex(middles, 500, 0)).toBe(3);
  });
});

describe(uniqueValue.name, () => {
  it('makes a slug from the label', () => {
    expect(uniqueValue('Poor condition!', [])).toBe('poor-condition');
  });

  it('avoids a value already taken', () => {
    expect(uniqueValue('Good', ['good', 'good-2'])).toBe('good-3');
  });

  it('falls back to a generic value for an empty label', () => {
    expect(uniqueValue('  ', [])).toBe('option');
  });
});

