import { render, screen } from '@testing-library/react';

import type { ChangeKind } from './changeKind';
import { ChangeMarker } from './ChangeMarker';

const KINDS: readonly [ChangeKind, string][] = [
  ['added', 'Added'],
  ['removed', 'Removed'],
  ['changed', 'Changed'],
  ['unchanged', 'Unchanged'],
];

describe(ChangeMarker.name, () => {
  it.each(KINDS)('labels %s in words', (kind, label) => {
    render(<ChangeMarker kind={kind} />);

    expect(screen.getByText(label).closest('[data-slot="change-marker"]')).toHaveAttribute('data-kind', kind);
  });

  it('keeps the word for assistive technology when only the icon shows', () => {
    render(<ChangeMarker kind="added" iconOnly />);

    expect(screen.getByText('Added')).toHaveClass('sr-only');
  });

  it('takes a custom label', () => {
    render(<ChangeMarker kind="added" label="Only in B" />);

    expect(screen.getByText('Only in B')).toBeInTheDocument();
  });
});
