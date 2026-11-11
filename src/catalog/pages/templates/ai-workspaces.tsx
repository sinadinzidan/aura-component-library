import { Avatar, AvatarFallback } from '@cognite/aura/components/avatar';
import { Button } from '@cognite/aura/components/button';
import {
  IconAlertTriangle,
  IconBell,
  IconBook,
  IconChartLine,
  IconCheck,
  IconClipboardList,
  IconCopy,
  IconDatabase,
  IconFileText,
  IconHistory,
  IconLayoutDashboard,
  IconMessageCircle,
  IconNotebook,
  IconPaperclip,
  IconPlayerPlay,
  IconPlayerStop,
  IconPlus,
  IconRefresh,
  IconRobot,
  IconSettings,
  IconShare,
  IconSparkles,
  IconThumbDown,
  IconThumbUp,
  IconTool,
  IconTopologyStar3,
  IconUsers,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AgentStep, type AgentStepState } from '../../../library/kit/ai-workspaces/AgentStep';
import { ChangeRow } from '../../../library/kit/ai-workspaces/ChangeRow';
import { ChatMessage } from '../../../library/kit/ai-workspaces/ChatMessage';
import { Composer } from '../../../library/kit/ai-workspaces/Composer';
import { NotebookCell } from '../../../library/kit/ai-workspaces/NotebookCell';
import { PromptCard } from '../../../library/kit/ai-workspaces/PromptCard';
import { SourceCard } from '../../../library/kit/ai-workspaces/SourceCard';
import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { DetailList } from '../../../library/kit/auth-pages/DetailList';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { BrowserFrame } from '../../../library/kit/landing-pages/BrowserFrame';
import { ListRow } from '../../../library/kit/ListRow';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SparkLine } from '../../../library/kit/SparkLine';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendLine, type TrendLimit } from '../../../library/kit/TrendLine';
import { ALARMS, ASSETS, type Alarm, type Asset } from '../../data/plant';
import { formatAgo } from '../../data/series';
import { definePage } from '../../types';

import source from './ai-workspaces.tsx?raw';

const AI_VIBRATION = [6.2, 6.3, 6.5, 6.4, 6.9, 7.4, 8.1, 9.0, 10.2, 11.6, 3.1, 0.4, 0.2];

const AI_VIBRATION_2025 = [6.0, 6.1, 6.0, 6.4, 6.6, 7.0, 7.7, 8.8, 9.9, 11.2, 2.8, 0.3, 0.2];

const AI_TRIP_LIMIT: TrendLimit = {
  value: 11,
  label: 'Trip',
  tone: 'critical',
};

const AI_MINUTES = ['13:00', '13:05', '13:10', '13:15', '13:20', '13:25', '13:30', '13:35', '13:40', '13:45', '13:50', '13:55', '14:00'];

const AI_COMPRESSION_ALARMS = ALARMS.filter((alarm) => alarm.sensorTag.startsWith('23-')).slice(0, 4);

const AI_COMPRESSION_UNITS = ASSETS.filter((asset) => asset.parentId === 'nk-23');

const AI_SEVERITY_TONE: Record<Alarm['severity'], Tone> = {
  critical: 'critical',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
};

const AI_SEVERITY_LABEL: Record<Alarm['severity'], string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const AI_STATE_TONE: Record<Asset['state'], Tone> = {
  running: 'success',
  standby: 'info',
  stopped: 'neutral',
  tripped: 'critical',
  maintenance: 'warning',
};

const AI_STATE_LABEL: Record<Asset['state'], string> = {
  running: 'Running',
  standby: 'Standby',
  stopped: 'Stopped',
  tripped: 'Tripped',
  maintenance: 'Maintenance',
};

const AI_ALARM_COLUMNS: DataTableColumn<Alarm>[] = [
  {
    id: 'severity',
    header: 'Severity',
    nowrap: true,
    cell: (alarm) => <StatusPill tone={AI_SEVERITY_TONE[alarm.severity]}>{AI_SEVERITY_LABEL[alarm.severity]}</StatusPill>,
  },
  { id: 'message', header: 'Alarm', cell: (alarm) => alarm.message },
  {
    id: 'tag',
    header: 'Tag',
    nowrap: true,
    cell: (alarm) => <TagId>{alarm.sensorTag}</TagId>,
  },
  {
    id: 'value',
    header: 'Value',
    numeric: true,
    nowrap: true,
    cell: (alarm) => alarm.value,
  },
  {
    id: 'raised',
    header: 'Raised',
    numeric: true,
    nowrap: true,
    muted: true,
    cell: (alarm) => formatAgo(alarm.raisedAt),
  },
];

const AI_UNIT_COLUMNS: DataTableColumn<Asset>[] = [
  { id: 'unit', header: 'Unit', nowrap: true, cell: (unit) => unit.name },
  {
    id: 'tag',
    header: 'Tag',
    nowrap: true,
    cell: (unit) => <TagId>{unit.tag}</TagId>,
  },
  {
    id: 'state',
    header: 'State',
    nowrap: true,
    cell: (unit) => <StatusPill tone={AI_STATE_TONE[unit.state]}>{AI_STATE_LABEL[unit.state]}</StatusPill>,
  },
  {
    id: 'health',
    header: 'Health',
    numeric: true,
    cell: (unit) => `${unit.healthScore} %`,
  },
  {
    id: 'criticality',
    header: 'Criticality',
    numeric: true,
    muted: true,
    cell: (unit) => unit.criticality,
  },
];

const AI_RAIL_NAV: AppFrameNavItem[] = [
  { id: 'new', label: 'New chat', icon: <IconSparkles /> },
  { id: 'history', label: 'History', icon: <IconHistory /> },
  { id: 'agents', label: 'Agents', icon: <IconRobot />, badge: '1' },
  { id: 'notebooks', label: 'Notebooks', icon: <IconNotebook /> },
  { id: 'settings', label: 'Settings', icon: <IconSettings /> },
];

const AI_TOP_NAV: AppFrameNavItem[] = [
  { id: 'chat', label: 'Chat', icon: <IconMessageCircle /> },
  { id: 'agents', label: 'Agents', icon: <IconRobot /> },
  { id: 'library', label: 'Library', icon: <IconBook /> },
];

