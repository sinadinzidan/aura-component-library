import { Alert, AlertActions, AlertButton, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Badge } from '@cognite/aura/components/badge';
import { Banner, BannerAction, BannerActions, BannerIcon, BannerTitle } from '@cognite/aura/components/banner';
import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupStepper } from '@cognite/aura/components/input-group';
import { Label } from '@cognite/aura/components/label';
import { IconArrowRight, IconCreditCard, IconDownload, IconInfoCircleFilled, IconLock, IconMail } from '@cognite/aura/icons';
import { useState } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { SettingSwitchRow } from '../../../library/forms/SettingSwitchRow';
import { CategoryChart } from '../../../library/industrial/charts/CategoryChart';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { BillingToggle } from '../../../library/patterns/product/BillingToggle';
import type { BillingPeriod } from '../../../library/patterns/product/BillingToggle';
import { DonutBreakdown } from '../../../library/patterns/product/DonutBreakdown';
import { PlanCard } from '../../../library/patterns/product/PlanCard';
import { UsageMeter } from '../../../library/patterns/product/UsageMeter';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { definePage } from '../../types';

import source from './pricing-and-plans.tsx?raw';

const PRICING_EURO = new Intl.NumberFormat('en-US');
const pricingEuro = (amount: number) => `€ ${PRICING_EURO.format(amount)}`;

const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'One site and one team getting its first sources connected.',
    monthly: 400,
    annual: 340,
    featuresLabel: 'Includes',
    features: [
      { id: 'series', label: '10,000 time series' },
      { id: 'seats', label: '10 seats' },
      { id: 'storage', label: '100 GB document storage' },
      { id: 'api', label: '1 M API requests per month' },
      { id: 'sso', label: 'Single sign-on', included: false },
    ],
  },
  {
    id: 'team',
    name: 'Team',
    description: 'Operations and maintenance working from the same data.',
    monthly: 1200,
    annual: 1000,
    featuresLabel: 'Everything in Starter, plus',
    features: [
      { id: 'series', label: '50,000 time series' },
      { id: 'seats', label: '25 seats' },
      { id: 'storage', label: '500 GB document storage' },
      { id: 'api', label: '5 M API requests per month' },
      { id: 'sso', label: 'Single sign-on' },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Several sites, with your own retention and access rules.',
    monthly: null,
    annual: null,
    featuresLabel: 'Everything in Team, plus',
    features: [
      { id: 'series', label: 'Time series by agreement' },
      { id: 'seats', label: 'Unlimited seats' },
      { id: 'region', label: 'Choice of data region' },
      { id: 'audit', label: 'Audit log export' },
      { id: 'support', label: 'Named support contact' },
    ],
  },
] as const;

const PRICING_COMPARISON = [
  { id: 'series', label: 'Time series', values: ['10,000', '50,000', 'By agreement'] },
  { id: 'seats', label: 'Seats', values: ['10', '25', 'Unlimited'] },
  { id: 'storage', label: 'Document storage', values: ['100 GB', '500 GB', 'By agreement'] },
  { id: 'api', label: 'API requests per month', values: ['1 M', '5 M', 'By agreement'] },
  { id: 'retention', label: 'Data retention', values: ['1 year', '5 years', 'Your policy'] },
  { id: 'sso', label: 'Single sign-on', values: ['Not included', 'Included', 'Included'] },
  { id: 'support', label: 'Support', values: ['Email', 'Email, next working day', 'Named contact'] },
] as const;

const PRICING_USAGE = [
  { id: 'api', label: 'API requests', used: 2_140_000, limit: 5_000_000, hint: 'Resets 1 April' },
  { id: 'series', label: 'Time series', used: 46_100, limit: 50_000, hint: '1,284 from Nordkapp' },
  { id: 'storage', label: 'Document storage', used: 212, limit: 500, unit: 'GB', hint: 'P&IDs, procedures, datasheets' },
] as const;

