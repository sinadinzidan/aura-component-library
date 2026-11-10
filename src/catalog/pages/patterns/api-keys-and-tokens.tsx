import { Alert, AlertActions, AlertButton, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Avatar, AvatarIcon } from '@cognite/aura/components/avatar';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardFooterEnd,
  CardFooterStart,
  CardHeader,
  CardHeaderCenter,
  CardHeaderEnd,
  CardHeaderStart,
  CardTitle,
} from '@cognite/aura/components/card';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Input } from '@cognite/aura/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconCheck, IconHistory, IconKey, IconPlus, IconRobot, IconRotate, IconTrash, IconX } from '@cognite/aura/icons';
import { useState } from 'react';

import { ConfirmButton } from '../../../library/actions/ConfirmButton';
import { CopyButton } from '../../../library/actions/CopyButton';
import { RowActionsMenu } from '../../../library/data/RowActionsMenu';
import { MetadataList } from '../../../library/display/MetadataList';
import { LabelledProgress } from '../../../library/feedback/LabelledProgress';
import { ChoiceCardGroup } from '../../../library/forms/ChoiceCardGroup';
import { FormField } from '../../../library/forms/FormField';
import { SelectAllCheckboxList } from '../../../library/forms/SelectAllCheckboxList';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { ConfirmDialog } from '../../../library/overlays/ConfirmDialog';
import { FormActions } from '../../../library/patterns/data-entry/FormActions';
import { ExpiryBadge } from '../../../library/patterns/people/ExpiryBadge';
import { getExpiryState } from '../../../library/patterns/people/expiryState';
import { maskSecret } from '../../../library/patterns/people/maskSecret';
import { SecretField } from '../../../library/patterns/people/SecretField';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, formatAgo, formatDate, formatDateTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './api-keys-and-tokens.tsx?raw';

/**
 * Every value on this page is a made-up placeholder in one style: a readable `example-…` prefix
 * and a four-digit serial. None of them follows the format of a real credential.
 */
const KEY_MASK = { visibleStart: 12, visibleEnd: 4 };

type ApiKey = {
  id: string;
  name: string;
  value: string;
  scope: string;
  owner: string;
  createdAt: number;
  lastUsedAt: number | null;
  expiresAt: number | null;
  revokedAt: number | null;
  seed: number;
  daily: number;
};

const KEYS: readonly ApiKey[] = [
  { id: 'k1', name: 'Historian extractor', value: 'example-key-historian-0001', scope: 'Write time series', owner: 'svc-historian', createdAt: REFERENCE_NOW - 60 * DAY, lastUsedAt: REFERENCE_NOW - 2 * MINUTE, expiresAt: REFERENCE_NOW + 120 * DAY, revokedAt: null, seed: 81, daily: 86_000 },
  { id: 'k2', name: 'Vibration dashboard export', value: 'example-key-dashboard-0002', scope: 'Read time series', owner: 'Aisha Khan', createdAt: REFERENCE_NOW - 84 * DAY, lastUsedAt: REFERENCE_NOW - 3 * HOUR, expiresAt: REFERENCE_NOW + 6 * DAY, revokedAt: null, seed: 82, daily: 4200 },
  { id: 'k3', name: 'Shutdown planning script', value: 'example-key-shutdown-0003', scope: 'Read work orders', owner: 'Magnus Solberg', createdAt: REFERENCE_NOW - 102 * DAY, lastUsedAt: REFERENCE_NOW - 14 * DAY, expiresAt: REFERENCE_NOW - 12 * DAY, revokedAt: null, seed: 83, daily: 300 },
  { id: 'k4', name: 'TurboTech service portal', value: 'example-key-turbotech-0004', scope: 'Read time series', owner: 'Sofia Lind', createdAt: REFERENCE_NOW - 40 * DAY, lastUsedAt: REFERENCE_NOW - 4 * DAY, expiresAt: REFERENCE_NOW + 50 * DAY, revokedAt: REFERENCE_NOW - 3 * DAY, seed: 84, daily: 900 },
  { id: 'k5', name: 'Alarm relay', value: 'example-key-alarmrelay-0005', scope: 'Read alarms', owner: 'svc-alarm-relay', createdAt: REFERENCE_NOW - 20 * DAY, lastUsedAt: null, expiresAt: null, revokedAt: null, seed: 85, daily: 0 },
];

const [HISTORIAN_KEY, DASHBOARD_KEY] = KEYS;

