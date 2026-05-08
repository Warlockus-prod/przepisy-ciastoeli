import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/recipe/Breadcrumbs';
import { ShoppingList } from '@/components/recipe/ShoppingList';

export const metadata: Metadata = {
  title: 'Lista zakupów',
  description: 'Twoja lokalna lista zakupów oparta na zapisanych przepisach.',
  robots: { index: false, follow: false },
};

export default function ShoppingListPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[{ name: 'Strona główna', url: '/' }, { name: 'Lista zakupów', url: '/lista-zakupow' }]}
      />

      <header className="mt-6">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Lista zakupów</h1>
        <p className="mt-3 text-lg text-ink-soft">
          Zaznacz produkty które już masz. Lista jest przechowywana lokalnie w przeglądarce.
        </p>
      </header>

      <div className="mt-8">
        <ShoppingList />
      </div>
    </div>
  );
}
