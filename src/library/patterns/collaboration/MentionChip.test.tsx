import { render, screen } from '@testing-library/react';

import { MentionChip } from './MentionChip';

describe(MentionChip.name, () => {
  it('shows the name with an at sign', () => {
    render(<MentionChip name="Aisha Khan" />);

    expect(screen.getByText('@Aisha Khan')).toBeInTheDocument();
  });

  it('says in words when the mention is of the reader', () => {
    render(<MentionChip name="Ingrid Haugen" self />);

    expect(screen.getByText('(you)')).toBeInTheDocument();
  });

  it('does not mark other people as the reader', () => {
    render(<MentionChip name="Aisha Khan" />);

    expect(screen.queryByText('(you)')).not.toBeInTheDocument();
  });
});
