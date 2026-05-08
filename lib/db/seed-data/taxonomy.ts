export const SEED_CATEGORIES: Array<{
  slug: string;
  name_pl: string;
  description?: string;
  parent_slug?: string;
  sort_order: number;
}> = [
  { slug: 'ciasta', name_pl: 'Ciasta i wypieki', sort_order: 1, description: 'Ciasta, torty, babki, ciasteczka — domowe wypieki na każdą okazję.' },
  { slug: 'desery', name_pl: 'Desery', sort_order: 2, description: 'Lody, kremy, mousse, puddingi i inne słodkie zakończenia posiłku.' },
  { slug: 'obiady', name_pl: 'Obiady', sort_order: 3, description: 'Obiady na każdy dzień — od klasyki po nowoczesne propozycje.' },
  { slug: 'zupy', name_pl: 'Zupy', sort_order: 4, description: 'Polskie i światowe zupy — od żurku po consommé.' },
  { slug: 'salatki', name_pl: 'Sałatki', sort_order: 5, description: 'Lekkie sałatki, surówki i dania na ciepło.' },
  { slug: 'sniadania', name_pl: 'Śniadania', sort_order: 6, description: 'Energetyczne starty dnia — owsianki, jajecznice, kanapki.' },
  { slug: 'przekaski', name_pl: 'Przekąski', sort_order: 7, description: 'Pastas, dipy, finger foods i przekąski na imprezy.' },
  { slug: 'napoje', name_pl: 'Napoje', sort_order: 8, description: 'Kompoty, koktajle, smoothies i kawy.' },
  { slug: 'przetwory', name_pl: 'Przetwory', sort_order: 9, description: 'Konfitury, dżemy, kiszonki i marynaty na zimę.' },
  { slug: 'dla-dzieci', name_pl: 'Dla dzieci', sort_order: 10, description: 'Posiłki przyjazne najmłodszym smakoszom.' },
];

export const SEED_CUISINES: Array<{ slug: string; name_pl: string; sort_order: number; description?: string }> = [
  { slug: 'polska', name_pl: 'Polska', sort_order: 1, description: 'Tradycyjna kuchnia polska — pierogi, bigos, żurek, schabowe.' },
  { slug: 'wloska', name_pl: 'Włoska', sort_order: 2, description: 'Pasta, pizza, risotto — klasyka Italii.' },
  { slug: 'francuska', name_pl: 'Francuska', sort_order: 3, description: 'Eleganckie sosy, ciasta i dania kuchni francuskiej.' },
  { slug: 'azjatycka', name_pl: 'Azjatycka', sort_order: 4, description: 'Chiny, Japonia, Tajlandia — smaki Azji.' },
  { slug: 'grecka', name_pl: 'Grecka', sort_order: 5, description: 'Sałatki, gyros, mussaka — Morze Egejskie na talerzu.' },
  { slug: 'hiszpanska', name_pl: 'Hiszpańska', sort_order: 6, description: 'Tapas, paella, tortille — Hiszpania od kuchni.' },
  { slug: 'meksykanska', name_pl: 'Meksykańska', sort_order: 7, description: 'Tacos, burrito, salsa — pikantne smaki Meksyku.' },
  { slug: 'bliskowschodnia', name_pl: 'Bliskowschodnia', sort_order: 8, description: 'Hummus, falafel, szawarma.' },
  { slug: 'amerykanska', name_pl: 'Amerykańska', sort_order: 9, description: 'Burgery, BBQ, comfort food.' },
  { slug: 'angielska', name_pl: 'Angielska', sort_order: 10, description: 'Klasyki kuchni brytyjskiej.' },
  { slug: 'niemiecka', name_pl: 'Niemiecka', sort_order: 11, description: 'Kiełbaski, sznycel, brezel.' },
  { slug: 'miedzynarodowa', name_pl: 'Międzynarodowa', sort_order: 99, description: 'Przepisy łączące tradycje wielu kuchni.' },
];

export const SEED_DIET_TAGS: Array<{ slug: string; name_pl: string; icon?: string; schema_url?: string; sort_order: number }> = [
  { slug: 'vegan', name_pl: 'Wegańskie', icon: '🌱', schema_url: 'https://schema.org/VeganDiet', sort_order: 1 },
  { slug: 'vegetarian', name_pl: 'Wegetariańskie', icon: '🥗', schema_url: 'https://schema.org/VegetarianDiet', sort_order: 2 },
  { slug: 'gluten-free', name_pl: 'Bezglutenowe', icon: '🌾', schema_url: 'https://schema.org/GlutenFreeDiet', sort_order: 3 },
  { slug: 'dairy-free', name_pl: 'Bez nabiału', icon: '🥛', schema_url: 'https://schema.org/LowLactoseDiet', sort_order: 4 },
  { slug: 'keto', name_pl: 'Keto', icon: '🥑', sort_order: 5 },
  { slug: 'low-carb', name_pl: 'Niskowęglowodanowe', icon: '🥦', schema_url: 'https://schema.org/LowCalorieDiet', sort_order: 6 },
  { slug: 'sugar-free', name_pl: 'Bez cukru', icon: '🚫🍬', sort_order: 7 },
  { slug: 'high-protein', name_pl: 'Wysokobiałkowe', icon: '💪', schema_url: 'https://schema.org/HighProteinDiet', sort_order: 8 },
  { slug: 'low-calorie', name_pl: 'Niskokaloryczne', icon: '⚖️', schema_url: 'https://schema.org/LowCalorieDiet', sort_order: 9 },
  { slug: 'paleo', name_pl: 'Paleo', icon: '🦴', sort_order: 10 },
  { slug: 'raw', name_pl: 'Surowe', icon: '🥒', sort_order: 11 },
];
