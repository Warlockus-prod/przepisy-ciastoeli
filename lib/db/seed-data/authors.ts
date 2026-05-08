import type { NewAuthor } from '../schema';

export const SEED_AUTHORS: Array<Omit<NewAuthor, 'id' | 'created_at' | 'updated_at'>> = [
  {
    slug: 'ela',
    name: 'Ela',
    role: 'Założycielka i główna autorka',
    bio_short: 'Twórczyni przepisy.ciastoeli.pl. Domowe wypieki, smak premium.',
    bio: 'Ela to pasjonatka domowych wypieków i autorka większości przepisów na portalu. Jej kuchnia to połączenie tradycyjnych polskich smaków z inspiracjami ze świata. Każdy przepis jest osobiście testowany.',
    photo_url: null,
    specialty: ['ciasta', 'desery', 'klasyczne-przepisy'],
    is_primary: true,
    is_active: true,
  },
  {
    slug: 'anna-kowalska',
    name: 'Anna Kowalska',
    role: 'Szefowa kuchni',
    bio_short: 'Specjalistka tradycyjnej polskiej kuchni z 15-letnim doświadczeniem.',
    bio: 'Anna od 15 lat gotuje profesjonalnie. Po latach pracy w restauracjach Krakowa i Warszawy postanowiła skupić się na propagowaniu tradycyjnej polskiej kuchni — takiej jak gotowała jej babcia, ale z zachowaniem nowoczesnych technik. W kuchni Ani króluje pieczone mięso, gęste zupy i pierogi w 20 wariantach.',
    photo_url: null,
    specialty: ['polska-kuchnia', 'klasyczne-przepisy', 'mieso', 'zupy'],
    expertise_years: 15,
    is_primary: false,
    is_active: true,
  },
  {
    slug: 'piotr-nowak',
    name: 'Piotr Nowak',
    role: 'Cukiernik',
    bio_short: 'Cukiernik wykształcony w Lyonie, specjalista nowoczesnych deserów.',
    bio: 'Piotr ukończył szkołę cukierniczą w Lyonie. Po powrocie do Polski stworzył własną pracownię w Poznaniu, specjalizując się w nowoczesnych deserach z polskimi akcentami. Uważa, że tort musi opowiadać historię, a kruszonka jest sztuką.',
    photo_url: null,
    specialty: ['ciasta', 'desery', 'czekolada', 'francuskie-słodkości'],
    expertise_years: 12,
    is_primary: false,
    is_active: true,
  },
  {
    slug: 'magdalena-zielinska',
    name: 'Magdalena Zielińska',
    role: 'Dietetyk kliniczny',
    bio_short: 'Dietetyk kliniczny, ekspertka kuchni roślinnej i diet eliminacyjnych.',
    bio: 'Magdalena jest dietetykiem klinicznym z certyfikatem PolGAS. Specjalizuje się w kuchni roślinnej i diecie eliminacyjnej. Jej przepisy łączą smak z funkcjonalnością — każdy ma policzone makro i opisany efekt zdrowotny.',
    photo_url: null,
    specialty: ['vegan', 'wegetariańskie', 'fit', 'keto', 'bezglutenowe'],
    expertise_years: 10,
    is_primary: false,
    is_active: true,
  },
  {
    slug: 'jakub-wisniewski',
    name: 'Jakub Wiśniewski',
    role: 'Szef kuchni włoskiej',
    bio_short: 'Pięć lat w Toskanii, dziś prowadzi makaroniarnię w Gdańsku.',
    bio: 'Jakub spędził 5 lat w Toskanii, ucząc się od trzech generacji włoskich nonn. Obecnie prowadzi small-batch makaroniarnię w Gdańsku. Wierzy że makaron to nie tylko obiad — to filozofia.',
    photo_url: null,
    specialty: ['włoska', 'makarony', 'pizza', 'sosy'],
    expertise_years: 8,
    is_primary: false,
    is_active: true,
  },
  {
    slug: 'karolina-lewandowska',
    name: 'Karolina Lewandowska',
    role: 'Mama-blogerka kulinarna',
    bio_short: 'Mama trójki dzieci, ekspertka szybkich przepisów dla rodziny.',
    bio: 'Karolina jest mamą trójki dzieci, więc zna magię "zrobić obiad w 20 minut i żeby wszyscy zjedli". Jej przepisy to konkret, brak ezoteryki i mnóstwo zdjęć.',
    photo_url: null,
    specialty: ['szybkie-przepisy', 'dla-dzieci', 'sniadania', 'salatki'],
    expertise_years: 6,
    is_primary: false,
    is_active: true,
  },
  {
    slug: 'michal-dabrowski',
    name: 'Michał Dąbrowski',
    role: 'Szef kuchni azjatyckiej',
    bio_short: 'Trzy lata w Bangkoku i Tokio, dziś food-truck "Dąbrowski Wok".',
    bio: 'Michał spędził 3 lata w Bangkoku i Tokio. Dziś prowadzi food-truck "Dąbrowski Wok" w Warszawie. Specjalizuje się w łączeniu polskich składników z azjatyckimi technikami.',
    photo_url: null,
    specialty: ['azjatycka', 'chińska', 'japońska', 'tajska', 'fusion'],
    expertise_years: 9,
    is_primary: false,
    is_active: true,
  },
];

// Heuristic: which persona to assign to imported reference recipes (non-Ela)
export function pickAuthorSlugForRecipe(category: string, cuisine: string | null, dietTags: string[]): string {
  if (dietTags.includes('vegan') || dietTags.includes('keto') || dietTags.includes('high-protein')) {
    return 'magdalena-zielinska';
  }
  if (cuisine === 'wloska') return 'jakub-wisniewski';
  if (cuisine === 'azjatycka' || cuisine === 'chinska' || cuisine === 'japonska' || cuisine === 'tajska') {
    return 'michal-dabrowski';
  }
  if (category === 'ciasta' || category === 'desery') return 'piotr-nowak';
  if (category === 'sniadania' || category === 'salatki' || category === 'przekaski') return 'karolina-lewandowska';
  if (cuisine === 'polska' || category === 'obiady' || category === 'zupy') return 'anna-kowalska';
  return 'anna-kowalska';
}
