import { Button } from '@cognite/aura/components/button';
import { IconCircleCheck } from '@cognite/aura/icons';
import { useState } from 'react';

export type HelpfulAnswer = { helpful: boolean; reason?: string };

type HelpfulPromptProps = {
  question?: string;
  /** Follow-up choices after "No". Leave out to finish on the first answer. */
  reasons?: readonly string[];
  /** The line above the follow-up choices. */
  reasonQuestion?: string;
  /** Called once, when the answer is complete. */
  onSubmit: (answer: HelpfulAnswer) => void;
  thanksText?: string;
  yesLabel?: string;
  noLabel?: string;
};

type Step = 'ask' | 'reason' | 'done';

/**
 * The one-line "Was this helpful?" under an article, an answer or a suggestion. "Yes" finishes
 * at once; "No" asks for one reason, which can be skipped, and only then reports. The prompt
 * ends on a thank-you in the same place, so it never asks twice.
 */
export function HelpfulPrompt({
  question = 'Was this helpful?',
  reasons,
  reasonQuestion = 'What was missing?',
  onSubmit,
  thanksText = 'Thanks for the feedback.',
  yesLabel = 'Yes',
  noLabel = 'No',
}: HelpfulPromptProps) {
  const [step, setStep] = useState<Step>('ask');

  const finish = (answer: HelpfulAnswer) => {
    onSubmit(answer);
    setStep('done');
  };

  const answerNo = () => {
    if (reasons && reasons.length > 0) setStep('reason');
    else finish({ helpful: false });
  };

  return (
    <div data-slot="helpful-prompt" data-step={step} className="flex w-full min-w-0 flex-col gap-2 text-sm">
      {step === 'ask' ? (
        <div className="flex min-h-7 flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-medium-foreground">{question}</span>
          <span className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => finish({ helpful: true })}>
              {yesLabel}
            </Button>
            <Button variant="outline" size="sm" onClick={answerNo}>
              {noLabel}
            </Button>
          </span>
        </div>
      ) : null}
      {step === 'reason' && reasons ? (
        <div role="group" aria-label={reasonQuestion} className="flex flex-col gap-2">
          <span className="text-medium-foreground">{reasonQuestion}</span>
          <div className="flex flex-wrap items-center gap-2">
            {reasons.map((reason) => (
              <Button key={reason} variant="outline" size="sm" onClick={() => finish({ helpful: false, reason })}>
                {reason}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => finish({ helpful: false })}>
              Skip
            </Button>
          </div>
        </div>
      ) : null}
      <p role="status" className={step === 'done' ? 'flex min-h-7 items-center gap-1.5 text-medium-foreground' : 'sr-only'}>
        {step === 'done' ? (
          <>
            <IconCircleCheck aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            {thanksText}
          </>
        ) : null}
      </p>
    </div>
  );
}
