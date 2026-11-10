import { render, screen } from '@testing-library/react';

import { SettingRow } from './SettingRow';

describe(SettingRow.name, () => {
  it('names the control after the label', () => {
    render(<SettingRow label="Pressure unit">{(control) => <input {...control} />}</SettingRow>);

    expect(screen.getByRole('textbox', { name: 'Pressure unit' })).toBeInTheDocument();
  });

  it('describes the control with the description', () => {
    render(
      <SettingRow label="Pressure unit" description="Used in charts and tables.">
        {(control) => <input {...control} />}
      </SettingRow>
    );

    expect(screen.getByRole('textbox', { name: 'Pressure unit' })).toHaveAccessibleDescription(
      'Used in charts and tables.'
    );
  });

  it('disables the control and shows the reason instead of the description', () => {
    render(
      <SettingRow
        label="Pressure unit"
        description="Used in charts and tables."
        disabledReason="Set by your organization."
      >
        {(control) => <input {...control} />}
      </SettingRow>
    );

    const control = screen.getByRole('textbox', { name: 'Pressure unit' });
    expect(control).toBeDisabled();
    expect(control).toHaveAccessibleDescription('Set by your organization.');
    expect(screen.queryByText('Used in charts and tables.')).not.toBeInTheDocument();
  });

  it('renders any control, such as a button', () => {
    render(<SettingRow label="Session">{() => <button type="button">Sign out</button>}</SettingRow>);

    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });
});
