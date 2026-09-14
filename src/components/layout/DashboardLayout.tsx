import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { OngletsBas } from './OngletsBas';

/**
 * La coquille de l'atelier.
 *
 * Deux dispositions, pas une redimensionnee : au telephone, des onglets en
 * bas et une action « Publier » sous le pouce ; a partir du grand ecran, le
 * tiroir lateral, ou l'espace horizontal existe vraiment.
 *
 * La page reserve la hauteur de la barre d'onglets. Sans cela, la barre —
 * fixee — recouvrait la fin de chaque ecran : le bouton d'un formulaire, la
 * derniere ligne d'une liste.
 */
export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-surface-dim">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-[calc(var(--hauteur-onglets)+env(safe-area-inset-bottom))] lg:pb-0">
          <Outlet />
        </main>
      </div>
      <OngletsBas />
    </div>
  );
}
