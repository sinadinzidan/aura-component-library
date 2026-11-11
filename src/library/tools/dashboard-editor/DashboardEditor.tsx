import { Tabs, TabsLabel, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import { IconCopy, IconTrash, IconX } from '@cognite/aura/icons';
import { useEffect, useReducer, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { IconAction } from '../../patterns/collections/IconAction';
import type { SelectOption } from '../../patterns/data-entry/OptionSelect';
import { SaveBar } from '../../patterns/data-entry/SaveBar';

import { DashboardCanvas } from './DashboardCanvas';
import { DashboardEmptyState } from './DashboardEmptyState';
import { createEditorState, editorReducer, isDirty } from './editorReducer';
import type { EditorMode, EditorWidget } from './editorReducer';
import { EditorToolbar } from './EditorToolbar';
import { sameLayout, toSingleColumn } from './gridLayout';
import { LayoutPresetPicker } from './LayoutPresetPicker';
import { WidgetPalette } from './WidgetPalette';
import type { PaletteWidget } from './WidgetPalette';
import { WidgetSettingsPopover } from './WidgetSettingsPopover';
import type { WidgetSizePreset } from './WidgetSettingsPopover';

export type DashboardWidgetType = PaletteWidget & {
  minW?: number;
  minH?: number;
  /** Whether the widget covers a period and so offers a time range. */
  hasRange?: boolean;
  /** Draws the widget at whatever size and settings it currently has. */
  render: (widget: EditorWidget) => ReactNode;
};

export type DashboardPreset = {
  id: string;
  name: string;
  description: string;
  widgets: readonly EditorWidget[];
};

type DashboardEditorProps = {
  title: string;
  description?: ReactNode;
  /** The widgets the dashboard can hold, with how to draw each. */
  widgetTypes: readonly DashboardWidgetType[];
  /** The default layout; "Reset layout" returns to it. */
  initialWidgets: readonly EditorWidget[];
  /** Whole layouts offered next to the widget list. */
  presets?: readonly DashboardPreset[];
  sizes: readonly WidgetSizePreset[];
  ranges: readonly SelectOption[];
  /** Range given to newly added widgets. */
  defaultRange?: string;
  defaultMode?: EditorMode;
  defaultPaletteOpen?: boolean;
  /** When set the dashboard cannot be edited, and this sentence says why. */
  readOnlyReason?: string;
  cols?: number;
  rowHeight?: number;
  /** `auto` stacks widgets in one column when the canvas is narrower than `stackBelow`. */
  layout?: 'auto' | 'grid' | 'stacked';
  /** Canvas width in pixels under which `auto` stacks the widgets. */
  stackBelow?: number;
};

const isTextEntry = (target: EventTarget): boolean =>
  target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);

/**
 * A dashboard the user arranges: widgets on a 12-column grid that are dragged to move, resized
 * from a corner or an edge, added from a list, duplicated, configured and removed. Other widgets
 * move out of the way and the layout packs upward. Every change is one undo step (Ctrl/⌘+Z), is
 * announced for screen readers, and counts toward the unsaved-changes bar. View mode shows the
 * same dashboard with no handles; narrow canvases stack the widgets in reading order.
 */
export function DashboardEditor({
  title,
  description,
  widgetTypes,
  initialWidgets,
  presets = [],
  sizes,
  ranges,
  defaultRange,
  defaultMode = 'view',
  defaultPaletteOpen = false,
  readOnlyReason,
  cols = 12,
  rowHeight = 72,
  layout = 'auto',
  stackBelow = 560,
}: DashboardEditorProps) {
  const [state, dispatch] = useReducer(editorReducer, { widgets: initialWidgets, cols, mode: readOnlyReason === undefined ? defaultMode : 'view' }, createEditorState);
  const [paletteOpen, setPaletteOpen] = useState(defaultPaletteOpen);
  const [narrow, setNarrow] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = canvasRef.current;
    if (layout !== 'auto' || !node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setNarrow(entry.contentRect.width > 0 && entry.contentRect.width < stackBelow);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [layout, stackBelow]);

  const stacked = layout === 'stacked' || (layout === 'auto' && narrow);
  const editing = state.mode === 'edit' && readOnlyReason === undefined;
  const arranging = editing && !stacked;
  const typeOf = (type: string) => widgetTypes.find((entry) => entry.type === type);

  const addWidget = (type: string) => {
    const widgetType = typeOf(type);
    if (!widgetType) return;
    const { label, w, h, minW, minH } = widgetType;
    dispatch({ type: 'add', widget: { type, title: label, range: defaultRange ?? ranges[0]?.value ?? '', w, h, minW, minH } });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!editing || !(event.ctrlKey || event.metaKey) || isTextEntry(event.target)) return;
    const key = event.key.toLowerCase();
    if (key === 'z' || key === 'y') {
      event.preventDefault();
      dispatch({ type: key === 'y' || event.shiftKey ? 'redo' : 'undo' });
    }
  };

  const counts: Record<string, number> = {};
  for (const widget of state.widgets) counts[widget.type] = (counts[widget.type] ?? 0) + 1;
  const activePreset = presets.find((preset) => preset.widgets.length === state.widgets.length && sameLayout(preset.widgets, state.widgets));

  return (
    <div data-slot="dashboard-editor" data-mode={editing ? 'edit' : 'view'} className="flex h-full w-full min-w-0 flex-col" onKeyDown={onKeyDown}>
      <div className="border-b border-default px-4 py-3">
        <EditorToolbar
          title={title}
          description={description}
          mode={state.mode}
          onModeChange={(mode) => dispatch({ type: 'setMode', mode })}
          canUndo={state.past.length > 0}
          canRedo={state.future.length > 0}
          onUndo={() => dispatch({ type: 'undo' })}
          onRedo={() => dispatch({ type: 'redo' })}
          onReset={() => dispatch({ type: 'replace', widgets: initialWidgets, label: 'the default layout' })}
          paletteOpen={paletteOpen}
          onTogglePalette={() => setPaletteOpen((open) => !open)}
          readOnlyReason={readOnlyReason}
        />
      </div>
      <div className="flex min-h-0 flex-1">
        <div ref={canvasRef} className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto bg-muted-background p-4">
          {editing && stacked ? (
            <p data-slot="stacked-notice" className="text-xs text-medium-foreground">
              Widgets are stacked at this width. Widen the window to move and resize them.
            </p>
          ) : null}
          {arranging ? (
            <p id="dashboard-editor-keys" className="sr-only">
              Arrow keys move the focused widget. Shift and arrow keys resize it. Enter picks it up, Escape cancels, Delete removes it.
            </p>
          ) : null}
          <DashboardCanvas
            label={`${title} dashboard`}
            widgets={stacked ? toSingleColumn(state.widgets) : state.widgets}
            cols={stacked ? 1 : cols}
            rowHeight={rowHeight}
            editing={arranging}
            selectedId={state.selectedId}
            drag={state.drag}
            onAction={dispatch}
            renderWidget={(widget) => typeOf(widget.type)?.render(widget) ?? null}
            renderActions={(widget) => (
              <>
                <WidgetSettingsPopover
                  value={{ title: widget.title, w: widget.w, h: widget.h, range: widget.range }}
                  sizes={sizes}
                  ranges={typeOf(widget.type)?.hasRange ? ranges : undefined}
                  onApply={(patch) => dispatch({ type: 'configure', id: widget.id, patch })}
                />
                <IconAction label={`Duplicate ${widget.title}`} onClick={() => dispatch({ type: 'duplicate', id: widget.id })}>
                  <IconCopy />
                </IconAction>
                <IconAction label={`Remove ${widget.title}`} onClick={() => dispatch({ type: 'remove', id: widget.id })}>
                  <IconTrash />
                </IconAction>
              </>
            )}
            empty={
              <DashboardEmptyState
                description={editing ? undefined : 'Nothing has been added to this dashboard yet.'}
                suggestions={editing ? widgetTypes.slice(0, 3).map(({ type, label }) => ({ type, label })) : []}
                onAdd={addWidget}
                onBrowse={editing ? () => setPaletteOpen(true) : undefined}
              />
            }
          />
        </div>
        {editing && paletteOpen ? (
          <aside aria-label="Add to dashboard" data-slot="editor-palette" className="flex w-72 shrink-0 flex-col border-l border-default">
            <Tabs defaultValue="widgets" className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between gap-2 border-b border-default pr-2 pl-4">
                <TabsList showSeparator={false}>
                  <TabsTrigger value="widgets">
                    <TabsLabel>Widgets</TabsLabel>
                  </TabsTrigger>
                  {presets.length > 0 ? (
                    <TabsTrigger value="layouts">
                      <TabsLabel>Layouts</TabsLabel>
                    </TabsTrigger>
                  ) : null}
                </TabsList>
                <IconAction label="Close widget list" onClick={() => setPaletteOpen(false)}>
                  <IconX />
                </IconAction>
              </div>
              <TabsPanel value="widgets" className="min-h-0 flex-1 overflow-y-auto px-4">
                <WidgetPalette widgets={widgetTypes} counts={counts} onAdd={addWidget} />
              </TabsPanel>
              {presets.length > 0 ? (
                <TabsPanel value="layouts" className="min-h-0 flex-1 overflow-y-auto p-4">
                  <LayoutPresetPicker
                    presets={presets.map((preset) => ({ ...preset, items: preset.widgets }))}
                    activeId={activePreset?.id}
                    cols={cols}
                    onApply={(id) => {
                      const preset = presets.find((entry) => entry.id === id);
                      if (preset) dispatch({ type: 'replace', widgets: preset.widgets, label: `the ${preset.name} layout` });
                    }}
                  />
                </TabsPanel>
              ) : null}
            </Tabs>
          </aside>
        ) : null}
      </div>
      {editing && isDirty(state) ? (
        <div className="border-t border-default p-2">
          <SaveBar dirtyCount={Math.max(1, Math.abs(state.changes))} onSave={() => dispatch({ type: 'save' })} onDiscard={() => dispatch({ type: 'discard' })} saveLabel="Save dashboard" />
        </div>
      ) : null}
      <div role="status" aria-live="polite" className="sr-only">
        {state.announcement}
      </div>
    </div>
  );
}
