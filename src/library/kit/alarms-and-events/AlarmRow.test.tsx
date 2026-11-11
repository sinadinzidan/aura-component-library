import { fireEvent, render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { AlarmRow, type AlarmRowProps } from './AlarmRow';

const BASE: AlarmRowProps = {
  severity: 'Critical',
  tone: 'critical',
  icon: <svg data-testid="icon" />,
  message: 'Recompressor tripped on high vibration',
  tag: '23-VT-92740',
  value: '11.6 mm/s',
  limit: '11.0 mm/s',
  state: 'Active',
  age: '14 min ago',
};

function renderRow(props: Partial<AlarmRowProps> = {}) {
  render(
    <ul>
      <AlarmRow {...BASE} {...props} />
    </ul>
  );
  return screen.getByRole(props.onSelect ? 'option' : 'listitem');
}

describe(AlarmRow.name, () => {
  it('shows message, tag, value against limit, state and age', () => {
    const row = renderRow();

    expect(row).toHaveTextContent('Recompressor tripped on high vibration');
    expect(row).toHaveTextContent('23-VT-92740');
    expect(row).toHaveTextContent('11.6 mm/s');
    expect(row).toHaveTextContent('limit 11.0 mm/s');
    expect(row).toHaveTextContent('Active');
    expect(row).toHaveTextContent('14 min ago');
  });

  it('carries the tone and names the priority in words', () => {
    const row = renderRow();

    expect(row).toHaveAttribute('data-tone', 'critical');
    expect(row).toHaveTextContent('Critical');
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('marks a dealt-with alarm as quiet', () => {
    expect(renderRow({ quiet: true, state: 'Acknowledged' })).toHaveAttribute('data-quiet', 'true');
  });

  it('is a card in studio and a block row in console', () => {
    const { unmount } = render(
      <ul>
        <AlarmRow {...BASE} />
      </ul>
    );
    expect(screen.getByRole('listitem')).toHaveAttribute('data-anatomy', 'card');
    unmount();

    render(
      <LookScope look="console">
        <ul>
          <AlarmRow {...BASE} />
        </ul>
      </LookScope>
    );
    expect(screen.getByRole('listitem')).toHaveAttribute('data-anatomy', 'block');
  });

  it('selects on click, Enter and Space when selectable', () => {
    const onSelect = vi.fn();
    const row = renderRow({ onSelect, selected: true });

    expect(row).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(row);
    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: ' ' });
    fireEvent.keyDown(row, { key: 'a' });
    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  it('renders markers and actions', () => {
    renderRow({ markers: <span>Chattering ×9</span>, actions: <button type="button">Acknowledge</button> });

    expect(screen.getByText('Chattering ×9')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acknowledge' })).toBeInTheDocument();
  });
});
