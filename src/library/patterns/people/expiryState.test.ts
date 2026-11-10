import { describeExpiry, getExpiryState } from './expiryState';

const NOW = Date.UTC(2026, 2, 12, 14, 0, 0);
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe(getExpiryState.name, () => {
  it('is active when expiry is further away than the warning window', () => {
    expect(getExpiryState({ expiresAt: NOW + 60 * DAY, now: NOW })).toBe('active');
  });

  it('is expiring soon inside the warning window', () => {
    expect(getExpiryState({ expiresAt: NOW + 6 * DAY, now: NOW })).toBe('expiring-soon');
  });

  it('is expiring soon exactly at the edge of the warning window', () => {
    expect(getExpiryState({ expiresAt: NOW + 14 * DAY, now: NOW })).toBe('expiring-soon');
  });

  it('respects a custom warning window', () => {
    expect(getExpiryState({ expiresAt: NOW + 6 * DAY, now: NOW, soonWithinDays: 3 })).toBe('active');
  });

  it('is expired at the moment of expiry', () => {
    expect(getExpiryState({ expiresAt: NOW, now: NOW })).toBe('expired');
  });

  it('is expired after the expiry time', () => {
    expect(getExpiryState({ expiresAt: NOW - DAY, now: NOW })).toBe('expired');
  });

  it('has no expiry when none is set', () => {
    expect(getExpiryState({ expiresAt: null, now: NOW })).toBe('no-expiry');
  });

  it('is revoked even when it would otherwise be active, expired or without expiry', () => {
    expect(getExpiryState({ expiresAt: NOW + 60 * DAY, revokedAt: NOW - HOUR, now: NOW })).toBe('revoked');
    expect(getExpiryState({ expiresAt: NOW - DAY, revokedAt: NOW - HOUR, now: NOW })).toBe('revoked');
    expect(getExpiryState({ expiresAt: null, revokedAt: NOW - HOUR, now: NOW })).toBe('revoked');
  });

  it('ignores a revocation scheduled in the future', () => {
    expect(getExpiryState({ expiresAt: NOW + 60 * DAY, revokedAt: NOW + DAY, now: NOW })).toBe('active');
  });
});

describe(describeExpiry.name, () => {
  it('counts days until expiry', () => {
    expect(describeExpiry({ expiresAt: NOW + 6 * DAY, now: NOW })).toBe('Expires in 6 days');
  });

  it('uses the singular for one day', () => {
    expect(describeExpiry({ expiresAt: NOW + DAY + HOUR, now: NOW })).toBe('Expires in 1 day');
  });

  it('switches to hours inside the last day', () => {
    expect(describeExpiry({ expiresAt: NOW + 5 * HOUR, now: NOW })).toBe('Expires in 5 hours');
  });

  it('says less than an hour inside the last hour', () => {
    expect(describeExpiry({ expiresAt: NOW + 10 * 60 * 1000, now: NOW })).toBe('Expires in less than an hour');
  });

  it('says how long ago it expired', () => {
    expect(describeExpiry({ expiresAt: NOW - 3 * DAY, now: NOW })).toBe('Expired 3 days ago');
  });

  it('says how long ago it was revoked', () => {
    expect(describeExpiry({ expiresAt: NOW + 30 * DAY, revokedAt: NOW - DAY, now: NOW })).toBe('Revoked 1 day ago');
  });

  it('says when there is no expiry', () => {
    expect(describeExpiry({ expiresAt: null, now: NOW })).toBe('Does not expire');
  });
});
