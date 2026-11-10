import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Textarea } from '@cognite/aura/components/textarea';
import {
  IconAlertTriangle,
  IconChartLine,
  IconCircleCheck,
  IconFileText,
  IconMessage,
  IconPaperclip,
  IconPhoto,
  IconPin,
  IconTool,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { RowActionsMenu } from '../../../library/data/RowActionsMenu';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { SkeletonList } from '../../../library/feedback/SkeletonList';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { AttachmentChip } from '../../../library/patterns/collaboration/AttachmentChip';
import { CommentComposer } from '../../../library/patterns/collaboration/CommentComposer';
import { CommentItem } from '../../../library/patterns/collaboration/CommentItem';
import { MentionChip } from '../../../library/patterns/collaboration/MentionChip';
import { ReactionBar } from '../../../library/patterns/collaboration/ReactionBar';
import { toggleReaction } from '../../../library/patterns/collaboration/reactions';
import type { Reaction } from '../../../library/patterns/collaboration/reactions';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { SaveStatus } from '../../../library/patterns/data-entry/SaveStatus';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { SidePanel } from '../../../library/patterns/structure/SidePanel';
import { ALARMS, PEOPLE, SENSORS, WORK_ORDERS, findAsset } from '../../data/plant';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './comments-and-threads.tsx?raw';

const COMMENT_THREAD_ME = PEOPLE[0];
const COMMENT_THREAD_AISHA = PEOPLE[2];
const COMMENT_THREAD_TOMAS = PEOPLE[3];
const COMMENT_THREAD_LIV = PEOPLE[4];
const COMMENT_THREAD_MAGNUS = PEOPLE[1];
const COMMENT_THREAD_JONAS = PEOPLE[5];

const COMMENT_THREAD_ORDER = WORK_ORDERS[0];
const COMMENT_THREAD_ALARM = ALARMS[1];
const COMMENT_THREAD_SENSOR = SENSORS[3];
const COMMENT_THREAD_TREND = makeValues({ seed: 14, points: 36, base: 5.9, amplitude: 0.4, noise: 0.15, drift: 0.9 });

const COMMENT_THREAD_REACTIONS: readonly Reaction[] = [
  { id: 'agree', label: 'Agree', count: 3, reacted: false },
  { id: 'seen', label: 'Seen', count: 4, reacted: true },
  { id: 'thanks', label: 'Thanks', count: 0, reacted: false },
];

type CommentThreadEntry = { id: string; personId: string; time: string; minutesAgo: number; text: string };

const COMMENT_THREAD_FEED: readonly CommentThreadEntry[] = [
  { id: 'c1', personId: 'ak', time: '11:20', minutesAgo: 160, text: 'Spectrum shows a clear 1× peak on the drive end. I suspect unbalance, not the bearing.' },
  { id: 'c2', personId: 'tb', time: '12:05', minutesAgo: 115, text: 'Borescope is done. No scoring on the journal and the pads look even.' },
  { id: 'c3', personId: 'lw', time: '13:40', minutesAgo: 20, text: 'Restart is on hold until the balance check is signed off.' },
];

const COMMENT_THREAD_MENTIONABLE = [COMMENT_THREAD_AISHA, COMMENT_THREAD_TOMAS, COMMENT_THREAD_LIV, COMMENT_THREAD_MAGNUS, COMMENT_THREAD_JONAS];

function commentThreadPerson(personId: string) {
  return PEOPLE.find((person) => person.id === personId) ?? COMMENT_THREAD_ME;
}

/** Local reaction state for one comment. */
function useCommentThreadReactions(initial: readonly Reaction[]) {
  const [reactions, setReactions] = useState<readonly Reaction[]>(initial);
  return { reactions, toggle: (id: string) => setReactions((current) => toggleReaction(current, id)) };
}

/** The record a thread hangs on: what it is, its id and the one fact that explains the comment. */
function CommentThreadAnchor({
  icon,
  kind,
  title,
  reference,
  children,
}: {
  icon: ReactNode;
  kind: string;
  title: string;
  reference: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex w-full min-w-0 items-center gap-3 rounded-lg bg-muted-background p-3">
      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-md bg-base-background text-medium-foreground [&>svg]:size-4">
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs text-muted-foreground">
          {kind} · <span className="font-mono">{reference}</span>
        </span>
        <span className="truncate text-sm font-medium text-base-foreground">{title}</span>
      </div>
      {children ? <div className="flex shrink-0 items-center gap-3">{children}</div> : null}
    </div>
  );
}

function CommentThreadItemBasic() {
  return (
    <div className="w-full max-w-lg">
      <CommentItem author={COMMENT_THREAD_AISHA.name} colorKey={COMMENT_THREAD_AISHA.id} authorDetail={COMMENT_THREAD_AISHA.role} time="14 min ago">
        Vibration on the drive end is back under 7.1 mm/s after the load reduction. I will keep the trend open for the
        next hour.
      </CommentItem>
    </div>
  );
}

function CommentThreadItemMentions() {
  return (
    <div className="w-full max-w-lg">
      <CommentItem author={COMMENT_THREAD_LIV.name} colorKey={COMMENT_THREAD_LIV.id} time="26 min ago">
        <MentionChip name={COMMENT_THREAD_ME.name} self /> can you confirm the bearing temperature before we restart?{' '}
        <MentionChip name={COMMENT_THREAD_TOMAS.name} /> has the borescope images.
      </CommentItem>
    </div>
  );
}

function CommentThreadItemAttachments() {
  return (
    <div className="w-full max-w-lg">
      <CommentItem
        author={COMMENT_THREAD_TOMAS.name}
        colorKey={COMMENT_THREAD_TOMAS.id}
        time="12:05"
        attachments={
          <>
            <AttachmentChip name="Drive-end bearing, borescope.jpg" size="5.1 MB" icon={<IconPhoto />} onOpen={() => undefined} />
            <AttachmentChip name="Inspection checklist rev 4.pdf" size="860 kB" icon={<IconFileText />} onOpen={() => undefined} />
          </>
        }
      >
        Borescope is done. No scoring on the journal and the pads look even. Images and the signed checklist are attached.
      </CommentItem>
    </div>
  );
}

function CommentThreadItemReactions() {
  const { reactions, toggle } = useCommentThreadReactions(COMMENT_THREAD_REACTIONS);

  return (
    <div className="w-full max-w-lg">
      <CommentItem
        author={COMMENT_THREAD_AISHA.name}
        colorKey={COMMENT_THREAD_AISHA.id}
        time="11:20"
        footer={
          <>
            <ReactionBar reactions={reactions} onToggle={toggle} label="Reactions to Aisha Khan's comment" />
            <Button variant="ghost" size="sm">
              Reply
            </Button>
          </>
        }
      >
        Spectrum shows a clear 1× peak on the drive end. I suspect unbalance, not the bearing.
      </CommentItem>
    </div>
  );
}

function CommentThreadItemEdited() {
  return (
    <div className="w-full max-w-lg">
      <CommentItem
        author={COMMENT_THREAD_MAGNUS.name}
        colorKey={COMMENT_THREAD_MAGNUS.id}
        time="Yesterday 16:12"
        edited
        actions={
          <RowActionsMenu
            label="Actions for Magnus Solberg's comment"
            actions={[
              { id: 'copy', label: 'Copy link to comment', onSelect: () => undefined },
              { id: 'history', label: 'View edit history', onSelect: () => undefined },
            ]}
          />
        }
      >
        Tube bundle cleaning is moved to the week 12 window. Scaffolding is booked for Tuesday, not Monday.
      </CommentItem>
    </div>
  );
}

function CommentThreadItemDeleted() {
  return (
    <div className="w-full max-w-lg">
      <CommentItem
        author={COMMENT_THREAD_JONAS.name}
        time="10:48"
        deleted
        deletedText="Jonas Nyberg deleted this comment."
        replies={
          <CommentItem author={COMMENT_THREAD_AISHA.name} colorKey={COMMENT_THREAD_AISHA.id} time="10:55" size="compact">
            Thanks, the transmitter range is 0 to 15 mm/s, so the reading is valid.
          </CommentItem>
        }
      />
    </div>
  );
}

function CommentThreadComposerBasic() {
  const [posted, setPosted] = useState<string | null>(null);

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <CommentComposer label={`Comment on ${COMMENT_THREAD_ORDER.id}`} onSubmit={setPosted} />
      <p className="min-h-5 text-xs text-muted-foreground" role="status">
        {posted ? `Posted: "${posted}"` : ''}
      </p>
    </div>
  );
}

