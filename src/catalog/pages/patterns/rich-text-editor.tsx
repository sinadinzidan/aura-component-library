import { Button } from '@cognite/aura/components/button';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { FormatToolbar } from '../../../library/tools/rich-text/FormatToolbar';
import { LengthCounter } from '../../../library/tools/rich-text/LengthCounter';
import { LinkPopover } from '../../../library/tools/rich-text/LinkPopover';
import { RichTextEditor } from '../../../library/tools/rich-text/RichTextEditor';
import { SuggestionList } from '../../../library/tools/rich-text/SuggestionList';
import type { Suggestion } from '../../../library/tools/rich-text/triggers';
import { ASSETS, PEOPLE, findAsset } from '../../data/plant';
import { definePage } from '../../types';

import source from './rich-text-editor.tsx?raw';

const RICHEDIT_PEOPLE: readonly Suggestion[] = PEOPLE.map((person) => ({ id: person.id, label: person.name, detail: person.role }));

const RICHEDIT_TAGS: readonly Suggestion[] = ASSETS.filter((asset) => asset.type !== 'site' && asset.type !== 'area' && asset.type !== 'system').map((asset) => ({
  id: asset.id,
  label: asset.tag,
  detail: asset.name,
}));

const RICHEDIT_PROCEDURE = [
  '# Recompressor restart',
  'Restart **23-KA-9103** only after the drive-end bearing is inspected under `WO-104482`.',
  '',
  '## Before start',
  '- [x] Permit closed',
  '- [ ] Seal gas differential above 0.5 bar',
  '- [ ] Lube oil temperature above 35 °C',
  '  - Check #23-PT-92531 reads normal',
  '',
  '## Start sequence',
  '1. Reset the trip at the local panel',
  '2. Start on minimum speed and hold for 10 minutes',
  '3. Ramp to 9,800 rpm at 500 rpm per minute',
  '',
  '> Stop at once if vibration passes 7.1 mm/s. Ask @Aisha Khan before a second attempt.',
  '',
  'Full steps are in [the restart procedure](https://docs.example.test/restart).',
].join('\n');

const RICHEDIT_COMMENT = 'Agree with the plan. Can @Tomás Barros confirm the spare bearing is on site before we book the crane?';

const RICHEDIT_LOG = ['Day shift handover.', '', '- Recompressor tripped 13:46, still down', '- Export at **4.1 MSm³/d**', '- Pump B standby test overdue'].join('\n');

const RICHEDIT_ORDER = [
  '## Scope',
  'Inspect the drive-end bearing of #23-KA-9103 and replace if scored.',
  '',
  '## Steps',
  '1. Isolate and lock out',
  '2. Remove bearing cover',
  '3. Measure clearance and record it',
  '',
  '```',
  'clearance limit: 0.12 mm',
  '```',
].join('\n');

const RICHEDIT_LONG = [
  'The recompressor tripped on high drive-end vibration at 13:46 while the train was running on two stages.',
  'The operator reset the trip once and the unit tripped again within four minutes, which points at the bearing rather than a process upset.',
  'Vibration on 23-VT-92740 reached 11.6 mm/s against a trip limit of 11.0 mm/s; the first stage showed 6.8 mm/s, near its alarm limit.',
].join(' ');

const RICHEDIT_GUIDANCE = (
  <ul className="list-disc space-y-1 pl-4">
    <li>What happened and when, in one line.</li>
    <li>What you did and what you saw.</li>
    <li>What the next shift needs to do, with asset tags.</li>
  </ul>
);

function richEditPerson(person: Suggestion) {
  return <PersonAvatar name={person.label} sizes="xsm" />;
}

function richEditNoop() {}

