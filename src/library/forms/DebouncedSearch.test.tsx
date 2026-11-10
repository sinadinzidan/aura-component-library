import { fireEvent, render, screen } from '@testing-library/react';

import { DebouncedSearch } from './DebouncedSearch';
import type { DebounceTimers } from './DebouncedSearch';

describe(DebouncedSearch.name, () => {
  it('does not search before typing pauses', () => {
    const { timers } = makeTimers();
    const onSearch = vi.fn();
    render(<DebouncedSearch aria-label="Search assets" onSearch={onSearch} timers={timers} />);

    fireEvent.change(screen.getByLabelText('Search assets'), { target: { value: 'comp' } });

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('searches once with the latest text after the pause', () => {
    const { timers, flush } = makeTimers();
    const onSearch = vi.fn();
    render(<DebouncedSearch aria-label="Search assets" onSearch={onSearch} timers={timers} />);
    const input = screen.getByLabelText('Search assets');

    fireEvent.change(input, { target: { value: 'c' } });
    fireEvent.change(input, { target: { value: 'co' } });
    fireEvent.change(input, { target: { value: 'compressor' } });
    flush();

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('compressor');
  });

  it('waits for the configured delay', () => {
    const { timers, delays } = makeTimers();
    render(<DebouncedSearch aria-label="Search assets" onSearch={vi.fn()} timers={timers} delayMs={500} />);

    fireEvent.change(screen.getByLabelText('Search assets'), { target: { value: 'pump' } });

    expect(delays).toEqual([500]);
  });

  it('trims the query', () => {
    const { timers, flush } = makeTimers();
    const onSearch = vi.fn();
    render(<DebouncedSearch aria-label="Search assets" onSearch={onSearch} timers={timers} />);

    fireEvent.change(screen.getByLabelText('Search assets'), { target: { value: '  pump  ' } });
    flush();

    expect(onSearch).toHaveBeenCalledWith('pump');
  });

  it('searches at once on Enter and does not search again after the pause', () => {
    const { timers, flush } = makeTimers();
    const onSearch = vi.fn();
    render(<DebouncedSearch aria-label="Search assets" onSearch={onSearch} timers={timers} />);
    const input = screen.getByLabelText('Search assets');

    fireEvent.change(input, { target: { value: 'valve' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    flush();

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('valve');
  });

  it('does not repeat a search for the same query', () => {
    const { timers, flush } = makeTimers();
    const onSearch = vi.fn();
    render(<DebouncedSearch aria-label="Search assets" onSearch={onSearch} timers={timers} />);
    const input = screen.getByLabelText('Search assets');

    fireEvent.change(input, { target: { value: 'valve' } });
    flush();
    fireEvent.change(input, { target: { value: 'valve ' } });
    flush();

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('searches for an empty query at once when cleared', () => {
    const { timers } = makeTimers();
    const onSearch = vi.fn();
    render(
      <DebouncedSearch aria-label="Search assets" defaultQuery="pump" onSearch={onSearch} timers={timers} />
    );
    fireEvent.focus(screen.getByLabelText('Search assets'));

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(onSearch).toHaveBeenCalledWith('');
    expect(screen.getByLabelText('Search assets')).toHaveValue('');
  });

  it('cancels a pending search on unmount', () => {
    const { timers, flush } = makeTimers();
    const onSearch = vi.fn();
    const { unmount } = render(<DebouncedSearch aria-label="Search assets" onSearch={onSearch} timers={timers} />);
    fireEvent.change(screen.getByLabelText('Search assets'), { target: { value: 'pump' } });

    unmount();
    flush();

    expect(onSearch).not.toHaveBeenCalled();
  });
});

function makeTimers() {
  const callbacks = new Map<number, () => void>();
  const delays: number[] = [];
  let nextHandle = 1;
  const timers: DebounceTimers = {
    setTimeout: (callback, ms) => {
      const handle = nextHandle++;
      callbacks.set(handle, callback);
      delays.push(ms);
      return handle;
    },
    clearTimeout: (handle) => {
      callbacks.delete(handle);
    },
  };
  const flush = () => {
    const due = [...callbacks.values()];
    callbacks.clear();
    due.forEach((callback) => callback());
  };
  return { timers, flush, delays };
}
