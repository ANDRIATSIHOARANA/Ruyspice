const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Route pour tester l'accès aux fichiers statiques
router.get('/test-static', (req, res) => {
  const uploadsPath = path.join(__dirname, '../../uploads');
  const photosPath = path.join(uploadsPath, 'photos');
  
  // Lister tous les fichiers dans le répertoire photos
  fs.readdir(photosPath, (err, files) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la lecture du répertoire photos",
        error: err.message
      });
    }
    
    // Construire les URLs pour chaque fichier
    const fileUrls = files.map(file => {
      return {
        filename: file,
        url: `/uploads/photos/${file}`,
        fullPath: path.join(photosPath, file)
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
});

// Route pour tester l'upload de fichiers
router.post('/test-upload', (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Aucun fichier n'a été uploadé"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Fichier uploadé avec succès",
      file: req.file
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'upload",
      error: error.message
    });
  }
});

module.exports = router;