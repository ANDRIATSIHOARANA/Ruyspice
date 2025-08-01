# Guide de Déploiement - RDV Project

## Problèmes Résolus

### 1. Erreur "Unexpected token '<'" 
Cette erreur indique que le serveur retourne du HTML au lieu du JavaScript attendu. Les corrections apportées :

- ✅ Configuration Vercel améliorée (`vercel.json`)
- ✅ Gestion correcte des fichiers statiques
- ✅ Headers de cache appropriés
- ✅ Script de correction des chemins (`build-fix.js`)

### 2. Erreur Manifest.json
- ✅ Configuration des routes pour servir correctement le manifest
- ✅ Headers MIME appropriés

## Plateformes de Déploiement Supportées

### 1. Vercel (Recommandé)
```bash
# Déploiement automatique via Git
git add .
git commit -m "Fix deployment issues"
git push origin main
```

### 2. Netlify
- Utilisez le fichier `_redirects` inclus
- Glissez-déposez le dossier racine sur Netlify

### 3. Apache/cPanel
- Utilisez le fichier `.htaccess` inclus
- Uploadez tous les fichiers via FTP

### 4. GitHub Pages
```bash
# Activez GitHub Pages dans les paramètres du repo
# Sélectionnez la branche main comme source
```

## Scripts Disponibles

```bash
# Construire le projet
npm run build

# Corriger les chemins après build
npm run fix-paths

# Build pour Vercel
npm run vercel-build
```

## Structure des Fichiers

```
/
├── index.html          # Point d'entrée principal
├── manifest.json       # Manifest PWA
├── static/             # Fichiers JS/CSS compilés
├── _redirects          # Configuration Netlify
├── .htaccess          # Configuration Apache
├── vercel.json        # Configuration Vercel
└── build-fix.js       # Script de correction
```

## Vérification Post-Déploiement

1. ✅ L'application se charge sans écran blanc
2. ✅ Aucune erreur JavaScript dans la console
3. ✅ Le manifest.json se charge correctement
4. ✅ Les fichiers statiques sont accessibles

## Dépannage

Si vous rencontrez encore des problèmes :

1. Vérifiez que tous les fichiers sont bien uploadés
2. Assurez-vous que le serveur supporte les SPA (Single Page Applications)
3. Vérifiez les headers MIME du serveur
4. Exécutez `npm run fix-paths` après le build

## Support

Pour plus d'aide, vérifiez :
- Les logs de déploiement de votre plateforme
- La console du navigateur pour les erreurs spécifiques
- La configuration DNS si vous utilisez un domaine personnalisé