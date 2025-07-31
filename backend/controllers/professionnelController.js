const Professionnel = require('../models/Professionnel');
const jwt = require('jsonwebtoken');
const RendezVous = require('../models/RendezVous');
const Utilisateur = require('../models/Utilisateur');
const bcrypt = require('bcryptjs')
const Disponibilite = require('../models/Disponibilite');
const CategorieProfessionnel = require('../models/CategorieProfessionnel');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');

exports.inscription = async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse } = req.body;
    
    // Vérifier si le professionnel existe déjà
    const existingProf = await Professionnel.findOne({ email });
    if (existingProf) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Créer un nouveau professionnel avec les champs obligatoires uniquement
    const professionnel = new Professionnel({
      nom,
      prenom,
      email,
      motDePasse,
      role: 'PROF',
      specialites: [], // Tableau vide par défaut
      description: '', // Chaîne vide par défaut
      photo: '', // Chaîne vide par défaut
      tarif: '', // Tarif vide par défaut
      historiqueRendezVous: [] // Tableau vide par défaut
    });
    
    await professionnel.save();

    const token = jwt.sign(
      { id: professionnel._id, role: 'PROF' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      token,
      professionnel: {
        id: professionnel._id,
        nom: professionnel.nom,
        prenom: professionnel.prenom,
        email: professionnel.email,
        role: professionnel.role,
        tarif: professionnel.tarif // Inclure le tarif dans la réponse
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};

// Fonction pour supprimer définitivement un rendez-vous
exports.supprimerRendezVous = async (req, res) => {
  try {
    const rendezVousId = req.params.id;
    
    // Vérifier si l'ID est valide
    if (!rendezVousId) {
      return res.status(400).json({ 
        success: false,
        message: "ID de rendez-vous manquant" 
      });
    }
    
    const rendezVous = await RendezVous.findOneAndUpdate(
      { 
        _id: rendezVousId,
        professionnel: req.utilisateur.id
      },
      { supprimeProfessionnel: true },
      { new: true }
    ).populate('utilisateur', 'nom prenom email')
     .populate('professionnel', 'nom prenom');

    if (!rendezVous) {
      return res.status(404).json({ 
        success: false,
        message: "Rendez-vous non trouvé ou vous n'êtes pas autorisé à le supprimer" 
      });
    }
    
    // Créer une notification pour l'utilisateur (client)
    const notificationUtilisateur = new Notification({
      contenu: `Votre rendez-vous du ${new Date(rendezVous.date).toLocaleDateString()} avec ${rendezVous.professionnel.prenom} ${rendezVous.professionnel.nom} a été supprimé.`,
      utilisateur: rendezVous.utilisateur._id,
      type: 'ANNULATION', // Utiliser une valeur valide selon le schéma
      rendezVousId: rendezVous._id, // Inclure l'ID du rendez-vous
      lue: false,
      dateCreation: new Date()
    });
    
    console.log('Notification pour l\'utilisateur créée (avant sauvegarde):', notificationUtilisateur);
    await notificationUtilisateur.save();
    console.log('Notification pour l\'utilisateur sauvegardée avec succès');
    
    res.json({
      success: true,
      message: "Rendez-vous supprimé avec succès et notification envoyée au client"
    });
  } catch (error) {
    console.error('Erreur supprimerRendezVous:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la suppression du rendez-vous",
      error: error.message 
    });
  }
};

// Fonction pour récupérer les notifications du professionnel
exports.getNotifications = async (req, res) => {
  try {
    const professionnelId = req.utilisateur.id;
    console.log(`Récupération des notifications pour le professionnel ${professionnelId}`);
    
    // Vérifier que l'ID est valide
    if (!professionnelId) {
      console.error('ID de professionnel invalide');
      return res.status(400).json({
        success: false,
        message: "ID de professionnel invalide"
      });
    }
    
    // Récupérer toutes les notifications pour ce professionnel
    const notifications = await Notification.find({ 
      professionnel: professionnelId 
    })
    .sort({ dateCreation: -1 })
    .populate('rendezVousId');

    console.log(`${notifications.length} notifications récupérées pour le professionnel ${professionnelId}`);
    
    // Journaliser les notifications pour le débogage
    if (notifications.length === 0) {
      console.log('Aucune notification trouvée pour ce professionnel');
      
      // Vérifier s'il y a des notifications dans la base de données
      const allNotifications = await Notification.find({}).limit(5);
      console.log(`Nombre total de notifications dans la base de données (échantillon): ${allNotifications.length}`);
      if (allNotifications.length > 0) {
        console.log('Exemples de notifications existantes:', allNotifications);
      }
    } else {
      console.log('Premières notifications:', notifications.slice(0, 3));
    }

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

// Fonction pour marquer une notification comme lue
exports.marquerNotificationLue = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const professionnelId = req.utilisateur.id;
    
    // Journaliser pour le débogage
    console.log(`Tentative de marquer la notification ${notificationId} comme lue pour le professionnel ${professionnelId}`);
    
    // Vérification de l'existence de req.utilisateur
    if (!req.utilisateur || !req.utilisateur.id) {
      console.error('Erreur marquerNotificationLue: Utilisateur non authentifié ou ID manquant');
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié ou ID manquant'
      });
    }
    
    // Vérifier que l'ID est valide
    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      console.error(`ID de notification invalide: ${notificationId}`);
      return res.status(400).json({ 
        success: false,
        message: "ID de notification invalide" 
      });
    }
    
    // Vérifier d'abord si la notification existe
    const notificationExiste = await Notification.findById(notificationId);
    if (!notificationExiste) {
      console.log(`Notification ${notificationId} non trouvée dans la base de données`);
      return res.status(404).json({ 
        success: false,
        message: "Notification non trouvée" 
      });
    }
    
    // Vérifier si la notification appartient au professionnel
    if (notificationExiste.professionnel.toString() !== professionnelId) {
      console.log(`La notification ${notificationId} n'appartient pas au professionnel ${professionnelId}`);
      return res.status(403).json({ 
        success: false,
        message: "Vous n'êtes pas autorisé à modifier cette notification" 
      });
    }
    
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationId,
        professionnel: professionnelId
      },
      { lue: true },
      { new: true }
    );

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

