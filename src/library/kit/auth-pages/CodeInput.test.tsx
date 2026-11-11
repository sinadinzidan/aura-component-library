import { fireEvent, render, screen } from '@testing-library/react';

import { CodeInput } from './CodeInput';

describe(CodeInput.name, () => {
  it('reports the cleaned code as it is typed or pasted', () => {
    const onChange = vi.fn();
    render(<CodeInput label="Verification code" value="" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Verification code'), {
      target: { value: '481 20x' },
    });

    expect(onChange).toHaveBeenCalledWith('48120');
  });

  it('marks a wrong code as invalid', () => {
    render(<CodeInput label="Verification code" value="111111" onChange={vi.fn()} invalid />);

    expect(screen.getByLabelText('Verification code')).toHaveAttribute('aria-invalid', 'true');
  });
});
