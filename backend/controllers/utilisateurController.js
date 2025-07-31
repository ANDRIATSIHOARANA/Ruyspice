const Utilisateur = require('../models/Utilisateur');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const RendezVous = require('../models/RendezVous');
const Disponibilite = require('../models/Disponibilite');
const { isValidObjectId } = require('mongoose');
const Notification = require('../models/Notification');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Utiliser le chemin absolu correct pour le répertoire uploads
    const uploadsDir = path.join(__dirname, '../../uploads/photos');
    console.log('Destination des uploads:', uploadsDir);
    
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`Répertoire créé: ${uploadsDir}`);
    }
    
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    // Générer un nom de fichier unique avec timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'user-' + uniqueSuffix + ext);
  }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont acceptées'), false);
  }
};

// Middleware multer configuré
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite à 5MB
  },
  fileFilter: fileFilter
});

// Middleware pour gérer l'upload de photo
exports.uploadMiddleware = upload.single('photo');

// Fonction utilitaire pour créer des notifications
const creerNotification = async (type, contenu, professionnelId, rendezVousId) => {
  try {
    const notification = new Notification({
      contenu,
      professionnel: professionnelId,
      type,
      rendezVousId,
      lue: false,
      dateCreation: new Date()
    });
    
    await notification.save();
    console.log(`Notification créée pour le professionnel ${professionnelId}:`, notification);
    return notification;
  } catch (error) {
    console.error('Erreur lors de la création de notification:', error);
    throw error;
  }
};

exports.inscription = async (req, res) => {
  try {
    console.log('Données d\'inscription reçues:', { 
      ...req.body, 
      password: req.body.password ? '******' : undefined 
    });
    
    const { email, password, nom, prenom, role, categorieId } = req.body;

    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: "Le mot de passe est requis" 
      });
    }

    const utilisateurExistant = await Utilisateur.findOne({ email });
    if (utilisateurExistant) {
      return res.status(400).json({ 
        success: false, 
        message: "Cet email est déjà utilisé" 
      });
    }

    const utilisateur = new Utilisateur({
      email,
      password,
      nom,
      prenom,
      role: role || 'USER',
      categorieId: categorieId || null
    });

    await utilisateur.sInscrire();

    const token = jwt.sign(
      { id: utilisateur._id, role: utilisateur.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Déterminer si un message d'avertissement doit être envoyé
    let message = 'Inscription réussie';
    let avertissement = null;
    
    if (utilisateur.role === 'PROF' && !utilisateur.profilComplet) {
      avertissement = 'Veuillez compléter votre profil en ajoutant une catégorie professionnelle';
    }

    res.status(201).json({
      success: true,
      message,
      avertissement,
      token,
      user: {
        id: utilisateur._id,
        email: utilisateur.email,
        role: utilisateur.role,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        profilComplet: utilisateur.profilComplet
      }
    });
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    res.status(400).json({ message: error.message });
  }
};

