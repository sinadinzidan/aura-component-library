import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Masthead } from './Masthead';

describe(Masthead.name, () => {
  it('shows the nameplate and the dateline', () => {
    render(<Masthead name="The Nordkapp Handover" date="Thursday 12 March 2026" edition="Day shift to night shift" issue="No. 142" />);

    expect(screen.getByRole('banner')).toHaveTextContent('The Nordkapp Handover');
    expect(screen.getByText('Thursday 12 March 2026')).toBeInTheDocument();
    expect(screen.getByText('No. 142')).toBeInTheDocument();
  });

  it('offers sections as a filter and reports the pick', async () => {
    const onSection = vi.fn();
    render(
      <Masthead
        name="Handover"
        date="12 March"
        edition="Day to night"
        issue="No. 142"
        sections={[
          { id: 'all', label: 'All', count: 7 },
          { id: 'safety', label: 'Safety', count: 2 },
        ]}
        current="all"
        onSection={onSection}
      />
    );

    expect(screen.getByRole('button', { name: 'All 7' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Safety 2' }));
    expect(onSection).toHaveBeenCalledWith('safety');
  });
});
