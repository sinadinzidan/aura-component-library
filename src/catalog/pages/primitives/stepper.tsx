import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardTitle } from '@cognite/aura/components/card';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import {
  IconArrowLeft,
  IconArrowRight,
  IconBell,
  IconCalendar,
  IconDatabase,
  IconEye,
  IconFlask,
  IconPackage,
  IconSend,
  IconTruck,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { Step } from '../../../library/primitives/stepper/Step';
import { Stepper } from '../../../library/primitives/stepper/Stepper';
import { definePage } from '../../types';

import source from './stepper.tsx?raw';

function StepperPrimHorizontal() {
  return (
    <Stepper label="Create pipeline" current={1}>
      <Step label="Select data" />
      <Step label="Schedule" />
      <Step label="Notifications" />
      <Step label="Review" />
    </Stepper>
  );
}

function StepperPrimVertical() {
  return (
    <Stepper label="Create pipeline, vertical" orientation="vertical" current={1}>
      <Step label="Select data" description="Choose the time series to include" />
      <Step label="Schedule" description="How often the pipeline runs" />
      <Step label="Notifications" description="Who is told when a run fails" />
      <Step label="Review" description="Check everything before you create it" />
    </Stepper>
  );
}

function StepperPrimDots() {
  return (
    <Stepper label="Order status" current={2} markers="dot">
      <Step label="Placed" />
      <Step label="Approved" />
      <Step label="In production" />
      <Step label="Shipped" />
      <Step label="Delivered" />
    </Stepper>
  );
}

function StepperPrimDotsVertical() {
  return (
    <Stepper label="Permit status" orientation="vertical" current={1} markers="dot" size="sm">
      <Step label="Requested" description="Liv Wold, 10 Mar" />
      <Step label="Approved" description="Waiting for the area authority" />
      <Step label="Active" />
      <Step label="Closed" />
    </Stepper>
  );
}

function StepperPrimIcons() {
  return (
    <Stepper label="Create pipeline, icons" current={2} markers="icon">
      <Step label="Select data" icon={<IconDatabase />} />
      <Step label="Schedule" icon={<IconCalendar />} />
      <Step label="Notifications" icon={<IconBell />} />
      <Step label="Review" icon={<IconEye />} />
    </Stepper>
  );
}

function StepperPrimLabelBelow() {
  return (
    <Stepper label="Sample status" current={2} labelPlacement="below">
      <Step label="Taken" description="12 Mar 08:10" />
      <Step label="In transit" description="12 Mar 09:40" />
      <Step label="In lab" description="Expected 13 Mar" />
      <Step label="Reported" />
    </Stepper>
  );
}

function StepperPrimSizes() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Stepper label="Small" current={1} size="sm">
        <Step label="Select data" />
        <Step label="Schedule" />
        <Step label="Review" />
      </Stepper>
      <Stepper label="Medium" current={1} size="md">
        <Step label="Select data" />
        <Step label="Schedule" />
        <Step label="Review" />
      </Stepper>
      <Stepper label="Large" current={1} size="lg">
        <Step label="Select data" />
        <Step label="Schedule" />
        <Step label="Review" />
      </Stepper>
    </div>
  );
}

function StepperPrimDashed() {
  return (
    <Stepper label="Delivery, dashed" current={1} connector="dashed" markers="dot">
      <Step label="Packed" />
      <Step label="On the road" />
      <Step label="Delivered" />
    </Stepper>
  );
}

function StepperPrimNoConnector() {
  return (
    <Stepper label="Tabs of a wizard" current={0} connector="none" orientation="vertical" size="sm">
      <Step label="General" />
      <Step label="Access" />
      <Step label="Retention" />
    </Stepper>
  );
}

function StepperPrimAllStates() {
  return (
    <Stepper label="Every step state" orientation="vertical" size="sm">
      <Step label="Complete" state="complete" description="Done and confirmed" />
      <Step label="Current" state="current" description="Where the person is" />
      <Step label="Upcoming" state="upcoming" description="Not started" />
      <Step label="Error" state="error" description="Failed, needs attention" />
      <Step label="Warning" state="warning" description="Done, with something to check" />
      <Step label="Skipped" state="skipped" description="Left out on purpose" />
      <Step label="Disabled" state="disabled" description="Not available yet" />
    </Stepper>
  );
}

function StepperPrimError() {
  return (
    <Stepper label="Create pipeline, with error" current={2} orientation="vertical" size="sm">
      <Step label="Select data" />
      <Step label="Schedule" state="error" description="Start time is in the past" />
      <Step label="Notifications" />
      <Step label="Review" />
    </Stepper>
  );
}

