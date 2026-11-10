import { TabsPanel } from '@cognite/aura/components/tabs';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PageTabsHeader } from './PageTabsHeader';
import type { PageTab } from './PageTabsHeader';

const TABS: readonly PageTab[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'alarms', label: 'Alarms', count: 4 },
  { value: 'documents', label: 'Documents', count: 1284, disabled: true },
];

describe(PageTabsHeader.name, () => {
  it('shows the title, description and actions above the tabs', () => {
    render(
      <PageTabsHeader
        title="1st stage compressor"
        description="23-KA-9101"
        actions={<button type="button">Create work order</button>}
        tabs={TABS}
        value="overview"
        onValueChange={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: '1st stage compressor' })).toBeInTheDocument();
    expect(screen.getByText('23-KA-9101')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create work order' })).toBeInTheDocument();
  });

  it('marks the tab for the current value as selected', () => {
    render(<PageTabsHeader title="Compressor" tabs={TABS} value="alarms" onValueChange={vi.fn()} />);

    expect(screen.getByRole('tab', { name: /Alarms/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Overview/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('reports the tab the user picks', async () => {
    const onValueChange = vi.fn();
    render(<PageTabsHeader title="Compressor" tabs={TABS} value="overview" onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole('tab', { name: /Alarms/ }));

    expect(onValueChange).toHaveBeenCalledWith('alarms');
  });

  it('shows counts compactly', () => {
    render(<PageTabsHeader title="Compressor" tabs={TABS} value="overview" onValueChange={vi.fn()} />);

    expect(screen.getByRole('tab', { name: /Alarms/ })).toHaveTextContent('4');
    expect(screen.getByRole('tab', { name: /Documents/ })).toHaveTextContent('1.3k');
  });

  it('renders only the panel of the current tab', () => {
    render(
      <PageTabsHeader title="Compressor" tabs={TABS} value="alarms" onValueChange={vi.fn()}>
        <TabsPanel value="overview">Overview content</TabsPanel>
        <TabsPanel value="alarms">Alarm content</TabsPanel>
      </PageTabsHeader>
    );

    expect(screen.getByText('Alarm content')).toBeInTheDocument();
    expect(screen.queryByText('Overview content')).not.toBeInTheDocument();
  });
});
