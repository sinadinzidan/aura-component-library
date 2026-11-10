import { Alert, AlertActions, AlertButton, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import {
  CheckboxGroup,
  CheckboxItem,
  CheckboxItemControl,
  CheckboxItemDescription,
  CheckboxItemLabel,
} from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import { Progress } from '@cognite/aura/components/progress';
import { Separator } from '@cognite/aura/components/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconArrowLeft, IconArrowRight, IconCheck } from '@cognite/aura/icons';
import { useState } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { LabelledProgress } from '../../../library/feedback/LabelledProgress';
import { ChoiceCardGroup } from '../../../library/forms/ChoiceCardGroup';
import { FormField } from '../../../library/forms/FormField';
import { SelectAllCheckboxList } from '../../../library/forms/SelectAllCheckboxList';
import { FormActions } from '../../../library/patterns/data-entry/FormActions';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { PanelFrame } from '../../../library/patterns/data-entry/PanelFrame';
import { SetupChecklist } from '../../../library/patterns/data-entry/SetupChecklist';
import { Stepper } from '../../../library/patterns/data-entry/Stepper';
import type { StepperStep } from '../../../library/patterns/data-entry/Stepper';
import { WizardFrame } from '../../../library/patterns/data-entry/WizardFrame';
import { definePage } from '../../types';

import source from './wizards.tsx?raw';

const PIPELINE_STEPS: readonly StepperStep[] = [
  { id: 'source', label: 'Source', description: 'Where the data comes from.' },
  { id: 'mapping', label: 'Mapping', description: 'Match tags to assets.' },
  { id: 'schedule', label: 'Schedule', description: 'When the pipeline runs.' },
  { id: 'review', label: 'Review', description: 'Check and create.' },
];

const SHORT_STEPS: readonly StepperStep[] = [
  { id: 'source', label: 'Source' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'review', label: 'Review' },
];

const SOURCE_OPTIONS = [
  { value: 'opc-ua', label: 'OPC UA server' },
  { value: 'pi', label: 'PI historian' },
  { value: 'sql', label: 'SQL database' },
];

const INTERVAL_OPTIONS = [
  { value: '15m', label: 'Every 15 minutes' },
  { value: '1h', label: 'Every hour' },
  { value: '1d', label: 'Every day at 02:00' },
];

const DATA_SET_OPTIONS = [
  { value: 'telemetry', label: 'Compressor telemetry' },
  { value: 'alarms', label: 'Alarm history' },
  { value: 'lab', label: 'Lab results' },
];

function labelOf(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? '';
}

function WizardHorizontalStepper() {
  return <Stepper steps={PIPELINE_STEPS} current={1} label="Create pipeline" />;
}

function WizardCompactCount() {
  const [current, setCurrent] = useState(1);
  const step = PIPELINE_STEPS[current];
  const next = PIPELINE_STEPS[current + 1];
  return (
    <div className="flex w-full max-w-xs items-center gap-3">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous step"
              disabled={current === 0}
              onClick={() => setCurrent(current - 1)}
            >
              <IconArrowLeft />
            </Button>
          }
        />
        <TooltipContent>Previous step</TooltipContent>
      </Tooltip>
      <div aria-live="polite" className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs tabular-nums text-muted-foreground">
          Step {current + 1} of {PIPELINE_STEPS.length}
        </span>
        <span className="truncate text-sm font-medium text-base-foreground">{step.label}</span>
        <span className="truncate text-xs text-muted-foreground">{next ? `Next: ${next.label}` : 'Last step'}</span>
      </div>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next step"
              disabled={current === PIPELINE_STEPS.length - 1}
              onClick={() => setCurrent(current + 1)}
            >
              <IconArrowRight />
            </Button>
          }
        />
        <TooltipContent>Next step</TooltipContent>
      </Tooltip>
    </div>
  );
}

function WizardVerticalStepper() {
  return (
    <div className="w-full max-w-xs">
      <Stepper steps={PIPELINE_STEPS} current={2} orientation="vertical" label="Create pipeline" />
    </div>
  );
}

