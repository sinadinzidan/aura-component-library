import { Button } from '@cognite/aura/components/button';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Textarea } from '@cognite/aura/components/textarea';
import { IconSend } from '@cognite/aura/icons';
import { useId, useState } from 'react';
import type { FormEvent } from 'react';

import { parseEmails } from './parseEmails';
import { RoleSelect } from './RoleSelect';
import type { RoleOption } from './RoleSelect';

export type Invitation = { emails: string[]; role: string };

type InviteFormProps = {
  roles: readonly RoleOption[];
  /** Role preselected for new invitations. Pick the least privileged one. */
  defaultRole: string;
  onInvite: (invitation: Invitation) => void;
  /** Accept a pasted list of addresses instead of a single one. */
  multiple?: boolean;
  /** Addresses that already have access. Inviting one of them is an error, not a silent no-op. */
  existingEmails?: readonly string[];
  /** The organisation's own domain. Addresses outside it are counted as external before sending. */
  internalDomain?: string;
};

/**
 * Invite people by email with a role. One address fits on a single row; with `multiple` the field
 * takes a pasted list, says how many addresses it found and how many are external, and names the
 * entries it cannot read instead of rejecting the whole list.
 */
export function InviteForm({
  roles,
  defaultRole,
  onInvite,
  multiple = false,
  existingEmails = [],
  internalDomain,
}: InviteFormProps) {
  const id = useId();
  const [text, setText] = useState('');
  const [role, setRole] = useState(defaultRole);
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');

  const parsed = parseEmails(text);
  const external = internalDomain ? parsed.valid.filter((email) => !email.endsWith(`@${internalDomain}`)) : [];
  const roleLabel = roles.find((option) => option.value === role)?.label ?? role;

  const change = (next: string) => {
    setText(next);
    setError('');
    setSent('');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const existing = parsed.valid.filter((email) => existingEmails.includes(email));

    if (parsed.valid.length === 0 && parsed.invalid.length === 0) {
      setError(multiple ? 'Enter at least one email address.' : 'Enter an email address.');
    } else if (!multiple && parsed.valid.length + parsed.invalid.length > 1) {
      setError('Enter one email address.');
    } else if (parsed.invalid.length > 0) {
      setError(multiple ? `Check these entries: ${parsed.invalid.join(', ')}` : 'Enter a valid email address.');
    } else if (existing.length > 0) {
      setError(`Already a member: ${existing.join(', ')}`);
    } else {
      onInvite({ emails: parsed.valid, role });
      setSent(
        parsed.valid.length === 1
          ? `Invitation sent to ${parsed.valid[0]} as ${roleLabel}.`
          : `${parsed.valid.length} invitations sent as ${roleLabel}.`
      );
      setText('');
      setError('');
    }
  };

  const summary =
    multiple && parsed.valid.length > 0
      ? `${parsed.valid.length} ${parsed.valid.length === 1 ? 'address' : 'addresses'}${
          external.length > 0 ? `, ${external.length} outside ${internalDomain}` : ''
        }`
      : '';
  const helper = multiple ? summary || 'Separate addresses with commas, spaces or new lines.' : '';
  const fieldProps = {
    id: `${id}-emails`,
    value: text,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': `${id}-message`,
  };
  const roleSelect = (
    <div className="w-32 shrink-0">
      <RoleSelect roles={roles} value={role} onValueChange={setRole} label="Role for new members" size="default" />
    </div>
  );
  const submitButton = (
    <Button type="submit">
      <IconSend /> {multiple ? 'Send invitations' : 'Send invitation'}
    </Button>
  );

  return (
    <form noValidate onSubmit={submit} className="flex w-full flex-col">
      <Label htmlFor={`${id}-emails`}>{multiple ? 'Email addresses' : 'Email address'}</Label>
      {multiple ? (
        <Textarea
          {...fieldProps}
          rows={3}
          placeholder="name@company.example, name@partner.example"
          onChange={(event) => change(event.target.value)}
        />
      ) : (
        <div className="flex items-center gap-2">
          <Input
            {...fieldProps}
            type="email"
            autoComplete="off"
            placeholder="name@company.example"
            onChange={(event) => change(event.target.value)}
          />
          {roleSelect}
          {submitButton}
        </div>
      )}
      <div id={`${id}-message`} aria-live="polite">
        {error ? (
          <HelperText isError>{error}</HelperText>
        ) : sent ? (
          <HelperText isSuccess>{sent}</HelperText>
        ) : helper ? (
          <HelperText>{helper}</HelperText>
        ) : null}
      </div>
      {multiple ? (
        <div className="flex items-center justify-between gap-2 pt-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Invite as
            {roleSelect}
          </div>
          {submitButton}
        </div>
      ) : null}
    </form>
  );
}
