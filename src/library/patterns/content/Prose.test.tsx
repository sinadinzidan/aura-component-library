import { render, screen } from '@testing-library/react';

import { Prose } from './Prose';

describe(Prose.name, () => {
  it('renders semantic content as it is', () => {
    render(
      <Prose>
        <h2>Start-up after a trip</h2>
        <p>Confirm the cause before resetting.</p>
      </Prose>
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Start-up after a trip' })).toBeInTheDocument();
    expect(screen.getByText('Confirm the cause before resetting.')).toBeInTheDocument();
  });

  it('caps the line length at the reading measure by default', () => {
    render(
      <Prose>
        <p>Text</p>
      </Prose>
    );

    expect(screen.getByText('Text').parentElement).toHaveClass('max-w-[37.5rem]');
  });

  it('can drop the measure inside a narrower column', () => {
    render(
      <Prose measure={false}>
        <p>Text</p>
      </Prose>
    );

    expect(screen.getByText('Text').parentElement).not.toHaveClass('max-w-[37.5rem]');
  });

  it('renders the requested element and size', () => {
    render(
      <Prose as="article" size="base">
        <p>Text</p>
      </Prose>
    );

    const article = screen.getByRole('article');
    expect(article).toHaveClass('text-base');
    expect(article).not.toHaveClass('text-sm');
  });
});
