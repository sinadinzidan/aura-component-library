import { render, screen } from '@testing-library/react';

import { LogEntry } from './LogEntry';

describe(LogEntry.name, () => {
  it('shows time, author, category and text', () => {
    render(
      <LogEntry time="13:46" author="Ingrid Haugen" category="operations">
        Recompressor tripped on high vibration.
      </LogEntry>
    );
    expect(screen.getByText('13:46')).toBeInTheDocument();
    expect(screen.getByText('Ingrid Haugen')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
    expect(screen.getByText('Recompressor tripped on high vibration.')).toBeInTheDocument();
  });

  it('lists linked items with their kind for assistive technology', () => {
    render(
      <LogEntry time="13:46" author="Ingrid Haugen" category="operations" links={[{ kind: 'work-order', label: 'WO-104482' }]}>
        Text
      </LogEntry>
    );
    expect(screen.getByRole('list', { name: 'Linked items' })).toBeInTheDocument();
    expect(screen.getByText('WO-104482')).toBeInTheDocument();
    expect(screen.getByText('Work order:')).toBeInTheDocument();
  });

  it('marks a pinned entry as a standing instruction', () => {
    render(
      <LogEntry time="06:00" author="Liv Wold" category="safety" pinned>
        Text
      </LogEntry>
    );
    expect(screen.getByText('Standing instruction')).toBeInTheDocument();
  });

  it('shows who acknowledged it and any footer', () => {
    render(
      <LogEntry time="06:00" author="Liv Wold" category="safety" acknowledgedBy="Ingrid Haugen" footer={<p>2 comments</p>}>
        Text
      </LogEntry>
    );
    expect(screen.getByText('Acknowledged by Ingrid Haugen')).toBeInTheDocument();
    expect(screen.getByText('2 comments')).toBeInTheDocument();
  });
});
