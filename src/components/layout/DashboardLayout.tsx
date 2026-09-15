import { Outlet, useLocation } from 'react-router';
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
 *
 * Cette reserve se mesure depuis le bas de la coquille, et c'est la que
 * `100vh` la trahissait : sur un telephone, `vh` vaut la hauteur de l'ecran
 * barre d'adresse *repliee*, soit cent a cent cinquante pixels de plus que ce
 * que le lecteur voit. La coquille depassait donc par le bas, tandis que la
 * barre d'onglets, fixee, restait collee au bas du visible. Les cent quarante
 * pixels reserves tombaient sous elle : sur la fiche d'une serie assez longue
 * pour defiler, « Ajouter un episode » finissait derriere les onglets, et le
 * doigt qui le visait ouvrait « Livres ».
 *
 * `100dvh` est la hauteur reellement visible, celle contre laquelle la barre
 * se pose. Il reste en style afin que `h-screen` serve de repli sur un
 * navigateur qui ne connait pas l'unite : une declaration qu'il ne comprend
 * pas, il l'ignore, et la coquille garde une hauteur.
 */
export function DashboardLayout() {
  // L'assistant de publication cache les onglets et pose ses propres actions
  // en bas : la page ne doit alors pas reserver une place qui n'est plus prise.
  const { pathname } = useLocation();
  const sansOnglets = pathname.startsWith('/books/new') || pathname.endsWith('/edit');

  return (
    <div className="flex h-screen bg-surface-dim" style={{ height: '100dvh' }}>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main
          className={
            sansOnglets
              ? 'flex-1 overflow-y-auto'
              : // Les onglets, et par-dessus le bouton « Publier » : sans cette marge,
                // il recouvre le montant de la derniere ligne de chaque liste.
                'flex-1 overflow-y-auto pb-[calc(var(--hauteur-onglets)+env(safe-area-inset-bottom)+4.5rem)] lg:pb-0'
          }
        >
          <Outlet />
        </main>
      </div>
      <OngletsBas />
    </div>
  );
}