function WizardProgressBar() {
  const current = 1;
  const step = PIPELINE_STEPS[current];
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">{step.label}</span>
        <span className="text-sm tabular-nums text-muted-foreground">
          Step {current + 1} of {PIPELINE_STEPS.length}
        </span>
      </div>
      <Progress
        value={current + 1}
        max={PIPELINE_STEPS.length}
        size="sm"
        aria-label="Create pipeline progress"
        aria-valuetext={`Step ${current + 1} of ${PIPELINE_STEPS.length}: ${step.label}`}
      />
      <p className="text-xs text-muted-foreground">{step.description}</p>
    </div>
  );
}

function WizardStepStates() {
  return (
    <Stepper
      label="Step states"
      current={2}
      steps={[
        { id: 'done', label: 'Done' },
        { id: 'error', label: 'Error', state: 'error' },
        { id: 'current', label: 'Current' },
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'disabled', label: 'Locked', state: 'disabled' },
      ]}
    />
  );
}

function WizardOptionalAndDisabled() {
  return (
    <div className="w-full max-w-xs">
      <Stepper
        label="Connect historian"
        orientation="vertical"
        current={1}
        steps={[
          { id: 'connect', label: 'Connect', description: 'historian.nordkapp.test' },
          { id: 'select', label: 'Select tags', description: '1,284 tags found.' },
          { id: 'backfill', label: 'Backfill history', description: 'Load data from before today.', optional: true },
          { id: 'start', label: 'Start extraction', description: 'Available once tags are selected.', state: 'disabled' },
        ]}
      />
    </div>
  );
}

function WizardFrameBasic() {
  const [current, setCurrent] = useState(0);
  const [sourceType, setSourceType] = useState('opc-ua');
  const [runInterval, setRunInterval] = useState('15m');
  return (
    <WizardFrame
      title="Create pipeline"
      steps={SHORT_STEPS}
      current={current}
      finishLabel="Create pipeline"
      onBack={() => setCurrent(current - 1)}
      onNext={() => setCurrent(current + 1)}
      onFinish={() => setCurrent(0)}
    >
      <div className="min-h-24">
        {current === 0 ? (
          <FormField label="Source type" required>
            {(control) => (
              <OptionSelect {...control} options={SOURCE_OPTIONS} value={sourceType} onValueChange={setSourceType} />
            )}
          </FormField>
        ) : null}
        {current === 1 ? (
          <FormField label="Run" required helper="You can change the schedule later.">
            {(control) => (
              <OptionSelect {...control} options={INTERVAL_OPTIONS} value={runInterval} onValueChange={setRunInterval} />
            )}
          </FormField>
        ) : null}
        {current === 2 ? (
          <MetadataList
            items={[
              { label: 'Source', value: labelOf(SOURCE_OPTIONS, sourceType) },
              { label: 'Schedule', value: labelOf(INTERVAL_OPTIONS, runInterval) },
            ]}
          />
        ) : null}
      </div>
    </WizardFrame>
  );
}

function WizardFrameCompact() {
  const [current, setCurrent] = useState(1);
  return (
    <WizardFrame
      title="Create pipeline"
      indicator="count"
      steps={PIPELINE_STEPS}
      current={current}
      finishLabel="Create pipeline"
      onCancel={() => setCurrent(0)}
      onBack={() => setCurrent(current - 1)}
      onNext={() => setCurrent(current + 1)}
      onFinish={() => setCurrent(0)}
    >
      <div className="flex min-h-24 flex-col gap-1">
        <span className="text-sm font-medium text-base-foreground">{PIPELINE_STEPS[current].label}</span>
        <p className="text-sm text-muted-foreground">{PIPELINE_STEPS[current].description}</p>
      </div>
    </WizardFrame>
  );
}

function WizardFrameProgress() {
  const [current, setCurrent] = useState(2);
  return (
    <WizardFrame
      title="Create pipeline"
      indicator="progress"
      steps={PIPELINE_STEPS}
      current={current}
      finishLabel="Create pipeline"
      onBack={() => setCurrent(current - 1)}
      onNext={() => setCurrent(current + 1)}
      onFinish={() => setCurrent(0)}
    >
      <div className="flex min-h-24 flex-col gap-1">
        <span className="text-sm font-medium text-base-foreground">{PIPELINE_STEPS[current].label}</span>
        <p className="text-sm text-muted-foreground">{PIPELINE_STEPS[current].description}</p>
      </div>
    </WizardFrame>
  );
}