function CommentThreadComposerDraft() {
  const [state, setState] = useState<'idle' | 'saved'>('saved');

  return (
    <div className="w-full max-w-lg">
      <CommentComposer
        label={`Comment on ${COMMENT_THREAD_ORDER.id}`}
        defaultValue="Balance check is booked with the vendor for"
        onValueChange={(text) => setState(text.trim() === '' ? 'idle' : 'saved')}
        onSubmit={() => setState('idle')}
        status={<SaveStatus state={state} savedText="Draft saved" />}
      />
    </div>
  );
}

function CommentThreadComposerMentionPicker() {
  const [text, setText] = useState('Seal gas filter differential is rising. @');
  const match = /@([\p{L}]*)$/u.exec(text);
  const query = match ? match[1].toLowerCase() : null;
  const options = query === null ? [] : COMMENT_THREAD_MENTIONABLE.filter((person) => person.name.toLowerCase().includes(query));

  const pick = (name: string) => setText((current) => current.replace(/@[\p{L}]*$/u, `@${name} `));

  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <Textarea
        aria-label="Comment with a mention"
        rows={3}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      {query === null ? (
        <p className="text-xs text-muted-foreground">Type @ to mention someone on the work order.</p>
      ) : (
        <div className="w-64 rounded-lg border border-default bg-popover-background p-1">
          <p className="px-2 py-1 text-xs text-muted-foreground">People on this work order</p>
          {options.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">Nobody matches "{query}"</p>
          ) : (
            <ul aria-label="Mention someone" className="flex flex-col">
              {options.slice(0, 4).map((person) => (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => pick(person.name)}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left outline-none hover:bg-accent-background focus-visible:shadow-focus-ring"
                  >
                    <PersonAvatar name={person.name} colorKey={person.id} sizes="xsm" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm text-base-foreground">{person.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{person.role}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function CommentThreadComposerAttachments() {
  const [files, setFiles] = useState<readonly string[]>(['Balance report 23-KA-9103.pdf', 'Rotor photo.jpg']);

  return (
    <div className="w-full max-w-lg">
      <CommentComposer
        label={`Comment on ${COMMENT_THREAD_ORDER.id}`}
        defaultValue="Balance report from the vendor is attached."
        onSubmit={() => setFiles([])}
        tools={
          <IconAction label="Attach file" onClick={() => setFiles(['Balance report 23-KA-9103.pdf', 'Rotor photo.jpg'])}>
            <IconPaperclip />
          </IconAction>
        }
        attachments={
          files.length > 0
            ? files.map((file) => (
                <AttachmentChip
                  key={file}
                  name={file}
                  size={file.endsWith('.pdf') ? '1.2 MB' : '3.8 MB'}
                  icon={file.endsWith('.pdf') ? <IconFileText /> : <IconPhoto />}
                  onRemove={() => setFiles((current) => current.filter((name) => name !== file))}
                />
              ))
            : undefined
        }
      />
    </div>
  );
}

function CommentThreadComposerReadOnly() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <CommentItem author={COMMENT_THREAD_LIV.name} colorKey={COMMENT_THREAD_LIV.id} time="13:40">
        Restart is on hold until the balance check is signed off.
      </CommentItem>
      <CommentComposer
        label="Comment"
        onSubmit={() => undefined}
        readOnlyReason="You can read this thread. Only the assignee, planners, and shift supervisors can comment on a P1 work order."
      />
    </div>
  );
}

function CommentThreadComposerReply() {
  const [replying, setReplying] = useState(true);
  const [replies, setReplies] = useState<readonly string[]>([]);

  return (
    <div className="w-full max-w-lg">
      <CommentItem
        author={COMMENT_THREAD_AISHA.name}
        colorKey={COMMENT_THREAD_AISHA.id}
        time="11:20"
        footer={
          replying ? undefined : (
            <Button variant="ghost" size="sm" onClick={() => setReplying(true)}>
              Reply
            </Button>
          )
        }
        replies={
          replies.length > 0 || replying ? (
            <>
              {replies.map((reply, index) => (
                <CommentItem key={`${reply}-${index}`} author={COMMENT_THREAD_ME.name} colorKey={COMMENT_THREAD_ME.id} time="Just now" size="compact">
                  {reply}
                </CommentItem>
              ))}
              {replying ? (
                <CommentComposer
                  label="Reply to Aisha Khan"
                  placeholder="Write a reply"
                  submitLabel="Reply"
                  rows={2}
                  onSubmit={(text) => {
                    setReplies((current) => [...current, text]);
                    setReplying(false);
                  }}
                  onCancel={() => setReplying(false)}
                />
              ) : null}
            </>
          ) : undefined
        }
      >
        Spectrum shows a clear 1× peak on the drive end. I suspect unbalance, not the bearing.
      </CommentItem>
    </div>
  );
}

function CommentThreadReplies() {
  return (
    <div className="w-full max-w-lg">
      <CommentItem
        author={COMMENT_THREAD_AISHA.name}
        colorKey={COMMENT_THREAD_AISHA.id}
        time="11:20"
        replies={
          <>
            <CommentItem author={COMMENT_THREAD_TOMAS.name} colorKey={COMMENT_THREAD_TOMAS.id} time="11:32" size="compact">
              Agreed. The pads look even on the borescope, so I would not open the bearing yet.
            </CommentItem>
            <CommentItem author={COMMENT_THREAD_LIV.name} colorKey={COMMENT_THREAD_LIV.id} time="11:41" size="compact">
              Then we book a balance check first. <MentionChip name={COMMENT_THREAD_MAGNUS.name} /> can you plan it?
            </CommentItem>
            <CommentItem author={COMMENT_THREAD_MAGNUS.name} colorKey={COMMENT_THREAD_MAGNUS.id} time="11:58" size="compact">
              Vendor can be on site tomorrow at 08:00.
            </CommentItem>
          </>
        }
      >
        Spectrum shows a clear 1× peak on the drive end. I suspect unbalance, not the bearing.
      </CommentItem>
    </div>
  );
}

function CommentThreadCollapsedReplies() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full max-w-lg">
      <CommentItem
        author={COMMENT_THREAD_LIV.name}
        colorKey={COMMENT_THREAD_LIV.id}
        time="Yesterday 22:10"
        replies={
          <>
            {expanded ? (
              <>
                <CommentItem author={COMMENT_THREAD_ME.name} colorKey={COMMENT_THREAD_ME.id} time="Yesterday 22:14" size="compact">
                  Pump A carried the load alone from 21:50.
                </CommentItem>
                <CommentItem author={COMMENT_THREAD_JONAS.name} colorKey={COMMENT_THREAD_JONAS.id} time="Yesterday 22:31" size="compact">
                  Start permissive was blocked by the suction pressure switch.
                </CommentItem>
                <CommentItem author={COMMENT_THREAD_MAGNUS.name} colorKey={COMMENT_THREAD_MAGNUS.id} time="Yesterday 23:02" size="compact">
                  WO-104458 raised for the standby start test.
                </CommentItem>
              </>
            ) : (
              <div>
                <Button variant="ghost" size="sm" onClick={() => setExpanded(true)} className="-ml-2">
                  Show 3 earlier replies
                </Button>
              </div>
            )}
            <CommentItem author={COMMENT_THREAD_TOMAS.name} colorKey={COMMENT_THREAD_TOMAS.id} time="07:15" size="compact">
              Switch replaced and tested. Pump B starts on demand again.
            </CommentItem>
          </>
        }
      >
        Export pump B did not start on the standby test. Who was on shift?
      </CommentItem>
    </div>
  );
}

function CommentThreadResolved() {
  const [resolved, setResolved] = useState(true);

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex min-h-7 items-center justify-between gap-3">
        {resolved ? (
          <span className="flex items-center gap-2 text-sm text-medium-foreground">
            <Badge variant="success">
              <IconCircleCheck aria-hidden="true" />
              Resolved
            </Badge>
            by {COMMENT_THREAD_LIV.name} · 13:52
          </span>
        ) : (
          <span className="text-sm text-medium-foreground">Open thread · 2 comments</span>
        )}
        <Button variant="ghost" size="sm" onClick={() => setResolved((current) => !current)}>
          {resolved ? 'Reopen thread' : 'Resolve thread'}
        </Button>
      </div>
      <div className={resolved ? 'opacity-60' : undefined}>
        <CommentItem
          author={COMMENT_THREAD_ME.name}
          colorKey={COMMENT_THREAD_ME.id}
          time="13:05"
          replies={
            <CommentItem author={COMMENT_THREAD_JONAS.name} colorKey={COMMENT_THREAD_JONAS.id} time="13:48" size="compact">
              Transmitter recalibrated. It reads 38.9 °C against the reference now.
            </CommentItem>
          }
        >
          Cooler outlet temperature is flagged uncertain. Is 23-TT-91141 due for calibration?
        </CommentItem>
      </div>
    </div>
  );
}

