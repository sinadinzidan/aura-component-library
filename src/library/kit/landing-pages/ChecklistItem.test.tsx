import { fireEvent, render, screen } from '@testing-library/react';

import { ChecklistItem } from './ChecklistItem';

describe(ChecklistItem.name, () => {
  it('offers the action of a step that is not done and reports ticking it', () => {
    const onToggle = vi.fn();
    render(
      <ul>
        <ChecklistItem title="Pick your sites" detail="1 minute" done={false} onToggle={onToggle} action={<button type="button">Start</button>} />
      </ul>,
    );

    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pick your sites' }));

    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('says a finished step is done and hides its action', () => {
    render(
      <ul>
        <ChecklistItem title="Pick your sites" done onToggle={vi.fn()} action={<button type="button">Start</button>} />
      </ul>,
    );

    expect(screen.getByRole('checkbox', { name: 'Pick your sites' })).toBeChecked();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument();
  });
});