function WizardBlockedNext() {
  const [dataSet, setDataSet] = useState('');
  const [current, setCurrent] = useState(0);
  return (
    <WizardFrame
      title="Import lab results"
      steps={[
        { id: 'destination', label: 'Destination' },
        { id: 'upload', label: 'Upload' },
        { id: 'review', label: 'Review' },
      ]}
      current={current}
      finishLabel="Import results"
      blockedReason={current === 0 && dataSet === '' ? 'Select a data set to continue.' : undefined}
      onBack={() => setCurrent(current - 1)}
      onNext={() => setCurrent(current + 1)}
      onFinish={() => {
        setCurrent(0);
        setDataSet('');
      }}
    >
      <div className="min-h-24">
        {current === 0 ? (
          <FormField label="Data set" required>
            {(control) => (
              <OptionSelect
                {...control}
                options={DATA_SET_OPTIONS}
                value={dataSet}
                onValueChange={setDataSet}
                placeholder="Select a data set"
              />
            )}
          </FormField>
        ) : (
          <p className="text-sm text-muted-foreground">
            Results go to <span className="font-medium text-base-foreground">{labelOf(DATA_SET_OPTIONS, dataSet)}</span>.
          </p>
        )}
      </div>
    </WizardFrame>
  );
}

function WizardDialog() {
  const [current, setCurrent] = useState(0);
  const last = current === 2;
  return (
    <div className="w-full max-w-md">
      <PanelFrame
        title="Invite people"
        description={`Step ${current + 1} of 3`}
        onClose={() => setCurrent(0)}
        closeLabel="Close dialog"
        headerExtra={<Progress value={current + 1} max={3} size="sm" aria-label="Invite progress" />}
        footer={
          <FormActions>
            {current > 0 ? (
              <Button variant="secondary" onClick={() => setCurrent(current - 1)}>
                Back
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setCurrent(0)}>
                Cancel
              </Button>
            )}
            <Button onClick={() => setCurrent(last ? 0 : current + 1)}>{last ? 'Send 2 invites' : 'Next'}</Button>
          </FormActions>
        }
      >
        <div className="min-h-28">
          {current === 0 ? (
            <FormField label="Email addresses" required helper="Separate addresses with a comma.">
              {(control) => <Input {...control} defaultValue="jonas.nyberg@nordkapp.test, liv.wold@nordkapp.test" />}
            </FormField>
          ) : null}
          {current === 1 ? (
            <FormField label="Role" required helper="Operators view data and acknowledge alarms.">
              {(control) => (
                <OptionSelect
                  {...control}
                  options={[
                    { value: 'operator', label: 'Operator' },
                    { value: 'engineer', label: 'Engineer' },
                  ]}
                  defaultValue="operator"
                />
              )}
            </FormField>
          ) : null}
          {current === 2 ? (
            <MetadataList
              items={[
                { label: 'People', value: '2' },
                { label: 'Role', value: 'Operator' },
                { label: 'Site', value: 'Nordkapp' },
              ]}
            />
          ) : null}
        </div>
      </PanelFrame>
    </div>
  );
}

function WizardSidePanel() {
  const steps: readonly StepperStep[] = [
    { id: 'isolate', label: 'Confirm isolation', description: 'Permit PTW-2291 is closed.' },
    { id: 'instruments', label: 'Check instruments', description: '12 of 12 transmitters report good quality.' },
    { id: 'limits', label: 'Verify alarm limits', description: 'Compare against the trip matrix.' },
    { id: 'start', label: 'Approve start-up', description: 'Shift supervisor signs off.' },
  ];
  const [current, setCurrent] = useState(2);
  return (
    <div className="w-full max-w-xs">
      <PanelFrame
        title="Return to service"
        description="23-KA-9103 Recompressor"
        onClose={() => setCurrent(0)}
        closeLabel="Close panel"
        footer={
          <FormActions>
            <Button variant="secondary" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
              Back
            </Button>
            <Button onClick={() => setCurrent(current === steps.length - 1 ? 0 : current + 1)}>
              {current === steps.length - 1 ? 'Approve start-up' : 'Continue'}
            </Button>
          </FormActions>
        }
      >
        <Stepper steps={steps} current={current} orientation="vertical" label="Return to service" onStepSelect={setCurrent} />
      </PanelFrame>
    </div>
  );
}

