import { Button } from '@cognite/aura/components/button';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Kbd } from '@cognite/aura/components/kbd';
import {
  PromptInput,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputController,
} from '@cognite/aura/components/prompt-input';
import { Select } from '@cognite/aura/components/select';
import {
  IconBinaryTree,
  IconChartLine,
  IconDatabase,
  IconFileText,
  IconLock,
  IconPaperclip,
  IconX,
} from '@cognite/aura/icons';
import { useEffect, useState } from 'react';

import { PromptSuggestions } from '../../../library/ai/PromptSuggestions';
import { definePage } from '../../types';

import source from './prompt-input.tsx?raw';

const STARTERS = [
  { id: 'trip', label: 'Why did the recompressor trip?' },
  { id: 'trend', label: 'Discharge pressure, last 24 hours', prompt: 'Show discharge pressure for 23-KA-9101 over the last 24 hours' },
  { id: 'alarms', label: 'Active alarms in gas compression', prompt: 'List the active alarms in gas compression, most severe first' },
  { id: 'orders', label: 'Overdue work orders', prompt: 'Which work orders at Nordkapp are overdue?' },
];

const MODELS = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'fast', label: 'Fast' },
  { value: 'thorough', label: 'Thorough' },
];

const CHARACTER_LIMIT = 280;

const LONG_PROMPT =
  'Compare the recompressor trip today with the two previous trips this year.\n\nFor each one, give me:\n- the trip cause and the alarm that fired first\n- vibration and discharge temperature in the hour before\n- the work order that followed and how long the machine was down';

const noop = () => undefined;

const isOutsideLimit = (text: string) => text.trim() === '' || text.length > CHARACTER_LIMIT;

const CHIP = 'flex h-7 items-center gap-1 rounded-md bg-muted-background pr-0.5 pl-2 text-sm text-base-foreground';

const SuggestionsThatFill = () => (
  <PromptSuggestions suggestions={STARTERS} onSelect={usePromptInputController().textInput.setInput} />
);

const SubmitWhenFilled = () => (
  <PromptInputSubmit disabled={usePromptInputController().textInput.value.trim() === ''} />
);

const CharacterCount = () => (
  <span
    className={`text-xs tabular-nums ${usePromptInputController().textInput.value.length > CHARACTER_LIMIT ? 'text-critical-foreground-strong' : 'text-muted-foreground'}`}
  >
    {usePromptInputController().textInput.value.length} / {CHARACTER_LIMIT}
  </span>
);

const SubmitWithinLimit = () => (
  <PromptInputSubmit
    disabled={isOutsideLimit(usePromptInputController().textInput.value)}
  />
);

function PromptInputMinimal() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput onSubmit={noop}>
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Ask about the plant" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputNoHelper() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput onSubmit={noop} helperText={false}>
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Ask about the plant" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputCustomHelper() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput
        onSubmit={noop}
        helperText={
          <HelperText size="xs" icon={<IconDatabase />}>
            Answers use data from Nordkapp only. Check them before you act.
          </HelperText>
        }
      >
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Ask about the plant" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputScopedPlaceholder() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput onSubmit={noop} helperText={false}>
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Ask about 23-KA-9103, its alarms or its work orders" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputPrefilled() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInputProvider initialInput="Show discharge pressure for 23-KA-9101 over the last 24 hours">
        <PromptInput onSubmit={noop} helperText={false}>
          <PromptInputBody>
            <PromptInputTextarea aria-label="Message" />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <SubmitWhenFilled />
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>
    </div>
  );
}

