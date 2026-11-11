import { Alert, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Badge } from '@cognite/aura/components/badge';
import {
  Banner,
  BannerAction,
  BannerActions,
  BannerIcon,
  BannerTitle,
} from '@cognite/aura/components/banner';
import { Button } from '@cognite/aura/components/button';
import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@cognite/aura/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { Loader } from '@cognite/aura/components/loader';
import { Separator } from '@cognite/aura/components/separator';
import {
  IconBuildingFactory2,
  IconChevronDown,
  IconClock,
  IconDeviceDesktop,
  IconDeviceLaptop,
  IconDeviceMobile,
  IconInfoCircleFilled,
  IconKey,
  IconLock,
  IconLogout,
  IconMailCheck,
  IconShieldLock,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';

import { AsyncButton } from '../../../library/actions/AsyncButton';
import { ConfirmButton } from '../../../library/actions/ConfirmButton';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { ChoiceCardGroup } from '../../../library/forms/ChoiceCardGroup';
import { FormField } from '../../../library/forms/FormField';
import { PasswordInput } from '../../../library/forms/PasswordInput';
import { AuthCard } from '../../../library/patterns/people/AuthCard';
import { OneTimeCodeInput } from '../../../library/patterns/people/OneTimeCodeInput';
import { PasswordStrength } from '../../../library/patterns/people/PasswordStrength';
import { scorePassword } from '../../../library/patterns/people/passwordStrengthLogic';
import { RecoveryCodes } from '../../../library/patterns/people/RecoveryCodes';
import { PEOPLE } from '../../data/plant';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, formatAgo, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './authentication.tsx?raw';

const INGRID = PEOPLE[0];
const INGRID_EMAIL = 'ingrid.haugen@nordkapp.example';

/** Width of one authentication step. Every step in a flow uses the same one. */
const FRAME = 'w-full max-w-sm';

const LINK =
  'rounded-sm text-sm font-medium text-link-foreground underline-offset-4 outline-none hover:underline focus-visible:shadow-focus-ring';

const PROJECTS = [
  { value: 'nordkapp-prod', label: 'Nordkapp production', description: 'Live plant data. Last opened today.', tag: 'Last used' },
  { value: 'nordkapp-test', label: 'Nordkapp test', description: 'Copy of production, refreshed nightly.' },
  {
    value: 'hammerfest-prod',
    label: 'Hammerfest LNG production',
    disabledReason: 'You have not been added to this project.',
  },
];

/** Obviously fake single-use codes. Real ones come from the identity provider. */
const RECOVERY_CODES = [
  'DEMO-0001',
  'DEMO-0002',
  'DEMO-0003',
  'DEMO-0004',
  'DEMO-0005',
  'DEMO-0006',
  'DEMO-0007',
  'DEMO-0008',
];

type Session = {
  id: string;
  device: string;
  kind: 'desktop' | 'laptop' | 'mobile';
  location: string;
  lastActiveAt: number;
  current?: boolean;
};

const SESSIONS: readonly Session[] = [
  { id: 's1', device: 'Control room workstation 3', kind: 'desktop', location: 'Nordkapp, Norway', lastActiveAt: REFERENCE_NOW, current: true },
  { id: 's2', device: 'Laptop, Chrome on Windows', kind: 'laptop', location: 'Hammerfest, Norway', lastActiveAt: REFERENCE_NOW - 3 * HOUR },
  { id: 's3', device: 'Phone, Safari on iOS', kind: 'mobile', location: 'Tromsø, Norway', lastActiveAt: REFERENCE_NOW - 2 * DAY },
  { id: 's4', device: 'Tablet, field app', kind: 'mobile', location: 'Nordkapp, Norway', lastActiveAt: REFERENCE_NOW - 9 * DAY },
];

const SESSION_ICONS = {
  desktop: IconDeviceDesktop,
  laptop: IconDeviceLaptop,
  mobile: IconDeviceMobile,
} as const;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const stay = (event: FormEvent | MouseEvent) => event.preventDefault();

function AuthPatternSignInCard() {
  return (
    <div className={FRAME}>
      <AuthCard
        title="Sign in to Nordkapp"
        description="Use the account your administrator set up for you."
        footer={
          <>
            No account?{' '}
            <a href="#request-access" className={LINK} onClick={stay}>
              Request access
            </a>
          </>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={stay}>
          <FormField label="Email address">
            {(control) => <Input {...control} type="email" autoComplete="username" defaultValue={INGRID_EMAIL} />}
          </FormField>
          <FormField
            label="Password"
            helper={
              <a href="#forgot" className={LINK} onClick={stay}>
                Forgot password?
              </a>
            }
          >
            {(control) => <PasswordInput {...control} autoComplete="current-password" />}
          </FormField>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}

function AuthPatternSsoOnly() {
  return (
    <div className={FRAME}>
      <AuthCard
        icon={<IconBuildingFactory2 />}
        title="Sign in to Nordkapp"
        description="Your organisation signs in through its identity provider."
        footer="Trouble signing in? Contact your administrator."
      >
        <Button className="w-full">
          <IconKey /> Continue with single sign-on
        </Button>
        <p className="text-xs text-muted-foreground">You will be sent to sso.nordkapp.example and brought back here.</p>
      </AuthCard>
    </div>
  );
}

function AuthPatternSsoWithEmail() {
  return (
    <div className={FRAME}>
      <AuthCard title="Sign in to Nordkapp" description="Single sign-on is the quickest way in.">
        <Button className="w-full">
          <IconKey /> Continue with single sign-on
        </Button>
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>
        <form className="flex flex-col gap-4" onSubmit={stay}>
          <FormField label="Email address" helper="We send a sign-in link. No password needed.">
            {(control) => <Input {...control} type="email" autoComplete="username" placeholder="name@nordkapp.example" />}
          </FormField>
          <Button type="submit" variant="secondary" className="w-full">
            Email me a sign-in link
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}

function AuthPatternProjectPicker() {
  const [project, setProject] = useState('nordkapp-prod');

  return (
    <div className={FRAME}>
      <AuthCard title="Choose a project" description={`Signed in as ${INGRID_EMAIL}.`}>
        <ChoiceCardGroup label="Projects you can open" options={PROJECTS} value={project} onValueChange={setProject} />
        <Button className="w-full">Open project</Button>
      </AuthCard>
    </div>
  );
}

function AuthPatternSignUp() {
  const [password, setPassword] = useState('');

  return (
    <div className={FRAME}>
      <AuthCard
        title="Create your account"
        description="Liv Wold invited you to Nordkapp production as an editor."
        footer={
          <>
            Already have an account?{' '}
            <a href="#sign-in" className={LINK} onClick={stay}>
              Sign in
            </a>
          </>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={stay}>
          <FormField label="Full name">{(control) => <Input {...control} autoComplete="name" defaultValue="Nora Dahl" />}</FormField>
          <FormField label="Work email" helper="Set by the invitation. Ask the sender to change it.">
            {(control) => <Input {...control} type="email" readOnly defaultValue="nora.dahl@nordkapp.example" />}
          </FormField>
          <FormField label="Password">
            {(control) => (
              <>
                <PasswordInput
                  {...control}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <PasswordStrength password={password} showRules={false} />
              </>
            )}
          </FormField>
          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}

function AuthPatternMagicLinkSent() {
  const [resent, setResent] = useState(false);

  return (
    <div className={FRAME}>
      <AuthCard
        icon={<IconMailCheck />}
        title="Check your email"
        description={
          <>
            We sent a sign-in link to <span className="font-medium text-base-foreground">{INGRID_EMAIL}</span>. It
            works once and expires in 15 minutes.
          </>
        }
        footer={
          <a href="#different-address" className={LINK} onClick={stay}>
            Use a different address
          </a>
        }
      >
        <AsyncButton
          variant="secondary"
          className="w-full"
          pendingLabel="Sending…"
          onAction={() => wait(1200).then(() => setResent(true))}
        >
          Send the link again
        </AsyncButton>
        <div aria-live="polite">
          {resent ? (
            <HelperText isSuccess>A new link is on its way. The earlier one no longer works.</HelperText>
          ) : (
            <HelperText>Nothing after a few minutes? Check your spam folder first.</HelperText>
          )}
        </div>
      </AuthCard>
    </div>
  );
}

function AuthPatternForgotPassword() {
  return (
    <div className={FRAME}>
      <AuthCard
        title="Reset your password"
        description="Enter the address you sign in with. If it matches an account, we send a reset link."
        footer={
          <a href="#sign-in" className={LINK} onClick={stay}>
            Back to sign in
          </a>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={stay}>
          <FormField label="Email address">
            {(control) => <Input {...control} type="email" autoComplete="username" placeholder="name@nordkapp.example" />}
          </FormField>
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}

function AuthPatternResetPassword() {
  const [password, setPassword] = useState('Compressor9101');
  const [confirmation, setConfirmation] = useState('');
  const { valid } = scorePassword(password);
  const mismatch = confirmation !== '' && confirmation !== password;

  return (
    <div className={FRAME}>
      <AuthCard title="Choose a new password" description={`For ${INGRID_EMAIL}. Other sessions are signed out when you save.`}>
        <form className="flex flex-col gap-4" onSubmit={stay}>
          <FormField label="New password">
            {(control) => (
              <>
                <PasswordInput
                  {...control}
                  autoComplete="new-password"
                  aria-describedby="auth-pattern-reset-rules"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <PasswordStrength id="auth-pattern-reset-rules" password={password} />
              </>
            )}
          </FormField>
          <FormField label="Repeat new password" error={mismatch ? 'The two passwords do not match.' : undefined}>
            {(control) => (
              <PasswordInput
                {...control}
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            )}
          </FormField>
          <Button type="submit" className="w-full" disabled={!valid || mismatch || confirmation === ''}>
            Save new password
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}

function AuthPatternTwoFactorCode() {
  const [code, setCode] = useState('428');

  return (
    <div className={FRAME}>
      <AuthCard
        icon={<IconShieldLock />}
        title="Enter your verification code"
        description="Open your authenticator app and enter the six-digit code for Nordkapp."
        footer={
          <a href="#recovery-code" className={LINK} onClick={stay}>
            Use a recovery code instead
          </a>
        }
      >
        <OneTimeCodeInput label="Verification code" value={code} onValueChange={setCode} groupSize={3} />
        <Button className="w-full" disabled={code.length < 6}>
          Verify and sign in
        </Button>
        {code.length < 6 ? (
          <p className="text-xs tabular-nums text-muted-foreground">{6 - code.length} more digits to go.</p>
        ) : null}
      </AuthCard>
    </div>
  );
}

function AuthPatternTwoFactorError() {
  const [code, setCode] = useState('428913');
  const [checked, setChecked] = useState(true);

  const change = (next: string) => {
    setCode(next);
    setChecked(false);
  };

  return (
    <div className={FRAME}>
      <AuthCard
        icon={<IconShieldLock />}
        title="Enter your verification code"
        description="Open your authenticator app and enter the six-digit code for Nordkapp."
      >
        <div className="flex flex-col">
          <OneTimeCodeInput
            label="Verification code"
            value={code}
            onValueChange={change}
            groupSize={3}
            invalid={checked}
            aria-describedby="auth-pattern-code-error"
          />
          <div id="auth-pattern-code-error" aria-live="polite">
            {checked ? (
              <HelperText isError>That code did not match. Codes change every 30 seconds. 2 attempts left.</HelperText>
            ) : null}
          </div>
        </div>
        <Button className="w-full" disabled={code.length < 6} onClick={() => setChecked(true)}>
          Verify and sign in
        </Button>
      </AuthCard>
    </div>
  );
}

function AuthPatternRecoveryCodes() {
  const [saved, setSaved] = useState(false);

  return (
    <div className={FRAME}>
      <AuthCard
        title="Save your recovery codes"
        description="Each code signs you in once if you lose your authenticator. They are not shown again."
      >
        <RecoveryCodes codes={RECOVERY_CODES} onDownload={() => undefined} />
        <CheckboxItem>
          <CheckboxItemControl checked={saved} onCheckedChange={(checked) => setSaved(checked)} />
          <CheckboxItemLabel>I have stored these codes somewhere safe</CheckboxItemLabel>
        </CheckboxItem>
        <Button className="w-full" disabled={!saved}>
          Finish setup
        </Button>
      </AuthCard>
    </div>
  );
}

function AuthPatternConsent() {
  const [terms, setTerms] = useState(false);
  const [monitoring, setMonitoring] = useState(false);

  return (
    <div className={FRAME}>
      <AuthCard title="Before you continue" description="Nordkapp production holds operational data. Access comes with two conditions.">
        <div className="flex flex-col gap-3">
          <CheckboxItem>
            <CheckboxItemControl checked={terms} onCheckedChange={(checked) => setTerms(checked)} />
            <CheckboxItemLabel>
              I accept the{' '}
              <a href="#terms" className={LINK} onClick={stay}>
                terms of use
              </a>{' '}
              and the{' '}
              <a href="#privacy" className={LINK} onClick={stay}>
                privacy notice
              </a>
            </CheckboxItemLabel>
          </CheckboxItem>
          <CheckboxItem>
            <CheckboxItemControl checked={monitoring} onCheckedChange={(checked) => setMonitoring(checked)} />
            <CheckboxItemLabel>I understand that sign-ins and data exports are logged</CheckboxItemLabel>
          </CheckboxItem>
        </div>
        <div className="flex flex-col gap-2">
          <Button className="w-full" disabled={!terms || !monitoring}>
            Accept and continue
          </Button>
          <Button variant="ghost" className="w-full">
            Sign out
          </Button>
        </div>
        {!terms || !monitoring ? (
          <p className="text-xs text-muted-foreground">Tick both boxes to continue.</p>
        ) : null}
      </AuthCard>
    </div>
  );
}

function AuthPatternVerifyEmailBanner() {
  return (
    <div className="w-full">
      <Banner variant="warning" inset>
        <BannerIcon icon={IconInfoCircleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">
            Verify {INGRID_EMAIL} within 6 days to keep access to Nordkapp production
          </span>
        </BannerTitle>
        <BannerActions>
          <BannerAction>Send verification email</BannerAction>
        </BannerActions>
      </Banner>
    </div>
  );
}

function AuthPatternWrongCredentials() {
  return (
    <div className={FRAME}>
      <AuthCard title="Sign in to Nordkapp">
        <Alert variant="error">
          <AlertTitle>Email or password is incorrect</AlertTitle>
          <AlertDescription>Check both and try again. 3 attempts left before the account is locked.</AlertDescription>
        </Alert>
        <form className="flex flex-col gap-4" onSubmit={stay}>
          <FormField label="Email address">
            {(control) => <Input {...control} type="email" autoComplete="username" defaultValue={INGRID_EMAIL} />}
          </FormField>
          <FormField
            label="Password"
            helper={
              <a href="#forgot" className={LINK} onClick={stay}>
                Forgot password?
              </a>
            }
          >
            {(control) => <PasswordInput {...control} autoComplete="current-password" />}
          </FormField>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}

function AuthPatternNoProjectAccess() {
  return (
    <div className={FRAME}>
      <AuthCard
        icon={<IconLock />}
        title="You do not have access to this project"
        description={
          <>
            <span className="font-medium text-base-foreground">{INGRID_EMAIL}</span> is signed in, but has not been
            added to Hammerfest LNG production.
          </>
        }
        footer={
          <a href="#switch-account" className={LINK} onClick={stay}>
            Sign in with a different account
          </a>
        }
      >
        <div className="flex flex-col gap-2">
          <Button className="w-full">Request access</Button>
          <Button variant="secondary" className="w-full">
            Open Nordkapp production
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Requests go to the project owner, Liv Wold.</p>
      </AuthCard>
    </div>
  );
}

function AuthPatternAccountLocked() {
  return (
    <div className={FRAME}>
      <AuthCard
        icon={<IconLock />}
        title="Account locked"
        description="Five sign-in attempts failed, so this account is locked for 30 minutes."
        footer="Not you? Tell your administrator. The attempts came from Tromsø, Norway."
      >
        <div className="flex items-center gap-2 rounded-lg bg-muted-background px-3 py-2 text-sm text-base-foreground">
          <IconClock aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span>
            Try again at <span className="font-medium tabular-nums">{formatTime(REFERENCE_NOW + 30 * MINUTE)}</span>
          </span>
        </div>
        <Button variant="secondary" className="w-full">
          Reset password to unlock now
        </Button>
      </AuthCard>
    </div>
  );
}

function AuthPatternSessionExpired() {
  return (
    <div className={FRAME}>
      <AuthCard
        icon={<IconClock />}
        title="Your session has expired"
        description="You were signed out after 8 hours. Sign in again to pick up where you left off; the shift log draft is kept."
      >
        <div className="flex items-center gap-3">
          <PersonAvatar name={INGRID.name} colorKey={INGRID.id} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-base-foreground">{INGRID.name}</p>
            <p className="truncate text-xs text-muted-foreground">{INGRID_EMAIL}</p>
          </div>
        </div>
        <form className="flex flex-col gap-4" onSubmit={stay}>
          <FormField label="Password">{(control) => <PasswordInput {...control} autoComplete="current-password" />}</FormField>
          <Button type="submit" className="w-full">
            Sign in again
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}

function AuthPatternAccountChip() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" aria-label={`Signed in as ${INGRID.name}. Open account menu`}>
            <PersonAvatar name={INGRID.name} colorKey={INGRID.id} sizes="xxsm" />
            {INGRID.name}
            <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuHeader>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-base-foreground">{INGRID.name}</p>
            <p className="truncate text-xs text-muted-foreground">{INGRID_EMAIL}</p>
          </div>
        </DropdownMenuHeader>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Switch project</DropdownMenuItem>
        <DropdownMenuItem>Sign in with a different account</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AuthPatternSignedInAsNotice() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex items-center gap-3 rounded-lg bg-muted-background p-3">
        <PersonAvatar name={INGRID.name} colorKey={INGRID.id} sizes="xsm" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="truncate text-sm font-medium text-base-foreground">{INGRID_EMAIL}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Not you?{' '}
        <a href="#switch-account" className={LINK} onClick={stay}>
          Switch account
        </a>
      </p>
    </div>
  );
}

function AuthPatternSignOutConfirm() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline">
            <IconLogout /> Sign out
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign out of Nordkapp?</DialogTitle>
          <DialogDescription>
            Your shift log has unsaved changes. They are kept on this workstation for 24 hours, then discarded.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Stay signed in</Button>} />
          <DialogClose render={<Button>Sign out</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AuthPatternSsoRedirecting() {
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-3 text-center" role="status">
      <Loader size={24} />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-base-foreground">Taking you to your identity provider</p>
        <p className="text-xs text-muted-foreground">sso.nordkapp.example</p>
      </div>
      <Button variant="ghost" size="sm">
        Cancel sign-in
      </Button>
    </div>
  );
}

function AuthPatternSessionList() {
  const [revoked, setRevoked] = useState<readonly string[]>([]);
  const sessions = SESSIONS.filter((session) => !revoked.includes(session.id));

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-base-foreground">Where you are signed in</h3>
          <p className="text-xs tabular-nums text-muted-foreground">{sessions.length} active sessions</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={sessions.length <= 1}
          onClick={() => setRevoked(SESSIONS.filter((session) => !session.current).map((session) => session.id))}
        >
          Sign out everywhere else
        </Button>
      </div>
      <ul className="flex flex-col divide-y divide-default">
        {sessions.map((session) => {
          const Icon = SESSION_ICONS[session.kind];
          return (
            <li key={session.id} className="flex min-h-14 items-center gap-3 py-2">
              <Icon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium text-base-foreground">
                  <span className="truncate">{session.device}</span>
                  {session.current ? <Badge variant="success">This device</Badge> : null}
                </p>
                <p className="truncate text-xs tabular-nums text-muted-foreground">
                  {session.location} · {session.current ? 'Active now' : `Last active ${formatAgo(session.lastActiveAt)}`}
                </p>
              </div>
              {session.current ? null : (
                <ConfirmButton
                  size="sm"
                  confirmLabel="Confirm sign-out"
                  onConfirm={() => setRevoked((current) => [...current, session.id])}
                >
                  Sign out
                </ConfirmButton>
              )}
            </li>
          );
        })}
      </ul>
      {revoked.length > 0 ? (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setRevoked([])}>
          Reset example
        </Button>
      ) : null}
    </div>
  );
}

function AuthPatternFullScreen() {
  return (
    <div className="grid h-144 w-full overflow-hidden rounded-xl border border-default md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-muted-background p-8 md:flex">
        <div className="flex items-center gap-2 text-sm font-medium text-base-foreground">
          <IconBuildingFactory2 aria-hidden="true" className="size-5" />
          Nordkapp operations
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-2xl font-semibold tracking-tight text-base-foreground">
            One place for the plant: live data, alarms and work orders.
          </p>
          <p className="text-sm text-muted-foreground">Norwegian Sea · 4 sites · 1,284 time series</p>
        </div>
        <p className="text-xs text-muted-foreground">Access is logged. Use only on equipment approved for plant data.</p>
      </div>
      <div className="flex items-center justify-center bg-base-background p-6">
        <div className={FRAME}>
          <AuthCard as="h1" title="Sign in" description="Use your Nordkapp account.">
            <Button variant="secondary" className="w-full">
              <IconKey /> Continue with single sign-on
            </Button>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>
            <form className="flex flex-col gap-4" onSubmit={stay}>
              <FormField label="Email address">
                {(control) => <Input {...control} type="email" autoComplete="username" defaultValue={INGRID_EMAIL} />}
              </FormField>
              <FormField
                label="Password"
                helper={
                  <a href="#forgot" className={LINK} onClick={stay}>
                    Forgot password?
                  </a>
                }
              >
                {(control) => <PasswordInput {...control} autoComplete="current-password" />}
              </FormField>
              <CheckboxItem>
                <CheckboxItemControl />
                <CheckboxItemLabel>Keep me signed in on this workstation</CheckboxItemLabel>
              </CheckboxItem>
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>
          </AuthCard>
        </div>
      </div>
    </div>
  );
}

export default definePage({
  id: 'authentication',
  title: 'Authentication',
  summary:
    'The steps between arriving and working: signing in, proving who you are, recovering access, and the notices that explain why you are not in yet. Every step shares one frame, one width and one primary action.',
  guidance: {
    use: [
      'One frame for every step, so a flow reads as one place.',
      'One primary action per step; the other route is a link in the footer.',
      'Errors that say what happened, what is left and how to recover.',
      'The account name on every step after the first, so people know who they are signing in as.',
    ],
    avoid: [
      'Saying which of email or password was wrong.',
      'Disabling the submit button without showing what is missing.',
      'Showing recovery codes or new secrets more than once.',
      'A sign-out that silently discards unsaved work.',
    ],
  },
  source,
  sections: [
    {
      id: 'sign-in',
      title: 'Sign in',
      description: 'The first step, by how the organisation authenticates.',
      specimens: [
        {
          id: 'AuthPatternSignInCard',
          title: 'Email and password',
          note: 'Accounts managed in the product itself, with recovery one click away.',
          origin: 'custom',
          size: 'md',
          uses: ['patterns/people/AuthCard.tsx', 'forms/FormField.tsx', 'forms/PasswordInput.tsx'],
          Component: AuthPatternSignInCard,
        },
        {
          id: 'AuthPatternSsoOnly',
          title: 'Single sign-on only',
          note: 'The organisation enforces its identity provider, so there is nothing to type here.',
          origin: 'custom',
          size: 'md',
          uses: ['patterns/people/AuthCard.tsx'],
          Component: AuthPatternSsoOnly,
        },
        {
          id: 'AuthPatternSsoWithEmail',
          title: 'Single sign-on or email link',
          note: 'Most people use single sign-on; contractors without it get a link by email.',
          origin: 'custom',
          size: 'md',
          uses: ['patterns/people/AuthCard.tsx', 'forms/FormField.tsx'],
          Component: AuthPatternSsoWithEmail,
        },
        {
          id: 'AuthPatternProjectPicker',
          title: 'Project picker',
          note: 'After sign-in, when the account can open more than one project.',
          origin: 'custom',
          size: 'md',
          uses: ['patterns/people/AuthCard.tsx', 'forms/ChoiceCardGroup.tsx'],
          Component: AuthPatternProjectPicker,
        },
      ],
    },
    {
      id: 'sign-up-and-recovery',
      title: 'Sign-up and recovery',
      description: 'Creating an account, and getting back in without the password.',
      specimens: [
        {
          id: 'AuthPatternSignUp',
          title: 'Sign-up from an invitation',
          note: 'A new person accepts an invitation; the email is fixed and the meter guides the password.',
          origin: 'custom',
          size: 'md',
          uses: [
            'patterns/people/AuthCard.tsx',
            'patterns/people/PasswordStrength.tsx',
            'patterns/people/passwordStrengthLogic.ts',
            'forms/FormField.tsx',
            'forms/PasswordInput.tsx',
          ],
          Component: AuthPatternSignUp,
        },
        {
          id: 'AuthPatternMagicLinkSent',
          title: 'Sign-in link sent',
          note: 'The waiting state after requesting a link: where it went, how long it lasts, how to resend.',
          origin: 'custom',
          size: 'md',
          uses: ['patterns/people/AuthCard.tsx', 'actions/AsyncButton.tsx'],
          Component: AuthPatternMagicLinkSent,
        },
        {
          id: 'AuthPatternForgotPassword',
          title: 'Forgot password',
          note: 'Asks for the address only, and never confirms whether an account exists.',
          origin: 'custom',
          size: 'md',
          uses: ['patterns/people/AuthCard.tsx', 'forms/FormField.tsx'],
          Component: AuthPatternForgotPassword,
        },
        {
          id: 'AuthPatternResetPassword',
          title: 'Reset with strength rules',
          note: 'Choosing a new password: each rule ticks off as it is met, and the button unlocks with the last one.',
          origin: 'custom',
          size: 'md',
          uses: [
            'patterns/people/AuthCard.tsx',
            'patterns/people/PasswordStrength.tsx',
            'patterns/people/passwordStrengthLogic.ts',
            'forms/FormField.tsx',
            'forms/PasswordInput.tsx',
          ],
          Component: AuthPatternResetPassword,
        },
      ],
    },
    {
      id: 'verification',
      title: 'Verification',
      description: 'Second factors, recovery codes and the conditions attached to access.',
      specimens: [
        {
          id: 'AuthPatternTwoFactorCode',
          title: 'Two-factor code',
          note: 'A six-digit authenticator code. Type, paste or let the browser fill it.',
          origin: 'custom',
          size: 'md',
          uses: ['patterns/people/AuthCard.tsx', 'patterns/people/OneTimeCodeInput.tsx'],
          Component: AuthPatternTwoFactorCode,
        },
        {
          id: 'AuthPatternTwoFactorError',
          title: 'Two-factor code rejected',
          note: 'A wrong code: every box is marked, the reason and remaining attempts are stated, and typing clears it.',
          origin: 'custom',
          size: 'md',
          uses: ['patterns/people/AuthCard.tsx', 'patterns/people/OneTimeCodeInput.tsx'],
          Component: AuthPatternTwoFactorError,
        },
        {
          id: 'AuthPatternRecoveryCodes',
          title: 'Recovery codes',
          note: 'The one time recovery codes are shown: copy or download, then confirm they are stored.',
          origin: 'custom',
          size: 'md',
          uses: ['patterns/people/AuthCard.tsx', 'patterns/people/RecoveryCodes.tsx', 'actions/CopyButton.tsx'],
          Component: AuthPatternRecoveryCodes,
        },
        {
          id: 'AuthPatternConsent',
          title: 'Terms acknowledgement',
          note: 'Access depends on accepting conditions; each one is its own checkbox, and declining signs out.',
          origin: 'custom',
          size: 'md',
          uses: ['patterns/people/AuthCard.tsx'],
          Component: AuthPatternConsent,
        },
        {
          id: 'AuthPatternVerifyEmailBanner',
          title: 'Verify email banner',
          note: 'The account works but the address is unconfirmed: a page-level reminder with the deadline and the fix.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: AuthPatternVerifyEmailBanner,
        },
      ],
    },
    {
      id: 'errors-and-blocks',
      title: 'Errors and blocks',
      description: 'Why someone is not in yet, and the way forward from each.',
      specimens: [
        {
          id: 'AuthPatternWrongCredentials',
          title: 'Wrong credentials',
          note: 'A failed sign-in: one message for both fields, the email kept, and the attempts left.',
          origin: 'custom',
          size: 'md',
          uses: ['patterns/people/AuthCard.tsx', 'forms/FormField.tsx', 'forms/PasswordInput.tsx'],
          Component: AuthPatternWrongCredentials,
        },
        {
          id: 'AuthPatternNoProjectAccess',
          title: 'No access to project',
          note: 'Sign-in worked but the project is closed to this account: name both, and offer the request.',
          origin: 'custom',
          size: 'md',
          uses: ['patterns/people/AuthCard.tsx'],
          Component: AuthPatternNoProjectAccess,
        },
        {
          id: 'AuthPatternAccountLocked',
          title: 'Account locked',
          note: 'Too many failed attempts: when it unlocks by itself, and how to unlock it sooner.',
          origin: 'custom',
          size: 'md',
          uses: ['patterns/people/AuthCard.tsx'],
          Component: AuthPatternAccountLocked,
        },
        {
          id: 'AuthPatternSessionExpired',
          title: 'Session expired',
          note: 'A timed-out session inside the app: keep the person and their work, ask only for the password.',
          origin: 'custom',
          size: 'md',
          uses: ['patterns/people/AuthCard.tsx', 'display/PersonAvatar.tsx', 'forms/FormField.tsx', 'forms/PasswordInput.tsx'],
          Component: AuthPatternSessionExpired,
        },
      ],
    },
    {
      id: 'signed-in',
      title: 'Signed in',
      description: 'Who is signed in, where, and how to leave.',
      specimens: [
        {
          id: 'AuthPatternAccountChip',
          title: 'Signed-in account chip',
          note: 'In a header or footer, to show the current account and reach switch and sign-out.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          Component: AuthPatternAccountChip,
        },
        {
          id: 'AuthPatternSignedInAsNotice',
          title: 'Signed in as',
          note: 'On a consent or access-request step, to confirm which account is about to act.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          Component: AuthPatternSignedInAsNotice,
        },
        {
          id: 'AuthPatternSignOutConfirm',
          title: 'Sign-out confirmation',
          note: 'Only when signing out would lose something; otherwise sign out without asking.',
          origin: 'custom',
          Component: AuthPatternSignOutConfirm,
        },
        {
          id: 'AuthPatternSsoRedirecting',
          title: 'Redirecting to provider',
          note: 'The moment between pressing single sign-on and leaving the page, with a way back.',
          origin: 'custom',
          Component: AuthPatternSsoRedirecting,
        },
        {
          id: 'AuthPatternSessionList',
          title: 'Sessions with revoke',
          note: 'Security settings: every device signed in to the account, with a two-step sign-out per row.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['actions/ConfirmButton.tsx'],
          Component: AuthPatternSessionList,
        },
        {
          id: 'AuthPatternFullScreen',
          title: 'Sign-in screen',
          note: 'The whole page: context about the product on one side, the sign-in step on the other.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/people/AuthCard.tsx', 'forms/FormField.tsx', 'forms/PasswordInput.tsx'],
          Component: AuthPatternFullScreen,
        },
      ],
    },
  ],
});