function StepperPrimOptionalSkipped() {
  return (
    <Stepper label="Create pipeline, optional step" current={3}>
      <Step label="Select data" />
      <Step label="Schedule" />
      <Step label="Notifications" optional state="skipped" />
      <Step label="Review" />
    </Stepper>
  );
}

function StepperPrimDisabledStep() {
  return (
    <Stepper label="Create pipeline, locked" current={0} onStepSelect={() => {}} navigation="all">
      <Step label="Select data" />
      <Step label="Schedule" />
      <Step label="Notifications" state="disabled" description="Needs a schedule first" />
      <Step label="Review" state="disabled" />
    </Stepper>
  );
}

function StepperPrimNavigable() {
  const [current, setCurrent] = useState(2);
  return (
    <div className="flex w-full flex-col gap-3">
      <Stepper label="Create pipeline, navigable" current={current} onStepSelect={setCurrent}>
        <Step label="Select data" />
        <Step label="Schedule" />
        <Step label="Notifications" />
        <Step label="Review" />
      </Stepper>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Completed steps are buttons. Back to any of them to change it.
      </p>
    </div>
  );
}

function StepperPrimJumpAnywhere() {
  const [current, setCurrent] = useState(0);
  return (
    <Stepper label="Settings sections" current={current} onStepSelect={setCurrent} navigation="all" orientation="vertical" size="sm">
      <Step label="General" />
      <Step label="Access" />
      <Step label="Retention" />
      <Step label="Danger zone" />
    </Stepper>
  );
}

function StepperPrimCompact() {
  return (
    <div className="w-full max-w-sm">
      <Stepper label="Create pipeline, compact" current={1} variant="compact">
        <Step label="Select data" />
        <Step label="Schedule" />
        <Step label="Notifications" />
        <Step label="Review" />
      </Stepper>
    </div>
  );
}

function StepperPrimProgress() {
  return (
    <div className="w-full max-w-sm">
      <Stepper label="Create pipeline, progress" current={2} variant="progress">
        <Step label="Select data" />
        <Step label="Schedule" />
        <Step label="Notifications" />
        <Step label="Review" />
      </Stepper>
    </div>
  );
}

function StepperPrimCollapseNarrow() {
  return (
    <div className="w-full max-w-xs">
      <Stepper label="Create pipeline, narrow" current={1} collapse>
        <Step label="Select data" />
        <Step label="Schedule" />
        <Step label="Notifications" />
        <Step label="Review" />
      </Stepper>
    </div>
  );
}

function StepperPrimCollapseWide() {
  return (
    <Stepper label="Create pipeline, wide" current={1} collapse>
      <Step label="Select data" />
      <Step label="Schedule" />
      <Step label="Notifications" />
      <Step label="Review" />
    </Stepper>
  );
}

const WIZARD_STEPS = ['Select data', 'Schedule', 'Notifications', 'Review'] as const;

function StepperPrimWizard() {
  const [current, setCurrent] = useState(1);
  const last = current === WIZARD_STEPS.length - 1;
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Create pipeline</CardTitle>
          <CardDescription>
            Step {current + 1} of {WIZARD_STEPS.length}
          </CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent className="w-full">
        <Stepper label="Create pipeline" current={current} onStepSelect={setCurrent} collapse>
          {WIZARD_STEPS.map((label) => (
            <Step key={label} label={label} />
          ))}
        </Stepper>
        <div className="flex w-full flex-col">
          <Label htmlFor="stepper-wizard-name">Name of the {WIZARD_STEPS[current].toLowerCase()} setting</Label>
          <Input id="stepper-wizard-name" placeholder="For example, hourly compressor trends" />
        </div>
        <div className="flex w-full items-center justify-end gap-2">
          <Button variant="ghost" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
            <IconArrowLeft /> Back
          </Button>
          <Button onClick={() => setCurrent(last ? 0 : current + 1)}>
            {last ? 'Create pipeline' : 'Continue'} {last ? null : <IconArrowRight />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StepperPrimStartup() {
  return (
    <Stepper label="Start-up sequence, 23-KA-9103" orientation="vertical" size="sm">
      <Step label="Lube oil pressure established" state="complete" meta="14:02:10" />
      <Step label="Seal gas supply open" state="complete" meta="14:02:48" />
      <Step label="Purge complete" state="complete" description="3 volume changes" meta="14:04:30" />
      <Step label="Turbine ignition" state="current" description="Waiting for flame detection" meta="14:05:12" />
      <Step label="Ramp to idle" state="upcoming" />
      <Step label="Load to minimum flow" state="upcoming" />
    </Stepper>
  );
}

function StepperPrimTracking() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-base-foreground">Spare bearing set, order PO-88231</p>
        <p className="text-xs text-muted-foreground">Expected at Stord terminal on 14 Mar</p>
      </div>
      <Stepper label="Order PO-88231" current={2} markers="icon" labelPlacement="below" connector="dashed">
        <Step label="Ordered" icon={<IconSend />} description="9 Mar" />
        <Step label="Packed" icon={<IconPackage />} description="10 Mar" />
        <Step label="On the road" icon={<IconTruck />} description="12 Mar" />
        <Step label="Delivered" icon={<IconArrowRight />} description="14 Mar" />
      </Stepper>
    </div>
  );
}