function RichEditorFull() {
  return (
    <div className="w-full">
      <RichTextEditor
        label="Procedure"
        defaultValue={RICHEDIT_PROCEDURE}
        defaultMode="split"
        people={RICHEDIT_PEOPLE}
        tags={RICHEDIT_TAGS}
        renderPerson={richEditPerson}
        softLimit={1500}
        maxLength={2000}
        heightClassName="h-[28rem]"
        actions={(snapshot) => (
          <>
            <Button variant="ghost" size="sm" onClick={() => snapshot.reset(RICHEDIT_PROCEDURE)}>
              Revert
            </Button>
            <Button size="sm" disabled={!snapshot.valid}>
              Save procedure
            </Button>
          </>
        )}
      />
    </div>
  );
}

function RichEditorComment() {
  return (
    <div className="w-full max-w-xl">
      <RichTextEditor
        label="Comment"
        hideLabel
        defaultValue={RICHEDIT_COMMENT}
        toolbar="compact"
        modes={['write', 'preview']}
        people={RICHEDIT_PEOPLE}
        renderPerson={richEditPerson}
        placeholder="Write a comment. Type @ to mention someone."
        maxLength={500}
        heightClassName="h-32"
        words={false}
        actions={(snapshot) => (
          <Button
            size="sm"
            disabled={!snapshot.valid}
            onClick={() => snapshot.reset()}
          >
            Post comment
          </Button>
        )}
      />
    </div>
  );
}

function RichEditorToolbarFull() {
  return (
    <div className="w-full rounded-lg border border-default bg-base-background p-2">
      <FormatToolbar
        active={{ bold: true, italic: false, code: false, heading: 0, list: 'bullet', quote: false }}
        onCommand={richEditNoop}
        link={{ selectedText: '', onInsert: richEditNoop }}
        onUndo={richEditNoop}
        onRedo={richEditNoop}
        canUndo
      />
    </div>
  );
}

function RichEditorToolbarCompact() {
  return (
    <div className="w-full rounded-lg border border-default bg-base-background p-2">
      <FormatToolbar variant="compact" label="Comment formatting" onCommand={richEditNoop} link={{ selectedText: '', onInsert: richEditNoop }} />
    </div>
  );
}

function RichEditorToolbarDisabled() {
  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-default bg-base-background p-2">
      <FormatToolbar variant="compact" label="Formatting, disabled" onCommand={richEditNoop} disabled />
      <span className="text-xs text-muted-foreground">Switch to Write to format the text.</span>
    </div>
  );
}

function RichEditorLinkPopover() {
  return (
    <div className="flex items-center gap-3">
      <LinkPopover selectedText="restart procedure" shortcut="Ctrl+K" onInsert={richEditNoop} />
      <span className="text-sm text-muted-foreground">Opens a form for text and an https address.</span>
    </div>
  );
}

function RichEditorMentionPicker() {
  return (
    <SuggestionList id="richedit-mention" label="People" suggestions={RICHEDIT_PEOPLE.slice(0, 4)} activeIndex={1} onPick={richEditNoop} renderLeading={richEditPerson} />
  );
}

function RichEditorTagPicker() {
  return (
    <SuggestionList
      id="richedit-tags"
      label="Asset tags"
      suggestions={RICHEDIT_TAGS.filter((tag) => tag.label.startsWith('23-KA'))}
      activeIndex={0}
      onPick={richEditNoop}
      monoLabel
    />
  );
}

function RichEditorNoMatch() {
  return <SuggestionList id="richedit-empty" label="People" suggestions={[]} activeIndex={0} onPick={richEditNoop} emptyText="No one by that name" />;
}

function RichEditorWriteMode() {
  return (
    <div className="w-full max-w-md">
      <RichTextEditor label="Shift note" defaultValue={RICHEDIT_LOG} modes={['write']} toolbar="compact" heightClassName="h-48" />
    </div>
  );
}

function RichEditorPreviewMode() {
  return (
    <div className="w-full max-w-md">
      <RichTextEditor label="Shift note, preview" defaultValue={RICHEDIT_LOG} defaultMode="preview" toolbar="compact" heightClassName="h-48" />
    </div>
  );
}

