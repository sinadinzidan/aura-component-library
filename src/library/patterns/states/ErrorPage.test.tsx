import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ErrorPage } from './ErrorPage';

describe(ErrorPage.name, () => {
  it('says what happened and what to do', () => {
    render(<ErrorPage type="not-found" code="404" title="Page not found" description="The link may be old." />);

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('The link may be old.')).toBeInTheDocument();
  });

  it('renders the actions and details it is given', () => {
    render(
      <ErrorPage
        type="error-generic"
        title="Scheduled maintenance"
        description="Back soon."
        details={<p>Until 06:00</p>}
        actions={<button type="button">Check status</button>}
      />
    );

    expect(screen.getByText('Until 06:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check status' })).toBeInTheDocument();
  });

  it('copies the reference', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    render(
      <ErrorPage
        type="error-generic"
        title="Something went wrong"
        description="Try again."
        reference="req-7f3a91c2"
        writeText={writeText}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(writeText).toHaveBeenCalledWith('req-7f3a91c2');
    expect(await screen.findByRole('button', { name: /Copied/ })).toBeInTheDocument();
  });

  it('shows no reference line without a reference', () => {
    render(<ErrorPage type="no-access" title="Access denied" description="Ask an owner." />);

    expect(screen.queryByText(/Reference/)).not.toBeInTheDocument();
  });
});
