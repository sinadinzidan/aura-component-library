import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Replay } from './Replay';

describe(Replay.name, () => {
  it('starts at run 0 with a play button', () => {
    render(<Replay>{(run) => <p>Run {run}</p>}</Replay>);

    expect(screen.getByText('Run 0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('counts up and switches to the replay label when pressed', async () => {
    render(<Replay>{(run) => <p>Run {run}</p>}</Replay>);

    await userEvent.click(screen.getByRole('button', { name: 'Play' }));

    expect(screen.getByText('Run 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Replay' })).toBeInTheDocument();
  });

  it('remounts the content on every run so mount animations start again', async () => {
    render(<Replay>{() => <p data-testid="content">Moving</p>}</Replay>);
    const first = screen.getByTestId('content');

    await userEvent.click(screen.getByRole('button', { name: 'Play' }));

    expect(screen.getByTestId('content')).not.toBe(first);
  });

  it('reports each run to onReplay', async () => {
    const onReplay = vi.fn();
    render(<Replay onReplay={onReplay}>{() => <p>Moving</p>}</Replay>);

    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    await userEvent.click(screen.getByRole('button', { name: 'Replay' }));

    expect(onReplay).toHaveBeenNthCalledWith(1, 1);
    expect(onReplay).toHaveBeenNthCalledWith(2, 2);
  });

  it('shows the caption and custom labels', () => {
    render(
      <Replay playLabel="Play entrance" caption="200 ms, entrance easing">
        {() => <p>Moving</p>}
      </Replay>
    );

    expect(screen.getByRole('button', { name: 'Play entrance' })).toBeInTheDocument();
    expect(screen.getByText('200 ms, entrance easing')).toBeInTheDocument();
  });
});