exports.connexion = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    const professionnel = await Professionnel.findOne({ email });
    
    if (!professionnel || professionnel.motDePasse !== motDePasse) {
      return res.status(401).json({ 
        success: false,
        message: 'Identifiants incorrects' 
      });
    }

    const token = jwt.sign(
      { id: professionnel._id, role: 'Prof' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      professionnel: {
        id: professionnel._id,
        nom: professionnel.nom,
        email: professionnel.email
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message 
    });
  }
};

exports.getProfil = async (req, res) => {
  try {
    // Vérification de l'existence de req.utilisateur
    if (!req.utilisateur) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const professionnel = await Utilisateur.findOne({
      _id: req.utilisateur.id,
      role: 'PROF'
    })
    .select('-password')
    .populate('categorieId', 'nom description');

    if (!professionnel) {
      return res.status(404).json({
        success: false,
        message: 'Professionnel non trouvé'
      });
    }

    // Vérifier si le profil est complet
    let avertissement = null;
    if (!professionnel.categorieId) {
      avertissement = 'Votre profil est incomplet. Veuillez ajouter une catégorie professionnelle.';
    }

    res.json({
      success: true,
      professionnel: {
        id: professionnel._id,
        nom: professionnel.nom,
        prenom: professionnel.prenom,
        email: professionnel.email,
        role: professionnel.role,
        specialites: professionnel.specialites,
        description: professionnel.description,
        photo: professionnel.photo,
        tarif: professionnel.tarif,
        categorie: professionnel.categorieId,
        profilComplet: !!professionnel.categorieId
      },
      avertissement
    });
  } catch (error) {
    console.error('Erreur getProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};


exports.modifierProfil = async (req, res) => {
  try {
    console.log('Données reçues dans modifierProfil (req.body):', {
      ...req.body,
      motDePasse: req.body.motDePasse ? '******' : undefined
    });
    console.log('Fichiers reçus:', req.file);
    
    const professionnel = await Utilisateur.findOne({ _id: req.utilisateur.id, role: 'PROF' });
    
    if (!professionnel) {
      return res.status(404).json({
        success: false,
        message: "Professionnel non trouvé"
      });
    }
    
    // Traitement des données de base
    const { nom, prenom, email, description, specialites, tarif, categorieId, motDePasse } = req.body;
    
    // Mise à jour des champs de base si fournis
    if (nom) professionnel.nom = nom;
    if (prenom) professionnel.prenom = prenom;
    if (email) professionnel.email = email;
    if (description !== undefined) professionnel.description = description;
    
    // Traitement des spécialités
    if (specialites) {
      try {
        if (typeof specialites === 'string') {
          professionnel.specialites = JSON.parse(specialites);
        } else if (Array.isArray(specialites)) {
          professionnel.specialites = specialites;
        } else {
          professionnel.specialites = [specialites];
        }
        console.log('Spécialités traitées:', professionnel.specialites);
      } catch (e) {
        console.error('Erreur lors du traitement des spécialités:', e);
        // En cas d'erreur, essayer de traiter comme une chaîne simple
        if (typeof specialites === 'string') {
          professionnel.specialites = specialites.split(',').map(s => s.trim());
        }
      }
    }
    
    // Traitement du tarif
    if (tarif !== undefined) {
      professionnel.tarif = parseFloat(tarif) || 0;
    }
    
    // Traitement de la catégorie
    if (categorieId) {
      professionnel.categorieId = categorieId;
    }
    
    // Traitement de la photo
    if (req.file) {
      // Si une nouvelle photo est téléchargée
      professionnel.photo = `/uploads/photos/${req.file.filename}`;
      console.log('Nouvelle photo enregistrée:', professionnel.photo);
    } else if (req.body.photoPath) {
      // Si un chemin de photo existant est fourni
      professionnel.photo = req.body.photoPath;
      console.log('Chemin de photo existant conservé:', professionnel.photo);
    } else if (req.body.photo) {
      // Si une photo est fournie dans le corps de la requête
      if (typeof req.body.photo === 'object' && Object.keys(req.body.photo).length === 0) {
        professionnel.photo = '';
      } else {
        professionnel.photo = req.body.photo;
      }
      console.log('Photo fournie dans le corps de la requête:', professionnel.photo);
    }
    
    // Traitement du mot de passe
    if (motDePasse) {
      const salt = await bcrypt.genSalt(10);
      professionnel.motDePasse = await bcrypt.hash(motDePasse, salt);
    }
    
    // Résumé des données après traitement
    const dataToUpdate = {
      nom: professionnel.nom,
      prenom: professionnel.prenom,
      email: professionnel.email,
      description: professionnel.description,
      specialites: professionnel.specialites,
      photo: professionnel.photo,
      tarif: professionnel.tarif,
      categorieId: professionnel.categorieId
    };
    
    console.log('Données après traitement:', dataToUpdate);
    
    // Sauvegarder les modifications
    await professionnel.save();
    
    res.status(200).json({
      success: true,
      message: "Profil mis à jour avec succès",
      professionnel: {
        id: professionnel._id,
        nom: professionnel.nom,
        prenom: professionnel.prenom,
        email: professionnel.email,
        role: professionnel.role,
        specialites: professionnel.specialites,
        description: professionnel.description,
        photo: professionnel.photo,
        tarif: professionnel.tarif,
        categorieId: professionnel.categorieId,
        profilComplet: !!professionnel.categorieId
      },
      photoUrl: professionnel.photo // Renvoyer l'URL de la photo pour la persistance côté client
    });
  } catch (error) {
    console.error('Erreur dans modifierProfil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour du profil', 
      error: error.message 
    });
  }
};

exports.getListe = async (req, res) => {
  try {
    console.log('GET /professionnels - Début de la requête');
    const professionnels = await Utilisateur.find(
      { role: 'PROF' },
      '-password'
    );
    console.log(`GET /professionnels - ${professionnels.length} professionnels trouvés`);
    res.json({
      success: true,
      data: professionnels
    });
  } catch (error) {
    console.error('GET /professionnels - Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des professionnels",
      error: error.message
    });
  }
};

exports.getDisponibilitesByDate = async (req, res) => {
  try {
    const { proId } = req.params;
    const { date, disponible, all } = req.query;

    // Validation du proId
    if (!proId) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant du professionnel est requis"
      });
    }

    // Vérifier si le professionnel existe
    const professionnel = await Utilisateur.findOne({ _id: proId, role: 'PROF' });
    if (!professionnel) {
      return res.status(404).json({ 
        success: false,
        message: 'Professionnel non trouvé' 
      });
    }

    // Construire la requête de base pour les disponibilités
    let query = { professionnel: proId };
    
    // Filtrer par date si spécifiée
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.debut = { $gte: startOfDay, $lte: endOfDay };
    } else {
      // Si pas de date spécifiée, prendre les disponibilités à partir de maintenant
      const currentDate = new Date();
      query.debut = { $gte: currentDate };
    }
    
    // Récupérer les disponibilités
    const disponibilites = await Disponibilite.find(query).sort({ debut: 1 });
    
    // Si on veut toutes les disponibilités (pour le professionnel lui-même)
    if (all === 'true') {
      return res.status(200).json({
        success: true,
        data: disponibilites
      });
    }
    
    // Si on veut uniquement les disponibilités non réservées
    if (disponible === 'true' || disponible === undefined) {
      // Récupérer tous les rendez-vous pour ce professionnel
      const rendezVous = await RendezVous.find({
        professionnel: proId,
        status: { $in: ['PENDING', 'CONFIRME'] } // Rendez-vous en attente ou confirmés
      });
      
      // Filtrer les disponibilités qui ne sont pas déjà réservées
      const disponibilitesFiltered = disponibilites.filter(dispo => {
        // Vérifier si cette disponibilité est déjà réservée
        const isReserved = rendezVous.some(rdv => {
          const rdvDate = new Date(rdv.date);
          const dispoDebut = new Date(dispo.debut);
          const dispoFin = new Date(dispo.fin);
          
          // Un rendez-vous est considéré comme chevauchant si sa date est entre le début et la fin de la disponibilité
          return rdvDate >= dispoDebut && rdvDate <= dispoFin;
        });
        
        // Si l'utilisateur est celui qui a réservé, on inclut quand même la disponibilité
        if (isReserved && req.utilisateur) {
          const isUserReservation = rendezVous.some(rdv => {
            const rdvDate = new Date(rdv.date);
            const dispoDebut = new Date(dispo.debut);
            const dispoFin = new Date(dispo.fin);
            
            return (
              rdvDate >= dispoDebut && 
              rdvDate <= dispoFin &&
              rdv.utilisateur.toString() === req.utilisateur.id
            );
          });
          
          return isUserReservation;
        }
        
        return !isReserved;
      });
      
      return res.status(200).json({
        success: true,
        data: disponibilitesFiltered
      });
    }
    
    // Par défaut, retourner toutes les disponibilités
    return res.status(200).json({
      success: true,
      data: disponibilites
    });
  } catch (error) {
    console.error('Erreur getDisponibilitesByDate:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des disponibilités",
      error: error.message
    });
  }
};


