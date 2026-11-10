import { render, screen, within } from '@testing-library/react';

import { BoxPane } from './BoxPane';

describe(BoxPane.name, () => {
  it('is a region named by its title, with the title as a heading', () => {
    render(<BoxPane title="Process tree">Body</BoxPane>);

    const pane = screen.getByRole('region', { name: 'Process tree' });
    expect(within(pane).getByRole('heading', { name: 'Process tree' })).toBeInTheDocument();
  });

  it('frames the content with box-drawing corners', () => {
    const { container } = render(<BoxPane title="Tags">Body</BoxPane>);

    const frame = container.querySelector('[data-slot="box-pane-frame"]')?.textContent ?? '';
    for (const corner of ['┌', '┐', '└', '┘']) expect(frame).toContain(corner);
  });

  it('keeps the frame characters away from assistive technology', () => {
    const { container } = render(<BoxPane title="Tags">Body</BoxPane>);

    for (const node of container.querySelectorAll('span')) {
      if (/[┌┐└┘─│]/.test(node.textContent ?? '')) expect(node).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('shows meta text in the top border', () => {
    render(
      <BoxPane title="Alarm log" meta="3 unacknowledged">
        Body
      </BoxPane>
    );

    expect(screen.getByText(/3 unacknowledged/)).toBeInTheDocument();
  });

  it('marks the active pane', () => {
    render(
      <BoxPane title="Trend" active>
        Body
      </BoxPane>
    );

    expect(screen.getByRole('region', { name: 'Trend' })).toHaveAttribute('data-active', 'true');
  });

  it('keeps the semantics of its content', () => {
    render(
      <BoxPane title="Tags">
        <table>
          <tbody>
            <tr>
              <td>23-PT-92531</td>
            </tr>
          </tbody>
        </table>
      </BoxPane>
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
