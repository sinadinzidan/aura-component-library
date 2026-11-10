import { Button } from '@cognite/aura/components/button';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Label } from '@cognite/aura/components/label';
import { Slider } from '@cognite/aura/components/slider';
import { IconMinus, IconPlus, IconVolume, IconVolumeOff } from '@cognite/aura/icons';
import { useId, useState } from 'react';

import { SliderField } from '../../../library/forms/SliderField';
import { SliderNumberInput } from '../../../library/forms/SliderNumberInput';
import { ASSETS, SENSORS } from '../../data/plant';
import { definePage } from '../../types';

import source from './slider.tsx?raw';

const EQUIPMENT = ASSETS.filter((asset) => asset.type !== 'site' && asset.type !== 'area' && asset.type !== 'system');

const DISCHARGE_PRESSURE = SENSORS[0];

const STAGE_SET_POINTS = [
  { id: 'stage-1', label: '1st stage', value: 62 },
  { id: 'stage-2', label: '2nd stage', value: 78 },
  { id: 'recompressor', label: 'Recompressor', value: 35 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function SliderSingle() {
  return (
    <div className="w-full max-w-64">
      <Slider defaultValue={[40]} aria-label="Valve opening" />
    </div>
  );
}

function SliderRange() {
  return (
    <div className="w-full max-w-64">
      <Slider defaultValue={[25, 75]} aria-label="Health score range" />
    </div>
  );
}

function SliderStepped() {
  return (
    <div className="w-full max-w-64">
      <Slider defaultValue={[50]} step={25} aria-label="Sampling rate" />
    </div>
  );
}

function SliderCustomScale() {
  return (
    <div className="w-full max-w-64">
      <Slider defaultValue={[9800]} min={7000} max={10500} step={100} aria-label="Shaft speed set point" />
    </div>
  );
}

function SliderThreeThumbs() {
  return (
    <div className="w-full max-w-64">
      <Slider defaultValue={[40, 52, 55]} max={60} aria-label="Low, high and trip limits" />
    </div>
  );
}

function SliderVertical() {
  return (
    <div className="h-44">
      <Slider defaultValue={[60]} orientation="vertical" aria-label="Separator level set point" />
    </div>
  );
}

function SliderVerticalRange() {
  return (
    <div className="h-44">
      <Slider defaultValue={[30, 70]} orientation="vertical" aria-label="Separator level operating window" />
    </div>
  );
}

function SliderWithLabel() {
  const id = useId();
  return (
    <div className="flex w-full max-w-64 flex-col">
      <Label id={id}>Valve opening</Label>
      <Slider defaultValue={[40]} aria-labelledby={id} />
    </div>
  );
}

function SliderWithHelperText() {
  const id = useId();
  return (
    <div className="flex w-full max-w-64 flex-col">
      <Label id={`${id}-label`}>Smoothing</Label>
      <Slider defaultValue={[30]} aria-labelledby={`${id}-label`} aria-describedby={`${id}-help`} />
      <HelperText id={`${id}-help`}>Higher values hide short spikes in the trend.</HelperText>
    </div>
  );
}

function SliderWithReadout() {
  const [value, setValue] = useState([40]);
  return (
    <div className="w-full max-w-64">
      <SliderField label="Valve opening" value={value} onValueChange={setValue} unit="%" />
    </div>
  );
}

function SliderWithScale() {
  const [value, setValue] = useState([9800]);
  return (
    <div className="w-full max-w-64">
      <SliderField
        label="Shaft speed set point"
        value={value}
        onValueChange={setValue}
        min={7000}
        max={10500}
        step={100}
        unit="rpm"
        formatValue={(rpm) => rpm.toLocaleString('en-US')}
        showScale
      />
    </div>
  );
}

function SliderWithTickLabels() {
  const id = useId();
  return (
    <div className="flex w-full max-w-64 flex-col">
      <Label id={id}>Aggregation window</Label>
      <Slider defaultValue={[2]} min={0} max={4} step={1} aria-labelledby={id} />
      <div aria-hidden="true" className="flex justify-between pt-2 text-xs tabular-nums text-muted-foreground">
        <span>1m</span>
        <span>5m</span>
        <span>15m</span>
        <span>1h</span>
        <span>1d</span>
      </div>
    </div>
  );
}

function SliderWithEndIcons() {
  return (
    <div className="flex w-full max-w-64 items-center gap-3 text-muted-foreground">
      <IconVolumeOff aria-hidden="true" className="size-4 shrink-0" />
      <Slider defaultValue={[70]} aria-label="Alarm volume" />
      <IconVolume aria-hidden="true" className="size-4 shrink-0" />
    </div>
  );
}

function SliderLiveFeedback() {
  const id = useId();
  const [opacity, setOpacity] = useState([60]);
  return (
    <div className="flex w-full max-w-64 flex-col gap-3">
      <div className="flex h-12 items-center justify-center rounded-lg bg-muted-background">
        <div className="h-6 w-32 rounded-md bg-chart-1-400" style={{ opacity: opacity[0] / 100 }} />
      </div>
      <div className="flex flex-col">
        <Label id={id}>Limit band opacity</Label>
        <Slider value={opacity} onValueChange={setOpacity} aria-labelledby={id} />
      </div>
    </div>
  );
}

function SliderDeferredCommit() {
  const id = useId();
  const [draft, setDraft] = useState([24]);
  const [applied, setApplied] = useState(24);
  return (
    <div className="flex w-full max-w-64 flex-col">
      <Label id={`${id}-label`}>Trend window</Label>
      <Slider
        value={draft}
        onValueChange={setDraft}
        onValueCommitted={(value) => setApplied(typeof value === 'number' ? value : value[0])}
        min={1}
        max={72}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-help`}
      />
      <HelperText id={`${id}-help`}>
        <span className="tabular-nums">
          {draft[0] === applied
            ? `Showing the last ${applied} hours.`
            : `Release to load ${draft[0]} hours. Showing ${applied}.`}
        </span>
      </HelperText>
    </div>
  );
}

function SliderMinimumDistance() {
  const [range, setRange] = useState([40, 52]);
  return (
    <div className="w-full max-w-64">
      <SliderField
        label="Operating window"
        value={range}
        onValueChange={setRange}
        max={60}
        minStepsBetweenValues={5}
        unit="barg"
        helperText="Limits stay at least 5 barg apart."
      />
    </div>
  );
}

function SliderOutsideRecommended() {
  const id = useId();
  const [limit, setLimit] = useState([54]);
  const aboveTrip = limit[0] >= 55;
  return (
    <div className="flex w-full max-w-64 flex-col">
      <div className="flex items-baseline justify-between gap-3">
        <Label id={`${id}-label`}>High alarm limit</Label>
        <output className="pb-2 text-sm font-medium tabular-nums text-base-foreground">{limit[0]} barg</output>
      </div>
      <Slider
        value={limit}
        onValueChange={setLimit}
        max={60}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-help`}
        aria-invalid={aboveTrip ? true : undefined}
      />
      <HelperText id={`${id}-help`} isError={aboveTrip}>
        {aboveTrip ? 'Set the alarm below the 55 barg trip limit.' : 'The trip limit is 55 barg.'}
      </HelperText>
    </div>
  );
}

function SliderDisabledWithReason() {
  const id = useId();
  return (
    <div className="group flex w-full max-w-64 flex-col" data-disabled="true">
      <Label id={`${id}-label`}>Valve opening</Label>
      <Slider defaultValue={[40]} disabled aria-labelledby={`${id}-label`} aria-describedby={`${id}-reason`} />
      <HelperText id={`${id}-reason`}>The valve is in local control. Switch to remote to adjust it.</HelperText>
    </div>
  );
}

function SliderNumberEntry() {
  const [opening, setOpening] = useState(40);
  return (
    <div className="w-full max-w-sm">
      <SliderNumberInput label="Valve opening" value={opening} onValueChange={setOpening} unit="%" />
    </div>
  );
}

function SliderRangeReadout() {
  const [range, setRange] = useState([DISCHARGE_PRESSURE.lowLimit, DISCHARGE_PRESSURE.highLimit]);
  return (
    <div className="w-full max-w-sm">
      <SliderField
        label={`${DISCHARGE_PRESSURE.name} limits`}
        value={range}
        onValueChange={setRange}
        min={DISCHARGE_PRESSURE.rangeMin}
        max={DISCHARGE_PRESSURE.rangeMax}
        unit={DISCHARGE_PRESSURE.unit}
        showScale
        helperText={`Currently ${DISCHARGE_PRESSURE.value} ${DISCHARGE_PRESSURE.unit} on ${DISCHARGE_PRESSURE.tag}.`}
      />
    </div>
  );
}

function SliderRangeFilter() {
  const [range, setRange] = useState([60, 100]);
  const matches = EQUIPMENT.filter((asset) => asset.healthScore >= range[0] && asset.healthScore <= range[1]);
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <SliderField label="Health score" value={range} onValueChange={setRange} showScale />
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm tabular-nums text-muted-foreground">
          {matches.length} of {EQUIPMENT.length} assets match
        </span>
        <Button variant="ghost" size="sm" onClick={() => setRange([0, 100])}>
          Reset
        </Button>
      </div>
    </div>
  );
}