exports.getProfessionnel = async (req, res) => {
  try {
    const professionnel = await Professionnel.findById(req.params.id, '-motDePasse');
    if (!professionnel) {
      return res.status(404).json({ error: 'Professionnel non trouvé' });
    }
    res.json(professionnel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProfessionnelsByCategorie = async (req, res) => {
  try {
    const { id } = req.params;
    
    const categorie = await CategorieProfessionnel.findById(id);
    
    if (!categorie) {
      return res.status(404).json({ 
        success: false, 
        message: 'Catégorie non trouvée' 
      });
    }

    // Récupérer tous les professionnels de cette catégorie
    const professionnels = await Professionnel.find({ 
      categorieId: id 
    }).select('-motDePasse -__v');

    res.status(200).json({
      success: true,
      data: professionnels
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des professionnels:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
};

exports.getDisponibilites = async (req, res) => {
  try {
    const professionnelId = req.utilisateur.id;
    const { date, disponible } = req.query;
    
    console.log('Récupération des disponibilités pour le professionnel:', professionnelId);
    
    // Construire la requête pour les disponibilités
    let query = { professionnel: professionnelId };
    
    // Filtrer par date si spécifiée
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.debut = { $gte: startOfDay, $lte: endOfDay };
    } else {
      // Si pas de date spécifiée, prendre les disponibilités à partir de maintenant
      const currentDate = new Date();
      query.debut = { $gte: currentDate };
    }
    
    // Récupérer toutes les disponibilités du professionnel
    const disponibilites = await Disponibilite.find(query).sort({ debut: 1 });
    
    console.log(`Trouvé ${disponibilites.length} disponibilités`);
    
    // Si on veut uniquement les disponibilités non réservées
    if (disponible === 'true') {
      // Récupérer tous les rendez-vous pour ce professionnel
      const rendezVous = await RendezVous.find({
        professionnel: professionnelId,
        status: { $in: ['PENDING', 'CONFIRME'] } // Rendez-vous en attente ou confirmés
      });
      
      // Filtrer les disponibilités qui ne sont pas déjà réservées
      const disponibilitesFiltered = disponibilites.filter(dispo => {
        // Vérifier si cette disponibilité est déjà réservée
        const isReserved = rendezVous.some(rdv => {
          const rdvDate = new Date(rdv.date);
          const dispoDebut = new Date(dispo.debut);
          const dispoFin = new Date(dispo.fin);
          
          // Un rendez-vous est considéré comme chevauchant si sa date est entre le début et la fin de la disponibilité
          return rdvDate >= dispoDebut && rdvDate <= dispoFin;
        });
        
        // Si l'utilisateur est celui qui a réservé, on inclut quand même la disponibilité
        if (isReserved && req.utilisateur) {
          const isUserReservation = rendezVous.some(rdv => {
            const rdvDate = new Date(rdv.date);
            const dispoDebut = new Date(dispo.debut);
            const dispoFin = new Date(dispo.fin);
            
            return (
              rdvDate >= dispoDebut && 
              rdvDate <= dispoFin &&
              rdv.utilisateur.toString() === req.utilisateur.id
            );
          });
          
          return isUserReservation;
        }
        
        // Si la disponibilité n'est pas réservée, on l'inclut
        return !isReserved;
      });
      
      return res.status(200).json({
        success: true,
        data: disponibilitesFiltered
      });
    }
    
    // Renvoyer un format cohérent
    res.status(200).json({
      success: true,
      data: disponibilites
    });
  } catch (error) {
    console.error('Erreur getDisponibilites:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération des disponibilités",
      error: error.message 
    });
  }
};



exports.ajouterDisponibilite = async (req, res) => {
  try {
    const { debut, fin } = req.body.disponibilite;

    // Conversion explicite en Date
    const startDate = new Date(debut);
    const endDate = new Date(fin);

    // Validation renforcée
    if (!startDate || !endDate || isNaN(startDate) || isNaN(endDate)) {
      return res.status(400).json({ message: "Format de date invalide" });
    }

    if (endDate <= startDate) {
      return res.status(400).json({ 
        message: "La fin doit être après le début" 
      });
    }

    // Vérification de chevauchement corrigée
    const chevauchement = await Disponibilite.findOne({
      professionnel: req.utilisateur.id,
      $or: [
        { debut: { $lt: endDate }, fin: { $gt: startDate } },
        { debut: { $gte: startDate, $lte: endDate } }
      ]
    });

    if (chevauchement) {
      return res.status(400).json({
        message: "Cette plage horaire chevauche une disponibilité existante"
      });
    }

    // Créer la nouvelle disponibilité
    const disponibilite = new Disponibilite({
      professionnel: req.utilisateur.id,
      debut: debut,
      fin: fin,
      status: 'disponible'
    });

    await disponibilite.save();

    res.status(201).json(disponibilite);
  } catch (error) {
    console.error('Erreur ajouterDisponibilite:', error);
    res.status(500).json({
      message: "Erreur lors de l'ajout de la disponibilité",
      error: error.message
    });
  }
};


exports.uploadPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: "Aucune photo n'a été uploadée" 
            });
        }

        const professionnel = await Utilisateur.findOne({ _id: req.utilisateur.id, role: 'PROF' });
        if (!professionnel) {
            return res.status(404).json({ 
                success: false, 
                message: "Professionnel non trouvé" 
            });
        }

        // Mettre à jour le chemin de la photo dans la base de données
        const photoUrl = `/uploads/photos/${req.file.filename}`;
        professionnel.photo = photoUrl;
        await professionnel.save();

        console.log(`Photo mise à jour pour ${professionnel.prenom} ${professionnel.nom}: ${photoUrl}`);

        res.json({
            success: true,
            message: "Photo mise à jour avec succès",
            photoUrl: photoUrl,
            professionnel: {
                id: professionnel._id,
                nom: professionnel.nom,
                prenom: professionnel.prenom,
                email: professionnel.email,
                role: professionnel.role,
                specialites: professionnel.specialites,
                description: professionnel.description,
                photo: photoUrl,
                tarif: professionnel.tarif,
                categorieId: professionnel.categorieId,
                profilComplet: !!professionnel.categorieId
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

exports.supprimerDisponibilite = async (req, res) => {
  try {
    const disponibilite = await Disponibilite.findOne({
      _id: req.params.id,
      professionnel: req.utilisateur.id
    });

    if (!disponibilite) {
      return res.status(404).json({
        success: false,
        message: "Disponibilité non trouvée"
      });
    }

    if (disponibilite.status === 'reserve') {
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer une disponibilité réservée"
      });
    }

    // Utiliser deleteOne() au lieu de remove()
    await Disponibilite.deleteOne({ _id: req.params.id });
    
    res.status(200).json({ 
      success: true,
      message: "Disponibilité supprimée avec succès" 
    });
  } catch (error) {
    console.error('Erreur supprimerDisponibilite:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la disponibilité",
      error: error.message
    });
  }
};


exports.getAppointments = async (req, res) => {
  try {
    const appointments = await RendezVous.find({ 
      professionnel: req.utilisateur.id,
      supprimeProfessionnel: { $ne: true }
    })
    .populate('utilisateur', 'nom prenom email')
    .sort({ date: -1 });

    res.json(appointments);
  } catch (error) {
    console.error('Erreur getAppointments:', error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des rendez-vous",
      error: error.message 
    });
  }
};