function CommentThreadPinned() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="rounded-lg bg-muted-background p-3">
        <CommentItem
          author={COMMENT_THREAD_LIV.name}
          colorKey={COMMENT_THREAD_LIV.id}
          time="13:40"
          badge={
            <Badge variant="secondary">
              <IconPin aria-hidden="true" />
              Pinned
            </Badge>
          }
        >
          Restart is on hold until the balance check is signed off. Do not reset the trip.
        </CommentItem>
      </div>
      <CommentItem author={COMMENT_THREAD_TOMAS.name} colorKey={COMMENT_THREAD_TOMAS.id} time="13:55">
        Understood. Lock-out tag stays on the starter.
      </CommentItem>
    </div>
  );
}

function CommentThreadSorted() {
  const [order, setOrder] = useState('newest');
  const comments = [...COMMENT_THREAD_FEED].sort((a, b) =>
    order === 'newest' ? a.minutesAgo - b.minutesAgo : b.minutesAgo - a.minutesAgo
  );

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <SectionHeader
        title="Comments"
        count={comments.length}
        size="sm"
        as="h4"
        actions={
          <OptionSelect
            aria-label="Sort comments"
            size="sm"
            width="compact"
            value={order}
            onValueChange={setOrder}
            options={[
              { value: 'newest', label: 'Newest first' },
              { value: 'oldest', label: 'Oldest first' },
            ]}
          />
        }
      />
      <div className="flex flex-col gap-4">
        {comments.map((comment) => {
          const person = commentThreadPerson(comment.personId);
          return (
            <CommentItem key={comment.id} author={person.name} colorKey={person.id} time={comment.time}>
              {comment.text}
            </CommentItem>
          );
        })}
      </div>
    </div>
  );
}

