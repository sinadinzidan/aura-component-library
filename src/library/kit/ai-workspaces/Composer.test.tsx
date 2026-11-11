import { fireEvent, render, screen } from '@testing-library/react';

import { Composer } from './Composer';

describe(Composer.name, () => {
  it('sends the trimmed text on Enter and keeps Shift+Enter for a new line', () => {
    const onSend = vi.fn();
    render(<Composer label="Ask about the plant" value="  Why did it trip?  " onChange={vi.fn()} onSend={onSend} />);
    const field = screen.getByLabelText('Ask about the plant');

    fireEvent.keyDown(field, { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();

    fireEvent.keyDown(field, { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('Why did it trip?');
  });

  it('does not send an empty prompt', () => {
    const onSend = vi.fn();
    render(<Composer label="Ask" value="   " onChange={vi.fn()} onSend={onSend} />);

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    fireEvent.keyDown(screen.getByLabelText('Ask'), { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('reports typing and lists the context', () => {
    const onChange = vi.fn();
    render(<Composer label="Ask" value="" onChange={onChange} onSend={vi.fn()} context={['23-KA-9103', 'Last 24 h']} />);

    fireEvent.change(screen.getByLabelText('Ask'), {
      target: { value: 'Compare' },
    });

    expect(onChange).toHaveBeenCalledWith('Compare');
    expect(screen.getByRole('list', { name: 'Context' })).toHaveTextContent('23-KA-9103');
  });

  it('says why it is disabled', () => {
    render(<Composer label="Ask" value="Hello" onChange={vi.fn()} onSend={vi.fn()} disabledReason="Connect a data source first." />);

    expect(screen.getByLabelText('Ask')).toBeDisabled();
    expect(screen.getByText('Connect a data source first.')).toBeInTheDocument();
  });
});
