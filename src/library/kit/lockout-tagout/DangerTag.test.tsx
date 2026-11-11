import { render, screen } from '@testing-library/react';

import { DangerTag } from './DangerTag';

describe(DangerTag.name, () => {
  it('names the tag and warning for assistive technology', () => {
    render(<DangerTag warning="Do not operate" tag="23-XV-9130" point="Suction valve" position="Closed" lock="R-114" by="Tomás Barros" date="12 Mar, 09:40" certificate="IC-2291" />);

    expect(screen.getByRole('article', { name: 'Danger tag for 23-XV-9130: Do not operate' })).toBeInTheDocument();
    expect(screen.getByText('Danger')).toBeInTheDocument();
    expect(screen.getByText('Do not operate')).toBeInTheDocument();
  });

  it('lists the fields a person reads before touching the point', () => {
    render(<DangerTag warning="Do not close" tag="82-EN-9103" point="Motor breaker" position="Open and racked out" lock="R-113" by="Jonas Nyberg" date="12 Mar, 09:32" certificate="IC-2291" />);

    expect(screen.getByText('Keep')).toBeInTheDocument();
    expect(screen.getByText('Open and racked out')).toBeInTheDocument();
    expect(screen.getByText('R-113')).toBeInTheDocument();
    expect(screen.getByText('Jonas Nyberg')).toBeInTheDocument();
    expect(screen.getByText('IC-2291')).toBeInTheDocument();
  });
});
