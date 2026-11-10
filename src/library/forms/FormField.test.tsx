import { Input } from '@cognite/aura/components/input';
import { render, screen } from '@testing-library/react';

import { FormField } from './FormField';

describe(FormField.name, () => {
  it('names the control with the label', () => {
    render(<FormField label="Data set name">{(control) => <Input {...control} />}</FormField>);

    expect(screen.getByLabelText('Data set name')).toBeInTheDocument();
  });

  it('describes the control with the helper text', () => {
    render(
      <FormField label="External ID" helper="Used in API calls.">
        {(control) => <Input {...control} />}
      </FormField>
    );

    expect(screen.getByLabelText('External ID')).toHaveAccessibleDescription('Used in API calls.');
  });

  it('replaces the helper with the error and marks the control invalid', () => {
    render(
      <FormField label="External ID" helper="Used in API calls." error="Enter an external ID.">
        {(control) => <Input {...control} />}
      </FormField>
    );

    const input = screen.getByLabelText('External ID');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Enter an external ID.');
    expect(screen.queryByText('Used in API calls.')).not.toBeInTheDocument();
  });

  it('marks the control required', () => {
    render(
      <FormField label="Name" required>
        {(control) => <Input {...control} />}
      </FormField>
    );

    expect(screen.getByRole('textbox')).toBeRequired();
  });

  it('adds an optional marker to the label', () => {
    render(
      <FormField label="Description" optional>
        {(control) => <Input {...control} />}
      </FormField>
    );

    expect(screen.getByText('(optional)')).toBeInTheDocument();
  });

  it('disables the control', () => {
    render(
      <FormField label="Project" disabled helper="Set by your administrator.">
        {(control) => <Input {...control} />}
      </FormField>
    );

    expect(screen.getByLabelText('Project')).toBeDisabled();
  });

  it('uses the given id', () => {
    render(
      <FormField label="Name" id="asset-name">
        {(control) => <Input {...control} />}
      </FormField>
    );

    expect(screen.getByLabelText('Name')).toHaveAttribute('id', 'asset-name');
  });
});
