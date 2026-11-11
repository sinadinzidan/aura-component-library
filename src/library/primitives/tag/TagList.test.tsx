import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TagList } from './TagList';

const TAGS = ['vibration', 'bearing', 'compressor', 'rotating', 'P1'];

describe(TagList.name, () => {
  it('lists every tag when there is no limit', () => {
    render(<TagList label="Labels" tags={TAGS} />);

    expect(within(screen.getByRole('list', { name: 'Labels' })).getAllByRole('listitem')).toHaveLength(5);
  });

  it('folds tags past the limit into a +N tag that names them', () => {
    render(<TagList label="Labels" tags={TAGS} max={2} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.getByText('more: compressor, rotating, P1', { exact: false })).toHaveClass('sr-only');
    expect(screen.queryByText('compressor')).not.toBeInTheDocument();
  });

  it('makes the overflow tag reachable by keyboard', async () => {
    render(<TagList label="Labels" tags={TAGS} max={2} />);

    await userEvent.tab();

    expect(screen.getByText('+3').closest('[data-slot="tag-main"]')).toHaveFocus();
  });

  it('shows no overflow tag when everything fits', () => {
    render(<TagList label="Labels" tags={TAGS} max={5} />);

    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('accepts items with their own id and colour', () => {
    render(<TagList label="Disciplines" tags={[{ id: 'mech', label: 'Mechanical', colorKey: 'mech' }]} />);

    expect(screen.getByText('Mechanical').closest('[data-slot="tag"]')).toHaveAttribute(
      'data-variant',
      expect.stringMatching(/^decorative-/)
    );
  });

  it('reports the id of a removed tag', async () => {
    const onRemove = vi.fn();
    render(<TagList label="Labels" tags={TAGS} onRemove={onRemove} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove bearing' }));

    expect(onRemove).toHaveBeenCalledWith('bearing');
  });
});
