import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { useEffect, useRef, useState } from 'react';

import { useCatalogViewModel } from '../state/useCatalogViewModel';

import { AreaView, HomeView } from './OverviewViews';
import { PageView } from './PageView';
import { SearchDialog } from './SearchDialog';
import { SidebarNav } from './SidebarNav';
import { ThemeRoot } from './ThemeRoot';
import { TopNav } from './TopNav';

type KeyTarget = Pick<Document, 'addEventListener' | 'removeEventListener' | 'documentElement'>;

type CatalogAppProps = { doc: KeyTarget };

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

export function CatalogApp({ doc }: CatalogAppProps) {
  const { state, area, location } = useCatalogViewModel();
  // Transient: whether the palette is showing is not worth restoring on reload; its query is.
  const [searchOpen, setSearchOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !isTypingTarget(event.target)) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    doc.addEventListener('keydown', onKeyDown);
    return () => doc.removeEventListener('keydown', onKeyDown);
  }, [doc]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [state.page, state.area]);

  return (
    <ThemeRoot theme={state.theme} target={doc.documentElement}>
      <TooltipProvider>
        <div className="flex h-screen flex-col bg-muted-background text-base-foreground">
          <TopNav onSearch={() => setSearchOpen(true)} />
          <div className="flex min-h-0 flex-1">
            {area ? <SidebarNav area={area} /> : null}
            <main ref={mainRef} className="min-w-0 flex-1 overflow-y-auto">
              {location ? <PageView key={location.page.id} location={location} /> : null}
              {!location && area ? <AreaView area={area} /> : null}
              {!location && !area ? <HomeView /> : null}
            </main>
          </div>
          <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
        </div>
      </TooltipProvider>
    </ThemeRoot>
  );
}
