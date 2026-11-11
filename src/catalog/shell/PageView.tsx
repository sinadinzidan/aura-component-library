import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { Loader } from '@cognite/aura/components/loader';
import { IconExternalLink } from '@cognite/aura/icons';
import { useRef } from 'react';

import type { PageLocation } from '../manifest';
import { useCatalogViewModel } from '../state/useCatalogViewModel';
import type { CatalogPage, PageGuidance } from '../types';
import { useCatalogPage } from '../useCatalogPage';

import { CodeDialog } from './CodeDialog';
import { SpecimenCard } from './SpecimenCard';

const DOCS_BASE = 'https://docs.cognite.com/aura-design-system/primitives';
const STORYBOOK_BASE = 'https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives';

function countSpecimens(page: CatalogPage): number {
  return page.sections.reduce((sum, section) => sum + section.specimens.length, 0);
}

function GuidanceList({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="min-w-0 flex-1">
      <h2 className="text-xs font-medium text-muted-foreground">{title}</h2>
      <ul className="mt-2 space-y-1 text-sm text-base-foreground">
        {items.map((item) => (
          <li key={item} className="max-w-[37.5rem]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Guidance({ guidance }: { guidance: PageGuidance }) {
  return (
    <div className="mt-6 flex flex-col gap-6 rounded-xl bg-base-background p-4 md:flex-row">
      <GuidanceList title="Use when" items={guidance.use} />
      <GuidanceList title="Avoid" items={guidance.avoid} />
    </div>
  );
}

type PageHeaderProps = { location: PageLocation; page: CatalogPage | null; onJump: (sectionId: string) => void };

function PageHeader({ location, page, onJump }: PageHeaderProps) {
  const { openExternal } = useCatalogViewModel();
  const docsSlug = page?.docsSlug;

  return (
    <header>
      <p className="text-sm text-muted-foreground">
        {location.area.title} / {location.group.title}
      </p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold text-base-foreground">{location.page.title}</h1>
          <p className="mt-2 max-w-[37.5rem] text-base text-medium-foreground">
            {page?.summary ?? location.page.blurb}
          </p>
        </div>
        {docsSlug ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => openExternal(`${DOCS_BASE}/${docsSlug}`)}>
              Aura docs <IconExternalLink />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openExternal(`${STORYBOOK_BASE}-${docsSlug.replace(/-/g, '')}--docs`)}
            >
              Storybook <IconExternalLink />
            </Button>
          </div>
        ) : null}
      </div>
      {page?.guidance ? <Guidance guidance={page.guidance} /> : null}
      {page ? (
        <nav aria-label="Sections" className="mt-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-muted-foreground">
            {countSpecimens(page)} variants in {page.sections.length} sections
          </span>
          {page.sections.map((section) => (
            <Button key={section.id} variant="secondary" size="sm" onClick={() => onJump(section.id)}>
              {section.title}
            </Button>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

type PageViewProps = { location: PageLocation };

export function PageView({ location }: PageViewProps) {
  const result = useCatalogPage(location);
  const { state, openSpecimen, closeSpecimen } = useCatalogViewModel();
  const sectionRefs = useRef(new Map<string, HTMLElement>());

  const page = result.status === 'ready' ? result.page : null;
  const openSpecimenEntry =
    page?.sections.flatMap((section) => section.specimens).find((specimen) => specimen.id === state.specimen) ?? null;

  const jumpTo = (sectionId: string) => {
    sectionRefs.current.get(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mx-auto w-full max-w-[min(100%,var(--container-8xl))] px-6 py-8">
      <PageHeader location={location} page={page} onJump={jumpTo} />

      {result.status === 'loading' ? (
        <div className="mt-12 flex justify-center">
          <Loader size={24} aria-label="Loading page" />
        </div>
      ) : null}

      {result.status === 'error' ? (
        <div className="mt-8 max-w-[37.5rem]">
          <Alert variant="error">
            <AlertDescription>This page could not be loaded. Reload to try again.</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {result.status === 'planned' ? (
        <div className="mt-12">
          <EmptyState>
            <EmptyStateTitle>Planned</EmptyStateTitle>
            <EmptyStateDescription>This page is on the roadmap and has no variants yet.</EmptyStateDescription>
          </EmptyState>
        </div>
      ) : null}

      {page ? (
        <div className="mt-8 space-y-10">
          {page.sections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={`section-${section.id}`}
              className="scroll-mt-4"
              ref={(element) => {
                if (element) sectionRefs.current.set(section.id, element);
                else sectionRefs.current.delete(section.id);
              }}
            >
              <h2 id={`section-${section.id}`} className="text-xl font-medium text-base-foreground">
                {section.title}
              </h2>
              {section.description ? (
                <p className="mt-1 max-w-[37.5rem] text-sm text-muted-foreground">{section.description}</p>
              ) : null}
              <div className="mt-4 grid grid-cols-12 items-start gap-4">
                {section.specimens.map((specimen) => (
                  <SpecimenCard
                    key={specimen.id}
                    specimen={specimen}
                    onViewCode={(specimenId) => openSpecimen(location.page.id, specimenId)}
                  />
                ))}
              </div>
            </section>
          ))}
          <CodeDialog page={page} specimen={openSpecimenEntry} onClose={closeSpecimen} />
        </div>
      ) : null}
    </div>
  );
}