// Fonction pour annuler un rendez-vous
exports.annulerRendezVous = async (req, res) => {
  try {
    console.log(`Tentative d'annulation du rendez-vous ${req.params.id} par l'utilisateur ${req.utilisateur.id}`);
    
    // Récupérer le rendez-vous avec les informations du professionnel
    const rendezVous = await RendezVous.findOneAndUpdate(
      { 
        _id: req.params.id,
        utilisateur: req.utilisateur.id,
        status: { $in: ['PENDING', 'CONFIRME'] }
      },
      { status: 'ANNULE' },
      { new: true }
    ).populate('professionnel');

    if (!rendezVous) {
      console.log(`Rendez-vous ${req.params.id} non trouvé ou ne peut pas être annulé`);
      return res.status(404).json({ 
        success: false, 
        message: "Rendez-vous non trouvé ou ne peut pas être annulé" 
      });
    }
    
    console.log(`Rendez-vous ${req.params.id} trouvé et mis à jour:`, rendezVous);
    
    // Récupérer les informations de l'utilisateur pour la notification
    const utilisateur = await Utilisateur.findById(req.utilisateur.id);
    
    if (!utilisateur) {
      console.log(`Utilisateur ${req.utilisateur.id} non trouvé`);
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }
    
    console.log(`Utilisateur ${req.utilisateur.id} trouvé:`, utilisateur);
    console.log(`Création d'une notification pour le professionnel ${rendezVous.professionnel._id}`);
    
    // Créer une notification pour le professionnel en utilisant la fonction utilitaire
    const contenuNotification = `${utilisateur.prenom} ${utilisateur.nom} a annulé son rendez-vous du ${new Date(rendezVous.date).toLocaleDateString()}.`;
    
    const notificationProfessionnel = await creerNotification(
      'ANNULATION',
      contenuNotification,
      rendezVous.professionnel._id,
      rendezVous._id
    );
    
    console.log('Notification sauvegardée avec succès:', notificationProfessionnel);
    
    res.json({
      success: true,
      message: "Rendez-vous annulé avec succès",
      data: rendezVous
    });
  } catch (error) {
    console.error('Erreur annulerRendezVous:', error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de l'annulation du rendez-vous",
      error: error.message 
    });
  }
};

exports.connexion = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Tentative de connexion pour:', email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const utilisateur = await Utilisateur.findOne({ email });
    
    if (!utilisateur) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    console.log('Utilisateur trouvé:', {
      id: utilisateur._id,
      email: utilisateur.email,
      hasPassword: !!utilisateur.password
    });

    const isValidPassword = await utilisateur.seConnecter(password);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: utilisateur._id, role: utilisateur.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: utilisateur._id,
        email: utilisateur.email,
        role: utilisateur.role,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom
      }
    });
  } catch (error) {
    console.error('Erreur de connexion détaillée:', error);
    res.status(500).json({ message: "Erreur lors de la connexion" });
  }
};

exports.modifierProfil = async (req, res) => {
  try {
    // Log détaillé des données reçues
    console.log('Données reçues dans modifierProfil (req.body):', {
      ...req.body,
      motDePasse: req.body.motDePasse ? '******' : undefined
    });
    console.log('Données reçues dans modifierProfil (req.file):', req.file);
    console.log('ID utilisateur:', req.utilisateur.id);
    console.log('CategorieId:', req.body.categorieId);
    console.log('Tarif (type):', typeof req.body.tarif);
    
    // Vérifier si categorieId est un ObjectId valide
    if (req.body.categorieId && !isValidObjectId(req.body.categorieId)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID de catégorie invalide" 
      });
    }
    
    const utilisateur = await Utilisateur.findById(req.utilisateur.id);
    
    if (!utilisateur) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    const userData = req.body;
    
    // Convertir les chaînes vides en null pour categorieId
    if (userData.categorieId === '') {
      userData.categorieId = null;
    }
    
    // Préparation des données pour la modification
    const donneesModification = {
      nom: userData.nom,
      prenom: userData.prenom,
      email: userData.email,
      description: userData.description,
      tarif: userData.tarif,
      categorieId: userData.categorieId,
      specialites: userData.specialites
    };
    
    // Traitement de la photo
    if (req.file) {
      // Si une nouvelle photo est téléchargée via multer
      const filename = path.basename(req.file.path);
      donneesModification.photo = `/uploads/photos/${filename}`;
      console.log('Nouvelle photo enregistrée:', donneesModification.photo);
    } else if (userData.photoPath) {
      // Si un chemin de photo existant est fourni
      donneesModification.photo = userData.photoPath;
      console.log('Chemin de photo existante conservé:', donneesModification.photo);
    } else if (userData.photo) {
      // Conserver la photo existante si fournie directement
      donneesModification.photo = userData.photo;
    }
    
    console.log('Données avant traitement:', donneesModification);
    
    // Traitement spécifique pour les spécialités
    if (userData.specialites) {
      // Si c'est une chaîne JSON, la parser
      if (typeof userData.specialites === 'string') {
        try {
          donneesModification.specialites = JSON.parse(userData.specialites);
        } catch (e) {
          // Fallback pour les chaînes simples
          donneesModification.specialites = userData.specialites.split(',').map(s => s.trim());
          console.error('Erreur lors du parsing des spécialités:', e);
        }
      } else if (!Array.isArray(userData.specialites)) {
        donneesModification.specialites = [userData.specialites];
      } else {
        donneesModification.specialites = userData.specialites;
      }
    }
    
    console.log('Données après traitement:', donneesModification);
    
    // Utiliser la méthode du modèle pour modifier le profil
    await utilisateur.modifierProfil(donneesModification);
    console.log('Profil modifié avec succès');
    
    // Traitement du mot de passe
    if (userData.motDePasse) {
      const salt = await bcrypt.genSalt(10);
      utilisateur.password = await bcrypt.hash(userData.motDePasse, salt);
      await utilisateur.save();
    }

    // Préparer la réponse avec les données mises à jour
    const utilisateurMisAJour = await Utilisateur.findById(req.utilisateur.id)
      .populate('categorieId', 'nom description');
    
    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        id: utilisateurMisAJour._id,
        nom: utilisateurMisAJour.nom,
        prenom: utilisateurMisAJour.prenom,
        email: utilisateurMisAJour.email,
        role: utilisateurMisAJour.role,
        description: utilisateurMisAJour.description,
        photo: utilisateurMisAJour.photo,
        tarif: utilisateurMisAJour.tarif,
        specialites: utilisateurMisAJour.specialites,
        categorie: utilisateurMisAJour.categorieId
      },
      photoUrl: utilisateurMisAJour.photo // Renvoyer l'URL de la photo pour la persistance côté client
    });
  } catch (error) {
    console.error('Erreur lors de la modification du profil:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Une erreur est survenue lors de la mise à jour du profil' 
    });
  }
};


