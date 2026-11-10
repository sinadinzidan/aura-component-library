import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChoiceCardGroup } from './ChoiceCardGroup';
import type { ChoiceCardOption } from './ChoiceCardGroup';

describe(ChoiceCardGroup.name, () => {
  it('names the group and marks the current choice', () => {
    renderGroup('hourly');

    expect(screen.getByRole('radiogroup', { name: 'Run schedule' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Every hour/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /On change/ })).not.toBeChecked();
  });

  it('reports the picked option', async () => {
    const onValueChange = renderGroup('hourly');

    await userEvent.click(screen.getByRole('radio', { name: /On change/ }));

    expect(onValueChange).toHaveBeenCalledWith('on-change');
  });

  it('picks an option from anywhere on its card', async () => {
    const onValueChange = renderGroup('hourly');

    await userEvent.click(screen.getByText('Runs when the source data set is updated.'));

    expect(onValueChange).toHaveBeenCalledWith('on-change');
  });

  it('shows the tag next to the label', () => {
    renderGroup('hourly');

    expect(screen.getByText('Recommended')).toBeInTheDocument();
  });

  it('disables an option and shows the reason instead of its description', () => {
    renderGroup('hourly');

    expect(screen.getByRole('radio', { name: /Streaming/ })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Not available for file sources.')).toBeInTheDocument();
    expect(screen.queryByText('Processes rows as they arrive.')).not.toBeInTheDocument();
  });

  it('describes the group with the helper text', () => {
    renderGroup('hourly');

    expect(screen.getByRole('radiogroup', { name: 'Run schedule' })).toHaveAccessibleDescription(
      'You can change this later.'
    );
  });
});

const OPTIONS: readonly ChoiceCardOption[] = [
  {
    value: 'hourly',
    label: 'Every hour',
    description: 'Runs at the top of each hour.',
    tag: 'Recommended',
  },
  {
    value: 'on-change',
    label: 'On change',
    description: 'Runs when the source data set is updated.',
  },
  {
    value: 'streaming',
    label: 'Streaming',
    description: 'Processes rows as they arrive.',
    disabledReason: 'Not available for file sources.',
  },
];

function renderGroup(value: string) {
  const onValueChange = vi.fn<(value: string) => void>();
  render(
    <ChoiceCardGroup
      label="Run schedule"
      options={OPTIONS}
      value={value}
      onValueChange={onValueChange}
      helperText="You can change this later."
    />
  );
  return onValueChange;
}