function CommentThreadEmpty() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <EmptyState>
        <EmptyStateIcon>
          <IconMessage />
        </EmptyStateIcon>
        <EmptyStateTitle as="h4">No comments yet</EmptyStateTitle>
        <EmptyStateDescription>Ask a question or leave a note for the next shift. Everyone on the work order is notified.</EmptyStateDescription>
      </EmptyState>
      <CommentComposer label={`Comment on ${COMMENT_THREAD_ORDER.id}`} placeholder="Start the conversation" rows={2} onSubmit={() => undefined} />
    </div>
  );
}

function CommentThreadLoading() {
  return (
    <div className="w-full max-w-lg">
      <SkeletonList rows={3} media description label="Loading comments" />
    </div>
  );
}

function CommentThreadOnChartPoint() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <CommentThreadAnchor icon={<IconChartLine />} kind="Trend point" reference={COMMENT_THREAD_SENSOR.tag} title="Drive-end vibration · 12 Mar 11:42">
        <span className="w-20">
          <Sparkline values={COMMENT_THREAD_TREND} label="Drive-end vibration, last 6 hours" unit="mm/s" decimals={1} limit={7.1} showLast height={28} />
        </span>
        <span className="text-sm font-medium tabular-nums text-base-foreground">
          6.8 <span className="font-normal text-muted-foreground">mm/s</span>
        </span>
      </CommentThreadAnchor>
      <CommentItem author={COMMENT_THREAD_AISHA.name} colorKey={COMMENT_THREAD_AISHA.id} time="11:47">
        The step up here lines up with the anti-surge valve closing. Worth comparing with the suction pressure.
      </CommentItem>
    </div>
  );
}

