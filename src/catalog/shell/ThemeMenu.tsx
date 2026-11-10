import { Button } from '@cognite/aura/components/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@cognite/aura/components/popover';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconCheck, IconPalette } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import {
  ACCENT_LABELS,
  ACCENTS,
  CONTRAST_LABELS,
  CONTRASTS,
  sameTheme,
  SHAPE_LABELS,
  SHAPES,
  SURFACE_LABELS,
  SURFACES,
  THEME_PRESETS,
  type Accent,
} from '../../library/themes/themes';
import { useCatalogViewModel } from '../state/useCatalogViewModel';

/** The colour each accent gives primary actions, as a literal class so Tailwind generates it. */
const ACCENT_SWATCH: Record<Accent, string> = {
  mountain: 'bg-mountain-900 dark:bg-mountain-10',
  fjord: 'bg-fjord-700 dark:bg-fjord-300',
  nordic: 'bg-nordic-700 dark:bg-nordic-300',
  aurora: 'bg-aurora-700 dark:bg-aurora-300',
  dusk: 'bg-dusk-700 dark:bg-dusk-300',
  amber: 'bg-amber-700 dark:bg-amber-300',
  pink: 'bg-pink-700 dark:bg-pink-300',
};

function OptionGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="pb-2 text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

type SegmentsProps<T extends string> = {
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
};

function Segments<T extends string>({ label, options, labels, value, onChange }: SegmentsProps<T>) {
  return (
    <OptionGroup label={label}>
      <SegmentedControl
        value={value}
        onValueChange={(next) => {
          const match = options.find((option) => option === next);
          if (match) onChange(match);
        }}
      >
        <SegmentedControlList size="small" aria-label={label}>
          {options.map((option) => (
            <SegmentedControlButton key={option} value={option}>
              {labels[option]}
            </SegmentedControlButton>
          ))}
        </SegmentedControlList>
      </SegmentedControl>
    </OptionGroup>
  );
}

/** Theme options for the whole library: presets, accent, surface, shape and contrast. */
export function ThemeMenu() {
  const { state, setTheme } = useCatalogViewModel();
  const theme = state.theme;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm">
            <IconPalette /> Theme
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Theme</PopoverTitle>
          <PopoverDescription>Applies to every variant in the library.</PopoverDescription>
        </PopoverHeader>
        <div className="space-y-4 pt-3">
          <OptionGroup label="Presets">
            <ul className="grid grid-cols-2 gap-1">
              {THEME_PRESETS.map((preset) => {
                const active = sameTheme(preset.settings, theme);
                return (
                  <li key={preset.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      title={preset.description}
                      onClick={() => setTheme(preset.settings)}
                      className={`flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm outline-none transition-colors hover:bg-base-background-hover focus-visible:shadow-focus-ring ${active ? 'bg-secondary-background font-medium text-base-foreground' : 'text-medium-foreground'}`}
                    >
                      <span
                        aria-hidden
                        className={`size-3 shrink-0 rounded-full ${ACCENT_SWATCH[preset.settings.accent]}`}
                      />
                      <span className="truncate">{preset.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </OptionGroup>
          <OptionGroup label="Accent">
            <div role="radiogroup" aria-label="Accent" className="flex gap-2">
              {ACCENTS.map((accent) => (
                <button
                  key={accent}
                  type="button"
                  role="radio"
                  aria-checked={theme.accent === accent}
                  aria-label={ACCENT_LABELS[accent]}
                  title={ACCENT_LABELS[accent]}
                  onClick={() => setTheme({ accent })}
                  className={`flex size-7 items-center justify-center rounded-full text-mountain-white outline-none focus-visible:shadow-focus-ring dark:text-mountain-950 ${ACCENT_SWATCH[accent]}`}
                >
                  {theme.accent === accent ? <IconCheck aria-hidden /> : null}
                </button>
              ))}
            </div>
          </OptionGroup>
          <Segments
            label="Surface"
            options={SURFACES}
            labels={SURFACE_LABELS}
            value={theme.surface}
            onChange={(surface) => setTheme({ surface })}
          />
          <Segments
            label="Shape"
            options={SHAPES}
            labels={SHAPE_LABELS}
            value={theme.shape}
            onChange={(shape) => setTheme({ shape })}
          />
          <Segments
            label="Contrast"
            options={CONTRASTS}
            labels={CONTRAST_LABELS}
            value={theme.contrast}
            onChange={(contrast) => setTheme({ contrast })}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
