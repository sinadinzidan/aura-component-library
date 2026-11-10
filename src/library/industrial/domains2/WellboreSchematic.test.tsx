import { render, screen } from '@testing-library/react';

import { WellboreSchematic } from './WellboreSchematic';

const CASINGS = [
  { label: '20 in conductor', shoeDepth: 400 },
  { label: '13⅜ in surface casing', shoeDepth: 1400 },
  { label: '9⅝ in production casing', shoeDepth: 3200 },
];

function renderSchematic() {
  return render(
    <WellboreSchematic label="NK A-12 H" totalDepth={3500} casings={CASINGS} tubingDepth={2900} packerDepth={2850} perforations={[{ top: 3050, bottom: 3150 }]} />
  );
}

describe(WellboreSchematic.name, () => {
  it('describes the well in its accessible name', () => {
    renderSchematic();

    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Wellbore schematic of NK A-12 H: 3 casing strings, tubing to 2,900 m MD, 1 perforated interval, total depth 3,500 m MD'
    );
  });

  it('draws one casing per string, the tubing, the packer and the perforations', () => {
    const { container } = renderSchematic();

    expect(container.querySelectorAll('[data-slot="wellbore-casing"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-slot="wellbore-tubing"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-slot="wellbore-packer"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-slot="wellbore-perforation"]')).toHaveLength(1);
  });

  it('labels every string with its shoe depth', () => {
    renderSchematic();

    expect(screen.getByText('13⅜ in surface casing').nextElementSibling).toHaveTextContent('1,400 m');
    expect(screen.getByText('Perforations 3,050–3,150')).toBeInTheDocument();
  });

  it('places labels at their depth on the scale', () => {
    renderSchematic();

    expect(screen.getByText('13⅜ in surface casing').parentElement?.style.top).toBe('40%');
  });

  it('moves labels at nearly the same depth apart', () => {
    renderSchematic();

    const top = (text: string) => parseFloat(screen.getByText(text).parentElement?.style.top ?? '');
    const tops = ['Production packer', 'Tubing end', 'Perforations 3,050–3,150', '9⅝ in production casing'].map(top);
    expect(tops).toEqual([80.5, 87, 93.5, 100]);
  });

  it('prints a depth tick at every interval', () => {
    renderSchematic();

    for (const tick of ['0', '500', '1,000', '3,500']) expect(screen.getByText(tick)).toBeInTheDocument();
  });

  it('leaves the packer out when there is none', () => {
    const { container } = render(<WellboreSchematic label="NK A-07" totalDepth={3000} casings={CASINGS.slice(0, 2)} tubingDepth={1200} />);

    expect(container.querySelector('[data-slot="wellbore-packer"]')).toBeNull();
    expect(screen.queryByText('Production packer')).not.toBeInTheDocument();
  });
});
