import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@cognite/aura/components/collapsible';
import { Reasoning, ReasoningContent, ReasoningHeader, ReasoningItem } from '@cognite/aura/components/reasoning';
import { Shimmer } from '@cognite/aura/components/shimmer';
import { IconChevronDown } from '@cognite/aura/icons';
import { useState } from 'react';

type ReasoningDisclosureProps = {
  /** One entry per reasoning step, in the order the model produced them. */
  steps: readonly string[];
  /** `streaming` keeps the panel open and shimmers the header until the model is done. */
  status?: 'streaming' | 'done';
  /** Shown in the header once done: "Thought for 8 s". */
  durationSeconds?: number;
  defaultOpen?: boolean;
  /** Header text while streaming. */
  streamingLabel?: string;
  /** Overrides the header text once done. */
  label?: string;
};

function doneLabel(durationSeconds: number | undefined, stepCount: number): string {
  if (durationSeconds !== undefined) return `Thought for ${durationSeconds} s`;
  return stepCount === 1 ? 'Reasoning · 1 step' : `Reasoning · ${stepCount} steps`;
}

/**
 * Aura's Reasoning made collapsible: closed by default once the answer is in, open while the
 * model is still thinking. The reader can always open it to see how the answer was reached.
 */
export function ReasoningDisclosure({
  steps,
  status = 'done',
  durationSeconds,
  defaultOpen = false,
  streamingLabel = 'Thinking…',
  label,
}: ReasoningDisclosureProps) {
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const streaming = status === 'streaming';
  const open = userOpen ?? (streaming || defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setUserOpen}>
      <Reasoning>
        <CollapsibleTrigger className="w-fit gap-2">
          <ReasoningHeader>
            {streaming ? <Shimmer as="span">{streamingLabel}</Shimmer> : <span>{label ?? doneLabel(durationSeconds, steps.length)}</span>}
          </ReasoningHeader>
          <IconChevronDown
            aria-hidden
            className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pl-3">
            <ReasoningContent>
              {steps.map((step) => (
                <ReasoningItem key={step}>
                  <p className="py-2.5 text-sm leading-5 text-medium-foreground">{step}</p>
                </ReasoningItem>
              ))}
            </ReasoningContent>
          </div>
        </CollapsibleContent>
      </Reasoning>
    </Collapsible>
  );
}