function CommentThreadOnAlarm() {
  const asset = findAsset(COMMENT_THREAD_ALARM.assetId);

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <CommentThreadAnchor icon={<IconAlertTriangle />} kind="Alarm" reference={COMMENT_THREAD_ALARM.id} title={COMMENT_THREAD_ALARM.message}>
        <span className="text-right text-xs tabular-nums text-muted-foreground">
          {COMMENT_THREAD_ALARM.value}
          <br />
          limit {COMMENT_THREAD_ALARM.limit}
        </span>
      </CommentThreadAnchor>
      <CommentItem author={COMMENT_THREAD_ME.name} colorKey={COMMENT_THREAD_ME.id} time="13:24">
        Acknowledged. {asset?.name} is running at reduced load until the interstage cooler is cleaned.
      </CommentItem>
    </div>
  );
}

function CommentThreadOnWorkOrder() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <CommentThreadAnchor icon={<IconTool />} kind="Work order" reference={COMMENT_THREAD_ORDER.id} title={COMMENT_THREAD_ORDER.title}>
        <Badge variant="error">{COMMENT_THREAD_ORDER.priority}</Badge>
      </CommentThreadAnchor>
      <CommentItem author={COMMENT_THREAD_TOMAS.name} colorKey={COMMENT_THREAD_TOMAS.id} time="12:05">
        Step 4 of 9 is done. Waiting for the balance report before I close up the casing.
      </CommentItem>
    </div>
  );
}

