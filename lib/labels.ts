export const CATEGORY_LABELS: Record<string, string> = {
  ciasta: 'Ciasta i wypieki',
  desery: 'Desery',
  obiady: 'Obiady',
  zupy: 'Zupy',
  salatki: 'Sałatki',
  sniadania: 'Śniadania',
  przekaski: 'Przekąski',
  napoje: 'Napoje',
  przetwory: 'Przetwory',
  'dla-dzieci': 'Dla dzieci',
};

export const CATEGORY_LABELS_SHORT: Record<string, string> = {
  ciasta: 'Ciasta',
  desery: 'Desery',
  obiady: 'Obiady',
  zupy: 'Zupy',
  salatki: 'Sałatki',
  sniadania: 'Śniadania',
  przekaski: 'Przekąski',
  napoje: 'Napoje',
  przetwory: 'Przetwory',
  'dla-dzieci': 'Dla dzieci',
};

export const CUISINE_LABELS: Record<string, string> = {
  polska: 'Polska',
  wloska: 'Włoska',
  francuska: 'Francuska',
  azjatycka: 'Azjatycka',
  grecka: 'Grecka',
  hiszpanska: 'Hiszpańska',
  meksykanska: 'Meksykańska',
  bliskowschodnia: 'Bliskowschodnia',
  amerykanska: 'Amerykańska',
  angielska: 'Angielska',
  niemiecka: 'Niemiecka',
  miedzynarodowa: 'Międzynarodowa',
};

export const DIET_LABELS: Record<string, { label: string; icon?: string }> = {
  vegan: { label: 'Wegańskie', icon: '🌱' },
  vegetarian: { label: 'Wegetariańskie', icon: '🥗' },
  'gluten-free': { label: 'Bezglutenowe', icon: '🌾' },
  'dairy-free': { label: 'Bez nabiału', icon: '🥛' },
  keto: { label: 'Keto', icon: '🥑' },
  'low-carb': { label: 'Niskowęglowodanowe', icon: '🥦' },
  'sugar-free': { label: 'Bez cukru' },
  'high-protein': { label: 'Wysokobiałkowe', icon: '💪' },
  'low-calorie': { label: 'Niskokaloryczne' },
  paleo: { label: 'Paleo' },
  raw: { label: 'Surowe' },
};
