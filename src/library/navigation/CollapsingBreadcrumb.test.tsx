import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CollapsingBreadcrumb } from './CollapsingBreadcrumb';
import type { BreadcrumbTrailItem } from './CollapsingBreadcrumb';

const TRAIL: readonly BreadcrumbTrailItem[] = [
  { id: 'nk', label: 'Nordkapp plant' },
  { id: 'nk-23', label: 'Gas compression' },
  { id: '23-ka-9101', label: '1st stage compressor' },
  { id: 'sensors', label: 'Sensors' },
  { id: 'pt-92531', label: 'Discharge pressure' },
];

describe(CollapsingBreadcrumb.name, () => {
  it('shows a short trail in full', () => {
    renderTrail(TRAIL.slice(0, 3));

    expect(screen.getByRole('button', { name: 'Nordkapp plant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gas compression' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show hidden pages' })).not.toBeInTheDocument();
  });

  it('renders the last item as the current page, not as a control', () => {
    renderTrail(TRAIL.slice(0, 3));

    const current = screen.getByText('1st stage compressor');

    expect(current).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('button', { name: '1st stage compressor' })).not.toBeInTheDocument();
  });

  it('keeps the first item and the last two when the trail is too deep', () => {
    renderTrail(TRAIL);

    expect(screen.getByRole('button', { name: 'Nordkapp plant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sensors' })).toBeInTheDocument();
    expect(screen.getByText('Discharge pressure')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByText('Gas compression')).not.toBeInTheDocument();
  });

  it('reaches the hidden pages through the overflow menu', async () => {
    const onNavigate = vi.fn();
    renderTrail(TRAIL, onNavigate);

    await userEvent.click(screen.getByRole('button', { name: 'Show hidden pages' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Gas compression' }));

    expect(onNavigate).toHaveBeenCalledWith(TRAIL[1]);
  });

  it('reports the ancestor that was clicked', async () => {
    const onNavigate = vi.fn();
    renderTrail(TRAIL.slice(0, 3), onNavigate);

    await userEvent.click(screen.getByRole('button', { name: 'Gas compression' }));

    expect(onNavigate).toHaveBeenCalledWith(TRAIL[1]);
  });

  it('renders ancestors with a URL as real links', () => {
    renderTrail([{ id: 'assets', label: 'Assets', href: 'https://fusion.test/assets' }, TRAIL[2]]);

    expect(screen.getByRole('link', { name: 'Assets' })).toHaveAttribute('href', 'https://fusion.test/assets');
  });

  it('respects a custom limit', () => {
    render(
      <TooltipProvider>
        <CollapsingBreadcrumb items={TRAIL} maxVisible={5} />
      </TooltipProvider>
    );

    expect(screen.getByRole('button', { name: 'Gas compression' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show hidden pages' })).not.toBeInTheDocument();
  });

  it('renders nothing for an empty trail', () => {
    const { container } = renderTrail([]);

    expect(container).toBeEmptyDOMElement();
  });
});

function renderTrail(items: readonly BreadcrumbTrailItem[], onNavigate?: (item: BreadcrumbTrailItem) => void) {
  return render(
    <TooltipProvider>
      <CollapsingBreadcrumb items={items} onNavigate={onNavigate} />
    </TooltipProvider>
  );
}