function WizardReviewStep() {
  return (
    <WizardFrame
      title="Create pipeline"
      indicator="count"
      steps={PIPELINE_STEPS}
      current={3}
      finishLabel="Create pipeline"
      onBack={() => undefined}
      onNext={() => undefined}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <h4 className="text-sm font-semibold text-base-foreground">Source</h4>
            <Button variant="ghost" size="sm" aria-label="Edit source">
              Edit
            </Button>
          </div>
          <MetadataList
            items={[
              { label: 'Type', value: 'OPC UA server' },
              { label: 'Address', value: 'historian.nordkapp.test:4840' },
              { label: 'Tags', value: '128 of 1,284' },
            ]}
          />
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <h4 className="text-sm font-semibold text-base-foreground">Schedule</h4>
            <Button variant="ghost" size="sm" aria-label="Edit schedule">
              Edit
            </Button>
          </div>
          <MetadataList
            items={[
              { label: 'Runs', value: 'Every 15 minutes' },
              { label: 'First run', value: '12 Mar 2026, 14:15' },
            ]}
          />
        </div>
      </div>
    </WizardFrame>
  );
}

function WizardSuccessStep() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-success-background text-success-foreground">
        <IconCheck aria-hidden="true" className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold text-base-foreground">Pipeline created</h3>
        <p className="text-sm text-muted-foreground">
          Compressor telemetry ingest runs every 15 minutes. The first run starts at 14:15.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary">Create another</Button>
        <Button>View pipeline</Button>
      </div>
    </div>
  );
}

function WizardBranching() {
  const [method, setMethod] = useState('file');
  const steps: readonly StepperStep[] =
    method === 'file'
      ? [
          { id: 'method', label: 'Method' },
          { id: 'upload', label: 'Upload' },
          { id: 'columns', label: 'Columns' },
          { id: 'review', label: 'Review' },
        ]
      : [
          { id: 'method', label: 'Method' },
          { id: 'connect', label: 'Connect' },
          { id: 'review', label: 'Review' },
        ];
  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <Stepper steps={steps} current={0} label="Import assets" />
      <ChoiceCardGroup
        label="How do you want to import assets?"
        layout="grid"
        value={method}
        onValueChange={setMethod}
        options={[
          { value: 'file', label: 'Upload a file', description: 'CSV or Excel, up to 50 MB.' },
          { value: 'sap', label: 'Sync from SAP', description: 'Keeps assets up to date.' },
        ]}
        helperText={`${steps.length - 1} more ${steps.length - 1 === 1 ? 'step' : 'steps'} after this one.`}
      />
    </div>
  );
}

function WizardOptionalStep() {
  const steps: readonly StepperStep[] = [
    { id: 'source', label: 'Source' },
    { id: 'backfill', label: 'Backfill', optional: true },
    { id: 'review', label: 'Review' },
  ];
  const [current, setCurrent] = useState(1);
  const [skipped, setSkipped] = useState(false);
  return (
    <WizardFrame
      title="Connect historian"
      steps={steps}
      current={current}
      finishLabel="Start extraction"
      onBack={() => setCurrent(current - 1)}
      onNext={() => {
        setSkipped(false);
        setCurrent(current + 1);
      }}
      onSkip={() => {
        setSkipped(true);
        setCurrent(current + 1);
      }}
      onFinish={() => setCurrent(1)}
    >
      <div className="min-h-24">
        {current === 1 ? (
          <FormField label="Load history from" helper="Leave this step out to start from today.">
            {(control) => (
              <OptionSelect
                {...control}
                options={[
                  { value: '30d', label: 'The last 30 days' },
                  { value: '1y', label: 'The last year' },
                  { value: 'all', label: 'Everything the source has' },
                ]}
                defaultValue="30d"
              />
            )}
          </FormField>
        ) : (
          <p className="text-sm text-muted-foreground">
            {current === 2
              ? skipped
                ? 'No backfill. Extraction starts from today.'
                : 'Backfill: the last 30 days, then live extraction.'
              : 'historian.nordkapp.test is connected.'}
          </p>
        )}
      </div>
    </WizardFrame>
  );
}

