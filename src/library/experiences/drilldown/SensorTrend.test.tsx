import { render, screen } from '@testing-library/react';

import { fixtureTree } from './drilldownFixture';
import type { DrillNode } from './hierarchy';
import { SensorTrend } from './SensorTrend';

const tree = fixtureTree();
const node = (id: string): DrillNode => {
  const found = tree.byId.get(id);
  if (!found) throw new Error(id);
  return found;
};

describe(SensorTrend.name, () => {
  it('names the sensor, the period and the range it moved in', () => {
    render(<SensorTrend node={node('pt')} period="last 2 hours" />);

    expect(screen.getByLabelText(/Discharge pressure \(23-PT-92531\), last 2 hours: between 47\.9\sbarg and 48\.6\sbarg/)).toBeInTheDocument();
  });

  it('says so when the sensor has no trend', () => {
    render(<SensorTrend node={node('tt')} />);

    expect(screen.getByText('No trend data for 23-TT-92532')).toBeInTheDocument();
  });

  it('says so for a node that is not a sensor', () => {
    render(<SensorTrend node={node('comp-1')} />);

    expect(screen.getByText('No trend data for 23-KA-9101')).toBeInTheDocument();
  });

  it('takes the height of the plot from a utility class', () => {
    render(<SensorTrend node={node('tt')} heightClassName="h-32" />);

    expect(screen.getByText('No trend data for 23-TT-92532')).toHaveClass('h-32');
  });
});
