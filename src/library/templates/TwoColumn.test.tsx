import { render, screen } from '@testing-library/react';

import { TwoColumn } from './TwoColumn';

describe(TwoColumn.name, () => {
  it('renders the main content and a named secondary column', () => {
    render(<TwoColumn aside={<p>Properties</p>}>Description</TwoColumn>);

    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Details' })).toHaveTextContent('Properties');
  });

  it('gives the main column two thirds by default', () => {
    render(<TwoColumn aside="Side">Main</TwoColumn>);

    expect(screen.getByText('Main')).toHaveClass('@3xl:col-span-2');
    expect(screen.getByText('Main').parentElement).toHaveClass('grid-cols-1', '@3xl:grid-cols-3');
  });

  it('splits evenly for a comparison', () => {
    render(
      <TwoColumn ratio="1:1" aside="Side">
        Main
      </TwoColumn>
    );

    expect(screen.getByText('Main').parentElement).toHaveClass('@3xl:grid-cols-2');
  });

  it('gives the main column three quarters when asked', () => {
    render(
      <TwoColumn ratio="3:1" aside="Side">
        Main
      </TwoColumn>
    );

    expect(screen.getByText('Main')).toHaveClass('@3xl:col-span-3');
  });

  it('moves the secondary column to the start', () => {
    render(
      <TwoColumn asideSide="start" aside="Side" asideLabel="Filters">
        Main
      </TwoColumn>
    );

    expect(screen.getByRole('complementary', { name: 'Filters' })).toHaveClass('@3xl:-order-1');
  });

  it('pins the secondary column while the main one scrolls', () => {
    render(
      <TwoColumn stickyAside aside="Side">
        Main
      </TwoColumn>
    );

    expect(screen.getByRole('complementary')).toHaveClass('@3xl:sticky');
  });
});
