import { Badge } from '@cognite/aura/components/badge';

import { useCatalogDeps } from '../CatalogDeps';
import { allPages, MANIFEST, type ManifestArea, type ManifestPage } from '../manifest';
import { useCatalogViewModel } from '../state/useCatalogViewModel';

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dd className="text-3xl font-semibold tabular-nums text-base-foreground">{value.toLocaleString('en-US')}</dd>
      <dt className="mt-1 text-sm text-muted-foreground">{label}</dt>
    </div>
  );
}

type TileButtonProps = { title: string; description: string; meta?: string; planned?: boolean; onSelect: () => void };

function TileButton({ title, description, meta, planned = false, onSelect }: TileButtonProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex h-full w-full flex-col gap-1 rounded-xl bg-base-background p-4 text-left outline-none transition-colors hover:bg-base-background-hover focus-visible:shadow-focus-ring"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-base font-medium text-base-foreground">{title}</span>
        {planned ? <Badge variant="archived">Planned</Badge> : null}
        {meta ? <span className="text-xs tabular-nums text-muted-foreground">{meta}</span> : null}
      </span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </button>
  );
}

export function HomeView() {
  const { index } = useCatalogDeps();
  const { openArea } = useCatalogViewModel();
  const builtPages = allPages().filter(({ page }) => index.specimenCount(page.id) > 0).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-12">
      <header>
        <h1 className="text-4xl font-semibold text-base-foreground">Aura Library</h1>
        <p className="mt-3 max-w-[37.5rem] text-base text-medium-foreground">
          Every Aura primitive in at least 20 variants, the patterns they combine into, industrial data
          components, and complete dashboards from classic operations screens to interactive 3D plants. Pick a
          variant, copy its code, and build on Aura tokens in any theme.
        </p>
        <dl className="mt-8 flex flex-wrap gap-12">
          <Stat value={index.totalSpecimens} label="Variants" />
          <Stat value={builtPages} label="Pages" />
          <Stat value={MANIFEST.length} label="Areas" />
        </dl>
      </header>
      <ul className="mt-10 grid grid-cols-12 gap-4">
        {MANIFEST.map((area) => (
          <li key={area.id} className="col-span-12 md:col-span-6 xl:col-span-4">
            <TileButton
              title={area.title}
              description={area.blurb}
              meta={`${area.groups.reduce((sum, group) => sum + group.pages.length, 0)} pages`}
              onSelect={() => openArea(area.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PageTile({ page }: { page: ManifestPage }) {
  const { index } = useCatalogDeps();
  const { openPage } = useCatalogViewModel();
  const count = index.specimenCount(page.id);
  return (
    <TileButton
      title={page.title}
      description={page.blurb}
      meta={count > 0 ? `${count} variants` : undefined}
      planned={count === 0}
      onSelect={() => openPage(page.id)}
    />
  );
}

export function AreaView({ area }: { area: ManifestArea }) {
  return (
    <div className="mx-auto w-full max-w-[min(100%,var(--container-8xl))] px-6 py-8">
      <header>
        <h1 className="text-3xl font-semibold text-base-foreground">{area.title}</h1>
        <p className="mt-2 max-w-[37.5rem] text-base text-medium-foreground">{area.blurb}</p>
      </header>
      <div className="mt-8 space-y-8">
        {area.groups.map((group) => (
          <section key={group.id} aria-labelledby={`group-${group.id}`}>
            <h2 id={`group-${group.id}`} className="text-xl font-medium text-base-foreground">
              {group.title}
            </h2>
            <ul className="mt-4 grid grid-cols-12 gap-4">
              {group.pages.map((page) => (
                <li key={page.id} className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3">
                  <PageTile page={page} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
