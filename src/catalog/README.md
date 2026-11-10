# Authoring catalog pages

The contract every page in `src/catalog/pages` follows. `pages/primitives/button.tsx` is the
reference implementation — read it before writing a page.

## What a page is

One file per page: `src/catalog/pages/<area>/<page id>.tsx`. The id, area and title come from
`src/catalog/manifest.ts`; do not edit the manifest to add a page that is already listed.

```tsx
import { Button } from '@cognite/aura/components/button';

import { definePage } from '../../types';

import source from './button.tsx?raw';

function ButtonPrimary() {
  return <Button>Save changes</Button>;
}

export default definePage({
  id: 'button',
  title: 'Button',
  summary: 'One or two sentences on what it is for.',
  docsSlug: 'button', // primitives only
  guidance: { use: ['…'], avoid: ['…'] }, // 3–4 short lines each
  source,
  sections: [
    {
      id: 'emphasis',
      title: 'Emphasis',
      description: 'One line.',
      specimens: [
        {
          id: 'ButtonPrimary', // === the function name
          title: 'Primary',
          note: 'The single most important action on a view.',
          origin: 'aura',
          Component: ButtonPrimary,
        },
      ],
    },
  ],
});
```

Rules the build and `pages.test.tsx` rely on:

- Every specimen is a **top-level `function` declaration** (not an arrow const) with no props, and
  its `id` is exactly the function name. Prefix every function with the page name in PascalCase
  (`ButtonPrimary`, `KpiTilePlain`) — ids are unique across the whole library.
- `id`, `title`, `note` and `origin` are **plain string literals** inside the `definePage({...})`
  object literal. The search index reads them with a parser, so no variables, spreads, template
  strings or `.map()` to build `sections` or `specimens`.
- Module-level helpers (constants, types, small components) are fine and are copied into the code
  view automatically when a specimen references them. Keep them at column 0 and formatted the way
  Prettier would, with the closing `}` or `;` on its own line start.
- Primitive pages have **at least 20 specimens**, usually 22–30, in 4–6 sections.

## What counts as a variant

A variant is a deliberate, nameable choice someone would pick for a real screen:

1. An Aura prop or prop combination (variant, size, orientation, …).
2. A state: disabled with a reason, invalid, loading, empty, selected, read-only.
3. A content arrangement: with icon, with count, with description, truncated, long content.
4. A composition with other primitives, shown in a believable context.
5. A reusable customisation from `src/library`.

Not a variant: the same thing in another arbitrary colour, lorem ipsum, or two specimens that
differ only in label text. If a primitive's own API runs out before 20, go to states, content
arrangements and compositions — never pad.

Order sections from plain to composed: API variants → sizes and content → states → compositions.

## Field guide

| Field     | Use                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------ |
| `title`   | 1–4 words, sentence case, names the choice ("With leading icon").                                      |
| `note`    | One sentence saying **when to pick it**. Not a description of what is visible.                         |
| `origin`  | `aura` when it only uses Aura's API as documented; `custom` when it is a composition worth naming or uses `src/library`. |
| `size`    | `sm` (a third of the row, default), `md` (half), `lg` (two thirds), `full`. Give content the room it needs: a single control is `sm`; a form, list or card is `md`; a table, chart or dashboard block is `lg` or `full`. |
| `align`   | `center` (default) for a control; `stretch` when the specimen should fill the frame's width; `start` for top-left content. |
| `surface` | `base` (default), `muted` for things that sit on a grey page, `chrome` only for `*OnDark` variants.     |
| `uses`    | Library files the specimen imports, relative to `src/library`, e.g. `['actions/SplitButton.tsx']`.      |

Give `stretch` specimens their own width cap (`w-full max-w-sm`, `max-w-md`, …) when they should
not span the whole frame.

## Design rules

The library must read as one system. These come from `node_modules/@cognite/aura/DESIGN.md`; read
its Overview, Colors, Layout, Do's and Don'ts and the section for your primitive.

- **Aura first.** Use the Aura primitive. Import each from its own subpath
  (`@cognite/aura/components/button`), icons from `@cognite/aura/icons`.
- **Never restyle a primitive.** No visual utilities (`bg-*`, `text-*`, `rounded-*`, `shadow-*`,
  `border-*`, font sizes) in `className` on an Aura component — only layout (`w-full`, `ml-auto`,
  `max-w-*`, `grid-cols-*`, `hidden md:flex`). ESLint warns on violations; keep warnings at zero.
  Change appearance through the component's props, or compose.
- **Customise by composing.** Your own `div`/`span`/`section` wrappers may use token utilities.
- **Tokens only.** No hex, `rgb()`, `hsl()` or arbitrary Tailwind palette colours (`bg-blue-500`).
  Use the current names: `bg-base-background`, `bg-muted-background`, `bg-medium-background`,
  `bg-card-background`, `text-base-foreground`, `text-medium-foreground`, `text-muted-foreground`,
  `border-default`, `border-emphasized`; status `*-background` + `*-foreground` (on tint) or
  `*-foreground-strong` (on plain surface) for `success`, `warning`, `critical`, `info`, `neutral`;
  `decorative-{1..7}-*` for non-status accents; `chart-{1..5}-{50..450}` for plotted data only.
  Not the deprecated `text-foreground`, `bg-background`, `border-border`, `destructive-*`.
- **Colour means something.** Status colour only for status. Decorative colour only for
  differentiation. Chart colour only for plotted data. Most of any specimen is neutral.
- **Flat.** Separate with space and type first. No nested borders, no border around every row, no
  shadows on in-page cards. Radius from the scale: `rounded-md` small, `rounded-lg` controls,
  `rounded-xl` cards.
