import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PID_FIXTURE } from './pidFixture';
import { PidTagSearch } from './PidTagSearch';

describe(PidTagSearch.name, () => {
  it('lists matching tags as the user types', async () => {
    render(<PidTagSearch drawing={PID_FIXTURE} onPick={vi.fn()} />);

    await userEvent.type(screen.getByRole('combobox', { name: 'Find a tag' }), 'pt');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('23-PT-92530');
    expect(options[0]).toHaveTextContent('Suction pressure');
    expect(options[0]).toHaveTextContent('Instrument');
  });

  it('picks the active result with Enter after moving with the arrow keys', async () => {
    const onPick = vi.fn();
    render(<PidTagSearch drawing={PID_FIXTURE} onPick={onPick} />);

    await userEvent.type(screen.getByRole('combobox'), '23');
    await userEvent.keyboard('{ArrowDown}{Enter}');

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick.mock.calls[0][0].tag).toBe('23-KA-9101');
    expect(screen.getByRole('combobox')).toHaveValue('23-KA-9101');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('picks a result on click', async () => {
    const onPick = vi.fn();
    render(<PidTagSearch drawing={PID_FIXTURE} onPick={onPick} />);

    await userEvent.type(screen.getByRole('combobox'), 'separator');
    await userEvent.click(screen.getByRole('option', { name: /20-VA-1001/ }));

    expect(onPick.mock.calls[0][0].id).toBe('va-1001');
  });

  it('says so when nothing matches', async () => {
    render(<PidTagSearch drawing={PID_FIXTURE} onPick={vi.fn()} />);

    await userEvent.type(screen.getByRole('combobox'), 'zz-99');

    expect(screen.getByRole('status')).toHaveTextContent('No tag on this drawing matches “zz-99”.');
  });

  it('closes the list with Escape and clears the field with a second Escape', async () => {
    render(<PidTagSearch drawing={PID_FIXTURE} onPick={vi.fn()} />);
    const field = screen.getByRole('combobox');

    await userEvent.type(field, 'pt');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(field).toHaveValue('pt');

    await userEvent.keyboard('{Escape}');
    expect(field).toHaveValue('');
  });

  it('opens with a default query', () => {
    render(<PidTagSearch drawing={PID_FIXTURE} onPick={vi.fn()} defaultQuery="ka" results="inline" />);

    expect(screen.getByRole('option', { name: /23-KA-9101/ })).toBeInTheDocument();
  });
});
