import { ScrollArea } from '@cognite/aura/components/scroll-area';

import { useCatalogDeps } from '../CatalogDeps';
import type { ManifestArea } from '../manifest';
import { useCatalogViewModel } from '../state/useCatalogViewModel';

type SidebarNavProps = { area: ManifestArea };

export function SidebarNav({ area }: SidebarNavProps) {
  const { index } = useCatalogDeps();
  const { location, openPage, openArea } = useCatalogViewModel();
  const overviewSelected = location === null;

  return (
    <nav aria-label={area.title} className="flex w-60 shrink-0 flex-col border-r border-default bg-base-background">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 p-3">
          <NavButton label="Overview" selected={overviewSelected} onSelect={() => openArea(area.id)} />
          {area.groups.map((group) => (
            <div key={group.id}>
              <h2 className="px-2 pb-1 text-xs font-medium text-muted-foreground">{group.title}</h2>
              <ul className="space-y-0.5">
                {group.pages.map((page) => {
                  const count = index.specimenCount(page.id);
                  return (
                    <li key={page.id}>
                      <NavButton
                        label={page.title}
                        meta={count > 0 ? String(count) : undefined}
                        muted={count === 0}
                        selected={location?.page.id === page.id}
                        onSelect={() => openPage(page.id)}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </ScrollArea>
    </nav>
  );
}

type NavButtonProps = {
  label: string;
  meta?: string;
  muted?: boolean;
  selected: boolean;
  onSelect: () => void;
};

function NavButton({ label, meta, muted = false, selected, onSelect }: NavButtonProps) {
  const tone = selected
    ? 'bg-secondary-background text-base-foreground font-medium'
    : muted
      ? 'text-muted-foreground hover:bg-base-background-hover'
      : 'text-medium-foreground hover:bg-base-background-hover hover:text-base-foreground';
  return (
    <button
      type="button"
      aria-current={selected ? 'page' : undefined}
      onClick={onSelect}
      className={`flex h-8 w-full items-center justify-between gap-2 rounded-md px-2 text-left text-sm outline-none transition-colors focus-visible:shadow-focus-ring ${tone}`}
    >
      <span className="truncate">{label}</span>
      {meta ? <span className="text-xs tabular-nums text-muted-foreground">{meta}</span> : null}
    </button>
  );
}