function SliderZoomControl() {
  const [zoom, setZoom] = useState([100]);
  const step = (delta: number) => setZoom([clamp(zoom[0] + delta, 25, 400)]);
  return (
    <div className="flex w-full max-w-xs items-center gap-2">
      <Button variant="ghost" size="icon-sm" aria-label="Zoom out" onClick={() => step(-25)}>
        <IconMinus />
      </Button>
      <Slider value={zoom} onValueChange={setZoom} min={25} max={400} step={25} aria-label="Zoom" />
      <Button variant="ghost" size="icon-sm" aria-label="Zoom in" onClick={() => step(25)}>
        <IconPlus />
      </Button>
      <output className="w-12 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{zoom[0]}%</output>
    </div>
  );
}

function SliderSettingRow() {
  const id = useId();
  const [seconds, setSeconds] = useState([30]);
  return (
    <div className="flex w-full max-w-lg items-center justify-between gap-6">
      <div className="flex min-w-0 flex-col gap-1">
        <span id={id} className="text-sm font-medium text-base-foreground">
          Refresh interval
        </span>
        <span className="text-xs text-muted-foreground">How often live tiles ask for new values.</span>
      </div>
      <div className="flex w-56 shrink-0 items-center gap-3">
        <Slider value={seconds} onValueChange={setSeconds} min={5} max={60} step={5} aria-labelledby={id} />
        <output className="w-10 shrink-0 text-right text-sm tabular-nums text-base-foreground">{seconds[0]} s</output>
      </div>
    </div>
  );
}

