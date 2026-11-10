import { AlertButton } from '@cognite/aura/components/alert';
import { render, screen } from '@testing-library/react';

import { Callout } from './Callout';

describe(Callout.name, () => {
  it('is a note, not an interrupting alert', () => {
    render(<Callout title="Units follow the source system">Pressure is shown in barg.</Callout>);

    expect(screen.getByRole('note')).toHaveTextContent('Pressure is shown in barg.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    ['note', 'Note'],
    ['info', 'Information'],
    ['caution', 'Caution'],
    ['critical', 'Warning'],
  ] as const)('reads the %s tone out in words', (tone, spoken) => {
    render(<Callout tone={tone} title="Isolate the compressor first" />);

    expect(screen.getByRole('note')).toHaveTextContent(`${spoken}: Isolate the compressor first`);
    expect(screen.getByRole('note')).toHaveAttribute('data-tone', tone);
  });

  it('renders without a body', () => {
    render(<Callout title="Read-only data set" />);

    expect(screen.getByRole('note')).toHaveTextContent('Note: Read-only data set');
  });

  it('shows the actions it is given', () => {
    render(<Callout title="Procedure superseded" actions={<AlertButton>Open revision 5</AlertButton>} />);

    expect(screen.getByRole('button', { name: 'Open revision 5' })).toBeInTheDocument();
  });
});
