import { fireEvent, render, screen } from '@testing-library/react';
import { useReducer } from 'react';

import { fixtureTree } from './drilldownFixture';
import { createDrillReducer, createDrillState } from './drillReducer';
import { TreemapCanvas } from './TreemapCanvas';

const tree = fixtureTree();
const reducer = createDrillReducer(tree);
const DOWNTIME = { key: 'downtimeHours', label: 'Downtime', unit: 'h' };

function Harness({ startId, metric = DOWNTIME }: { startId?: string; metric?: typeof DOWNTIME }) {
  const [state, dispatch] = useReducer(reducer, createDrillState(tree, { startId }));
  return (
    <>
      <TreemapCanvas tree={tree} state={state} dispatch={dispatch} metric={metric} label="Treemap" animate={false} renderLeaf={(node) => <p>Trend of {node.tag}</p>} />
      <output>{`${state.path.join('/')}|${state.hoverId ?? ''}`}</output>
    </>
  );
}

const canvas = () => screen.getByRole('group', { name: 'Treemap' });
const status = () => screen.getByRole('status', { name: '' }).textContent;

describe(TreemapCanvas.name, () => {
  it('draws one rectangle per child, named with metric and state', () => {
    render(<Harness />);

    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Area NK-23 Gas compression: Downtime 47 h, 2 of 2 need attention' })).toBeInTheDocument();
  });

  it('gives the larger value the larger rectangle', () => {
    render(<Harness />);
    const big = screen.getByRole('button', { name: /NK-23/ }).parentElement;
    const small = screen.getByRole('button', { name: /NK-20/ }).parentElement;

    expect(parseFloat(big?.style.width ?? '0') * parseFloat(big?.style.height ?? '0')).toBeGreaterThan(
      parseFloat(small?.style.width ?? '0') * parseFloat(small?.style.height ?? '0')
    );
  });

  it('tones abnormal rectangles and adds their state in words', () => {
    render(<Harness startId="area-b" />);
    const tripped = screen.getByRole('button', { name: /Recompressor/ });

    expect(tripped).toHaveAttribute('data-tone', 'critical');
    expect(tripped).toHaveClass('bg-critical-background');
    expect(tripped).toHaveTextContent('Tripped');
    expect(tripped.querySelector('svg')).toBeInTheDocument();
  });

  it('keeps normal rectangles neutral, without an icon', () => {
    render(<Harness />);
    const normal = screen.getByRole('button', { name: /NK-20/ });

    expect(normal).toHaveAttribute('data-tone', 'neutral');
    expect(normal.querySelector('svg')).not.toBeInTheDocument();
  });

  it('zooms into a rectangle on click and shows its children', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: /NK-23/ }));

    expect(status()).toBe('site/area-b|');
    expect(screen.getByRole('button', { name: /23-KA-9103 Recompressor/ })).toBeInTheDocument();
    expect(canvas()).toHaveAttribute('data-level', 'area');
  });

  it('hands the canvas to the leaf renderer at the bottom of the tree', () => {
    render(<Harness startId="pt" />);

    expect(screen.getByText('Trend of 23-PT-92531')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('reports the rectangle under the pointer and clears it on leaving', () => {
    render(<Harness />);

    fireEvent.mouseEnter(screen.getByRole('button', { name: /NK-23/ }));
    expect(status()).toBe('site|area-b');

    fireEvent.mouseLeave(canvas());
    expect(status()).toBe('site|');
  });

  it('is driven from the keyboard: arrows move, Enter goes in, Escape goes up', () => {
    render(<Harness />);

    fireEvent.keyDown(canvas(), { key: 'ArrowRight' });
    expect(canvas().getAttribute('aria-activedescendant')).toBe(screen.getByRole('button', { name: /NK-23/ }).id);

    fireEvent.keyDown(canvas(), { key: 'Enter' });
    expect(status()).toBe('site/area-b|');

    fireEvent.keyDown(canvas(), { key: 'Escape' });
    expect(status()).toBe('site|');
  });

  it('keeps zero values on the canvas', () => {
    render(<Harness startId="comp-1" />);

    expect(screen.getByRole('button', { name: /23-TT-92532 Discharge temperature: Downtime 0 h/ })).toBeInTheDocument();
  });
});
