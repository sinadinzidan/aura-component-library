import { toast } from '@cognite/aura/components/sonner-toast';
import { act, render, screen, waitFor } from '@testing-library/react';

import { SingleToaster } from './SingleToaster';

describe(SingleToaster.name, () => {
  afterEach(() => {
    act(() => {
      toast.dismiss();
    });
  });

  it('shows a toast once when two hosts are mounted', async () => {
    render(
      <>
        <SingleToaster />
        <SingleToaster />
      </>
    );

    act(() => {
      toast('Changes saved');
    });

    await waitFor(() => expect(screen.getAllByText('Changes saved')).toHaveLength(1));
  });

  it('renders a single notification region for several hosts', () => {
    const { container } = render(
      <>
        <SingleToaster />
        <SingleToaster />
        <SingleToaster />
      </>
    );

    expect(container.querySelectorAll('section[aria-label^="Notifications"]')).toHaveLength(1);
  });

  it('hands over to the next host when the first unmounts', async () => {
    const first = render(<SingleToaster />);
    render(<SingleToaster />);

    first.unmount();
    act(() => {
      toast('Pipeline started');
    });

    await waitFor(() => expect(screen.getAllByText('Pipeline started')).toHaveLength(1));
  });
});
