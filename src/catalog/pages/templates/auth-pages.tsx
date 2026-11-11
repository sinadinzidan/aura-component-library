import { Avatar, AvatarFallback } from '@cognite/aura/components/avatar';
import { Button } from '@cognite/aura/components/button';
import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import { Textarea } from '@cognite/aura/components/textarea';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconBell,
  IconBrandGoogle,
  IconBrandWindows,
  IconBuildingFactory2,
  IconChartLine,
  IconCircleCheck,
  IconClipboardList,
  IconClock,
  IconDeviceFloppy,
  IconFlame,
  IconKey,
  IconLifebuoy,
  IconLock,
  IconLogout,
  IconMail,
  IconPhone,
  IconShieldCheck,
  IconShieldLock,
  IconUserPlus,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { FormField } from '../../../library/forms/FormField';
import { PasswordInput } from '../../../library/forms/PasswordInput';
import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { AuthPanel } from '../../../library/kit/auth-pages/AuthPanel';
import { ChoiceRow } from '../../../library/kit/auth-pages/ChoiceRow';
import { CodeInput } from '../../../library/kit/auth-pages/CodeInput';
import { DetailList, type DetailItem } from '../../../library/kit/auth-pages/DetailList';
import { PasswordRules } from '../../../library/kit/auth-pages/PasswordRules';
import { checkPassword } from '../../../library/kit/auth-pages/passwordRules';
import { StepRail, type StepRailStep } from '../../../library/kit/auth-pages/StepRail';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { BrowserFrame } from '../../../library/kit/landing-pages/BrowserFrame';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { Stat } from '../../../library/kit/Stat';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import { PEOPLE, PLANT_KPIS } from '../../data/plant';
import { formatTime, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './auth-pages.tsx?raw';

const AUTH_EMAIL = 'ingrid.haugen@nordkapp.test';

const AUTH_EXPORT = makeSeries({
  seed: 31,
  points: 25,
  base: 4.32,
  amplitude: 0.14,
  noise: 0.04,
  cycles: 1.2,
  decimals: 2,
});

const AUTH_EXPORT_HOURS = AUTH_EXPORT.map((point) => formatTime(point.t));

const AUTH_EXPORT_VALUES = AUTH_EXPORT.map((point) => point.v);

type AuthProject = {
  id: string;
  name: string;
  organisation: string;
  cluster: string;
  role: string;
  lastOpened: string;
  state: 'Live' | 'Test' | 'Read only';
  tone: Tone;
  assets: string;
  series: string;
};

const AUTH_PROJECTS: AuthProject[] = [
  {
    id: 'nk-prod',
    name: 'Nordkapp production',
    organisation: 'Nordkapp Energi',
    cluster: 'westeurope-1',
    role: 'Operator',
    lastOpened: 'Today 06:02',
    state: 'Live',
    tone: 'success',
    assets: '18 420',
    series: '212 600',
  },
  {
    id: 'nk-test',
    name: 'Nordkapp test',
    organisation: 'Nordkapp Energi',
    cluster: 'westeurope-1',
    role: 'Admin',
    lastOpened: 'Tuesday',
    state: 'Test',
    tone: 'info',
    assets: '18 420',
    series: '9 800',
  },
  {
    id: 'hf-prod',
    name: 'Hammerfest LNG',
    organisation: 'Nordkapp Energi',
    cluster: 'westeurope-1',
    role: 'Viewer',
    lastOpened: '3 March',
    state: 'Live',
    tone: 'success',
    assets: '31 075',
    series: '388 140',
  },
  {
    id: 'st-prod',
    name: 'Stord terminal',
    organisation: 'Nordkapp Energi',
    cluster: 'westeurope-1',
    role: 'Viewer',
    lastOpened: '21 February',
    state: 'Live',
    tone: 'success',
    assets: '6 240',
    series: '51 900',
  },
  {
    id: 'nk-train',
    name: 'Nordkapp training',
    organisation: 'Nordkapp Energi',
    cluster: 'westeurope-1',
    role: 'Operator',
    lastOpened: '9 February',
    state: 'Test',
    tone: 'info',
    assets: '18 420',
    series: '2 400',
  },
  {
    id: 'vs-arch',
    name: 'Valhall Sør 2024',
    organisation: 'Valhall Partners',
    cluster: 'northeurope-2',
    role: 'Viewer',
    lastOpened: '14 January',
    state: 'Read only',
    tone: 'neutral',
    assets: '9 310',
    series: '74 250',
  },
];

type AuthSignIn = {
  id: string;
  when: string;
  device: string;
  place: string;
  method: string;
  result: 'Signed in' | 'Blocked';
  tone: Tone;
};

const AUTH_SIGN_INS: AuthSignIn[] = [
  {
    id: 's1',
    when: 'Today 13:58',
    device: 'Chrome on Windows',
    place: 'Hammerfest, Norway',
    method: 'Password + code',
    result: 'Signed in',
    tone: 'success',
  },
  {
    id: 's2',
    when: 'Today 06:02',
    device: 'Control room console 2',
    place: 'Nordkapp plant',
    method: 'Badge',
    result: 'Signed in',
    tone: 'success',
  },
  {
    id: 's3',
    when: 'Yesterday 22:41',
    device: 'Safari on iPhone',
    place: 'Tromsø, Norway',
    method: 'Password + code',
    result: 'Signed in',
    tone: 'success',
  },
  {
    id: 's4',
    when: '10 March 03:17',
    device: 'Firefox on Linux',
    place: 'Unknown network',
    method: 'Password',
    result: 'Blocked',
    tone: 'critical',
  },
];

const AUTH_SIGN_IN_COLUMNS: DataTableColumn<AuthSignIn>[] = [
  { id: 'when', header: 'When', nowrap: true, cell: (row) => row.when },
  { id: 'device', header: 'Device', nowrap: true, cell: (row) => row.device },
  {
    id: 'place',
    header: 'Location',
    nowrap: true,
    muted: true,
    cell: (row) => row.place,
  },
  {
    id: 'method',
    header: 'Method',
    nowrap: true,
    muted: true,
    cell: (row) => row.method,
  },
  {
    id: 'result',
    header: 'Result',
    nowrap: true,
    cell: (row) => <StatusPill tone={row.tone}>{row.result}</StatusPill>,
  },
];

const AUTH_THIS_SIGN_IN: DetailItem[] = [
  { label: 'Account', value: AUTH_EMAIL },
  { label: 'Device', value: 'Chrome on Windows' },
  { label: 'Location', value: 'Hammerfest, Norway' },
  { label: 'Started', value: '13:58:12 UTC' },
  { label: 'Code sent to', value: 'Authenticator app' },
];

const AUTH_SIGN_UP_STEPS: StepRailStep[] = [
  { id: 'account', label: 'Your account', detail: 'Name and password' },
  { id: 'role', label: 'Your role', detail: 'Sets your starting view' },
  { id: 'sites', label: 'Your sites', detail: 'What you follow' },
  { id: 'verify', label: 'Verify email', detail: 'A six-digit code' },
];

const AUTH_ROLE_OPTIONS: {
  value: string;
  label: string;
  description: string;
  tag?: string;
}[] = [
  {
    value: 'operator',
    label: 'Control room operator',
    description: 'Alarms, trends and shift handover first.',
    tag: 'Most common',
  },
  {
    value: 'maintenance',
    label: 'Maintenance planner',
    description: 'Work orders, backlog and equipment health first.',
  },
  {
    value: 'engineer',
    label: 'Process or reliability engineer',
    description: 'Analysis tools, charts and data quality first.',
  },
];

const AUTH_SITE_OPTIONS = [
  {
    id: 'nordkapp',
    name: 'Nordkapp',
    detail: 'Gas processing · Norwegian Sea',
  },
  {
    id: 'hammerfest',
    name: 'Hammerfest LNG',
    detail: 'Liquefaction · Barents Sea',
  },
  { id: 'valhall', name: 'Valhall Sør', detail: 'Production · North Sea' },
  {
    id: 'stord',
    name: 'Stord terminal',
    detail: 'Storage and export · West coast',
  },
];

const AUTH_RESET_STEPS: StepRailStep[] = [
  { id: 'request', label: 'Ask for a link', detail: 'Done at 13:52' },
  { id: 'email', label: 'Open the email', detail: 'Link used at 13:54' },
  { id: 'password', label: 'Choose a new password', detail: 'You are here' },
  { id: 'done', label: 'Sign in again', detail: 'On every device' },
];

const AUTH_INVITE_NAV: AppFrameNavItem[] = [
  { id: 'invitation', label: 'Invitation' },
  { id: 'access', label: 'Your access' },
  { id: 'account', label: 'Your account' },
];

const AUTH_INVITE_ACCESS: {
  id: string;
  icon: ReactNode;
  tone: Tone;
  title: string;
  meta: string;
  level: string;
}[] = [
  {
    id: 'alarms',
    icon: <IconBell />,
    tone: 'pink',
    title: 'Alarms and events',
    meta: 'Acknowledge and shelve for gas compression',
    level: 'Can act',
  },
  {
    id: 'trends',
    icon: <IconChartLine />,
    tone: 'blue',
    title: 'Trends and time series',
    meta: 'All 212 600 series in Nordkapp production',
    level: 'Can view',
  },
  {
    id: 'orders',
    icon: <IconClipboardList />,
    tone: 'teal',
    title: 'Work orders',
    meta: 'Create and comment; planning stays with maintenance',
    level: 'Can create',
  },
  {
    id: 'handover',
    icon: <IconDeviceFloppy />,
    tone: 'amber',
    title: 'Shift handover',
    meta: 'Write and sign notes for your own shift',
    level: 'Can sign',
  },
];

function AuthHelpButton() {
  return (
    <Button variant="ghost" size="sm">
      <IconLifebuoy /> Get help
    </Button>
  );
}

function AuthSignedIn({ detail = 'Control room operator' }: { detail?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="text-right text-sm leading-tight">
        <p className="font-medium">Ingrid Haugen</p>
        <p className="text-(color:--kit-text-3)">{detail}</p>
      </div>
      <Avatar variant="decorative-2" aria-label="Ingrid Haugen">
        <AvatarFallback>IH</AvatarFallback>
      </Avatar>
    </div>
  );
}

function AuthEmailField({ label = 'Work email' }: { label?: string }) {
  return <FormField label={label}>{(control) => <Input {...control} type="email" autoComplete="email" defaultValue={AUTH_EMAIL} />}</FormField>;
}

function AuthPasswordField({ label = 'Password', helper }: { label?: string; helper?: string }) {
  return (
    <FormField label={label} helper={helper}>
      {(control) => <PasswordInput {...control} autoComplete="current-password" defaultValue="Nordkapp-2026" />}
    </FormField>
  );
}

function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm text-(color:--kit-text-3)">
      <span className="h-px flex-1 bg-(--kit-rule)" />
      {children}
      <span className="h-px flex-1 bg-(--kit-rule)" />
    </div>
  );
}

