# Feature Specification: Aura Component Library

A browsable, copyable UI library for Flows apps. It shows every Aura primitive in at least 20
deliberate variants, the reusable compositions built from them, and a separate set of industrial
data components — all on Aura tokens so everything picked from it looks like one system.

## User Scenarios & Testing

### User Stories

1. As an app builder, I want to browse every Aura primitive in many ready-made variants, so that I can pick the one that fits my screen instead of designing it again.
2. As an app builder, I want to copy the exact code of a variant, so that I can paste it into my Flows app and have it work.
3. As an app builder, I want patterns that mix primitives (forms, filter bars, page headers, list rows), so that I can assemble pages from proven blocks.
4. As a builder of industrial apps, I want KPI tiles, gauges, trends, alarm lists, asset cards and dashboard blocks, so that operational screens share one visual language.
5. As a reviewer, I want to see every variant in light and dark theme, so that I can trust it in both.
7. As a product team, I want to pick a theme (accent, surface, shape, contrast) and see the whole library in it, so that different projects can look different while staying on Aura.
8. As a product team, I want to pick a look — a design language that changes how screens are built, not only their colours — so that an operator console, a wall screen and a report each get a structure that suits them.
9. As a reader, I want every label, tag and number in a readable sans typeface at a readable size, so that I never have to squint at tiny monospaced captions.
6. As a teammate, I want to open a shared link and land on the same page, theme and variant, so that we can discuss one specific choice.

### Acceptance Scenarios

- Given the library is open, when I pick an area and a page in the navigation, then the page shows its summary, usage guidance and its variants grouped into named sections.
- Given a primitive page, when it loads, then it shows at least 20 variants, each with a title and a one-line note on when to pick it.
- Given a variant, when I select "View code", then I see the source of exactly that variant and can copy it.
- Given a variant built on a reusable library component, when I view its code, then I can also open the source of that component.
- Given any page, when I switch mode or pick a theme preset or option, then every variant re-renders in that theme and the choice survives a reload.
- Given the theme menu, when I pick a look, then every kit-built screen and part rebuilds itself in that look (panel anatomy, figures, status, tables, charts, controls) and the choice survives a reload.
- Given the plant overview, when I scroll it, then I see the same plant data as eight different compositions, one per look.
- Given any specimen, when it is small, then its preview hugs it on a quiet patterned stage instead of floating in a tall empty box.
- Given the search, when I type a term, then I get matching pages and variants and can jump straight to one.
- Given a link copied from the address bar, when someone else opens it, then they see the same page, theme and open variant.
- Given the app runs outside Fusion, when it starts, then it still works and keeps state in the URL.

## Requirements

### Functional Requirements

