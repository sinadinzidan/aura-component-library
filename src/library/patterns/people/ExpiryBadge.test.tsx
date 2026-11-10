import { render, screen } from '@testing-library/react';

import { ExpiryBadge } from './ExpiryBadge';

const NOW = Date.UTC(2026, 2, 12, 14, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

describe(ExpiryBadge.name, () => {
  it('shows an active key', () => {
    render(<ExpiryBadge expiresAt={NOW + 90 * DAY} now={NOW} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows a key that is about to expire', () => {
    render(<ExpiryBadge expiresAt={NOW + 6 * DAY} now={NOW} />);

    expect(screen.getByText('Expiring soon')).toBeInTheDocument();
  });

  it('shows an expired key', () => {
    render(<ExpiryBadge expiresAt={NOW - DAY} now={NOW} />);

    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('shows revoked over any expiry', () => {
    render(<ExpiryBadge expiresAt={NOW + 90 * DAY} revokedAt={NOW - DAY} now={NOW} />);

    expect(screen.getByText('Revoked')).toBeInTheDocument();
  });

  it('shows a key without expiry', () => {
    render(<ExpiryBadge expiresAt={null} now={NOW} />);

    expect(screen.getByText('No expiry')).toBeInTheDocument();
  });

  it('adds the distance on request', () => {
    render(<ExpiryBadge expiresAt={NOW + 6 * DAY} now={NOW} showDetail />);

    expect(screen.getByText('Expires in 6 days')).toBeInTheDocument();
  });

  it('leaves the distance out by default', () => {
    render(<ExpiryBadge expiresAt={NOW + 6 * DAY} now={NOW} />);

    expect(screen.queryByText('Expires in 6 days')).not.toBeInTheDocument();
  });
});
