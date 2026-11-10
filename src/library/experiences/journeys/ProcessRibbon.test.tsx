import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProcessRibbon } from './ProcessRibbon';
import type { RibbonStation } from './ProcessRibbon';

const STATIONS: RibbonStation[] = [
  { id: 'inlet', label: 'Inlet', tag: 'NK-20', caption: '14.2 barg' },
  { id: 'separation', label: 'Separation', tag: '20-VA-1001' },
  { id: 'compression', label: 'Compression', tag: '23-KA-9101', status: { tone: 'warning', label: '1 alarm' } },
  { id: 'export', label: 'Export', tag: 'NK-27' },
];

describe(ProcessRibbon.name, () => {
  it('lists every station as a button under the route name', () => {
    render(<ProcessRibbon stations={STATIONS} activeIndex={0} onSelect={vi.fn()} label="Gas route" />);

    expect(screen.getByRole('list', { name: 'Gas route' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(screen.getByText('20-VA-1001')).toBeInTheDocument();
  });

  it('marks the active station as the current step', () => {
    render(<ProcessRibbon stations={STATIONS} activeIndex={2} onSelect={vi.fn()} label="Gas route" />);

    expect(screen.getByRole('button', { name: /Compression/ })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: /Inlet/ })).not.toHaveAttribute('aria-current');
  });

  it('reports the clicked station', async () => {
    const onSelect = vi.fn();
    render(<ProcessRibbon stations={STATIONS} activeIndex={0} onSelect={onSelect} label="Gas route" />);

    await userEvent.click(screen.getByRole('button', { name: /Export/ }));

    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it('places the marker over the active station and sizes the travelled line', () => {
    const { container } = render(<ProcessRibbon stations={STATIONS} activeIndex={2} onSelect={vi.fn()} label="Gas route" />);

    expect(container.querySelector('[data-slot="ribbon-marker"]')).toHaveStyle({ left: '62.5%' });
    expect(container.querySelector('[data-slot="ribbon-travelled"]')).toHaveStyle({ left: '12.5%', width: '50%' });
    expect(screen.getByText('You are here')).toBeInTheDocument();
  });

  it('shows an abnormal station with a labelled status', () => {
    render(<ProcessRibbon stations={STATIONS} activeIndex={0} onSelect={vi.fn()} label="Gas route" />);

    expect(screen.getByText('1 alarm')).toBeInTheDocument();
  });

  it('clamps an out-of-range active index and renders nothing for an empty route', () => {
    const { container, rerender } = render(<ProcessRibbon stations={STATIONS} activeIndex={12} onSelect={vi.fn()} label="Gas route" />);
    expect(screen.getByRole('button', { name: /Export/ })).toHaveAttribute('aria-current', 'step');

    rerender(<ProcessRibbon stations={[]} activeIndex={0} onSelect={vi.fn()} label="Gas route" />);
    expect(container).toBeEmptyDOMElement();
  });
});
