import { Button } from '@cognite/aura/components/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationResultsPerPage,
  PaginationResultsPerPageLabel,
  PaginationSelectTrigger,
  PaginationStatus,
  PaginationTeleport,
} from '@cognite/aura/components/pagination';
import { Select, SelectContent, SelectItem, SelectValue } from '@cognite/aura/components/select';
import { useState } from 'react';

import { PageNumbers } from '../../../library/navigation/PageNumbers';
import { TablePagination } from '../../../library/navigation/TablePagination';
import { ALARMS, SENSORS, findAsset } from '../../data/plant';
import { formatAgo } from '../../data/series';
import { definePage } from '../../types';

import source from './pagination.tsx?raw';

const FIVE_PAGES = [1, 2, 3, 4, 5];

function PaginationBasic() {
  const [page, setPage] = useState(2);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious isDisabled={page === 1} onClick={() => setPage(page - 1)} />
        </PaginationItem>
        {FIVE_PAGES.map((number) => (
          <PaginationItem key={number}>
            <PaginationLink isActive={number === page} onClick={() => setPage(number)}>
              {number}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext isDisabled={page === 5} onClick={() => setPage(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function PaginationWithEllipsis() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink>1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink>11</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink isActive>12</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink>13</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink>52</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function PaginationFirstAndLast() {
  const [page, setPage] = useState(3);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationFirst isDisabled={page === 1} onClick={() => setPage(1)} />
        </PaginationItem>
        <PaginationItem>
          <PaginationPrevious isDisabled={page === 1} onClick={() => setPage(page - 1)} />
        </PaginationItem>
        {FIVE_PAGES.map((number) => (
          <PaginationItem key={number}>
            <PaginationLink isActive={number === page} onClick={() => setPage(number)}>
              {number}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext isDisabled={page === 5} onClick={() => setPage(page + 1)} />
        </PaginationItem>
        <PaginationItem>
          <PaginationLast isDisabled={page === 5} onClick={() => setPage(5)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function PaginationArrowsOnly() {
  const [page, setPage] = useState(3);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious isDisabled={page === 1} onClick={() => setPage(page - 1)} />
        </PaginationItem>
        <PaginationItem>
          <PaginationStatus className="px-2 tabular-nums">Page {page} of 12</PaginationStatus>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext isDisabled={page === 12} onClick={() => setPage(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function PaginationWithTeleport() {
  const [page, setPage] = useState(12);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious isDisabled={page === 1} onClick={() => setPage(page - 1)} />
        </PaginationItem>
        <PaginationItem>
          <PaginationTeleport currentPage={page} totalPages={52} onPageChange={setPage} aria-label="Go to page" />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext isDisabled={page === 52} onClick={() => setPage(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function PaginationSmall() {
  const [page, setPage] = useState(2);

  return (
    <Pagination size="small">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious isDisabled={page === 1} onClick={() => setPage(page - 1)} />
        </PaginationItem>
        {FIVE_PAGES.map((number) => (
          <PaginationItem key={number}>
            <PaginationLink isActive={number === page} onClick={() => setPage(number)}>
              {number}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext isDisabled={page === 5} onClick={() => setPage(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function PaginationSmallTeleport() {
  const [page, setPage] = useState(7);

  return (
    <Pagination size="small">
      <PaginationContent>
        <PaginationItem>
          <PaginationFirst isDisabled={page === 1} onClick={() => setPage(1)} />
        </PaginationItem>
        <PaginationItem>
          <PaginationPrevious isDisabled={page === 1} onClick={() => setPage(page - 1)} />
        </PaginationItem>
        <PaginationItem>
          <PaginationTeleport currentPage={page} totalPages={128} onPageChange={setPage} aria-label="Go to page" />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext isDisabled={page === 128} onClick={() => setPage(page + 1)} />
        </PaginationItem>
        <PaginationItem>
          <PaginationLast isDisabled={page === 128} onClick={() => setPage(128)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function PaginationWithPageSize() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('25');

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious isDisabled={page === 1} onClick={() => setPage(page - 1)} />
        </PaginationItem>
        {[1, 2, 3].map((number) => (
          <PaginationItem key={number}>
            <PaginationLink isActive={number === page} onClick={() => setPage(number)}>
              {number}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext isDisabled={page === 3} onClick={() => setPage(page + 1)} />
        </PaginationItem>
        <PaginationResultsPerPage>
          <PaginationResultsPerPageLabel>Per page</PaginationResultsPerPageLabel>
          <Select value={pageSize} onValueChange={setPageSize}>
            <PaginationSelectTrigger aria-label="Rows per page">
              <SelectValue />
            </PaginationSelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </PaginationResultsPerPage>
      </PaginationContent>
    </Pagination>
  );
}

function PaginationWithStatus() {
  const [page, setPage] = useState(2);

  return (
    <div className="flex flex-col items-center gap-2">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious isDisabled={page === 1} onClick={() => setPage(page - 1)} />
          </PaginationItem>
          {FIVE_PAGES.map((number) => (
            <PaginationItem key={number}>
              <PaginationLink isActive={number === page} onClick={() => setPage(number)}>
                {number}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext isDisabled={page === 5} onClick={() => setPage(page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <PaginationStatus className="tabular-nums">
        Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, 118)} of 118 time series
      </PaginationStatus>
    </div>
  );
}

function PaginationLocalisedLabels() {
  const [page, setPage] = useState(2);

  return (
    <Pagination aria-label="Sidenavigering">
      <PaginationContent>
        <PaginationItem>
          <PaginationFirst label="Gå til første side" isDisabled={page === 1} onClick={() => setPage(1)} />
        </PaginationItem>
        <PaginationItem>
          <PaginationPrevious label="Gå til forrige side" isDisabled={page === 1} onClick={() => setPage(page - 1)} />
        </PaginationItem>
        <PaginationItem>
          <PaginationStatus className="px-2 tabular-nums">Side {page} av 9</PaginationStatus>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext label="Gå til neste side" isDisabled={page === 9} onClick={() => setPage(page + 1)} />
        </PaginationItem>
        <PaginationItem>
          <PaginationLast label="Gå til siste side" isDisabled={page === 9} onClick={() => setPage(9)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function PaginationFirstPage() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious isDisabled />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink isActive>1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink>2</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink>3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function PaginationLastPage() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink>1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink>2</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink isActive>3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext isDisabled />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function PaginationSinglePage() {
  return <PaginationStatus className="tabular-nums">Showing all 8 work orders</PaginationStatus>;
}

function PaginationLoadingPage() {
  const [page, setPage] = useState(3);
  const [pending, setPending] = useState<number | null>(4);

  const go = (target: number) => {
    setPending(target);
    window.setTimeout(() => {
      setPage(target);
      setPending(null);
    }, 1200);
  };
  const busy = pending !== null;

  return (
    <div className="flex flex-col items-center gap-2">
      <Pagination aria-busy={busy}>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious isDisabled={busy || page === 1} onClick={() => go(page - 1)} />
          </PaginationItem>
          {FIVE_PAGES.map((number) => (
            <PaginationItem key={number}>
              <PaginationLink
                isActive={number === (pending ?? page)}
                isDisabled={busy && number !== pending}
                onClick={() => go(number)}
              >
                {number}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext isDisabled={busy || page === 5} onClick={() => go(page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <PaginationStatus>{busy ? `Loading page ${pending}…` : `Page ${page} of 5`}</PaginationStatus>
      {busy ? (
        <Button variant="ghost" size="sm" onClick={() => go(pending ?? page)}>
          Finish loading
        </Button>
      ) : null}
    </div>
  );
}

function PaginationControlled() {
  const [page, setPage] = useState(12);

  return (
    <Pagination>
      <PaginationContent>
        <PageNumbers page={page} pageCount={52} onPageChange={setPage} />
      </PaginationContent>
    </Pagination>
  );
}

function PaginationControlledFirstLast() {
  const [page, setPage] = useState(1);

  return (
    <Pagination size="small">
      <PaginationContent>
        <PageNumbers page={page} pageCount={128} onPageChange={setPage} showFirstLast />
      </PaginationContent>
    </Pagination>
  );
}

function PaginationUnknownTotal() {
  const [page, setPage] = useState(3);
  const first = (page - 1) * 100 + 1;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious label="Newer events" isDisabled={page === 1} onClick={() => setPage(page - 1)} />
        </PaginationItem>
        <PaginationItem>
          <PaginationStatus className="px-2 tabular-nums">
            Events {first}–{first + 99}
          </PaginationStatus>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext label="Older events" onClick={() => setPage(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function PaginationTableFooter() {
  const [page, setPage] = useState(2);
  const [pageSize, setPageSize] = useState(25);

  return (
    <TablePagination
      page={page}
      pageSize={pageSize}
      total={1284}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      itemLabel="time series"
    />
  );
}

function PaginationTableFooterSmall() {
  const [page, setPage] = useState(1);

  return (
    <TablePagination
      page={page}
      pageSize={50}
      total={6400}
      onPageChange={setPage}
      itemLabel="events"
      size="small"
      showFirstLast
    />
  );
}

function PaginationEmptyResult() {
  return <TablePagination page={1} pageSize={25} total={0} onPageChange={() => undefined} itemLabel="alarms" />;
}

function PaginationUnderTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const rows = SENSORS.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex w-full flex-col gap-3">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-default text-xs text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Tag</th>
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Asset</th>
            <th className="py-2 text-right font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((sensor) => (
            <tr key={sensor.id}>
              <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{sensor.tag}</td>
              <td className="py-2 pr-4 text-base-foreground">{sensor.name}</td>
              <td className="py-2 pr-4 text-medium-foreground">{findAsset(sensor.assetId)?.name}</td>
              <td className="py-2 text-right tabular-nums text-base-foreground">
                {sensor.value} {sensor.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={SENSORS.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[5, 10]}
        itemLabel="sensors"
        size="small"
      />
    </div>
  );
}

function PaginationCardFooter() {
  const perPage = 3;
  const pageCount = Math.ceil(ALARMS.length / perPage);
  const [page, setPage] = useState(1);
  const alarms = ALARMS.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl bg-base-background p-4">
      <h4 className="text-sm font-medium text-base-foreground">Recent alarms</h4>
      <ul className="flex min-h-36 flex-col gap-3">
        {alarms.map((alarm) => (
          <li key={alarm.id} className="flex flex-col gap-0.5">
            <span className="text-sm text-base-foreground">{alarm.message}</span>
            <span className="text-xs text-muted-foreground">
              {alarm.sensorTag} · {formatAgo(alarm.raisedAt)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-default pt-3">
        <PaginationStatus className="tabular-nums">
          {(page - 1) * perPage + 1}–{Math.min(page * perPage, ALARMS.length)} of {ALARMS.length}
        </PaginationStatus>
        <Pagination size="small" className="mx-0 w-auto">
          <PaginationContent>
            <PageNumbers page={page} pageCount={pageCount} onPageChange={setPage} arrowsOnly />
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

export default definePage({
  id: 'pagination',
  title: 'Pagination',
  summary:
    'Splits a long result set into pages and lets people move between them, so a table loads fast and a position in it can be found again.',
  docsSlug: 'pagination',
  guidance: {
    use: [
      'Under tables, grids and search results with more rows than fit comfortably on one page.',
      'Previous and next always; numbered pages when people jump, a page field when there are hundreds.',
      'A rows-per-page select and a "26–50 of 1,284" status for large data sets.',
      'Below the content and left-aligned, with filters and selection kept across pages.',
    ],
    avoid: [
      'Paging a list that has fewer than about 20 rows in total.',
      'Pagination for feeds people skim; use "Load more" or infinite scroll.',
      'Hiding previous or next at the ends — disable them so the layout does not jump.',
      'Resetting to page one when the page size changes.',
    ],
  },
  source,
  sections: [
    {
      id: 'anatomy',
      title: 'Anatomy',
      description: 'The parts, and the four ways to combine them. Click through the live ones.',
      specimens: [
        {
          id: 'PaginationBasic',
          title: 'Numbered pages',
          note: 'Up to about seven pages: every page is one click away.',
          origin: 'aura',
          Component: PaginationBasic,
        },
        {
          id: 'PaginationArrowsOnly',
          title: 'Previous and next',
          note: 'Narrow footers, or lists people only step through in order.',
          origin: 'aura',
          Component: PaginationArrowsOnly,
        },
        {
          id: 'PaginationWithTeleport',
          title: 'Page field',
          note: 'Hundreds of pages: type a page number instead of clicking towards it.',
          origin: 'aura',
          Component: PaginationWithTeleport,
        },
        {
          id: 'PaginationWithEllipsis',
          title: 'Collapsed with ellipses',
          note: 'Many pages: first, last and the neighbours of the current page stay visible.',
          origin: 'aura',
          size: 'md',
          Component: PaginationWithEllipsis,
        },
        {
          id: 'PaginationFirstAndLast',
          title: 'First and last',
          note: 'Sorted lists where both ends matter, such as newest and oldest.',
          origin: 'aura',
          size: 'md',
          Component: PaginationFirstAndLast,
        },
      ],
    },
    {
      id: 'size-and-content',
      title: 'Size and content',
      description: 'Two sizes, and the status and page-size parts that travel with the links.',
      specimens: [
        {
          id: 'PaginationSmall',
          title: 'Small',
          note: 'Dense tables, cards and side panels; 28px controls instead of 36px.',
          origin: 'aura',
          Component: PaginationSmall,
        },
        {
          id: 'PaginationSmallTeleport',
          title: 'Small with page field',
          note: 'The most compact way to reach any of a hundred pages.',
          origin: 'aura',
          Component: PaginationSmallTeleport,
        },
        {
          id: 'PaginationLocalisedLabels',
          title: 'Localised labels',
          note: 'Any language other than English: the icon buttons need translated names.',
          origin: 'aura',
          Component: PaginationLocalisedLabels,
        },
        {
          id: 'PaginationWithStatus',
          title: 'With range status',
          note: 'When people need to know how much there is, not only where they are.',
          origin: 'aura',
          size: 'md',
          Component: PaginationWithStatus,
        },
        {
          id: 'PaginationWithPageSize',
          title: 'With rows per page',
          note: 'Large data sets where some people scan 25 rows and others want 100.',
          origin: 'aura',
          size: 'md',
          Component: PaginationWithPageSize,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'The ends of the list, a page on its way, and lists too short or too open-ended to number.',
      specimens: [
        {
          id: 'PaginationFirstPage',
          title: 'On the first page',
          note: 'Previous is disabled, not hidden, so the row does not shift.',
          origin: 'aura',
          Component: PaginationFirstPage,
        },
        {
          id: 'PaginationLastPage',
          title: 'On the last page',
          note: 'Next is disabled; the last number tells people this is the end.',
          origin: 'aura',
          Component: PaginationLastPage,
        },
        {
          id: 'PaginationLoadingPage',
          title: 'Loading a page',
          note: 'The target page is marked at once and the other links wait, so a slow fetch is not clicked twice.',
          origin: 'custom',
          Component: PaginationLoadingPage,
        },
        {
          id: 'PaginationSinglePage',
          title: 'Everything fits',
          note: 'One page of results: drop the links and keep the count.',
          origin: 'aura',
          Component: PaginationSinglePage,
        },
        {
          id: 'PaginationUnknownTotal',
          title: 'Unknown total',
          note: 'Cursor-based APIs that cannot count: step through and show the range, not a total.',
          origin: 'aura',
          Component: PaginationUnknownTotal,
        },
        {
          id: 'PaginationEmptyResult',
          title: 'No results',
          note: 'A filter that matches nothing: the footer stays and says so.',
          origin: 'custom',
          align: 'stretch',
          uses: ['navigation/TablePagination.tsx', 'navigation/PageNumbers.tsx'],
          Component: PaginationEmptyResult,
        },
      ],
    },
    {
      id: 'controlled',
      title: 'Controlled',
      description:
        'One page number in, one callback out. The library component works out which numbers to show.',
      specimens: [
        {
          id: 'PaginationControlled',
          title: 'Page and page count',
          note: 'Any paged list: pass the page and the count, and the ellipses follow.',
          origin: 'custom',
          size: 'md',
          uses: ['navigation/PageNumbers.tsx', 'navigation/pageItems.ts'],
          Component: PaginationControlled,
        },
        {
          id: 'PaginationControlledFirstLast',
          title: 'With first and last, small',
          note: 'Long event logs in a dense table, where jumping to the oldest page is common.',
          origin: 'custom',
          size: 'md',
          uses: ['navigation/PageNumbers.tsx', 'navigation/pageItems.ts'],
          Component: PaginationControlledFirstLast,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Pagination as the footer of the thing it pages.',
      specimens: [
        {
          id: 'PaginationCardFooter',
          title: 'Card footer',
          note: 'A short list in a card: range on the left, arrows on the right.',
          origin: 'custom',
          surface: 'muted',
          uses: ['navigation/PageNumbers.tsx'],
          Component: PaginationCardFooter,
        },
        {
          id: 'PaginationTableFooterSmall',
          title: 'Dense table footer',
          note: 'The same footer at small size, with jumps to both ends and a fixed page size.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['navigation/TablePagination.tsx', 'navigation/PageNumbers.tsx'],
          Component: PaginationTableFooterSmall,
        },
        {
          id: 'PaginationTableFooter',
          title: 'Table footer',
          note: 'The full footer: page links and page size on the left, the range and total on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['navigation/TablePagination.tsx', 'navigation/PageNumbers.tsx'],
          Component: PaginationTableFooter,
        },
        {
          id: 'PaginationUnderTable',
          title: 'Under a table',
          note: 'A paged table end to end. Change the page size on page two: the first visible row stays.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['navigation/TablePagination.tsx', 'navigation/PageNumbers.tsx'],
          Component: PaginationUnderTable,
        },
      ],
    },
  ],
});