function SliderVerticalGroup() {
  const [values, setValues] = useState(STAGE_SET_POINTS.map((stage) => stage.value));
  return (
    <div className="flex items-end gap-8">
      {STAGE_SET_POINTS.map((stage, index) => (
        <div key={stage.id} className="flex flex-col items-center gap-2">
          <output className="text-sm font-medium tabular-nums text-base-foreground">{values[index]}%</output>
          <div className="h-44">
            <Slider
              orientation="vertical"
              value={[values[index]]}
              onValueChange={(next) => setValues(values.map((value, i) => (i === index ? next[0] : value)))}
              aria-label={`${stage.label} load`}
            />
          </div>
          <span className="text-xs text-muted-foreground">{stage.label}</span>
        </div>
      ))}
    </div>
  );
}

export default definePage({
  id: 'slider',
  title: 'Slider',
  summary:
    'A slider picks a value or a range on a continuous scale by dragging. It trades precision for speed and a sense of where the value sits between the ends.',
  docsSlug: 'slider',
  guidance: {
    use: [
      'Approximate values where seeing the position matters more than the exact number.',
      'A minimum and maximum picked together, such as a filter range.',
      'A visible label, and the current value next to it whenever the number matters.',
      'A number field beside it when users sometimes need an exact value.',
    ],
    avoid: [
      'Exact numeric entry on its own — use an input.',
      'A handful of named options — use a radio group or select.',
      'Live updates that reload the screen on every drag step; apply on release instead.',
      'A track with no indication of its scale when the range is not 0 to 100.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'One thumb or several, the scale they move on, and both orientations.',
      specimens: [
        {
          id: 'SliderSingle',
          title: 'Single value',
          note: 'One value on a 0 to 100 scale, the default.',
          origin: 'aura',
          Component: SliderSingle,
        },
        {
          id: 'SliderRange',
          title: 'Range',
          note: 'A lower and an upper bound picked on the same track.',
          origin: 'aura',
          Component: SliderRange,
        },
        {
          id: 'SliderStepped',
          title: 'Coarse steps',
          note: 'A few evenly spaced stops; the thumb snaps to each one.',
          origin: 'aura',
          Component: SliderStepped,
        },
        {
          id: 'SliderCustomScale',
          title: 'Custom scale',
          note: 'A real engineering range with its own minimum, maximum and step.',
          origin: 'aura',
          Component: SliderCustomScale,
        },
        {
          id: 'SliderThreeThumbs',
          title: 'Three thumbs',
          note: 'Ordered thresholds on one scale, such as low, high and trip limits.',
          origin: 'aura',
          Component: SliderThreeThumbs,
        },
        {
          id: 'SliderVertical',
          title: 'Vertical',
          note: 'Quantities people think of as up and down, such as a level or a gain.',
          origin: 'aura',
          Component: SliderVertical,
        },
        {
          id: 'SliderVerticalRange',
          title: 'Vertical range',
          note: 'An operating window on a vertical quantity.',
          origin: 'aura',
          Component: SliderVerticalRange,
        },
      ],
    },
    {
      id: 'content',
      title: 'Labels and readouts',
      description: 'Naming the slider and telling the user what the position means.',
      specimens: [
        {
          id: 'SliderWithLabel',
          title: 'With label',
          note: 'The minimum for any slider in a form: a visible label wired to the thumb.',
          origin: 'aura',
          Component: SliderWithLabel,
        },
        {
          id: 'SliderWithHelperText',
          title: 'With helper text',
          note: 'A setting whose effect is not obvious from its name.',
          origin: 'aura',
          Component: SliderWithHelperText,
        },
        {
          id: 'SliderWithReadout',
          title: 'Value readout with unit',
          note: 'Whenever the number matters: the readout follows the thumb as it moves.',
          origin: 'custom',
          uses: ['forms/SliderField.tsx'],
          Component: SliderWithReadout,
        },
        {
          id: 'SliderWithScale',
          title: 'Scale ends',
          note: 'A scale that is not 0 to 100: print both ends so the position has a reference.',
          origin: 'custom',
          uses: ['forms/SliderField.tsx'],
          Component: SliderWithScale,
        },
        {
          id: 'SliderWithTickLabels',
          title: 'Labelled stops',
          note: 'A short ordered scale whose stops have names rather than even numbers.',
          origin: 'custom',
          Component: SliderWithTickLabels,
        },
        {
          id: 'SliderWithEndIcons',
          title: 'End icons',
          note: 'Familiar quantities such as volume, where icons say more than numbers.',
          origin: 'custom',
          Component: SliderWithEndIcons,
        },
      ],
    },
    {
      id: 'states',
      title: 'States and feedback',
      description: 'When the change applies, and what happens at the edges of what is allowed.',
      specimens: [
        {
          id: 'SliderLiveFeedback',
          title: 'Immediate feedback',
          note: 'Cheap changes: apply on every step so the preview follows the thumb.',
          origin: 'aura',
          Component: SliderLiveFeedback,
        },
        {
          id: 'SliderDeferredCommit',
          title: 'Apply on release',
          note: 'Expensive changes such as reloading data: commit once, when the thumb is let go.',
          origin: 'aura',
          Component: SliderDeferredCommit,
        },
        {
          id: 'SliderMinimumDistance',
          title: 'Minimum distance',
          note: 'A range whose two ends must not meet or cross.',
          origin: 'custom',
          uses: ['forms/SliderField.tsx'],
          Component: SliderMinimumDistance,
        },
        {
          id: 'SliderOutsideRecommended',
          title: 'Invalid value',
          note: 'The scale allows a value the rules do not; say so while the user is dragging.',
          origin: 'custom',
          Component: SliderOutsideRecommended,
        },
        {
          id: 'SliderDisabledWithReason',
          title: 'Disabled with reason',
          note: 'A value shown for reference that cannot be changed right now.',
          origin: 'aura',
          Component: SliderDisabledWithReason,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Sliders with inputs, filters, toolbars and each other.',
      specimens: [
        {
          id: 'SliderNumberEntry',
          title: 'With number field',
          note: 'Drag for a rough value, type for an exact one; typed values are clamped and snapped.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/SliderNumberInput.tsx'],
          Component: SliderNumberEntry,
        },
        {
          id: 'SliderRangeReadout',
          title: 'Limit range with readout',
          note: 'Operating limits for a sensor, with the live value as a reference.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/SliderField.tsx'],
          Component: SliderRangeReadout,
        },
        {
          id: 'SliderRangeFilter',
          title: 'Range filter',
          note: 'Filtering a list by a numeric property; the match count updates as you drag.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/SliderField.tsx'],
          Component: SliderRangeFilter,
        },
        {
          id: 'SliderZoomControl',
          title: 'Zoom control',
          note: 'A canvas or diagram toolbar: buttons for single steps, the slider for big jumps.',
          origin: 'custom',
          size: 'md',
          Component: SliderZoomControl,
        },
        {
          id: 'SliderSettingRow',
          title: 'Settings row',
          note: 'A numeric preference in a settings list, label left and slider right.',
          origin: 'custom',
          size: 'lg',
          Component: SliderSettingRow,
        },
        {
          id: 'SliderVerticalGroup',
          title: 'Vertical group',
          note: 'Several related quantities balanced against each other, mixer style.',
          origin: 'custom',
          Component: SliderVerticalGroup,
        },
      ],
    },
  ],
});
