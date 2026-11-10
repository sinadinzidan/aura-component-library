import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TruncatedText } from './TruncatedText';

const TEXT = 'Nordkapp / Gas compression / 1st stage compressor / Drive-end vibration';

describe(TruncatedText.name, () => {
  it('always renders the text itself', () => {
    renderText(true);

    expect(screen.getByText(TEXT)).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows the full text in a tooltip on focus when it is cut off', async () => {
    renderText(true);

    await userEvent.tab();

    expect(await screen.findAllByText(TEXT)).toHaveLength(2);
  });

  it('shows no tooltip when the text fits', async () => {
    const isTruncated = renderText(false);

    await userEvent.tab();

    expect(isTruncated).toHaveBeenCalled();
    expect(screen.getAllByText(TEXT)).toHaveLength(1);
  });
});

function renderText(truncated: boolean) {
  const isTruncated = vi.fn(() => truncated);
  render(
    <TooltipProvider>
      <TruncatedText text={TEXT} isTruncated={isTruncated} />
    </TooltipProvider>
  );
  return isTruncated;
}