// controllers/professionnelController.js
exports.getStats = async (req, res) => {
  try {
    const totalAppointments = await RendezVous.countDocuments({ 
      professionnel: req.utilisateur.id 
    });
    
    const confirmedAppointments = await RendezVous.countDocuments({ 
      professionnel: req.utilisateur.id,
      status: 'CONFIRME'
    });

    const pendingAppointments = await RendezVous.countDocuments({ 
      professionnel: req.utilisateur.id,
      status: 'PENDING'
    });

    const stats = {
      total: totalAppointments,
      confirmes: confirmedAppointments,
      enAttente: pendingAppointments,
      tauxConfirmation: totalAppointments ? 
        Math.round((confirmedAppointments / totalAppointments) * 100) : 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Erreur getStats:', error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des statistiques",
      error: error.message 
    });
  }
};

exports.accepterRendezVous = async (req, res) => {
  try {
    console.log(`Tentative d'acceptation du rendez-vous ${req.params.id} par le professionnel ${req.utilisateur.id}`);
    
    const rendezVous = await RendezVous.findOneAndUpdate(
      { 
        _id: req.params.id,
        professionnel: req.utilisateur.id,
        status: 'PENDING'
      },
      { status: 'CONFIRME' },
      { new: true }
    ).populate('utilisateur', 'nom prenom email')
     .populate('professionnel', 'nom prenom');

    if (!rendezVous) {
      console.log(`Rendez-vous ${req.params.id} non trouvé ou déjà traité`);
      return res.status(404).json({ message: "Rendez-vous non trouvé ou déjà traité" });
    }

    console.log(`Rendez-vous ${req.params.id} accepté:`, rendezVous);
    
    // Créer une notification pour l'utilisateur (client)
    const notificationUtilisateur = new Notification({
      contenu: `Votre rendez-vous du ${new Date(rendezVous.date).toLocaleDateString()} avec ${rendezVous.professionnel.prenom} ${rendezVous.professionnel.nom} a été confirmé.`,
      utilisateur: rendezVous.utilisateur._id,
      type: 'CONFIRMATION',
      rendezVousId: rendezVous._id, // Inclure l'ID du rendez-vous
      lue: false,
      dateCreation: new Date()
    });
    
    console.log('Notification pour l\'utilisateur créée (avant sauvegarde):', notificationUtilisateur);
    await notificationUtilisateur.save();
    console.log('Notification pour l\'utilisateur sauvegardée avec succès');
    
    res.json({
      rendezVous,
      message: "Rendez-vous accepté avec succès et notification envoyée au client"
    });
  } catch (error) {
    console.error('Erreur accepterRendezVous:', error);
    res.status(500).json({ 
      message: "Erreur lors de l'acceptation du rendez-vous",
      error: error.message 
    });
  }
};