function CommentThreadCountEntry() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-medium-foreground">Record header</span>
        <Button variant="outline" size="sm">
          <IconMessage /> Comments <Badge variant="secondary">4</Badge>
        </Button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-medium-foreground">Table row</span>
        <Button variant="ghost" size="sm" aria-label="4 comments, 1 unresolved">
          <IconMessage /> <span className="tabular-nums">4</span>
        </Button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-medium-foreground">Nothing yet</span>
        <Button variant="ghost" size="sm">
          <IconMessage /> Add comment
        </Button>
      </div>
    </div>
  );
}

function CommentThreadSidePanel() {
  const { reactions, toggle } = useCommentThreadReactions(COMMENT_THREAD_REACTIONS);
  const [extra, setExtra] = useState<readonly string[]>([]);

  return (
    <div className="h-[36rem] w-full max-w-xl">
      <SidePanel
        title="Comments"
        description={`${COMMENT_THREAD_ORDER.id} · ${COMMENT_THREAD_ORDER.title}`}
        status={<Badge variant="secondary">{4 + extra.length}</Badge>}
        onClose={() => undefined}
        closeLabel="Close comments"
        footer={
          <CommentComposer
            label={`Comment on ${COMMENT_THREAD_ORDER.id}`}
            rows={2}
            onSubmit={(text) => setExtra((current) => [...current, text])}
          />
        }
      >
        <div className="flex flex-col gap-5">
          <div className="rounded-lg bg-muted-background p-3">
            <CommentItem
              author={COMMENT_THREAD_LIV.name}
              colorKey={COMMENT_THREAD_LIV.id}
              time="13:40"
              badge={
                <Badge variant="secondary">
                  <IconPin aria-hidden="true" />
                  Pinned
                </Badge>
              }
            >
              Restart is on hold until the balance check is signed off.
            </CommentItem>
          </div>
          <CommentItem
            author={COMMENT_THREAD_AISHA.name}
            colorKey={COMMENT_THREAD_AISHA.id}
            time="11:20"
            footer={<ReactionBar reactions={reactions} onToggle={toggle} label="Reactions to Aisha Khan's comment" />}
            replies={
              <CommentItem author={COMMENT_THREAD_TOMAS.name} colorKey={COMMENT_THREAD_TOMAS.id} time="11:32" size="compact">
                Agreed. The pads look even on the borescope.
              </CommentItem>
            }
          >
            Spectrum shows a clear 1× peak on the drive end. <MentionChip name={COMMENT_THREAD_ME.name} self /> can you
            hold the load at 80%?
          </CommentItem>
          <CommentItem
            author={COMMENT_THREAD_TOMAS.name}
            colorKey={COMMENT_THREAD_TOMAS.id}
            time="12:05"
            attachments={<AttachmentChip name="Drive-end bearing, borescope.jpg" size="5.1 MB" icon={<IconPhoto />} onOpen={() => undefined} />}
          >
            Borescope is done. No scoring on the journal.
          </CommentItem>
          {extra.map((text, index) => (
            <CommentItem key={`${text}-${index}`} author={COMMENT_THREAD_ME.name} colorKey={COMMENT_THREAD_ME.id} time="Just now">
              {text}
            </CommentItem>
          ))}
        </div>
      </SidePanel>
    </div>
  );
}

