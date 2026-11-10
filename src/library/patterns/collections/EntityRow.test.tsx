import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EntityRow } from './EntityRow';

describe(EntityRow.name, () => {
  it('shows the title, description and meta', () => {
    render(
      <ul>
        <EntityRow title="Export pump A" description="27-PA-2001A" meta="Running" />
      </ul>
    );

    expect(screen.getByText('Export pump A')).toBeInTheDocument();
    expect(screen.getByText('27-PA-2001A')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('is not a button unless it opens something', () => {
    render(
      <ul>
        <EntityRow title="Export pump A" />
      </ul>
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('opens when the row is clicked', async () => {
    const onOpen = vi.fn();
    render(
      <ul>
        <EntityRow title="Export pump A" onOpen={onOpen} />
      </ul>
    );

    await userEvent.click(screen.getByRole('button', { name: /Export pump A/ }));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('marks the selected row as current', () => {
    render(
      <ul>
        <EntityRow title="Export pump A" selected onOpen={vi.fn()} />
      </ul>
    );

    expect(screen.getByRole('button', { name: /Export pump A/ })).toHaveAttribute('aria-current', 'true');
  });

  it('reports checkbox changes without opening the row', async () => {
    const onOpen = vi.fn();
    const onChange = vi.fn();
    render(
      <ul>
        <EntityRow title="Export pump A" onOpen={onOpen} selection={{ checked: false, onChange, label: 'Select Export pump A' }} />
      </ul>
    );

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Export pump A' }));

    expect(onChange).toHaveBeenCalledWith(true);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('cannot be opened while disabled', async () => {
    const onOpen = vi.fn();
    render(
      <ul>
        <EntityRow title="Maintenance history" disabled onOpen={onOpen} />
      </ul>
    );

    await userEvent.click(screen.getByRole('button', { name: /Maintenance history/ }));

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('renders children under the row', () => {
    render(
      <ul>
        <EntityRow title="Backfill">
          <span>62% complete</span>
        </EntityRow>
      </ul>
    );

    expect(screen.getByText('62% complete')).toBeInTheDocument();
  });
});
