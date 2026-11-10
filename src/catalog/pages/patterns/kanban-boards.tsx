import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { Search } from '@cognite/aura/components/search';
import { IconPlus } from '@cognite/aura/icons';
import { useReducer, useState } from 'react';
import type { ReactNode } from 'react';

import { ToggleGroup } from '../../../library/actions/ToggleGroup';
import { AvatarGroup } from '../../../library/display/AvatarGroup';
import { DueLabel } from '../../../library/industrial/operations/DueLabel';
import { PriorityBadge } from '../../../library/industrial/operations/PriorityBadge';
import { StatRow } from '../../../library/patterns/collections/StatRow';
import { FilterBar } from '../../../library/patterns/data-entry/FilterBar';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { PageHeader } from '../../../library/patterns/structure/PageHeader';
import { PropertyList } from '../../../library/patterns/structure/PropertyList';
import { SidePanel } from '../../../library/patterns/structure/SidePanel';
import { boardReducer, columnOfCard } from '../../../library/patterns/workflows/boardReducer';
import type { BoardState } from '../../../library/patterns/workflows/boardReducer';
import { KanbanCard } from '../../../library/patterns/workflows/KanbanCard';
import { KanbanColumn } from '../../../library/patterns/workflows/KanbanColumn';
import { KanbanMoveControls } from '../../../library/patterns/workflows/KanbanMoveControls';
import { PEOPLE, findAsset, findPerson } from '../../data/plant';
import { definePage } from '../../types';

import source from './kanban-boards.tsx?raw';

type BoardCrew = 'Mechanical' | 'Instrument' | 'Operations';

type BoardCard = {
  id: string;
  title: string;
  assetId: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  crew: BoardCrew;
  assigneeId: string | null;
  /** Already formatted. */
  due: string;
  overdue?: boolean;
  progress?: number;
  blockedReason?: string;
};

/** The maintenance board for week 11 at Nordkapp. The first eight are the plant's work orders. */
const BOARD_CARDS: readonly BoardCard[] = [
  { id: 'WO-104482', title: 'Inspect recompressor drive-end bearing', assetId: '23-ka-9103', priority: 'P1', crew: 'Mechanical', assigneeId: 'tb', due: 'in 6 h', progress: 35 },
  { id: 'WO-104479', title: 'Replace bearing temperature transmitter', assetId: '40-pa-4001', priority: 'P2', crew: 'Instrument', assigneeId: 'jn', due: '13 Mar' },
  { id: 'WO-104471', title: 'Clean interstage cooler tube bundle', assetId: '23-ha-9114', priority: 'P2', crew: 'Mechanical', assigneeId: 'ms', due: '16 Mar', progress: 10, blockedReason: 'Gasket kit arrives 14 Mar' },
  { id: 'WO-104466', title: 'Vibration survey, 1st stage compressor', assetId: '23-ka-9101', priority: 'P2', crew: 'Mechanical', assigneeId: null, due: '14 Mar' },
  { id: 'WO-104458', title: 'Standby start test, export pump B', assetId: '27-pa-2001b', priority: 'P3', crew: 'Operations', assigneeId: null, due: '8 Mar', overdue: true },
  { id: 'WO-104440', title: 'Calibrate separator level transmitter', assetId: '20-va-1001', priority: 'P3', crew: 'Instrument', assigneeId: 'jn', due: '11 Mar' },
  { id: 'WO-104431', title: 'Partial stroke test, inlet shutdown valve', assetId: '20-xv-1105', priority: 'P2', crew: 'Operations', assigneeId: 'tb', due: '10 Mar' },
  { id: 'WO-104419', title: 'Upgrade turbine control firmware', assetId: '23-gt-9001', priority: 'P4', crew: 'Instrument', assigneeId: 'ak', due: '24 Mar' },
  { id: 'WO-104487', title: 'Recalibrate cooler outlet temperature transmitter', assetId: '23-ha-9114', priority: 'P2', crew: 'Instrument', assigneeId: 'jn', due: '12 Mar', progress: 60 },
  { id: 'WO-104493', title: 'Replace mechanical seal, export pump A', assetId: '27-pa-2001a', priority: 'P3', crew: 'Mechanical', assigneeId: null, due: '19 Mar' },
];

const BOARD_COLUMNS = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'planned', title: 'Planned' },
  { id: 'doing', title: 'In progress' },
  { id: 'done', title: 'Done' },
] as const;

/** At most three jobs in progress at once: one per available crew. */
const DOING_LIMIT = 3;

const BOARD_INITIAL: BoardState = {
  columns: [
    { id: 'backlog', cardIds: ['WO-104466', 'WO-104458', 'WO-104493'] },
    { id: 'planned', cardIds: ['WO-104479', 'WO-104419'] },
    { id: 'doing', cardIds: ['WO-104482', 'WO-104471', 'WO-104487'] },
    { id: 'done', cardIds: ['WO-104440', 'WO-104431'] },
  ],
  collapsed: [],
};

