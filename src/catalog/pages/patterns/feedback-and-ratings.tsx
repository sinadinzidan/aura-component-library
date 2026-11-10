import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardHeaderCenter,
  CardHeaderEnd,
  CardTitle,
} from '@cognite/aura/components/card';
import { CheckboxItem, CheckboxItemControl, CheckboxItemDescription, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@cognite/aura/components/dialog';
import { Label } from '@cognite/aura/components/label';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverHeaderContent,
  PopoverSlot,
  PopoverTitle,
  PopoverTrigger,
} from '@cognite/aura/components/popover';
import { RadioGroup, RadioGroupItem, RadioGroupItemControl, RadioGroupItemLabel } from '@cognite/aura/components/radio-group';
import { Textarea } from '@cognite/aura/components/textarea';
import { IconBulb, IconCircleCheck, IconFlag, IconThumbDown, IconThumbUp, IconX } from '@cognite/aura/icons';
import { useId, useState } from 'react';

import { CopyButton } from '../../../library/actions/CopyButton';
import { ToggleGroup } from '../../../library/actions/ToggleGroup';
import { ResponseActions } from '../../../library/ai/ResponseActions';
import type { ResponseFeedback } from '../../../library/ai/ResponseActions';
import { CharacterCountTextarea } from '../../../library/forms/CharacterCountTextarea';
import { FormField } from '../../../library/forms/FormField';
import { HelpfulPrompt } from '../../../library/patterns/collaboration/HelpfulPrompt';
import type { HelpfulAnswer } from '../../../library/patterns/collaboration/HelpfulPrompt';
import { RatingDistribution } from '../../../library/patterns/collaboration/RatingDistribution';
import { RatingScale } from '../../../library/patterns/collaboration/RatingScale';
import { netPromoterScore } from '../../../library/patterns/collaboration/ratingSummary';
import { BreakdownList } from '../../../library/patterns/collections/BreakdownList';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { FormActions } from '../../../library/patterns/data-entry/FormActions';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { SENSORS } from '../../data/plant';
import { definePage } from '../../types';

import source from './feedback-and-ratings.tsx?raw';

const FEEDBACK_RATING_SENSOR = SENSORS[8];

const FEEDBACK_RATING_WORDS: Readonly<Record<number, string>> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
};

const FEEDBACK_RATING_COUNTS = [
  { score: 5, count: 48 },
  { score: 4, count: 71 },
  { score: 3, count: 22 },
  { score: 2, count: 9 },
  { score: 1, count: 4 },
];

const FEEDBACK_RATING_NPS = [
  { score: 10, count: 21 },
  { score: 9, count: 26 },
  { score: 8, count: 31 },
  { score: 7, count: 14 },
  { score: 6, count: 8 },
  { score: 5, count: 6 },
  { score: 3, count: 4 },
  { score: 0, count: 2 },
];

const FEEDBACK_RATING_CATEGORIES = [
  { value: 'bug', label: 'Something is broken' },
  { value: 'data', label: 'Data looks wrong' },
  { value: 'idea', label: 'Idea or request' },
  { value: 'other', label: 'Something else' },
];

const FEEDBACK_RATING_THUMBS = [
  { value: 'up', label: 'Helpful', icon: <IconThumbUp /> },
  { value: 'down', label: 'Not helpful', icon: <IconThumbDown /> },
];

const FEEDBACK_RATING_ANSWER =
  'The recompressor tripped at 13:46 because drive-end vibration reached 11.6 mm/s, above the 11.0 mm/s trip limit. Vibration had been above the high limit since 13:31.';

function FeedbackRatingConfirmation({ title, children }: { title: string; children?: string }) {
  return (
    <div role="status" className="flex items-start gap-2">
      <IconCircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success-foreground-strong" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-base-foreground">{title}</span>
        {children ? <span className="text-sm text-muted-foreground">{children}</span> : null}
      </div>
    </div>
  );
}