- FR-001: The library MUST organise content into six areas: Foundations, Primitives, Patterns, Industrial, Dashboards and Templates.
- FR-017: The Dashboards area MUST contain at least twenty complete dashboards, and no two may share a layout: each has its own structure, interaction and visual character, shown in a named theme that suits it. Classic dashboards share the frame, grid and panel components so their craft is consistent.
- FR-018: The Dashboards area MUST include interactive 3D dashboards of industrial plants (orbit, hover, select) built with WebGL, with a non-WebGL fallback, and at least one drill-down journey that takes the user from plant level through area and equipment to a single sensor.
- FR-019: The Dashboards area MUST include futuristic styles (neon grid, HUD, glass, hologram, radial, text-mode) built only from Aura tokens and the deep dark surface.
- FR-020: Scene colours in 3D views MUST be read from Aura tokens at run time so scenes follow the active theme.
- FR-021: The library MUST provide the building blocks Aura does not ship — table, tag, stepper, timeline, drawer, alert dialog, context menu and resizable panes — as reusable components with the same 20-variant pages as Aura's primitives, and existing pages MUST use them instead of one-off versions.
- FR-022: The library MUST include working editors and builders (dashboard editor, form builder, query builder, node graph editor, Gantt chart, spreadsheet grid, pivot and tree tables, calendar scheduler, rich text editor, code and SQL editor) whose state changes through direct manipulation and keyboard, with no extra runtime dependencies beyond those already installed.
- FR-023: The Industrial area MUST include an interactive P&ID viewer with pan, zoom and clickable live tags, and at least one dashboard that links a P&ID selection to the same equipment in a 3D scene.
- FR-002: Every Aura primitive exported by `@cognite/aura` MUST have its own page with at least 20 variants.
- FR-003: Every variant MUST have a unique id, a title, and a note saying when to use it; it MUST be marked as either Aura (plain component API) or Custom (a composition or customisation).
- FR-004: Variants MUST be rendered live, at a size that fits their content (small, medium, large or full width), on a neutral preview surface.
- FR-005: Users MUST be able to view and copy the source of any variant, and the source of any reusable library component it uses.
- FR-006: Customisation MUST keep Aura's basics: Aura primitives are composed and wrapped, never restyled through visual `className` overrides; all colour, spacing, radius and type come from Aura tokens.
- FR-007: Reusable customisations with their own behaviour MUST live in `src/library` so other apps can copy or import them.
- FR-008: The Industrial area MUST be separate from the general primitives and cover metrics, charts, operations and dashboard blocks, using one shared mock plant data set.
- FR-009: The Patterns area MUST show compositions that mix several primitives.
- FR-010: The Templates area MUST show the page layouts described in Aura's design guide.
- FR-011: Users MUST be able to switch between light and dark, and choose a theme: accent (7), surface (neutral or tinted), shape (sharp, default, soft), contrast (default or high), density, typeface and look, or one of the named presets. Every variant MUST render in every theme.
- FR-016: Themes MUST be implemented only as overrides of Aura tokens in one stylesheet, applied with attributes on the root or on a region, and MUST keep text contrast at WCAG AA or better.
- FR-024: The library MUST provide looks: structural design languages selected with `data-look` on the root or a region (`LookScope`). A look owns canvas treatment, panel anatomy (border, shadow, fill, header style, padding, radius), KPI anatomy, status anatomy, table anatomy, chart styling, control radius and spacing rhythm, and composes with the colour theme (mode, accent, shape, density, typeface). At least eight MUST ship — studio (default), console, poster, glass, editorial, soft, blueprint, signal — each recognisable from a blurred thumbnail.
- FR-025: The library MUST provide a look-aware kit (`src/library/kit`: canvas, grid, panel, stat, status pill, delta, icon chip, meter, ring gauge, data table, list row, section header, legend, chart frame, trend, bars, donut, sparkline, heat strip, app frame, empty panel, tag id) whose parts read the active look, and rebuilt dashboard pages MUST be composed from it. `looks.css` MUST reference Aura tokens and ramp steps only.
- FR-026: The look MUST be part of the theme settings: selectable in the theme menu, set by presets, synced like the other options, default studio. Dark-only looks (console, glass, signal) bring dark mode with them.
- FR-027: Typography MUST be readable: monospace only inside code editors and code blocks; tag ids, numbers, timestamps, table cells and captions use the UI sans typeface with tabular figures; no text under 12px (including chart ticks and badges) and 12px only for secondary captions, with 14px body; labels in sentence case, never all-caps letter-spaced micro labels as the main labelling style; secondary text meets AA on its surface. Typeface options are sans families only (Inter, Space Grotesk, Manrope, IBM Plex Sans, Sora).
- FR-028: A specimen preview MUST hug its content with comfortable padding on a muted, subtly patterned stage; cards in a row align at the top; full-screen specimens may bleed to the card edge.
- FR-029: The Plant overview dashboard MUST show one plant data set as a full screen in every look, with a different composition per look (where the hero sits, how KPIs and state are shown, which chrome is used), followed by the kit parts.
- FR-012: Users MUST be able to search pages and variants and jump to a result.
- FR-013: Current page, theme, search text and open variant MUST be synced to the host so reload and shared links restore them; outside Fusion the same state MUST be kept in the URL.
- FR-014: Pages MUST load on demand so opening the library does not load every page's code. A page that fails to load MUST be retried automatically, and if it still fails the user MUST be offered a "Try again" action that loads it without reloading the app.
- FR-030: Full-screen dashboards and templates MUST be shown at their desktop design width and scaled down to fit a narrower preview, so they never reflow into overlapping or squeezed panels.
- FR-015: Icon-only controls MUST have an accessible name and a tooltip; every chart MUST have a text label.

## Success Criteria

- SC-001: 100% of Aura primitives have a page with 20 or more variants.
- SC-002: A user finds a named variant through search in under 10 seconds.
- SC-003: Copied variant code compiles unchanged in a Flows app that has `@cognite/aura` installed (plus the listed library files for Custom variants).
- SC-004: No variant uses raw hex, rgb or hsl colour values.
- SC-005: Every page renders without errors in both themes.
- SC-006: The layout audit (`scripts/audit-layout.cjs`) reports no variant that is cut off, overflows its frame or crashes, in the default theme and in a dense dark theme.
- SC-008: `looks.css` and the kit contain no raw colour values, no monospace UI font and no font size under 12px (checked by tests).
- SC-007: Pages without WebGL hold 60 frames per second at rest on a machine with no GPU; continuous decorative animation that costs more than that is opt-in.

## Clarifications

- "Variant" means a deliberate, nameable choice: an Aura prop combination, a state, a content arrangement, or a composition. It never means the same component in an arbitrary colour.
- Where Aura's API offers fewer than 20 distinct prop combinations, the remaining variants are compositions with other primitives, states (loading, disabled, invalid, empty) and context placements.

## Assumptions

- Light looks follow the surrounding mode, because Aura defines its light tokens only at the root; a region can force dark but not light.
- The library is a reference app; it reads no customer data. All data shown is mock data.
- Desktop is the primary target; pages stay usable down to tablet width.
- Sharing the reusable components as an npm package is out of scope for v1; they are copied or imported from `src/library`.

---

## Data Models & CDF Integration *(mandatory)*

### Existing views

None. The library does not read or write CDF data models.

### New views

None.

### Mock data

Industrial pages share one fictional plant data set in `src/catalog/data` (sites, assets, sensors,
time series, alarms, work orders). Time series are generated from a seeded generator so screens are
identical on every load. Shapes follow CDF concepts (asset hierarchy, time series, events) so a
picked component can be wired to real data later without changing its props.

### Host integration

- `connectToHostApp` provides `initialState` and `syncInternalState` for FR-013.
- No CDF client, access token or project name is required.
