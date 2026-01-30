# Déploiement — Papers Espace Auteur

## Infrastructure

| Élément | Détail |
|---------|--------|
| **Serveur** | VPS Contabo (Ubuntu) — `84.247.183.206` |
| **URL de production** | https://author.papers237.duckdns.org |
| **Technologie** | Vite + React (build statique) servi par Nginx |
| **SSL** | Let's Encrypt (Certbot, renouvellement automatique) |
| **Reverse proxy** | Nginx (fichiers statiques) |
| **Répertoire sur le VPS** | `/home/softengine/papers-web-author` |

## Architecture

```
papers-web-author/
├── dist/                  # Build de production (fichiers statiques)
│   ├── index.html
│   └── assets/
│       ├── index-*.css
│       └── index-*.js
├── src/                   # Code source
├── .env                   # VITE_API_URL (créé au déploiement)
├── vite.config.ts
└── package.json
```

## Variable d'environnement

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://api.papers237.duckdns.org/api/v1` |

Le fichier `.env` est créé automatiquement lors du déploiement CI/CD. La variable est injectée au moment du `npm run build` (build-time, pas runtime).

## Configuration Nginx

Fichier : `/etc/nginx/sites-enabled/papers-web-author`

```nginx
server {
    server_name author.papers237.duckdns.org;

    root /home/softengine/papers-web-author/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SSL géré par Certbot
}
```

> `try_files ... /index.html` est nécessaire pour le routing SPA (React Router).

## CI/CD (GitHub Actions)

**Déclencheur** : Push sur la branche `main`

**Workflow** : `.github/workflows/deploy.yml`

```
Push main → SSH vers VPS → git pull → écrire .env → npm ci → npm run build
```

Nginx sert directement les fichiers du dossier `dist/`, aucun redémarrage nécessaire.

### Secrets GitHub requis

| Secret | Valeur |
|--------|--------|
| `VPS_HOST` | `84.247.183.206` |
| `VPS_USER` | `softengine` |
| `VPS_PASSWORD` | *(mot de passe SSH)* |

## Déploiement manuel

```bash
ssh softengine@84.247.183.206
source ~/.nvm/nvm.sh
cd /home/softengine/papers-web-author
git pull origin main
echo 'VITE_API_URL=https://api.papers237.duckdns.org/api/v1' > .env
npm ci
npm run build
```

## Vérification

```bash
# Accès direct
curl -sf https://author.papers237.duckdns.org | head -5

# Vérifier que le build existe
ls -la /home/softengine/papers-web-author/dist/
```

## Pages principales

| Page | Route |
|------|-------|
| Connexion | `/login` |
| Inscription | `/register` |
| Mot de passe oublié | `/forgot-password` |
| Devenir auteur | `/apply` |
| Dashboard | `/dashboard` |
| Mes livres | `/books` |
| Nouveau livre | `/books/new` |
| Revenus | `/earnings` |
| Statistiques | `/stats` |
| Paramètres | `/settings` |
