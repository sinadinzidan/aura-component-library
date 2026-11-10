import { fireEvent, render, screen } from '@testing-library/react';
import { useReducer } from 'react';

import { fixtureTree } from './drilldownFixture';
import { createDrillReducer, createDrillState } from './drillReducer';
import { SunburstChart } from './SunburstChart';

const tree = fixtureTree();
const reducer = createDrillReducer(tree);

function Harness({ startId }: { startId?: string }) {
  const [state, dispatch] = useReducer(reducer, createDrillState(tree, { startId }));
  return (
    <>
      <SunburstChart tree={tree} state={state} dispatch={dispatch} label="Sunburst" animate={false} />
      <output>{`${state.path.join('/')}|${state.hoverId ?? ''}`}</output>
    </>
  );
}

const chart = () => screen.getByRole('group', { name: 'Sunburst' });
const status = () => screen.getByRole('status', { name: '' }).textContent;
const arc = (name: RegExp) => screen.getByRole('button', { name });

describe(SunburstChart.name, () => {
  it('draws a segment for every node below the centre', () => {
    const { container } = render(<Harness />);

    expect(container.querySelectorAll('[data-slot="sunburst-arc"]')).toHaveLength(tree.byId.size - 1);
    expect(arc(/Area NK-23 Gas compression: 2 of 2 need attention/)).toBeInTheDocument();
    expect(arc(/Sensor 23-VT-92740/)).toHaveAttribute('data-tone', 'critical');
  });

  it('names the current node in the centre with state and headline figure', () => {
    render(<Harness />);
    const centre = screen.getByRole('button', { name: /Site Nordkapp plant, 1 of 2 need attention\. Top level/ });

    expect(centre).toHaveTextContent('Nordkapp plant');
    expect(centre).toHaveTextContent('91%');
    expect(centre).toBeDisabled();
  });

  it('re-roots on the clicked segment, at any depth', () => {
    const { container } = render(<Harness />);

    fireEvent.click(arc(/Equipment 23-KA-9101/));

    expect(status()).toBe('site/area-b/comp-1|');
    expect(container.querySelectorAll('[data-slot="sunburst-arc"]')).toHaveLength(2);
    expect(chart()).toHaveAttribute('data-level', 'equipment');
  });

  it('goes up when the centre disc is clicked', () => {
    render(<Harness startId="comp-1" />);

    fireEvent.click(screen.getByRole('button', { name: /Go up to Gas compression/ }));

    expect(status()).toBe('site/area-b|');
  });

  it('lights up the path to a hovered segment and dims the rest', () => {
    render(<Harness />);

    fireEvent.mouseEnter(arc(/Sensor 23-PT-92531/));

    expect(status()).toBe('site|pt');
    expect(arc(/Sensor 23-PT-92531/)).toHaveClass('stroke-primary-background');
    expect(arc(/Equipment 23-KA-9101/)).toHaveClass('stroke-primary-background');
    expect(arc(/Area NK-23/)).toHaveClass('stroke-primary-background');
    expect(arc(/Area NK-20/)).toHaveAttribute('opacity', '0.35');
  });

  it('clears the highlight when the pointer leaves the chart', () => {
    render(<Harness />);
    fireEvent.mouseEnter(arc(/Sensor 23-PT-92531/));

    fireEvent.mouseLeave(chart());

    expect(status()).toBe('site|');
  });

  it('turns into a gauge of the value on a sensor', () => {
    const { container } = render(<Harness startId="pt" />);

    expect(container.querySelector('[data-slot="sunburst-gauge"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="sunburst-arc"]')).toHaveLength(0);
    expect(screen.getByText('High 52')).toBeInTheDocument();
    expect(screen.getByText('Trip 55')).toBeInTheDocument();
  });

  it('is driven from the keyboard', () => {
    render(<Harness />);

    fireEvent.keyDown(chart(), { key: 'ArrowRight' });
    expect(status()).toBe('site|area-b');

    fireEvent.keyDown(chart(), { key: 'Enter' });
    expect(status()).toBe('site/area-b|');

    fireEvent.keyDown(chart(), { key: 'Escape' });
    expect(status()).toBe('site|');
  });

  it('marks abnormal segments with a shape as well as a tint', () => {
    const { container } = render(<Harness startId="comp-3" />);

    expect(arc(/Sensor 23-VT-92740/)).toHaveClass('fill-critical-background');
    expect(container.querySelector('[data-slot="sunburst-label"]')).toHaveTextContent('◆ 23-VT-92740');
  });
});