const CREWS: readonly BoardCrew[] = ['Mechanical', 'Instrument', 'Operations'];

function cardById(id: string): BoardCard {
  const card = BOARD_CARDS.find((candidate) => candidate.id === id);
  if (!card) throw new Error(`Unknown card ${id}`);
  return card;
}

function columnTitle(columnId: string | undefined): string {
  return BOARD_COLUMNS.find((column) => column.id === columnId)?.title ?? '';
}

function cardsIn(state: BoardState, columnId: string): readonly string[] {
  return state.columns.find((column) => column.id === columnId)?.cardIds ?? [];
}

type WorkCardProps = {
  card: BoardCard;
  actions?: ReactNode;
  density?: 'default' | 'compact';
  done?: boolean;
  onOpen?: () => void;
  selected?: boolean;
};

/** A board card filled from one work order: equipment, priority, due date and assignee. */
function KanbanBoardWorkCard({ card, actions, density, done = false, onOpen, selected }: WorkCardProps) {
  const asset = findAsset(card.assetId);
  return (
    <KanbanCard
      reference={card.id}
      title={card.title}
      description={
        <>
          <span className="font-mono">{asset?.tag}</span> {asset?.name}
        </>
      }
      badge={<PriorityBadge priority={card.priority} />}
      blockedReason={done ? undefined : card.blockedReason}
      progress={done ? undefined : card.progress}
      meta={<DueLabel due={card.due} overdue={card.overdue} done={done} />}
      assignee={findPerson(card.assigneeId) ?? null}
      actions={actions}
      density={density}
      onOpen={onOpen}
      selected={selected}
    />
  );
}

function KanbanBoardCardCompact() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <KanbanCard density="compact" reference="WO-104466" title="Vibration survey, 1st stage compressor" />
      <KanbanCard density="compact" reference="WO-104458" title="Standby start test, export pump B" />
      <KanbanCard density="compact" reference="WO-104493" title="Replace mechanical seal, export pump A" />
    </div>
  );
}

function KanbanBoardCardAssignee() {
  const card = cardById('WO-104479');
  const asset = findAsset(card.assetId);
  return (
    <div className="w-full max-w-xs">
      <KanbanCard
        reference={card.id}
        title={card.title}
        description={
          <>
            <span className="font-mono">{asset?.tag}</span> {asset?.name}
          </>
        }
        meta={<DueLabel due={card.due} />}
        assignee={findPerson(card.assigneeId)}
      />
    </div>
  );
}

function KanbanBoardCardPriority() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <KanbanCard
        reference="WO-104482"
        title="Inspect recompressor drive-end bearing"
        badge={<PriorityBadge priority="P1" showMeaning />}
        meta={<DueLabel due="in 6 h" />}
        assignee={findPerson('tb')}
      />
      <KanbanCard
        reference="WO-104419"
        title="Upgrade turbine control firmware"
        badge={<PriorityBadge priority="P4" showMeaning />}
        meta={<DueLabel due="24 Mar" />}
        assignee={findPerson('ak')}
      />
    </div>
  );
}

function KanbanBoardCardProgress() {
  const card = cardById('WO-104487');
  return (
    <div className="w-full max-w-xs">
      <KanbanCard
        reference={card.id}
        title={card.title}
        badge={<PriorityBadge priority={card.priority} />}
        progress={card.progress}
        meta={<span className="tabular-nums">3 of 5 checks done</span>}
        assignee={findPerson(card.assigneeId)}
      />
    </div>
  );
}

function KanbanBoardCardBlocked() {
  const card = cardById('WO-104471');
  return (
    <div className="w-full max-w-xs">
      <KanbanBoardWorkCard card={card} />
    </div>
  );
}

function KanbanBoardCardGrip() {
  const [columnId, setColumnId] = useState('planned');
  const card = cardById('WO-104479');
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <KanbanCard
        grip
        reference={card.id}
        title={card.title}
        badge={<PriorityBadge priority={card.priority} />}
        meta={<DueLabel due={card.due} />}
        assignee={findPerson(card.assigneeId)}
        actions={<KanbanMoveControls cardLabel={card.id} columns={BOARD_COLUMNS} currentColumnId={columnId} onMove={setColumnId} controls="menu" />}
      />
      <p aria-live="polite" className="text-xs text-muted-foreground">
        In column: <span className="font-medium text-base-foreground">{columnTitle(columnId)}</span>
      </p>
    </div>
  );
}

function KanbanBoardColumnBasic() {
  return (
    <div className="w-full max-w-xs">
      <KanbanColumn title="Planned" count={2}>
        <KanbanBoardWorkCard card={cardById('WO-104479')} />
        <KanbanBoardWorkCard card={cardById('WO-104419')} />
      </KanbanColumn>
    </div>
  );
}