function StepperPrimSampleFlow() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-base-foreground">Sample S-260312-07, condensate</p>
        <p className="text-xs text-muted-foreground">Held at the lab: result outside the expected range</p>
      </div>
      <Stepper label="Sample S-260312-07" current={3} markers="dot" labelPlacement="below">
        <Step label="Taken" description="08:10" />
        <Step label="In transit" description="09:40" />
        <Step label="Received" description="11:05" />
        <Step label="Analysed" state="warning" description="Re-test needed" />
        <Step label="Reported" />
      </Stepper>
    </div>
  );
}

function StepperPrimShutdown() {
  return (
    <Stepper label="Shutdown sequence, 20-VA-1001" orientation="vertical" size="sm">
      <Step label="Inlet valve closed" state="complete" meta="09:12" />
      <Step label="Depressurise to flare" state="complete" meta="09:15" />
      <Step label="Drain liquid" state="error" description="Level did not fall below 10 %" meta="09:31" />
      <Step label="Nitrogen purge" state="upcoming" />
      <Step label="Release for maintenance" state="disabled" description="Needs the drain step" />
    </Stepper>
  );
}

function StepperPrimFormStep() {
  const [current, setCurrent] = useState(0);
  return (
    <Stepper label="Add sensor" orientation="vertical" current={current}>
      <Step label="Name the sensor" description="Tag and description">
        {current === 0 ? (
          <div className="flex max-w-sm flex-col gap-3">
            <div className="flex flex-col">
              <Label htmlFor="stepper-tag">Tag</Label>
              <Input id="stepper-tag" placeholder="23-PT-92531" />
            </div>
            <div>
              <Button size="sm" onClick={() => setCurrent(1)}>
                Continue
              </Button>
            </div>
          </div>
        ) : null}
      </Step>
      <Step label="Set limits" description="Low, high and trip" />
      <Step label="Connect to a time series" icon={<IconFlask />} />
    </Stepper>
  );
}

