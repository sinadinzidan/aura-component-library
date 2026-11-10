import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SourceList } from './SourceList';
import type { SourceItem } from './SourceList';

const SOURCES: readonly SourceItem[] = [
  { id: 'ts', title: '23-VT-92740', href: 'https://fusion.nordkapp.test/timeseries/23-VT-92740', kind: 'timeseries' },
  { id: 'doc', title: 'Compressor manual', href: 'https://fusion.nordkapp.test/files/manual.pdf', kind: 'file' },
];

describe(SourceList.name, () => {
  it('counts the sources in its title', () => {
    render(<SourceList sources={SOURCES} />);

    expect(screen.getByText('2 sources')).toBeInTheDocument();
  });

  it('uses the singular for one source', () => {
    render(<SourceList sources={SOURCES.slice(0, 1)} />);

    expect(screen.getByText('1 source')).toBeInTheDocument();
  });

  it('links every source to its target in a new tab', () => {
    render(<SourceList sources={SOURCES} />);

    const link = screen.getByRole('link', { name: 'Compressor manual' });
    expect(link).toHaveAttribute('href', 'https://fusion.nordkapp.test/files/manual.pdf');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('starts closed when collapsible and opens on click', async () => {
    render(<SourceList sources={SOURCES} collapsible />);
    const trigger = screen.getByRole('button', { name: '2 sources' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders nothing without sources', () => {
    const { container } = render(<SourceList sources={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