const PRICING_API_HISTORY = [
  { month: 'Oct', requests: 2.9 },
  { month: 'Nov', requests: 3.2 },
  { month: 'Dec', requests: 2.6 },
  { month: 'Jan', requests: 3.8 },
  { month: 'Feb', requests: 4.4 },
  { month: 'Mar', requests: 2.1 },
];

const PRICING_INVOICES = [
  { id: 'INV-2026-0003', period: 'March 2026', issued: '1 Mar 2026', amount: 1480, status: 'Due 31 Mar' },
  { id: 'INV-2026-0002', period: 'February 2026', issued: '1 Feb 2026', amount: 1480, status: 'Paid' },
  { id: 'INV-2026-0001', period: 'January 2026', issued: '1 Jan 2026', amount: 1200, status: 'Paid' },
  { id: 'INV-2025-0012', period: 'December 2025', issued: '1 Dec 2025', amount: 1200, status: 'Paid' },
] as const;

const PRICING_ADD_ONS = [
  { id: 'storage', label: 'Extra document storage', description: '500 GB more for drawings and procedures. € 180 per month.' },
  { id: 'retention', label: 'Extended retention', description: 'Keep time series for 10 years instead of 5. € 280 per month.' },
  { id: 'sandbox', label: 'Sandbox project', description: 'A second project for testing extractors. € 120 per month.' },
] as const;

const PRICING_COSTS = [
  { id: 'plan', label: 'Team plan', value: 1200 },
  { id: 'retention', label: 'Extended retention', value: 280 },
  { id: 'seats', label: 'Extra seats', value: 120 },
];

const pricingNoop = () => undefined;

function pricingPrice(plan: (typeof PRICING_PLANS)[number], period: BillingPeriod): string {
  const amount = period === 'annual' ? plan.annual : plan.monthly;
  return amount === null ? 'Custom' : pricingEuro(amount);
}

function PricingPlanCards({ period }: { period: BillingPeriod }) {
  return (
    <div className="grid w-full grid-cols-3 gap-4">
      {PRICING_PLANS.map((plan) => (
        <PlanCard
          key={plan.id}
          name={plan.name}
          description={plan.description}
          price={pricingPrice(plan, period)}
          period={plan.monthly === null ? undefined : 'per month'}
          priceNote={
            plan.annual === null
              ? 'Priced per site and data volume'
              : period === 'annual'
                ? `${pricingEuro(plan.annual * 12)} billed once a year`
                : 'Billed monthly, cancel any time'
          }
          featuresLabel={plan.featuresLabel}
          features={plan.features}
          highlightLabel={plan.id === 'team' ? 'Recommended' : undefined}
          action={
            plan.id === 'team' ? (
              <Button className="w-full">Choose Team</Button>
            ) : plan.id === 'starter' ? (
              <Button variant="secondary" className="w-full">
                Choose Starter
              </Button>
            ) : (
              <Button variant="secondary" className="w-full">
                Contact sales
              </Button>
            )
          }
        />
      ))}
    </div>
  );
}