exports.uploadPhoto = async (req, res) => {
  try {
    // Vérifier si un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Aucune photo n'a été téléchargée"
      });
    }

    console.log('Photo reçue:', req.file);
    console.log('Chemin complet du fichier:', req.file.path);
    console.log('ID utilisateur pour upload photo:', req.utilisateur.id);
    
    // Récupérer l'utilisateur
    const utilisateur = await Utilisateur.findById(req.utilisateur.id);
    
    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }
    
    // Supprimer l'ancienne photo si elle existe
    if (utilisateur.photo && utilisateur.photo.startsWith('/uploads/photos/')) {
      const oldPhotoPath = path.join(__dirname, '../..', utilisateur.photo);
      if (fs.existsSync(oldPhotoPath)) {
        try {
          fs.unlinkSync(oldPhotoPath);
          console.log(`Ancienne photo supprimée: ${oldPhotoPath}`);
        } catch (err) {
          console.error(`Erreur lors de la suppression de l'ancienne photo: ${err.message}`);
        }
      }
    }
    
    // Construire le chemin relatif pour la base de données
    // Extraire le nom du fichier du chemin complet
    const filename = path.basename(req.file.path);
    const photoPath = `/uploads/photos/${filename}`;
    
    console.log('Chemin de la photo sauvegardé en BDD:', photoPath);
    
    // Vérifier que le fichier existe
    const fullPath = path.join(__dirname, '../../uploads/photos', filename);
    const fileExists = fs.existsSync(fullPath);
    console.log(`Le fichier ${fullPath} existe: ${fileExists}`);
    
    // Sauvegarder le chemin de la photo dans la base de données
    utilisateur.photo = photoPath;
    await utilisateur.save();
    
    // Renvoyer le chemin de la photo avec les deux formats pour compatibilité
    res.status(200).json({
      success: true,
      message: "Photo téléchargée avec succès",
      photo: photoPath,
      photoUrl: photoPath, // Pour compatibilité avec le frontend existant
      fileInfo: {
        originalPath: req.file.path,
        savedPath: photoPath,
        fullPath: fullPath,
        exists: fileExists
      }
    });
  } catch (error) {
    console.error('Erreur uploadPhoto:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'upload de la photo",
      error: error.message
    });
  }
};

