import { render, screen } from '@testing-library/react';

import { SchemaView } from './SchemaView';

describe(SchemaView.name, () => {
  it('shows the schema as JSON with a copy button', async () => {
    const { container } = render(<SchemaView schema={{ title: 'Inspection', fields: [{ id: 'tag', type: 'text', label: 'Tag', required: true }] }} />);

    expect(await screen.findByRole('button', { name: 'Copy JSON schema' })).toBeInTheDocument();
    expect(container.textContent).toContain('"required"');
    expect(container.textContent).toContain('Inspection');
  });
});
