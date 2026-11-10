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
6. As a teammate, I want to open a shared link and land on the same page, theme and variant, so that we can discuss one specific choice.

### Acceptance Scenarios

- Given the library is open, when I pick an area and a page in the navigation, then the page shows its summary, usage guidance and its variants grouped into named sections.
- Given a primitive page, when it loads, then it shows at least 20 variants, each with a title and a one-line note on when to pick it.
- Given a variant, when I select "View code", then I see the source of exactly that variant and can copy it.
- Given a variant built on a reusable library component, when I view its code, then I can also open the source of that component.
- Given any page, when I switch mode or pick a theme preset or option, then every variant re-renders in that theme and the choice survives a reload.
- Given the search, when I type a term, then I get matching pages and variants and can jump straight to one.
- Given a link copied from the address bar, when someone else opens it, then they see the same page, theme and open variant.
- Given the app runs outside Fusion, when it starts, then it still works and keeps state in the URL.

## Requirements

### Functional Requirements

- FR-001: The library MUST organise content into five areas: Foundations, Primitives, Patterns, Industrial and Templates.
- FR-002: Every Aura primitive exported by `@cognite/aura` MUST have its own page with at least 20 variants.
- FR-003: Every variant MUST have a unique id, a title, and a note saying when to use it; it MUST be marked as either Aura (plain component API) or Custom (a composition or customisation).
- FR-004: Variants MUST be rendered live, at a size that fits their content (small, medium, large or full width), on a neutral preview surface.
- FR-005: Users MUST be able to view and copy the source of any variant, and the source of any reusable library component it uses.
- FR-006: Customisation MUST keep Aura's basics: Aura primitives are composed and wrapped, never restyled through visual `className` overrides; all colour, spacing, radius and type come from Aura tokens.
- FR-007: Reusable customisations with their own behaviour MUST live in `src/library` so other apps can copy or import them.
- FR-008: The Industrial area MUST be separate from the general primitives and cover metrics, charts, operations and dashboard blocks, using one shared mock plant data set.
- FR-009: The Patterns area MUST show compositions that mix several primitives.
- FR-010: The Templates area MUST show the page layouts described in Aura's design guide.
- FR-011: Users MUST be able to switch between light and dark, and choose a theme: accent (7), surface (neutral or tinted), shape (sharp, default, soft) and contrast (default or high), or one of the named presets. Every variant MUST render in every theme.
- FR-016: Themes MUST be implemented only as overrides of Aura tokens in one stylesheet, applied with attributes on the root or on a region, and MUST keep text contrast at WCAG AA or better.
- FR-012: Users MUST be able to search pages and variants and jump to a result.
- FR-013: Current page, theme, search text and open variant MUST be synced to the host so reload and shared links restore them; outside Fusion the same state MUST be kept in the URL.
- FR-014: Pages MUST load on demand so opening the library does not load every page's code.
- FR-015: Icon-only controls MUST have an accessible name and a tooltip; every chart MUST have a text label.

## Success Criteria

- SC-001: 100% of Aura primitives have a page with 20 or more variants.
- SC-002: A user finds a named variant through search in under 10 seconds.
- SC-003: Copied variant code compiles unchanged in a Flows app that has `@cognite/aura` installed (plus the listed library files for Custom variants).
- SC-004: No variant uses raw hex, rgb or hsl colour values.
- SC-005: Every page renders without errors in both themes.

## Clarifications

- "Variant" means a deliberate, nameable choice: an Aura prop combination, a state, a content arrangement, or a composition. It never means the same component in an arbitrary colour.
- Where Aura's API offers fewer than 20 distinct prop combinations, the remaining variants are compositions with other primitives, states (loading, disabled, invalid, empty) and context placements.

## Assumptions

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