export default definePage({
  id: 'comments-and-threads',
  title: 'Comments and threads',
  summary:
    'Comments keep the discussion on the record it is about: an alarm, a work order, a point on a trend. One comment anatomy, one composer and one level of replies cover every thread in the product.',
  guidance: {
    use: [
      'Anchor every thread to a record and show that record above the comments.',
      'One level of replies, joined by a thread line. Deeper nesting becomes a new thread.',
      'Reactions as a few words that mean something in the work: Agree, Seen, Thanks.',
      'Leave a tombstone for a deleted comment so its replies keep their context.',
    ],
    avoid: [
      'A disabled composer with no reason. Say who can comment instead.',
      'Emoji pickers and free-form reactions in an operational log.',
      'Hiding a resolved thread completely. Dim it and keep a way to reopen.',
      'Posting on Enter alone. Enter makes a new line, the shortcut sends.',
    ],
  },
  source,
  sections: [
    {
      id: 'comment',
      title: 'Comment',
      description: 'One comment and the things it can carry: mentions, files, reactions and its own history.',
      specimens: [
        {
          id: 'CommentThreadItemBasic',
          title: 'Comment',
          note: 'The base anatomy for every comment: who, their role, when, then the text.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentItem.tsx'],
          Component: CommentThreadItemBasic,
        },
        {
          id: 'CommentThreadItemMentions',
          title: 'With mentions',
          note: 'When a comment asks someone for something; a mention of the reader is the stronger chip.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentItem.tsx', 'patterns/collaboration/MentionChip.tsx'],
          Component: CommentThreadItemMentions,
        },
        {
          id: 'CommentThreadItemAttachments',
          title: 'With attachments',
          note: 'Evidence that belongs with the comment: photos, reports and signed checklists.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentItem.tsx', 'patterns/collaboration/AttachmentChip.tsx'],
          Component: CommentThreadItemAttachments,
        },
        {
          id: 'CommentThreadItemReactions',
          title: 'With reactions',
          note: 'Lets people agree or confirm they have seen it without adding a comment. Press one to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentItem.tsx', 'patterns/collaboration/ReactionBar.tsx', 'patterns/collaboration/reactions.ts'],
          Component: CommentThreadItemReactions,
        },
        {
          id: 'CommentThreadItemEdited',
          title: 'Edited, with actions',
          note: 'An edited comment says so beside the time; the menu holds the link and the edit history.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentItem.tsx', 'data/RowActionsMenu.tsx'],
          Component: CommentThreadItemEdited,
        },
        {
          id: 'CommentThreadItemDeleted',
          title: 'Deleted, replies kept',
          note: 'A deleted comment that has replies leaves a tombstone, so the answers still make sense.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentItem.tsx'],
          Component: CommentThreadItemDeleted,
        },
      ],
    },
    {
      id: 'composer',
      title: 'Composer',
      description: 'Where a comment is written, and what the box looks like when it is restored, extended or not allowed.',
      specimens: [
        {
          id: 'CommentThreadComposerBasic',
          title: 'Composer',
          note: 'The default box: submit unlocks with text and the shortcut sends. Type and post to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentComposer.tsx', 'actions/ShortcutHint.tsx'],
          Component: CommentThreadComposerBasic,
        },
        {
          id: 'CommentThreadComposerDraft',
          title: 'Draft saved',
          note: 'When a half-written comment survives navigation; the status says it is safe.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentComposer.tsx', 'patterns/data-entry/SaveStatus.tsx'],
          Component: CommentThreadComposerDraft,
        },
        {
          id: 'CommentThreadComposerMentionPicker',
          title: 'Mention picker',
          note: 'Typing @ lists the people on the record first. Type a letter or pick a name to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx'],
          Component: CommentThreadComposerMentionPicker,
        },
        {
          id: 'CommentThreadComposerAttachments',
          title: 'With attachments',
          note: 'Files queued on a comment before it is posted, each removable.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentComposer.tsx', 'patterns/collaboration/AttachmentChip.tsx', 'patterns/collections/IconAction.tsx'],
          Component: CommentThreadComposerAttachments,
        },
        {
          id: 'CommentThreadComposerReply',
          title: 'Inline reply',
          note: 'A reply is written where it will appear, with Cancel to back out.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentComposer.tsx', 'patterns/collaboration/CommentItem.tsx'],
          Component: CommentThreadComposerReply,
        },
        {
          id: 'CommentThreadComposerReadOnly',
          title: 'Read-only thread',
          note: 'When the reader may follow a thread but not write in it; the reason replaces the box.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentComposer.tsx', 'patterns/collaboration/CommentItem.tsx'],
          Component: CommentThreadComposerReadOnly,
        },
      ],
    },
    {
      id: 'threads',
      title: 'Threads',
      description: 'Several comments together: replies, order, and the states a whole thread can be in.',
      specimens: [
        {
          id: 'CommentThreadReplies',
          title: 'Reply thread',
          note: 'Answers indent one level under the comment they answer, joined by a thread line.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentItem.tsx', 'patterns/collaboration/MentionChip.tsx'],
          Component: CommentThreadReplies,
        },
        {
          id: 'CommentThreadCollapsedReplies',
          title: 'Collapsed replies',
          note: 'A long thread shows the question and the latest answer, with the middle one click away.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentItem.tsx'],
          Component: CommentThreadCollapsedReplies,
        },
        {
          id: 'CommentThreadResolved',
          title: 'Resolved thread',
          note: 'A question that has been answered: dimmed, labelled with who closed it, and reopenable.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentItem.tsx'],
          Component: CommentThreadResolved,
        },
        {
          id: 'CommentThreadPinned',
          title: 'Pinned comment',
          note: 'The one instruction everybody opening the record must read first.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentItem.tsx'],
          Component: CommentThreadPinned,
        },
        {
          id: 'CommentThreadSorted',
          title: 'Sort order',
          note: 'Newest first for a live incident, oldest first to read a discussion as it happened.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentItem.tsx', 'patterns/structure/SectionHeader.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: CommentThreadSorted,
        },
        {
          id: 'CommentThreadEmpty',
          title: 'Empty thread',
          note: 'A record nobody has commented on: say what a comment does and keep the box in reach.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentComposer.tsx'],
          Component: CommentThreadEmpty,
        },
      ],
    },
    {
      id: 'anchored',
      title: 'Anchored to a record',
      description: 'The header that says what a thread is about, so a comment makes sense outside its page.',
      specimens: [
        {
          id: 'CommentThreadOnChartPoint',
          title: 'On a trend point',
          note: 'A comment about one moment in a time series: tag, timestamp and the value at that point.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentItem.tsx', 'industrial/Sparkline.tsx'],
          Component: CommentThreadOnChartPoint,
        },
        {
          id: 'CommentThreadOnAlarm',
          title: 'On an alarm',
          note: 'Operator notes on an alarm, with the value and limit that raised it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentItem.tsx'],
          Component: CommentThreadOnAlarm,
        },
        {
          id: 'CommentThreadOnWorkOrder',
          title: 'On a work order',
          note: 'Progress notes from the field against the job and its priority.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/CommentItem.tsx'],
          Component: CommentThreadOnWorkOrder,
        },
        {
          id: 'CommentThreadLoading',
          title: 'Loading thread',
          note: 'While comments load: rows shaped like comments, so the panel does not jump.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/SkeletonList.tsx'],
          Component: CommentThreadLoading,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Full blocks',
      description: 'The entry point on a record and the panel it opens.',
      specimens: [
        {
          id: 'CommentThreadCountEntry',
          title: 'Comment count entry points',
          note: 'How a record advertises its thread: labelled in a header, compact in a row, an invitation when empty.',
          origin: 'custom',
          Component: CommentThreadCountEntry,
        },
        {
          id: 'CommentThreadSidePanel',
          title: 'Thread in a side panel',
          note: 'The whole discussion beside the record it belongs to, with the composer pinned to the bottom.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: [
            'patterns/structure/SidePanel.tsx',
            'patterns/collaboration/CommentItem.tsx',
            'patterns/collaboration/CommentComposer.tsx',
            'patterns/collaboration/ReactionBar.tsx',
            'patterns/collaboration/MentionChip.tsx',
            'patterns/collaboration/AttachmentChip.tsx',
          ],
          Component: CommentThreadSidePanel,
        },
      ],
    },
  ],
});
