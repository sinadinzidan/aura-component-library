import { render, screen } from '@testing-library/react';

import { DocumentCard } from './DocumentCard';
import type { DocumentRecord } from './documents';

const DOC: DocumentRecord = { id: 'NK-23-PR-0012', kind: 'procedure', title: 'Compressor start-up procedure', revision: '05', date: '12 Jan 2026', approval: 'in-review', pages: 14 };

describe(DocumentCard.name, () => {
  it('shows the kind, title, number, approval and size of the document', () => {
    render(<DocumentCard document={DOC} />);

    expect(screen.getByRole('article', { name: 'NK-23-PR-0012, Compressor start-up procedure' })).toBeInTheDocument();
    expect(screen.getByText('Procedure')).toBeInTheDocument();
    expect(screen.getByText('NK-23-PR-0012')).toBeInTheDocument();
    expect(screen.getByText('In review')).toBeInTheDocument();
    expect(screen.getByText('14 pages · 12 Jan 2026')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'First page of NK-23-PR-0012' })).toBeInTheDocument();
  });

  it('writes a single page in the singular', () => {
    render(<DocumentCard document={{ ...DOC, pages: 1 }} />);

    expect(screen.getByText('1 page · 12 Jan 2026')).toBeInTheDocument();
  });

  it('lays out as a row and renders actions', () => {
    render(<DocumentCard document={DOC} layout="row" actions={<button type="button">Open</button>} />);

    expect(screen.getByRole('article')).toHaveAttribute('data-layout', 'row');
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
  });
});
