import { render, screen, within } from '@testing-library/react';

import { FormatExamples } from './FormatExamples';

describe(FormatExamples.name, () => {
  it('names the table with its caption', () => {
    render(<FormatExamples caption="Number formats" rows={[]} />);

    expect(screen.getByRole('table', { name: 'Number formats' })).toBeInTheDocument();
  });

  it('shows the label, the function and its result on one row', () => {
    render(
      <FormatExamples
        caption="Numbers"
        rows={[{ id: 'flow', label: 'Gas flow', code: 'formatValue(182400)', output: '182,400' }]}
      />
    );

    const row = screen.getByRole('row', { name: /Gas flow/ });
    expect(within(row).getByText('formatValue(182400)')).toBeInTheDocument();
    expect(within(row).getByText('182,400')).toBeInTheDocument();
  });

  it('leaves out the function column when no row has code', () => {
    render(<FormatExamples caption="Numbers" rows={[{ id: 'a', label: 'Range', output: '40–52' }]} />);

    expect(screen.queryByRole('columnheader', { name: 'Function' })).not.toBeInTheDocument();
  });

  it('strikes through the form to avoid and announces it', () => {
    render(
      <FormatExamples caption="Numbers" rows={[{ id: 'delta', label: 'Drop', output: '−1.4', avoid: '-1.4' }]} />
    );

    expect(screen.getByRole('columnheader', { name: 'Avoid' })).toBeInTheDocument();
    expect(screen.getByText('-1.4').tagName).toBe('S');
    expect(screen.getByText('Avoid:')).toBeInTheDocument();
  });

  it('shows a rule column only when a row has a note', () => {
    render(
      <FormatExamples caption="Numbers" rows={[{ id: 'a', label: 'Unit', output: '48.6 barg', note: 'Space before unit' }]} />
    );

    expect(screen.getByRole('columnheader', { name: 'Rule' })).toBeInTheDocument();
    expect(screen.getByText('Space before unit')).toBeInTheDocument();
  });

  it('uses custom column headers', () => {
    render(
      <FormatExamples
        caption="Dates"
        outputHeader="Shown as"
        codeHeader="Formatter"
        rows={[{ id: 'a', label: 'Date', code: 'formatDate(t)', output: '12 Mar' }]}
      />
    );

    expect(screen.getByRole('columnheader', { name: 'Shown as' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Formatter' })).toBeInTheDocument();
  });
});
