import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';

import { TagList } from './TagList';

const TAGS = ['rotating', 'critical', 'compressor', 'vibration', 'bearing'];

function renderList(props: Partial<ComponentProps<typeof TagList>> = {}) {
  return render(
    <TooltipProvider>
      <TagList label="Labels" tags={TAGS} {...props} />
    </TooltipProvider>
  );
}

describe(TagList.name, () => {
  it('shows every tag when there is no limit', () => {
    renderList();

    expect(within(screen.getByRole('list', { name: 'Labels' })).getAllByRole('listitem')).toHaveLength(5);
  });

  it('folds tags past the limit into a count', () => {
    renderList({ max: 2 });

    expect(screen.getByText('rotating')).toBeInTheDocument();
    expect(screen.queryByText('compressor')).not.toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('names the hidden tags on the count', () => {
    renderList({ max: 2 });

    expect(screen.getByLabelText('3 more: compressor, vibration, bearing')).toHaveAttribute('tabindex', '0');
  });

  it('shows no count when everything fits', () => {
    renderList({ max: 5 });

    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('can show only the count', () => {
    renderList({ max: 0 });

    expect(screen.getByText('+5')).toBeInTheDocument();
  });

  it('sets identifiers in monospace', () => {
    renderList({ tags: ['23-KA-9101'], mono: true });

    expect(screen.getByText('23-KA-9101')).toHaveClass('font-mono');
  });
});
