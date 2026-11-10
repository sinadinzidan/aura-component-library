import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { ShareLinkField } from './ShareLinkField';

const URL = 'https://fusion.cognite.test/nordkapp/dashboards/compression?range=24h';

describe(ShareLinkField.name, () => {
  it('shows the link in a labelled read-only field', () => {
    renderField({});

    const field = screen.getByRole('textbox', { name: 'Link to this view' });
    expect(field).toHaveValue(URL);
    expect(field).toHaveAttribute('readonly');
  });

  it('copies the link and confirms in place', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    renderField({ writeText });

    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }));

    expect(writeText).toHaveBeenCalledWith(URL);
    await waitFor(() => expect(screen.getByRole('button', { name: /Link copied/ })).toBeInTheDocument());
  });

  it('ties the hint to the field', () => {
    renderField({ hint: 'Only people with access can open this link.' });

    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Only people with access can open this link.');
  });

  it('keeps the accessible name when the visible label is hidden', () => {
    renderField({ hideLabel: true });

    expect(screen.getByRole('textbox', { name: 'Link to this view' })).toBeInTheDocument();
    expect(screen.queryByText('Link to this view')).not.toBeInTheDocument();
  });
});

function renderField(props: Partial<ComponentProps<typeof ShareLinkField>>) {
  return render(<ShareLinkField label="Link to this view" url={URL} writeText={() => Promise.resolve()} {...props} />);
}