function FeedbackRatingThumbs() {
  const [value, setValue] = useState<string[]>([]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-medium-foreground">Rate this suggestion</span>
      <ToggleGroup label="Rate this suggestion" options={FEEDBACK_RATING_THUMBS} value={value} onValueChange={setValue} selection="single" iconOnly size="sm" />
    </div>
  );
}

function FeedbackRatingHelpful() {
  return <HelpfulPrompt onSubmit={() => undefined} />;
}

function FeedbackRatingSent() {
  return (
    <FeedbackRatingConfirmation title="Feedback sent">
      The Nordkapp product team reads every message. You get a reply if you asked a question.
    </FeedbackRatingConfirmation>
  );
}

function FeedbackRatingThumbsReason() {
  const [value, setValue] = useState<string[]>(['down']);
  const [reason, setReason] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const noteId = useId();

  const choose = (next: string[]) => {
    setValue(next);
    setReason([]);
    setSent(false);
  };

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-medium-foreground">Suggested cause: rotor unbalance after the last overhaul</span>
        <ToggleGroup label="Rate this suggested cause" options={FEEDBACK_RATING_THUMBS} value={value} onValueChange={choose} selection="single" iconOnly size="sm" />
      </div>
      {value[0] === 'down' && !sent ? (
        <div className="flex flex-col gap-3 rounded-lg bg-muted-background p-3">
          <span className="text-sm font-medium text-base-foreground">What was wrong with it?</span>
          <ToggleGroup
            label="Reason"
            selection="single"
            variant="outline"
            size="sm"
            value={reason}
            onValueChange={setReason}
            options={[
              { value: 'wrong', label: 'Wrong cause' },
              { value: 'obvious', label: 'Already known' },
              { value: 'evidence', label: 'No evidence shown' },
            ]}
          />
          <div>
            <Label htmlFor={noteId}>Anything to add (optional)</Label>
            <Textarea id={noteId} rows={2} placeholder="The bearing was replaced, not the rotor" />
          </div>
          <div className="flex justify-end">
            <Button size="sm" disabled={reason.length === 0} onClick={() => setSent(true)}>
              Send feedback
            </Button>
          </div>
        </div>
      ) : null}
      {sent ? <FeedbackRatingConfirmation title="Thanks. This suggestion is ranked lower for similar trips." /> : null}
      {value[0] === 'up' ? <FeedbackRatingConfirmation title="Thanks. Marked as helpful." /> : null}
    </div>
  );
}

function FeedbackRatingHelpfulReasons() {
  const [answer, setAnswer] = useState<HelpfulAnswer | null>(null);

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-medium text-base-foreground">Resetting a trip on the recompressor</h4>
        <p className="text-sm text-medium-foreground">
          Confirm the cause is cleared, check that the lock-out is removed, then reset from the local panel before the
          control room start.
        </p>
      </div>
      <div className="border-t border-default pt-3">
        <HelpfulPrompt
          question="Did this procedure help?"
          reasons={['Out of date', 'Hard to follow', 'Does not match the equipment']}
          onSubmit={setAnswer}
        />
      </div>
      <p className="min-h-4 text-xs text-muted-foreground">
        {answer ? `Recorded: ${answer.helpful ? 'helpful' : `not helpful${answer.reason ? `, ${answer.reason.toLowerCase()}` : ''}`}` : ''}
      </p>
    </div>
  );
}

function FeedbackRatingRadio() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <span className="text-sm font-medium text-base-foreground">How would you rate the shift handover report?</span>
      <RadioGroup defaultValue="4" aria-label="How would you rate the shift handover report?">
        {[5, 4, 3, 2, 1].map((score) => (
          <RadioGroupItem key={score}>
            <RadioGroupItemControl value={String(score)} />
            <RadioGroupItemLabel>
              <span className="tabular-nums">{score}</span> · {FEEDBACK_RATING_WORDS[score]}
            </RadioGroupItemLabel>
          </RadioGroupItem>
        ))}
      </RadioGroup>
    </div>
  );
}