function WizardErrorStep() {
  const [failed, setFailed] = useState(true);
  const steps: readonly StepperStep[] = [
    { id: 'source', label: 'Source' },
    { id: 'connect', label: 'Connect', state: failed ? 'error' : undefined },
    { id: 'review', label: 'Review' },
  ];
  return (
    <WizardFrame
      title="Connect historian"
      steps={steps}
      current={1}
      blockedReason={failed ? 'Fix the connection to continue.' : undefined}
      onBack={() => setFailed(true)}
      onNext={() => setFailed(true)}
    >
      <div className="min-h-24">
        {failed ? (
          <Alert variant="error">
            <AlertTitle>Connection failed</AlertTitle>
            <AlertDescription>
              historian.nordkapp.test did not answer on port 4840. Check the firewall, then try again. Your settings
              are kept.
            </AlertDescription>
            <AlertActions>
              <AlertButton onClick={() => setFailed(false)}>Try again</AlertButton>
            </AlertActions>
          </Alert>
        ) : (
          <p className="text-sm text-muted-foreground">Connected. 1,284 tags found on historian.nordkapp.test.</p>
        )}
      </div>
    </WizardFrame>
  );
}

function WizardResumeDraft() {
  const [resumed, setResumed] = useState(false);
  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-muted-background p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-base-foreground">
          {resumed ? 'Schedule' : 'Continue creating your pipeline?'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {resumed
            ? 'Source and mapping are filled in from your draft.'
            : 'You stopped at step 3 of 4 on 11 Mar. The draft is saved for 30 days.'}
        </p>
      </div>
      <Progress value={resumed ? 3 : 2} max={4} size="sm" aria-label="Draft progress" aria-valuetext="2 of 4 steps done" />
      <div className="flex items-center gap-2">
        {resumed ? (
          <Button variant="secondary" onClick={() => setResumed(false)}>
            Save and close
          </Button>
        ) : (
          <>
            <Button onClick={() => setResumed(true)}>Continue setup</Button>
            <Button variant="ghost">Start over</Button>
          </>
        )}
      </div>
    </div>
  );
}

