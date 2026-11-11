import { render, screen } from '@testing-library/react';

import { LogEntry } from './LogEntry';

describe(LogEntry.name, () => {
  it('shows when, who, the category and the text', () => {
    render(
      <ul>
        <LogEntry time="13:46" category="equipment" author="Ingrid Haugen" role="Control room operator" text="Recompressor tripped on high vibration." links={<span>23-KA-9103</span>} />
      </ul>
    );

    expect(screen.getByText('13:46')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ingrid Haugen' })).toBeInTheDocument();
    expect(screen.getByText('23-KA-9103')).toBeInTheDocument();
  });

  it('marks a pinned entry and renders the acknowledgement and children', () => {
    render(
      <ul>
        <LogEntry time="06:10" category="instruction" author="Liv Wold" text="Keep export pump B in manual." pinned acknowledgement={<button type="button">Acknowledge</button>}>
          <p>One comment</p>
        </LogEntry>
      </ul>
    );

    expect(screen.getByRole('listitem')).toHaveAttribute('data-pinned', 'true');
    expect(screen.getByText('Pinned · Standing instruction')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acknowledge' })).toBeInTheDocument();
    expect(screen.getByText('One comment')).toBeInTheDocument();
  });

  it('collapses to one line when dense', () => {
    render(
      <ul>
        <LogEntry density="dense" time="14:10" category="operations" author="Ingrid Haugen" text="Export reduced." />
      </ul>
    );

    expect(screen.getByRole('listitem')).toHaveAttribute('data-tone', 'blue');
    expect(screen.queryByRole('img')).toBeNull();
  });
});