function RichEditorSplitMode() {
  return (
    <div className="w-full">
      <RichTextEditor label="Work order scope" defaultValue={RICHEDIT_ORDER} defaultMode="split" heightClassName="h-72" tags={RICHEDIT_TAGS} />
    </div>
  );
}

function RichEditorReadOnly() {
  return (
    <div className="w-full max-w-md">
      <RichTextEditor
        label="Signed-off procedure"
        defaultValue={RICHEDIT_LOG}
        readOnly
        readOnlyReason="Signed off by Liv Wold. Create a new revision to edit."
        defaultMode="write"
        heightClassName="h-48"
      />
    </div>
  );
}

function RichEditorTooLong() {
  return (
    <div className="w-full max-w-md">
      <RichTextEditor label="Incident summary" defaultValue={RICHEDIT_LONG} toolbar="compact" modes={['write']} softLimit={200} maxLength={300} heightClassName="h-48" />
    </div>
  );
}

function RichEditorEmpty() {
  return (
    <div className="w-full max-w-md">
      <RichTextEditor
        label="Handover note"
        placeholder="Start with what happened."
        guidance={RICHEDIT_GUIDANCE}
        defaultMode="split"
        toolbar="compact"
        heightClassName="h-48"
        people={RICHEDIT_PEOPLE}
        renderPerson={richEditPerson}
        tags={RICHEDIT_TAGS}
        actions={(snapshot) => (
          <Button size="sm" disabled={snapshot.empty}>
            Post handover
          </Button>
        )}
      />
    </div>
  );
}

function RichEditorDisabled() {
  return (
    <div className="w-full max-w-md">
      <RichTextEditor
        label="Operator log"
        defaultValue=""
        disabledReason="Only the shift on duty can write to the log."
        placeholder="Log entry"
        toolbar="compact"
        modes={['write']}
        heightClassName="h-40"
      />
    </div>
  );
}

function RichEditorLogEntry() {
  return (
    <div className="w-full max-w-xl">
      <RichTextEditor
        label="Log entry"
        hideLabel
        defaultValue="Recompressor tripped on high vibration at 13:46. Train on two stages. See #23-KA-9103."
        toolbar="compact"
        modes={['write', 'preview']}
        people={RICHEDIT_PEOPLE}
        renderPerson={richEditPerson}
        tags={RICHEDIT_TAGS}
        softLimit={400}
        maxLength={600}
        heightClassName="h-36"
        actions={(snapshot) => (
          <Button size="sm" disabled={!snapshot.valid} onClick={() => snapshot.reset()}>
            Add to log
          </Button>
        )}
      />
    </div>
  );
}

function RichEditorWorkOrder() {
  const asset = findAsset('23-ka-9103');
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-mono text-xs text-muted-foreground">WO-104482</span>
        <span className="text-sm font-medium text-base-foreground">{asset ? `${asset.tag} ${asset.name}` : 'Recompressor'}</span>
      </div>
      <RichTextEditor
        label="Work description"
        defaultValue={RICHEDIT_ORDER}
        defaultMode="split"
        tags={RICHEDIT_TAGS}
        people={RICHEDIT_PEOPLE}
        renderPerson={richEditPerson}
        softLimit={800}
        maxLength={1200}
        heightClassName="h-80"
        actions={(snapshot) => (
          <Button size="sm" disabled={!snapshot.valid}>
            Save description
          </Button>
        )}
      />
    </div>
  );
}

function RichEditorCounters() {
  return (
    <div className="flex flex-col gap-2">
      <LengthCounter text="Recompressor tripped" max={500} />
      <LengthCounter text={RICHEDIT_LONG.slice(0, 210)} soft={200} max={300} />
      <LengthCounter text={RICHEDIT_LONG} soft={200} max={300} />
    </div>
  );
}

