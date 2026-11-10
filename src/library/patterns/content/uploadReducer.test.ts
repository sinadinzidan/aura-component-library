import { summarizeUploads, uploadReducer } from './uploadReducer';
import type { UploadItem } from './uploadReducer';

const item = (id: string, patch: Partial<UploadItem> = {}): UploadItem => ({
  id,
  name: `${id}.pdf`,
  size: 1000,
  loaded: 0,
  status: 'queued',
  ...patch,
});

describe(uploadReducer.name, () => {
  it('adds files as queued with nothing sent', () => {
    const next = uploadReducer([], {
      type: 'add',
      files: [{ id: 'a', name: 'a.pdf', size: 1000 }],
    });

    expect(next).toEqual([item('a')]);
  });

  it('ignores a file whose id is already in the queue', () => {
    const state = [item('a', { loaded: 400, status: 'uploading' })];

    const next = uploadReducer(state, {
      type: 'add',
      files: [{ id: 'a', name: 'a.pdf', size: 1000 }],
    });

    expect(next).toEqual(state);
  });

  it('moves a queued file to uploading when bytes arrive', () => {
    const next = uploadReducer([item('a')], {
      type: 'progress',
      id: 'a',
      bytes: 250,
    });

    expect(next[0]).toMatchObject({ loaded: 250, status: 'uploading' });
  });

  it('completes a file when everything is sent and never overshoots', () => {
    const next = uploadReducer([item('a', { loaded: 900, status: 'uploading' })], { type: 'progress', id: 'a', bytes: 500 });

    expect(next[0]).toMatchObject({ loaded: 1000, status: 'done' });
  });

  it('advances every active file by a share of its own size', () => {
    const state = [item('a'), item('b', { size: 4000 }), item('c', { status: 'cancelled' })];

    const next = uploadReducer(state, { type: 'advance', fraction: 0.25 });

    expect(next.map((entry) => entry.loaded)).toEqual([250, 1000, 0]);
  });

  it('does not move finished, failed or cancelled files', () => {
    const state = [item('a', { status: 'failed', loaded: 300 }), item('b', { status: 'done', loaded: 1000 })];

    const next = uploadReducer(state, { type: 'advance', fraction: 0.5 });

    expect(next).toEqual(state);
  });

  it('fails an active file with a reason and keeps what was sent', () => {
    const next = uploadReducer([item('a', { loaded: 300, status: 'uploading' })], { type: 'fail', id: 'a', error: 'Connection lost' });

    expect(next[0]).toEqual(item('a', { loaded: 300, status: 'failed', error: 'Connection lost' }));
  });

  it('does not fail a file that is already done', () => {
    const state = [item('a', { loaded: 1000, status: 'done' })];

    expect(uploadReducer(state, { type: 'fail', id: 'a', error: 'late' })).toEqual(state);
  });

  it('retries a failed file from where it stopped and clears the error', () => {
    const next = uploadReducer([item('a', { loaded: 300, status: 'failed', error: 'Connection lost' })], { type: 'retry', id: 'a' });

    expect(next[0]).toEqual(item('a', { loaded: 300, status: 'queued' }));
  });

  it('does not retry a file that is still moving', () => {
    const state = [item('a', { loaded: 300, status: 'uploading' })];

    expect(uploadReducer(state, { type: 'retry', id: 'a' })).toEqual(state);
  });

  it('cancels an active file and leaves a finished one alone', () => {
    const state = [item('a', { status: 'uploading', loaded: 10 }), item('b', { status: 'done', loaded: 1000 })];

    const next = uploadReducer(uploadReducer(state, { type: 'cancel', id: 'a' }), { type: 'cancel', id: 'b' });

    expect(next.map((entry) => entry.status)).toEqual(['cancelled', 'done']);
  });

  it('removes one file', () => {
    expect(uploadReducer([item('a'), item('b')], { type: 'remove', id: 'a' })).toEqual([item('b')]);
  });

  it('clears everything that is no longer moving', () => {
    const state = [
      item('a', { status: 'done', loaded: 1000 }),
      item('b', { status: 'uploading', loaded: 10 }),
      item('c', { status: 'failed' }),
      item('d', { status: 'cancelled' }),
      item('e'),
    ];

    expect(uploadReducer(state, { type: 'clearFinished' }).map((entry) => entry.id)).toEqual(['b', 'e']);
  });
});

describe(summarizeUploads.name, () => {
  it('counts files by state', () => {
    const summary = summarizeUploads([
      item('a', { status: 'done', loaded: 1000 }),
      item('b', { status: 'uploading', loaded: 500 }),
      item('c', { status: 'failed', loaded: 100 }),
      item('d', { status: 'cancelled', loaded: 900 }),
      item('e'),
    ]);

    expect(summary).toMatchObject({
      total: 5,
      active: 2,
      done: 1,
      failed: 1,
      cancelled: 1,
      settled: false,
    });
  });

  it('leaves cancelled files out of the byte totals', () => {
    const summary = summarizeUploads([item('a', { status: 'uploading', loaded: 500 }), item('d', { status: 'cancelled', loaded: 900 })]);

    expect(summary).toMatchObject({
      loadedBytes: 500,
      totalBytes: 1000,
      percent: 50,
    });
  });

  it('rounds the percentage down so 100 means everything is sent', () => {
    const summary = summarizeUploads([item('a', { size: 3000, status: 'uploading', loaded: 2999 })]);

    expect(summary.percent).toBe(99);
  });

  it('is settled and at zero for an empty queue', () => {
    expect(summarizeUploads([])).toMatchObject({
      total: 0,
      percent: 0,
      settled: true,
    });
  });
});
