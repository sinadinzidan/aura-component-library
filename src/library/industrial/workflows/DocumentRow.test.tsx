import { render, screen } from '@testing-library/react';

import { DocumentRow } from './DocumentRow';
import { documentKindLabel } from './workflow';

describe(DocumentRow.name, () => {
  it('shows title, kind, number, revision and date', () => {
    render(<DocumentRow kind="pid" title="Gas compression, 1st stage" number="NK-23-PID-0101" revision="D" date="4 Feb 2026" />);
    expect(screen.getByText('Gas compression, 1st stage')).toBeInTheDocument();
    expect(screen.getByText('NK-23-PID-0101')).toBeInTheDocument();
    expect(screen.getByText(/P&ID/)).toBeInTheDocument();
    expect(screen.getByText('Rev D')).toBeInTheDocument();
    expect(screen.getByText('4 Feb 2026')).toBeInTheDocument();
  });

  it('carries the kind for styling and tests', () => {
    const { container } = render(<DocumentRow kind="procedure" title="Compressor start-up" revision="03" date="12 Jan 2026" />);
    expect(container.firstChild).toHaveAttribute('data-kind', 'procedure');
  });

  it('renders status and trailing content', () => {
    render(<DocumentRow kind="report" title="Vibration survey" revision="A" date="1 Mar 2026" status={<span>In review</span>} trailing={<button type="button">Download</button>} />);
    expect(screen.getByText('In review')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
  });

  it('exposes the word for each kind', () => {
    expect(documentKindLabel('datasheet')).toBe('Data sheet');
  });
});
