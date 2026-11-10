import { render, screen } from '@testing-library/react';

import { Sidebar } from './Sidebar';

describe(Sidebar.name, () => {
  it('renders a named region with header, body and footer', () => {
    render(
      <Sidebar label="Sidebar" header={<span>Nordkapp</span>} footer={<span>Ingrid Haugen</span>}>
        <nav aria-label="Main" />
      </Sidebar>
    );

    const sidebar = screen.getByRole('complementary', { name: 'Sidebar' });
    expect(sidebar).toHaveTextContent('Nordkapp');
    expect(sidebar).toHaveTextContent('Ingrid Haugen');
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('is full width by default and narrow when collapsed', () => {
    const { rerender } = render(<Sidebar label="Sidebar">Body</Sidebar>);
    expect(screen.getByRole('complementary')).toHaveClass('w-60');

    rerender(
      <Sidebar label="Sidebar" collapsed>
        Body
      </Sidebar>
    );

    expect(screen.getByRole('complementary')).toHaveClass('w-14');
  });

  it('uses the fixed-dark surface for dark chrome', () => {
    render(
      <Sidebar label="Sidebar" tone="dark">
        Body
      </Sidebar>
    );

    expect(screen.getByRole('complementary')).toHaveClass('bg-popover-background-fixed-dark');
  });

  it('draws its rule on the side facing the content', () => {
    render(
      <Sidebar label="Filters" side="right">
        Body
      </Sidebar>
    );

    expect(screen.getByRole('complementary')).toHaveClass('border-l');
  });
});
