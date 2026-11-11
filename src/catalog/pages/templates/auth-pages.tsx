import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import { Separator } from '@cognite/aura/components/separator';
import {
  IconArrowLeft,
  IconBuildingFactory2,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconKey,
  IconLock,
  IconLogout,
  IconMailCheck,
  IconShieldLock,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';

import { AsyncButton } from '../../../library/actions/AsyncButton';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { ChoiceCardGroup } from '../../../library/forms/ChoiceCardGroup';
import { FormField } from '../../../library/forms/FormField';
import { PasswordInput } from '../../../library/forms/PasswordInput';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { AuthCard } from '../../../library/patterns/people/AuthCard';
import { OneTimeCodeInput } from '../../../library/patterns/people/OneTimeCodeInput';
import { PasswordStrength } from '../../../library/patterns/people/PasswordStrength';
import { RoleBadge } from '../../../library/patterns/people/RoleBadge';
import { ErrorPage } from '../../../library/patterns/states/ErrorPage';
import { PropertyList } from '../../../library/patterns/structure/PropertyList';
import { Step } from '../../../library/primitives/stepper/Step';
import { Stepper } from '../../../library/primitives/stepper/Stepper';
import { BrandMark } from '../../../library/templates-b/BrandMark';
import { CenteredPage } from '../../../library/templates-b/CenteredPage';
import { PageFrame } from '../../../library/templates-b/PageFrame';
import { SplitPage } from '../../../library/templates-b/SplitPage';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { PEOPLE, PLANT_KPIS, SITES } from '../../data/plant';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './auth-pages.tsx?raw';

const AUTH_USER = PEOPLE[0];
const AUTH_INVITER = PEOPLE[4];
const AUTH_EMAIL = 'ingrid.haugen@nordkapp.example';
const AUTH_NEW_EMAIL = 'nora.dahl@nordkapp.example';

const AUTH_LINK =
  'rounded-sm font-medium text-link-foreground underline-offset-4 outline-none hover:underline focus-visible:shadow-focus-ring';

const AUTH_EXPORT_TREND = makeValues({ seed: 31, points: 30, base: 4.3, amplitude: 0.08, noise: 0.04, drift: 0.1, decimals: 2 });

type AuthOrganisation = { id: string; name: string; region: string; projects: number; role: string; lastOpened?: string };

const AUTH_ORGANISATIONS: readonly AuthOrganisation[] = [
  { id: SITES[0].id, name: 'Nordkapp gas processing', region: SITES[0].region, projects: 2, role: 'Operator', lastOpened: 'Opened today' },
  { id: SITES[2].id, name: SITES[2].name, region: SITES[2].region, projects: 3, role: 'Viewer', lastOpened: 'Opened 4 d ago' },
  { id: SITES[1].id, name: `${SITES[1].name} field centre`, region: SITES[1].region, projects: 1, role: 'Viewer' },
  { id: SITES[3].id, name: SITES[3].name, region: SITES[3].region, projects: 1, role: 'Editor' },
];

const AUTH_SIGN_UP_STEPS = [
  { id: 'account', label: 'Your details' },
  { id: 'password', label: 'Password' },
  { id: 'workspace', label: 'Start page' },
];

const AUTH_START_PAGES = [
  { value: 'overview', label: 'Plant overview', description: 'KPIs, active alarms and the state of each area.', tag: 'Most used' },
  { value: 'alarms', label: 'Alarm list', description: 'For control room operators who work the alarm queue.' },
  { value: 'orders', label: 'Work orders', description: 'For planners and technicians.' },
];

const AUTH_OTHER_PROJECTS = [
  { id: 'nordkapp-prod', name: 'Nordkapp production', detail: 'Operator' },
  { id: 'nordkapp-test', name: 'Nordkapp test', detail: 'Editor' },
];

const authWait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const authStay = (event: FormEvent | MouseEvent) => event.preventDefault();

function AuthLegal() {
  return (
    <>
      <a href="#privacy" className={AUTH_LINK} onClick={authStay}>
        Privacy
      </a>
      <a href="#terms" className={AUTH_LINK} onClick={authStay}>
        Terms of use
      </a>
      <a href="#status" className={AUTH_LINK} onClick={authStay}>
        System status
      </a>
    </>
  );
}

function AuthHelpLink() {
  return (
    <a href="#help" className={`text-sm ${AUTH_LINK}`} onClick={authStay}>
      Get help signing in
    </a>
  );
}

/** Who is signed in, for pages that come after authentication. */
function AuthSignedInAs() {
  return (
    <span className="flex min-w-0 items-center gap-2 text-sm text-medium-foreground">
      <PersonAvatar name={AUTH_USER.name} sizes="xsm" />
      <span className="truncate">{AUTH_EMAIL}</span>
    </span>
  );
}

function AuthTemplateCenteredSignIn() {
  const [password, setPassword] = useState('');
  const [missing, setMissing] = useState(false);
  const [remember, setRemember] = useState(true);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setMissing(password.length === 0);
  };

  return (
    <PageFrame title="Sign in" address="nordkapp.example/sign-in">
      <CenteredPage header={<><BrandMark name="Nordkapp" /><AuthHelpLink /></>} footer={<AuthLegal />}>
        <AuthCard
          as="h1"
          title="Sign in to Nordkapp"
          description="Use the account your administrator set up for you."
          footer={
            <>
              No account?{' '}
              <a href="#request-access" className={AUTH_LINK} onClick={authStay}>
                Request access
              </a>
            </>
          }
        >
          <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
            <FormField label="Email address">
              {(control) => <Input {...control} type="email" autoComplete="username" defaultValue={AUTH_EMAIL} />}
            </FormField>
            <FormField label="Password" error={missing ? 'Enter your password.' : undefined}>
              {(control) => (
                <PasswordInput
                  {...control}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setMissing(false);
                  }}
                />
              )}
            </FormField>
            <div className="flex items-center justify-between gap-4">
              <CheckboxItem>
                <CheckboxItemControl checked={remember} onCheckedChange={(checked) => setRemember(checked)} />
                <CheckboxItemLabel>Keep me signed in</CheckboxItemLabel>
              </CheckboxItem>
              <a href="#forgot" className={`text-sm ${AUTH_LINK}`} onClick={authStay}>
                Forgot password?
              </a>
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </AuthCard>
      </CenteredPage>
    </PageFrame>
  );
}

