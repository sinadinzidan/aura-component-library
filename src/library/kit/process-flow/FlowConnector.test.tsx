import { render, screen } from '@testing-library/react';

import { FlowConnector } from './FlowConnector';

describe(FlowConnector.name, () => {
  it('names what flows along the line', () => {
    render(<FlowConnector label="131.2 t/h" />);

    expect(screen.getByRole('img', { name: 'Flow, 131.2 t/h' })).toHaveAttribute('data-state', 'flowing');
  });

  it('drops the arrow head when nothing flows', () => {
    const { container } = render(<FlowConnector state="stopped" />);

    expect(screen.getByRole('img', { name: 'No flow' })).toBeInTheDocument();
    expect(container.querySelector('path')).toBeNull();
  });
});
