import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EventForm } from './EventForm';
import type { EventFormProps } from './EventForm';

const PROPS: EventFormProps = {
  initial: { title: '', dayId: '2026-03-13', resourceId: 'mechanical', start: 540, end: 600 },
  days: [{ value: '2026-03-13', label: 'Friday 13 March' }],
  crews: [{ value: 'mechanical', label: 'Mechanical' }],
  conflictsFor: () => [],
  onSubmit: () => undefined,
  onCancel: () => undefined,
};

function renderForm(props: Partial<EventFormProps> = {}) {
  return render(<EventForm {...PROPS} {...props} />);
}

describe(EventForm.name, () => {
  it('starts with the times of the draft and the duration', () => {
    renderForm();

    expect(screen.getByLabelText('Starts')).toHaveValue('09:00');
    expect(screen.getByLabelText('Ends')).toHaveValue('10:00');
    expect(screen.getByText('1 h')).toBeInTheDocument();
  });

  it('submits the values with a trimmed title', async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    await userEvent.type(screen.getByRole('textbox', { name: /^Job/ }), '  Replace seal ');
    await userEvent.click(screen.getByRole('button', { name: 'Schedule job' }));

    expect(onSubmit).toHaveBeenCalledWith({ title: 'Replace seal', dayId: '2026-03-13', resourceId: 'mechanical', start: 540, end: 600 });
  });

  it('asks for a title before it submits', async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    await userEvent.click(screen.getByRole('button', { name: 'Schedule job' }));

    expect(screen.getByText('Name the job to schedule it')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit an end that is not after the start', async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    await userEvent.type(screen.getByRole('textbox', { name: /^Job/ }), 'Replace seal');
    await userEvent.clear(screen.getByLabelText('Ends'));
    await userEvent.type(screen.getByLabelText('Ends'), '08:00');
    await userEvent.click(screen.getByRole('button', { name: 'Schedule job' }));

    expect(screen.getByText('The end must be after the start')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the conflicts the values would cause', () => {
    renderForm({ conflictsFor: () => [{ kind: 'double-booked', message: 'Mechanical is already booked for “Vibration survey”' }] });

    expect(screen.getByRole('list', { name: 'Conflicts' })).toHaveTextContent('Mechanical is already booked');
  });

  it('still submits a job that conflicts', async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit, conflictsFor: () => [{ kind: 'outside-hours', message: 'Outside working hours' }] });

    await userEvent.type(screen.getByRole('textbox', { name: /^Job/ }), 'Replace seal');
    await userEvent.click(screen.getByRole('button', { name: 'Schedule job' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('cancels', async () => {
    const onCancel = vi.fn();
    renderForm({ onCancel });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
