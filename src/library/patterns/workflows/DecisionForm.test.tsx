import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DecisionForm } from './DecisionForm';

describe(DecisionForm.name, () => {
  it('approves without a comment', async () => {
    const onSubmit = vi.fn();
    render(<DecisionForm decision="approve" onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

    expect(onSubmit).toHaveBeenCalledWith('');
  });

  it('passes the trimmed comment along', async () => {
    const onSubmit = vi.fn();
    render(<DecisionForm decision="approve" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByRole('textbox', { name: /Comment/ }), '  Checked on site.  ');
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

    expect(onSubmit).toHaveBeenCalledWith('Checked on site.');
  });

  it('does not reject without a reason and says what is missing', async () => {
    const onSubmit = vi.fn();
    render(<DecisionForm decision="reject" onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reject request' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Give a reason, so the requester knows what to change.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Reason for rejecting/ })).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows no error before the first attempt', () => {
    render(<DecisionForm decision="reject" onSubmit={vi.fn()} />);

    expect(screen.queryByText('Give a reason, so the requester knows what to change.')).not.toBeInTheDocument();
  });

  it('rejects once a reason is given', async () => {
    const onSubmit = vi.fn();
    render(<DecisionForm decision="reject" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByRole('textbox', { name: /Reason for rejecting/ }), 'Above design temperature.');
    await userEvent.click(screen.getByRole('button', { name: 'Reject request' }));

    expect(onSubmit).toHaveBeenCalledWith('Above design temperature.');
  });

  it('requires a note when asking for changes', async () => {
    const onSubmit = vi.fn();
    render(<DecisionForm decision="request-changes" onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: 'Request changes' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Say what needs to change before you can approve.')).toBeInTheDocument();
  });

  it('cancels and takes a custom submit label', async () => {
    const onCancel = vi.fn();
    render(<DecisionForm decision="approve" onSubmit={vi.fn()} onCancel={onCancel} submitLabel="Approve start-up" />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Approve start-up' })).toBeInTheDocument();
  });
});
