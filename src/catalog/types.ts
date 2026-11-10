import type { ComponentType } from 'react';

/** How much room a specimen gets in the 12-column grid. */
export type SpecimenSize = 'sm' | 'md' | 'lg' | 'full';

/** Where the specimen sits inside its preview frame. */
export type SpecimenAlign = 'center' | 'start' | 'stretch';

/** Preview surface. `chrome` is the fixed-dark shell surface for `*OnDark` variants. */
export type SpecimenSurface = 'base' | 'muted' | 'chrome';

/** `aura` = plain Aura component API. `custom` = a composition or customisation built on Aura. */
export type SpecimenOrigin = 'aura' | 'custom';

export type Specimen = {
  /** Unique across the library. Must equal the name of the top-level function that renders it. */
  id: string;
  title: string;
  /** One sentence: when to pick this variant. */
  note: string;
  origin: SpecimenOrigin;
  size?: SpecimenSize;
  align?: SpecimenAlign;
  surface?: SpecimenSurface;
  /** Reusable library files this specimen relies on, relative to `src/library`. */
  uses?: readonly string[];
  Component: ComponentType;
};

export type SpecimenSection = {
  id: string;
  title: string;
  description?: string;
  specimens: readonly Specimen[];
};

export type PageGuidance = {
  use: readonly string[];
  avoid: readonly string[];
};

export type CatalogPage = {
  id: string;
  title: string;
  summary: string;
  guidance?: PageGuidance;
  /** Aura docs slug, e.g. `button` → docs.cognite.com/aura-design-system/primitives/button. */
  docsSlug?: string;
  /** Raw source of the page file (`import source from './x.tsx?raw'`). */
  source: string;
  sections: readonly SpecimenSection[];
};

export function definePage(page: CatalogPage): CatalogPage {
  return page;
}