function RichEditorDarkScope() {
  return (
    <ThemeScope preset="control-room" className="w-full rounded-xl bg-base-background p-4">
      <RichTextEditor
        label="Shift note"
        hideLabel
        defaultValue={RICHEDIT_PROCEDURE}
        defaultMode="split"
        people={RICHEDIT_PEOPLE}
        renderPerson={richEditPerson}
        tags={RICHEDIT_TAGS}
        heightClassName="h-96"
      />
    </ThemeScope>
  );
}

export default definePage({
  id: 'rich-text-editor',
  title: 'Rich text editor',
  summary:
    'A Markdown editor with a formatting toolbar, shortcuts, list continuation, mentions, asset tags and a live preview. The text is a plain labelled textarea; every command is a tested function that rewrites the selection.',
  guidance: {
    use: [
      'Notes, procedures and descriptions that need headings, lists and links but must stay portable as plain text.',
      'Split view for long documents, write and preview for comments in narrow places.',
      'A soft limit to nudge and a hard limit to block saving, with the count visible.',
    ],
    avoid: [
      'Layout, tables or images: this subset has none. Link to the document instead.',
      'Disabling the field without a reason. Say who can edit and why not.',
      'Using it for single-line values; use an input.',
    ],
  },
  source,
  sections: [
    {
      id: 'editors',
      title: 'Working editors',
      description: 'Type, select, use the toolbar and the shortcuts, press Enter in a list, type @ or #.',
      specimens: [
        {
          id: 'RichEditorFull',
          title: 'Document editor, split view',
          note: 'Procedures and long notes: text on the left, the result on the right, with save and revert.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'tools/rich-text/RichTextEditor.tsx',
            'tools/rich-text/FormatToolbar.tsx',
            'tools/rich-text/RichTextPreview.tsx',
            'tools/rich-text/SuggestionList.tsx',
            'tools/rich-text/commands.ts',
            'tools/rich-text/formatting.ts',
          ],
          Component: RichEditorFull,
        },
        {
          id: 'RichEditorComment',
          title: 'Comment editor',
          note: 'Replies and review comments: compact toolbar, mentions, a hard limit and one primary action.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/rich-text/RichTextEditor.tsx'],
          Component: RichEditorComment,
        },
        {
          id: 'RichEditorLogEntry',
          title: 'Operator log entry',
          note: 'A short shift log entry with tags and mentions; posting clears the field.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/rich-text/RichTextEditor.tsx'],
          Component: RichEditorLogEntry,
        },
      ],
    },
    {
      id: 'toolbar',
      title: 'Toolbar and pickers',
      description: 'The parts around the text field, shown on their own.',
      specimens: [
        {
          id: 'RichEditorToolbarFull',
          title: 'Full toolbar',
          note: 'Documents: history, headings, inline, lists, blocks and lookups, with the active formats pressed.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/rich-text/FormatToolbar.tsx', 'tools/rich-text/ToolButton.tsx'],
          Component: RichEditorToolbarFull,
        },
        {
          id: 'RichEditorToolbarCompact',
          title: 'Compact toolbar',
          note: 'Comments: inline formats, lists, quote and link only.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/rich-text/FormatToolbar.tsx'],
          Component: RichEditorToolbarCompact,
        },
        {
          id: 'RichEditorToolbarDisabled',
          title: 'Disabled toolbar',
          note: 'While the preview is showing, formatting is off and the reason is next to it.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/rich-text/FormatToolbar.tsx'],
          Component: RichEditorToolbarDisabled,
        },
        {
          id: 'RichEditorLinkPopover',
          title: 'Link popover',
          note: 'Opens from the toolbar or Ctrl+K and only accepts https and mailto addresses.',
          origin: 'custom',
          size: 'md',
          uses: ['tools/rich-text/LinkPopover.tsx'],
          Component: RichEditorLinkPopover,
        },
        {
          id: 'RichEditorMentionPicker',
          title: 'Mention picker',
          note: 'Opens after @ and follows the typing; arrow keys move, Enter or Tab picks.',
          origin: 'custom',
          size: 'sm',
          uses: ['tools/rich-text/SuggestionList.tsx'],
          Component: RichEditorMentionPicker,
        },
        {
          id: 'RichEditorTagPicker',
          title: 'Asset tag picker',
          note: 'Opens after #; tags are monospace so they can be told apart.',
          origin: 'custom',
          size: 'sm',
          uses: ['tools/rich-text/SuggestionList.tsx'],
          Component: RichEditorTagPicker,
        },
        {
          id: 'RichEditorNoMatch',
          title: 'No match',
          note: 'Say so in words when the typed name matches nobody.',
          origin: 'custom',
          size: 'sm',
          uses: ['tools/rich-text/SuggestionList.tsx'],
          Component: RichEditorNoMatch,
        },
        {
          id: 'RichEditorCounters',
          title: 'Length counters',
          note: 'Quiet while there is room, a warning past the soft limit, a count of the excess past the hard one.',
          origin: 'custom',
          size: 'sm',
          uses: ['tools/rich-text/LengthCounter.tsx'],
          Component: RichEditorCounters,
        },
      ],
    },
    {
      id: 'modes',
      title: 'View modes',
      description: 'Write, Preview and Split are one editor with different panes.',
      specimens: [
        {
          id: 'RichEditorWriteMode',
          title: 'Write only',
          note: 'Narrow places where the text is all that fits.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/rich-text/RichTextEditor.tsx'],
          Component: RichEditorWriteMode,
        },
        {
          id: 'RichEditorPreviewMode',
          title: 'Preview only',
          note: 'Check how the note reads before posting; the text is one tab away.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/rich-text/RichTextEditor.tsx', 'tools/rich-text/RichTextPreview.tsx'],
          Component: RichEditorPreviewMode,
        },
        {
          id: 'RichEditorSplitMode',
          title: 'Split',
          note: 'Side by side when the frame is wide, stacked when it is not.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/rich-text/RichTextEditor.tsx'],
          Component: RichEditorSplitMode,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'What the editor does when it cannot or should not accept text.',
      specimens: [
        {
          id: 'RichEditorReadOnly',
          title: 'Read only',
          note: 'Signed-off text: it can be read and copied, the tools are gone and the reason is stated.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/rich-text/RichTextEditor.tsx'],
          Component: RichEditorReadOnly,
        },
        {
          id: 'RichEditorTooLong',
          title: 'Too long',
          note: 'Over the hard limit the text stays, saving is blocked and the message says what to do.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/rich-text/RichTextEditor.tsx', 'tools/rich-text/LengthCounter.tsx'],
          Component: RichEditorTooLong,
        },
        {
          id: 'RichEditorEmpty',
          title: 'Empty with guidance',
          note: 'The preview of an empty note tells people what a good one contains.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/rich-text/RichTextEditor.tsx'],
          Component: RichEditorEmpty,
        },
        {
          id: 'RichEditorDisabled',
          title: 'Disabled with reason',
          note: 'When someone may not write here, say who may.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/rich-text/RichTextEditor.tsx'],
          Component: RichEditorDisabled,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'The editor inside the screens it is made for.',
      specimens: [
        {
          id: 'RichEditorWorkOrder',
          title: 'Work order description',
          note: 'A description with steps, a code block of limits and asset tags, saved against a work order.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/rich-text/RichTextEditor.tsx'],
          Component: RichEditorWorkOrder,
        },
        {
          id: 'RichEditorDarkScope',
          title: 'Dark control-room scope',
          note: 'The same editor in a dark theme scope, for control rooms.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'chrome',
          uses: ['themes/ThemeScope.tsx', 'tools/rich-text/RichTextEditor.tsx'],
          Component: RichEditorDarkScope,
        },
      ],
    },
  ],
});