function FeedbackRatingScore() {
  const [value, setValue] = useState<number | null>(4);

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <span className="text-sm font-medium text-base-foreground">How useful was the vibration dashboard today?</span>
      <RatingScale
        label="How useful was the vibration dashboard today?"
        value={value}
        onValueChange={setValue}
        lowLabel="Not useful"
        highLabel="Essential"
        optionLabels={FEEDBACK_RATING_WORDS}
      />
    </div>
  );
}

function FeedbackRatingNps() {
  const [value, setValue] = useState<number | null>(null);

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <span className="text-sm font-medium text-base-foreground">How likely are you to recommend the mobile rounds app to a colleague?</span>
      <RatingScale
        label="How likely are you to recommend the mobile rounds app to a colleague?"
        min={0}
        max={10}
        value={value}
        onValueChange={setValue}
        lowLabel="Not at all likely"
        highLabel="Extremely likely"
      />
    </div>
  );
}

function FeedbackRatingAgreement() {
  const options = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <span className="text-sm font-medium text-base-foreground">The alarm list shows me what to act on first.</span>
      <RadioGroup orientation="horizontal" aria-label="The alarm list shows me what to act on first." className="flex-wrap gap-x-5 gap-y-2">
        {options.map((option) => (
          <RadioGroupItem key={option}>
            <RadioGroupItemControl value={option} />
            <RadioGroupItemLabel>{option}</RadioGroupItemLabel>
          </RadioGroupItem>
        ))}
      </RadioGroup>
    </div>
  );
}

function FeedbackRatingLowFollowUp() {
  const [value, setValue] = useState<number | null>(2);
  const noteId = useId();

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <span className="text-sm font-medium text-base-foreground">How easy was it to close out the work order?</span>
      <RatingScale label="How easy was it to close out the work order?" value={value} onValueChange={setValue} lowLabel="Very hard" highLabel="Very easy" />
      {value !== null && value <= 2 ? (
        <div>
          <Label htmlFor={noteId}>What made it hard?</Label>
          <Textarea id={noteId} rows={2} placeholder="The sign-off step did not accept my reading" />
        </div>
      ) : null}
    </div>
  );
}

function FeedbackRatingSummary() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <SectionHeader title="Shift handover report" description="Ratings from operators, last 90 days" size="sm" as="h4" />
      <RatingDistribution label="Ratings for the shift handover report" counts={FEEDBACK_RATING_COUNTS} />
    </div>
  );
}

function FeedbackRatingForm() {
  const [category, setCategory] = useState('data');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex w-full max-w-lg flex-col gap-3">
        <FeedbackRatingConfirmation title="Feedback sent">Thanks. Diagnostics were included with your message.</FeedbackRatingConfirmation>
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSent(false);
              setMessage('');
            }}
          >
            Send more feedback
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex w-full max-w-lg flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <FormField label="Category">
        {(control) => <OptionSelect id={control.id} value={category} onValueChange={setCategory} options={FEEDBACK_RATING_CATEGORIES} />}
      </FormField>
      <FormField label="Message" required>
        {(control) => (
          <CharacterCountTextarea
            id={control.id}
            rows={4}
            value={message}
            onValueChange={setMessage}
            maxLength={500}
            placeholder="What happened, and what did you expect?"
            helper="Do not include passwords or personal data."
          />
        )}
      </FormField>
      <CheckboxItem>
        <CheckboxItemControl defaultChecked />
        <CheckboxItemLabel>Include diagnostics</CheckboxItemLabel>
        <CheckboxItemDescription>Browser, page and your last 20 actions. No process values.</CheckboxItemDescription>
      </CheckboxItem>
      <FormActions>
        <Button type="submit" disabled={message.trim() === ''}>
          Send feedback
        </Button>
      </FormActions>
    </form>
  );
}

