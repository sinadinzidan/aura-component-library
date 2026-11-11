import { fireEvent, render, screen } from '@testing-library/react';

import { MixDonut, type MixSegment } from './MixDonut';

const SEGMENTS: MixSegment[] = [
  { id: 'gas', label: 'Fuel gas', value: 60, tone: 'amber' },
  { id: 'grid', label: 'Grid import', value: 30, tone: 'blue' },
  { id: 'wind', label: 'Wind', value: 10, tone: 'teal' },
];

describe(MixDonut.name, () => {
  it('names the ring and offers one button per segment with its value and share', () => {
    render(<MixDonut label="Energy in by source" segments={SEGMENTS} selected={null} onSelect={vi.fn()} unit="MW" />);

    expect(screen.getByRole('group', { name: 'Energy in by source' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Fuel gas: 60 MW, 60 percent' })).toHaveAttribute('data-tone', 'amber');
  });

  it('picks a segment on click and with the keyboard', () => {
    const onSelect = vi.fn();
    render(<MixDonut label="Mix" segments={SEGMENTS} selected={null} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /Grid import/ }));
    fireEvent.keyDown(screen.getByRole('button', { name: /Wind/ }), { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('button', { name: /Wind/ }), { key: 'Tab' });

    expect(onSelect.mock.calls).toEqual([['grid'], ['wind']]);
  });

  it('marks the picked segment and returns to the whole when it is picked again', () => {
    const onSelect = vi.fn();
    render(<MixDonut label="Mix" segments={SEGMENTS} selected="grid" onSelect={onSelect} />);

    const picked = screen.getByRole('button', { name: /Grid import/ });
    expect(picked).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Fuel gas/ })).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(picked);
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('writes the share on segments that are large enough', () => {
    render(<MixDonut label="Mix" segments={SEGMENTS} selected={null} onSelect={vi.fn()} shareFrom={20} />);

    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.queryByText('10%')).not.toBeInTheDocument();
  });

  it('shows its children in the middle', () => {
    render(
      <MixDonut label="Mix" segments={SEGMENTS} selected={null} onSelect={vi.fn()} shareFrom={0}>
        <span>100 MW</span>
      </MixDonut>
    );

    expect(screen.getByText('100 MW')).toBeInTheDocument();
    expect(screen.queryByText('60%')).not.toBeInTheDocument();
  });
});