function KanbanBoardColumnWipLimit() {
  return (
    <div className="w-full max-w-xs">
      <KanbanColumn title="In progress" count={3} limit={DOING_LIMIT}>
        <KanbanBoardWorkCard density="compact" card={cardById('WO-104482')} />
        <KanbanBoardWorkCard density="compact" card={cardById('WO-104471')} />
        <KanbanBoardWorkCard density="compact" card={cardById('WO-104487')} />
      </KanbanColumn>
    </div>
  );
}

function KanbanBoardColumnOverLimit() {
  return (
    <div className="w-full max-w-xs">
      <KanbanColumn title="In progress" count={4} limit={DOING_LIMIT}>
        <KanbanBoardWorkCard density="compact" card={cardById('WO-104482')} />
        <KanbanBoardWorkCard density="compact" card={cardById('WO-104471')} />
        <KanbanBoardWorkCard density="compact" card={cardById('WO-104487')} />
        <KanbanBoardWorkCard density="compact" card={cardById('WO-104479')} />
      </KanbanColumn>
    </div>
  );
}

function KanbanBoardColumnEmpty() {
  return (
    <div className="w-full max-w-xs">
      <KanbanColumn title="Waiting for permit" count={0} empty="No job is waiting for a permit. Jobs land here when a permit to work is requested." />
    </div>
  );
}

function KanbanBoardColumnAddCard() {
  const [titles, setTitles] = useState<readonly string[]>(['Vibration survey, 1st stage compressor']);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const close = () => {
    setAdding(false);
    setDraft('');
  };
  const add = () => {
    if (draft.trim() === '') return;
    setTitles([...titles, draft.trim()]);
    close();
  };
  return (
    <div className="w-full max-w-xs">
      <KanbanColumn title="Backlog" count={titles.length} onAdd={adding ? undefined : () => setAdding(true)} addLabel="Add work order">
        {titles.map((title, index) => (
          <KanbanCard key={title} density="compact" reference={index === 0 ? 'WO-104466' : `Draft ${index}`} title={title} />
        ))}
        {adding ? (
          <form
            className="flex flex-col gap-2 rounded-lg border border-default bg-base-background p-2"
            onSubmit={(event) => {
              event.preventDefault();
              add();
            }}
          >
            <Input aria-label="Work order title" placeholder="What needs doing?" autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={draft.trim() === ''}>
                Add work order
              </Button>
            </div>
          </form>
        ) : null}
      </KanbanColumn>
    </div>
  );
}

function KanbanBoardColumnScrolling() {
  const ids = ['WO-104466', 'WO-104458', 'WO-104493', 'WO-104479', 'WO-104419', 'WO-104440', 'WO-104431'];
  return (
    <div className="w-full max-w-xs">
      <KanbanColumn title="Backlog" count={ids.length}>
        <div className="-mr-1 flex max-h-56 flex-col gap-2 overflow-y-auto pr-1" tabIndex={0} role="group" aria-label="Backlog cards">
          {ids.map((id) => (
            <KanbanBoardWorkCard key={id} density="compact" card={cardById(id)} />
          ))}
        </div>
      </KanbanColumn>
    </div>
  );
}

function KanbanBoardColumnCollapsed() {
  const [board, dispatch] = useReducer(boardReducer, { ...BOARD_INITIAL, collapsed: ['backlog'] });
  return (
    <div className="flex w-full max-w-md items-start gap-3">
      {BOARD_COLUMNS.slice(0, 2).map((column) => {
        const ids = cardsIn(board, column.id);
        const collapsed = board.collapsed.includes(column.id);
        return (
          <div key={column.id} className={collapsed ? 'shrink-0' : 'min-w-0 flex-1'}>
            <KanbanColumn
              title={column.title}
              count={ids.length}
              collapsed={collapsed}
              onToggleCollapse={() => dispatch({ type: 'toggle-collapse', columnId: column.id })}
            >
              {ids.map((id) => (
                <KanbanBoardWorkCard key={id} density="compact" card={cardById(id)} />
              ))}
            </KanbanColumn>
          </div>
        );
      })}
    </div>
  );
}

function KanbanBoardDoneCountOnly() {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <div className="w-full max-w-md">
      <KanbanColumn
        title="Done"
        count={12}
        collapsed={collapsed}
        collapsedLayout="summary"
        collapsedSummary="12 work orders closed this week. The two latest show when expanded."
        onToggleCollapse={() => setCollapsed(!collapsed)}
      >
        <KanbanBoardWorkCard done card={cardById('WO-104440')} />
        <KanbanBoardWorkCard done card={cardById('WO-104431')} />
      </KanbanColumn>
    </div>
  );
}