function FeedbackRatingBugReference() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <FeedbackRatingConfirmation title="Problem reported">
        Trend chart stops updating after the tab has been in the background.
      </FeedbackRatingConfirmation>
      <div className="flex items-center justify-between gap-3 rounded-lg bg-muted-background py-2 pr-2 pl-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-xs text-muted-foreground">Reference</span>
          <span className="font-mono text-sm text-base-foreground">FB-20931</span>
        </div>
        <CopyButton variant="ghost" size="sm" text="FB-20931" label="Copy reference" />
      </div>
      <p className="text-sm text-muted-foreground">
        Quote the reference if you contact support. Status changes are sent to your notifications.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          View report
        </Button>
        <Button variant="ghost" size="sm">
          Report another problem
        </Button>
      </div>
    </div>
  );
}

function FeedbackRatingReportDialog() {
  const descriptionId = useId();

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline">
            <IconFlag /> Report a problem
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a problem</DialogTitle>
          <DialogDescription>Goes to the product team with a link to this page: Gas compression dashboard.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <FormField label="What kind of problem">
            {(control) => <OptionSelect id={control.id} defaultValue="bug" options={FEEDBACK_RATING_CATEGORIES} />}
          </FormField>
          <div>
            <Label htmlFor={descriptionId}>What happened</Label>
            <Textarea id={descriptionId} rows={4} placeholder="What you did, what you saw, and what you expected" />
          </div>
          <CheckboxItem>
            <CheckboxItemControl defaultChecked />
            <CheckboxItemLabel>Include a screenshot of this page</CheckboxItemLabel>
          </CheckboxItem>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <DialogClose render={<Button>Send report</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FeedbackRatingBadData() {
  const [open, setOpen] = useState(false);
  const [flagged, setFlagged] = useState(false);

  return (
    <div className="flex w-full flex-col gap-2">
      <span className="text-xs text-muted-foreground">
        {FEEDBACK_RATING_SENSOR.name} · <span className="font-mono">{FEEDBACK_RATING_SENSOR.tag}</span>
      </span>
      <div className="flex items-center justify-between gap-3">
        <span className="text-2xl font-semibold tabular-nums text-base-foreground">
          {FEEDBACK_RATING_SENSOR.value.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">{FEEDBACK_RATING_SENSOR.unit}</span>
        </span>
        {flagged ? (
          <Badge variant="warning">
            <IconFlag aria-hidden="true" />
            Flagged by you
          </Badge>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
                <Button variant="ghost" size="sm">
                  <IconFlag /> Report bad data
                </Button>
              }
            />
            <PopoverContent align="end" className="w-72">
              <PopoverHeader>
                <PopoverHeaderContent>
                  <PopoverTitle>Report bad data</PopoverTitle>
                  <PopoverClose />
                </PopoverHeaderContent>
                <PopoverDescription>The data owner for gas compression is notified.</PopoverDescription>
              </PopoverHeader>
              <PopoverSlot>
                <div className="flex w-full flex-col gap-3">
                  <RadioGroup defaultValue="frozen" aria-label="What is wrong with the value">
                    <RadioGroupItem>
                      <RadioGroupItemControl value="frozen" />
                      <RadioGroupItemLabel>Value is frozen</RadioGroupItemLabel>
                    </RadioGroupItem>
                    <RadioGroupItem>
                      <RadioGroupItemControl value="range" />
                      <RadioGroupItemLabel>Outside the physical range</RadioGroupItemLabel>
                    </RadioGroupItem>
                    <RadioGroupItem>
                      <RadioGroupItemControl value="unit" />
                      <RadioGroupItemLabel>Wrong unit or scaling</RadioGroupItemLabel>
                    </RadioGroupItem>
                  </RadioGroup>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setFlagged(true);
                      setOpen(false);
                    }}
                  >
                    Send report
                  </Button>
                </div>
              </PopoverSlot>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {flagged ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Reported 14:00 · The value stays visible until it is reviewed.</span>
          <Button variant="ghost" size="sm" onClick={() => setFlagged(false)}>
            Undo
          </Button>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">Quality: uncertain since 13:05</span>
      )}
    </div>
  );
}

function FeedbackRatingSuggestion() {
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle as="h4" className="flex items-center gap-2">
            <IconBulb aria-hidden="true" className="size-4" />
            Suggest an improvement
          </CardTitle>
          <CardDescription>What would make rounds faster?</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        {sent ? (
          <FeedbackRatingConfirmation title="Suggestion sent">It joins 14 others for the rounds app.</FeedbackRatingConfirmation>
        ) : (
          <Textarea aria-label="Your suggestion" rows={3} value={text} onChange={(event) => setText(event.target.value)} placeholder="Let me scan the tag instead of typing it" className="w-full" />
        )}
      </CardContent>
      <CardFooter>
        {sent ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSent(false);
              setText('');
            }}
          >
            Add another
          </Button>
        ) : (
          <Button size="sm" disabled={text.trim() === ''} onClick={() => setSent(true)}>
            Send suggestion
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function FeedbackRatingAiAnswer() {
  const [feedback, setFeedback] = useState<ResponseFeedback | null>(null);
  const [reason, setReason] = useState<string[]>([]);

  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <p className="text-sm leading-6 text-base-foreground">{FEEDBACK_RATING_ANSWER}</p>
      <ResponseActions
        text={FEEDBACK_RATING_ANSWER}
        onRegenerate={() => undefined}
        onFeedback={(next) => {
          setFeedback(next);
          setReason([]);
        }}
      />
      <div className="min-h-9" aria-live="polite">
        {feedback === 'down' ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-medium-foreground">What was wrong?</span>
            <ToggleGroup
              label="What was wrong with the answer"
              selection="single"
              variant="outline"
              size="sm"
              value={reason}
              onValueChange={setReason}
              options={[
                { value: 'incorrect', label: 'Incorrect' },
                { value: 'vague', label: 'Too vague' },
                { value: 'source', label: 'Wrong source' },
              ]}
            />
          </div>
        ) : null}
        {feedback === 'up' ? <span className="text-sm text-muted-foreground">Thanks. Marked as a good answer.</span> : null}
      </div>
    </div>
  );
}

