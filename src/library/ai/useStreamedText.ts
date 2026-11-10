import { useCallback, useEffect, useState } from 'react';

export type StreamedTextStatus = 'idle' | 'streaming' | 'stopped' | 'done';

export type StreamedTextOptions = {
  /** Characters revealed per tick. */
  chunkSize?: number;
  intervalMs?: number;
  /** Characters already visible before the first `start`, to show a stream caught mid-way. */
  initialLength?: number;
  setIntervalFn?: (handler: () => void, ms: number) => number;
  clearIntervalFn?: (handle: number) => void;
};

export type StreamedText = {
  text: string;
  status: StreamedTextStatus;
  /** Restarts from the first character. */
  start: () => void;
  stop: () => void;
  /** Shows the whole text at once. */
  finish: () => void;
};

const defaultSetInterval = (handler: () => void, ms: number) => window.setInterval(handler, ms);
const defaultClearInterval = (handle: number) => window.clearInterval(handle);

/**
 * Reveals a fixed text chunk by chunk, to demo or replay a streamed response without a network.
 * The timer only runs between `start` and the last character, then clears itself.
 */
export function useStreamedText(fullText: string, options: StreamedTextOptions = {}): StreamedText {
  const {
    chunkSize = 6,
    intervalMs = 40,
    initialLength = 0,
    setIntervalFn = defaultSetInterval,
    clearIntervalFn = defaultClearInterval,
  } = options;
  const [length, setLength] = useState(Math.min(initialLength, fullText.length));
  const [running, setRunning] = useState(false);

  const complete = length >= fullText.length;

  useEffect(() => {
    if (!running || complete) return;
    const handle = setIntervalFn(() => setLength((current) => current + chunkSize), intervalMs);
    return () => clearIntervalFn(handle);
  }, [running, complete, chunkSize, intervalMs, setIntervalFn, clearIntervalFn]);

  const start = useCallback(() => {
    setLength(0);
    setRunning(true);
  }, []);
  const stop = useCallback(() => setRunning(false), []);
  const finish = useCallback(() => {
    setRunning(false);
    setLength(fullText.length);
  }, [fullText.length]);

  let status: StreamedTextStatus = 'idle';
  if (complete) status = 'done';
  else if (running) status = 'streaming';
  else if (length > 0) status = 'stopped';

  return { text: fullText.slice(0, length), status, start, stop, finish };
}
