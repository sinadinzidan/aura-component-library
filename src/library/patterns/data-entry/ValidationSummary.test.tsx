import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ValidationSummary } from './ValidationSummary';

const ERRORS = [
  { fieldId: 'title', label: 'Title', message: 'Enter a title.' },
  { fieldId: 'hours', label: 'Estimated hours', message: 'Enter a number between 1 and 40.' },
];

describe(ValidationSummary.name, () => {
  it('renders nothing without errors', () => {
    const { container } = render(<ValidationSummary errors={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('counts the fields in the heading', () => {
    render(<ValidationSummary errors={ERRORS} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Fix 2 fields to continue');
  });

  it('uses the singular for one error', () => {
    render(<ValidationSummary errors={ERRORS.slice(0, 1)} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Fix 1 field to continue');
  });

  it('lists each field with its message', () => {
    render(<ValidationSummary errors={ERRORS} />);

    expect(screen.getByRole('button', { name: 'Estimated hours' })).toBeInTheDocument();
    expect(screen.getByText(/Enter a number between 1 and 40\./)).toBeInTheDocument();
  });

  it('moves focus to the field when its link is activated', async () => {
    render(
      <>
        <ValidationSummary errors={ERRORS} />
        <input id="hours" aria-label="Estimated hours field" />
      </>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Estimated hours' }));

    expect(screen.getByRole('textbox', { name: 'Estimated hours field' })).toHaveFocus();
  });

  it('delegates focus to an injected handler', async () => {
    const focusField = vi.fn();
    render(<ValidationSummary errors={ERRORS} focusField={focusField} />);

    await userEvent.click(screen.getByRole('button', { name: 'Title' }));

    expect(focusField).toHaveBeenCalledWith('title');
  });
});
