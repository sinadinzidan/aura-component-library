import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@cognite/aura/components/command';

import { useCatalogDeps } from '../CatalogDeps';
import type { SearchHit } from '../catalogIndex';
import { useCatalogViewModel } from '../state/useCatalogViewModel';

const RESULT_LIMIT = 40;

type SearchDialogProps = { open: boolean; onOpenChange: (open: boolean) => void };

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const { index } = useCatalogDeps();
  const { state, setQuery, openPage, openSpecimen } = useCatalogViewModel();

  const hits = index.search(state.query, RESULT_LIMIT);
  const pageHits = hits.filter((hit) => hit.kind === 'page');
  const specimenHits = hits.filter((hit) => hit.kind === 'specimen');

  const select = (hit: SearchHit) => {
    if (hit.kind === 'page') openPage(hit.pageId);
    else openSpecimen(hit.pageId, hit.specimenId);
    onOpenChange(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search the library"
      description="Find a page or a variant by name or purpose."
    >
      <CommandInput placeholder="Search pages and variants" value={state.query} onValueChange={setQuery} />
      <CommandList>
        {state.query.trim() ? <CommandEmpty>No pages or variants match.</CommandEmpty> : null}
        {pageHits.length > 0 ? (
          <CommandGroup heading="Pages">
            {pageHits.map((hit) => (
              <HitItem
                key={`page-${hit.pageId}`}
                hit={hit}
                value={`page-${hit.pageId}`}
                query={state.query}
                onSelect={select}
              />
            ))}
          </CommandGroup>
        ) : null}
        {specimenHits.length > 0 ? (
          <CommandGroup heading="Variants">
            {specimenHits.map((hit) =>
              hit.kind === 'specimen' ? (
                <HitItem key={hit.specimenId} hit={hit} value={hit.specimenId} query={state.query} onSelect={select} />
              ) : null
            )}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}

type HitItemProps = { hit: SearchHit; value: string; query: string; onSelect: (hit: SearchHit) => void };

function HitItem({ hit, value, query, onSelect }: HitItemProps) {
  // The index already filtered and ranked the hits. Passing the query as a keyword makes the
  // palette's own filter accept every hit instead of filtering a second time on `value`.
  return (
    <CommandItem value={value} keywords={[query]} onSelect={() => onSelect(hit)}>
      <span className="truncate">{hit.title}</span>
      <span className="ml-auto truncate text-xs text-muted-foreground">{hit.detail}</span>
    </CommandItem>
  );
}
