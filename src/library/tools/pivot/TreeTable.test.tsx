import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TreeTable } from './TreeTable';
import type { TreeTableProps } from './TreeTable';
import type { TreeNodeInput } from './treeTable';

const NODES: readonly TreeNodeInput[] = [
  { id: 'nk', parentId: null, label: 'Nordkapp plant', code: 'NK', values: {} },
  { id: 'comp', parentId: 'nk', label: 'Gas compression', code: 'NK-23', values: {} },
  { id: 'ka1', parentId: 'comp', label: '1st stage compressor', code: '23-KA-9101', values: { alarms: 2, downtime: 5 } },
  { id: 'ka3', parentId: 'comp', label: 'Recompressor', code: '23-KA-9103', values: { alarms: 3, downtime: 14.5 } },
  { id: 'exp', parentId: 'nk', label: 'Gas export', code: 'NK-27', values: {} },
  { id: 'pa', parentId: 'exp', label: 'Export pump A', code: '27-PA-2001A', values: { alarms: 0, downtime: 0 } },
];

function renderTree(props: Partial<TreeTableProps> = {}) {
  return render(
    <TreeTable
      label="Alarms and downtime by asset"
      nodes={NODES}
      rollups={{ alarms: 'sum', downtime: 'sum' }}
      rowHeader="Asset"
      columns={[
        { id: 'alarms', title: 'Alarms', render: (value) => (value === null ? '' : String(value)) },
        { id: 'downtime', title: 'Downtime h', render: (value) => (value === null ? '' : value.toFixed(1)) },
      ]}
      {...props}
    />
  );
}

function rowOf(name: RegExp) {
  return screen.getByRole('row', { name });
}

describe(TreeTable.name, () => {
  it('is a treegrid with levels, starting open to the given depth', () => {
    renderTree({ initialDepth: 1 });

    expect(screen.getByRole('treegrid', { name: 'Alarms and downtime by asset' })).toBeInTheDocument();
    expect(rowOf(/Nordkapp plant/)).toHaveAttribute('aria-level', '1');
    expect(rowOf(/Nordkapp plant/)).toHaveAttribute('aria-expanded', 'true');
    expect(rowOf(/Gas compression/)).toHaveAttribute('aria-level', '2');
    expect(rowOf(/Gas compression/)).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('row', { name: /Recompressor/ })).not.toBeInTheDocument();
  });

  it('rolls branch values up', () => {
    renderTree({ initialDepth: 1 });

    expect(within(rowOf(/Gas compression/)).getAllByRole('gridcell').map((cell) => cell.textContent)).toEqual(['5', '19.5']);
    expect(within(rowOf(/Nordkapp plant/)).getAllByRole('gridcell').map((cell) => cell.textContent)).toEqual(['5', '19.5']);
  });

  it('expands a branch with its button', async () => {
    renderTree({ initialDepth: 1 });

    await userEvent.click(screen.getByRole('button', { name: 'Expand Gas compression' }));

    expect(rowOf(/Recompressor/)).toHaveAttribute('aria-level', '3');
    expect(rowOf(/Gas compression/)).toHaveAttribute('aria-expanded', 'true');
  });

  it('expands and collapses everything', async () => {
    renderTree({ initialDepth: 0 });

    await userEvent.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(rowOf(/Export pump A/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(screen.queryByRole('row', { name: /Gas compression/ })).not.toBeInTheDocument();
  });

  it('keeps one row in the tab order', () => {
    renderTree();

    expect(document.querySelectorAll('[data-tree-row][tabindex="0"]')).toHaveLength(1);
  });

  it('moves with Down and opens and enters branches with Right', async () => {
    renderTree({ initialDepth: 1 });

    await userEvent.click(rowOf(/Nordkapp plant/));
    await userEvent.keyboard('{ArrowDown}');
    expect(rowOf(/Gas compression/)).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    expect(rowOf(/Gas compression/)).toHaveAttribute('aria-expanded', 'true');
    expect(rowOf(/Gas compression/)).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    expect(rowOf(/1st stage compressor/)).toHaveFocus();
  });

  it('closes a branch with Left, then goes to its parent', async () => {
    renderTree({ initialDepth: 2 });

    await userEvent.click(rowOf(/Gas compression/));
    await userEvent.keyboard('{ArrowLeft}');
    expect(rowOf(/Gas compression/)).toHaveAttribute('aria-expanded', 'false');

    await userEvent.keyboard('{ArrowLeft}');
    expect(rowOf(/Nordkapp plant/)).toHaveFocus();
  });

  it('jumps to the first and last visible rows', async () => {
    renderTree({ initialDepth: 1 });

    await userEvent.click(rowOf(/Gas compression/));
    await userEvent.keyboard('{End}');
    expect(rowOf(/Gas export/)).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(rowOf(/Nordkapp plant/)).toHaveFocus();
  });

  it('shows placeholders while loading', () => {
    renderTree({ loading: true });

    expect(screen.getByRole('treegrid')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Expand all' })).toBeDisabled();
  });

  it('shows the empty message for no nodes', () => {
    renderTree({ nodes: [], empty: 'No assets in this site' });

    expect(screen.getByText('No assets in this site')).toBeInTheDocument();
  });
});
