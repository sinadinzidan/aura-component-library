import { Search } from '@cognite/aura/components/search';
import { useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';

/** The slice of the timer API the component needs; inject a fake in tests. */
export type DebounceTimers = {
  setTimeout: (callback: () => void, ms: number) => number;
  clearTimeout: (handle: number) => void;
};

const browserTimers: DebounceTimers = {
  setTimeout: (callback, ms) => window.setTimeout(callback, ms),
  clearTimeout: (handle) => window.clearTimeout(handle),
};

type DebouncedSearchProps = Omit<ComponentProps<typeof Search>, 'value' | 'defaultValue' | 'onChange' | 'onClear'> & {
  /** Initial text in the field. */
  defaultQuery?: string;
  /** Called with the trimmed query once typing pauses, and at once on Enter or clear. */
  onSearch: (query: string) => void;
  delayMs?: number;
  timers?: DebounceTimers;
};

/**
 * A search field that waits for a pause in typing before it searches, so a live search
 * sends one request per query instead of one per keystroke. Enter and clear search at once.
 */
export function DebouncedSearch({
  defaultQuery = '',
  onSearch,
  delayMs = 300,
  timers = browserTimers,
  onKeyDown,
  ...searchProps
}: DebouncedSearchProps) {
  const [text, setText] = useState(defaultQuery);
  const pending = useRef<number | null>(null);
  const lastSent = useRef(defaultQuery.trim());
  const latestOnSearch = useRef(onSearch);

  useEffect(() => {
    latestOnSearch.current = onSearch;
  }, [onSearch]);

  const cancel = () => {
    if (pending.current !== null) {
      timers.clearTimeout(pending.current);
      pending.current = null;
    }
  };

  const send = (next: string) => {
    cancel();
    const query = next.trim();
    if (query === lastSent.current) return;
    lastSent.current = query;
    latestOnSearch.current(query);
  };

  const schedule = (next: string) => {
    cancel();
    pending.current = timers.setTimeout(() => {
      pending.current = null;
      send(next);
    }, delayMs);
  };

  useEffect(
    () => () => {
      if (pending.current !== null) timers.clearTimeout(pending.current);
    },
    [timers]
  );

  return (
    <Search
      {...searchProps}
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        schedule(event.target.value);
      }}
      onClear={() => {
        setText('');
        send('');
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') send(text);
        onKeyDown?.(event);
      }}
    />
  );
}
