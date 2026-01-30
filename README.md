# Papers — Espace Auteur

Portail web dédié aux auteurs de la plateforme **Papers - Livres et Histoires**.
Permet aux auteurs de publier leurs livres, suivre leurs ventes et gérer leurs revenus.

## Stack

- **React 19** + **TypeScript** (Vite 7)
- **Tailwind CSS v4**
- **Zustand** (state management)
- **Axios** (API client avec JWT refresh)
- **React Router** (SPA routing)
- **Recharts** (graphiques)
- **i18next** (internationalisation — FR)

## Liens

| Environnement | URL |
|---------------|-----|
| **Production** | https://author.papers237.duckdns.org |
| **API** | https://api.papers237.duckdns.org/api/v1 |

## Développement

```bash
# Installation
npm install

# Serveur de développement
npm run dev

# Build de production
npm run build

# Preview du build
npm run preview
```

## Variables d'environnement

```bash
# .env
VITE_API_URL=http://localhost:8000/api/v1
```

## Fonctionnalités

- Inscription / Connexion (email + Google OAuth)
- Demande de statut auteur
- Dashboard avec KPIs (ventes, revenus, notes)
- Publication de livres (multi-étapes : infos, upload, catégories, soumission)
- Suivi des ventes et revenus
- Demande de retrait (MTN/Orange Money)
- Gestion du profil auteur

## Déploiement

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour les détails d'hébergement et CI/CD.