function FeedbackRatingSurvey() {
  const [state, setState] = useState<'open' | 'dismissed' | 'sent'>('open');
  const [value, setValue] = useState<number | null>(null);

  if (state !== 'open') {
    return (
      <div className="flex w-full max-w-lg flex-col gap-3">
        {state === 'sent' ? (
          <FeedbackRatingConfirmation title="Answer sent">Thanks. The survey will not be shown again this quarter.</FeedbackRatingConfirmation>
        ) : (
          <p className="text-sm text-muted-foreground" role="status">
            Survey hidden. It will not be shown again this quarter.
          </p>
        )}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setState('open');
              setValue(null);
            }}
          >
            Show the survey again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle as="h4">One question about alarm handling</CardTitle>
          <CardDescription>Takes 10 seconds. Answers are anonymous.</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <IconAction label="Dismiss survey" onClick={() => setState('dismissed')}>
            <IconX />
          </IconAction>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <div className="flex w-full flex-col gap-3">
          <span className="text-sm text-base-foreground">How easy is it to see which alarm to act on first?</span>
          <RatingScale label="How easy is it to see which alarm to act on first?" value={value} onValueChange={setValue} lowLabel="Very hard" highLabel="Very easy" />
        </div>
      </CardContent>
      <CardFooter>
        <Button size="sm" disabled={value === null} onClick={() => setState('sent')}>
          Send answer
        </Button>
      </CardFooter>
    </Card>
  );
}

function FeedbackRatingNpsSummary() {
  const score = netPromoterScore(FEEDBACK_RATING_NPS);
  const sum = (from: number, to: number) =>
    FEEDBACK_RATING_NPS.filter((entry) => entry.score >= from && entry.score <= to).reduce((total, entry) => total + entry.count, 0);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Recommendation score · mobile rounds app</span>
        <span className="text-3xl font-semibold tabular-nums text-base-foreground">{score === null ? '—' : score > 0 ? `+${score}` : score}</span>
        <span className="text-xs tabular-nums text-muted-foreground">112 answers · scale −100 to +100</span>
      </div>
      <BreakdownList
        label="Answers by group"
        scale="total"
        showShare
        items={[
          { id: 'promoters', label: 'Promoters', detail: '9–10', value: sum(9, 10) },
          { id: 'passives', label: 'Passives', detail: '7–8', value: sum(7, 8) },
          { id: 'detractors', label: 'Detractors', detail: '0–6', value: sum(0, 6) },
        ]}
      />
    </div>
  );
}