function KanbanBoardMoveMenu() {
  const [board, dispatch] = useReducer(boardReducer, BOARD_INITIAL);
  return (
    <div className="grid w-full grid-cols-2 items-start gap-3">
      {BOARD_COLUMNS.slice(0, 2).map((column) => {
        const ids = cardsIn(board, column.id);
        return (
          <KanbanColumn key={column.id} title={column.title} count={ids.length} empty="Move a card here from its menu.">
            {ids.map((id) => (
              <KanbanCard
                key={id}
                density="compact"
                reference={id}
                title={cardById(id).title}
                actions={
                  <KanbanMoveControls
                    cardLabel={id}
                    columns={BOARD_COLUMNS.slice(0, 2)}
                    currentColumnId={column.id}
                    onMove={(toColumnId) => dispatch({ type: 'move', cardId: id, toColumnId })}
                    controls="menu"
                  />
                }
              />
            ))}
          </KanbanColumn>
        );
      })}
    </div>
  );
}

function KanbanBoardMoveButtons() {
  const [board, dispatch] = useReducer(boardReducer, BOARD_INITIAL);
  const [message, setMessage] = useState('Use the arrows on a card to move it.');
  const columns = BOARD_COLUMNS.slice(1, 3);
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="grid grid-cols-2 items-start gap-3">
        {columns.map((column) => {
          const ids = cardsIn(board, column.id);
          return (
            <KanbanColumn key={column.id} title={column.title} count={ids.length} limit={column.id === 'doing' ? DOING_LIMIT : undefined} empty="No cards.">
              {ids.map((id) => (
                <KanbanCard
                  key={id}
                  density="compact"
                  reference={id}
                  title={cardById(id).title}
                  actions={
                    <KanbanMoveControls
                      cardLabel={id}
                      columns={columns}
                      currentColumnId={column.id}
                      onMove={(toColumnId) => {
                        dispatch({ type: 'move', cardId: id, toColumnId });
                        setMessage(`${id} moved to ${columnTitle(toColumnId)}.`);
                      }}
                      controls="buttons"
                    />
                  }
                />
              ))}
            </KanbanColumn>
          );
        })}
      </div>
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function KanbanBoardSummaryHeader() {
  const blocked = BOARD_CARDS.filter((card) => card.blockedReason).length;
  return (
    <PageHeader
      as="h2"
      title="Maintenance board"
      description="Week 11, 9–15 March. Nordkapp gas processing plant."
      meta={<AvatarGroup label="Crew on the board" sizes="xsm" people={PEOPLE.slice(1, 6)} />}
      actions={
        <Button size="sm">
          <IconPlus aria-hidden="true" /> Create work order
        </Button>
      }
    >
      <StatRow
        label="Board summary, week 11"
        stats={[
          { id: 'backlog', label: 'Backlog', value: '3', detail: '1 overdue' },
          { id: 'planned', label: 'Planned', value: '2', detail: '27 h estimated' },
          { id: 'doing', label: 'In progress', value: '3', detail: `Limit ${DOING_LIMIT}` },
          { id: 'blocked', label: 'Blocked', value: String(blocked), detail: 'Waiting for parts' },
          { id: 'done', label: 'Done this week', value: '12', detail: '9 last week' },
        ]}
      />
    </PageHeader>
  );
}

const ALL_CREWS = 'all';

const CREW_OPTIONS = [{ value: ALL_CREWS, label: 'All crews' }, ...CREWS.map((crew) => ({ value: crew, label: crew }))];

/** Search, crew and state filters shared by the filter bar specimen and the full board. */
function useBoardFilter() {
  const [query, setQuery] = useState('');
  const [crew, setCrew] = useState(ALL_CREWS);
  const [flags, setFlags] = useState<string[]>([]);
  const matches = (card: BoardCard) =>
    (query.trim() === '' || `${card.id} ${card.title}`.toLowerCase().includes(query.trim().toLowerCase())) &&
    (crew === ALL_CREWS || card.crew === crew) &&
    (!flags.includes('blocked') || card.blockedReason !== undefined) &&
    (!flags.includes('unassigned') || card.assigneeId === null);
  const chips = [
    ...(crew === ALL_CREWS ? [] : [{ id: 'crew', label: 'Crew', value: crew }]),
    ...(flags.includes('blocked') ? [{ id: 'blocked', label: 'State', value: 'Blocked' }] : []),
    ...(flags.includes('unassigned') ? [{ id: 'unassigned', label: 'Assignee', value: 'Unassigned' }] : []),
  ];
  const removeChip = (id: string) => (id === 'crew' ? setCrew(ALL_CREWS) : setFlags(flags.filter((flag) => flag !== id)));
  const clear = () => {
    setCrew(ALL_CREWS);
    setFlags([]);
  };
  return { query, setQuery, crew, setCrew, flags, setFlags, matches, chips, removeChip, clear };
}

type BoardFilter = ReturnType<typeof useBoardFilter>;

function KanbanBoardFilterControls({ filter, shown }: { filter: BoardFilter; shown: number }) {
  return (
    <FilterBar
      label="Filter the board"
      chips={filter.chips}
      onRemoveChip={filter.removeChip}
      onClearAll={filter.clear}
      summary={`${shown} of ${BOARD_CARDS.length} cards`}
    >
      <div className="w-56">
        <Search
          aria-label="Search cards"
          placeholder="Search cards"
          value={filter.query}
          onChange={(event) => filter.setQuery(event.target.value)}
          onClear={() => filter.setQuery('')}
        />
      </div>
      <div className="w-40">
        <OptionSelect aria-label="Crew" options={CREW_OPTIONS} value={filter.crew} onValueChange={filter.setCrew} />
      </div>
      <ToggleGroup
        label="Card state"
        variant="outline"
        value={filter.flags}
        onValueChange={filter.setFlags}
        options={[
          { value: 'blocked', label: 'Blocked', count: BOARD_CARDS.filter((card) => card.blockedReason).length },
          { value: 'unassigned', label: 'Unassigned', count: BOARD_CARDS.filter((card) => card.assigneeId === null).length },
        ]}
      />
    </FilterBar>
  );
}

function KanbanBoardFilterBar() {
  const filter = useBoardFilter();
  const shown = BOARD_CARDS.filter(filter.matches);
  return (
    <div className="flex w-full flex-col gap-4">
      <KanbanBoardFilterControls filter={filter} shown={shown.length} />
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">No card matches. Clear a filter to see more.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          {shown.slice(0, 6).map((card) => (
            <li key={card.id} className="flex">
              <KanbanBoardWorkCard density="compact" card={card} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function KanbanBoardDetailPanel() {
  const [openId, setOpenId] = useState<string | null>('WO-104482');
  const ids = cardsIn(BOARD_INITIAL, 'doing');
  const card = openId ? cardById(openId) : null;
  const asset = card ? findAsset(card.assetId) : undefined;
  return (
    <div className="grid h-96 w-full grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-stretch gap-4">
      <div>
        <KanbanColumn title="In progress" count={ids.length} limit={DOING_LIMIT}>
          {ids.map((id) => (
            <KanbanBoardWorkCard key={id} density="compact" card={cardById(id)} onOpen={() => setOpenId(id)} selected={openId === id} />
          ))}
        </KanbanColumn>
      </div>
      {card ? (
        <SidePanel
          title={card.title}
          description={<span className="font-mono">{card.id}</span>}
          status={<PriorityBadge priority={card.priority} />}
          onClose={() => setOpenId(null)}
          footer={
            <>
              <Button variant="secondary" size="sm">
                Open work order
              </Button>
              <Button size="sm">Mark as done</Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <PropertyList
              items={[
                { label: 'Equipment', value: `${asset?.tag} ${asset?.name}` },
                { label: 'Crew', value: card.crew },
                { label: 'Assignee', value: findPerson(card.assigneeId)?.name },
                { label: 'Due', value: <DueLabel due={card.due} overdue={card.overdue} /> },
                { label: 'Progress', value: card.progress === undefined ? undefined : `${card.progress}%` },
                { label: 'Blocked by', value: card.blockedReason },
              ]}
            />
          </div>
        </SidePanel>
      ) : (
        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-default p-6 text-center text-sm text-muted-foreground">
          Select a card to see its details.
        </div>
      )}
    </div>
  );
}

function KanbanBoardFull() {
  const [board, dispatch] = useReducer(boardReducer, BOARD_INITIAL);
  return (
    <div className="flex w-full items-start gap-3">
      {BOARD_COLUMNS.map((column) => {
        const ids = cardsIn(board, column.id);
        const collapsed = board.collapsed.includes(column.id);
        return (
          <div key={column.id} className={collapsed ? 'shrink-0' : 'min-w-0 flex-1'}>
            <KanbanColumn
              title={column.title}
              count={ids.length}
              limit={column.id === 'doing' ? DOING_LIMIT : undefined}
              collapsed={collapsed}
              onToggleCollapse={() => dispatch({ type: 'toggle-collapse', columnId: column.id })}
              empty="No cards in this column."
            >
              {ids.map((id) => (
                <KanbanBoardWorkCard
                  key={id}
                  card={cardById(id)}
                  done={column.id === 'done'}
                  actions={
                    <KanbanMoveControls
                      cardLabel={id}
                      columns={BOARD_COLUMNS}
                      currentColumnId={column.id}
                      onMove={(toColumnId) => dispatch({ type: 'move', cardId: id, toColumnId })}
                    />
                  }
                />
              ))}
            </KanbanColumn>
          </div>
        );
      })}
    </div>
  );
}

type LaneProps = {
  board: BoardState;
  lanes: readonly { id: string; title: string; note?: string; has: (card: BoardCard) => boolean }[];
  onMove: (cardId: string, toColumnId: string) => void;
};

/** Board columns across, lanes down: every cell holds the cards of one lane in one column. */
function KanbanBoardLanes({ board, lanes, onMove }: LaneProps) {
  const grid = 'grid grid-cols-[7rem_repeat(4,minmax(0,1fr))] gap-2';
  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <div className={grid}>
        <span />
        {BOARD_COLUMNS.map((column) => (
          <span key={column.id} className="flex items-baseline gap-2 px-2 text-sm font-medium text-base-foreground">
            {column.title}
            <span className="font-normal tabular-nums text-muted-foreground">{cardsIn(board, column.id).length}</span>
          </span>
        ))}
      </div>
      {lanes.map((lane) => {
        const laneTotal = board.columns.flatMap((column) => column.cardIds).filter((id) => lane.has(cardById(id))).length;
        return (
          <section key={lane.id} aria-label={`${lane.title}, ${laneTotal} cards`} className={`${grid} border-t border-default pt-2`}>
            <header className="flex flex-col gap-0.5 pt-2">
              <h3 className="text-sm font-medium text-base-foreground">{lane.title}</h3>
              <span className="text-xs tabular-nums text-muted-foreground">
                {laneTotal} {laneTotal === 1 ? 'card' : 'cards'}
              </span>
              {lane.note ? <span className="text-xs text-muted-foreground">{lane.note}</span> : null}
            </header>
            {BOARD_COLUMNS.map((column) => {
              const ids = cardsIn(board, column.id).filter((id) => lane.has(cardById(id)));
              return (
                <div key={column.id} role="group" aria-label={`${lane.title}, ${column.title}`} className="flex min-h-12 min-w-0 flex-col gap-2 rounded-xl bg-muted-background p-2">
                  {ids.map((id) => (
                    <KanbanCard
                      key={id}
                      density="compact"
                      reference={id}
                      title={cardById(id).title}
                      blockedReason={column.id === 'done' ? undefined : cardById(id).blockedReason}
                      actions={
                        <KanbanMoveControls
                          cardLabel={id}
                          columns={BOARD_COLUMNS}
                          currentColumnId={column.id}
                          onMove={(toColumnId) => onMove(id, toColumnId)}
                          controls="menu"
                        />
                      }
                    />
                  ))}
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

function KanbanBoardSwimlanesCrew() {
  const [board, dispatch] = useReducer(boardReducer, BOARD_INITIAL);
  return (
    <KanbanBoardLanes
      board={board}
      onMove={(cardId, toColumnId) => dispatch({ type: 'move', cardId, toColumnId })}
      lanes={CREWS.map((crew) => ({ id: crew, title: crew, has: (card: BoardCard) => card.crew === crew }))}
    />
  );
}

function KanbanBoardSwimlanesPriority() {
  const [board, dispatch] = useReducer(boardReducer, BOARD_INITIAL);
  return (
    <KanbanBoardLanes
      board={board}
      onMove={(cardId, toColumnId) => dispatch({ type: 'move', cardId, toColumnId })}
      lanes={[
        { id: 'expedite', title: 'Expedite', note: 'P1 and P2', has: (card: BoardCard) => card.priority === 'P1' || card.priority === 'P2' },
        { id: 'standard', title: 'Standard', note: 'P3 and P4', has: (card: BoardCard) => card.priority === 'P3' || card.priority === 'P4' },
      ]}
    />
  );
}

function KanbanBoardFiltered() {
  const [board, dispatch] = useReducer(boardReducer, BOARD_INITIAL);
  const filter = useBoardFilter();
  const visible = (columnId: string) => cardsIn(board, columnId).filter((id) => filter.matches(cardById(id)));
  const shown = BOARD_COLUMNS.reduce((total, column) => total + visible(column.id).length, 0);
  return (
    <div className="flex w-full flex-col gap-4">
      <KanbanBoardFilterControls filter={filter} shown={shown} />
      <div className="grid grid-cols-4 items-start gap-3">
        {BOARD_COLUMNS.map((column) => {
          const ids = visible(column.id);
          const total = cardsIn(board, column.id).length;
          return (
            <KanbanColumn
              key={column.id}
              title={column.title}
              count={total}
              limit={column.id === 'doing' ? DOING_LIMIT : undefined}
              empty={total === 0 ? 'No cards in this column.' : `${total} ${total === 1 ? 'card is' : 'cards are'} hidden by the filters.`}
            >
              {ids.length === 0 && total > 0 ? (
                <p className="px-1 py-2 text-xs text-muted-foreground">
                  {total} {total === 1 ? 'card is' : 'cards are'} hidden by the filters.
                </p>
              ) : null}
              {ids.map((id) => (
                <KanbanBoardWorkCard
                  key={id}
                  density="compact"
                  card={cardById(id)}
                  done={column.id === 'done'}
                  actions={
                    <KanbanMoveControls
                      cardLabel={id}
                      columns={BOARD_COLUMNS}
                      currentColumnId={columnOfCard(board, id) ?? column.id}
                      onMove={(toColumnId) => dispatch({ type: 'move', cardId: id, toColumnId })}
                      controls="menu"
                    />
                  }
                />
              ))}
            </KanbanColumn>
          );
        })}
      </div>
    </div>
  );
}

export default definePage({
  id: 'kanban-boards',
  title: 'Kanban boards',
  summary:
    'Work as cards that move through stages. Columns show how much sits in each stage, limits show where it piles up, and every move works without dragging.',
  guidance: {
    use: [
      'A board when work moves through a handful of stages and people ask "what is stuck".',
      'A count in every column header, and a limit on the stages where work piles up.',
      'A menu or arrow buttons on each card, so moving never depends on drag and drop.',
      'Blocked as words and an icon on the card, with the reason.',
    ],
    avoid: [
      'More than six columns; collapse finished stages to a rail or a count.',
      'Cards that carry every field. Reference, title and one or two facts; the rest opens in a panel.',
      'Colouring whole cards by priority or status.',
      'A board for work that has no stages; use a list.',
    ],
  },
  source,
  sections: [
    {
      id: 'cards',
      title: 'Cards',
      description: 'What one card can carry, from a title to a blocked job with progress.',
      specimens: [
        {
          id: 'KanbanBoardCardCompact',
          title: 'Compact',
          note: 'Long columns where reference and title are enough to recognise the job.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanCard.tsx'],
          Component: KanbanBoardCardCompact,
        },
        {
          id: 'KanbanBoardCardAssignee',
          title: 'With assignee',
          note: 'The default card: what, on which equipment, due when and who has it.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanCard.tsx', 'industrial/operations/DueLabel.tsx'],
          Component: KanbanBoardCardAssignee,
        },
        {
          id: 'KanbanBoardCardPriority',
          title: 'With priority',
          note: 'When the board mixes urgent and routine work; only P1 and P2 carry colour.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanCard.tsx', 'industrial/operations/PriorityBadge.tsx'],
          Component: KanbanBoardCardPriority,
        },
        {
          id: 'KanbanBoardCardProgress',
          title: 'With progress',
          note: 'Jobs with countable steps, so the card answers "how far" without opening.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanCard.tsx'],
          Component: KanbanBoardCardProgress,
        },
        {
          id: 'KanbanBoardCardBlocked',
          title: 'Blocked',
          note: 'A job that cannot move on: the word, an icon and the reason, in place on the card.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanCard.tsx'],
          Component: KanbanBoardCardBlocked,
        },
        {
          id: 'KanbanBoardCardGrip',
          title: 'Grip and move menu',
          note: 'A board that also supports dragging: the grip signals it, the menu is the equivalent everyone can use.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanCard.tsx', 'patterns/workflows/KanbanMoveControls.tsx'],
          Component: KanbanBoardCardGrip,
        },
      ],
    },
    {
      id: 'columns',
      title: 'Columns',
      description: 'One stage of the flow: its name, how much is in it and what happens at its limits.',
      specimens: [
        {
          id: 'KanbanBoardColumnBasic',
          title: 'Header and count',
          note: 'Every column: the stage name with the number of cards beside it.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanColumn.tsx', 'patterns/workflows/KanbanCard.tsx'],
          Component: KanbanBoardColumnBasic,
        },
        {
          id: 'KanbanBoardColumnWipLimit',
          title: 'At the WIP limit',
          note: 'A stage with a limit: the count reads against it and says when the stage is full.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanColumn.tsx', 'patterns/workflows/boardReducer.ts'],
          Component: KanbanBoardColumnWipLimit,
        },
        {
          id: 'KanbanBoardColumnOverLimit',
          title: 'Over the WIP limit',
          note: 'More started than the crews can carry: a warning icon and how far over.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanColumn.tsx', 'patterns/workflows/boardReducer.ts'],
          Component: KanbanBoardColumnOverLimit,
        },
        {
          id: 'KanbanBoardColumnEmpty',
          title: 'Empty column',
          note: 'A stage with nothing in it says what lands there instead of leaving a gap.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanColumn.tsx'],
          Component: KanbanBoardColumnEmpty,
        },
        {
          id: 'KanbanBoardColumnAddCard',
          title: 'Add a card',
          note: 'Capture a job in the stage it starts in; a title is enough to begin with.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanColumn.tsx', 'patterns/workflows/KanbanCard.tsx'],
          Component: KanbanBoardColumnAddCard,
        },
        {
          id: 'KanbanBoardColumnScrolling',
          title: 'Scrolling column',
          note: 'A backlog longer than the screen scrolls on its own; the header and count stay put.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanColumn.tsx', 'patterns/workflows/KanbanCard.tsx'],
          Component: KanbanBoardColumnScrolling,
        },
        {
          id: 'KanbanBoardColumnCollapsed',
          title: 'Collapsed to a rail',
          note: 'Give the active stages more width; the rail keeps the name and the count in view.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanColumn.tsx', 'patterns/workflows/boardReducer.ts'],
          Component: KanbanBoardColumnCollapsed,
        },
        {
          id: 'KanbanBoardDoneCountOnly',
          title: 'Done as a count',
          note: 'Finished work matters as a number; the cards stay one click away.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanColumn.tsx'],
          Component: KanbanBoardDoneCountOnly,
        },
      ],
    },
    {
      id: 'moving',
      title: 'Moving cards',
      description: 'Real moves through the board reducer, with no drag library involved.',
      specimens: [
        {
          id: 'KanbanBoardMoveMenu',
          title: 'Move to… menu',
          note: 'Jump a card to any column in one step; the current column is marked and cannot be picked.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanMoveControls.tsx', 'patterns/workflows/boardReducer.ts', 'patterns/workflows/KanbanColumn.tsx'],
          Component: KanbanBoardMoveMenu,
        },
        {
          id: 'KanbanBoardMoveButtons',
          title: 'Arrow buttons',
          note: 'Step a card to the neighbouring stage from the keyboard; each move is announced.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanMoveControls.tsx', 'patterns/workflows/boardReducer.ts', 'patterns/workflows/KanbanColumn.tsx'],
          Component: KanbanBoardMoveButtons,
        },
      ],
    },
    {
      id: 'board-chrome',
      title: 'Around the board',
      description: 'The header, filters and detail panel that turn columns into a working view.',
      specimens: [
        {
          id: 'KanbanBoardSummaryHeader',
          title: 'Summary header',
          note: 'Above a team board: the period, who is on it and one figure per stage.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx', 'patterns/collections/StatRow.tsx', 'display/AvatarGroup.tsx'],
          Component: KanbanBoardSummaryHeader,
        },
        {
          id: 'KanbanBoardFilterBar',
          title: 'Filter bar',
          note: 'Narrow a busy board by text, crew or state; applied filters show as chips with the result count.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/data-entry/FilterBar.tsx', 'actions/ToggleGroup.tsx', 'patterns/workflows/KanbanCard.tsx'],
          Component: KanbanBoardFilterBar,
        },
        {
          id: 'KanbanBoardDetailPanel',
          title: 'Card detail panel',
          note: 'Open a card beside the board to read or act on it without losing the column.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/structure/SidePanel.tsx', 'patterns/structure/PropertyList.tsx', 'patterns/workflows/KanbanColumn.tsx'],
          Component: KanbanBoardDetailPanel,
        },
      ],
    },
    {
      id: 'boards',
      title: 'Full boards',
      description: 'Complete boards for the Nordkapp maintenance week. Every card moves.',
      specimens: [
        {
          id: 'KanbanBoardFull',
          title: 'Four-column board',
          note: 'The standard board: backlog to done, a limit on work in progress, arrows and a menu on every card.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/workflows/KanbanColumn.tsx',
            'patterns/workflows/KanbanCard.tsx',
            'patterns/workflows/KanbanMoveControls.tsx',
            'patterns/workflows/boardReducer.ts',
          ],
          Component: KanbanBoardFull,
        },
        {
          id: 'KanbanBoardSwimlanesCrew',
          title: 'Swimlanes by crew',
          note: 'When each crew plans its own work but shares the stages; lanes show who is overloaded.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanCard.tsx', 'patterns/workflows/KanbanMoveControls.tsx', 'patterns/workflows/boardReducer.ts'],
          Component: KanbanBoardSwimlanesCrew,
        },
        {
          id: 'KanbanBoardSwimlanesPriority',
          title: 'Swimlanes by priority',
          note: 'An expedite lane on top keeps urgent work visible above the routine flow.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanCard.tsx', 'patterns/workflows/KanbanMoveControls.tsx', 'patterns/workflows/boardReducer.ts'],
          Component: KanbanBoardSwimlanesPriority,
        },
        {
          id: 'KanbanBoardFiltered',
          title: 'Board with filters',
          note: 'Filters hide cards but never change the column counts, so the totals stay honest.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/data-entry/FilterBar.tsx',
            'patterns/workflows/KanbanColumn.tsx',
            'patterns/workflows/KanbanMoveControls.tsx',
            'patterns/workflows/boardReducer.ts',
          ],
          Component: KanbanBoardFiltered,
        },
      ],
    },
  ],
});
