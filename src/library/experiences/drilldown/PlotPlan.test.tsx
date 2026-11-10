import { fireEvent, render, screen } from '@testing-library/react';
import { useReducer } from 'react';

import { fixtureTree } from './drilldownFixture';
import { createDrillReducer, createDrillState } from './drillReducer';
import { layoutPlan } from './planLayout';
import { PlotPlan } from './PlotPlan';

const tree = fixtureTree();
const layout = layoutPlan(tree);
const reducer = createDrillReducer(tree);

function Harness({ startId }: { startId?: string }) {
  const [state, dispatch] = useReducer(reducer, createDrillState(tree, { startId }));
  return (
    <>
      <PlotPlan
        tree={tree}
        layout={layout}
        state={state}
        dispatch={dispatch}
        label="Plot plan"
        animate={false}
        links={[{ from: 'area-a', to: 'area-b' }]}
        sensorCard={(node) => <p>Card for {node.tag}</p>}
      />
      <output>{state.path.join('/')}</output>
    </>
  );
}

const plan = () => screen.getByRole('group', { name: 'Plot plan' });
const path = () => screen.getByRole('status', { name: '' }).textContent;

describe(PlotPlan.name, () => {
  it('shows area blocks with roll-up figures at site level, and nothing deeper', () => {
    const { container } = render(<Harness />);

    expect(plan()).toHaveAttribute('data-level', 'site');
    expect(screen.getByRole('button', { name: /Open area NK-23 Gas compression: 2 of 2 need attention/ })).toBeInTheDocument();
    expect(screen.getAllByText('Open alarms')).toHaveLength(2);
    expect(container.querySelector('[data-slot="plot-plan-equipment"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="plot-plan-sensor"]')).not.toBeInTheDocument();
  });

  it('reveals equipment with its state after zooming into an area', () => {
    const { container } = render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: /Open area NK-23/ }));

    expect(path()).toBe('site/area-b');
    expect(screen.getByRole('button', { name: 'Open 23-KA-9103 Recompressor: Tripped' })).toBeInTheDocument();
    expect(screen.getByText('Tripped')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="plot-plan-sensor"]')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Open area/ })).not.toBeInTheDocument();
  });

  it('reveals measurement points with live values on a machine', () => {
    render(<Harness startId="comp-1" />);

    expect(screen.getByRole('button', { name: 'Open 23-TT-92532 Discharge temperature: Above high limit' })).toBeInTheDocument();
    expect(screen.getByText('146.3')).toBeInTheDocument();
    expect(screen.getByText('Above high limit')).toBeInTheDocument();
  });

  it('shows the card for a selected measurement point', () => {
    const { container } = render(<Harness startId="comp-1" />);

    fireEvent.click(screen.getByRole('button', { name: /Open 23-PT-92531/ }));

    expect(path()).toBe('site/area-b/comp-1/pt');
    expect(screen.getByText('Card for 23-PT-92531')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="plot-plan-selection"]')).toBeInTheDocument();
  });

  it('drills in with the keyboard and goes up with Escape', () => {
    render(<Harness />);

    fireEvent.keyDown(plan(), { key: 'ArrowRight' });
    fireEvent.keyDown(plan(), { key: 'Enter' });
    expect(path()).toBe('site/area-b');

    fireEvent.keyDown(plan(), { key: 'Enter' });
    expect(path()).toBe('site/area-b/comp-1');

    fireEvent.keyDown(plan(), { key: 'Escape' });
    fireEvent.keyDown(plan(), { key: 'Backspace' });
    expect(path()).toBe('site');
  });

  it('points assistive technology at the child the keyboard is on', () => {
    render(<Harness />);
    const first = plan().getAttribute('aria-activedescendant');

    fireEvent.keyDown(plan(), { key: 'ArrowRight' });

    expect(first).toBe(screen.getByRole('button', { name: /Open area NK-20/ }).id);
    expect(plan().getAttribute('aria-activedescendant')).toBe(screen.getByRole('button', { name: /Open area NK-23/ }).id);
  });

  it('jumps sideways to another machine without going up first', () => {
    render(<Harness startId="comp-1" />);

    fireEvent.click(screen.getByRole('button', { name: /Open 23-KA-9103/ }));

    expect(path()).toBe('site/area-b/comp-3');
  });

  it('draws process links between areas', () => {
    const { container } = render(<Harness />);

    expect(container.querySelectorAll('[data-slot="plot-plan-link"]')).toHaveLength(1);
  });

  it('announces where you are', () => {
    render(<Harness startId="area-b" />);

    expect(screen.getByText('Area: Gas compression. 2 equipment.')).toHaveAttribute('aria-live', 'polite');
  });
});
