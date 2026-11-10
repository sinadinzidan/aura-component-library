import { render, screen } from '@testing-library/react';

import { ChangeDiff } from './ChangeDiff';

describe(ChangeDiff.name, () => {
  it('shows the field with the old and new value', () => {
    render(<ChangeDiff field="Priority" before="P3" after="P1" />);

    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('P3')).toBeInTheDocument();
    expect(screen.getByText('P1')).toBeInTheDocument();
  });

  it('marks the old value as deleted and the new one as inserted', () => {
    render(<ChangeDiff field="Priority" before="P3" after="P1" />);

    expect(screen.getByText('P3').tagName).toBe('DEL');
    expect(screen.getByText('P1').tagName).toBe('INS');
  });

  it('spells the change out for screen readers', () => {
    const { container } = render(<ChangeDiff field="Priority" before="P3" after="P1" />);

    expect(container).toHaveTextContent('Prioritychanged fromP3toP1');
  });

  it('shows a placeholder when the property was empty before', () => {
    render(<ChangeDiff field="Assignee" after="Tomás Barros" />);

    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.getByText('Tomás Barros').tagName).toBe('INS');
  });

  it('shows a placeholder when the property was cleared', () => {
    render(<ChangeDiff field="Due date" before="14 Mar" emptyValue="Not set" />);

    expect(screen.getByText('14 Mar').tagName).toBe('DEL');
    expect(screen.getByText('Not set')).toBeInTheDocument();
  });

  it('uses monospace values when asked', () => {
    render(<ChangeDiff field="High limit" before="52.0" after="50.0" mono />);

    expect(screen.getByText('50.0')).toHaveClass('font-mono');
  });
});