// controllers/utilisateurController.js
exports.getMesRendezVous = async (req, res) => {
  try {
    console.log('Récupération des rendez-vous pour l\'utilisateur:', req.utilisateur.id);
    
    const rendezVous = await RendezVous.find({ 
      utilisateur: req.utilisateur.id 
    })
    .populate('professionnel', 'nom prenom specialites')
    .sort({ date: 1 });

    console.log('Rendez-vous trouvés:', rendezVous); // Pour le debug
    res.json(rendezVous);
  } catch (error) {
    console.error('Erreur getMesRendezVous:', error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des rendez-vous",
      error: error.message 
    });
  }
};

exports.getHistoriqueRendezVous = async (req, res) => {
  try {
    console.log('Récupération de l\'historique pour l\'utilisateur:', req.utilisateur.id);
    
    const utilisateur = await Utilisateur.findById(req.utilisateur.id)
      .populate({
        path: 'historiqueRendezVous',
        model: 'RendezVous', // <-- Ajouter explicitement le modèle
        populate: [
          {
            path: 'professionnel',
            model: 'Utilisateur', // <-- Nom exact du modèle
            select: 'nom prenom specialites'
          }
        ]
      });

    res.json(utilisateur.historiqueRendezVous);
  } catch (error) {
    console.error('Erreur getHistoriqueRendezVous:', error);
    res.status(500).json({ message: "Erreur lors de la récupération" });
  }
};

// Fonction pour récupérer les notifications de l'utilisateur ou du professionnel
exports.getNotifications = async (req, res) => {
  try {
    const utilisateurId = req.utilisateur.id;
    const role = req.utilisateur.role;
    console.log(`Récupération des notifications pour ${role === 'PROF' ? 'le professionnel' : 'l\'utilisateur'} ${utilisateurId}`);
    
    // Construire la requête en fonction du rôle
    const query = role === 'PROF' 
      ? { professionnel: utilisateurId } 
      : { utilisateur: utilisateurId };
    
    const notifications = await Notification.find(query)
      .sort({ dateCreation: -1 })
      .populate('rendezVousId');

    console.log(`${notifications.length} notifications récupérées pour ${role === 'PROF' ? 'le professionnel' : 'l\'utilisateur'} ${utilisateurId}`);
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Erreur getNotifications:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération des notifications",
      error: error.message 
    });
  }
};

// Fonction pour récupérer uniquement les notifications de l'utilisateur
exports.getNotificationsUtilisateur = async (req, res) => {
  try {
    const utilisateurId = req.utilisateur.id;
    console.log(`Récupération des notifications pour l'utilisateur ${utilisateurId}`);
    
    const notifications = await Notification.find({ 
      utilisateur: utilisateurId 
    })
    .sort({ dateCreation: -1 })
    .populate('rendezVousId');

    console.log(`${notifications.length} notifications récupérées pour l'utilisateur ${utilisateurId}`);
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Erreur getNotificationsUtilisateur:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération des notifications",
      error: error.message 
    });
  }
};

// Fonction pour marquer une notification comme lue
exports.marquerNotificationLue = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const utilisateurId = req.utilisateur.id;
    const role = req.utilisateur.role;
    
    console.log(`Tentative de marquer la notification ${notificationId} comme lue pour ${role === 'PROF' ? 'le professionnel' : 'l\'utilisateur'} ${utilisateurId}`);
    
    // Construire la requête en fonction du rôle
    const query = { _id: notificationId };
    if (role === 'PROF') {
      query.professionnel = utilisateurId;
    } else {
      query.utilisateur = utilisateurId;
    }
    
    const notification = await Notification.findOneAndUpdate(
      query,
      { lue: true },
      { new: true }
    );

    if (!notification) {
      console.log(`Notification ${notificationId} non trouvée pour l'utilisateur ${utilisateurId}`);
      return res.status(404).json({ 
        success: false,
        message: "Notification non trouvée" 
      });
    }
    
    console.log(`Notification ${notificationId} marquée comme lue avec succès`);
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Erreur marquerNotificationLue:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors du marquage de la notification",
      error: error.message 
    });
  }
};

