const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateurController');
const { auth, authenticateToken } = require('../middlewares/auth');
const Utilisateur = require('../models/Utilisateur');
const RendezVous = require('../models/RendezVous');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/photos/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Le fichier doit être une image'));
    }
  }
});



router.post('/upload-photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier n'a été téléchargé" });
    }

    const userId = req.utilisateur.id;
    const photoUrl = `/uploads/photos/${req.file.filename}`;

    // Mise à jour de l'URL de la photo dans la base de données
    const utilisateur = await Utilisateur.findByIdAndUpdate(
      userId,
      { photo: photoUrl },
      { new: true }
    );

    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({
      success: true,
      photoUrl: photoUrl,
      message: "Photo téléchargée avec succès"
    });

  } catch (error) {
    console.error('Erreur upload photo:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors du téléchargement de la photo" 
    });
  }
});



router.post('/inscription', utilisateurController.inscription);
router.post('/connexion', utilisateurController.connexion);
router.post('/social-login', utilisateurController.socialLogin);
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findById(req.utilisateur.id);
    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.json({
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: "Erreur lors du chargement du profil" });
  }
});

// Dans utilisateurRoutes.js
router.get('/professionals/:id', async (req, res) => {
  try {
    const professional = await Utilisateur.findById(req.params.id);
    res.json(professional);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/mes-rendez-vous', authenticateToken, utilisateurController.getHistoriqueRendezVous);

router.put('/profile', authenticateToken, upload.none(), async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { nom, prenom, email, motDePasse, specialite, description, photo } = req.body;

    const utilisateur = await Utilisateur.findById(userId);
    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Mise à jour des champs de base
    if (nom) utilisateur.nom = nom;
    if (prenom) utilisateur.prenom = prenom;
    if (email) utilisateur.email = email;

    // Mise à jour du mot de passe si fourni
    if (motDePasse) {
      const hashedPassword = await bcrypt.hash(motDePasse, 10);
      utilisateur.password = hashedPassword; // Notez qu'on utilise 'password' et non 'motDePasse'
    }

    // Mise à jour des champs spécifiques aux professionnels
    if (utilisateur.role === 'PROF') {
      // Gestion de la spécialité
      if (specialite) {
        utilisateur.specialites = [specialite]; // Convertit en tableau
      }

      // Mise à jour de la description
      if (description !== undefined) {
        utilisateur.description = description;
      }

      // Mise à jour de la photo
      if (photo) {
        utilisateur.photo = photo;
      }
    }

    await utilisateur.save();

    // Prépare la réponse
    const userResponse = {
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      specialites: utilisateur.specialites,
      description: utilisateur.description,
      photo: utilisateur.photo
    };

    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Erreur de mise à jour:', error);
    res.status(500).json({ message: "Erreur lors de la mise à jour" });
  }
});

// Routes pour les notifications
router.get('/notifications', authenticateToken, utilisateurController.getNotifications);
router.put('/notifications/:id/lue', authenticateToken, utilisateurController.marquerNotificationLue);

router.delete('/rendez-vous/:id', authenticateToken, async (req, res) => {
  try {
    await RendezVous.findByIdAndDelete(req.params.id);
    res.json({ message: "Rendez-vous supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/rendez-vous', authenticateToken, async (req, res) => {
  try {
    const { professionnelId, date, motif, status = 'PENDING' } = req.body;
    
    if (!professionnelId || !date || !motif) {
      return res.status(400).json({ 
        message: "Le professionnel, la date et le motif sont requis" 
      });
    }

    const nouveauRendezVous = new RendezVous({
      utilisateur: req.utilisateur.id,
      professionnel: professionnelId,
      date: new Date(date),
      motif: motif,
      status: status.toUpperCase()
    });

    const rendezVousSauvegarde = await nouveauRendezVous.save();
    console.log(`Rendez-vous créé: ${rendezVousSauvegarde._id}`);

    // MISE À JOUR DE L'HISTORIQUE UTILISATEUR
    const utilisateur = await Utilisateur.findById(req.utilisateur.id);
    utilisateur.historiqueRendezVous.push(rendezVousSauvegarde._id);
    await utilisateur.save();

    // CRÉATION D'UNE NOTIFICATION POUR LE PROFESSIONNEL
    const Notification = require('../models/Notification');
    const notificationProfessionnel = new Notification({
      contenu: `Nouvelle demande de rendez-vous pour le ${new Date(date).toLocaleDateString()} de ${utilisateur.prenom} ${utilisateur.nom}.`,
      professionnel: professionnelId,
      type: 'RESERVATION',
      rendezVousId: rendezVousSauvegarde._id, // Inclure l'ID du rendez-vous
      lue: false,
      dateCreation: new Date()
    });
    
    await notificationProfessionnel.save();
    console.log(`Notification créée pour le professionnel ${professionnelId}: ${notificationProfessionnel._id}`);

    res.status(201).json({
      message: "Rendez-vous créé avec succès",
      rendezVous: rendezVousSauvegarde
    });

  } catch (error) {
    console.error('Erreur lors de la création du rendez-vous:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Erreur de validation",
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }

    res.status(500).json({ 
      message: "Erreur lors de la création du rendez-vous",
      error: error.message 
    });
  }
});

// Route pour annuler un rendez-vous
router.put('/rendez-vous/:id/annuler', authenticateToken, async (req, res) => {
  try {
    const rendezVous = await RendezVous.findOneAndUpdate(
      { 
        _id: req.params.id,
        utilisateur: req.utilisateur.id,
        status: { $in: ['PENDING', 'CONFIRME'] } // Permettre l'annulation des rendez-vous en attente ou confirmés
      },
      { status: 'ANNULE' },
      { new: true }
    ).populate('professionnel');

    if (!rendezVous) {
      return res.status(404).json({ message: "Rendez-vous non trouvé ou ne peut pas être annulé" });
    }

    console.log(`Rendez-vous ${req.params.id} annulé par l'utilisateur ${req.utilisateur.id}`);

    // Récupérer les informations de l'utilisateur pour la notification
    const utilisateur = await Utilisateur.findById(req.utilisateur.id);
    
    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // CRÉATION D'UNE NOTIFICATION POUR LE PROFESSIONNEL
    const Notification = require('../models/Notification');
    const notificationProfessionnel = new Notification({
      contenu: `${utilisateur.prenom} ${utilisateur.nom} a annulé son rendez-vous du ${new Date(rendezVous.date).toLocaleDateString()}.`,
      professionnel: rendezVous.professionnel._id,
      type: 'ANNULATION',
      rendezVousId: rendezVous._id, // Inclure l'ID du rendez-vous
      lue: false,
      dateCreation: new Date()
    });
    
    await notificationProfessionnel.save();
    console.log(`Notification créée pour le professionnel ${rendezVous.professionnel._id}: ${notificationProfessionnel._id}`);

    res.json({
      message: "Rendez-vous annulé avec succès",
      rendezVous
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation du rendez-vous:', error);
    res.status(500).json({ message: "Erreur lors de l'annulation", error: error.message });
  }
});

module.exports = router;