function FeedbackRatingAlreadyRated() {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<number | null>(4);

  return (
    <div className="flex w-full flex-col gap-3">
      <span className="text-sm font-medium text-base-foreground">Your rating of the handover report</span>
      <RatingScale
        label="Your rating of the handover report"
        value={value}
        onValueChange={(next) => {
          setValue(next);
          setEditing(false);
        }}
        disabled={!editing}
      />
      <div className="flex min-h-7 items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {editing ? 'Pick a new score.' : `You rated it ${value ?? '—'} of 5 on 3 Mar.`}
        </span>
        {editing ? null : (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Change rating
          </Button>
        )}
      </div>
    </div>
  );
}

function FeedbackRatingSummaryEmpty() {
  return (
    <div className="flex w-full flex-col gap-4">
      <RatingDistribution
        label="Ratings for the flare monitoring view"
        counts={[5, 4, 3, 2, 1].map((score) => ({ score, count: 0 }))}
      />
      <p className="text-xs text-muted-foreground">Ratings appear once the view has been used for a shift.</p>
    </div>
  );
}

function FeedbackRatingFlow() {
  const [value, setValue] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  const commentId = useId();

  return (
    <div className="flex w-full max-w-lg flex-col gap-5 rounded-xl border border-default p-4">
      <SectionHeader title="Work order closed" overline="WO-104440" description="Calibrate separator level transmitter" size="md" as="h4" />
      {sent ? (
        <div className="flex flex-col gap-3">
          <FeedbackRatingConfirmation title="Feedback sent">
            {`You rated the close-out ${value ?? ''} of 5. Thanks for taking the time.`}
          </FeedbackRatingConfirmation>
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSent(false);
                setValue(null);
                setComment('');
              }}
            >
              Reset example
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-base-foreground">How did the close-out go?</span>
            <RatingScale label="How did the close-out go?" value={value} onValueChange={setValue} lowLabel="Painful" highLabel="Smooth" optionLabels={FEEDBACK_RATING_WORDS} />
          </div>
          <div>
            <Label htmlFor={commentId}>{value !== null && value <= 2 ? 'What got in the way?' : 'Anything we should know (optional)'}</Label>
            <Textarea id={commentId} rows={3} value={comment} onChange={(event) => setComment(event.target.value)} />
          </div>
          <FormActions status={<span className="text-xs text-muted-foreground">Shared with the maintenance planners.</span>}>
            <Button variant="ghost">Skip</Button>
            <Button disabled={value === null || (value <= 2 && comment.trim() === '')} onClick={() => setSent(true)}>
              Send feedback
            </Button>
          </FormActions>
        </>
      )}
    </div>
  );
}

