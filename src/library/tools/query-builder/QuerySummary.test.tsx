import { render, screen } from '@testing-library/react';

import { cond, group, TEST_FIELDS } from './fixtures';
import { ROOT_ID } from './queryModel';
import { QueryChips, QuerySentence } from './QuerySummary';

const ROOT = group(ROOT_ID, 'and', [cond('c1', 'state', 'is', { a: 'running' }), group('g1', 'or', [cond('c2', 'score', 'lt', { a: '50' }), cond('c3', 'overdue', 'is-true')])]);

describe(QuerySentence.name, () => {
  it('writes the query as a sentence', () => {
    render(<QuerySentence root={ROOT} fields={TEST_FIELDS} noun="Assets" />);

    expect(screen.getByText('Assets where State is Running and (Health score is below 50 % or Overdue is true).')).toBeInTheDocument();
  });

  it('counts incomplete conditions it left out', () => {
    render(<QuerySentence root={ROOT} fields={TEST_FIELDS} noun="Assets" ignored={2} />);

    expect(screen.getByText('2 incomplete conditions are ignored.')).toBeInTheDocument();
  });
});

describe(QueryChips.name, () => {
  it('shows one chip per top-level part', () => {
    render(<QueryChips root={ROOT} fields={TEST_FIELDS} noun="assets" />);

    expect(screen.getByRole('list', { name: 'Query summary' }).querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByText('State is Running')).toBeInTheDocument();
    expect(screen.getByText('Any of 2 conditions')).toBeInTheDocument();
  });

  it('shows the combinator between chips', () => {
    render(<QueryChips root={ROOT} fields={TEST_FIELDS} noun="assets" />);

    expect(screen.getByText('and')).toBeInTheDocument();
  });

  it('says all records for an empty query', () => {
    render(<QueryChips root={group(ROOT_ID, 'and', [])} fields={TEST_FIELDS} noun="assets" />);

    expect(screen.getByText('All assets')).toBeInTheDocument();
  });
});
