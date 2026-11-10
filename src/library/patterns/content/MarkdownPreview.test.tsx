import { render, screen, within } from '@testing-library/react';

import { MarkdownPreview } from './MarkdownPreview';

describe(MarkdownPreview.name, () => {
  it('renders headings, paragraphs and lists as semantic elements', () => {
    render(<MarkdownPreview source={'# Start-up\nConfirm the cause.\n\n1. Isolate\n2. Vent\n\n- Seal gas'} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Start-up' })).toBeInTheDocument();
    expect(screen.getByText('Confirm the cause.')).toBeInTheDocument();
    const [ordered, bullets] = screen.getAllByRole('list');
    expect(ordered.tagName).toBe('OL');
    expect(within(ordered).getAllByRole('listitem')).toHaveLength(2);
    expect(bullets.tagName).toBe('UL');
  });

  it('formats bold, italic and code inside a line', () => {
    render(<MarkdownPreview source="Open **XV-1105** to `25%`, _slowly_." />);

    expect(screen.getByText('XV-1105').tagName).toBe('STRONG');
    expect(screen.getByText('25%').tagName).toBe('CODE');
    expect(screen.getByText('slowly').tagName).toBe('EM');
  });

  it('renders quotes and fenced code', () => {
    const { container } = render(<MarkdownPreview source={'> Do not restart.\n\n```\nSELECT 1\n```'} />);

    expect(container.querySelector('blockquote')).toHaveTextContent('Do not restart.');
    expect(container.querySelector('pre code')).toHaveTextContent('SELECT 1');
  });

  it('shows typed HTML as text instead of rendering it', () => {
    const { container } = render(<MarkdownPreview source={'<img src=x onerror="alert(1)"> hello'} />);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('<img src=x onerror="alert(1)"> hello')).toBeInTheDocument();
  });

  it('says so when there is nothing to preview', () => {
    render(<MarkdownPreview source="  " emptyText="Write a note to see it here." />);

    expect(screen.getByText('Write a note to see it here.')).toBeInTheDocument();
  });
});
