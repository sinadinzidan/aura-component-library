import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import type { ReactNode } from 'react';

type GlossaryTermProps = {
  /** The term as it appears in the sentence. */
  children: string;
  /** One or two plain sentences. No interactive content. */
  definition: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
};

/**
 * A domain term inside running text that explains itself: a dotted underline marks it, and the
 * definition shows on hover and on keyboard focus. For jargon a new reader will not know; link to
 * the glossary instead when the explanation needs more than two sentences.
 */
export function GlossaryTerm({ children, definition, side = 'top' }: GlossaryTermProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            data-slot="glossary-term"
            className="cursor-help rounded-sm underline decoration-dotted decoration-1 underline-offset-4 outline-none focus-visible:shadow-focus-ring"
          >
            {children}
          </button>
        }
      />
      <TooltipContent side={side}>
        <span className="max-w-64 whitespace-normal">{definition}</span>
      </TooltipContent>
    </Tooltip>
  );
}