// Fonction pour marquer une notification utilisateur comme lue
exports.marquerNotificationUtilisateurLue = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const utilisateurId = req.utilisateur.id;
    
    console.log(`Tentative de marquer la notification utilisateur ${notificationId} comme lue pour l'utilisateur ${utilisateurId}`);
    
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationId,
        utilisateur: utilisateurId
      },
      { lue: true },
      { new: true }
    );

    if (!notification) {
      console.log(`Notification utilisateur ${notificationId} non trouvée pour l'utilisateur ${utilisateurId}`);
      return res.status(404).json({ 
        success: false,
        message: "Notification utilisateur non trouvée" 
      });
    }
    
    console.log(`Notification utilisateur ${notificationId} marquée comme lue avec succès`);
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Erreur marquerNotificationUtilisateurLue:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors du marquage de la notification utilisateur",
      error: error.message 
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    console.log('Récupération du profil pour l\'utilisateur:', req.utilisateur.id);
    
    const utilisateur = await Utilisateur.findById(req.utilisateur.id)
      .populate('categorieId', 'nom description');
    
    if (!utilisateur) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: utilisateur
    });
  } catch (error) {
    console.error('Erreur getProfile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération du profil' 
    });
  }
};

// Fonction pour gérer la connexion via réseaux sociaux (Google, Facebook)