export default definePage({
  id: 'stepper',
  title: 'Stepper',
  summary:
    'Progress through a fixed sequence: a wizard, a start-up sequence, an order on its way. Each step reads as complete, current, upcoming, failed, warned, skipped or unavailable in shape and words as well as colour.',
  guidance: {
    use: [
      'A stepper for a sequence people move through in order, with a clear current step.',
      'Short step names, a verb or a noun; put the detail in a description.',
      'Clickable steps only where going back is safe; completed steps are the usual ones.',
      'The compact form in narrow panels, so the position never disappears.',
    ],
    avoid: [
      'A stepper for tabs or sections people visit in any order; use Tabs.',
      'Colour as the only sign of an error: the error marker has its own shape and a spoken label.',
      'More than seven steps in a row; group them or use the vertical form.',
      'Hiding why a step is unavailable.',
    ],
  },
  source,
  sections: [
    {
      id: 'layout',
      title: 'Orientation and markers',
      description: 'Horizontal for a header, vertical for a panel; numbers, dots or icons in the marker.',
      specimens: [
        {
          id: 'StepperPrimHorizontal',
          title: 'Horizontal, numbered',
          note: 'A wizard header: done steps carry a check, the current step is filled.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimHorizontal,
        },
        {
          id: 'StepperPrimVertical',
          title: 'Vertical with descriptions',
          note: 'A side panel where each step needs a line of explanation.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimVertical,
        },
        {
          id: 'StepperPrimLabelBelow',
          title: 'Labels below',
          note: 'Longer labels and a time under each marker, evenly spread.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimLabelBelow,
        },
        {
          id: 'StepperPrimDots',
          title: 'Dot markers',
          note: 'A quiet status flow where the step number means nothing.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimDots,
        },
        {
          id: 'StepperPrimDotsVertical',
          title: 'Dots, vertical',
          note: 'A permit or approval trail in a narrow column.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimDotsVertical,
        },
        {
          id: 'StepperPrimIcons',
          title: 'Icon markers',
          note: 'When each step has a recognisable icon; done steps still show a check.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimIcons,
        },
      ],
    },
    {
      id: 'style',
      title: 'Sizes and connectors',
      description: 'Marker sizes 20, 24 and 28 px, and how the line between steps is drawn.',
      specimens: [
        {
          id: 'StepperPrimSizes',
          title: 'Sizes',
          note: 'Small in dense panels, medium by default, large for focused flows.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimSizes,
        },
        {
          id: 'StepperPrimDashed',
          title: 'Dashed connector',
          note: 'The part still ahead is dashed, as in a delivery that has not arrived.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimDashed,
        },
        {
          id: 'StepperPrimNoConnector',
          title: 'No connector',
          note: 'A short list of sections that reads as steps without a line.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimNoConnector,
        },
      ],
    },
    {
      id: 'states',
      title: 'Step states',
      description: 'Seven states, each with its own marker shape and spoken label.',
      specimens: [
        {
          id: 'StepperPrimAllStates',
          title: 'All seven states',
          note: 'Complete, current, upcoming, error, warning, skipped and disabled side by side.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimAllStates,
        },
        {
          id: 'StepperPrimError',
          title: 'Error step',
          note: 'The failed step is named and explained; later steps stay upcoming.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimError,
        },
        {
          id: 'StepperPrimOptionalSkipped',
          title: 'Optional and skipped',
          note: 'A step people may leave out, shown as skipped once they have.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimOptionalSkipped,
        },
        {
          id: 'StepperPrimDisabledStep',
          title: 'Disabled steps',
          note: 'Locked steps stay visible, are not clickable, and say what unlocks them.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimDisabledStep,
        },
      ],
    },
    {
      id: 'navigation',
      title: 'Navigation and compact forms',
      description: 'Steps people can click, and the one-line forms for narrow places.',
      specimens: [
        {
          id: 'StepperPrimNavigable',
          title: 'Clickable steps',
          note: 'Completed steps become buttons; the current step carries aria-current. Click one to try.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimNavigable,
        },
        {
          id: 'StepperPrimJumpAnywhere',
          title: 'Jump to any step',
          note: 'Sections that may be visited in any order, with the one you are on marked.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimJumpAnywhere,
        },
        {
          id: 'StepperPrimCompact',
          title: 'Compact, step 2 of 4',
          note: 'One line with the position, the current step and what is next.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/StepperSummary.tsx'],
          Component: StepperPrimCompact,
        },
        {
          id: 'StepperPrimProgress',
          title: 'Progress bar',
          note: 'The same line with one segment per step.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/StepperSummary.tsx'],
          Component: StepperPrimProgress,
        },
        {
          id: 'StepperPrimCollapseNarrow',
          title: 'Collapses when narrow',
          note: 'In a container under 28 rem the row gives way to the summary.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/StepperSummary.tsx'],
          Component: StepperPrimCollapseNarrow,
        },
        {
          id: 'StepperPrimCollapseWide',
          title: 'Full row when wide',
          note: 'The same stepper with room: the full row shows instead.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/StepperSummary.tsx'],
          Component: StepperPrimCollapseWide,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Steppers on plant and product screens.',
      specimens: [
        {
          id: 'StepperPrimWizard',
          title: 'Wizard header',
          note: 'A stepper above the form, with back and continue; it collapses in a narrow dialog.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimWizard,
        },
        {
          id: 'StepperPrimStartup',
          title: 'Start-up sequence',
          note: 'Machine steps with a time each; the current step says what it waits for.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimStartup,
        },
        {
          id: 'StepperPrimShutdown',
          title: 'Sequence with a failed step',
          note: 'The failed step blocks the next, which says why it is unavailable.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimShutdown,
        },
        {
          id: 'StepperPrimTracking',
          title: 'Order tracking',
          note: 'Icons with dates under each marker and a dashed line for the road ahead.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimTracking,
        },
        {
          id: 'StepperPrimSampleFlow',
          title: 'Sample status flow',
          note: 'A lab sample held on a warning, with times and the reason.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimSampleFlow,
        },
        {
          id: 'StepperPrimFormStep',
          title: 'Form inside the current step',
          note: 'A vertical stepper that opens the form under its current step.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: StepperPrimFormStep,
        },
      ],
    },
  ],
});