function FeedbackRatingResults() {
  const comments = [
    { id: 'a', score: 5, text: 'Handover took 5 minutes instead of 20.', when: '11 Mar' },
    { id: 'b', score: 2, text: 'Shelved alarms are missing from the summary.', when: '9 Mar' },
    { id: 'c', score: 4, text: 'Good, but I need the open permits on the first page.', when: '6 Mar' },
  ];

  return (
    <div className="flex w-full max-w-lg flex-col gap-5 rounded-xl border border-default p-4">
      <SectionHeader title="What operators say" description="Shift handover report · last 90 days" size="md" as="h3" />
      <RatingDistribution label="Ratings for the shift handover report" counts={FEEDBACK_RATING_COUNTS} scoreLabels={FEEDBACK_RATING_WORDS} />
      <div className="flex flex-col gap-1">
        <SectionHeader title="Latest comments" count={comments.length} size="sm" as="h4" />
        <ul className="flex flex-col">
          {comments.map((comment) => (
            <li key={comment.id} className="flex items-baseline gap-3 py-2 text-sm">
              <span className="w-12 shrink-0 whitespace-nowrap tabular-nums text-muted-foreground">{comment.score} of 5</span>
              <span className="min-w-0 flex-1 text-base-foreground">{comment.text}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{comment.when}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default definePage({
  id: 'feedback-and-ratings',
  title: 'Feedback and ratings',
  summary:
    'Ways for people to tell the product, a data owner or an assistant how well something worked: one-press signals, numbered scales, and reports that carry enough context to act on.',
  guidance: {
    use: [
      'Ask one question, in place, right after the thing it is about.',
      'Numbers and words for scores, so a rating reads without colour or icons.',
      'Follow a negative answer with one optional reason, never a long form.',
      'End every submission on a confirmation that says what happens next.',
    ],
    avoid: [
      'Stars and faces. A numbered scale is clearer and works for everyone.',
      'A preselected score. The default becomes the answer.',
      'Surveys that cannot be dismissed, or that come back after they were.',
      'Collecting diagnostics without saying what is included.',
    ],
  },
  source,
  sections: [
    {
      id: 'signals',
      title: 'Quick signals',
      description: 'One press, optionally one follow-up.',
      specimens: [
        {
          id: 'FeedbackRatingThumbs',
          title: 'Thumbs toggle',
          note: 'The lightest signal on a suggestion or result; pressing again takes it back.',
          origin: 'custom',
          uses: ['actions/ToggleGroup.tsx'],
          Component: FeedbackRatingThumbs,
        },
        {
          id: 'FeedbackRatingHelpful',
          title: 'Was this helpful?',
          note: 'Under a help article or a tooltip, where a labelled Yes and No read better than icons.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collaboration/HelpfulPrompt.tsx'],
          Component: FeedbackRatingHelpful,
        },
        {
          id: 'FeedbackRatingSent',
          title: 'Feedback sent',
          note: 'The confirmation every feedback flow ends on: received, and what to expect.',
          origin: 'custom',
          align: 'stretch',
          Component: FeedbackRatingSent,
        },
        {
          id: 'FeedbackRatingThumbsReason',
          title: 'Thumbs with a reason',
          note: 'A thumbs down opens one follow-up: pick a reason, add a line if you want.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['actions/ToggleGroup.tsx'],
          Component: FeedbackRatingThumbsReason,
        },
        {
          id: 'FeedbackRatingHelpfulReasons',
          title: 'Helpful prompt with reasons',
          note: 'On a procedure or article: "No" asks what was missing and can be skipped. Answer to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/HelpfulPrompt.tsx'],
          Component: FeedbackRatingHelpfulReasons,
        },
      ],
    },
    {
      id: 'scales',
      title: 'Scales',
      description: 'Scores with numbers and words. Nothing is preselected in a real survey.',
      specimens: [
        {
          id: 'FeedbackRatingRadio',
          title: '1 to 5 radio group',
          note: 'When each score needs its word beside it and there is vertical room.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: FeedbackRatingRadio,
        },
        {
          id: 'FeedbackRatingScore',
          title: 'Score selector',
          note: 'A compact 1 to 5 scale: end labels under it and the chosen word spelled out.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/RatingScale.tsx'],
          Component: FeedbackRatingScore,
        },
        {
          id: 'FeedbackRatingNps',
          title: '0 to 10 recommendation scale',
          note: 'The standard recommendation question, starting unanswered.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/RatingScale.tsx'],
          Component: FeedbackRatingNps,
        },
        {
          id: 'FeedbackRatingAgreement',
          title: 'Agreement scale',
          note: 'For a statement to agree or disagree with, where numbers would mean nothing.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: FeedbackRatingAgreement,
        },
        {
          id: 'FeedbackRatingLowFollowUp',
          title: 'Follow-up on a low score',
          note: 'A score of 1 or 2 asks what went wrong; higher scores ask nothing more.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/RatingScale.tsx'],
          Component: FeedbackRatingLowFollowUp,
        },
        {
          id: 'FeedbackRatingSummary',
          title: 'Rating summary',
          note: 'Showing collected ratings: the average, how many, and how they spread.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/RatingDistribution.tsx', 'patterns/collaboration/ratingSummary.ts', 'patterns/structure/SectionHeader.tsx'],
          Component: FeedbackRatingSummary,
        },
      ],
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'Feedback that needs words: forms, problem reports and flags on data.',
      specimens: [
        {
          id: 'FeedbackRatingForm',
          title: 'Feedback form',
          note: 'Category, message and an explicit choice to include diagnostics. Send to see the confirmation.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'forms/FormField.tsx',
            'forms/CharacterCountTextarea.tsx',
            'patterns/data-entry/OptionSelect.tsx',
            'patterns/data-entry/FormActions.tsx',
          ],
          Component: FeedbackRatingForm,
        },
        {
          id: 'FeedbackRatingBugReference',
          title: 'Bug report with reference',
          note: 'After a problem report: a reference to quote, copyable, and where updates will arrive.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['actions/CopyButton.tsx'],
          Component: FeedbackRatingBugReference,
        },
        {
          id: 'FeedbackRatingReportDialog',
          title: 'Report a problem',
          note: 'A global entry point; the dialog says which page the report is about.',
          origin: 'custom',
          uses: ['forms/FormField.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: FeedbackRatingReportDialog,
        },
        {
          id: 'FeedbackRatingBadData',
          title: 'Report bad data',
          note: 'A flag on one value, sent to its data owner. The value stays visible and the flag can be undone.',
          origin: 'custom',
          align: 'stretch',
          Component: FeedbackRatingBadData,
        },
        {
          id: 'FeedbackRatingSuggestion',
          title: 'Suggestion box',
          note: 'A standing invitation on a home page or a team space.',
          origin: 'custom',
          align: 'stretch',
          Component: FeedbackRatingSuggestion,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Feedback attached to an answer, a session or a rating already given.',
      specimens: [
        {
          id: 'FeedbackRatingAiAnswer',
          title: 'AI answer feedback',
          note: 'Under an assistant answer: copy, regenerate and a rating, with reasons after a thumbs down.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ResponseActions.tsx', 'actions/ToggleGroup.tsx'],
          Component: FeedbackRatingAiAnswer,
        },
        {
          id: 'FeedbackRatingSurvey',
          title: 'Survey card',
          note: 'One question, dismissible, and it says it will not come back. Dismiss or answer to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/RatingScale.tsx', 'patterns/collections/IconAction.tsx'],
          Component: FeedbackRatingSurvey,
        },
        {
          id: 'FeedbackRatingNpsSummary',
          title: 'Recommendation score',
          note: 'Reporting a 0 to 10 survey: the net score and the three groups behind it.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collaboration/ratingSummary.ts', 'patterns/collections/BreakdownList.tsx'],
          Component: FeedbackRatingNpsSummary,
        },
        {
          id: 'FeedbackRatingAlreadyRated',
          title: 'Already rated',
          note: 'Coming back to something you rated: your score, when, and a way to change it.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collaboration/RatingScale.tsx'],
          Component: FeedbackRatingAlreadyRated,
        },
        {
          id: 'FeedbackRatingSummaryEmpty',
          title: 'No ratings yet',
          note: 'A summary before anyone has answered shows a dash, never a zero average.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collaboration/RatingDistribution.tsx'],
          Component: FeedbackRatingSummaryEmpty,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Full blocks',
      description: 'Asking after a task, and showing what came back.',
      specimens: [
        {
          id: 'FeedbackRatingFlow',
          title: 'After-task feedback',
          note: 'Right after closing a work order: a score, a comment that becomes required when it is low, then thanks.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/RatingScale.tsx', 'patterns/data-entry/FormActions.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: FeedbackRatingFlow,
        },
        {
          id: 'FeedbackRatingResults',
          title: 'Feedback results',
          note: 'For the owner of a report or view: the distribution with words, and the latest comments.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/RatingDistribution.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: FeedbackRatingResults,
        },
      ],
    },
  ],
});
