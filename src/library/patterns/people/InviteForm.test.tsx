import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { InviteForm } from './InviteForm';

const ROLES = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
];

describe(InviteForm.name, () => {
  it('invites one person with the default role', async () => {
    const onInvite = vi.fn();
    renderForm({ onInvite });

    await userEvent.type(screen.getByLabelText('Email address'), 'Nora.Dahl@nordkapp.example');
    await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }));

    expect(onInvite).toHaveBeenCalledWith({ emails: ['nora.dahl@nordkapp.example'], role: 'viewer' });
  });

  it('confirms and clears the field after sending', async () => {
    renderForm({});

    await userEvent.type(screen.getByLabelText('Email address'), 'nora.dahl@nordkapp.example');
    await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }));

    expect(screen.getByText('Invitation sent to nora.dahl@nordkapp.example as Viewer.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toHaveValue('');
  });

  it('asks for an address when the field is empty', async () => {
    const onInvite = vi.fn();
    renderForm({ onInvite });

    await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }));

    expect(screen.getByText('Enter an email address.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true');
    expect(onInvite).not.toHaveBeenCalled();
  });

  it('rejects a malformed address', async () => {
    const onInvite = vi.fn();
    renderForm({ onInvite });

    await userEvent.type(screen.getByLabelText('Email address'), 'nora.dahl');
    await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }));

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(onInvite).not.toHaveBeenCalled();
  });

  it('clears the error as soon as the field changes', async () => {
    renderForm({});

    await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }));
    await userEvent.type(screen.getByLabelText('Email address'), 'n');

    expect(screen.queryByText('Enter an email address.')).not.toBeInTheDocument();
  });

  it('refuses to invite someone who is already a member', async () => {
    const onInvite = vi.fn();
    renderForm({ onInvite, existingEmails: ['liv.wold@nordkapp.example'] });

    await userEvent.type(screen.getByLabelText('Email address'), 'liv.wold@nordkapp.example');
    await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }));

    expect(screen.getByText('Already a member: liv.wold@nordkapp.example')).toBeInTheDocument();
    expect(onInvite).not.toHaveBeenCalled();
  });

  it('counts the addresses in a pasted list and how many are external', async () => {
    renderForm({ multiple: true, internalDomain: 'nordkapp.example' });

    await userEvent.type(
      screen.getByLabelText('Email addresses'),
      'a@nordkapp.example, b@nordkapp.example c@partner.example'
    );

    expect(screen.getByText('3 addresses, 1 outside nordkapp.example')).toBeInTheDocument();
  });

  it('sends every address in a list', async () => {
    const onInvite = vi.fn();
    renderForm({ onInvite, multiple: true });

    await userEvent.type(screen.getByLabelText('Email addresses'), 'a@nordkapp.example; b@nordkapp.example');
    await userEvent.click(screen.getByRole('button', { name: 'Send invitations' }));

    expect(onInvite).toHaveBeenCalledWith({ emails: ['a@nordkapp.example', 'b@nordkapp.example'], role: 'viewer' });
    expect(screen.getByText('2 invitations sent as Viewer.')).toBeInTheDocument();
  });

  it('names the entries it cannot read and sends nothing', async () => {
    const onInvite = vi.fn();
    renderForm({ onInvite, multiple: true });

    await userEvent.type(screen.getByLabelText('Email addresses'), 'a@nordkapp.example, tomas, jonas@');
    await userEvent.click(screen.getByRole('button', { name: 'Send invitations' }));

    expect(screen.getByText('Check these entries: tomas, jonas@')).toBeInTheDocument();
    expect(onInvite).not.toHaveBeenCalled();
  });
});

function renderForm(props: Partial<ComponentProps<typeof InviteForm>>) {
  return render(<InviteForm roles={ROLES} defaultRole="viewer" onInvite={vi.fn()} {...props} />);
}