function AuthProviders() {
  return (
    <div className="flex flex-col gap-2.5">
      <Button variant="outline" size="lg" className="w-full">
        <IconBrandWindows /> Continue with Microsoft Entra ID
      </Button>
      <Button variant="outline" size="lg" className="w-full">
        <IconBrandGoogle /> Continue with Google Workspace
      </Button>
      <Button variant="outline" size="lg" className="w-full">
        <IconKey /> Continue with a security key
      </Button>
    </div>
  );
}

function AuthLegal() {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 text-sm text-(color:--kit-text-3)">
      <span className="flex items-center gap-2">
        <StatusPill tone="success">All systems operational</StatusPill>
        <span>westeurope-1</span>
      </span>
      <span>Privacy · Terms · Version 2026.3</span>
    </div>
  );
}

function AuthTemplateCenteredSignIn() {
  return (
    <BrowserFrame url="nordkapp.test/sign-in" look="studio">
      <AppFrame variant="topbar" brand={{ name: 'Nordkapp', detail: 'Operations', mark: <IconFlame /> }} tools={<AuthHelpButton />}>
        <div className="flex h-full flex-col items-center justify-between gap-8">
          <span />
          <AuthPanel
            className="w-full max-w-md"
            title="Sign in to Nordkapp"
            description="Use the account your organisation gave you. Shared control room consoles sign in with a badge instead."
            footer={
              <span>
                No account yet? <span className="font-medium text-(color:--kit-line-accent)">Ask your project admin for an invitation</span>
              </span>
            }
          >
            <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
              <AuthEmailField />
              <AuthPasswordField />
              <div className="flex items-center justify-between gap-4">
                <CheckboxItem>
                  <CheckboxItemControl defaultChecked />
                  <CheckboxItemLabel>Keep me signed in for 12 hours</CheckboxItemLabel>
                </CheckboxItem>
                <Button variant="ghost" size="sm" type="button">
                  Forgot password
                </Button>
              </div>
              <Button size="lg" type="submit" className="w-full">
                Sign in <IconArrowRight />
              </Button>
            </form>
            <AuthDivider>or</AuthDivider>
            <Button variant="outline" size="lg" className="w-full">
              <IconBrandWindows /> Continue with Microsoft Entra ID
            </Button>
          </AuthPanel>
          <AuthLegal />
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

function AuthTemplateSplitScreen() {
  return (
    <BrowserFrame url="nordkapp.test/sign-in" look="glass" minHeight={760}>
      <Canvas className="grid grid-cols-12 gap-10">
        <div className="col-span-7 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <IconChip tone="sky">
              <IconFlame />
            </IconChip>
            <span className="text-lg font-semibold tracking-tight">Nordkapp Operations</span>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <p className="max-w-xl text-5xl leading-[1.05] font-semibold tracking-tighter text-balance">One screen for the whole plant.</p>
            <p className="max-w-lg text-base text-(color:--kit-text-2)">
              Alarms, trends, work orders and shift handover for Nordkapp gas processing, live from 212 600 time series.
            </p>
          </div>
          <Panel className="mt-auto" title="Gas export" subtitle="Last 24 hours, MSm³ per day">
            <TrendArea
              label="Gas export over the last 24 hours against the daily plan"
              labels={AUTH_EXPORT_HOURS}
              unit="MSm³/d"
              decimals={2}
              height={190}
              highlightLast
              series={[
                {
                  id: 'export',
                  label: 'Gas export',
                  values: AUTH_EXPORT_VALUES,
                  tone: 'accent',
                },
              ]}
              limits={[
                {
                  value: PLANT_KPIS.gasExport.target,
                  label: 'Plan',
                  tone: 'warning',
                },
              ]}
            />
          </Panel>
          <div className="grid grid-cols-3 gap-4">
            <Stat size="sm" label="Availability" value={PLANT_KPIS.availability.value} decimals={1} unit="%" tone="teal" />
            <Stat size="sm" label="Open work orders" value={PLANT_KPIS.openWorkOrders.value} tone="purple" />
            <Stat size="sm" label="Days since incident" value={PLANT_KPIS.daysSinceIncident.value} tone="green" />
          </div>
        </div>
        <div className="col-span-5 flex flex-col justify-center">
          <AuthPanel
            title="Welcome back"
            description="Sign in to pick up where the night shift left off."
            footer={
              <span className="flex w-full items-center justify-between gap-3">
                <span>Protected by single sign-on and two-step verification</span>
                <IconShieldCheck aria-hidden="true" className="size-5 shrink-0" />
              </span>
            }
          >
            <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
              <AuthEmailField />
              <AuthPasswordField />
              <Button size="lg" type="submit" className="w-full">
                Sign in <IconArrowRight />
              </Button>
            </form>
            <AuthDivider>or continue with</AuthDivider>
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="outline" className="w-full">
                <IconBrandWindows /> Microsoft
              </Button>
              <Button variant="outline" className="w-full">
                <IconBrandGoogle /> Google
              </Button>
            </div>
            <p className="text-sm text-(color:--kit-text-2)">
              Trouble signing in? Call the control room supervisor on <span className="font-medium whitespace-nowrap text-(color:--kit-text) tabular-nums">+47 78 40 12 00</span>.
            </p>
          </AuthPanel>
        </div>
      </Canvas>
    </BrowserFrame>
  );
}

function AuthTemplateSsoOnly() {
  return (
    <BrowserFrame url="nordkapp.test/sso" look="poster" minHeight={720}>
      <AppFrame
        variant="none"
        brand={{ name: 'Nordkapp' }}
        title="Sign in with your organisation."
        subtitle="Nordkapp Energi uses single sign-on. There is no separate password to remember."
      >
        <Grid className="h-full">
          <Panel className="col-span-7" tone="blue" title="Pick your identity provider" subtitle="You are sent there and back in a few seconds">
            <div className="flex flex-1 flex-col justify-between gap-6">
              <div className="flex items-center gap-4 border-2 border-(--kit-rule-strong) bg-(--kit-well) p-4">
                <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center bg-(--kit-text) text-xl font-extrabold text-(color:--kit-surface)">
                  IH
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg leading-tight font-extrabold tracking-tight">Ingrid Haugen</p>
                  <p className="text-sm font-medium">Last signed in here with Microsoft Entra ID, yesterday 22:41</p>
                </div>
                <Button size="lg">
                  Continue as Ingrid <IconArrowRight />
                </Button>
              </div>
              <AuthDivider>or pick a provider</AuthDivider>
              <AuthProviders />
              <div className="flex flex-col gap-3">
                <FormField label="Organisation domain" helper="We use it to find the right provider next time.">
                  {(control) => <Input {...control} defaultValue="nordkapp.test" />}
                </FormField>
                <CheckboxItem>
                  <CheckboxItemControl defaultChecked />
                  <CheckboxItemLabel>Remember this organisation on this device</CheckboxItemLabel>
                </CheckboxItem>
              </div>
            </div>
          </Panel>
          <div className="col-span-5 flex flex-col gap-(--kit-gap)">
            <Stat size="lg" tone="green" label="Signed in right now" value={64} unit="people" target="Across 4 sites" icon={<IconShieldCheck />} />
            <Panel className="flex-1" tone="amber" title="Why no password" subtitle="Three reasons, in order">
              <ol className="flex flex-1 flex-col justify-between gap-4 text-base font-medium">
                <li className="flex gap-3">
                  <span className="text-2xl leading-none font-extrabold tabular-nums">1</span>
                  Access ends the day someone leaves the organisation.
                </li>
                <li className="flex gap-3">
                  <span className="text-2xl leading-none font-extrabold tabular-nums">2</span>
                  Two-step verification is enforced by your IT team, once.
                </li>
                <li className="flex gap-3">
                  <span className="text-2xl leading-none font-extrabold tabular-nums">3</span>
                  One sign-in covers every Nordkapp application.
                </li>
              </ol>
            </Panel>
          </div>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function AuthTemplateTwoFactor() {
  const [code, setCode] = useState('4812');
  const complete = code.length === 6;
  return (
    <BrowserFrame url="nordkapp.test/sign-in/verify" look="console" minHeight={720}>
      <AppFrame
        variant="topbar"
        brand={{ name: 'Nordkapp', detail: 'Sign-in', mark: <IconFlame /> }}
        padding="none"
        tools={
          <>
            <span>Step 2 of 2</span>
            <span className="font-medium tabular-nums">13:58:40 UTC</span>
          </>
        }
      >
        <Grid className="h-full grid-rows-[auto_auto_minmax(0,1fr)]">
          <div className="col-span-12 flex items-stretch bg-base-background">
            <div className="flex items-center gap-3 bg-info-foreground px-4 py-3 text-base-background">
              <IconShieldLock className="size-6" aria-hidden="true" />
              <span className="text-xl font-semibold">Verify it is you</span>
            </div>
            <p className="flex flex-1 items-center px-4 text-sm text-medium-foreground">
              Password accepted for {AUTH_EMAIL}. Enter the code from your authenticator app to finish.
            </p>
            <div className="flex items-center gap-2 px-4">
              <StatusPill tone="success">Password</StatusPill>
              <StatusPill tone="info">Code</StatusPill>
            </div>
          </div>

          <Panel className="col-span-7" title="Verification code" subtitle="Changes every 30 seconds">
            <form className="flex flex-1 flex-col justify-between gap-5" onSubmit={(event) => event.preventDefault()}>
              <Meter label="Current code is valid for" value={18} max={30} unit="s" tone="info" hideScale />
              <CodeInput label="Six-digit code from Nordkapp Authenticator" value={code} onChange={setCode} describedBy="auth-two-factor-hint" />
              <p id="auth-two-factor-hint" className="text-sm text-medium-foreground">
                {complete ? 'Code complete. Select Verify to continue.' : `${6 - code.length} digits to go. You can paste the whole code.`}
              </p>
              <div className="flex items-center gap-3">
                <Button type="submit" size="lg">
                  Verify and sign in
                </Button>
                <Button type="button" variant="ghost" size="lg" onClick={() => setCode('')}>
                  Clear
                </Button>
              </div>
              <CheckboxItem>
                <CheckboxItemControl />
                <CheckboxItemLabel>Trust this device for 30 days</CheckboxItemLabel>
              </CheckboxItem>
            </form>
          </Panel>
          <div className="col-span-5 flex flex-col gap-px">
            <Panel className="h-auto" title="This sign-in">
              <DetailList items={AUTH_THIS_SIGN_IN} />
            </Panel>
            <Panel className="h-auto flex-1" title="Other ways to verify" padding="none">
              <ul>
                <ListRow
                  leading={<IconKey className="size-5" aria-hidden="true" />}
                  title="Security key"
                  meta="YubiKey registered 4 February"
                  trailing={
                    <Button variant="outline" size="sm">
                      Use key
                    </Button>
                  }
                />
                <ListRow
                  leading={<IconLock className="size-5" aria-hidden="true" />}
                  title="Recovery code"
                  meta="6 of 10 codes left"
                  trailing={
                    <Button variant="outline" size="sm">
                      Enter code
                    </Button>
                  }
                />
                <ListRow
                  leading={<IconPhone className="size-5" aria-hidden="true" />}
                  title="Ask the shift supervisor"
                  meta="Liv Wold can approve from her console"
                  trailing={
                    <Button variant="outline" size="sm">
                      Request
                    </Button>
                  }
                />
              </ul>
            </Panel>
          </div>

          <Panel className="col-span-12" title="Recent sign-ins" subtitle="Last 3 days" padding="none">
            <DataTable
              label="Recent sign-ins"
              flush
              columns={AUTH_SIGN_IN_COLUMNS}
              rows={AUTH_SIGN_INS}
              rowKey={(row) => row.id}
              rowTone={(row) => (row.result === 'Blocked' ? 'critical' : undefined)}
            />
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function AuthSignUpSites({ picked, onToggle }: { picked: readonly string[]; onToggle: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {AUTH_SITE_OPTIONS.map((site) => (
        <CheckboxItem key={site.id}>
          <CheckboxItemControl checked={picked.includes(site.id)} onCheckedChange={() => onToggle(site.id)} />
          <CheckboxItemLabel>
            {site.name}
            <span className="block font-normal text-(color:--kit-text-2)">{site.detail}</span>
          </CheckboxItemLabel>
        </CheckboxItem>
      ))}
    </div>
  );
}

function AuthTemplateSignUpSteps() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('operator');
  const [sites, setSites] = useState<readonly string[]>(['nordkapp']);
  const [code, setCode] = useState('');
  const titles = ['Tell us who you are', 'What do you do at the plant?', 'Which sites do you follow?', 'Check your email'];
  const toggleSite = (id: string) => setSites((current) => (current.includes(id) ? current.filter((site) => site !== id) : [...current, id]));

  return (
    <BrowserFrame url="nordkapp.test/sign-up" look="soft" minHeight={720}>
      <AppFrame
        variant="topbar"
        brand={{
          name: 'Nordkapp',
          detail: 'Create account',
          mark: <IconFlame />,
        }}
        tools={<AuthHelpButton />}
      >
        <Grid className="h-full">
          <Panel className="col-span-4" tone="purple" title="Create your account" subtitle="About two minutes">
            <div className="flex flex-1 flex-col justify-between gap-6">
              <StepRail label="Sign-up steps" steps={AUTH_SIGN_UP_STEPS} current={step} />
              <div className="flex items-center gap-3 rounded-(--kit-radius-sm) bg-(--kit-surface) p-4">
                <IconChip tone="purple" size="sm">
                  <IconUserPlus />
                </IconChip>
                <p className="text-sm">
                  Invited by <span className="font-semibold">Liv Wold</span>, shift supervisor
                </p>
              </div>
            </div>
          </Panel>
          <Panel
            className="col-span-8"
            title={titles[step] ?? titles[0]}
            subtitle={`Step ${step + 1} of ${AUTH_SIGN_UP_STEPS.length}`}
            footer={
              <span className="flex w-full items-center justify-between gap-3">
                <Button variant="ghost" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>
                  <IconArrowLeft /> Back
                </Button>
                <Button onClick={() => setStep((current) => Math.min(AUTH_SIGN_UP_STEPS.length - 1, current + 1))}>
                  {step === AUTH_SIGN_UP_STEPS.length - 1 ? 'Create account' : 'Continue'} <IconArrowRight />
                </Button>
              </span>
            }
          >
            <div className="flex flex-1 flex-col gap-4">
              {step === 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="First name">{(control) => <Input {...control} defaultValue="Ingrid" autoComplete="given-name" />}</FormField>
                    <FormField label="Last name">{(control) => <Input {...control} defaultValue="Haugen" autoComplete="family-name" />}</FormField>
                  </div>
                  <AuthEmailField />
                  <AuthPasswordField label="Choose a password" helper="At least 12 characters with a number and a symbol." />
                </>
              ) : null}
              {step === 1 ? (
                <>
                  <div role="radiogroup" aria-label="Role" className="flex flex-col gap-3">
                    {AUTH_ROLE_OPTIONS.map((option) => (
                      <ChoiceRow
                        key={option.value}
                        title={option.label}
                        meta={option.description}
                        trailing={option.tag ? <StatusPill tone="purple">{option.tag}</StatusPill> : undefined}
                        selected={role === option.value}
                        onSelect={() => setRole(option.value)}
                      />
                    ))}
                  </div>
                  <FormField label="Team or discipline" optional>
                    {(control) => <Input {...control} defaultValue="Day shift, control room 1" />}
                  </FormField>
                </>
              ) : null}
              {step === 2 ? (
                <>
                  <p className="text-sm text-(color:--kit-text-2)">Alarms and handover notes from these sites show up on your home page. {sites.length} selected.</p>
                  <AuthSignUpSites picked={sites} onToggle={toggleSite} />
                </>
              ) : null}
              {step === 3 ? (
                <>
                  <p className="text-sm text-(color:--kit-text-2)">
                    We sent a code to <span className="font-semibold text-(color:--kit-text)">{AUTH_EMAIL}</span>. It works for 10 minutes.
                  </p>
                  <CodeInput label="Code from the email" value={code} onChange={setCode} />
                  <div>
                    <Button variant="outline" size="sm">
                      Send a new code
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function AuthTemplateInvitation() {
  const [password, setPassword] = useState('Nordkapp-26');
  return (
    <BrowserFrame url="nordkapp.test/invite/7f3a" look="editorial" minHeight={760}>
      <AppFrame
        variant="masthead"
        brand={{ name: 'Nordkapp' }}
        nav={AUTH_INVITE_NAV}
        current="invitation"
        tools={<span>Invitation expires 19 March</span>}
        title="Liv Wold invited you to Nordkapp production."
        subtitle="You join as a control room operator on the day shift. Set a password to accept; it takes a minute."
      >
        <Grid className="h-full">
          <Panel className="col-span-7" title="What you can do" subtitle="Granted by the operator role. A project admin can change it.">
            <ul className="flex flex-1 flex-col justify-between">
              {AUTH_INVITE_ACCESS.map((item) => (
                <ListRow
                  key={item.id}
                  leading={
                    <IconChip tone={item.tone} size="sm">
                      {item.icon}
                    </IconChip>
                  }
                  title={item.title}
                  meta={item.meta}
                  trailing={<StatusPill tone="success">{item.level}</StatusPill>}
                />
              ))}
            </ul>
          </Panel>
          <Panel className="col-span-5" title="Accept the invitation" subtitle={`For ${AUTH_EMAIL}`}>
            <form className="flex flex-1 flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
              <FormField label="Full name">{(control) => <Input {...control} defaultValue="Ingrid Haugen" autoComplete="name" />}</FormField>
              <FormField label="Choose a password">
                {(control) => <PasswordInput {...control} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />}
              </FormField>
              <PasswordRules rules={checkPassword(password)} />
              <div className="mt-auto flex items-center gap-3 pt-2">
                <Button type="submit" size="lg">
                  Accept and sign in
                </Button>
                <Button type="button" variant="ghost" size="lg">
                  Decline
                </Button>
              </div>
            </form>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function AuthTemplateOrganisationPicker() {
  const [picked, setPicked] = useState('nk-prod');
  const project = AUTH_PROJECTS.find((candidate) => candidate.id === picked) ?? AUTH_PROJECTS[0];
  return (
    <BrowserFrame url="nordkapp.test/projects" look="blueprint" minHeight={720}>
      <AppFrame
        variant="topbar"
        brand={{
          name: 'Nordkapp',
          detail: 'Project register',
          mark: <IconFlame />,
        }}
        tools={
          <>
            <span>
              Signed in <span className="font-medium">Ingrid Haugen</span>
            </span>
            <span>
              Projects <span className="font-medium tabular-nums">{AUTH_PROJECTS.length}</span>
            </span>
          </>
        }
      >
        <Grid className="h-full">
          <Panel className="col-span-8" title="Choose a project" subtitle="2 organisations" icon={<IconBuildingFactory2 className="size-4.5" aria-hidden="true" />}>
            <div role="radiogroup" aria-label="Project" className="flex flex-1 flex-col gap-3">
              {AUTH_PROJECTS.map((candidate) => (
                <ChoiceRow
                  key={candidate.id}
                  title={candidate.name}
                  meta={
                    <>
                      <span>{candidate.organisation}</span>
                      <span>· {candidate.role}</span>
                      <span>· opened {candidate.lastOpened}</span>
                    </>
                  }
                  trailing={<StatusPill tone={candidate.tone}>{candidate.state}</StatusPill>}
                  selected={candidate.id === picked}
                  onSelect={() => setPicked(candidate.id)}
                />
              ))}
              <p className="mt-auto pt-2 text-sm text-(color:--kit-text-2)">Missing a project? Its admin has to invite {AUTH_EMAIL}.</p>
            </div>
          </Panel>
          <Panel
            className="col-span-4"
            title={project?.name ?? ''}
            subtitle={project?.state}
            footer={
              <Button className="w-full" size="lg">
                Open project <IconArrowRight />
              </Button>
            }
          >
            <div className="flex flex-1 flex-col justify-between gap-5">
              <DetailList
                items={[
                  { label: 'Organisation', value: project?.organisation },
                  {
                    label: 'Cluster',
                    value: <TagId>{project?.cluster ?? ''}</TagId>,
                  },
                  { label: 'Your role', value: project?.role },
                  { label: 'Last opened', value: project?.lastOpened },
                ]}
              />
              <div className="grid grid-cols-2 gap-4">
                <Stat variant="plain" size="sm" label="Assets" value={project?.assets ?? ''} />
                <Stat variant="plain" size="sm" label="Time series" value={project?.series ?? ''} />
              </div>
              <CheckboxItem>
                <CheckboxItemControl defaultChecked />
                <CheckboxItemLabel>Open this project next time</CheckboxItemLabel>
              </CheckboxItem>
            </div>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function AuthTemplateResetPassword() {
  const [password, setPassword] = useState('Kompressor9');
  const [confirm, setConfirm] = useState('Kompressor');
  const rules = checkPassword(password);
  const mismatch = confirm.length > 0 && confirm !== password;
  return (
    <BrowserFrame url="nordkapp.test/reset-password" look="studio" minHeight={700}>
      <AppFrame
        variant="topbar"
        brand={{ name: 'Nordkapp', detail: 'Operations', mark: <IconFlame /> }}
        tools={<AuthHelpButton />}
        title="Reset your password"
        subtitle={`For ${AUTH_EMAIL}. The link in your email works until 14:22 UTC.`}
        status={
          <StatusPill tone="info" size="lg" icon={<IconClock />}>
            28 minutes left
          </StatusPill>
        }
      >
        <Grid className="h-full grid-rows-[auto_minmax(0,1fr)]">
          <Panel className="col-span-12">
            <StepRail label="Password reset" steps={AUTH_RESET_STEPS} current={2} orientation="horizontal" />
          </Panel>
          <Panel className="col-span-7" title="Choose a new password" subtitle="You will be signed out everywhere else">
            <form className="flex flex-1 flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
              <FormField label="New password">
                {(control) => <PasswordInput {...control} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />}
              </FormField>
              <FormField label="Repeat the password" error={mismatch ? 'The two passwords are not the same yet.' : undefined}>
                {(control) => <PasswordInput {...control} autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />}
              </FormField>
              <div className="mt-auto flex items-center gap-3">
                <Button type="submit" size="lg">
                  Save password
                </Button>
                <Button type="button" variant="ghost" size="lg">
                  Cancel
                </Button>
              </div>
            </form>
          </Panel>
          <Panel
            className="col-span-5"
            tone={rules.every((rule) => rule.met) ? 'success' : 'warning'}
            title="Password policy"
            subtitle="Set by Nordkapp Energi"
            icon={
              <IconChip tone={rules.every((rule) => rule.met) ? 'success' : 'warning'}>
                <IconShieldLock />
              </IconChip>
            }
          >
            <div className="flex flex-1 flex-col justify-between gap-5">
              <PasswordRules rules={rules} />
              <p className="rounded-(--kit-radius-sm) bg-(--kit-well) p-3.5 text-sm text-(color:--kit-text-2)">
                <span className="font-semibold text-(color:--kit-text)">Tip.</span> Three unrelated words, a number and a symbol are long enough and easy to remember.
              </p>
            </div>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function AuthTemplateMagicLink() {
  return (
    <BrowserFrame url="nordkapp.test/sign-in/link-sent" look="soft" minHeight={680}>
      <Canvas className="flex flex-col items-center justify-center gap-6">
        <AuthPanel
          className="h-auto w-full max-w-xl flex-none"
          align="center"
          tone="purple"
          icon={<IconMail />}
          title="Check your inbox"
          description={
            <>
              We sent a sign-in link to <span className="font-semibold text-(color:--kit-text)">{AUTH_EMAIL}</span>. It works once, for 15 minutes, on this device.
            </>
          }
        >
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg">
              <IconBrandWindows /> Open Outlook
            </Button>
            <Button size="lg" variant="outline">
              <IconBrandGoogle /> Open Gmail
            </Button>
          </div>
          <p className="text-center text-sm text-(color:--kit-text-2)">
            Nothing after a minute? Look in junk mail, or <span className="font-semibold text-(color:--kit-text)">send it again in 0:42</span>.
          </p>
        </AuthPanel>
        <div className="grid w-full max-w-3xl grid-cols-3 gap-(--kit-gap)">
          <Panel tone="blue" padding="tight" className="h-auto">
            <div className="flex flex-col gap-2 p-2">
              <span className="text-3xl font-bold tabular-nums">1</span>
              <p className="text-base font-semibold">Open the email</p>
              <p className="text-sm text-(color:--kit-text-2)">From no-reply@nordkapp.test, sent at 13:58.</p>
            </div>
          </Panel>
          <Panel tone="teal" padding="tight">
            <div className="flex flex-col gap-2 p-2">
              <span className="text-3xl font-bold tabular-nums">2</span>
              <p className="text-base font-semibold">Select Sign in</p>
              <p className="text-sm text-(color:--kit-text-2)">The link opens this browser and nothing else.</p>
            </div>
          </Panel>
          <Panel tone="amber" padding="tight">
            <div className="flex flex-col gap-2 p-2">
              <span className="text-3xl font-bold tabular-nums">3</span>
              <p className="text-base font-semibold">You are in</p>
              <p className="text-sm text-(color:--kit-text-2)">No password to type, on a phone or at a console.</p>
            </div>
          </Panel>
        </div>
        <Button variant="ghost">
          <IconArrowLeft /> Use a password instead
        </Button>
      </Canvas>
    </BrowserFrame>
  );
}

function AuthTemplateSessionExpired() {
  return (
    <BrowserFrame url="nordkapp.test/session-expired" look="signal" minHeight={700}>
      <AppFrame
        brand={{ name: 'Nordkapp' }}
        title="Nordkapp"
        subtitle="Control room 1 · console 2 · 14:00 UTC"
        status={
          <StatusPill tone="warning" size="lg">
            Signed out
          </StatusPill>
        }
      >
        <Grid className="h-full grid-rows-[minmax(0,1fr)_auto]">
          <Panel className="col-span-7" tone="warning">
            <div className="flex flex-1 flex-col justify-between gap-6">
              <p className="text-lg font-semibold">Session</p>
              <div className="flex items-center gap-5">
                <IconClock className="size-20 shrink-0" stroke={2.2} aria-hidden="true" />
                <p className="text-7xl leading-none font-extrabold tracking-tighter">Session expired</p>
              </div>
              <p className="max-w-xl text-xl font-medium">You were signed out after 30 minutes without activity. Alarms kept sounding in the control room the whole time.</p>
            </div>
          </Panel>
          <Panel className="col-span-5" title="Sign in again" subtitle={AUTH_EMAIL}>
            <form className="flex flex-1 flex-col justify-between gap-4" onSubmit={(event) => event.preventDefault()}>
              <AuthPasswordField />
              <DetailList
                items={[
                  { label: 'Signed out at', value: '13:59:30 UTC' },
                  { label: 'Reason', value: 'Idle for 30 minutes' },
                  { label: 'Console', value: 'Control room 1, console 2' },
                ]}
              />
              <div className="flex flex-col gap-2.5">
                <Button type="submit" size="lg" className="w-full">
                  Sign in and continue
                </Button>
                <Button type="button" variant="outline" size="lg" className="w-full">
                  <IconLogout /> Switch account
                </Button>
              </div>
            </form>
          </Panel>
          <Stat className="col-span-4" size="lg" tone="success" label="Shift handover draft" state="Saved" stateIcon={<IconCircleCheck />} value="13:29" unit="on this console" />
          <Stat className="col-span-4" size="lg" tone="info" label="Returns you to" state="Alarms" stateIcon={<IconBell />} value="4" unit="active" />
          <Stat
            className="col-span-4"
            size="lg"
            tone="critical"
            label="Raised while away"
            state="1 critical"
            stateIcon={<IconAlertTriangle />}
            value="13:46"
            unit="recompressor trip"
          />
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function AuthTemplateNoProjectAccess() {
  return (
    <BrowserFrame url="nordkapp.test/hammerfest-lng/no-access" look="studio" minHeight={700}>
      <AppFrame variant="topbar" brand={{ name: 'Nordkapp', detail: 'Operations', mark: <IconFlame /> }} tools={<AuthSignedIn />}>
        <Grid className="h-full">
          <AuthPanel
            className="col-span-7"
            tone="warning"
            icon={<IconLock />}
            title="You do not have access to Hammerfest LNG"
            description="You are signed in, but this project is limited to its own operations team. Ask an admin below; most requests are answered within a working day."
            footer="Request reference NK-ACC-2291 · you will get an email either way"
          >
            <form className="flex flex-1 flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
              <FormField label="What do you need it for?" helper="The admins see this with your name and role.">
                {(control) => (
                  <Textarea {...control} className="min-h-24" defaultValue="Comparing recompressor vibration with the Hammerfest booster trains for the 13:46 trip review." />
                )}
              </FormField>
              <StepRail
                label="What happens next"
                orientation="horizontal"
                current={0}
                steps={[
                  { id: 'send', label: 'You send the request', detail: 'Now' },
                  {
                    id: 'review',
                    label: 'An admin reviews it',
                    detail: 'Usually within a day',
                  },
                  {
                    id: 'open',
                    label: 'You get an email',
                    detail: 'With a link to the project',
                  },
                ]}
              />
              <div className="mt-auto flex items-center gap-3">
                <Button type="submit" size="lg">
                  Request access
                </Button>
                <Button type="button" variant="ghost" size="lg">
                  <IconArrowLeft /> Back to Nordkapp production
                </Button>
              </div>
            </form>
          </AuthPanel>
          <div className="col-span-5 flex flex-col gap-(--kit-gap)">
            <Panel className="h-auto" title="Project admins" subtitle="Either can approve">
              <ul>
                {PEOPLE.slice(2, 4).map((person, index) => (
                  <ListRow
                    key={person.id}
                    leading={
                      <Avatar variant={index === 0 ? 'decorative-3' : 'decorative-5'} aria-label={person.name}>
                        <AvatarFallback>{person.initials}</AvatarFallback>
                      </Avatar>
                    }
                    title={person.name}
                    meta={person.role}
                    trailing={<StatusPill tone={index === 0 ? 'success' : 'neutral'}>{index === 0 ? 'Online' : 'Off shift'}</StatusPill>}
                  />
                ))}
              </ul>
            </Panel>
            <Panel className="flex-1" title="Projects you can open" subtitle="Signed in as Ingrid Haugen">
              <ul className="flex flex-1 flex-col justify-between">
                {AUTH_PROJECTS.filter((candidate) => ['nk-prod', 'nk-test', 'vs-arch'].includes(candidate.id)).map((candidate) => (
                  <ListRow
                    key={candidate.id}
                    title={candidate.name}
                    meta={`${candidate.role} · opened ${candidate.lastOpened}`}
                    trailing={<StatusPill tone={candidate.tone}>{candidate.state}</StatusPill>}
                  />
                ))}
              </ul>
            </Panel>
          </div>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function AuthTemplateSignedOut() {
  return (
    <BrowserFrame url="nordkapp.test/signed-out" look="glass" minHeight={700}>
      <Canvas className="flex flex-col items-center justify-center gap-6">
        <AuthPanel
          className="h-auto w-full max-w-xl flex-none"
          align="center"
          tone="teal"
          icon={<IconCircleCheck />}
          title="You are signed out"
          description="Your session on this browser has ended and your handover note was signed at 13:59. On a shared console, close this tab as well."
        >
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg">
              Sign in again <IconArrowRight />
            </Button>
            <Button size="lg" variant="outline">
              Sign in as someone else
            </Button>
          </div>
        </AuthPanel>
        <div className="grid w-full max-w-3xl grid-cols-3 gap-(--kit-gap)">
          <Stat size="md" tone="sky" label="Time on shift" value="7 h 58 min" icon={<IconClock />} target="Day shift, 06:00 to 14:00" />
          <Stat size="md" tone="pink" label="Alarms acknowledged" value={12} icon={<IconBell />} target="1 handed to the evening shift" />
          <Stat size="md" tone="green" label="Handover note" value="Signed" icon={<IconDeviceFloppy />} target="Received by Liv Wold" />
        </div>
      </Canvas>
    </BrowserFrame>
  );
}

export default definePage({
  id: 'auth-pages',
  title: 'Auth pages',
  summary:
    'Whole sign-in, sign-up and recovery screens at page size, each in a different look with its own chrome and composition. Copy one as the starting point of a flow and keep every step of that flow in the same look.',
  guidance: {
    use: [
      'Keep one look and one layout for every step of a flow, so sign-in, verification and reset read as one place.',
      'Fill the space around a short form with something true: the plant, the session, the policy.',
      'Say who is signed in on every page that comes after authentication.',
      'Give each ending (signed out, expired, no access) one clear way forward.',
    ],
    avoid: [
      'A small form alone on an empty page when the screen is wide.',
      'Telling people whether an email address has an account when they ask for a reset link.',
      'A dead end: every error page needs an action or a person to contact.',
    ],
  },
  source,
  sections: [
    {
      id: 'sign-in',
      title: 'Signing in',
      description: 'The front door, from a single card to a control room verification screen.',
      specimens: [
        {
          id: 'AuthTemplateCenteredSignIn',
          title: 'Centred card',
          note: 'The default sign-in page: pick it when email and password is the main way in.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/auth-pages/AuthPanel.tsx', 'forms/FormField.tsx', 'forms/PasswordInput.tsx'],
          Component: AuthTemplateCenteredSignIn,
        },
        {
          id: 'AuthTemplateSplitScreen',
          title: 'Split screen with live plant',
          note: 'Pick it when the sign-in page is also the first impression of the product and the screen is wide.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/Canvas.tsx', 'kit/auth-pages/AuthPanel.tsx', 'kit/TrendArea.tsx', 'kit/Stat.tsx'],
          Component: AuthTemplateSplitScreen,
        },
        {
          id: 'AuthTemplateSsoOnly',
          title: 'Single sign-on only',
          note: 'Pick it when the organisation has no local passwords and the only choice is the identity provider.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/Stat.tsx', 'forms/FormField.tsx'],
          Component: AuthTemplateSsoOnly,
        },
        {
          id: 'AuthTemplateTwoFactor',
          title: 'Two-factor verification',
          note: 'Pick it for the second step on an operator console, where the session details matter as much as the code.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/auth-pages/CodeInput.tsx', 'kit/auth-pages/DetailList.tsx', 'kit/DataTable.tsx', 'kit/ListRow.tsx'],
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
          note: 'Pick it when creating an account needs more than three fields; the rail shows how much is left.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: [
            'kit/landing-pages/BrowserFrame.tsx',
            'kit/AppFrame.tsx',
            'kit/auth-pages/StepRail.tsx',
            'kit/auth-pages/CodeInput.tsx',
            'kit/auth-pages/ChoiceRow.tsx',
            'forms/FormField.tsx',
          ],
          Component: AuthTemplateSignUpSteps,
        },
        {
          id: 'AuthTemplateInvitation',
          title: 'Invitation acceptance',
          note: 'Pick it when someone arrives from an invitation email and should see what they are joining before they set a password.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: [
            'kit/landing-pages/BrowserFrame.tsx',
            'kit/AppFrame.tsx',
            'kit/auth-pages/PasswordRules.tsx',
            'kit/auth-pages/passwordRules.ts',
            'kit/ListRow.tsx',
            'forms/PasswordInput.tsx',
          ],
          Component: AuthTemplateInvitation,
        },
        {
          id: 'AuthTemplateOrganisationPicker',
          title: 'Organisation picker',
          note: 'Pick it after sign-in when the account belongs to several projects and none is remembered.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/auth-pages/ChoiceRow.tsx', 'kit/auth-pages/DetailList.tsx', 'kit/Stat.tsx'],
          Component: AuthTemplateOrganisationPicker,
        },
      ],
    },
    {
      id: 'recovery',
      title: 'Recovery and passwordless',
      description: 'Getting back in without the password, and being asked to sign in again.',
      specimens: [
        {
          id: 'AuthTemplateResetPassword',
          title: 'Forgot and reset password',
          note: 'Pick it for the page behind the reset link: where the person is in the flow, the form and the policy side by side.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/auth-pages/StepRail.tsx', 'kit/auth-pages/PasswordRules.tsx', 'forms/PasswordInput.tsx'],
          Component: AuthTemplateResetPassword,
        },
        {
          id: 'AuthTemplateMagicLink',
          title: 'Email sign-in link',
          note: 'Pick it as the waiting page of a passwordless sign-in; it says what to do next and when to try again.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/Canvas.tsx', 'kit/auth-pages/AuthPanel.tsx', 'kit/Panel.tsx'],
          Component: AuthTemplateMagicLink,
        },
        {
          id: 'AuthTemplateSessionExpired',
          title: 'Session expired',
          note: 'Pick it on wall screens and shared consoles, where the state has to be read from across the room.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/Stat.tsx', 'forms/PasswordInput.tsx'],
          Component: AuthTemplateSessionExpired,
        },
      ],
    },
    {
      id: 'endings',
      title: 'Endings',
      description: 'Pages that stop a flow and still leave a way forward.',
      specimens: [
        {
          id: 'AuthTemplateNoProjectAccess',
          title: 'No access to project',
          note: 'Pick it when the person is signed in but not allowed into this project; it names the admins and takes the request.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/auth-pages/AuthPanel.tsx', 'kit/ListRow.tsx', 'forms/FormField.tsx'],
          Component: AuthTemplateNoProjectAccess,
        },
        {
          id: 'AuthTemplateSignedOut',
          title: 'Sign-out complete',
          note: 'Pick it as the page after signing out: a calm confirmation and a short account of the session.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/Canvas.tsx', 'kit/auth-pages/AuthPanel.tsx', 'kit/Stat.tsx'],
          Component: AuthTemplateSignedOut,
        },
      ],
    },
  ],
});
