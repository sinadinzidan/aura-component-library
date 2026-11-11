import { Button } from '@cognite/aura/components/button';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconLink } from '@cognite/aura/icons';
import { useId, useState } from 'react';
import type { FormEvent } from 'react';

import { isSafeUrl } from './formatting';
import type { LinkInput } from './formatting';

type LinkPopoverProps = {
  /** Name and tooltip of the icon button that opens the popover. */
  label?: string;
  /** Shown after the label in the tooltip, for example `Ctrl+K`. */
  shortcut?: string;
  disabled?: boolean;
  /** For roving focus inside a toolbar. */
  tabIndex?: number;
  /** The selected text, offered as the link text. */
  selectedText?: string;
  /** Called with the text and address once the address is valid. */
  onInsert: (link: LinkInput) => void;
  /** Controlled open state, so a shortcut can open it too. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * An icon button that opens a small form for inserting a link: text and address, checked before
 * anything is written. Only `https:` and `mailto:` addresses are accepted.
 */
export function LinkPopover({ label = 'Insert link', shortcut, disabled = false, tabIndex, selectedText = '', onInsert, open, onOpenChange }: LinkPopoverProps) {
  const id = useId();
  const [ownOpen, setOwnOpen] = useState(false);
  const [text, setText] = useState(selectedText);
  const [url, setUrl] = useState('');
  const [checked, setChecked] = useState(false);
  const isOpen = open ?? ownOpen;
  const invalid = checked && !isSafeUrl(url);

  const changeOpen = (next: boolean) => {
    if (next) {
      // Every opening starts from the current selection, never from an abandoned draft.
      setText(selectedText);
      setUrl('');
      setChecked(false);
    }
    setOwnOpen(next);
    onOpenChange?.(next);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setChecked(true);
    if (!isSafeUrl(url)) return;
    onInsert({ text, url: url.trim() });
    changeOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={changeOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button type="button" variant={isOpen ? 'secondary' : 'ghost'} size="icon-sm" aria-label={label} disabled={disabled} tabIndex={tabIndex} data-tool="">
                  <IconLink />
                </Button>
              }
            />
          }
        />
        <TooltipContent>
          {label}
          {shortcut ? <span className="pl-2 opacity-70">{shortcut}</span> : null}
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>Insert link</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
        </PopoverHeader>
        <PopoverSlot>
          <form className="flex w-full flex-col gap-3" onSubmit={submit} noValidate>
            <div className="flex flex-col">
              <Label htmlFor={`${id}-text`}>Text</Label>
              <Input id={`${id}-text`} value={text} placeholder="Shown in the note" onChange={(event) => setText(event.target.value)} />
            </div>
            <div className="flex flex-col">
              <Label htmlFor={`${id}-url`} required>
                Address
              </Label>
              <Input
                id={`${id}-url`}
                type="url"
                inputMode="url"
                value={url}
                placeholder="https://"
                aria-invalid={invalid}
                aria-describedby={`${id}-help`}
                onChange={(event) => setUrl(event.target.value)}
              />
              <HelperText id={`${id}-help`} isError={invalid}>
                {invalid ? 'Enter a full address that starts with https://' : 'Starts with https://'}
              </HelperText>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                Insert link
              </Button>
            </div>
          </form>
        </PopoverSlot>
      </PopoverContent>
    </Popover>
  );
}
