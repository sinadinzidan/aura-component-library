import { render, screen } from '@testing-library/react';

import { HorizontalField } from './HorizontalField';

describe(HorizontalField.name, () => {
  it('labels the control', () => {
    render(<HorizontalField label="Site">{(control) => <input {...control} />}</HorizontalField>);

    expect(screen.getByRole('textbox', { name: 'Site' })).toBeInTheDocument();
  });

  it('describes the control with the helper', () => {
    render(
      <HorizontalField label="External ID" helper="Used in API calls.">
        {(control) => <input {...control} />}
      </HorizontalField>
    );

    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Used in API calls.');
  });

  it('replaces the helper with the error and marks the control invalid', () => {
    render(
      <HorizontalField label="External ID" helper="Used in API calls." error="Enter an external ID.">
        {(control) => <input {...control} />}
      </HorizontalField>
    );

    const control = screen.getByRole('textbox');
    expect(control).toBeInvalid();
    expect(control).toHaveAccessibleDescription('Enter an external ID.');
    expect(screen.queryByText('Used in API calls.')).not.toBeInTheDocument();
  });

  it('marks a required control', () => {
    render(
      <HorizontalField label="Title" required>
        {(control) => <input {...control} />}
      </HorizontalField>
    );

    expect(screen.getByRole('textbox')).toBeRequired();
  });
});
