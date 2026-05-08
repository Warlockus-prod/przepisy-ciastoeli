import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/recipe/Breadcrumbs';
import { FavoritesList } from '@/components/recipe/FavoritesList';

export const metadata: Metadata = {
  title: 'Ulubione przepisy',
  description: 'Twoje zapisane ulubione przepisy.',
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: 'Strona główna', url: '/' }, { name: 'Ulubione', url: '/ulubione' }]} />

      <header className="mt-6">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Ulubione</h1>
        <p className="mt-3 text-lg text-ink-soft">
          Przepisy które oznaczyłeś jako zapisane (przechowywane lokalnie w przeglądarce).
        </p>
      </header>

      <div className="mt-8">
        <FavoritesList />
      </div>
    </div>
  );
}