exports.socialLogin = async (req, res) => {
  try {
    console.log('=== DÉBUT SOCIAL LOGIN ===');
    console.log('Données de connexion sociale reçues:', req.body);
    
    const { email, nom, prenom, providerId, providerUserId, photoURL } = req.body;

    console.log('Vérification des champs requis...');
    // Validation des données d'entrée
    if (!email) {
      console.log('Erreur: Email manquant');
      return res.status(400).json({ 
        success: false, 
        message: "L'email est requis pour la connexion sociale" 
      });
    }

    if (!providerId) {
      console.log('Erreur: providerId manquant');
      return res.status(400).json({ 
        success: false, 
        message: "L'identifiant du fournisseur (providerId) est requis" 
      });
    }

    if (!providerUserId) {
      console.log('Erreur: providerUserId manquant');
      return res.status(400).json({ 
        success: false, 
        message: "L'identifiant utilisateur du fournisseur (providerUserId) est requis" 
      });
    }

    console.log('Tous les champs requis sont présents');
    console.log('Recherche de l\'utilisateur avec l\'email:', email);
    
    // Vérifier si l'utilisateur existe déjà avec cet email
    let utilisateur;
    try {
      utilisateur = await Utilisateur.findOne({ email });
      console.log('Résultat de la recherche utilisateur:', utilisateur ? 'Trouvé' : 'Non trouvé');
    } catch (findError) {
      console.error('Erreur lors de la recherche de l\'utilisateur:', findError);
      console.error('Stack trace:', findError.stack);
      return res.status(500).json({ 
        success: false, 
        message: "Erreur lors de la recherche de l'utilisateur", 
        error: findError.message 
      });
    }
    
    if (!utilisateur) {
      // Assurer que le nom et prénom ne sont jamais vides (utiliser des valeurs par défaut si nécessaire)
      const nomFinal = nom || 'Utilisateur';
      const prenomFinal = prenom || 'Social';
      
      console.log('Création d\'un nouvel utilisateur avec les données:', {
        email,
        nom: nomFinal,
        prenom: prenomFinal,
        role: 'UTILISATEUR',
        providerId,
        providerUserId,
        photo: photoURL ? 'Présente' : 'Non fournie'
      });
      
      // Créer un nouvel utilisateur s'il n'existe pas
      try {
        utilisateur = new Utilisateur({
          email,
          nom: nomFinal,
          prenom: prenomFinal,
          role: 'UTILISATEUR',
          providerId,
          providerUserId,
          photo: photoURL || '',
          profilComplet: true // Pour les connexions sociales, on considère le profil comme complet
        });

        console.log('Modèle utilisateur créé, tentative de sauvegarde...');
        await utilisateur.save();
        console.log('Nouvel utilisateur créé via connexion sociale:', utilisateur._id);
      } catch (saveError) {
        console.error('Erreur détaillée lors de la création de l\'utilisateur:', saveError);
        console.error('Stack trace:', saveError.stack);
        console.error('Validation errors:', saveError.errors);
        return res.status(500).json({ 
          success: false, 
          message: "Impossible de créer l'utilisateur", 
          error: saveError.message,
          details: saveError.errors
        });
      }
    } else {
      console.log('Utilisateur existant trouvé, mise à jour des informations:', utilisateur._id);
      // Mettre à jour les informations du fournisseur si l'utilisateur existe déjà
      try {
        console.log('Anciennes valeurs:', {
          providerId: utilisateur.providerId,
          providerUserId: utilisateur.providerUserId,
          photo: utilisateur.photo ? 'Présente' : 'Non définie'
        });
        
        utilisateur.providerId = providerId;
        utilisateur.providerUserId = providerUserId;
        
        // Mettre à jour la photo de profil si elle est fournie et différente
        if (photoURL && photoURL !== utilisateur.photo) {
          console.log('Mise à jour de la photo de profil');
          utilisateur.photo = photoURL;
        }
        
        // Mettre à jour le nom et prénom s'ils sont fournis et que les champs actuels sont vides
        if (nom && (!utilisateur.nom || utilisateur.nom === '')) {
          console.log('Mise à jour du nom');
          utilisateur.nom = nom;
        }
        
        if (prenom && (!utilisateur.prenom || utilisateur.prenom === '')) {
          console.log('Mise à jour du prénom');
          utilisateur.prenom = prenom;
        }
        
        console.log('Tentative de sauvegarde des modifications...');
        await utilisateur.save();
        console.log('Utilisateur existant mis à jour via connexion sociale:', utilisateur._id);
      } catch (updateError) {
        console.error('Erreur détaillée lors de la mise à jour de l\'utilisateur:', updateError);
        console.error('Stack trace:', updateError.stack);
        console.error('Validation errors:', updateError.errors);
        return res.status(500).json({ 
          success: false, 
          message: "Impossible de mettre à jour l'utilisateur", 
          error: updateError.message,
          details: updateError.errors
        });
      }
    }

    // Vérifier que l'utilisateur a bien été créé/mis à jour et a un ID valide
    if (!utilisateur || !utilisateur._id) {
      console.error('Erreur: Utilisateur non valide après création/mise à jour');
      return res.status(500).json({ 
        success: false, 
        message: "Erreur lors de la création/mise à jour de l'utilisateur" 
      });
    }

    console.log('Utilisateur valide, génération du token JWT...');
    // Générer un token JWT
    try {
      console.log('Données pour le token:', {
        id: utilisateur._id,
        role: utilisateur.role
      });
      
      const token = jwt.sign(
        { id: utilisateur._id, role: utilisateur.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      console.log('Token JWT généré avec succès');
      console.log('Préparation de la réponse...');

      const responseData = {
        success: true,
        message: 'Connexion sociale réussie',
        token,
        user: {
          id: utilisateur._id,
          email: utilisateur.email,
          role: utilisateur.role,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          photo: utilisateur.photo,
          profilComplet: utilisateur.profilComplet
        }
      };
      
      console.log('Données de réponse préparées:', {
        ...responseData,
        token: token ? 'Présent' : 'Non généré',
        user: responseData.user ? 'Données utilisateur présentes' : 'Données utilisateur manquantes'
      });
      
      res.status(200).json(responseData);
      console.log('=== FIN SOCIAL LOGIN - SUCCÈS ===');
    } catch (tokenError) {
      console.error('Erreur détaillée lors de la génération du token JWT:', tokenError);
      console.error('Stack trace:', tokenError.stack);
      return res.status(500).json({ 
        success: false, 
        message: "Erreur lors de la génération du token d'authentification", 
        error: tokenError.message 
      });
    }
  } catch (error) {
    console.error('=== ERREUR GLOBALE SOCIAL LOGIN ===');
    console.error('Erreur détaillée de connexion sociale:', error);
    console.error('Stack trace:', error.stack);
    console.error('Type d\'erreur:', error.constructor.name);
    
    // Vérifier si la réponse a déjà été envoyée
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: "Erreur lors de la connexion sociale",
        error: error.message,
        type: error.constructor.name
      });
    } else {
      console.error('Impossible d\'envoyer la réponse d\'erreur: headers déjà envoyés');
    }
    console.error('=== FIN SOCIAL LOGIN - ÉCHEC ===');
  }
};