function WizardSetupChecklist() {
  const initial = [
    { id: 'source', label: 'Connect a data source', done: true, actionLabel: 'Connect source' },
    { id: 'assets', label: 'Import the asset hierarchy', done: true, actionLabel: 'Import assets' },
    {
      id: 'tags',
      label: 'Map tags to assets',
      description: '128 of 1,284 tags are mapped.',
      done: false,
      actionLabel: 'Map tags',
    },
    { id: 'limits', label: 'Set alarm limits', description: 'Copy them from the trip matrix.', done: false, actionLabel: 'Set limits' },
    { id: 'people', label: 'Invite the control room', done: false, actionLabel: 'Invite people' },
  ];
  const [items, setItems] = useState(initial);
  const allDone = items.every((item) => item.done);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <SetupChecklist
        title="Set up Nordkapp"
        items={items}
        completeText="Ready for operations"
        onAction={(id) => setItems((current) => current.map((item) => (item.id === id ? { ...item, done: true } : item)))}
      />
      {allDone ? (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setItems(initial)}>
            Reset checklist
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function WizardCommissioningChecklist() {
  const checks = [
    { id: 'loop', label: 'Loop checks complete', signed: 'Jonas Nyberg, 12 Mar 09:40' },
    { id: 'esd', label: 'Shutdown valves stroke-tested', signed: 'Tomás Barros, 12 Mar 10:15' },
    { id: 'vibration', label: 'Vibration probes calibrated', signed: 'Aisha Khan, 12 Mar 11:05' },
    { id: 'lube', label: 'Lube oil system running', signed: '' },
    { id: 'purge', label: 'Casing purged and pressurised', signed: '' },
  ];
  const [done, setDone] = useState(['loop', 'esd', 'vibration']);
  const remaining = checks.length - done.length;
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <LabelledProgress
        label="Commissioning, 23-KA-9103"
        value={done.length}
        max={checks.length}
        valueText={`${done.length} of ${checks.length} signed`}
        size="sm"
      />
      <CheckboxGroup aria-label="Commissioning checks">
        {checks.map((check) => (
          <CheckboxItem key={check.id}>
            <CheckboxItemControl
              checked={done.includes(check.id)}
              onCheckedChange={(checked) =>
                setDone((current) => (checked ? [...current, check.id] : current.filter((id) => id !== check.id)))
              }
            />
            <CheckboxItemLabel>{check.label}</CheckboxItemLabel>
            <CheckboxItemDescription>
              {done.includes(check.id) ? `Signed by ${check.signed || 'you, just now'}` : 'Not signed'}
            </CheckboxItemDescription>
          </CheckboxItem>
        ))}
      </CheckboxGroup>
      <FormActions status={remaining > 0 ? `${remaining} ${remaining === 1 ? 'check' : 'checks'} left to sign.` : 'All checks signed.'}>
        <Button disabled={remaining > 0}>Approve start-up</Button>
      </FormActions>
    </div>
  );
}

function WizardPipelineSetup() {
  const [current, setCurrent] = useState(1);
  const [sourceType, setSourceType] = useState('opc-ua');
  const [areas, setAreas] = useState(['compression']);
  const [runInterval, setRunInterval] = useState('15m');
  const [created, setCreated] = useState(false);
  const areaOptions = [
    { id: 'separation', label: 'Inlet and separation', description: '212 tags' },
    { id: 'compression', label: 'Gas compression', description: '128 tags' },
    { id: 'export', label: 'Gas export', description: '96 tags' },
  ];
  const selectedAreas = areaOptions.filter((area) => areas.includes(area.id)).map((area) => area.label);

  if (created) {
    return (
      <div className="flex w-full flex-col items-center gap-4 py-6 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-success-background text-success-foreground">
          <IconCheck aria-hidden="true" className="size-5" />
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold text-base-foreground">Pipeline created</h3>
          <p className="text-sm text-muted-foreground">The first run starts at 14:15.</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setCreated(false);
            setCurrent(0);
          }}
        >
          Create another
        </Button>
      </div>
    );
  }

  return (
    <WizardFrame
      title="Create extraction pipeline"
      steps={PIPELINE_STEPS}
      current={current}
      finishLabel="Create pipeline"
      blockedReason={current === 1 && areas.length === 0 ? 'Select at least one area.' : undefined}
      onCancel={() => setCurrent(0)}
      onBack={() => setCurrent(current - 1)}
      onNext={() => setCurrent(current + 1)}
      onFinish={() => setCreated(true)}
    >
      <div className="min-h-52 max-w-md">
        {current === 0 ? (
          <div className="space-y-4">
            <FormField label="Source type" required>
              {(control) => (
                <OptionSelect {...control} options={SOURCE_OPTIONS} value={sourceType} onValueChange={setSourceType} />
              )}
            </FormField>
            <FormField label="Server address" required>
              {(control) => <Input {...control} defaultValue="historian.nordkapp.test:4840" />}
            </FormField>
          </div>
        ) : null}
        {current === 1 ? (
          <SelectAllCheckboxList
            label="Areas to extract"
            selectAllLabel="All areas"
            options={areaOptions}
            value={areas}
            onValueChange={setAreas}
            formatCount={(selected, total) => `${selected} of ${total} areas selected`}
          />
        ) : null}
        {current === 2 ? (
          <FormField label="Run" required helper="Each run reads what changed since the last one.">
            {(control) => (
              <OptionSelect {...control} options={INTERVAL_OPTIONS} value={runInterval} onValueChange={setRunInterval} />
            )}
          </FormField>
        ) : null}
        {current === 3 ? (
          <MetadataList
            items={[
              { label: 'Source', value: labelOf(SOURCE_OPTIONS, sourceType) },
              { label: 'Areas', value: selectedAreas.join(', ') },
              { label: 'Schedule', value: labelOf(INTERVAL_OPTIONS, runInterval) },
            ]}
          />
        ) : null}
      </div>
    </WizardFrame>
  );
}

