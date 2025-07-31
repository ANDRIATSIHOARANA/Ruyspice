const multer = require('multer');
const path = require('path');
const fs = require('fs');

// IMPORTANT: Définir le répertoire de destination pour les uploads
// Utiliser le chemin absolu pour éviter les problèmes de chemin relatif
const uploadsPath = path.join(__dirname, '../../uploads');
const photosPath = path.join(uploadsPath, 'photos');

// Créer les répertoires s'ils n'existent pas
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log(`Répertoire créé: ${uploadsPath}`);
}

if (!fs.existsSync(photosPath)) {
  fs.mkdirSync(photosPath, { recursive: true });
  console.log(`Répertoire créé: ${photosPath}`);
}

console.log('Configuration uploadConfig - Répertoire photos:', photosPath);

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    console.log('Multer: destination appelée pour le fichier', file.originalname);
    console.log('Destination:', photosPath);
    cb(null, photosPath);
  },
  filename: function(req, file, cb) {
    // Générer un nom de fichier unique avec timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = 'photo-' + uniqueSuffix + ext;
    console.log('Multer: nom de fichier généré:', filename);
    cb(null, filename);
  }
});

// Filtrer les types de fichiers
const fileFilter = (req, file, cb) => {
  console.log('Multer: fileFilter appelé pour le fichier', file.originalname, 'de type', file.mimetype);
  // Accepter uniquement les images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées!'), false);
  }
};

// Créer l'instance multer
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite à 5MB
  }
});

console.log('Configuration Multer terminée');

module.exports = upload;
