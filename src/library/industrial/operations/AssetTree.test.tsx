import { fireEvent, render, screen } from '@testing-library/react';

import { indexAssetTree } from './assetTree';
import type { AssetTreeInput } from './assetTree';
import { AssetTree } from './AssetTree';

describe(AssetTree.name, () => {
  it('shows the top level and opens the branches it is told to', () => {
    render(<AssetTree nodes={NODES} defaultExpandedItems={['plant']} />);

    expect(screen.getByText('Nordkapp plant')).toBeInTheDocument();
    expect(screen.getByText('Gas compression')).toBeInTheDocument();
    expect(screen.queryByText('Recompressor')).not.toBeInTheDocument();
  });

  it('rolls open alarms up to a collapsed branch', () => {
    render(<AssetTree nodes={NODES} showAlarms />);

    expect(screen.getByLabelText('3 open alarms, worst critical')).toBeInTheDocument();
  });

  it('shows the worst state below a branch and the own state of a leaf', () => {
    render(<AssetTree nodes={NODES} showState defaultExpandedItems={['plant', 'compression']} />);

    expect(screen.getAllByRole('img', { name: 'Worst state below: Tripped' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('img', { name: 'Running' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Tripped' })).toBeInTheDocument();
  });

  it('turns watch and poor health into a badge and leaves good as a number', () => {
    render(<AssetTree nodes={NODES} showHealth defaultExpandedItems={['plant', 'compression']} />);

    expect(screen.getByText('Poor · 41')).toBeInTheDocument();
    expect(screen.getByLabelText('Health 88, good')).toBeInTheDocument();
  });

  it('leads with the tag in monospace when tag-first', () => {
    render(<AssetTree nodes={NODES} display="tag-first" showSecondary defaultExpandedItems={['plant', 'compression']} />);

    expect(screen.getByText('23-KA-9103')).toHaveClass('font-mono');
    expect(screen.getByText('Recompressor')).toBeInTheDocument();
  });

  it('reports the row a user selects and marks the selected row', () => {
    const onSelect = vi.fn();
    render(<AssetTree nodes={NODES} selectedId="plant" onSelect={onSelect} defaultExpandedItems={['plant']} />);

    fireEvent.click(screen.getByRole('button', { name: 'Gas compression' }));

    expect(onSelect).toHaveBeenCalledWith('compression');
    expect(screen.getByRole('button', { name: 'Nordkapp plant' })).toHaveAttribute('aria-current', 'true');
  });

  it('adds checkboxes for multi-select', () => {
    render(<AssetTree nodes={NODES} checkboxes />);

    expect(screen.getByRole('checkbox', { name: 'Select Nordkapp plant' })).toBeInTheDocument();
  });
});

const ASSETS: readonly AssetTreeInput[] = [
  { id: 'plant', tag: 'NK', name: 'Nordkapp plant', parentId: null, state: 'running' },
  { id: 'compression', tag: 'NK-23', name: 'Gas compression', parentId: 'plant', state: 'running' },
  { id: 'ka-1', tag: '23-KA-9102', name: '2nd stage compressor', parentId: 'compression', state: 'running', health: 'good', healthScore: 88, alarms: ['high'] },
  { id: 'ka-2', tag: '23-KA-9103', name: 'Recompressor', parentId: 'compression', state: 'tripped', health: 'poor', healthScore: 41, alarms: ['critical', 'medium'] },
];

const NODES = indexAssetTree(ASSETS);
