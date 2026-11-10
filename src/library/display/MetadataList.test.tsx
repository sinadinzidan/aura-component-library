import { render, screen } from '@testing-library/react';

import { MetadataList } from './MetadataList';

describe(MetadataList.name, () => {
  it('renders each label with its value as a description list', () => {
    render(<MetadataList items={[{ label: 'Tag', value: '23-KA-9101' }]} />);

    expect(screen.getByRole('term')).toHaveTextContent('Tag');
    expect(screen.getByRole('definition')).toHaveTextContent('23-KA-9101');
  });

  it.each([undefined, null, ''])('shows a placeholder when the value is %s', (value) => {
    render(<MetadataList items={[{ label: 'Assignee', value }]} />);

    expect(screen.getByRole('definition')).toHaveTextContent('—');
  });

  it('keeps a zero value instead of treating it as missing', () => {
    render(<MetadataList items={[{ label: 'Open alarms', value: 0 }]} />);

    expect(screen.getByRole('definition')).toHaveTextContent('0');
  });

  it('uses a custom placeholder', () => {
    render(<MetadataList items={[{ label: 'Assignee' }]} emptyValue="Unassigned" />);

    expect(screen.getByRole('definition')).toHaveTextContent('Unassigned');
  });

  it('puts separators only between inline entries', () => {
    render(
      <MetadataList
        layout="inline"
        items={[
          { label: 'Tag', value: '23-KA-9101' },
          { label: 'Area', value: 'Gas compression' },
          { label: 'Criticality', value: 'A' },
        ]}
      />
    );

    expect(screen.getAllByRole('separator')).toHaveLength(2);
    expect(screen.getByText('Gas compression')).toBeInTheDocument();
  });

  it('renders no separator for a single inline entry', () => {
    render(<MetadataList layout="inline" items={[{ label: 'Tag', value: '23-KA-9101' }]} />);

    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });
});
