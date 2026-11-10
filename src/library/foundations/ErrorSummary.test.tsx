import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ErrorSummary } from './ErrorSummary';

const ERRORS = [
  { fieldId: 'tag', message: 'Tag: use the format 23-KA-9101' },
  { fieldId: 'limit', message: 'High limit: enter a number above 40' },
];

describe(ErrorSummary.name, () => {
  it('renders nothing when there are no errors', () => {
    const { container } = render(<ErrorSummary errors={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('announces itself as an alert with a count', () => {
    render(<ErrorSummary errors={ERRORS} />);

    expect(screen.getByRole('alert')).toHaveTextContent('2 fields need attention');
  });

  it('uses the singular for one error', () => {
    render(<ErrorSummary errors={[ERRORS[0]]} />);

    expect(screen.getByRole('alert')).toHaveTextContent('1 field needs attention');
  });

  it('links each message to its field', () => {
    render(<ErrorSummary errors={ERRORS} />);

    expect(screen.getByRole('link', { name: ERRORS[1].message })).toHaveAttribute('href', '#limit');
  });

  it('moves focus to the field when its message is activated', async () => {
    render(
      <>
        <ErrorSummary errors={ERRORS} />
        <input id="tag" aria-label="Tag" />
        <input id="limit" aria-label="High limit" />
      </>
    );

    await userEvent.click(screen.getByRole('link', { name: ERRORS[1].message }));

    expect(screen.getByRole('textbox', { name: 'High limit' })).toHaveFocus();
  });

  it('uses a custom title and finder', async () => {
    const field = document.createElement('input');
    document.body.appendChild(field);
    const findField = vi.fn(() => field);
    render(<ErrorSummary errors={[ERRORS[0]]} title="Fix the tag to continue" findField={findField} />);

    await userEvent.click(screen.getByRole('link', { name: ERRORS[0].message }));

    expect(screen.getByText('Fix the tag to continue')).toBeInTheDocument();
    expect(findField).toHaveBeenCalledWith('tag');
    expect(field).toHaveFocus();
    field.remove();
  });
});