const AI_HISTORY_NAV: AppFrameNavItem[] = [
  { id: 'trip', label: 'Recompressor trip', icon: <IconMessageCircle /> },
  { id: 'handover', label: 'Day shift handover', icon: <IconMessageCircle /> },
  { id: 'cooler', label: 'Cooler fouling', icon: <IconMessageCircle /> },
  { id: 'flaring', label: 'Flaring and permit', icon: <IconMessageCircle /> },
  { id: 'backlog', label: 'Overdue P2 orders', icon: <IconMessageCircle /> },
  { id: 'energy', label: 'Energy in February', icon: <IconMessageCircle /> },
];

const AI_DATA_NAV: AppFrameNavItem[] = [
  { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
  { id: 'equipment', label: 'Equipment', icon: <IconTopologyStar3 /> },
  { id: 'alarms', label: 'Alarms', icon: <IconBell />, badge: '4' },
  { id: 'work', label: 'Work orders', icon: <IconClipboardList /> },
];

const AI_NOTEBOOK_NAV: AppFrameNavItem[] = [
  { id: 'question', label: 'Question' },
  { id: 'data', label: 'Data' },
  { id: 'finding', label: 'Finding' },
  { id: 'next', label: 'Next steps' },
];

const AI_FIRST_RUN_NAV: AppFrameNavItem[] = [
  { id: 'workspace', label: 'Workspace', icon: <IconSparkles /> },
  { id: 'data', label: 'Data', icon: <IconDatabase /> },
  { id: 'agents', label: 'Agents', icon: <IconRobot /> },
  { id: 'team', label: 'Team', icon: <IconUsers /> },
];

type AiSource = {
  index: number;
  title: string;
  kind: string;
  location: string;
  excerpt: string;
};

const AI_SOURCES: AiSource[] = [
  {
    index: 1,
    title: 'Recompressor drive-end vibration',
    kind: 'Time series',
    location: '23-VT-92740, 13:00 to 14:00',
    excerpt: 'Rose from 6.2 to 11.6 mm/s in 45 minutes, then fell to zero at 13:46.',
  },
  {
    index: 2,
    title: 'Alarm and event list',
    kind: 'Events',
    location: '4 alarms on gas compression',
    excerpt: 'Trip on high vibration at 13:46, 0.6 mm/s over the 11.0 mm/s limit.',
  },
  {
    index: 3,
    title: 'Trip report, 4 March 2025',
    kind: 'Document',
    location: 'Page 3, root cause',
    excerpt: 'Drive-end bearing wear after 14 months; vibration climbed for 40 minutes before the trip.',
  },
  {
    index: 4,
    title: 'WO-104482',
    kind: 'Work order',
    location: 'In progress, Tomás Barros',
    excerpt: 'Inspect recompressor drive-end bearing. Due today 20:00.',
  },
];

type AiRunStep = {
  id: string;
  title: string;
  state: AgentStepState;
  detail: string;
  duration: string;
};

const AI_RUN_STEPS: AiRunStep[] = [
  {
    id: 'alarms',
    title: 'Read the alarm list',
    state: 'done',
    detail: '8 alarms, 4 on compression',
    duration: '0:04',
  },
  {
    id: 'trends',
    title: 'Pull vibration trends',
    state: 'done',
    detail: '6 series, 24 hours',
    duration: '0:21',
  },
  {
    id: 'history',
    title: 'Find similar trips',
    state: 'done',
    detail: '1 match, March 2025',
    duration: '0:38',
  },
  {
    id: 'compare',
    title: 'Compare the two trips',
    state: 'running',
    detail: 'Aligning on the trip time',
    duration: '1:11',
  },
  {
    id: 'order',
    title: 'Draft a work order',
    state: 'waiting',
    detail: 'Bearing replacement, P1',
    duration: 'Since 13:49',
  },
  {
    id: 'log',
    title: 'Post to the shift log',
    state: 'queued',
    detail: 'After approval',
    duration: 'Queued',
  },
];

type AiChange = {
  id: string;
  title: string;
  detail: string;
  from: string;
  to: string;
  risk: { label: string; tone: Tone };
};

const AI_CHANGES: AiChange[] = [
  {
    id: 'limit',
    title: 'High vibration alarm limit',
    detail: '23-VT-92540 on the 1st stage compressor: earlier warning, same trip limit',
    from: '7.1 mm/s',
    to: '6.5 mm/s',
    risk: { label: 'Low risk', tone: 'success' },
  },
  {
    id: 'order',
    title: 'Work order priority',
    detail: 'WO-104466 vibration survey: the same bearing type failed today',
    from: 'P2',
    to: 'P1',
    risk: { label: 'Low risk', tone: 'success' },
  },
  {
    id: 'shelve',
    title: 'Shelve cooler outlet alarm',
    detail: '23-TT-91141: expected while running on two stages',
    from: 'Active',
    to: 'Shelved 8 h',
    risk: { label: 'Review', tone: 'warning' },
  },
  {
    id: 'load',
    title: 'Compressor load setpoint',
    detail: '23-KA-9102 2nd stage: lowers discharge temperature by about 4 °C',
    from: '92 %',
    to: '88 %',
    risk: { label: 'Affects export', tone: 'critical' },
  },
];

const AI_NOTEBOOK_QUERY = [
  'select minute, avg(value) as vibration',
  'from timeseries("23-VT-92740")',
  'where trip in ("2026-03-12T13:46", "2025-03-04T09:12")',
  '  and minute between trip - 45 and trip + 15',
  'group by trip, minute',
].join('\n');

function useAiAsk() {
  const [draft, setDraft] = useState('');
  const [asked, setAsked] = useState<readonly string[]>([]);
  const send = (text: string) => {
    setAsked((current) => [...current, text]);
    setDraft('');
  };
  return { draft, setDraft, asked, send };
}

function AiAtlasAvatar() {
  return (
    <IconChip tone="accent" size="sm">
      <IconSparkles />
    </IconChip>
  );
}

function AiUserAvatar() {
  return (
    <Avatar variant="decorative-2" sizes="xsm" aria-label="Ingrid Haugen">
      <AvatarFallback>IH</AvatarFallback>
    </Avatar>
  );
}

function AiAnswerActions() {
  return (
    <>
      <Button variant="ghost" size="sm">
        <IconCopy /> Copy
      </Button>
      <Button variant="ghost" size="sm">
        <IconThumbUp /> Helpful
      </Button>
      <Button variant="ghost" size="sm">
        <IconThumbDown /> Not helpful
      </Button>
      <Button variant="ghost" size="sm">
        <IconRefresh /> Try again
      </Button>
    </>
  );
}

function AiComposerTools() {
  return (
    <>
      <Button variant="ghost" size="sm" type="button">
        <IconPaperclip /> Attach
      </Button>
      <Button variant="ghost" size="sm" type="button">
        <IconDatabase /> Nordkapp production
      </Button>
    </>
  );
}

function AiFollowUps({ asked, avatars = false }: { asked: readonly string[]; avatars?: boolean }) {
  return (
    <>
      {asked.map((question, index) => (
        <div key={`${index}-${question}`} className="flex flex-col gap-5">
          <ChatMessage role="user" author="Ingrid Haugen" time="14:03" avatar={avatars ? <AiUserAvatar /> : undefined}>
            {question}
          </ChatMessage>
          <ChatMessage role="assistant" author="Atlas" time="14:03" avatar={avatars ? <AiAtlasAvatar /> : undefined}>
            <p>This template has no agent behind it. Connect one and the answer to this question appears here, with its sources.</p>
          </ChatMessage>
        </div>
      ))}
    </>
  );
}

function AiVibrationChart({ height = 220, compare = false, high = false }: { height?: number; compare?: boolean; high?: boolean }) {
  return (
    <TrendLine
      label="Recompressor drive-end vibration from 13:00 to 14:00 against the trip limit"
      labels={AI_MINUTES}
      unit="mm/s"
      decimals={1}
      height={height}
      highlightLast={false}
      series={
        compare
          ? [
              {
                id: 'today',
                label: '12 March 2026',
                values: AI_VIBRATION,
                tone: 'accent',
              },
              {
                id: 'before',
                label: '4 March 2025',
                values: AI_VIBRATION_2025,
                tone: 'neutral',
                dashed: true,
              },
            ]
          : [
              {
                id: 'today',
                label: 'Drive-end vibration',
                values: AI_VIBRATION,
                tone: 'accent',
              },
            ]
      }
      limits={high ? [AI_TRIP_LIMIT, { value: 7.1, label: 'High', tone: 'warning' }] : [AI_TRIP_LIMIT]}
    />
  );
}

function AiTripAnswer({ cite }: { cite?: (index: number) => ReactNode }) {
  return (
    <>
      <p>
        The recompressor <TagId>23-KA-9103</TagId> tripped at 13:46 on high drive-end vibration. It climbed from 6.2 to 11.6 mm/s over 45 minutes and crossed the 11.0 mm/s trip
        limit.
        {cite ? <> {cite(1)}</> : null}
      </p>
      <p>
        The pattern matches the trip on 4 March 2025, which was traced to drive-end bearing wear.{cite ? <> {cite(3)}</> : null} A bearing inspection is already in progress and due
        at 20:00.
        {cite ? <> {cite(4)}</> : null}
      </p>
    </>
  );
}

function AiWorkspaceTemplatePromptLanding() {
  const { draft, setDraft, asked, send } = useAiAsk();
  return (
    <BrowserFrame url="atlas.nordkapp.test" look="glass" minHeight={760}>
      <AppFrame variant="rail" brand={{ name: 'Atlas', mark: <IconSparkles /> }} nav={AI_RAIL_NAV} current="new" tools={<AiUserAvatar />}>
        <div className="mx-auto flex h-full w-full max-w-4xl flex-col justify-center gap-8">
          <div className="flex flex-col gap-3">
            <StatusPill tone="warning" icon={<IconAlertTriangle />} className="self-start">
              Nordkapp is at reduced capacity
            </StatusPill>
            <p className="text-5xl leading-[1.05] font-semibold tracking-tighter text-balance">Good afternoon, Ingrid. What do you want to know?</p>
            <p className="max-w-2xl text-base text-(color:--kit-text-2)">
              Atlas reads the alarms, 212 600 time series, work orders and documents of Nordkapp production, and shows where every answer comes from.
            </p>
          </div>
          <Composer
            size="lg"
            label="Ask Atlas about the plant"
            placeholder="Ask about an alarm, an asset or a trend"
            value={draft}
            onChange={setDraft}
            onSend={send}
            context={['Nordkapp production', 'Last 24 hours']}
            tools={<AiComposerTools />}
            hint={asked.length > 0 ? `${asked.length} sent · Enter to send` : 'Enter to send'}
          />
          <div className="grid grid-cols-4 gap-(--kit-gap)">
            <PromptCard
              tone="pink"
              icon={<IconBell />}
              title="Explain the 13:46 trip"
              detail="Alarms, vibration and the last time it happened."
              onSelect={() => setDraft('Why did the recompressor trip at 13:46?')}
            />
            <PromptCard
              tone="sky"
              icon={<IconFileText />}
              title="Draft my handover"
              detail="Day shift summary from the log and open alarms."
              onSelect={() => setDraft('Draft the day shift handover note.')}
            />
            <PromptCard
              tone="teal"
              icon={<IconChartLine />}
              title="Compare two compressors"
              detail="1st and 2nd stage, last 7 days, side by side."
              onSelect={() => setDraft('Compare the 1st and 2nd stage compressors over the last 7 days.')}
            />
            <PromptCard
              tone="amber"
              icon={<IconTool />}
              title="What is overdue?"
              detail="Work orders past their due date, by priority."
              onSelect={() => setDraft('Which work orders are overdue?')}
            />
          </div>
          <Panel className="h-auto" title="Pick up where you left off" subtitle="Your last three conversations">
            <ul>
              <ListRow
                leading={<IconMessageCircle className="size-5" aria-hidden="true" />}
                title="Interstage cooler fouling"
                meta="Answered with 3 sources · cooler outlet temperature"
                trailing="Yesterday"
              />
              <ListRow
                leading={<IconMessageCircle className="size-5" aria-hidden="true" />}
                title="Flaring against permit"
                meta="Answered with 2 sources · 12.4 of 15.0 kSm³/d"
                trailing="Tuesday"
              />
              <ListRow
                leading={<IconRobot className="size-5" aria-hidden="true" />}
                title="Trip review agent"
                meta="Run 3 is waiting for your approval"
                trailing={<StatusPill tone="warning">Needs you</StatusPill>}
              />
            </ul>
          </Panel>
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

function AiWorkspaceTemplateFirstRun() {
  const [draft, setDraft] = useState('');
  return (
    <BrowserFrame url="atlas.nordkapp.test/welcome" look="poster" minHeight={760}>
      <AppFrame
        variant="masthead"
        brand={{ name: 'Atlas' }}
        nav={AI_FIRST_RUN_NAV}
        current="workspace"
        title="Your workspace is empty."
        subtitle="Three steps and Atlas can answer questions about your own plant. The first is already done."
      >
        <Grid className="h-full">
          <Panel className="col-span-4" tone="green" title="1. Invite your team" subtitle="Done by Liv Wold">
            <div className="flex flex-1 flex-col justify-between gap-5">
              <p className="text-base font-medium">Six people from the day and evening shifts can open this workspace.</p>
              <StatusPill tone="success" size="lg" icon={<IconCheck />} className="self-start">
                Done
              </StatusPill>
            </div>
          </Panel>
          <Panel className="col-span-4" tone="blue" title="2. Connect data" subtitle="About four minutes">
            <div className="flex flex-1 flex-col justify-between gap-5">
              <p className="text-base font-medium">Point Atlas at Nordkapp production: 18 420 assets and 212 600 time series.</p>
              <Button size="lg" className="self-start">
                <IconDatabase /> Connect Nordkapp production
              </Button>
            </div>
          </Panel>
          <Panel className="col-span-4" tone="amber" title="3. Pick an agent" subtitle="Or start with plain chat">
            <div className="flex flex-1 flex-col justify-between gap-5">
              <p className="text-base font-medium">Agents run a task end to end: review a trip, draft a handover, plan a shutdown.</p>
              <Button size="lg" variant="outline" className="self-start" disabled aria-describedby="ai-first-run-agent-reason">
                <IconRobot /> Browse agents
              </Button>
              <p id="ai-first-run-agent-reason" className="text-sm font-medium">
                Available once data is connected.
              </p>
            </div>
          </Panel>

          <Panel className="col-span-8" title="Try it on sample data" subtitle="A fictional compressor train, ready now">
            <div className="flex flex-1 flex-col justify-between gap-5">
              <div className="grid grid-cols-3 gap-4">
                <PromptCard tone="pink" title="Why did the sample compressor trip?" onSelect={() => setDraft('Why did the sample compressor trip?')} />
                <PromptCard tone="sky" title="Which alarms repeat most?" onSelect={() => setDraft('Which alarms repeat most?')} />
                <PromptCard tone="purple" title="Summarise last week" onSelect={() => setDraft('Summarise last week for the sample train.')} />
              </div>
              <Composer
                label="Ask about the sample data"
                placeholder="Pick a question above or write your own"
                value={draft}
                onChange={setDraft}
                onSend={() => setDraft('')}
                context={['Sample compressor train']}
                hint="Answers use sample data"
              />
            </div>
          </Panel>
          <div className="col-span-4 flex flex-col gap-(--kit-gap)">
            <Stat size="lg" tone="pink" label="Setup progress" value="1 of 3" target="Next: connect data" />
            <Stat size="lg" tone="purple" label="Typical time to first answer" value={6} unit="min" target="From an empty workspace" />
          </div>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function AiWorkspaceTemplateChatOnly() {
  const { draft, setDraft, asked, send } = useAiAsk();
  return (
    <BrowserFrame url="atlas.nordkapp.test/chat/recompressor-trip" look="soft" minHeight={760}>
      <AppFrame
        variant="topbar"
        brand={{
          name: 'Atlas',
          detail: 'Nordkapp production',
          mark: <IconSparkles />,
        }}
        nav={AI_TOP_NAV}
        current="chat"
        tools={
          <Button size="sm">
            <IconPlus /> New chat
          </Button>
        }
      >
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-2xl font-bold tracking-tight">Why did the recompressor trip?</p>
            <StatusPill tone="success">Grounded in 4 sources</StatusPill>
          </div>
          <ChatMessage role="user" author="Ingrid Haugen" time="14:01" avatar={<AiUserAvatar />}>
            Why did the recompressor trip at 13:46, and has it happened before?
          </ChatMessage>
          <ChatMessage role="assistant" author="Atlas" time="14:01" avatar={<AiAtlasAvatar />} actions={<AiAnswerActions />}>
            <AiTripAnswer />
            <AiVibrationChart height={200} />
            <div className="flex flex-wrap gap-2">
              <StatusPill tone="blue">1 · Vibration trend</StatusPill>
              <StatusPill tone="pink">2 · Alarm list</StatusPill>
              <StatusPill tone="amber">3 · Trip report 2025</StatusPill>
              <StatusPill tone="teal">4 · WO-104482</StatusPill>
            </div>
          </ChatMessage>
          <AiFollowUps asked={asked} avatars />
          <div className="mt-auto flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setDraft('What is the export impact until 20:00?')}>
                What is the export impact until 20:00?
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDraft('Show the bearing temperature as well.')}>
                Show the bearing temperature as well
              </Button>
            </div>
            <Composer label="Reply to Atlas" placeholder="Ask a follow-up" value={draft} onChange={setDraft} onSend={send} tools={<AiComposerTools />} hint="Enter to send" />
          </div>
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

function AiWorkspaceTemplateHistorySidebar() {
  const { draft, setDraft, asked, send } = useAiAsk();
  const [thread, setThread] = useState('trip');
  const title = AI_HISTORY_NAV.find((item) => item.id === thread)?.label ?? '';
  return (
    <BrowserFrame url="atlas.nordkapp.test/chat" look="studio" minHeight={780}>
      <AppFrame
        variant="sidebar"
        brand={{
          name: 'Atlas',
          detail: 'Nordkapp production',
          mark: <IconSparkles />,
        }}
        nav={AI_HISTORY_NAV}
        current={thread}
        onNavigate={setThread}
        tools={
          <Button className="w-full">
            <IconPlus /> New chat
          </Button>
        }
        title={title}
        subtitle="Today · 2 messages · shared with the day shift"
        actions={
          <>
            <Button variant="outline" size="sm">
              <IconShare /> Share
            </Button>
            <Button variant="outline" size="sm">
              <IconFileText /> Save as note
            </Button>
          </>
        }
      >
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-5">
          <ChatMessage role="user" author="Ingrid Haugen" time="14:01" avatar={<AiUserAvatar />}>
            Why did the recompressor trip at 13:46? List what else is alarming on compression.
          </ChatMessage>
          <ChatMessage role="assistant" author="Atlas" time="14:02" avatar={<AiAtlasAvatar />} actions={<AiAnswerActions />}>
            <ul>
              <AgentStep title="Read the alarm list" state="done" detail="8 alarms in 3 days, 4 on gas compression" duration="0:04" />
              <AgentStep title="Pull vibration trends" state="done" detail="23-VT-92740 and 5 neighbours, last 24 hours" duration="0:21" last />
            </ul>
            <AiTripAnswer />
            <div className="overflow-hidden rounded-(--kit-radius-sm) border border-(--kit-rule)">
              <DataTable
                label="Open alarms on gas compression"
                columns={AI_ALARM_COLUMNS}
                rows={AI_COMPRESSION_ALARMS}
                rowKey={(alarm) => alarm.id}
                rowTone={(alarm) => AI_SEVERITY_TONE[alarm.severity]}
                density="compact"
              />
            </div>
          </ChatMessage>
          <AiFollowUps asked={asked} avatars />
          <Composer
            className="mt-auto"
            label="Reply to Atlas"
            placeholder="Ask a follow-up"
            value={draft}
            onChange={setDraft}
            onSend={send}
            context={['23-KA-9103', 'Last 24 hours']}
            tools={<AiComposerTools />}
            hint="Enter to send"
          />
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

function AiCitation({ index, active, onPick }: { index: number; active: boolean; onPick: (index: number) => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`Source ${index}`}
      onClick={() => onPick(index)}
      className="inline-flex size-5 cursor-pointer items-center justify-center border border-(--kit-rule-strong) align-text-top text-xs font-semibold tabular-nums outline-none focus-visible:shadow-(--shadow-focus-ring) aria-pressed:bg-(--kit-accent) aria-pressed:text-(color:--kit-on-accent)"
    >
      {index}
    </button>
  );
}

function AiWorkspaceTemplateSourcesRail() {
  const { draft, setDraft, asked, send } = useAiAsk();
  const [active, setActive] = useState(1);
  return (
    <BrowserFrame url="atlas.nordkapp.test/chat/recompressor-trip/sources" look="blueprint" minHeight={780}>
      <AppFrame
        variant="topbar"
        brand={{
          name: 'Atlas',
          detail: 'Grounded chat',
          mark: <IconSparkles />,
        }}
        nav={AI_TOP_NAV}
        current="chat"
        tools={
          <>
            <span>
              Sources <span className="font-medium tabular-nums">4</span>
            </span>
            <span>
              In focus <span className="font-medium tabular-nums">{active}</span>
            </span>
          </>
        }
      >
        <Grid className="h-full">
          <div className="col-span-7 flex flex-col gap-(--kit-gap)">
            <ChatMessage role="user" author="Ingrid Haugen" time="14:01">
              Why did the recompressor trip at 13:46, and has it happened before?
            </ChatMessage>
            <ChatMessage role="assistant" author="Atlas" time="14:01" actions={<AiAnswerActions />}>
              <AiTripAnswer cite={(index) => <AiCitation index={index} active={active === index} onPick={setActive} />} />
              <p>
                Three other alarms are open on gas compression, all on the 1st stage and its cooler. <AiCitation index={2} active={active === 2} onPick={setActive} />
              </p>
            </ChatMessage>
            <AiFollowUps asked={asked} />
            <Composer className="mt-auto" label="Reply to Atlas" placeholder="Ask a follow-up" value={draft} onChange={setDraft} onSend={send} hint="Answers cite their sources" />
          </div>
          <Panel className="col-span-5" title="Sources" subtitle="4 cited" icon={<IconBook className="size-4.5" aria-hidden="true" />}>
            <div className="flex flex-1 flex-col justify-between gap-3">
              {AI_SOURCES.map((item) => (
                <SourceCard
                  key={item.index}
                  index={item.index}
                  title={item.title}
                  kind={item.kind}
                  location={item.location}
                  excerpt={item.excerpt}
                  active={item.index === active}
                />
              ))}
            </div>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function AiWorkspaceTemplateChatCanvas() {
  const { draft, setDraft, asked, send } = useAiAsk();
  return (
    <BrowserFrame url="atlas.nordkapp.test/canvas/trip-review" look="console" minHeight={780}>
      <AppFrame
        variant="topbar"
        brand={{ name: 'Atlas', detail: 'Canvas', mark: <IconSparkles /> }}
        nav={AI_TOP_NAV}
        current="chat"
        padding="none"
        tools={
          <>
            <span>Trip review · 23-KA-9103</span>
            <span className="font-medium tabular-nums">14:02:10 UTC</span>
          </>
        }
      >
        <Grid className="h-full grid-rows-[auto_minmax(0,1fr)_auto]">
          <StatGroup columns={4} label="Trip figures" className="col-span-12">
            <Stat variant="plain" size="md" label="Peak vibration" value={11.6} decimals={1} unit="mm/s" tone="critical" target="Trip limit 11.0" />
            <Stat variant="plain" size="md" label="Rise time" value={45} unit="min" tone="warning" target="From 6.2 mm/s" />
            <Stat variant="plain" size="md" label="Tripped at" value="13:46" target="14 min ago" />
            <Stat variant="plain" size="md" label="Similar trips" value={1} target="4 March 2025" />
          </StatGroup>

          <Panel className="col-span-4 row-span-2" title="Conversation" subtitle="Atlas" padding="none">
            <div className="flex flex-1 flex-col">
              <ChatMessage role="user" author="I. Haugen" time="14:01">
                Plot recompressor vibration for the last hour with the limits.
              </ChatMessage>
              <ChatMessage role="assistant" author="Atlas" time="14:01">
                <p>Added to the canvas. Vibration crossed the high limit at 13:22 and the trip limit at 13:45.</p>
              </ChatMessage>
              <ChatMessage role="user" author="I. Haugen" time="14:02">
                Add the open alarms on compression under it.
              </ChatMessage>
              <ChatMessage role="assistant" author="Atlas" time="14:02">
                <p>Added a table with 4 alarms, most severe first. Two are on the 1st stage compressor.</p>
              </ChatMessage>
              <AiFollowUps asked={asked} />
              <div className="mt-auto p-3.5">
                <Composer
                  label="Tell Atlas what to add to the canvas"
                  placeholder="Add, change or remove something on the canvas"
                  value={draft}
                  onChange={setDraft}
                  onSend={send}
                  hint="Enter to send"
                />
              </div>
            </div>
          </Panel>
          <Panel className="col-span-8" title="Recompressor drive-end vibration" subtitle="mm/s · 13:00 to 14:00 · added by Atlas" tone="critical">
            <AiVibrationChart height={250} high />
          </Panel>
          <Panel className="col-span-8" title="Open alarms on gas compression" subtitle="4 alarms · added by Atlas" padding="none">
            <DataTable
              label="Open alarms on gas compression"
              flush
              columns={AI_ALARM_COLUMNS}
              rows={AI_COMPRESSION_ALARMS}
              rowKey={(alarm) => alarm.id}
              rowTone={(alarm) => AI_SEVERITY_TONE[alarm.severity]}
            />
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function AiWorkspaceTemplateDockedAssistant() {
  const { draft, setDraft, asked, send } = useAiAsk();
  return (
    <BrowserFrame url="nordkapp.test/equipment/gas-compression" look="studio" minHeight={760}>
      <AppFrame
        variant="topbar"
        brand={{
          name: 'Nordkapp',
          detail: 'Operations',
          mark: <IconTopologyStar3 />,
        }}
        nav={AI_DATA_NAV}
        current="equipment"
        tools={<AiUserAvatar />}
        title="Gas compression"
        subtitle="NK-23 · 5 units · updated 14:00 UTC"
        status={
          <StatusPill tone="warning" size="lg" icon={<IconAlertTriangle />}>
            Watch
          </StatusPill>
        }
      >
        <Grid className="h-full">
          <div className="col-span-8 flex flex-col gap-(--kit-gap)">
            <div className="grid grid-cols-3 gap-(--kit-gap)">
              <Stat label="Area health" value={78} unit="/ 100" tone="warning" icon={<IconChartLine />} delta={{ value: -6, decimals: 0, caption: 'vs last week' }} />
              <Stat label="Units running" value="4 of 5" tone="teal" icon={<IconPlayerPlay />} target="Recompressor tripped" />
              <Stat
                label="Open alarms"
                value={4}
                tone="critical"
                icon={<IconBell />}
                delta={{
                  value: 2,
                  decimals: 0,
                  good: 'down',
                  caption: 'vs yesterday',
                }}
              />
            </div>
            <Panel className="flex-1" title="Equipment" subtitle="Run state and condition" padding="none">
              <DataTable
                label="Gas compression equipment"
                flush
                columns={AI_UNIT_COLUMNS}
                rows={AI_COMPRESSION_UNITS}
                rowKey={(unit) => unit.id}
                rowTone={(unit) => (unit.state === 'running' ? undefined : AI_STATE_TONE[unit.state])}
              />
            </Panel>
          </div>
          <Panel
            className="col-span-4"
            tone="accent"
            title="Atlas"
            subtitle="Sees this page: 5 units, 4 alarms"
            icon={
              <IconChip tone="accent">
                <IconSparkles />
              </IconChip>
            }
            actions={
              <Button variant="ghost" size="sm">
                <IconX /> Close
              </Button>
            }
          >
            <div className="flex flex-1 flex-col gap-4">
              <ChatMessage role="user" author="Ingrid Haugen" time="14:01">
                Which unit should I worry about first?
              </ChatMessage>
              <ChatMessage role="assistant" author="Atlas" time="14:01">
                <p>The recompressor: it tripped at 13:46 and its health is 41. After that the 1st stage compressor, where drive-end vibration is 0.3 mm/s under its high limit.</p>
                <SparkLine values={AI_VIBRATION.slice(0, 10)} label="Recompressor vibration before the trip" tone="critical" className="h-10 w-full" />
              </ChatMessage>
              <AiFollowUps asked={asked} />
              <div className="mt-auto flex flex-col gap-2.5">
                <Button variant="outline" size="sm" className="w-full" onClick={() => setDraft('Filter the table to units that need attention.')}>
                  Filter to units that need attention
                </Button>
                <Composer label="Ask Atlas about this page" placeholder="Ask about this page" value={draft} onChange={setDraft} onSend={send} />
              </div>
            </div>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function AiWorkspaceTemplateNotebook() {
  return (
    <BrowserFrame url="atlas.nordkapp.test/notebooks/recompressor-trip" look="editorial" minHeight={820}>
      <AppFrame
        variant="masthead"
        brand={{ name: 'Atlas' }}
        nav={AI_NOTEBOOK_NAV}
        current="data"
        tools={<span>Notebook · saved 14:02 · Ingrid Haugen</span>}
        title="What changed before the recompressor tripped?"
        subtitle="A working notebook for the 12 March trip review. Each cell is a question, the query Atlas wrote for it, or what came back."
      >
        <Grid className="h-full">
          <div className="col-span-8 flex flex-col gap-8">
            <NotebookCell index={1} kind="prompt" title="Compare the hour before today's trip with the hour before the trip in March 2025." meta="Ingrid Haugen · 14:01">
              <p className="text-(color:--kit-text-2)">Scope: recompressor 23-KA-9103, drive-end vibration, both trips aligned on the minute of the trip.</p>
            </NotebookCell>
            <NotebookCell
              index={2}
              kind="code"
              title="Query written by Atlas"
              meta="0.8 s · 26 rows"
              actions={
                <Button variant="ghost" size="sm">
                  <IconPlayerPlay /> Run
                </Button>
              }
            >
              {AI_NOTEBOOK_QUERY}
            </NotebookCell>
            <NotebookCell index={3} kind="result" title="Vibration in the hour around each trip" meta="mm/s">
              <AiVibrationChart height={230} compare />
            </NotebookCell>
            <NotebookCell index={4} kind="note" title="Finding">
              <p>Both trips follow the same 40 to 45 minute climb from about 6 mm/s. In 2025 the cause was drive-end bearing wear after 14 months; this bearing has run for 12.</p>
            </NotebookCell>
          </div>
          <div className="col-span-4 flex flex-col gap-(--kit-gap)">
            <Panel className="h-auto" title="In this notebook" subtitle="What every cell can use.">
              <DetailList
                items={[
                  { label: 'Asset', value: <TagId>23-KA-9103</TagId> },
                  { label: 'Series', value: <TagId>23-VT-92740</TagId> },
                  { label: 'Trip today', value: '13:46 UTC' },
                  { label: 'Trip in 2025', value: '4 March, 09:12' },
                  { label: 'Trip limit', value: '11.0 mm/s' },
                ]}
              />
            </Panel>
            <Panel className="flex-1" title="Next steps" subtitle="Suggested by Atlas from the finding.">
              <ul className="flex flex-1 flex-col justify-between">
                <ListRow
                  title="Check bearing clearance during today's inspection"
                  meta="Add to WO-104482"
                  trailing={
                    <Button variant="outline" size="sm">
                      Add
                    </Button>
                  }
                />
                <ListRow
                  title="Lower the early-warning limit on the 1st stage"
                  meta="7.1 to 6.5 mm/s"
                  trailing={
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  }
                />
                <ListRow
                  title="Share this notebook with reliability"
                  meta="Aisha Khan"
                  trailing={
                    <Button variant="outline" size="sm">
                      Share
                    </Button>
                  }
                />
              </ul>
            </Panel>
          </div>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function AiWorkspaceTemplateAgentRun() {
  const [approved, setApproved] = useState(false);
  const steps = AI_RUN_STEPS.map((step): AiRunStep =>
    approved && step.id === 'order'
      ? {
          ...step,
          state: 'done',
          detail: 'WO-104490 created, P1',
          duration: '0:02',
        }
      : step,
  );
  const done = steps.filter((step) => step.state === 'done').length;
  return (
    <BrowserFrame url="atlas.nordkapp.test/agents/trip-review/run-3" look="signal" minHeight={760}>
      <AppFrame
        brand={{ name: 'Atlas' }}
        title="Trip review agent"
        subtitle="Run 3 today · recompressor 23-KA-9103 · started 13:47 UTC"
        status={
          <>
            <StatusPill tone="success" size="lg">
              {done} done
            </StatusPill>
            <StatusPill tone="info" size="lg">
              1 running
            </StatusPill>
            {approved ? null : (
              <StatusPill tone="warning" size="lg">
                1 needs you
              </StatusPill>
            )}
          </>
        }
      >
        <Grid className="h-full grid-rows-[auto_minmax(0,1fr)_auto]">
          <Panel className="col-span-8" tone="info">
            <div className="flex flex-1 flex-col justify-between gap-5">
              <p className="text-lg font-semibold">Run state</p>
              <div className="flex items-center gap-5">
                <IconRobot className="size-16 shrink-0" stroke={2.2} aria-hidden="true" />
                <p className="text-6xl leading-none font-extrabold tracking-tighter">Running step 4 of 6</p>
              </div>
              <p className="max-w-2xl text-xl font-medium">Comparing today's trip with 4 March 2025. Both climbed for about 45 minutes before tripping.</p>
            </div>
          </Panel>
          <Stat className="col-span-4" size="hero" tone="neutral" label="Elapsed" value="2:14" unit="min" target="Typical run 3:30" />

          <ul className="col-span-12 grid grid-cols-6 gap-(--kit-gap)">
            {steps.map((step) => (
              <AgentStep key={step.id} title={step.title} state={step.state} detail={step.detail} duration={step.duration} />
            ))}
          </ul>

          <Panel
            className="col-span-7"
            tone={approved ? 'success' : 'warning'}
            title={approved ? 'Approved by Ingrid Haugen' : 'Needs your approval'}
            subtitle="Step 5 · draft a work order"
          >
            <div className="flex flex-1 items-center justify-between gap-6">
              <p className="max-w-md text-base font-medium">Create a P1 corrective order to replace the recompressor drive-end bearing, assigned to Tomás Barros.</p>
              <div className="flex shrink-0 gap-2.5">
                <Button size="lg" disabled={approved} onClick={() => setApproved(true)}>
                  <IconCheck /> {approved ? 'Approved' : 'Approve'}
                </Button>
                <Button size="lg" variant="secondary" onClick={() => setApproved(false)}>
                  <IconPlayerStop /> {approved ? 'Undo' : 'Stop run'}
                </Button>
              </div>
            </div>
          </Panel>
          <Panel className="col-span-5" title="Found so far" subtitle="3 findings">
            <ul>
              <ListRow tone="critical" title="Peak 11.6 mm/s, 0.6 over the trip limit" trailing="13:46" />
              <ListRow tone="warning" title="Same 45 minute climb as March 2025" trailing="Match" />
              <ListRow tone="info" title="Bearing has run 12 of a typical 14 months" trailing="86 %" />
            </ul>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function AiWorkspaceTemplateReviewAction() {
  const [included, setIncluded] = useState<readonly string[]>(['limit', 'order', 'shelve']);
  const toggle = (id: string, on: boolean) => setIncluded((current) => (on ? [...current, id] : current.filter((item) => item !== id)));
  return (
    <BrowserFrame url="atlas.nordkapp.test/agents/trip-review/run-3/review" look="glass" minHeight={760}>
      <AppFrame
        variant="rail"
        brand={{ name: 'Atlas', mark: <IconSparkles /> }}
        nav={AI_RAIL_NAV}
        current="agents"
        tools={<AiUserAvatar />}
        title="Review and approve"
        subtitle="Trip review agent, run 3 · nothing changes until you approve"
        status={
          <StatusPill tone="warning" size="lg">
            Waiting for you
          </StatusPill>
        }
      >
        <Grid className="h-full">
          <Panel
            className="col-span-8"
            title="Atlas proposes 4 changes"
            subtitle="Untick what you do not want; each is applied separately"
            footer={
              <span className="flex w-full items-center justify-between gap-4">
                <span className="text-sm">
                  <span className="font-semibold text-(color:--kit-text) tabular-nums">
                    {included.length} of {AI_CHANGES.length}
                  </span>{' '}
                  selected · logged under your name
                </span>
                <span className="flex gap-2.5">
                  <Button variant="outline">Reject all</Button>
                  <Button disabled={included.length === 0}>
                    <IconCheck /> Approve {included.length} {included.length === 1 ? 'change' : 'changes'}
                  </Button>
                </span>
              </span>
            }
          >
            <ul className="flex flex-1 flex-col *:flex-1">
              {AI_CHANGES.map((change) => (
                <ChangeRow
                  key={change.id}
                  title={change.title}
                  detail={change.detail}
                  from={change.from}
                  to={change.to}
                  risk={change.risk}
                  included={included.includes(change.id)}
                  onToggle={(on) => toggle(change.id, on)}
                />
              ))}
            </ul>
          </Panel>
          <div className="col-span-4 flex flex-col gap-(--kit-gap)">
            <Panel className="h-auto" tone="sky" title="Why Atlas proposes this" subtitle="From 4 sources">
              <div className="flex items-center gap-6">
                <RingGauge label="Confidence" value={86} size={104} tone="sky" className="shrink-0" />
                <p className="text-sm text-(color:--kit-text-2)">Today's trip follows the same 45 minute vibration climb as the bearing failure in March 2025.</p>
              </div>
            </Panel>
            <Panel className="flex-1" title="Evidence" subtitle="Recompressor vibration, 13:00 to 13:45">
              <div className="flex flex-1 flex-col justify-between gap-4">
                <SparkLine values={AI_VIBRATION.slice(0, 10)} label="Recompressor vibration before the trip" tone="critical" className="h-20 w-full" />
                <DetailList
                  items={[
                    { label: 'Peak', value: '11.6 mm/s' },
                    { label: 'Trip limit', value: '11.0 mm/s' },
                    { label: 'Requested by', value: 'Ingrid Haugen' },
                  ]}
                />
              </div>
            </Panel>
          </div>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

export default definePage({
  id: 'ai-workspaces',
  title: 'AI workspaces',
  summary:
    'Whole pages built around an assistant: prompt-first landing, chat, chat beside data and canvases, notebooks and agent runs. Each is drawn in a different look, and the message, composer and step anatomy changes with it.',
  guidance: {
    use: [
      'Start from the page that matches the job: chat only for questions, chat beside a canvas when the answer is something to keep.',
      'Show where an answer comes from, as numbered sources or as the steps the agent took.',
      'Ask for approval before an agent changes anything, with every change listed and its risk in words.',
      'Keep the composer in one place on every page of the workspace.',
    ],
    avoid: [
      'A chat panel over the data it is talking about; dock it beside the page.',
      'Agent state shown only as a spinner: say which step is running and what is waiting.',
      'An empty workspace with only a text box; offer real first questions.',
    ],
  },
  source,
  sections: [
    {
      id: 'starting-points',
      title: 'Starting points',
      description: 'What a person sees before the first question.',
      specimens: [
        {
          id: 'AiWorkspaceTemplatePromptLanding',
          title: 'Prompt-first landing',
          note: 'Pick it as the home of an assistant product, where the composer is the hero and suggestions get people started.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/ai-workspaces/Composer.tsx', 'kit/ai-workspaces/PromptCard.tsx', 'kit/ListRow.tsx'],
          Component: AiWorkspaceTemplatePromptLanding,
        },
        {
          id: 'AiWorkspaceTemplateFirstRun',
          title: 'Empty workspace, first run',
          note: 'Pick it for a workspace with no data connected yet: the setup steps lead and sample questions keep it usable.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/Stat.tsx', 'kit/ai-workspaces/Composer.tsx', 'kit/ai-workspaces/PromptCard.tsx'],
          Component: AiWorkspaceTemplateFirstRun,
        },
      ],
    },
    {
      id: 'conversation',
      title: 'Conversation pages',
      description: 'A thread as the whole page, with history or sources beside it.',
      specimens: [
        {
          id: 'AiWorkspaceTemplateChatOnly',
          title: 'Chat only',
          note: 'Pick it when the conversation is the product: one centred column and nothing else to manage.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/ai-workspaces/ChatMessage.tsx', 'kit/ai-workspaces/Composer.tsx', 'kit/TrendLine.tsx'],
          Component: AiWorkspaceTemplateChatOnly,
        },
        {
          id: 'AiWorkspaceTemplateHistorySidebar',
          title: 'History sidebar and thread',
          note: 'Pick it when people come back to earlier conversations; the sidebar is the history and the answer shows its steps.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: [
            'kit/landing-pages/BrowserFrame.tsx',
            'kit/AppFrame.tsx',
            'kit/ai-workspaces/ChatMessage.tsx',
            'kit/ai-workspaces/AgentStep.tsx',
            'kit/ai-workspaces/Composer.tsx',
            'kit/DataTable.tsx',
          ],
          Component: AiWorkspaceTemplateHistorySidebar,
        },
        {
          id: 'AiWorkspaceTemplateSourcesRail',
          title: 'Chat with sources rail',
          note: 'Pick it when answers must be checked: citations in the text select the source beside it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: [
            'kit/landing-pages/BrowserFrame.tsx',
            'kit/AppFrame.tsx',
            'kit/ai-workspaces/ChatMessage.tsx',
            'kit/ai-workspaces/SourceCard.tsx',
            'kit/ai-workspaces/Composer.tsx',
          ],
          Component: AiWorkspaceTemplateSourcesRail,
        },
      ],
    },
    {
      id: 'beside-work',
      title: 'Chat beside work',
      description: 'The assistant next to the thing it helps with.',
      specimens: [
        {
          id: 'AiWorkspaceTemplateChatCanvas',
          title: 'Chat and canvas',
          note: 'Pick it when the assistant builds something to keep: the conversation drives, the canvas holds the charts and tables.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: [
            'kit/landing-pages/BrowserFrame.tsx',
            'kit/AppFrame.tsx',
            'kit/ai-workspaces/ChatMessage.tsx',
            'kit/ai-workspaces/Composer.tsx',
            'kit/TrendLine.tsx',
            'kit/DataTable.tsx',
            'kit/StatGroup.tsx',
          ],
          Component: AiWorkspaceTemplateChatCanvas,
        },
        {
          id: 'AiWorkspaceTemplateDockedAssistant',
          title: 'Assistant docked in a data page',
          note: 'Pick it to add an assistant to an existing page: it sits beside the data, says what it can see and never covers it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: [
            'kit/landing-pages/BrowserFrame.tsx',
            'kit/AppFrame.tsx',
            'kit/ai-workspaces/ChatMessage.tsx',
            'kit/ai-workspaces/Composer.tsx',
            'kit/DataTable.tsx',
            'kit/Stat.tsx',
            'kit/SparkLine.tsx',
          ],
          Component: AiWorkspaceTemplateDockedAssistant,
        },
        {
          id: 'AiWorkspaceTemplateNotebook',
          title: 'Notebook',
          note: 'Pick it for analysis that should be read later: questions, the queries behind them and the results in order.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: [
            'kit/landing-pages/BrowserFrame.tsx',
            'kit/AppFrame.tsx',
            'kit/ai-workspaces/NotebookCell.tsx',
            'kit/auth-pages/DetailList.tsx',
            'kit/TrendLine.tsx',
            'kit/ListRow.tsx',
          ],
          Component: AiWorkspaceTemplateNotebook,
        },
      ],
    },
    {
      id: 'agents',
      title: 'Agent pages',
      description: 'Watching an agent work and deciding what it may do.',
      specimens: [
        {
          id: 'AiWorkspaceTemplateAgentRun',
          title: 'Agent run',
          note: 'Pick it to follow a long-running agent on a shared screen: every step is a tile filled with its state.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/ai-workspaces/AgentStep.tsx', 'kit/Panel.tsx', 'kit/Stat.tsx', 'kit/ListRow.tsx'],
          Component: AiWorkspaceTemplateAgentRun,
        },
        {
          id: 'AiWorkspaceTemplateReviewAction',
          title: 'Review and approve',
          note: 'Pick it before an agent writes anything back: each change with its old and new value and risk, to include or leave out.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: [
            'kit/landing-pages/BrowserFrame.tsx',
            'kit/AppFrame.tsx',
            'kit/ai-workspaces/ChangeRow.tsx',
            'kit/RingGauge.tsx',
            'kit/SparkLine.tsx',
            'kit/auth-pages/DetailList.tsx',
          ],
          Component: AiWorkspaceTemplateReviewAction,
        },
      ],
    },
  ],
});