- **Spacing on the 4px scale.** `gap-2` between controls, `gap-3` toolbar items, `gap-4` in cards,
  `p-4` card padding, `space-y-4` between form fields. No gap between a `Label`, its control and its
  helper text — they carry their own padding.
- **Type from the scale.** `text-sm` for most UI, `text-xs` labels and metadata, `text-base` body,
  `text-xl`/`text-2xl` headings inside specimens. Weights `font-medium` and `font-semibold` only.
  Numbers that change or align use `tabular-nums`.
- **Sentence case, real content.** Labels are verb + object ("Save changes", "Delete pipeline").
  Content is believable industrial-software content: data sets, pipelines, time series, assets,
  work orders. No "Lorem ipsum", no "Item 1", no "John Doe", no emoji, no exclamation marks.
- **Accessible.** Icon-only controls need `aria-label` and a `Tooltip`. Inputs need a `Label`.
  Charts need an `aria-label` that says what they show. Do not disable a control without saying why.
- **Deterministic.** No `Math.random()`, no `Date.now()`, no network. Use `src/catalog/data`.
- **Works in both themes.** Tokens handle it; check the dark screenshot anyway.

## Lessons from the first pages

- **The lint rule cannot see subpath imports.** `aura/no-overriding-styles` only checks components
  imported from the old barrel, so zero warnings proves nothing. Police it yourself: the only
  classes allowed on an Aura component are layout ones.
- **`align: 'stretch'` gives full width and centres vertically.** Do not add `self-center` or
  `mx-auto` hacks; cap the width with `w-full max-w-*` on your own wrapper when needed.
- **There is no Table primitive.** Use a plain semantic `<table>` with token classes for small
  static tables and `@cognite/aura/data-grid` for anything sortable, selectable or long.
- **A vertical `Separator` needs a height from its row**, for example
  `data-[orientation=vertical]:h-4`.
- **Skeletons disappear on `bg-card-background` in dark theme.** Put loading placeholders on the
  base surface.
- **Themes change everything at once.** Accent, tinted surfaces, radius, spacing unit and typeface
  can all differ (see Foundations → Themes), so never hard-code a pixel size, a radius or a ramp
  step where a token or a spacing utility exists, and never assume the primary action is dark grey.
- **Fill the row.** Aim for sections whose specimens fill whole rows (three `sm`, or `sm` + `lg`,
  or two `md`), so a section does not end on a lone card.

## What already exists in `src/library`

Reuse before writing something new; read the file for the props.

- `actions/` — AsyncButton, ConfirmButton, CopyButton, SplitButton, ToggleGroup, SelectionActionBar, ShortcutHint
- `forms/` — FormField, PasswordInput, UnitNumberInput, CharacterCountTextarea, DebouncedSearch,
  InlineEditText, SelectAllCheckboxList, ChoiceCardGroup, SettingSwitchRow, StateTextSwitch,
  SliderField, SliderNumberInput, MultiSelectCombobox
- `display/` — PersonAvatar, AvatarGroup, StatusBadge, MetadataList, StatDelta
- `feedback/` — SingleToaster, DismissibleAlert, RetryBlock, LabelledProgress, Delayed,
  SkeletonText, SkeletonList, SkeletonTable, SkeletonCard
- `industrial/` — `status.ts` (tones, limits, formatters, class maps), ValueReadout, StatusDot,
  StatusIndicator, Sparkline, TrendDelta, KpiTile, RadialGauge, LinearGauge, RangeIndicator,
  LevelMeter, ProgressRing. In this grammar normal is neutral; colour appears only for a judged
  change or an abnormal state.
- `themes/` — theme options, presets and the generated stylesheet
- `data/`, `navigation/`, `overlays/`, `ai/` — list the folder; more is being added.

## Reusable components — `src/library`

When a customisation has behaviour or would be pasted more than once, make it a component in
`src/library/<domain>/Name.tsx` instead of inlining it in a specimen.

- One component per file, named export, props typed, a doc comment saying what it is for.
- Built from Aura primitives and tokens only; depends on nothing in `src/catalog`.
- Data comes in through props. Timers, clipboard and similar are injectable props with a default.
- No `any`, no `as` casts (except `as const`); use type guards.
- Ships with `Name.test.tsx` next to it covering its behaviour (React Testing Library, Vitest
  globals, Arrange / Act / Assert, one behaviour per test).
- Specimens that use it list the file in `uses`, so its source shows in the code view.

## Shared data — `src/catalog/data`

Industrial specimens use one fictional plant so screens agree with each other:
`plant.ts` (sites, assets, sensors, alarms, work orders, people, plant KPIs) and `series.ts`
(seeded `makeSeries`/`makeValues`, `REFERENCE_NOW`, formatters). Use these records and names;
do not invent a second plant.

## Checks before you are done

```sh
npx vitest run src/catalog/pages.test.tsx -t "<page id>:"   # contract for one page
npx vitest run src/library/<domain>                          # your components
npx eslint src/catalog/pages/<area>/<page id>.tsx src/library/<domain>   # 0 errors, 0 warnings
npx tsc --noEmit
npm run dev                                                  # in another terminal
node scripts/audit-layout.cjs <page id>                      # nothing cut, overflowing or crashed
node scripts/audit-layout.cjs <page id> --dark --theme control-room
```

The audit must report 0 findings for your page in the default theme and in at least one dense
dark theme. It catches specimens that crash, content wider than its frame, text cut without an
ellipsis, elements sticking out of the card, and console errors.

Then look at it: open the page in both themes and check that nothing overflows its frame, nothing
is clipped, every specimen has the room it needs, and the page looks like the Button page's sibling.
