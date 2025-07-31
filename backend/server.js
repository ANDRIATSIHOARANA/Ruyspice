const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

// Initialize models
require('./models/index');

// Import routes
const utilisateurRoutes = require('./routes/utilisateurRoutes');
const professionnelRoutes = require('./routes/professionnelRoutes');
const adminRoutes = require('./routes/adminRoutes');
const creneauRoutes = require('./routes/creneauRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const statistiquesRoutes = require('./routes/statistiquesRoutes');
const categorieRoutes = require('./routes/categorieRoutes');

// Importation des routes de test (commentez cette ligne si vous ne voulez pas utiliser les routes de test)
// const testRoutes = require('./routes/testRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Configuration CORS
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware pour parser le JSON et les formulaires
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IMPORTANT: Vérifier et créer le répertoire uploads s'il n'existe pas
const uploadsPath = path.join(__dirname, '../uploads');
console.log('Chemin du répertoire uploads:', uploadsPath);

// Vérifier que le répertoire uploads existe
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log(`Répertoire créé: ${uploadsPath}`);
}

const photosPath = path.join(uploadsPath, 'photos');
if (!fs.existsSync(photosPath)) {
  fs.mkdirSync(photosPath, { recursive: true });
  console.log(`Répertoire créé: ${photosPath}`);
}

// Configuration pour servir les fichiers statiques
// Cette ligne doit être AVANT les routes API
app.use('/uploads', express.static(uploadsPath));

// Middleware pour logger les requêtes de fichiers statiques
app.use('/uploads', (req, res, next) => {
  console.log(`Fichier statique demandé: ${req.url}`);
  const filePath = path.join(uploadsPath, req.url);
  if (fs.existsSync(filePath)) {
    console.log(`Le fichier existe: ${filePath}`);
  } else {
    console.log(`Le fichier n'existe pas: ${filePath}`);
    // Vérifier si le fichier existe dans un autre répertoire
    const altPath = path.join(__dirname, 'uploads', req.url);
    if (fs.existsSync(altPath)) {
      console.log(`Le fichier existe dans le répertoire alternatif: ${altPath}`);
      // Servir le fichier depuis le répertoire alternatif
      return res.sendFile(altPath);
    }
  }
  next();
});

// Middleware pour déboguer les requêtes API
app.use((req, res, next) => {
  if (req.originalUrl.includes('/profile') && req.method === 'PUT') {
    console.log('Requête PUT /profile détectée');
    console.log('Headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
  }
  next();
});

// Route de test pour vérifier l'accès aux fichiers statiques
app.get('/api/test-static', (req, res) => {
  try {
    fs.readdir(photosPath, (err, files) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Erreur lors de la lecture du répertoire photos",
          error: err.message
        });
      }
      
      const fileUrls = files.map(file => {
        const filePath = path.join(photosPath, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          url: `/uploads/photos/${file}`,
          fullPath: filePath,
          size: stats.size,
          exists: fs.existsSync(filePath)
        };
      });
      
      res.status(200).json({
        success: true,
        message: "Liste des fichiers dans le répertoire photos",
        uploadsPath,
        photosPath,
        files: fileUrls
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la lecture du répertoire photos",
      error: error.message
    });
  }
});

// Route de débogage pour vérifier les chemins des fichiers
app.get('/api/debug/file-paths', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) {
    return res.status(400).json({
      success: false,
      message: 'Paramètre path requis'
    });
  }
  
  try {
    // Vérifier différents chemins possibles
    const paths = [
      { name: 'uploads (relatif au projet)', path: path.join(uploadsPath, filePath) },
      { name: 'uploads (relatif au backend)', path: path.join(__dirname, 'uploads', filePath) },
      { name: 'uploads (relatif à la racine)', path: path.join(__dirname, '../uploads', filePath) },
      { name: 'chemin absolu', path: filePath }
    ];
    
    const results = paths.map(p => {
      const exists = fs.existsSync(p.path);
      let stats = null;
      if (exists) {
        try {
          stats = fs.statSync(p.path);
        } catch (e) {
          console.error(`Erreur lors de la lecture des stats pour ${p.path}:`, e);
        }
      }
      
      return {
        name: p.name,
        path: p.path,
        exists,
        isFile: stats ? stats.isFile() : null,
        isDirectory: stats ? stats.isDirectory() : null,
        size: stats ? stats.size : null,
        created: stats ? stats.birthtime : null,
        modified: stats ? stats.mtime : null
      };
    });
    
    // Vérifier également les répertoires parents
    const directories = [
      { name: 'Répertoire du projet', path: path.join(__dirname, '..') },
      { name: 'Répertoire backend', path: __dirname },
      { name: 'Répertoire uploads configuré', path: uploadsPath },
      { name: 'Répertoire photos configuré', path: photosPath }
    ];
    
    const dirResults = directories.map(dir => {
      const exists = fs.existsSync(dir.path);
      let contents = [];
      if (exists) {
        try {
          contents = fs.readdirSync(dir.path);
        } catch (e) {
          console.error(`Erreur lors de la lecture du répertoire ${dir.path}:`, e);
        }
      }
      
      return {
        name: dir.name,
        path: dir.path,
        exists,
        contents: contents.slice(0, 10) // Limiter à 10 éléments pour éviter une réponse trop grande
      };
    });
    
    res.status(200).json({
      success: true,
      message: 'Résultats de la vérification des chemins',
      filePaths: results,
      directories: dirResults,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        __dirname,
        cwd: process.cwd()
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification des chemins:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des chemins',
      error: error.message
    });
  }
});

// Routes
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/professionnels', professionnelRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/creneaux', creneauRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/statistiques', statistiquesRoutes);
app.use('/api/categories', categorieRoutes);

// Utilisation des routes de test (commentez cette ligne si vous ne voulez pas utiliser les routes de test)
// app.use('/api/test', testRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('API RDV App');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connecté à MongoDB');
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
})
.catch(err => {
  console.error('Erreur de connexion MongoDB:', err);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});
