import { render, screen } from '@testing-library/react';

import { NotebookCell } from './NotebookCell';

describe(NotebookCell.name, () => {
  it('names the cell by its position and kind', () => {
    render(
      <NotebookCell index={3} kind="result" title="Vibration against load" meta="1.2 s">
        Chart
      </NotebookCell>,
    );

    expect(screen.getByRole('region', { name: 'Cell 3, Result' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vibration against load' })).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('1.2 s')).toBeInTheDocument();
  });

  it('sets code in a code block', () => {
    render(
      <NotebookCell index={2} kind="code">
        {'select avg(value) from vibration'}
      </NotebookCell>,
    );

    expect(screen.getByText('select avg(value) from vibration').tagName).toBe('CODE');
  });
});
