# Variables d'environnement à configurer dans Vercel

## Variables obligatoires à ajouter dans le dashboard Vercel :

### 1. Base de données MongoDB
```
MONGODB_URI=mongodb+srv://Tolojanahary:Fandresena13!@apifirst.ncibg.mongodb.net/firstData?retryWrites=true&w=majority&appName=ApiFirst
```

### 2. JWT Secret
```
JWT_SECRET=d7ccc1c6e123b14a26874a23c06dc0579f6aa7918b99816d2334ad42603b7b0e24cc7a11ece9cde9b33f805cbf50449899d8901a28c7528965f17066feab24cc
```

### 3. Environment
```
NODE_ENV=production
```

### 4. Port (optionnel, Vercel gère automatiquement)
```
PORT=3000
```

## Comment ajouter ces variables dans Vercel :

1. Allez dans votre dashboard Vercel
2. Sélectionnez votre projet
3. Allez dans Settings → Environment Variables
4. Ajoutez chaque variable une par une
5. Redéployez le projet

## Vérification du déploiement :

Une fois les variables ajoutées, votre API devrait être accessible à :
- `https://votre-domaine.vercel.app/api/health`
- `https://votre-domaine.vercel.app/api/utilisateurs/inscription`
- `https://votre-domaine.vercel.app/api/utilisateurs/connexion`

## Problèmes résolus :

✅ Erreur ERR_CONNECTION_REFUSED - API URL corrigée
✅ Erreur 3D FBX - Character3D désactivé temporairement
✅ Erreur manifest.json - Sera résolue après redéploiement
✅ Configuration CORS pour Vercel