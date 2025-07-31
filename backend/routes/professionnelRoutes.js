const express = require('express');
const router = express.Router();
const professionnelController = require('../controllers/professionnelController');
const { auth, authenticateToken } = require('../middlewares/auth');
const uploadConfig = require('../middlewares/uploadConfig');

// Middleware de débogage pour les requêtes d'upload
const debugUpload = (req, res, next) => {
  console.log('====== DÉBUT REQUÊTE UPLOAD ======');
  console.log('Méthode:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('====== FIN REQUÊTE UPLOAD ======');
  next();
};

// Log pour déboguer les appels d'API
router.use((req, res, next) => {
  console.log(`Route professionnelle appelée: ${req.method} ${req.originalUrl}`);
  next();
});

// Routes d'authentification
router.post('/inscription', professionnelController.inscription);
router.post('/connexion', professionnelController.connexion);

// Route pour récupérer les professionnels par catégorie - PLACÉE AVANT LES ROUTES AVEC PARAMÈTRES
router.get('/categorie/:id', auth, professionnelController.getProfessionnelsByCategorie);

// Routes de profil
// IMPORTANT: Utiliser uploadConfig.single('photo') pour traiter le téléchargement de fichier
router.put('/profile', authenticateToken, debugUpload, uploadConfig.single('photo'), (req, res, next) => {
  console.log('====== APRÈS MULTER ======');
  console.log('req.file:', req.file);
  console.log('req.body:', req.body);
  console.log('====== FIN APRÈS MULTER ======');
  next();
}, professionnelController.modifierProfil);
router.get('/profile', authenticateToken, professionnelController.getProfil);

// Routes pour les disponibilités
router.get('/disponibilites', authenticateToken, professionnelController.getDisponibilites);
router.post('/disponibilites', authenticateToken, professionnelController.ajouterDisponibilite);
router.delete('/disponibilites/:id', authenticateToken, professionnelController.supprimerDisponibilite);

// Routes pour les rendez-vous
router.get('/appointments', authenticateToken, professionnelController.getAppointments);
router.get('/stats', authenticateToken, professionnelController.getStats);
router.put('/appointments/:id/accept', authenticateToken, professionnelController.accepterRendezVous);
router.put('/appointments/:id/reject', authenticateToken, professionnelController.refuserRendezVous);
router.delete('/appointments/:id', authenticateToken, professionnelController.supprimerRendezVous);

// Routes pour les notifications - Placées avant les autres routes pour priorité
router.get('/notifications', authenticateToken, professionnelController.getNotifications);
router.put('/notifications/:id/lue', authenticateToken, professionnelController.marquerNotificationLue);

// Route pour uploader une photo (obsolète - utiliser la route PUT /profile à la place avec uploadConfig.single('photo'))
// router.post('/upload-photo', auth, uploadConfig.single('photo'), professionnelController.uploadPhoto);

// Route pour obtenir la liste des professionnels
router.get('/', auth, professionnelController.getListe);

// Cette route doit être après les routes spécifiques pour éviter les conflits
router.get('/:proId/disponibilites', auth, professionnelController.getDisponibilitesByDate);

// Route de test pour l'upload
router.post('/test-upload', uploadConfig.single('photo'), (req, res) => {
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