exports.refuserRendezVous = async (req, res) => {
  try {
    console.log(`Tentative de refus du rendez-vous ${req.params.id} par le professionnel ${req.utilisateur.id}`);
    
    const rendezVous = await RendezVous.findOneAndUpdate(
      { 
        _id: req.params.id,
        professionnel: req.utilisateur.id,
        status: 'PENDING'
      },
      { status: 'ANNULE' },
      { new: true }
    ).populate('utilisateur', 'nom prenom email')
     .populate('professionnel', 'nom prenom');

    if (!rendezVous) {
      console.log(`Rendez-vous ${req.params.id} non trouvé ou déjà traité`);
      return res.status(404).json({ message: "Rendez-vous non trouvé ou déjà traité" });
    }

    console.log(`Rendez-vous ${req.params.id} refusé:`, rendezVous);
    
    // Créer une notification pour l'utilisateur (client)
    const notificationUtilisateur = new Notification({
      contenu: `Votre rendez-vous du ${new Date(rendezVous.date).toLocaleDateString()} avec ${rendezVous.professionnel.prenom} ${rendezVous.professionnel.nom} a été refusé.`,
      utilisateur: rendezVous.utilisateur._id,
      type: 'REFUS',
      rendezVousId: rendezVous._id, // Inclure l'ID du rendez-vous
      lue: false,
      dateCreation: new Date()
    });
    
    console.log('Notification pour l\'utilisateur créée (avant sauvegarde):', notificationUtilisateur);
    await notificationUtilisateur.save();
    console.log('Notification pour l\'utilisateur sauvegardée avec succès');
    
    res.json({
      rendezVous,
      message: "Rendez-vous refusé avec succès et notification envoyée au client"
    });
  } catch (error) {
    console.error('Erreur refuserRendezVous:', error);
    res.status(500).json({ 
      message: "Erreur lors du refus du rendez-vous",
      error: error.message 
    });
  }
};
