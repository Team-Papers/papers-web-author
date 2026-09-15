import { describe, it, expect } from 'vitest';
import { decrire, resumeDe, type Revision } from '@/features/books/historique';

/**
 * Un journal qu'on ne comprend pas ne se lit pas, et ne sert donc à rien.
 *
 * L'historique arrive du serveur avec les noms des colonnes — `fileUrl`,
 * `coverUrl`, `previewPercent`. Un auteur n'a jamais vu ces mots : il a
 * remplacé un fichier et changé une couverture.
 */
describe('L’historique, dit en français', () => {
  it('traduit les noms techniques', () => {
    expect(decrire('fileUrl', { avant: 'a3f9.pdf', apres: '8c21.pdf' })).toBe('fichier');
    expect(decrire('coverUrl', { avant: null, apres: 'c.jpg' })).toBe('couverture');
    expect(decrire('description', { avant: 'x', apres: 'y' })).toBe('description');
  });

  it('ne montre pas le nom d’un fichier que l’auteur n’a jamais choisi', () => {
    expect(decrire('fileUrl', { avant: 'a3f9.pdf', apres: '8c21.pdf' })).not.toContain('a3f9');
    expect(decrire('coverUrl', { avant: 'a.jpg', apres: 'b.jpg' })).not.toContain('.jpg');
  });

  it('montre l’avant et l’après quand la valeur est la réponse', () => {
    const prix = decrire('price', { avant: 0, apres: 500 });
    expect(prix).toContain('prix');
    expect(prix).toContain('→');
    expect(prix).toMatch(/0/);
    expect(prix).toMatch(/500/);

    expect(decrire('language', { avant: 'fr', apres: 'en' })).toBe('langue : français → anglais');
    expect(decrire('pageCount', { avant: null, apres: 250 })).toBe('nombre de pages : rien → 250');
    expect(decrire('categories', { avant: [], apres: ['Roman'] })).toBe(
      'catégories : aucune → Roman',
    );
  });

  it('passe sous silence un champ qu’elle ne sait pas nommer', () => {
    // Le jour où le serveur en suivra un de plus, l'auteur ne verra pas
    // apparaître un mot anglais dans son atelier.
    expect(decrire('suspensionReason', { avant: null, apres: 'x' })).toBeNull();
  });

  it('résume une modification qui a touché plusieurs champs', () => {
    const revision: Revision = {
      id: 'r1',
      changedAt: '2026-09-15T10:00:00Z',
      changedBy: null,
      changes: {
        price: { avant: 0, apres: 500 },
        description: { avant: 'a', apres: 'b' },
        suspensionReason: { avant: null, apres: 'x' },
      },
    };

    const resume = resumeDe(revision);
    expect(resume).toContain('prix');
    expect(resume).toContain('description');
    expect(resume).not.toContain('suspensionReason');
  });
});