const SCOPE_ITEMS = [
  { value: 'read', label: 'Read only', description: 'Read time series, assets and work orders.', tag: 'Recommended' },
  { value: 'write', label: 'Read and write', description: 'Also write time series and create work orders.' },
  { value: 'custom', label: 'Custom', description: 'Pick individual scopes on the next step.' },
];

const EXPIRY_ITEMS = [
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '1 year' },
];

const SCOPES = [
  { id: 'ts:read', label: 'timeseries:read', description: 'Read data points and metadata' },
  { id: 'ts:write', label: 'timeseries:write', description: 'Create and correct data points' },
  { id: 'asset:read', label: 'assets:read', description: 'Read the asset hierarchy' },
  { id: 'wo:read', label: 'workorders:read', description: 'Read work orders' },
  { id: 'wo:write', label: 'workorders:write', description: 'Create and update work orders' },
  { id: 'admin', label: 'project:admin', description: 'Only owners can grant this scope.', disabled: true },
];

const ROTATE_STEPS = [
  { title: 'Create the replacement key', detail: 'Same scopes as the old key. Both work until you revoke the old one.' },
  { title: 'Update the historian extractor', detail: 'Replace the key in the extractor configuration and restart it.' },
  { title: 'Confirm the new key is in use', detail: 'Wait for the first request made with the new key.' },
  { title: 'Revoke the old key', detail: 'Requests with the old key fail from this moment.' },
];

/** Documentation address ranges (RFC 5737), not real networks. */
const INITIAL_ALLOW_LIST = [
  { id: 'ip1', range: '192.0.2.0/24', label: 'Nordkapp control network' },
  { id: 'ip2', range: '198.51.100.14', label: 'Historian extractor host' },
  { id: 'ip3', range: '203.0.113.0/28', label: 'Hammerfest office' },
];

const SNIPPET = `curl https://api.nordkapp.test/v1/timeseries \\
  -H "Authorization: Bearer $NORDKAPP_API_KEY"`;

const NUMBER = new Intl.NumberFormat('en-GB');

function usageOf(key: ApiKey): number[] {
  if (key.daily === 0) return Array.from({ length: 30 }, () => 0);
  return makeValues({ seed: key.seed, points: 30, base: key.daily, amplitude: key.daily * 0.2, noise: key.daily * 0.08 });
}

function lastUsed(key: ApiKey): string {
  return key.lastUsedAt === null ? 'Never used' : formatAgo(key.lastUsedAt);
}

