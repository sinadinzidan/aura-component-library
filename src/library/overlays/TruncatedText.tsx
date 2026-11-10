import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { useRef, useState } from 'react';

type TruncatedTextProps = {
  /** The full text. Shown on one line and cut with an ellipsis when it does not fit. */
  text: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Decides whether the element is cut off. Injectable so it can be tested without layout. */
  isTruncated?: (element: HTMLElement) => boolean;
};

function overflowsWidth(element: HTMLElement): boolean {
  return element.scrollWidth > element.clientWidth;
}

/**
 * One line of text that shows its full value in a Tooltip only while it is actually cut off, so
 * text that fits never gets a tooltip repeating what is already visible.
 */
export function TruncatedText({ text, side = 'top', isTruncated = overflowsWidth }: TruncatedTextProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  const changeOpen = (next: boolean) => {
    const element = elementRef.current;
    setOpen(next && element !== null && isTruncated(element));
  };

  return (
    <Tooltip open={open} onOpenChange={changeOpen}>
      <TooltipTrigger render={<span ref={elementRef} tabIndex={0} className="block min-w-0 truncate rounded-sm" />}>
        {text}
      </TooltipTrigger>
      <TooltipContent side={side}>
        <span className="max-w-72 whitespace-normal break-words">{text}</span>
      </TooltipContent>
    </Tooltip>
  );
}
