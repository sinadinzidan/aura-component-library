import { render, screen } from '@testing-library/react';

import { DoDont } from './DoDont';

describe(DoDont.name, () => {
  it('labels a correct example with the word "Do"', () => {
    render(<DoDont kind="do">Save changes</DoDont>);

    expect(screen.getByText('Do')).toBeInTheDocument();
    expect(screen.getByText('Save changes')).toBeInTheDocument();
  });

  it('labels an example to avoid with the word "Don\'t"', () => {
    render(<DoDont kind="dont">Submit</DoDont>);

    expect(screen.getByText("Don't")).toBeInTheDocument();
    expect(screen.getByRole('figure')).toHaveAttribute('data-kind', 'dont');
  });

  it('shows the caption as the figure caption', () => {
    render(
      <DoDont kind="do" caption="Name the outcome.">
        Delete pipeline
      </DoDont>
    );

    expect(screen.getByText('Name the outcome.').tagName).toBe('FIGCAPTION');
  });

  it('uses a custom verdict label when given', () => {
    render(
      <DoDont kind="dont" label="Avoid">
        OK
      </DoDont>
    );

    expect(screen.getByText('Avoid')).toBeInTheDocument();
    expect(screen.queryByText("Don't")).not.toBeInTheDocument();
  });

  it('uses an outlined frame instead of the grey well when asked', () => {
    render(
      <DoDont kind="do" surface="outline">
        <span>Field</span>
      </DoDont>
    );

    expect(screen.getByText('Field').parentElement).toHaveClass('border');
    expect(screen.getByText('Field').parentElement).not.toHaveClass('bg-muted-background');
  });
});