function ApiKeyTokenRows() {
  const keys = [HISTORIAN_KEY, DASHBOARD_KEY];

  return (
    <ul className="flex w-full max-w-lg flex-col divide-y divide-default">
      {keys.map((key) => (
        <li key={key.id} className="flex min-h-14 items-center gap-3 py-2">
          <IconKey aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-base-foreground">{key.name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">{maskSecret(key.value, KEY_MASK)}</p>
          </div>
          <dl className="flex shrink-0 gap-6 text-xs tabular-nums">
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="text-base-foreground">{formatDate(key.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last used</dt>
              <dd className="text-base-foreground">{lastUsed(key)}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}

function ApiKeyTokenExpiryStates() {
  return (
    <ul className="flex w-full max-w-lg flex-col divide-y divide-default">
      {KEYS.map((key) => (
        <li key={key.id} className="flex min-h-10 items-center justify-between gap-3 py-2">
          <span className="min-w-0 truncate text-sm text-base-foreground">{key.name}</span>
          <ExpiryBadge expiresAt={key.expiresAt} revokedAt={key.revokedAt} now={REFERENCE_NOW} showDetail />
        </li>
      ))}
    </ul>
  );
}

function ApiKeyTokenRevealOnce() {
  const [done, setDone] = useState(false);

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <Alert variant="warning">
        <AlertTitle>Copy this key now</AlertTitle>
        <AlertDescription>It is shown once. After you close this, only the last four characters stay visible.</AlertDescription>
      </Alert>
      {done ? (
        <SecretField
          label="Key for Historian extractor"
          masked={maskSecret(HISTORIAN_KEY.value, KEY_MASK)}
          hint="Shown once when it was created. Rotate the key if it was not saved."
        />
      ) : (
        <SecretField label="Key for Historian extractor" value={HISTORIAN_KEY.value} mask={KEY_MASK} defaultRevealed />
      )}
      <div className="flex items-center gap-2">
        {done ? (
          <Button variant="ghost" size="sm" onClick={() => setDone(false)}>
            Reset example
          </Button>
        ) : (
          <Button onClick={() => setDone(true)}>I have stored the key</Button>
        )}
      </div>
    </div>
  );
}

function ApiKeyTokenSecretFields() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <SecretField label="Staging key" value="example-key-staging-0009" mask={KEY_MASK} hint="Held in this session: reveal or copy." />
      <SecretField
        label="Deploy key"
        value="example-key-deploy-0010"
        mask={KEY_MASK}
        revealable={false}
        hint="Copy only, for shared screens in the control room."
      />
      <SecretField
        label="Production key"
        masked={maskSecret('example-key-production-0011', KEY_MASK)}
        hint="Stored hashed. It cannot be shown or copied again."
      />
    </div>
  );
}

function ApiKeyTokenCreateForm() {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [scope, setScope] = useState('read');
  const [expiry, setExpiry] = useState('90');
  const expiresAt = REFERENCE_NOW + Number(expiry) * DAY;

  return (
    <form
      className="flex w-full max-w-lg flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <FormField
        label="Name"
        required
        helper="What uses the key, so it can be recognised and revoked later."
        error={submitted && name.trim() === '' ? 'Enter a name for the key.' : undefined}
      >
        {(control) => (
          <Input {...control} value={name} placeholder="Historian extractor" onChange={(event) => setName(event.target.value)} />
        )}
      </FormField>
      <ChoiceCardGroup label="Scope" options={SCOPE_ITEMS} value={scope} onValueChange={setScope} />
      <FormField label="Expires after" helper={`The key stops working on ${formatDate(expiresAt)}. Keys without expiry are not allowed.`}>
        {(control) => (
          <Select items={EXPIRY_ITEMS} value={expiry} onValueChange={setExpiry}>
            <SelectTrigger id={control.id} aria-describedby={control['aria-describedby']}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPIRY_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>
      <FormActions>
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Create key</Button>
      </FormActions>
    </form>
  );
}

function ApiKeyTokenScopeChecklist() {
  const [scopes, setScopes] = useState<readonly string[]>(['ts:read', 'asset:read']);
  const writes = scopes.filter((scope) => scope.endsWith(':write')).length;

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <SelectAllCheckboxList
        label="Scopes for this key"
        options={SCOPES}
        value={scopes}
        onValueChange={setScopes}
        selectAllLabel="All scopes you can grant"
        formatCount={(selected, total) => `${selected} of ${total} scopes`}
      />
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {scopes.length === 0
          ? 'A key needs at least one scope.'
          : writes === 0
            ? 'Read only. This key cannot change anything.'
            : `Includes ${writes} write ${writes === 1 ? 'scope' : 'scopes'}. Give it only to the system that writes.`}
      </p>
    </div>
  );
}

function ApiKeyTokenRotateSteps() {
  const [step, setStep] = useState(1);
  const finished = step >= ROTATE_STEPS.length;

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <ol className="flex flex-col gap-4">
        {ROTATE_STEPS.map((entry, index) => {
          const done = index < step;
          const current = index === step;
          return (
            <li key={entry.title} aria-current={current ? 'step' : undefined} className="flex items-start gap-3">
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums ${
                  done
                    ? 'bg-success-background text-success-foreground'
                    : current
                      ? 'bg-primary-background text-primary-foreground'
                      : 'bg-muted-background text-muted-foreground'
                }`}
              >
                {done ? <IconCheck aria-hidden="true" className="size-3.5" /> : index + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <p className={`text-sm font-medium ${done || current ? 'text-base-foreground' : 'text-muted-foreground'}`}>
                  {entry.title}
                  <span className="sr-only">{done ? ', done' : current ? ', current step' : ', not started'}</span>
                </p>
                {current ? <p className="text-xs text-muted-foreground">{entry.detail}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="flex items-center gap-2">
        {finished ? (
          <>
            <span className="text-sm text-base-foreground">Rotation complete. The old key is revoked.</span>
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
              Reset example
            </Button>
          </>
        ) : step === ROTATE_STEPS.length - 1 ? (
          <ConfirmButton size="sm" confirmLabel="Confirm revoke" onConfirm={() => setStep(step + 1)}>
            Revoke old key
          </ConfirmButton>
        ) : (
          <Button size="sm" onClick={() => setStep(step + 1)}>
            Mark as done
          </Button>
        )}
      </div>
    </div>
  );
}

function ApiKeyTokenRevokeConfirm() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-base-foreground">{HISTORIAN_KEY.name}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{maskSecret(HISTORIAN_KEY.value, KEY_MASK)}</p>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
          Revoke key
        </Button>
      </div>
      <p className="text-xs tabular-nums text-muted-foreground">
        Used {lastUsed(HISTORIAN_KEY)} by {HISTORIAN_KEY.owner}. About {NUMBER.format(HISTORIAN_KEY.daily)} requests a day
        will start to fail.
      </p>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Revoke Historian extractor?"
        description="The key stops working at once and cannot be restored. Time series from the historian stop updating until a new key is installed. Type the key name to confirm."
        confirmLabel="Revoke key"
        confirmText={HISTORIAN_KEY.name}
        destructive
        onConfirm={() => undefined}
      />
    </div>
  );
}

function ApiKeyTokenClientCredentials() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-base-foreground">Client credentials</h3>
        <p className="text-xs text-muted-foreground">For services that sign in on their own. The ID is not secret; the secret is.</p>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Client ID</span>
        <div className="flex h-9 items-center gap-1 rounded-lg bg-muted-background pr-1 pl-3">
          <code className="min-w-0 flex-1 truncate font-mono text-sm text-base-foreground">example-client-id-0042</code>
          <CopyButton variant="ghost" size="icon-sm" text="example-client-id-0042" label="Copy client ID" iconOnly />
        </div>
      </div>
      <SecretField
        label="Client secret"
        value="example-client-secret-0042"
        mask={{ visibleStart: 8, visibleEnd: 4 }}
        hint={`Created ${formatDate(REFERENCE_NOW - 30 * DAY)}. Rotate it every 90 days.`}
      />
    </div>
  );
}

function ApiKeyTokenWebhookSecret() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-base-foreground">Alarm webhook</h3>
        <p className="truncate font-mono text-xs text-muted-foreground">https://hooks.nordkapp.test/alarms</p>
      </div>
      <SecretField
        label="Signing secret"
        value="example-webhook-secret-0007"
        mask={{ visibleStart: 8, visibleEnd: 4 }}
        hint="Each delivery is signed with this secret. Verify the signature before you trust the payload."
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs tabular-nums text-muted-foreground">Last delivery {formatAgo(REFERENCE_NOW - 14 * MINUTE)}, accepted</span>
        <Button variant="ghost" size="sm">
          <IconRotate /> Rotate secret
        </Button>
      </div>
    </div>
  );
}

function ApiKeyTokenServiceAccount() {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardHeaderStart>
          <Avatar variant="overflow" aria-hidden="true">
            <AvatarIcon>
              <IconRobot />
            </AvatarIcon>
          </Avatar>
        </CardHeaderStart>
        <CardHeaderCenter>
          <CardTitle as="h4">svc-historian</CardTitle>
          <CardDescription>Service account · Owned by Rotating equipment</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <Badge variant="secondary" outline>
            Not a person
          </Badge>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <MetadataList
          items={[
            { label: 'Access', value: 'Write time series · Compressor telemetry' },
            { label: 'Keys', value: '1 active, 1 expiring soon' },
            { label: 'Last request', value: <span className="tabular-nums">{formatAgo(REFERENCE_NOW - 2 * MINUTE)}</span> },
          ]}
        />
      </CardContent>
      <CardFooter>
        <CardFooterStart>
          <span className="text-xs text-muted-foreground">Cannot sign in to the app</span>
        </CardFooterStart>
        <CardFooterEnd>
          <Button variant="outline" size="sm">
            Manage keys
          </Button>
        </CardFooterEnd>
      </CardFooter>
    </Card>
  );
}

function ApiKeyTokenIpAllowList() {
  const [rows, setRows] = useState(INITIAL_ALLOW_LIST);

  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-base-foreground">IP allow-list</h3>
          <p className="text-xs text-muted-foreground">Requests from other addresses are rejected, whatever the key.</p>
        </div>
        <Button variant="secondary" size="sm">
          <IconPlus /> Add range
        </Button>
      </div>
      {rows.length === 0 ? (
        <div className="flex items-center justify-between gap-3 py-2 text-sm text-muted-foreground">
          No ranges. Keys work from any address.
          <Button variant="ghost" size="sm" onClick={() => setRows(INITIAL_ALLOW_LIST)}>
            Reset example
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-default">
          {rows.map((row) => (
            <li key={row.id} className="flex min-h-10 items-center gap-3 py-1">
              <code className="w-36 shrink-0 font-mono text-sm tabular-nums text-base-foreground">{row.range}</code>
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{row.label}</span>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${row.range}`}
                      onClick={() => setRows((current) => current.filter((entry) => entry.id !== row.id))}
                    >
                      <IconX />
                    </Button>
                  }
                />
                <TooltipContent>Remove range</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ApiKeyTokenUsageSparkline() {
  return (
    <table className="w-full max-w-lg border-collapse text-sm">
      <caption className="sr-only">Requests per key over the last 30 days</caption>
      <thead>
        <tr className="border-b border-default text-left text-xs text-muted-foreground">
          <th scope="col" className="py-2 pr-4 font-medium">
            Key
          </th>
          <th scope="col" className="w-32 py-2 pr-4 font-medium">
            Last 30 days
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            Requests a day
          </th>
        </tr>
      </thead>
      <tbody>
        {KEYS.filter((key) => key.revokedAt === null).map((key) => (
          <tr key={key.id} className="border-b border-default last:border-b-0">
            <th scope="row" className="py-2 pr-4 text-left font-medium text-base-foreground">
              {key.name}
            </th>
            <td className="py-2 pr-4">
              {key.daily === 0 ? (
                <span className="text-xs text-muted-foreground">No requests</span>
              ) : (
                <Sparkline values={usageOf(key)} label={`Requests a day for ${key.name}, last 30 days`} height={24} decimals={0} />
              )}
            </td>
            <td className="py-2 text-right tabular-nums text-base-foreground">{NUMBER.format(key.daily)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ApiKeyTokenRateLimitMeter() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-2">
        <LinearGauge
          label="Requests this minute"
          value={840}
          max={1000}
          unit="req"
          limits={{ high: 800, highHigh: 950 }}
          showScale
        />
        <p className="text-xs tabular-nums text-muted-foreground">
          Above 800 the extractor is asked to slow down. At 1,000 requests are rejected until the minute resets, in 22 s.
        </p>
      </div>
      <LabelledProgress
        label="Requests today"
        value={86_400}
        max={500_000}
        valueText="86,400 of 500,000"
        hint="Daily quota for the project, shared by all keys."
        size="sm"
      />
    </div>
  );
}

function ApiKeyTokenAuditNote() {
  return (
    <div className="flex w-full max-w-xs items-start gap-3">
      <IconHistory aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-base-foreground">Aisha Khan</span> rotated this key on{' '}
        <span className="tabular-nums">{formatDateTime(REFERENCE_NOW - 26 * HOUR)}</span>. Creating, rotating and revoking
        keys is recorded in the audit log and kept for 12 months.
      </p>
    </div>
  );
}

function ApiKeyTokenEmptyState() {
  return (
    <EmptyState type="new-object">
      <EmptyStateIcon />
      <EmptyStateTitle as="h4">No API keys yet</EmptyStateTitle>
      <EmptyStateDescription>Create a key to let an extractor or script read and write project data.</EmptyStateDescription>
      <EmptyStateActions>
        <Button size="sm">
          <IconPlus /> Create key
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function ApiKeyTokenExpiringNotice() {
  const expiring = KEYS.filter((key) => getExpiryState({ expiresAt: key.expiresAt, revokedAt: key.revokedAt, now: REFERENCE_NOW }) === 'expiring-soon');

  return (
    <div className="w-full max-w-xs">
      <Alert variant="warning">
        <AlertTitle>
          {expiring.length} {expiring.length === 1 ? 'key expires' : 'keys expire'} this week
        </AlertTitle>
        <AlertDescription>{expiring.map((key) => key.name).join(', ')}. Rotate before it stops working.</AlertDescription>
        <AlertActions>
          <AlertButton>Rotate key</AlertButton>
        </AlertActions>
      </Alert>
    </div>
  );
}

function ApiKeyTokenTable() {
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">API keys in Nordkapp production</caption>
      <thead>
        <tr className="border-b border-default text-left text-xs text-muted-foreground">
          <th scope="col" className="py-2 pr-4 font-medium">
            Name
          </th>
          <th scope="col" className="hidden py-2 pr-4 font-medium lg:table-cell">
            Key
          </th>
          <th scope="col" className="hidden py-2 pr-4 font-medium md:table-cell">
            Scope
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Created
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Last used
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Status
          </th>
          <th scope="col" className="w-9 py-2">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {KEYS.map((key) => {
          const state = getExpiryState({ expiresAt: key.expiresAt, revokedAt: key.revokedAt, now: REFERENCE_NOW });
          const dead = state === 'revoked' || state === 'expired';
          return (
            <tr key={key.id} className="border-b border-default last:border-b-0">
              <th scope="row" className="py-2 pr-4 text-left font-normal">
                <span className={`block font-medium ${dead ? 'text-muted-foreground' : 'text-base-foreground'}`}>{key.name}</span>
                <span className="block text-xs text-muted-foreground">{key.owner}</span>
              </th>
              <td className="hidden py-2 pr-4 font-mono text-xs text-muted-foreground lg:table-cell">
                {maskSecret(key.value, KEY_MASK)}
              </td>
              <td className="hidden py-2 pr-4 text-muted-foreground md:table-cell">{key.scope}</td>
              <td className="py-2 pr-4 tabular-nums text-muted-foreground">{formatDate(key.createdAt)}</td>
              <td className="py-2 pr-4 tabular-nums text-muted-foreground">{lastUsed(key)}</td>
              <td className="py-2 pr-4">
                <ExpiryBadge expiresAt={key.expiresAt} revokedAt={key.revokedAt} now={REFERENCE_NOW} />
              </td>
              <td className="py-2">
                <RowActionsMenu
                  label={`Actions for ${key.name}`}
                  actions={[
                    { id: 'rotate', label: 'Rotate key', icon: <IconRotate />, onSelect: () => undefined, disabled: state === 'revoked' },
                    { id: 'usage', label: 'View usage', icon: <IconHistory />, onSelect: () => undefined },
                    dead
                      ? { id: 'delete', label: 'Delete from list', icon: <IconTrash />, onSelect: () => undefined, destructive: true }
                      : { id: 'revoke', label: 'Revoke key', icon: <IconTrash />, onSelect: () => undefined, destructive: true },
                  ]}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ApiKeyTokenSnippet() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Use the key</h3>
        <CopyButton variant="ghost" size="sm" text={SNIPPET} label="Copy command" />
      </div>
      <pre className="overflow-x-auto rounded-lg bg-muted-background p-3 font-mono text-xs text-base-foreground">{SNIPPET}</pre>
      <p className="text-xs text-muted-foreground">
        The command reads the key from an environment variable. Keep keys in a secret store, never in source code or
        chat.
      </p>
    </div>
  );
}

function ApiKeyTokenUnusedKeys() {
  const unused = KEYS.filter((key) => key.revokedAt === null && (key.lastUsedAt === null || REFERENCE_NOW - key.lastUsedAt > 10 * DAY));

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-base-foreground">{unused.length} keys look unused</h3>
        <p className="text-xs text-muted-foreground">No requests in the last 10 days. Unused keys are a risk with no benefit.</p>
      </div>
      <ul className="flex flex-col divide-y divide-default">
        {unused.map((key) => (
          <li key={key.id} className="flex min-h-12 items-center gap-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-base-foreground">{key.name}</p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {key.lastUsedAt === null ? `Never used since ${formatDate(key.createdAt)}` : `Last used ${formatAgo(key.lastUsedAt)}`}
              </p>
            </div>
            <ExpiryBadge expiresAt={key.expiresAt} revokedAt={key.revokedAt} now={REFERENCE_NOW} />
            <ConfirmButton size="sm" confirmLabel="Confirm revoke" aria-label={`Revoke ${key.name}`} onConfirm={() => undefined}>
              Revoke
            </ConfirmButton>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ApiKeyTokenLimitReached() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <LabelledProgress label="Keys in this project" value={10} max={10} valueText="10 of 10" />
      <Button disabled aria-describedby="api-key-token-limit-reason">
        <IconPlus /> Create key
      </Button>
      <p id="api-key-token-limit-reason" className="text-xs text-muted-foreground">
        The project has reached its key limit. Revoke a key you no longer use to create a new one.
      </p>
    </div>
  );
}

function ApiKeyTokenDetail() {
  const key = DASHBOARD_KEY;
  const usage = usageOf(key);

  return (
    <div className="flex h-112 w-full flex-col gap-4 overflow-y-auto rounded-xl border border-default bg-base-background p-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h3 className="text-xl font-semibold tracking-tight text-base-foreground">{key.name}</h3>
          <ExpiryBadge expiresAt={key.expiresAt} revokedAt={key.revokedAt} now={REFERENCE_NOW} showDetail />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm">
            <IconRotate /> Rotate key
          </Button>
          <Button variant="outline" size="sm">
            Revoke
          </Button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <SecretField label="Key" masked={maskSecret(key.value, KEY_MASK)} hint="Shown once when it was created." />
          <MetadataList
            items={[
              { label: 'Owner', value: key.owner },
              { label: 'Scope', value: key.scope },
              { label: 'Created', value: <span className="tabular-nums">{formatDate(key.createdAt)}</span> },
              { label: 'Expires', value: <span className="tabular-nums">{key.expiresAt === null ? undefined : formatDate(key.expiresAt)}</span> },
              { label: 'Last used', value: <span className="tabular-nums">{lastUsed(key)}</span> },
            ]}
          />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Requests a day, last 30 days</p>
              <p className="text-2xl font-semibold tabular-nums text-base-foreground">{NUMBER.format(key.daily)}</p>
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">
              Peak {NUMBER.format(Math.round(Math.max(...usage)))}
            </span>
          </div>
          <Sparkline values={usage} label={`Requests a day for ${key.name}, last 30 days`} variant="area" height={72} decimals={0} showLast />
          <p className="border-t border-default pt-3 text-xs text-muted-foreground">
            Created by {key.owner} on <span className="tabular-nums">{formatDate(key.createdAt)}</span>. Never rotated.
          </p>
        </div>
      </div>
    </div>
  );
}

export default definePage({
  id: 'api-keys-and-tokens',
  title: 'API keys and tokens',
  summary:
    'Credentials for machines: keys, client credentials and webhook secrets, shown masked, revealed once, scoped narrowly and given an expiry. Every value on this page is an obvious placeholder.',
  guidance: {
    use: [
      'A mask of fixed length with the last four characters, so keys can be told apart.',
      'One reveal, at creation, with a warning and an explicit "I have stored it".',
      'A name, a scope and an expiry on every key; read-only as the default scope.',
      'Last used and usage next to every key, so unused ones get revoked.',
    ],
    avoid: [
      'Showing a stored secret again, or offering copy for a value the client does not hold.',
      'Keys without expiry or without an owner.',
      'Revoking without saying what will stop working.',
      'Expiry shown by colour alone; the badge always carries a word.',
    ],
  },
  source,
  sections: [
    {
      id: 'keys',
      title: 'Keys and secrets',
      description: 'How one credential is shown, masked and labelled through its life.',
      specimens: [
        {
          id: 'ApiKeyTokenRows',
          title: 'Key row',
          note: 'A key in a short list: name, masked value, created and last used.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/maskSecret.ts'],
          Component: ApiKeyTokenRows,
        },
        {
          id: 'ApiKeyTokenExpiryStates',
          title: 'Expiry badge states',
          note: 'The five lifecycle states, each with a word, an icon and the distance in time.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/ExpiryBadge.tsx', 'patterns/people/expiryState.ts'],
          Component: ApiKeyTokenExpiryStates,
        },
        {
          id: 'ApiKeyTokenRevealOnce',
          title: 'Reveal once',
          note: 'Right after creating a key: the only time the full value is shown, with a warning and a copy.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/SecretField.tsx', 'patterns/people/maskSecret.ts', 'actions/CopyButton.tsx'],
          Component: ApiKeyTokenRevealOnce,
        },
        {
          id: 'ApiKeyTokenSecretFields',
          title: 'Secret field modes',
          note: 'Reveal and copy, copy only, or a stored hint with no controls, by what the client holds.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/SecretField.tsx', 'patterns/people/maskSecret.ts', 'actions/CopyButton.tsx'],
          Component: ApiKeyTokenSecretFields,
        },
      ],
    },
    {
      id: 'create-and-manage',
      title: 'Create and manage',
      description: 'Making a key, scoping it, replacing it and ending it.',
      specimens: [
        {
          id: 'ApiKeyTokenCreateForm',
          title: 'Create key form',
          note: 'Name, scope and expiry, with the least access preselected and the end date spelled out.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx', 'forms/ChoiceCardGroup.tsx', 'patterns/data-entry/FormActions.tsx'],
          Component: ApiKeyTokenCreateForm,
        },
        {
          id: 'ApiKeyTokenScopeChecklist',
          title: 'Scope checklist',
          note: 'Custom scopes: tick what the key may do, with a plain summary of how much that is.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/SelectAllCheckboxList.tsx'],
          Component: ApiKeyTokenScopeChecklist,
        },
        {
          id: 'ApiKeyTokenRotateSteps',
          title: 'Rotate key steps',
          note: 'Replacing a key without downtime: both keys overlap until the new one is confirmed in use.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['actions/ConfirmButton.tsx'],
          Component: ApiKeyTokenRotateSteps,
        },
        {
          id: 'ApiKeyTokenRevokeConfirm',
          title: 'Revoke confirmation',
          note: 'Ending a key that is in use: what will fail, then a typed confirmation.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['overlays/ConfirmDialog.tsx', 'patterns/people/maskSecret.ts'],
          Component: ApiKeyTokenRevokeConfirm,
        },
      ],
    },
    {
      id: 'credentials',
      title: 'Other credentials',
      description: 'Client credentials, webhook secrets, service accounts and network limits.',
      specimens: [
        {
          id: 'ApiKeyTokenClientCredentials',
          title: 'Client credentials',
          note: 'A client ID and secret pair: the ID is plain and copyable, the secret masked.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/SecretField.tsx', 'actions/CopyButton.tsx'],
          Component: ApiKeyTokenClientCredentials,
        },
        {
          id: 'ApiKeyTokenWebhookSecret',
          title: 'Webhook secret',
          note: 'The signing secret of a webhook, with the endpoint, last delivery and rotate.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/SecretField.tsx'],
          Component: ApiKeyTokenWebhookSecret,
        },
        {
          id: 'ApiKeyTokenServiceAccount',
          title: 'Service account',
          note: 'The non-human identity keys belong to: who owns it, what it can reach, how many keys it has.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: ApiKeyTokenServiceAccount,
        },
        {
          id: 'ApiKeyTokenIpAllowList',
          title: 'IP allow-list',
          note: 'Limiting where keys work from: one range per row with a label, removable in place.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ApiKeyTokenIpAllowList,
        },
      ],
    },
    {
      id: 'usage-and-limits',
      title: 'Usage and limits',
      description: 'How much each key is used, how close the project is to its limits, and what is recorded.',
      specimens: [
        {
          id: 'ApiKeyTokenUsageSparkline',
          title: 'Usage per key',
          note: 'Comparing keys at a glance: a 30-day trend and the daily volume on one line each.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/Sparkline.tsx'],
          Component: ApiKeyTokenUsageSparkline,
        },
        {
          id: 'ApiKeyTokenRateLimitMeter',
          title: 'Rate-limit meter',
          note: 'Requests against the per-minute limit, with the throttle zone marked, above the daily quota.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/LinearGauge.tsx', 'feedback/LabelledProgress.tsx'],
          Component: ApiKeyTokenRateLimitMeter,
        },
        {
          id: 'ApiKeyTokenAuditNote',
          title: 'Audit note',
          note: 'Under a key or a form: who last changed it, and that key changes are logged.',
          origin: 'custom',
          Component: ApiKeyTokenAuditNote,
        },
        {
          id: 'ApiKeyTokenExpiringNotice',
          title: 'Expiring keys notice',
          note: 'At the top of the keys page when something stops working soon.',
          origin: 'custom',
          uses: ['patterns/people/expiryState.ts'],
          Component: ApiKeyTokenExpiringNotice,
        },
        {
          id: 'ApiKeyTokenEmptyState',
          title: 'Empty state',
          note: 'Before the first key: what keys are for and the action that creates one.',
          origin: 'custom',
          Component: ApiKeyTokenEmptyState,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Full blocks',
      description: 'The key list, the clean-up and the detail view.',
      specimens: [
        {
          id: 'ApiKeyTokenTable',
          title: 'Token table',
          note: 'Every key in the project: owner, masked value, scope, age, last use and status, with row actions.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/people/ExpiryBadge.tsx', 'patterns/people/expiryState.ts', 'patterns/people/maskSecret.ts', 'data/RowActionsMenu.tsx'],
          Component: ApiKeyTokenTable,
        },
        {
          id: 'ApiKeyTokenSnippet',
          title: 'Usage snippet',
          note: 'After creating a key: a command that reads it from the environment, never with the key pasted in.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['actions/CopyButton.tsx'],
          Component: ApiKeyTokenSnippet,
        },
        {
          id: 'ApiKeyTokenUnusedKeys',
          title: 'Unused keys review',
          note: 'Periodic clean-up: keys with no recent requests, each with a two-step revoke.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/ExpiryBadge.tsx', 'actions/ConfirmButton.tsx'],
          Component: ApiKeyTokenUnusedKeys,
        },
        {
          id: 'ApiKeyTokenLimitReached',
          title: 'Key limit reached',
          note: 'Creation is blocked by a quota: the count, the disabled action and what frees a slot.',
          origin: 'custom',
          uses: ['feedback/LabelledProgress.tsx'],
          Component: ApiKeyTokenLimitReached,
        },
        {
          id: 'ApiKeyTokenDetail',
          title: 'Key detail',
          note: 'One key in full: status and actions, properties, and 30 days of usage.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: [
            'patterns/people/SecretField.tsx',
            'patterns/people/ExpiryBadge.tsx',
            'display/MetadataList.tsx',
            'industrial/Sparkline.tsx',
          ],
          Component: ApiKeyTokenDetail,
        },
      ],
    },
  ],
});