function PromptInputAttachMenu() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput onSubmit={noop} helperText={false}>
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Ask about the plant" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger aria-label="Add context" />
              <PromptInputActionMenuContent>
                <PromptInputActionMenuItem>
                  <IconPaperclip /> Attach a file
                </PromptInputActionMenuItem>
                <PromptInputActionMenuItem>
                  <IconChartLine /> Add a time series
                </PromptInputActionMenuItem>
                <PromptInputActionMenuItem>
                  <IconBinaryTree /> Add an asset
                </PromptInputActionMenuItem>
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
          </PromptInputTools>
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputModelSelector() {
  const [model, setModel] = useState('balanced');
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput onSubmit={noop} helperText={false}>
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Ask about the plant" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <Select items={MODELS} value={model} onValueChange={setModel}>
              <PromptInputModelSelectTrigger size="sm" aria-label="Model">
                <PromptInputModelSelectValue />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                {MODELS.map((option) => (
                  <PromptInputModelSelectItem key={option.value} value={option.value}>
                    {option.label}
                  </PromptInputModelSelectItem>
                ))}
              </PromptInputModelSelectContent>
            </Select>
          </PromptInputTools>
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputToolToggles() {
  const [plantData, setPlantData] = useState(true);
  const [documents, setDocuments] = useState(false);
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput onSubmit={noop} helperText={false}>
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Ask about the plant" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputButton
              variant={plantData ? 'secondary' : 'ghost'}
              aria-pressed={plantData}
              onClick={() => setPlantData(!plantData)}
            >
              <IconChartLine />
              <span>Plant data</span>
            </PromptInputButton>
            <PromptInputButton
              variant={documents ? 'secondary' : 'ghost'}
              aria-pressed={documents}
              onClick={() => setDocuments(!documents)}
            >
              <IconFileText />
              <span>Documents</span>
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputWithAttachments() {
  const [files, setFiles] = useState(['Shift log 12 March.pdf', 'vibration-export.csv']);
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput onSubmit={noop} helperText={false}>
        <PromptInputHeader>
          {files.map((file) => (
            <span key={file} className={CHIP}>
              <IconPaperclip aria-hidden className="size-3.5 text-muted-foreground" />
              {file}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${file}`}
                onClick={() => setFiles(files.filter((name) => name !== file))}
              >
                <IconX />
              </Button>
            </span>
          ))}
          {files.length === 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setFiles(['Shift log 12 March.pdf', 'vibration-export.csv'])}>
              <IconPaperclip /> Attach the files again
            </Button>
          ) : null}
        </PromptInputHeader>
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" defaultValue="Summarize what happened before the trip" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputButton aria-label="Attach a file">
              <IconPaperclip />
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputScope() {
  const [scoped, setScoped] = useState(true);
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput onSubmit={noop} helperText={false}>
        <PromptInputHeader>
          {scoped ? (
            <span className={CHIP}>
              <IconBinaryTree aria-hidden className="size-3.5 text-muted-foreground" />
              23-KA-9103 · Recompressor
              <Button variant="ghost" size="icon-sm" aria-label="Remove asset scope" onClick={() => setScoped(false)}>
                <IconX />
              </Button>
            </span>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setScoped(true)}>
              <IconBinaryTree /> Scope to 23-KA-9103
            </Button>
          )}
        </PromptInputHeader>
        <PromptInputBody>
          <PromptInputTextarea
            aria-label="Message"
            placeholder={scoped ? 'Ask about this asset' : 'Ask about the whole plant'}
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputFullToolbar() {
  const [model, setModel] = useState('thorough');
  const [plantData, setPlantData] = useState(true);
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput onSubmit={noop}>
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Ask about the plant" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger aria-label="Add context" />
              <PromptInputActionMenuContent>
                <PromptInputActionMenuItem>
                  <IconPaperclip /> Attach a file
                </PromptInputActionMenuItem>
                <PromptInputActionMenuItem>
                  <IconBinaryTree /> Add an asset
                </PromptInputActionMenuItem>
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <PromptInputButton
              variant={plantData ? 'secondary' : 'ghost'}
              aria-pressed={plantData}
              onClick={() => setPlantData(!plantData)}
            >
              <IconChartLine />
              <span>Plant data</span>
            </PromptInputButton>
            <Select items={MODELS} value={model} onValueChange={setModel}>
              <PromptInputModelSelectTrigger size="sm" aria-label="Model">
                <PromptInputModelSelectValue />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                {MODELS.map((option) => (
                  <PromptInputModelSelectItem key={option.value} value={option.value}>
                    {option.label}
                  </PromptInputModelSelectItem>
                ))}
              </PromptInputModelSelectContent>
            </Select>
          </PromptInputTools>
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputSubmitted() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput onSubmit={noop} helperText={false}>
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Sending your question" readOnly />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          <PromptInputSubmit status="submitted" aria-label="Sending" disabled />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputStreaming() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput onSubmit={noop} helperText={false}>
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Write a follow-up while you wait" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          <PromptInputSubmit status="streaming" type="button" aria-label="Stop response" />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputError() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput onSubmit={noop} errorMessage="The question was not sent. Check your connection and try again.">
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" defaultValue="Why did the recompressor trip?" aria-invalid />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          <PromptInputSubmit aria-label="Send again" />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputDisabledWithReason() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput
        onSubmit={noop}
        helperText={
          <HelperText size="xs" icon={<IconLock />}>
            The assistant is not enabled for Valhall Sør. Ask a project admin to turn it on.
          </HelperText>
        }
      >
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Ask about the plant" disabled />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          <PromptInputSubmit disabled />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputEmptyGuard() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInputProvider>
        <PromptInput onSubmit={noop} helperText={false}>
          <PromptInputBody>
            <PromptInputTextarea aria-label="Message" placeholder="Type to enable send" />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <SubmitWhenFilled />
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>
    </div>
  );
}

function PromptInputMultiline() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput onSubmit={noop} helperText={false}>
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" defaultValue={LONG_PROMPT} />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputCharacterCount() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInputProvider initialInput="List the active alarms in gas compression, most severe first">
        <PromptInput onSubmit={noop} helperText={false}>
          <PromptInputBody>
            <PromptInputTextarea aria-label="Message" />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <CharacterCount />
            </PromptInputTools>
            <SubmitWithinLimit />
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>
    </div>
  );
}

function PromptInputContextHint() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput
        onSubmit={noop}
        helperText={
          <HelperText size="xs">
            This conversation has used 86% of its context. Start a new one for an unrelated question.
          </HelperText>
        }
      >
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Ask a follow-up" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <span className="text-xs text-muted-foreground tabular-nums">6,880 / 8,000 tokens</span>
          </PromptInputTools>
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputKeyboardHint() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput
        onSubmit={noop}
        helperText={
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Kbd>↵</Kbd> to send, <Kbd>⇧</Kbd>
            <Kbd>↵</Kbd> for a new line
          </span>
        }
      >
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Ask about the plant" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputWithSuggestions() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <PromptInputProvider>
        <SuggestionsThatFill />
        <PromptInput onSubmit={noop} helperText={false}>
          <PromptInputBody>
            <PromptInputTextarea aria-label="Message" placeholder="Ask about the plant, or pick a suggestion" />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <SubmitWhenFilled />
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>
    </div>
  );
}

function PromptInputCompact() {
  return (
    <div className="mx-auto w-full max-w-xs rounded-xl bg-base-background p-3">
      <PromptInput onSubmit={noop} helperText={false}>
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Ask a follow-up" className="min-h-10" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputButton aria-label="Attach a file">
              <IconPaperclip />
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputSendCycle() {
  const [status, setStatus] = useState<'ready' | 'submitted' | 'streaming'>('ready');
  const [sent, setSent] = useState('');

  useEffect(() => {
    if (status === 'ready') return;
    const handle = window.setTimeout(() => setStatus(status === 'submitted' ? 'streaming' : 'ready'), status === 'submitted' ? 900 : 2400);
    return () => window.clearTimeout(handle);
  }, [status]);

  const busy = status !== 'ready';

  return (
    <div className="mx-auto w-full max-w-xl">
      <PromptInput
        onSubmit={(message) => {
          if (busy || !message.text?.trim()) return;
          setSent(message.text);
          setStatus('submitted');
        }}
        helperText={
          <HelperText size="xs">
            {status === 'submitted' ? `Sending "${sent}"` : null}
            {status === 'streaming' ? 'Answering. Stop to interrupt.' : null}
            {status === 'ready' ? (sent ? 'Answer complete. Ask another question.' : 'Type a question and press Enter.') : null}
          </HelperText>
        }
      >
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Ask about the plant" readOnly={status === 'submitted'} />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          {status === 'streaming' ? (
            <PromptInputSubmit status="streaming" type="button" aria-label="Stop response" onClick={() => setStatus('ready')} />
          ) : (
            <PromptInputSubmit status={status} disabled={busy} />
          )}
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function PromptInputEmptyStateHero() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 py-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold text-base-foreground">Ask about Nordkapp</h3>
        <p className="text-sm text-muted-foreground">
          Alarms, trends, equipment and work orders, answered from live plant data.
        </p>
      </div>
      <PromptInputProvider>
        <PromptInput onSubmit={noop}>
          <PromptInputBody>
            <PromptInputTextarea aria-label="Message" placeholder="Ask about the plant" />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <SubmitWhenFilled />
          </PromptInputFooter>
        </PromptInput>
        <SuggestionsThatFill />
      </PromptInputProvider>
    </div>
  );
}

export default definePage({
  id: 'prompt-input',
  title: 'Prompt input',
  summary:
    'The prompt input is where a question to the assistant is written and sent. A growing text area with a footer for tools and one send button that also reports whether a response is on its way.',
  docsSlug: 'prompt-input',
  guidance: {
    use: [
      'Docked at the bottom of a thread, or centred with suggestions in an empty one.',
      'A placeholder that says what can be asked, in the user’s words.',
      'The send button as the status: spinner while sending, stop while answering.',
      'A visible reason whenever the input is disabled.',
    ],
    avoid: [
      'More than three or four tools in the footer; move the rest into the add menu.',
      'Clearing what the user typed when sending fails.',
      'Blocking typing while a response streams; let people queue the follow-up.',
      'Removing the reliability note where answers can drive decisions on the plant.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'The text area, the send button and the helper line underneath.',
      specimens: [
        {
          id: 'PromptInputMinimal',
          title: 'Minimal',
          note: 'The default: a text area, send, and Aura’s standard reliability note.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: PromptInputMinimal,
        },
        {
          id: 'PromptInputNoHelper',
          title: 'Without helper text',
          note: 'When the reliability note already appears elsewhere on the surface.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: PromptInputNoHelper,
        },
        {
          id: 'PromptInputCustomHelper',
          title: 'Custom helper text',
          note: 'Say what the assistant can see, so people know what an answer is based on.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: PromptInputCustomHelper,
        },
        {
          id: 'PromptInputScopedPlaceholder',
          title: 'Scoped placeholder',
          note: 'On an asset page, the placeholder names the asset the question will be about.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: PromptInputScopedPlaceholder,
        },
        {
          id: 'PromptInputPrefilled',
          title: 'Prefilled, controlled',
          note: 'A prompt handed over from elsewhere, for the user to edit before sending.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: PromptInputPrefilled,
        },
      ],
    },
    {
      id: 'tools',
      title: 'Tools and context',
      description: 'What goes in the footer and the header around the text.',
      specimens: [
        {
          id: 'PromptInputAttachMenu',
          title: 'Add menu',
          note: 'One plus button for everything that can be attached: files, time series, assets.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: PromptInputAttachMenu,
        },
        {
          id: 'PromptInputModelSelector',
          title: 'Model selector',
          note: 'When users may trade speed for depth; name the options by what they do.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: PromptInputModelSelector,
        },
        {
          id: 'PromptInputToolToggles',
          title: 'Tool toggles',
          note: 'Two or three sources the user switches on and off per question.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: PromptInputToolToggles,
        },
        {
          id: 'PromptInputWithAttachments',
          title: 'With attachments',
          note: 'Attached files sit in the header as removable chips, above the text they belong to.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PromptInputWithAttachments,
        },
        {
          id: 'PromptInputScope',
          title: 'With asset scope',
          note: 'Shows what the question is scoped to and lets the user drop the scope.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PromptInputScope,
        },
        {
          id: 'PromptInputFullToolbar',
          title: 'Full toolbar',
          note: 'The most a footer should carry: add menu, one toggle, model, send.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: PromptInputFullToolbar,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'The send button reports the request; the helper line explains anything else.',
      specimens: [
        {
          id: 'PromptInputSubmitted',
          title: 'Sending',
          note: 'Between send and the first token: spinner on the button, input read-only.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: PromptInputSubmitted,
        },
        {
          id: 'PromptInputStreaming',
          title: 'Answering, with stop',
          note: 'While the response streams, send becomes stop and typing stays possible.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: PromptInputStreaming,
        },
        {
          id: 'PromptInputError',
          title: 'Send failed',
          note: 'The text stays, the error replaces the helper line, and send tries again.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: PromptInputError,
        },
        {
          id: 'PromptInputDisabledWithReason',
          title: 'Disabled with reason',
          note: 'When the assistant is unavailable, the helper line says why and who can fix it.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: PromptInputDisabledWithReason,
        },
        {
          id: 'PromptInputEmptyGuard',
          title: 'Send disabled when empty',
          note: 'Prevents empty questions; the button enables with the first character.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: PromptInputEmptyGuard,
        },
      ],
    },
    {
      id: 'content',
      title: 'Content and hints',
      description: 'Long prompts, limits and shortcuts.',
      specimens: [
        {
          id: 'PromptInputMultiline',
          title: 'Multiline',
          note: 'The text area grows with a structured prompt up to 192px, then scrolls.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: PromptInputMultiline,
        },
        {
          id: 'PromptInputCharacterCount',
          title: 'Character count',
          note: 'Where prompts have a hard limit; the count turns critical and send disables past it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PromptInputCharacterCount,
        },
        {
          id: 'PromptInputContextHint',
          title: 'Context budget hint',
          note: 'Late in a long conversation, warn before answers start to degrade.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PromptInputContextHint,
        },
        {
          id: 'PromptInputKeyboardHint',
          title: 'Keyboard hint',
          note: 'Teaches send and new line to first-time users; drop it once learned.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PromptInputKeyboardHint,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'The input with suggestions, in a panel, and through a full send cycle.',
      specimens: [
        {
          id: 'PromptInputWithSuggestions',
          title: 'Suggestions above',
          note: 'Starter prompts fill the input so the user can adjust them before sending. Pick one.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/PromptSuggestions.tsx'],
          Component: PromptInputWithSuggestions,
        },
        {
          id: 'PromptInputCompact',
          title: 'Compact, side panel',
          note: 'A shorter text area and no helper line for a 320px assistant panel.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          Component: PromptInputCompact,
        },
        {
          id: 'PromptInputSendCycle',
          title: 'Send cycle',
          note: 'Ready, sending, answering with stop, ready again. Type a question and send it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PromptInputSendCycle,
        },
        {
          id: 'PromptInputEmptyStateHero',
          title: 'Empty thread hero',
          note: 'The opening screen of an assistant: a heading, the input, and prompts to start from.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/PromptSuggestions.tsx'],
          Component: PromptInputEmptyStateHero,
        },
      ],
    },
  ],
});
