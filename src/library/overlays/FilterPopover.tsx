import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  CheckboxGroup,
  CheckboxItem,
  CheckboxItemControl,
  CheckboxItemLabel,
} from '@cognite/aura/components/checkbox';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverHeaderContent,
  PopoverSlot,
  PopoverTitle,
  PopoverTrigger,
} from '@cognite/aura/components/popover';
import { IconFilter } from '@cognite/aura/icons';
import { useId, useState } from 'react';

export type FilterOption = { id: string; label: string };

export type FilterGroup = { id: string; label: string; options: readonly FilterOption[] };

/** Selected option ids per group id. A missing group means nothing is selected in it. */
export type FilterValue = Readonly<Record<string, readonly string[]>>;

type FilterPopoverProps = {
  groups: readonly FilterGroup[];
  /** The filters currently applied to the view. */
  value: FilterValue;
  /** Called with the edited selection when the user applies it. */
  onApply: (value: Record<string, string[]>) => void;
  /** Trigger label and popover title. */
  label?: string;
  applyLabel?: string;
  clearLabel?: string;
  align?: 'start' | 'center' | 'end';
};

function countSelected(value: FilterValue): number {
  return Object.values(value).reduce((total, ids) => total + ids.length, 0);
}

function copyValue(groups: readonly FilterGroup[], value: FilterValue): Record<string, string[]> {
  const copy: Record<string, string[]> = {};
  for (const group of groups) {
    copy[group.id] = [...(value[group.id] ?? [])];
  }
  return copy;
}

/**
 * A filter button that opens grouped checkboxes in a Popover. Edits are a draft until the user
 * applies them, closing without applying discards the draft, and the trigger shows how many
 * filters are active.
 */
export function FilterPopover({
  groups,
  value,
  onApply,
  label = 'Filters',
  applyLabel = 'Apply filters',
  clearLabel = 'Clear all',
  align = 'start',
}: FilterPopoverProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string[]>>(() => copyValue(groups, value));

  const applied = countSelected(value);
  const drafted = countSelected(draft);

  const changeOpen = (next: boolean) => {
    // Every opening starts from what is applied, so an abandoned draft never comes back.
    if (next) setDraft(copyValue(groups, value));
    setOpen(next);
  };

  const toggle = (groupId: string, optionId: string, checked: boolean) => {
    setDraft((current) => {
      const selected = current[groupId] ?? [];
      const next = checked ? [...selected, optionId] : selected.filter((item) => item !== optionId);
      return { ...current, [groupId]: next };
    });
  };

  const apply = () => {
    onApply(copyValue(groups, draft));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <IconFilter /> {label}
            {applied > 0 ? <Badge variant="secondary">{applied}</Badge> : null}
          </Button>
        }
      />
      <PopoverContent align={align}>
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>{label}</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
        </PopoverHeader>
        <PopoverSlot>
          {groups.map((group) => {
            const groupLabelId = `${id}-${group.id}`;
            const selected = draft[group.id] ?? [];
            return (
              <div key={group.id} className="flex w-full flex-col">
                <span id={groupLabelId} className="pb-1 text-xs font-medium text-muted-foreground">
                  {group.label}
                </span>
                <CheckboxGroup aria-labelledby={groupLabelId}>
                  {group.options.map((option) => (
                    <CheckboxItem key={option.id}>
                      <CheckboxItemControl
                        checked={selected.includes(option.id)}
                        onCheckedChange={(checked) => toggle(group.id, option.id, checked)}
                      />
                      <CheckboxItemLabel>{option.label}</CheckboxItemLabel>
                    </CheckboxItem>
                  ))}
                </CheckboxGroup>
              </div>
            );
          })}
          <div className="flex w-full items-center justify-between gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={drafted === 0}
              onClick={() => setDraft(copyValue(groups, {}))}
            >
              {clearLabel}
            </Button>
            <Button size="sm" onClick={apply}>
              {applyLabel}
            </Button>
          </div>
        </PopoverSlot>
      </PopoverContent>
    </Popover>
  );
}
