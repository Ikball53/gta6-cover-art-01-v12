// Shared state for the cover studio: layouts, grades, sizes and the
// per-panel photo placement the editor manipulates.

export const EXPORT_SIZES = [
  { id: '1080x1080', w: 1080, h: 1080, label: '1080 × 1080' },
  { id: '1080x1350', w: 1080, h: 1350, label: '1080 × 1350' },
  { id: '1920x1080', w: 1920, h: 1080, label: '1920 × 1080' },
];

// Panel rectangles as fractions of the cover, per layout.
export const LAYOUTS = {
  trio: {
    label: 'Three tall',
    panels: [
      { x: 0.0, y: 0.0, w: 0.34, h: 0.78 },
      { x: 0.34, y: 0.0, w: 0.33, h: 0.78 },
      { x: 0.67, y: 0.0, w: 0.33, h: 0.78 },
    ],
  },
  grid4: {
    label: 'Four grid',
    panels: [
      { x: 0.0, y: 0.0, w: 0.5, h: 0.39 },
      { x: 0.5, y: 0.0, w: 0.5, h: 0.39 },
      { x: 0.0, y: 0.39, w: 0.5, h: 0.39 },
      { x: 0.5, y: 0.39, w: 0.5, h: 0.39 },
    ],
  },
  hero: {
    label: 'Hero + two',
    panels: [
      { x: 0.0, y: 0.0, w: 0.62, h: 0.78 },
      { x: 0.62, y: 0.0, w: 0.38, h: 0.39 },
      { x: 0.62, y: 0.39, w: 0.38, h: 0.39 },
    ],
  },
};

// Colour grades: a duotone wash plus a vignette, applied per panel.
export const GRADES = {
  sunset: {
    label: 'Vice sunset',
    top: 'rgba(255, 94, 58, 0.55)',
    bottom: 'rgba(64, 12, 96, 0.6)',
    filter: 'saturate(1.35) contrast(1.08)',
  },
  neon: {
    label: 'Neon night',
    top: 'rgba(25, 211, 255, 0.4)',
    bottom: 'rgba(255, 46, 136, 0.5)',
    filter: 'saturate(1.5) contrast(1.15) brightness(0.95)',
  },
  mono: {
    label: 'Mono grit',
    top: 'rgba(20, 20, 30, 0.25)',
    bottom: 'rgba(0, 0, 0, 0.55)',
    filter: 'grayscale(1) contrast(1.2)',
  },
};

export function freshPanel(image) {
  return { image, zoom: 1, offsetX: 0.5, offsetY: 0.5 };
}

export function initialState() {
  return {
    layout: 'trio',
    grade: 'sunset',
    gradeStrength: 0.55,
    sizeId: '1080x1080',
    title: 'NEON VICE',
    caption: 'SUMMER NEVER ENDS',
    plateText: 'VI',
    showPlate: true,
    selected: 0,
    panels: [],
  };
}

export function sizeById(id) {
  return EXPORT_SIZES.find((s) => s.id === id) ?? EXPORT_SIZES[0];
}
