import { render, screen, within } from '@testing-library/react';

import { ShareBarList } from './ShareBarList';

const ITEMS = [
  { id: 'gt', label: 'Compressor gas turbine', value: 60, detail: '23-GT-9001' },
  { id: 'pumps', label: 'Export pumps', value: 30 },
  { id: 'other', label: 'Utilities', value: 10 },
];

describe(ShareBarList.name, () => {
  it('lists every item with its value and unit', () => {
    render(<ShareBarList label="Energy use by consumer" items={ITEMS} unit="MW" />);

    const rows = within(screen.getByRole('list', { name: 'Energy use by consumer' })).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('Compressor gas turbine23-GT-900160 MW');
  });

  it('scales the bars to the largest item', () => {
    const { container } = render(<ShareBarList label="Energy use by consumer" items={ITEMS} />);

    const widths = [...container.querySelectorAll<HTMLElement>('[data-slot="share-bar"]')].map((bar) => bar.style.width);
    expect(widths).toEqual(['100%', '50%', `${(10 / 60) * 100}%`]);
  });

  it('scales the bars to a given maximum', () => {
    const { container } = render(<ShareBarList label="Energy use by consumer" items={ITEMS} max={120} />);

    expect(container.querySelector<HTMLElement>('[data-slot="share-bar"]')?.style.width).toBe('50%');
  });

  it('prints each share of the total when asked', () => {
    const { container } = render(<ShareBarList label="Energy use by consumer" items={ITEMS} showShare />);

    const shares = [...container.querySelectorAll('[data-slot="share"]')].map((share) => share.textContent);
    expect(shares).toEqual(['60%', '30%', '10%']);
  });

  it('leaves shares out by default', () => {
    const { container } = render(<ShareBarList label="Energy use by consumer" items={ITEMS} />);

    expect(container.querySelectorAll('[data-slot="share"]')).toHaveLength(0);
  });
});
