import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { ComponentProps } from 'react';

import { RatingScale } from './RatingScale';

describe(RatingScale.name, () => {
  it('offers one radio per score, 1 to 5 by default', () => {
    renderScale({});

    const group = screen.getByRole('radiogroup', { name: 'How easy was it?' });
    expect(within(group).getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual(['1', '2', '3', '4', '5']);
  });

  it('covers 0 to 10 for a recommendation score', () => {
    renderScale({ min: 0, max: 10 });

    expect(screen.getAllByRole('radio')).toHaveLength(11);
    expect(screen.getByRole('radio', { name: '0' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '10' })).toBeInTheDocument();
  });

  it('preselects nothing', () => {
    renderScale({});

    expect(screen.getAllByRole('radio').some((radio) => (radio instanceof HTMLInputElement ? radio.checked : false))).toBe(false);
  });

  it('reports the chosen score', async () => {
    const onValueChange = vi.fn();
    renderScale({ onValueChange });

    await userEvent.click(screen.getByRole('radio', { name: '4' }));

    expect(onValueChange).toHaveBeenCalledWith(4);
  });

  it('checks the controlled value', () => {
    renderScale({ value: 2 });

    expect(screen.getByRole('radio', { name: '2' })).toBeChecked();
  });

  it('moves through the scores with the arrow keys', async () => {
    render(<StatefulScale />);
    await userEvent.click(screen.getByRole('radio', { name: '2' }));

    await userEvent.keyboard('{ArrowRight}');

    expect(screen.getByRole('radio', { name: '3' })).toBeChecked();
  });

  it('shows what the two ends mean', () => {
    renderScale({ lowLabel: 'Very hard', highLabel: 'Very easy' });

    expect(screen.getByText('Very hard')).toBeInTheDocument();
    expect(screen.getByText('Very easy')).toBeInTheDocument();
  });

  it('reads the word for a score with it and shows it once chosen', () => {
    renderScale({ value: 4, optionLabels: { 4: 'Good' } });

    expect(screen.getByRole('radio', { name: '4, Good' })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('4 · Good');
  });

  it('cannot be answered while disabled', async () => {
    const onValueChange = vi.fn();
    renderScale({ onValueChange, disabled: true });

    await userEvent.click(screen.getByRole('radio', { name: '4' }));

    expect(onValueChange).not.toHaveBeenCalled();
  });
});

function StatefulScale() {
  const [value, setValue] = useState<number | null>(null);
  return <RatingScale label="How easy was it?" value={value} onValueChange={setValue} />;
}

function renderScale(props: Partial<ComponentProps<typeof RatingScale>>) {
  return render(<RatingScale label="How easy was it?" value={null} onValueChange={vi.fn()} {...props} />);
}