// Fonction pour créer un rendez-vous
exports.createRendezVous = async (req, res) => {
  try {
    const { professionnelId, date, motif } = req.body;
    const utilisateurId = req.utilisateur.id;
    
    console.log('Création de rendez-vous:', { professionnelId, date, motif, utilisateurId });
    
    // Vérifier que tous les champs requis sont présents
    if (!professionnelId || !date || !motif) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis (professionnelId, date, motif)"
      });
    }
    
    // Vérifier si le professionnel existe
    const professionnel = await Utilisateur.findOne({ 
      _id: professionnelId, 
      role: 'PROF' 
    });
    
    if (!professionnel) {
      return res.status(404).json({ 
        success: false, 
        message: 'Professionnel non trouvé' 
      });
    }
    
    // Vérifier si la date est dans le futur
    const rdvDate = new Date(date);
    const now = new Date();
    
    if (rdvDate <= now) {
      return res.status(400).json({ 
        success: false, 
        message: 'La date du rendez-vous doit être dans le futur' 
      });
    }
    
    // Vérifier si le créneau est disponible
    const disponibilite = await Disponibilite.findOne({
      professionnel: professionnelId,
      debut: { $lte: rdvDate },
      fin: { $gte: rdvDate }
    });
    
    if (!disponibilite) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucune disponibilité trouvée pour cette date' 
      });
    }
    
    // Vérifier si le créneau est déjà réservé
    const existingRdv = await RendezVous.findOne({
      professionnel: professionnelId,
      date: rdvDate,
      status: { $in: ['PENDING', 'CONFIRME'] }
    });
    
    if (existingRdv) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ce créneau est déjà réservé' 
      });
    }
    
    // Créer le rendez-vous
    const rendezVous = new RendezVous({
      utilisateur: utilisateurId,
      professionnel: professionnelId,
      date: rdvDate,
      motif: motif || 'Consultation',
      status: 'PENDING',
      disponibilite: disponibilite._id // Associer le rendez-vous à la disponibilité
    });
    
    await rendezVous.save();
    
    // Récupérer les informations de l'utilisateur pour la notification
    const utilisateur = await Utilisateur.findById(utilisateurId);
    
    // Créer une notification pour le professionnel
    const contenuNotification = `Nouvelle demande de rendez-vous pour le ${rdvDate.toLocaleDateString()} de ${utilisateur.prenom} ${utilisateur.nom}.`;
    
    await creerNotification(
      'RESERVATION',
      contenuNotification,
      professionnelId,
      rendezVous._id
    );
    
    console.log(`Notification créée pour le professionnel ${professionnelId} concernant le rendez-vous ${rendezVous._id}`);
    
    // Récupérer les informations complètes
    const rdvComplet = await RendezVous.findById(rendezVous._id)
      .populate('utilisateur', 'nom prenom email')
      .populate('professionnel', 'nom prenom email specialites tarif');
    
    res.status(201).json({
      success: true,
      message: 'Rendez-vous créé avec succès',
      data: rdvComplet
    });
  } catch (error) {
    console.error('Erreur createRendezVous:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error.message
    });
  }
};