function PricingInvoiceTable({ rows }: { rows: readonly (typeof PRICING_INVOICES)[number][] }) {
  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Invoices, newest first</caption>
      <thead>
        <tr className="border-b border-default text-xs text-muted-foreground">
          <th scope="col" className="py-2 pr-4 font-medium">
            Invoice
          </th>
          <th scope="col" className="px-4 py-2 font-medium">
            Period
          </th>
          <th scope="col" className="px-4 py-2 font-medium">
            Status
          </th>
          <th scope="col" className="px-4 py-2 text-right font-medium">
            Amount
          </th>
          <th scope="col" className="py-2 pl-2">
            <span className="sr-only">Download</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((invoice) => (
          <tr key={invoice.id} className="border-b border-default last:border-b-0">
            <th scope="row" className="py-2 pr-4 font-mono text-xs font-normal text-base-foreground">
              {invoice.id}
            </th>
            <td className="px-4 py-2 text-medium-foreground">{invoice.period}</td>
            <td className="px-4 py-2">
              <Badge variant={invoice.status === 'Paid' ? 'success' : 'warning'}>{invoice.status}</Badge>
            </td>
            <td className="px-4 py-2 text-right tabular-nums text-base-foreground">{pricingEuro(invoice.amount)}</td>
            <td className="py-1 pl-2 text-right">
              <IconAction label={`Download ${invoice.id} as PDF`}>
                <IconDownload />
              </IconAction>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PricingPlanThreeTiers() {
  return <PricingPlanCards period="monthly" />;
}

function PricingPlanBillingPeriod() {
  const [period, setPeriod] = useState<BillingPeriod>('annual');

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <BillingToggle value={period} onValueChange={setPeriod} annualNote="Annual billing is two months cheaper on Team" />
      <PricingPlanCards period={period} />
    </div>
  );
}

function PricingPlanCurrentCard() {
  const plan = PRICING_PLANS[0];

  return (
    <PlanCard
      name={plan.name}
      description={plan.description}
      price={pricingEuro(plan.monthly)}
      period="per month"
      priceNote="Renews 1 April 2026"
      features={plan.features.slice(0, 4)}
      current
      action={
        <Button variant="secondary" className="w-full">
          Compare plans
        </Button>
      }
    />
  );
}

function PricingPlanToggleOnly() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const amount = period === 'annual' ? 1000 : 1200;

  return (
    <div className="flex flex-col items-center gap-4">
      <BillingToggle value={period} onValueChange={setPeriod} size="small" />
      <p className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight tabular-nums text-base-foreground">{pricingEuro(amount)}</span>
        <span className="text-sm text-muted-foreground">per month</span>
      </p>
      <p className="text-xs tabular-nums text-muted-foreground">
        {period === 'annual' ? `${pricingEuro(12_000)} billed once a year` : `${pricingEuro(14_400)} over a year`}
      </p>
    </div>
  );
}

function PricingPlanEnterpriseContact() {
  return (
    <div className="flex w-full flex-col gap-4 rounded-xl bg-card-background p-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-base-foreground">More than one site?</h3>
        <p className="text-sm text-medium-foreground">
          Enterprise is priced per site and data volume. Tell us how many sites and tags, and you get a quote within two working days.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button>
          <IconMail /> Request a quote
        </Button>
        <Button variant="ghost">
          Read what Enterprise adds <IconArrowRight />
        </Button>
      </div>
    </div>
  );
}

function PricingPlanComparisonTable() {
  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">What each plan includes</caption>
      <thead>
        <tr className="border-b border-default">
          <th scope="col" className="py-3 pr-4 text-xs font-medium text-muted-foreground">
            Included
          </th>
          {PRICING_PLANS.map((plan) => (
            <th key={plan.id} scope="col" className="w-1/4 px-4 py-3 align-bottom">
              <span className="flex flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-base-foreground">
                  {plan.name}
                  {plan.id === 'team' ? <Badge>Recommended</Badge> : null}
                </span>
                <span className="text-xs font-normal tabular-nums text-muted-foreground">
                  {plan.monthly === null ? 'Custom' : `${pricingEuro(plan.monthly)} per month`}
                </span>
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {PRICING_COMPARISON.map((row) => (
          <tr key={row.id} className="border-b border-default last:border-b-0">
            <th scope="row" className="py-2.5 pr-4 font-normal text-medium-foreground">
              {row.label}
            </th>
            {row.values.map((value, index) => (
              <td
                key={PRICING_PLANS[index].id}
                className={`px-4 py-2.5 tabular-nums ${value === 'Not included' ? 'text-muted-foreground' : 'text-base-foreground'}`}
              >
                {value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PricingPlanUsageMeters() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      {PRICING_USAGE.map((meter) => (
        <UsageMeter key={meter.id} label={meter.label} used={meter.used} limit={meter.limit} unit={'unit' in meter ? meter.unit : undefined} hint={meter.hint} />
      ))}
    </div>
  );
}

function PricingPlanUsageRows() {
  return (
    <div className="flex w-full flex-col gap-4">
      <SectionHeader size="sm" title="Usage this period" description="1–12 March, Team plan" />
      <div className="flex flex-col divide-y divide-default">
        {PRICING_USAGE.map((meter) => (
          <div key={meter.id} className="py-3">
            <UsageMeter
              layout="row"
              label={meter.label}
              used={meter.used}
              limit={meter.limit}
              unit={'unit' in meter ? meter.unit : undefined}
              hint={meter.hint}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingPlanSeatCounter() {
  const included = 25;
  const [seats, setSeats] = useState(27);
  const extra = Math.max(0, seats - included);

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex flex-col">
        <Label htmlFor="pricing-seats">Seats</Label>
        <InputGroup>
          <InputGroupInput
            id="pricing-seats"
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            value={seats}
            onChange={(event) => setSeats(Number.isNaN(event.target.valueAsNumber) ? included : event.target.valueAsNumber)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupStepper
              incrementLabel="Add a seat"
              decrementLabel="Remove a seat"
              incrementDisabled={seats >= 200}
              decrementDisabled={seats <= 1}
              onIncrement={() => setSeats((current) => Math.min(200, current + 1))}
              onDecrement={() => setSeats((current) => Math.max(1, current - 1))}
            />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <dl className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-medium-foreground">Included in Team</dt>
          <dd className="tabular-nums text-base-foreground">{included}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-medium-foreground">Extra seats at € 60</dt>
          <dd className="tabular-nums text-base-foreground">{extra}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-default pt-2 font-medium">
          <dt className="text-base-foreground">Added per month</dt>
          <dd className="tabular-nums text-base-foreground">{pricingEuro(extra * 60)}</dd>
        </div>
      </dl>
    </div>
  );
}

function PricingPlanNearLimit() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <UsageMeter label="Time series" used={46_100} limit={50_000} hint="3,900 left on Team" />
      <p className="text-sm text-medium-foreground">Connecting Hammerfest LNG adds about 9,000 time series.</p>
      <Button variant="secondary" size="sm" className="w-fit">
        Review plan options
      </Button>
    </div>
  );
}

function PricingPlanLimitReached() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <UsageMeter label="Seats" used={25} limit={25} unit="seats" format={String} hint="Invitations are paused" />
      <p className="text-sm text-medium-foreground">Everyone who has access keeps it. To invite more people, add seats or remove a member.</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm">Add seats</Button>
        <Button variant="ghost" size="sm">
          Manage members
        </Button>
      </div>
    </div>
  );
}

function PricingPlanUsageChart() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>API requests per month</CardTitle>
          <CardDescription>Last six months against the Team limit of 5 M</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <Button variant="ghost" size="sm">
            <IconDownload /> Export usage
          </Button>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <CategoryChart
          className="w-full"
          label="API requests per month from October to March, below the limit of 5 million in every month, peaking at 4.4 million in February"
          rows={PRICING_API_HISTORY}
          categoryKey="month"
          series={[{ key: 'requests', label: 'API requests' }]}
          references={[{ value: 5, label: 'Plan limit 5 M', tone: 'neutral' }]}
          unit="M"
          decimals={1}
          domain={[0, 6]}
          ticks={[0, 2, 4, 6]}
          valueLabels
          heightClassName="h-56"
          summary="Highest month: February with 4.4 M, 88% of the limit. March is at 2.1 M with 19 days left."
        />
      </CardContent>
    </Card>
  );
}

function PricingPlanCurrentSummary() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Team plan</CardTitle>
          <CardDescription>Nordkapp project, billed monthly</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <Badge variant="success">Active</Badge>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <div className="flex w-full flex-col gap-4">
          <p className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight tabular-nums text-base-foreground">{pricingEuro(1480)}</span>
            <span className="text-sm text-muted-foreground">per month, with add-ons</span>
          </p>
          <MetadataList
            items={[
              { label: 'Next invoice', value: '1 April 2026' },
              { label: 'Seats', value: '25 of 25 used' },
              { label: 'Add-ons', value: 'Extended retention' },
              { label: 'Billing contact', value: 'Magnus Solberg' },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm">
              Change plan
            </Button>
            <Button variant="ghost" size="sm">
              View invoices
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PricingPlanUpgradeInline() {
  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-dashed border-default p-6">
      <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <IconLock aria-hidden className="size-4" /> Included in Enterprise
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-base-foreground">Audit log export</h3>
        <p className="text-sm text-medium-foreground">
          Send every read and change to your own log store. On Team, the audit log is kept for 90 days and can be viewed here.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm">
          See what Enterprise adds
        </Button>
        <Button variant="ghost" size="sm">
          View audit log
        </Button>
      </div>
    </div>
  );
}

function PricingPlanUpgradeBanner() {
  return (
    <div className="w-full">
      <Banner variant="warning" inset>
        <BannerIcon icon={IconInfoCircleFilled} />
        <BannerTitle>
          <span className="text-base-foreground">Time series are at 92% of the Team limit. New tags stop syncing at 50,000.</span>
        </BannerTitle>
        <BannerActions>
          <BannerAction>Review plan options</BannerAction>
        </BannerActions>
      </Banner>
    </div>
  );
}

function PricingPlanAddOns() {
  const [enabled, setEnabled] = useState<readonly string[]>(['retention']);
  const toggle = (id: string, on: boolean) => setEnabled((current) => (on ? [...current, id] : current.filter((item) => item !== id)));

  return (
    <div className="flex w-full flex-col gap-2">
      <SectionHeader size="sm" title="Add-ons" description="Charged from the day you turn them on." />
      <div className="flex flex-col divide-y divide-default">
        {PRICING_ADD_ONS.map((addOn) => (
          <div key={addOn.id} className="py-3">
            <SettingSwitchRow
              label={addOn.label}
              description={addOn.description}
              checked={enabled.includes(addOn.id)}
              onCheckedChange={(on) => toggle(addOn.id, on)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingPlanChangeConfirmation() {
  return (
    <div className="flex w-full flex-col gap-4 rounded-xl bg-card-background p-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-base-foreground">Change from Starter to Team</h3>
        <p className="text-sm text-medium-foreground">The change takes effect today. Nothing is deleted or re-synced.</p>
      </div>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-medium-foreground">Team, 12–31 March</dt>
          <dd className="tabular-nums text-base-foreground">{pricingEuro(774)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-medium-foreground">Credit for unused Starter</dt>
          <dd className="tabular-nums text-base-foreground">− {pricingEuro(258)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-default pt-2 font-medium">
          <dt className="text-base-foreground">Charged today</dt>
          <dd className="tabular-nums text-base-foreground">{pricingEuro(516)}</dd>
        </div>
        <div className="flex justify-between gap-4 text-muted-foreground">
          <dt>From 1 April</dt>
          <dd className="tabular-nums">{pricingEuro(1200)} per month</dd>
        </div>
      </dl>
      <div className="flex justify-end gap-2">
        <Button variant="ghost">Keep Starter</Button>
        <Button>Confirm change to Team</Button>
      </div>
    </div>
  );
}

function PricingPlanInvoiceList() {
  return <PricingInvoiceTable rows={PRICING_INVOICES} />;
}

function PricingPlanPaymentMethod() {
  return (
    <div className="flex w-full flex-col gap-3">
      <span className="text-xs font-medium text-muted-foreground">Payment method</span>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted-background text-base-foreground">
          <IconCreditCard className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-medium text-base-foreground">
            Card ending <span className="font-mono">4417</span>
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">Expires 08/2027</span>
        </span>
      </div>
      <Button variant="secondary" size="sm" className="w-fit">
        Update payment method
      </Button>
    </div>
  );
}

function PricingPlanBillingSummary() {
  return (
    <div className="flex w-full flex-col gap-4">
      <SectionHeader size="sm" title="Next invoice" description="Issued 1 April 2026" />
      <dl className="flex flex-col gap-2 text-sm">
        {PRICING_COSTS.map((cost) => (
          <div key={cost.id} className="flex justify-between gap-4">
            <dt className="text-medium-foreground">{cost.label}</dt>
            <dd className="tabular-nums text-base-foreground">{pricingEuro(cost.value)}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4">
          <dt className="text-medium-foreground">VAT 25%</dt>
          <dd className="tabular-nums text-base-foreground">{pricingEuro(400)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-default pt-2 text-base font-semibold">
          <dt className="text-base-foreground">Total</dt>
          <dd className="tabular-nums text-base-foreground">{pricingEuro(2000)}</dd>
        </div>
      </dl>
    </div>
  );
}

function PricingPlanCostBreakdown() {
  return (
    <div className="flex w-full flex-col gap-4">
      <SectionHeader size="sm" title="Where the monthly cost goes" description="March 2026, before VAT" />
      <DonutBreakdown label="Monthly cost by item" segments={PRICING_COSTS} format={pricingEuro} totalLabel="per month" sizeClassName="size-36" />
    </div>
  );
}

function PricingPlanTrialNotice() {
  return (
    <Alert variant="info">
      <AlertTitle>The Team trial ends in 5 days</AlertTitle>
      <AlertDescription>
        On 17 March the project moves to Starter. Data above the Starter limits stays stored but stops updating until you choose a plan.
      </AlertDescription>
      <AlertActions>
        <AlertButton onClick={pricingNoop}>Choose a plan</AlertButton>
        <AlertButton variant="ghost" onClick={pricingNoop}>
          See what changes
        </AlertButton>
      </AlertActions>
    </Alert>
  );
}

function PricingPlanDowngradeImpact() {
  return (
    <div className="flex w-full flex-col gap-4 rounded-xl bg-card-background p-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-base-foreground">Before you move to Starter</h3>
        <p className="text-sm text-medium-foreground">Three things in this project are above what Starter includes.</p>
      </div>
      <ul className="flex flex-col gap-3 text-sm">
        <li className="flex justify-between gap-4">
          <span className="text-base-foreground">Time series</span>
          <span className="tabular-nums text-medium-foreground">46,100 in use, 10,000 included</span>
        </li>
        <li className="flex justify-between gap-4">
          <span className="text-base-foreground">Seats</span>
          <span className="tabular-nums text-medium-foreground">25 in use, 10 included</span>
        </li>
        <li className="flex justify-between gap-4">
          <span className="text-base-foreground">Single sign-on</span>
          <span className="text-medium-foreground">Turned off; people sign in with email</span>
        </li>
      </ul>
      <div className="flex justify-end gap-2">
        <Button variant="ghost">Keep Team</Button>
        <Button variant="secondary">Choose what to keep</Button>
      </div>
    </div>
  );
}

function PricingPlanBillingPage() {
  return (
    <div className="grid w-full grid-cols-3 gap-4">
      <Card className="col-span-3">
        <CardHeader>
          <CardHeaderCenter>
            <CardTitle>Team plan</CardTitle>
            <CardDescription>Nordkapp project · renews 1 April 2026</CardDescription>
          </CardHeaderCenter>
          <CardHeaderEnd>
            <Button variant="secondary" size="sm">
              Change plan
            </Button>
          </CardHeaderEnd>
        </CardHeader>
        <CardContent>
          <div className="grid w-full grid-cols-3 gap-8">
            {PRICING_USAGE.map((meter) => (
              <UsageMeter key={meter.id} label={meter.label} used={meter.used} limit={meter.limit} unit={'unit' in meter ? meter.unit : undefined} hint={meter.hint} />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-2">
        <CardHeader>
          <CardHeaderCenter>
            <CardTitle>Invoices</CardTitle>
          </CardHeaderCenter>
          <CardHeaderEnd>
            <Button variant="ghost" size="sm">
              View all <IconArrowRight />
            </Button>
          </CardHeaderEnd>
        </CardHeader>
        <CardContent>
          <PricingInvoiceTable rows={PRICING_INVOICES.slice(0, 3)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardHeaderCenter>
            <CardTitle>Next invoice</CardTitle>
            <CardDescription>1 April 2026</CardDescription>
          </CardHeaderCenter>
        </CardHeader>
        <CardContent>
          <div className="flex w-full flex-col gap-2">
            <span className="text-3xl font-semibold tracking-tight tabular-nums text-base-foreground">{pricingEuro(2000)}</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {pricingEuro(1600)} plus {pricingEuro(400)} VAT · card ending <span className="font-mono">4417</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default definePage({
  id: 'pricing-and-plans',
  title: 'Pricing and plans',
  summary:
    'Everything around what a workspace pays for: plan cards and comparisons, usage against limits, upgrade prompts, add-ons, invoices and the summaries that confirm a change.',
  guidance: {
    use: [
      'A written label such as "Recommended" on the plan you suggest, never colour alone.',
      'One currency and one number format throughout, with tabular figures.',
      'Usage as "used of limit" with a bar; add the state in words once it nears the limit.',
      'A confirmation summary that states what is charged today and what changes later.',
    ],
    avoid: [
      'Countdown timers, strike-through prices and other pressure tactics.',
      'Blocking the product at a limit without saying what still works and how to continue.',
      'Hiding the cheaper plan or the way to downgrade.',
      'Status colour on a plan card; colour is for usage states and invoice status only.',
    ],
  },
  source,
  sections: [
    {
      id: 'plans',
      title: 'Plans',
      description: 'Choosing between plans: cards, the billing period and a full comparison.',
      specimens: [
        {
          id: 'PricingPlanThreeTiers',
          title: 'Three plan cards',
          note: 'The standard pricing row; the recommended plan is marked by a label and a stronger outline.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/PlanCard.tsx'],
          Component: PricingPlanThreeTiers,
        },
        {
          id: 'PricingPlanBillingPeriod',
          title: 'With monthly and annual toggle',
          note: 'When both billing periods are offered; prices and notes follow the toggle.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/PlanCard.tsx', 'patterns/product/BillingToggle.tsx'],
          Component: PricingPlanBillingPeriod,
        },
        {
          id: 'PricingPlanCurrentCard',
          title: 'Current plan card',
          note: 'The plan a workspace is on, marked in words, inside settings or an upgrade flow.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['patterns/product/PlanCard.tsx'],
          Component: PricingPlanCurrentCard,
        },
        {
          id: 'PricingPlanToggleOnly',
          title: 'Billing toggle with one price',
          note: 'A single product with two billing periods; the yearly total is spelled out.',
          origin: 'custom',
          size: 'sm',
          uses: ['patterns/product/BillingToggle.tsx'],
          Component: PricingPlanToggleOnly,
        },
        {
          id: 'PricingPlanEnterpriseContact',
          title: 'Enterprise contact card',
          note: 'A plan with no list price: says how it is priced and how long a quote takes.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: PricingPlanEnterpriseContact,
        },
        {
          id: 'PricingPlanComparisonTable',
          title: 'Plan comparison table',
          note: 'Every difference between plans as values in words, for readers who compare line by line.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: PricingPlanComparisonTable,
        },
      ],
    },
    {
      id: 'usage',
      title: 'Usage and limits',
      description: 'How much of a plan is used, and what happens near and at the limit.',
      specimens: [
        {
          id: 'PricingPlanUsageMeters',
          title: 'Usage meters',
          note: 'The metered resources of a plan, stacked, each with used, limit and a hint.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/product/UsageMeter.tsx'],
          Component: PricingPlanUsageMeters,
        },
        {
          id: 'PricingPlanUsageRows',
          title: 'Usage meter rows',
          note: 'The same meters on one line each, for a settings page with many resources.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/product/UsageMeter.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: PricingPlanUsageRows,
        },
        {
          id: 'PricingPlanNearLimit',
          title: 'Near the limit',
          note: 'Warns early, says what would push usage over, and offers a way forward.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['patterns/product/UsageMeter.tsx'],
          Component: PricingPlanNearLimit,
        },
        {
          id: 'PricingPlanLimitReached',
          title: 'Limit reached',
          note: 'At the limit: states what is paused, what still works and the two ways out.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['patterns/product/UsageMeter.tsx'],
          Component: PricingPlanLimitReached,
        },
        {
          id: 'PricingPlanSeatCounter',
          title: 'Seat counter',
          note: 'Changing a quantity with the cost of the change worked out as you step.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: PricingPlanSeatCounter,
        },
        {
          id: 'PricingPlanUsageChart',
          title: 'Usage over time',
          note: 'Six months of a metered resource against its limit, to judge whether the plan still fits.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: PricingPlanUsageChart,
        },
      ],
    },
    {
      id: 'changing-plans',
      title: 'Current plan and changes',
      description: 'What the workspace is on, prompts to upgrade, add-ons and the summary before a change.',
      specimens: [
        {
          id: 'PricingPlanCurrentSummary',
          title: 'Current plan summary',
          note: 'The top of a billing page: plan, price, next invoice and the two usual actions.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: PricingPlanCurrentSummary,
        },
        {
          id: 'PricingPlanAddOns',
          title: 'Add-on rows with toggles',
          note: 'Optional extras that can be turned on one by one, each with its price in the description.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/SettingSwitchRow.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: PricingPlanAddOns,
        },
        {
          id: 'PricingPlanUpgradeBanner',
          title: 'Upgrade prompt, banner',
          note: 'A limit that affects the whole workspace, shown once at the top of the page.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: PricingPlanUpgradeBanner,
        },
        {
          id: 'PricingPlanUpgradeInline',
          title: 'Upgrade prompt, inline',
          note: 'In the place of a feature the plan lacks: what it does, and what the current plan offers instead.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PricingPlanUpgradeInline,
        },
        {
          id: 'PricingPlanChangeConfirmation',
          title: 'Plan change confirmation',
          note: 'The last step before a change: prorated charge today, the new price, and a way back.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PricingPlanChangeConfirmation,
        },
        {
          id: 'PricingPlanTrialNotice',
          title: 'Trial ending notice',
          note: 'Says the date, what happens to the data, and how to avoid it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PricingPlanTrialNotice,
        },
        {
          id: 'PricingPlanDowngradeImpact',
          title: 'Downgrade impact',
          note: 'Before moving down: lists what is above the lower plan, in use against included.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PricingPlanDowngradeImpact,
        },
      ],
    },
    {
      id: 'billing',
      title: 'Billing',
      description: 'Invoices, the payment method and what the next invoice is made of.',
      specimens: [
        {
          id: 'PricingPlanInvoiceList',
          title: 'Invoice list',
          note: 'Past invoices with status and a download per row.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/collections/IconAction.tsx'],
          Component: PricingPlanInvoiceList,
        },
        {
          id: 'PricingPlanPaymentMethod',
          title: 'Payment method',
          note: 'The card on file with its expiry and the one action to replace it.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: PricingPlanPaymentMethod,
        },
        {
          id: 'PricingPlanBillingSummary',
          title: 'Billing summary',
          note: 'The line items of the next invoice, with tax and total.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx'],
          Component: PricingPlanBillingSummary,
        },
        {
          id: 'PricingPlanCostBreakdown',
          title: 'Cost breakdown',
          note: 'How the monthly cost splits between the plan and its extras.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/product/DonutBreakdown.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: PricingPlanCostBreakdown,
        },
      ],
    },
    {
      id: 'full-page',
      title: 'Full block',
      description: 'The pieces assembled into a billing overview.',
      specimens: [
        {
          id: 'PricingPlanBillingPage',
          title: 'Billing overview',
          note: 'Plan with usage, the next invoice and recent invoices on one screen.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/UsageMeter.tsx', 'patterns/collections/IconAction.tsx'],
          Component: PricingPlanBillingPage,
        },
      ],
    },
  ],
});