function AuthSplitStatement() {
  const { gasExport } = PLANT_KPIS;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">Nordkapp gas processing plant</p>
        <p className="text-2xl font-semibold tracking-tight text-balance text-base-foreground">
          Every tag, alarm and work order in one place
        </p>
        <p className="text-sm text-medium-foreground">
          Sign in to see what the control room sees. Nothing changes in the plant until you open a shift.
        </p>
      </div>
      <KpiTile
        label="Gas export"
        value={gasExport.value}
        unit={gasExport.unit}
        decimals={2}
        delta={{ reference: gasExport.previous, goodDirection: 'up', caption: 'vs yesterday', decimals: 2 }}
        trend={{ values: AUTH_EXPORT_TREND, label: 'Gas export, last 30 days' }}
      />
      <ul className="flex flex-col gap-2 text-sm text-medium-foreground">
        {['12 400 time series, updated every second', 'Alarms and work orders linked to each asset', 'Single sign-on with your company account'].map(
          (fact) => (
            <li key={fact} className="flex items-start gap-2">
              <IconCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              {fact}
            </li>
          )
        )}
      </ul>
    </div>
  );
}

function AuthTemplateSplitScreen() {
  return (
    <ThemeScope preset="aura-dark" className="w-full">
      <PageFrame title="Sign in, split screen" address="nordkapp.example/sign-in" height="lg">
        <SplitPage
          aside={<AuthSplitStatement />}
          asideLabel="About Nordkapp"
          header={<BrandMark name="Nordkapp" />}
          footer={<AuthLegal />}
        >
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-base-foreground">Sign in</h1>
            <p className="text-sm text-muted-foreground">Welcome back to the Nordkapp operations workspace.</p>
          </div>
          <Button variant="secondary" className="w-full">
            <IconKey /> Continue with single sign-on
          </Button>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or use your password</span>
            <Separator className="flex-1" />
          </div>
          <form className="flex flex-col gap-4" onSubmit={authStay}>
            <FormField label="Email address">
              {(control) => <Input {...control} type="email" autoComplete="username" defaultValue={AUTH_EMAIL} />}
            </FormField>
            <FormField
              label="Password"
              helper={
                <a href="#forgot" className={AUTH_LINK} onClick={authStay}>
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
        </SplitPage>
      </PageFrame>
    </ThemeScope>
  );
}

function AuthTemplateSsoOnly() {
  return (
    <PageFrame title="Single sign-on" device="phone">
      <CenteredPage surface="base" footer={<AuthLegal />}>
        <div className="flex flex-col items-center gap-6 text-center">
          <BrandMark name="Nordkapp" markOnly />
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight text-base-foreground">Sign in to Nordkapp</h1>
            <p className="text-sm text-muted-foreground">Your organisation signs in through its identity provider.</p>
          </div>
          <Button className="w-full">
            <IconKey /> Continue with single sign-on
          </Button>
          <p className="text-xs text-muted-foreground">
            You will be sent to <span className="font-mono">sso.nordkapp.example</span> and brought back here.
          </p>
          <Separator />
          <p className="text-sm text-muted-foreground">
            Not part of Nordkapp?{' '}
            <a href="#other" className={AUTH_LINK} onClick={authStay}>
              Use another organisation
            </a>
          </p>
        </div>
      </CenteredPage>
    </PageFrame>
  );
}

function AuthTemplateTwoFactor() {
  const [code, setCode] = useState('');
  const [trust, setTrust] = useState(false);

  return (
    <PageFrame title="Two-factor verification" device="phone">
      <CenteredPage
        header={
          <Button variant="ghost" size="sm" className="-ml-2">
            <IconArrowLeft /> Back to sign-in
          </Button>
        }
      >
        <AuthCard
          as="h1"
          icon={<IconShieldLock />}
          title="Enter your verification code"
          description="Open your authenticator app and enter the six-digit code for Nordkapp."
          footer={
            <a href="#recovery-code" className={AUTH_LINK} onClick={authStay}>
              Use a recovery code instead
            </a>
          }
        >
          <OneTimeCodeInput label="Verification code" value={code} onValueChange={setCode} groupSize={3} />
          <CheckboxItem>
            <CheckboxItemControl checked={trust} onCheckedChange={(checked) => setTrust(checked)} />
            <CheckboxItemLabel>Trust this workstation for 30 days</CheckboxItemLabel>
          </CheckboxItem>
          <Button className="w-full" disabled={code.length < 6}>
            Verify and sign in
          </Button>
          <p className="min-h-4 text-xs tabular-nums text-muted-foreground" aria-live="polite">
            {code.length < 6 ? `${6 - code.length} more digits to go.` : 'Code complete.'}
          </p>
        </AuthCard>
      </CenteredPage>
    </PageFrame>
  );
}

function AuthTemplateOrganisationPicker() {
  const [query, setQuery] = useState('');
  const [opened, setOpened] = useState<string | null>(null);
  const matches = AUTH_ORGANISATIONS.filter((organisation) =>
    `${organisation.name} ${organisation.region}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <PageFrame title="Choose an organisation" address="nordkapp.example/organisations">
      <CenteredPage
        width="md"
        align="top"
        surface="base"
        header={
          <>
            <BrandMark name="Nordkapp" />
            <span className="flex items-center gap-3">
              <AuthSignedInAs />
              <Button variant="ghost" size="sm">
                Sign out
              </Button>
            </span>
          </>
        }
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-base-foreground">Choose an organisation</h1>
          <p className="text-sm text-muted-foreground">
            Your account belongs to {AUTH_ORGANISATIONS.length} organisations. You can switch later from the user menu.
          </p>
        </div>
        <Input
          type="search"
          aria-label="Search organisations"
          placeholder="Search by name or region"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {matches.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No organisation matches &ldquo;{query.trim()}&rdquo;. Check the spelling, or ask an administrator to add you.
          </p>
        ) : (
          <ul aria-label="Organisations" className="flex flex-col">
            {matches.map((organisation) => (
              <li key={organisation.id} className="border-b border-default last:border-b-0">
                <button
                  type="button"
                  aria-pressed={opened === organisation.id}
                  onClick={() => setOpened(organisation.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left outline-none hover:bg-base-background-hover focus-visible:shadow-focus-ring"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-default text-medium-foreground">
                    <IconBuildingFactory2 aria-hidden className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-base-foreground">{organisation.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {organisation.region} · {organisation.projects} {organisation.projects === 1 ? 'project' : 'projects'}
                      {organisation.lastOpened ? ` · ${organisation.lastOpened}` : ''}
                    </span>
                  </span>
                  <Badge variant="secondary">{organisation.role}</Badge>
                  <IconChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p role="status" className="min-h-5 text-sm text-muted-foreground">
          {opened ? `Opening ${AUTH_ORGANISATIONS.find((organisation) => organisation.id === opened)?.name ?? ''}.` : ''}
        </p>
      </CenteredPage>
    </PageFrame>
  );
}

function AuthTemplateSignUpSteps() {
  const [step, setStep] = useState(0);
  const [password, setPassword] = useState('');
  const [startPage, setStartPage] = useState('overview');
  const last = step === AUTH_SIGN_UP_STEPS.length - 1;

  return (
    <PageFrame title="Sign up, multi-step" address="nordkapp.example/sign-up">
      <CenteredPage
        width="lg"
        align="top"
        header={
          <>
            <BrandMark name="Nordkapp" />
            <span className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <a href="#sign-in" className={AUTH_LINK} onClick={authStay}>
                Sign in
              </a>
            </span>
          </>
        }
      >
        <Stepper label="Create your account" current={step} onStepSelect={setStep}>
          {AUTH_SIGN_UP_STEPS.map((item) => (
            <Step key={item.id} label={item.label} />
          ))}
        </Stepper>
        <section className="flex flex-col gap-6 rounded-xl border border-default bg-base-background p-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs tabular-nums text-muted-foreground">
              Step {step + 1} of {AUTH_SIGN_UP_STEPS.length}
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-base-foreground">
              {step === 0 ? 'Tell us who you are' : step === 1 ? 'Choose a password' : 'Pick where you start'}
            </h1>
          </div>
          {step === 0 ? (
            <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
              <FormField label="Full name">{(control) => <Input {...control} autoComplete="name" defaultValue="Nora Dahl" />}</FormField>
              <FormField label="Job title" optional>
                {(control) => <Input {...control} autoComplete="organization-title" defaultValue="Process engineer" />}
              </FormField>
              <div className="@2xl:col-span-2">
                <FormField label="Work email" helper="Must be an address your organisation has approved.">
                  {(control) => <Input {...control} type="email" autoComplete="email" defaultValue={AUTH_NEW_EMAIL} />}
                </FormField>
              </div>
            </div>
          ) : null}
          {step === 1 ? (
            <FormField label="Password">
              {(control) => (
                <>
                  <PasswordInput
                    {...control}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <PasswordStrength password={password} />
                </>
              )}
            </FormField>
          ) : null}
          {step === 2 ? (
            <ChoiceCardGroup label="Start page" options={AUTH_START_PAGES} value={startPage} onValueChange={setStartPage} />
          ) : null}
          <div className="flex items-center justify-between gap-4">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
              Back
            </Button>
            {last ? (
              <Button onClick={() => setStep(0)}>Create account</Button>
            ) : (
              <Button onClick={() => setStep(step + 1)}>Continue</Button>
            )}
          </div>
        </section>
      </CenteredPage>
    </PageFrame>
  );
}

function AuthTemplateInvitation() {
  const [accepted, setAccepted] = useState(false);

  return (
    <PageFrame title="Accept invitation" address="nordkapp.example/invitations/accept" height="lg">
      <SplitPage
        asideSide="left"
        asideShare="third"
        asideLabel="About the invitation"
        aside={
          <>
            <BrandMark name="Nordkapp" />
            <div className="flex items-center gap-3">
              <PersonAvatar name={AUTH_INVITER.name} />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-base-foreground">{AUTH_INVITER.name}</span>
                <span className="truncate text-xs text-muted-foreground">{AUTH_INVITER.role}</span>
              </div>
            </div>
            <PropertyList
              layout="stacked"
              items={[
                { label: 'Project', value: 'Nordkapp production' },
                { label: 'Your role', value: <RoleBadge role="editor" /> },
                { label: 'Invited', value: '10 Mar 2026' },
                { label: 'Expires', value: '24 Mar 2026' },
              ]}
            />
          </>
        }
        footer={<AuthLegal />}
      >
        {accepted ? (
          <div className="flex flex-col gap-4" role="status">
            <span className="flex size-10 items-center justify-center rounded-lg border border-default text-medium-foreground">
              <IconMailCheck aria-hidden className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight text-base-foreground">You have joined Nordkapp production</h1>
              <p className="text-sm text-muted-foreground">{AUTH_INVITER.name} has been told. Your role is editor.</p>
            </div>
            <div className="flex gap-2">
              <Button>Open project</Button>
              <Button variant="ghost" onClick={() => setAccepted(false)}>
                Reset example
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight text-base-foreground">
                {AUTH_INVITER.name} invited you to Nordkapp production
              </h1>
              <p className="text-sm text-muted-foreground">Create a password to accept. The email address comes from the invitation.</p>
            </div>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                setAccepted(true);
              }}
            >
              <FormField label="Work email" helper="Ask the sender to change it if it is wrong.">
                {(control) => <Input {...control} type="email" readOnly defaultValue={AUTH_NEW_EMAIL} />}
              </FormField>
              <FormField label="Full name">{(control) => <Input {...control} autoComplete="name" defaultValue="Nora Dahl" />}</FormField>
              <FormField label="Password">{(control) => <PasswordInput {...control} autoComplete="new-password" />}</FormField>
              <div className="flex items-center gap-2">
                <Button type="submit">Accept invitation</Button>
                <Button type="button" variant="ghost">
                  Decline
                </Button>
              </div>
            </form>
          </>
        )}
      </SplitPage>
    </PageFrame>
  );
}

type AuthResetStage = 'request' | 'sent' | 'new-password' | 'done';

function AuthTemplateResetPassword() {
  const [stage, setStage] = useState<AuthResetStage>('request');
  const [password, setPassword] = useState('');

  return (
    <PageFrame title="Forgot and reset password" address="nordkapp.example/reset-password" height="lg">
      <CenteredPage
        header={<BrandMark name="Nordkapp" />}
        footer={
          <span className="tabular-nums">
            Step {['request', 'sent', 'new-password', 'done'].indexOf(stage) + 1} of 4 in this example
          </span>
        }
      >
        {stage === 'request' ? (
          <AuthCard
            as="h1"
            icon={<IconLock />}
            title="Reset your password"
            description="Enter the email address you sign in with. We send a link that works for 30 minutes."
            footer={
              <a href="#sign-in" className={AUTH_LINK} onClick={authStay}>
                Back to sign-in
              </a>
            }
          >
            <FormField label="Email address">
              {(control) => <Input {...control} type="email" autoComplete="username" defaultValue={AUTH_EMAIL} />}
            </FormField>
            <AsyncButton className="w-full" pendingLabel="Sending…" onAction={() => authWait(900).then(() => setStage('sent'))}>
              Send reset link
            </AsyncButton>
          </AuthCard>
        ) : null}
        {stage === 'sent' ? (
          <AuthCard
            as="h1"
            icon={<IconMailCheck />}
            title="Check your email"
            description={
              <>
                If an account exists for <span className="font-medium text-base-foreground">{AUTH_EMAIL}</span>, a reset link is on its
                way. It can take a minute.
              </>
            }
            footer="Nothing after five minutes? Check the spam folder, then ask your administrator."
          >
            <Button className="w-full" onClick={() => setStage('new-password')}>
              Open the link from the email
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStage('request')}>
              Use a different address
            </Button>
          </AuthCard>
        ) : null}
        {stage === 'new-password' ? (
          <AuthCard as="h1" title="Choose a new password" description={`For ${AUTH_EMAIL}. You are signed out everywhere else.`}>
            <FormField label="New password">
              {(control) => (
                <>
                  <PasswordInput
                    {...control}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <PasswordStrength password={password} />
                </>
              )}
            </FormField>
            <Button className="w-full" onClick={() => setStage('done')}>
              Save password
            </Button>
          </AuthCard>
        ) : null}
        {stage === 'done' ? (
          <AuthCard as="h1" icon={<IconCheck />} title="Password changed" description="Sign in with the new password on every device.">
            <Button
              className="w-full"
              onClick={() => {
                setPassword('');
                setStage('request');
              }}
            >
              Continue to sign-in
            </Button>
          </AuthCard>
        ) : null}
      </CenteredPage>
    </PageFrame>
  );
}

function AuthTemplateSessionExpired() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <PageFrame title="Session expired" device="phone">
        <CenteredPage surface="base" footer="Unsaved changes on the last page were kept as a draft.">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex size-10 items-center justify-center rounded-lg border border-default text-medium-foreground">
              <IconClock aria-hidden className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold tracking-tight text-base-foreground">Your session has ended</h1>
              <p className="text-sm text-muted-foreground">
                You were signed out at <span className="tabular-nums">14:00</span> after 8 hours. Sign in again to return to the alarm
                list.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-default p-3">
            <PersonAvatar name={AUTH_USER.name} sizes="xsm" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-base-foreground">{AUTH_USER.name}</span>
              <span className="truncate text-xs text-muted-foreground">{AUTH_EMAIL}</span>
            </div>
          </div>
          <form className="flex flex-col gap-4" onSubmit={authStay}>
            <FormField label="Password">{(control) => <PasswordInput {...control} autoComplete="current-password" />}</FormField>
            <Button type="submit" className="w-full">
              Sign in again
            </Button>
            <Button type="button" variant="ghost" className="w-full">
              Sign in as someone else
            </Button>
          </form>
        </CenteredPage>
      </PageFrame>
    </ThemeScope>
  );
}

function AuthTemplateNoProjectAccess() {
  const [requested, setRequested] = useState(false);

  return (
    <PageFrame title="No access to project" address="nordkapp.example/hammerfest-prod" height="lg">
      <CenteredPage
        width="md"
        surface="base"
        header={
          <>
            <BrandMark name="Nordkapp" />
            <span className="flex items-center gap-3">
              <AuthSignedInAs />
              <Button variant="ghost" size="sm">
                Sign out
              </Button>
            </span>
          </>
        }
      >
        <ErrorPage
          type="no-access"
          title="You do not have access to Hammerfest LNG production"
          description={
            requested
              ? 'Your request was sent to the project administrators. You get an email when it is answered, usually within a working day.'
              : 'You are signed in, but this project has not been shared with you. Ask its administrators for access, or open a project you already have.'
          }
          actions={
            requested ? (
              <Button variant="secondary" onClick={() => setRequested(false)}>
                Withdraw request
              </Button>
            ) : (
              <AsyncButton pendingLabel="Sending…" onAction={() => authWait(900).then(() => setRequested(true))}>
                Request access
              </AsyncButton>
            )
          }
        />
        <section aria-labelledby="auth-template-other-projects" className="flex flex-col gap-2">
          <h2 id="auth-template-other-projects" className="text-xs font-medium text-muted-foreground">
            Projects you can open
          </h2>
          <ul className="flex flex-col rounded-xl border border-default">
            {AUTH_OTHER_PROJECTS.map((project) => (
              <li key={project.id} className="flex items-center gap-3 border-b border-default px-4 py-3 last:border-b-0">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-base-foreground">{project.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{project.id}</span>
                </span>
                <Badge variant="secondary">{project.detail}</Badge>
                <Button variant="ghost" size="sm">
                  Open
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </CenteredPage>
    </PageFrame>
  );
}

function AuthTemplateSignedOut() {
  return (
    <PageFrame title="Signed out" device="phone" height="lg">
      <CenteredPage header={<BrandMark name="Nordkapp" />} footer={<AuthLegal />}>
        <AuthCard
          as="h1"
          icon={<IconLogout />}
          title="You are signed out"
          description="Your session on this workstation has ended. Open shifts stay open for the next operator."
          footer="On a shared workstation, close the browser window as well."
        >
          <Button className="w-full">Sign in again</Button>
        </AuthCard>
      </CenteredPage>
    </PageFrame>
  );
}

function AuthTemplateMagicLink() {
  const [sent, setSent] = useState(false);

  return (
    <PageFrame title="Email sign-in link" device="phone">
      <CenteredPage surface="base" header={<BrandMark name="Nordkapp" />} align="top">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-base-foreground">{sent ? 'Check your email' : 'Sign in without a password'}</h1>
          <p className="text-sm text-muted-foreground">
            {sent
              ? `We sent a sign-in link to ${AUTH_EMAIL}. It works once, for 15 minutes, on this device.`
              : 'We email you a link that signs you in. Useful on field tablets where typing a password is slow.'}
          </p>
        </div>
        {sent ? (
          <>
            <Button variant="secondary" className="w-full" onClick={() => setSent(false)}>
              Use a different address
            </Button>
            <p className="text-xs text-muted-foreground">You can close this page. The link opens the app directly.</p>
          </>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSent(true);
            }}
          >
            <FormField label="Email address">
              {(control) => <Input {...control} type="email" autoComplete="username" defaultValue={AUTH_EMAIL} />}
            </FormField>
            <Button type="submit" className="w-full">
              Email me a sign-in link
            </Button>
            <a href="#password" className={`text-center text-sm ${AUTH_LINK}`} onClick={authStay}>
              Use a password instead
            </a>
          </form>
        )}
      </CenteredPage>
    </PageFrame>
  );
}

export default definePage({
  id: 'auth-pages',
  title: 'Auth pages',
  summary:
    'Whole sign-in, sign-up and recovery screens, each shown in a frame at page size. They are assembled from the authentication patterns; copy one as the starting point of a screen and keep every step of a flow in the same layout.',
  guidance: {
    use: [
      'Keep one layout for every step of a flow, so sign-in, verification and reset read as one place.',
      'Put the product mark top left and at most one quiet link opposite it; nothing else competes with the form.',
      'Say who is signed in on every page that comes after authentication.',
      'Give each ending (signed out, expired, no access) one clear way forward.',
    ],
    avoid: [
      'Marketing copy next to a password field on anything narrower than a split screen.',
      'Telling people whether an email address has an account when they ask for a reset link.',
      'A dead end: every error page needs an action or a person to contact.',
    ],
  },
  source,
  sections: [
    {
      id: 'sign-in',
      title: 'Signing in',
      description: 'The front door, from a single card to a split screen.',
      specimens: [
        {
          id: 'AuthTemplateCenteredSignIn',
          title: 'Centred card',
          note: 'The default sign-in page: pick it when email and password is the main way in.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates-b/PageFrame.tsx',
            'templates-b/CenteredPage.tsx',
            'templates-b/BrandMark.tsx',
            'patterns/people/AuthCard.tsx',
            'forms/FormField.tsx',
            'forms/PasswordInput.tsx',
          ],
          Component: AuthTemplateCenteredSignIn,
        },
        {
          id: 'AuthTemplateSplitScreen',
          title: 'Split screen, dark',
          note: 'Pick it when the sign-in page is also the first impression of the product and the screen is wide; shown in the Aura dark preset.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates-b/PageFrame.tsx',
            'templates-b/SplitPage.tsx',
            'templates-b/BrandMark.tsx',
            'industrial/KpiTile.tsx',
            'forms/FormField.tsx',
            'forms/PasswordInput.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: AuthTemplateSplitScreen,
        },
        {
          id: 'AuthTemplateSsoOnly',
          title: 'Single sign-on only',
          note: 'Use when the organisation enforces its identity provider and there is no password to type.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/CenteredPage.tsx', 'templates-b/BrandMark.tsx'],
          Component: AuthTemplateSsoOnly,
        },
        {
          id: 'AuthTemplateTwoFactor',
          title: 'Two-factor verification',
          note: 'The second step after a password; keep it in the same frame as the sign-in card.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates-b/PageFrame.tsx',
            'templates-b/CenteredPage.tsx',
            'patterns/people/AuthCard.tsx',
            'patterns/people/OneTimeCodeInput.tsx',
          ],
          Component: AuthTemplateTwoFactor,
        },
      ],
    },
    {
      id: 'first-time',
      title: 'Getting in the first time',
      description: 'Creating an account, accepting an invitation and choosing where to go.',
      specimens: [
        {
          id: 'AuthTemplateSignUpSteps',
          title: 'Sign-up in steps',
          note: 'Pick it when creating an account takes more than one screen of fields; completed steps can be reopened.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates-b/PageFrame.tsx',
            'templates-b/CenteredPage.tsx',
            'templates-b/BrandMark.tsx',
            'patterns/people/PasswordStrength.tsx',
            'forms/ChoiceCardGroup.tsx',
            'forms/FormField.tsx',
            'forms/PasswordInput.tsx',
            'primitives/stepper/Stepper.tsx',
            'primitives/stepper/Step.tsx',
          ],
          Component: AuthTemplateSignUpSteps,
        },
        {
          id: 'AuthTemplateInvitation',
          title: 'Invitation acceptance',
          note: 'Use when someone arrives from an invitation email: who invited them and to what stays in view beside the form.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates-b/PageFrame.tsx',
            'templates-b/SplitPage.tsx',
            'templates-b/BrandMark.tsx',
            'patterns/structure/PropertyList.tsx',
            'patterns/people/RoleBadge.tsx',
            'display/PersonAvatar.tsx',
            'forms/FormField.tsx',
          ],
          Component: AuthTemplateInvitation,
        },
        {
          id: 'AuthTemplateOrganisationPicker',
          title: 'Organisation picker',
          note: 'Shown after sign-in when the account belongs to several organisations; the list filters as you type.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/CenteredPage.tsx', 'templates-b/BrandMark.tsx', 'display/PersonAvatar.tsx'],
          Component: AuthTemplateOrganisationPicker,
        },
      ],
    },
    {
      id: 'recovery',
      title: 'Recovery and passwordless',
      description: 'Getting back in without the password.',
      specimens: [
        {
          id: 'AuthTemplateResetPassword',
          title: 'Forgot and reset password',
          note: 'The whole recovery flow in one frame: request a link, check email, choose a new password, done.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates-b/PageFrame.tsx',
            'templates-b/CenteredPage.tsx',
            'templates-b/BrandMark.tsx',
            'patterns/people/AuthCard.tsx',
            'patterns/people/PasswordStrength.tsx',
            'actions/AsyncButton.tsx',
          ],
          Component: AuthTemplateResetPassword,
        },
        {
          id: 'AuthTemplateMagicLink',
          title: 'Email sign-in link',
          note: 'Pick it for field tablets and occasional users, where a one-time link beats remembering a password.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/CenteredPage.tsx', 'templates-b/BrandMark.tsx', 'forms/FormField.tsx'],
          Component: AuthTemplateMagicLink,
        },
        {
          id: 'AuthTemplateSessionExpired',
          title: 'Session expired, dark',
          note: 'Use when a session times out: it names the account and asks only for the password; shown in the Control room preset.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates-b/PageFrame.tsx',
            'templates-b/CenteredPage.tsx',
            'display/PersonAvatar.tsx',
            'forms/PasswordInput.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: AuthTemplateSessionExpired,
        },
      ],
    },
    {
      id: 'endings',
      title: 'Endings',
      description: 'Pages that close a session or stop at a door.',
      specimens: [
        {
          id: 'AuthTemplateNoProjectAccess',
          title: 'No access to project',
          note: 'Use when the person is signed in but the project is not shared with them; requesting access works in place.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates-b/PageFrame.tsx',
            'templates-b/CenteredPage.tsx',
            'templates-b/BrandMark.tsx',
            'patterns/states/ErrorPage.tsx',
            'actions/AsyncButton.tsx',
            'display/PersonAvatar.tsx',
          ],
          Component: AuthTemplateNoProjectAccess,
        },
        {
          id: 'AuthTemplateSignedOut',
          title: 'Sign-out complete',
          note: 'The page after signing out: confirms it happened and offers the way back in.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/CenteredPage.tsx', 'templates-b/BrandMark.tsx', 'patterns/people/AuthCard.tsx'],
          Component: AuthTemplateSignedOut,
        },
      ],
    },
  ],
});