function WizardSetupCard() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <LabelledProgress
        label="Finish setting up Nordkapp"
        value={2}
        max={5}
        valueText="2 of 5"
        size="sm"
        hint="Next: map tags to assets."
      />
      <div className="flex items-center gap-2">
        <Button size="sm">Continue setup</Button>
        <Button variant="ghost" size="sm">
          Hide
        </Button>
      </div>
    </div>
  );
}

export default definePage({
  id: 'wizards',
  title: 'Wizards and steppers',
  summary:
    'Flows that are split into steps, and the indicators that say where the user is in them. A wizard shows one decision at a time, keeps what was entered when something fails, and always says how many steps are left.',
  guidance: {
    use: [
      'Any flow with three or more steps that have to happen in order.',
      'A numbered stepper when there is room; "Step 2 of 4" or a progress bar when there is not.',
      'Back at the start of the footer, the primary action at the end, named after the outcome on the last step.',
      'A review step before anything that creates, sends or starts something.',
    ],
    avoid: [
      'A wizard for two fields, or for settings people come back to edit.',
      'Disabling Next without saying what is missing.',
      'Losing entered data when a step fails or the user goes back.',
      'More than about six steps; group them or split the task.',
    ],
  },
  source,
  sections: [
    {
      id: 'indicators',
      title: 'Step indicators',
      description: 'Ways of saying where the user is.',
      specimens: [
        {
          id: 'WizardHorizontalStepper',
          title: 'Horizontal numbered stepper',
          note: 'The default at the top of a wizard on a wide screen, for three to five steps with short names.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/data-entry/Stepper.tsx', 'patterns/data-entry/stepStatus.ts'],
          Component: WizardHorizontalStepper,
        },
        {
          id: 'WizardCompactCount',
          title: 'Compact step count',
          note: 'On narrow screens and in small panels: the count, the step name and what comes next.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: WizardCompactCount,
        },
        {
          id: 'WizardVerticalStepper',
          title: 'Vertical with descriptions',
          note: 'Beside the content, when each step needs a line of explanation or there are more than five.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/Stepper.tsx', 'patterns/data-entry/stepStatus.ts'],
          Component: WizardVerticalStepper,
        },
        {
          id: 'WizardProgressBar',
          title: 'Progress bar',
          note: 'When the number of steps matters more than their names, such as a long linear questionnaire.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: WizardProgressBar,
        },
        {
          id: 'WizardStepStates',
          title: 'Step states',
          note: 'A reference for the five states a step can be in; each also differs in shape and in its spoken name.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/data-entry/Stepper.tsx', 'patterns/data-entry/stepStatus.ts'],
          Component: WizardStepStates,
        },
        {
          id: 'WizardOptionalAndDisabled',
          title: 'Optional and locked steps',
          note: 'When a step can be skipped or depends on an earlier one; say so in the step, not only on the button.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['patterns/data-entry/Stepper.tsx', 'patterns/data-entry/stepStatus.ts'],
          Component: WizardOptionalAndDisabled,
        },
      ],
    },
    {
      id: 'frames',
      title: 'Wizard frames',
      description: 'Header, one step of content and a Back and Next footer.',
      specimens: [
        {
          id: 'WizardFrameBasic',
          title: 'Frame with back and next',
          note: 'The standard wizard: stepper in the header, Back hidden on the first step, the outcome named on the last.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'patterns/data-entry/WizardFrame.tsx',
            'patterns/data-entry/Stepper.tsx',
            'forms/FormField.tsx',
            'patterns/data-entry/OptionSelect.tsx',
          ],
          Component: WizardFrameBasic,
        },
        {
          id: 'WizardFrameCompact',
          title: 'Frame with step count',
          note: 'When the header has no room for a stepper; the count and step name sit beside the title.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/WizardFrame.tsx'],
          Component: WizardFrameCompact,
        },
        {
          id: 'WizardFrameProgress',
          title: 'Frame with progress bar',
          note: 'For longer flows where a bar reads faster than a row of numbered steps.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/WizardFrame.tsx'],
          Component: WizardFrameProgress,
        },
        {
          id: 'WizardBlockedNext',
          title: 'Next blocked with a reason',
          note: 'When a step is incomplete: Next is disabled and the footer says exactly what is missing.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/WizardFrame.tsx', 'forms/FormField.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: WizardBlockedNext,
        },
        {
          id: 'WizardDialog',
          title: 'Multi-step dialog',
          note: 'For a short flow that interrupts on purpose; keep it to three steps and show progress under the title.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'patterns/data-entry/PanelFrame.tsx',
            'patterns/data-entry/FormActions.tsx',
            'forms/FormField.tsx',
            'display/MetadataList.tsx',
          ],
          Component: WizardDialog,
        },
        {
          id: 'WizardSidePanel',
          title: 'Stepper in a side panel',
          note: 'For a procedure followed beside the thing it is about; finished steps can be reopened from the list.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'patterns/data-entry/PanelFrame.tsx',
            'patterns/data-entry/Stepper.tsx',
            'patterns/data-entry/FormActions.tsx',
          ],
          Component: WizardSidePanel,
        },
      ],
    },
    {
      id: 'steps',
      title: 'Special steps',
      description: 'Review, success, branches, skips, errors and coming back later.',
      specimens: [
        {
          id: 'WizardReviewStep',
          title: 'Review step',
          note: 'Before anything is created or started: every answer as text, grouped by step, each with a way back.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/WizardFrame.tsx', 'display/MetadataList.tsx'],
          Component: WizardReviewStep,
        },
        {
          id: 'WizardSuccessStep',
          title: 'Success step',
          note: 'After the last step: say what now exists and what happens next, and offer the most likely follow-up.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: WizardSuccessStep,
        },
        {
          id: 'WizardBranching',
          title: 'Branching first step',
          note: 'When the first choice decides which steps follow; the stepper updates as soon as the choice changes.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/Stepper.tsx', 'forms/ChoiceCardGroup.tsx'],
          Component: WizardBranching,
        },
        {
          id: 'WizardOptionalStep',
          title: 'Optional step with skip',
          note: 'When a step is useful but not needed: mark it optional in the stepper and offer Skip next to Next.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/WizardFrame.tsx', 'forms/FormField.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: WizardOptionalStep,
        },
        {
          id: 'WizardErrorStep',
          title: 'Error on a step',
          note: 'When a step fails: the error stays on that step with a retry, and nothing entered so far is lost.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/WizardFrame.tsx'],
          Component: WizardErrorStep,
        },
        {
          id: 'WizardResumeDraft',
          title: 'Resume a draft',
          note: 'When a flow can be left half-way: offer to continue from the saved step before starting over.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: WizardResumeDraft,
        },
      ],
    },
    {
      id: 'checklists',
      title: 'Checklists and complete flows',
      description: 'Setup that does not have to happen in one sitting, and a full wizard.',
      specimens: [
        {
          id: 'WizardSetupChecklist',
          title: 'Setup checklist',
          note: 'For onboarding spread over days: tasks tick off as they are done and only the next one carries a button.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/SetupChecklist.tsx'],
          Component: WizardSetupChecklist,
        },
        {
          id: 'WizardCommissioningChecklist',
          title: 'Commissioning checklist',
          note: 'For sign-offs before start-up: each check records who signed it, and approval unlocks when all are signed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/LabelledProgress.tsx', 'patterns/data-entry/FormActions.tsx'],
          Component: WizardCommissioningChecklist,
        },
        {
          id: 'WizardPipelineSetup',
          title: 'Pipeline setup wizard',
          note: 'A complete flow to copy from: source, selection, schedule and review, ending in a success state.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: [
            'patterns/data-entry/WizardFrame.tsx',
            'patterns/data-entry/Stepper.tsx',
            'forms/FormField.tsx',
            'forms/SelectAllCheckboxList.tsx',
            'patterns/data-entry/OptionSelect.tsx',
            'display/MetadataList.tsx',
          ],
          Component: WizardPipelineSetup,
        },
        {
          id: 'WizardSetupCard',
          title: 'Setup progress card',
          note: 'On a home page or sidebar, to bring people back to an unfinished setup without showing every task.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['feedback/LabelledProgress.tsx'],
          Component: WizardSetupCard,
        },
      ],
    },
  ],
});
