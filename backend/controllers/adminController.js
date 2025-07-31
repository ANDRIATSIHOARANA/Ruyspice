const Administrateur = require('../models/Administrateur');
const Utilisateur = require('../models/Utilisateur');
const Professionnel = require('../models/Professionnel');
const CategorieProfessionnel = require('../models/CategorieProfessionnel');
const RendezVous = require('../models/RendezVous');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Connexion admin
exports.connexion = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    
    const admin = await Administrateur.findOne({ email }).select('+motDePasse');
    if (!admin) return res.status(401).json({ message: 'Identifiants invalides' });

    const isMatch = await bcrypt.compare(motDePasse, admin.motDePasse);
    if (!isMatch) return res.status(401).json({ message: 'Identifiants invalides' });

    const token = jwt.sign(
      { id: admin._id, role: 'ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        nom: admin.nom,
        email: admin.email,
        role: 'ADMIN'
      }
    });
  } catch (error) {
    console.error('Erreur connexion admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Gestion utilisateurs
exports.listerUtilisateurs = async (req, res) => {
  try {
    const { search, type } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { nom: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    if (type && type !== 'all') {
      filter.role = type.toUpperCase();
    }

    const utilisateurs = await Utilisateur.find(filter)
      .select('-motDePasse -__v')
      .lean();

    res.json(utilisateurs);
  } catch (error) {
    console.error('Erreur liste utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.modifierUtilisateur = async (req, res) => {
  try {
    const { userId } = req.params;
    const { statut } = req.body;

    const statutsValides = ['ACTIF', 'INACTIF', 'SUSPENDU'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    let update = { statut };

    if (statut === 'INACTIF') {
      update = { ...update, motDePasse: null };
    }

    // Si l'utilisateur est SUSPENDU, invalider complètement l'accès
    if (statut === 'SUSPENDU') {
      update = { 
        ...update, 
        suspendu: true,
        motDePasse: null,
        jeton: null 
      };
    }

    const utilisateur = await Utilisateur.findByIdAndUpdate(
      userId,
      update,
      { new: true, runValidators: true }
    ).select('-motDePasse -__v');

    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    await utilisateur.save();

    res.json(utilisateur);
  } catch (error) {
    console.error('Erreur modification utilisateur:', error);
    res.status(400).json({ message: 'Échec de la mise à jour' });
  }
};


exports.supprimerUtilisateur = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const utilisateur = await Utilisateur.findByIdAndDelete(userId);
    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


exports.listerProfessionnels = async (req, res) => {
  try {
    console.log('Requête pour lister les professionnels reçue'); // Log pour vérifier que la requête est traitée
    const professionnels = await Professionnel.find()
      .select('-motDePasse -__v')
      .populate('categorieId', 'nom')
      .lean();
    console.log('Données des professionnels:', professionnels); // Log pour vérifier les données
    res.json(professionnels);
  } catch (error) {
    console.error('Erreur liste professionnels:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Fonction pour créer un professionnel
exports.creerProfessionnel = async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, telephone, adresse, categorieId } = req.body;
    
    // Vérifier que tous les champs requis sont présents
    if (!nom || !prenom || !email || !motDePasse) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être remplis"
      });
    }
    
    // Vérifier que categorieId est présent pour un professionnel
    if (!categorieId) {
      return res.status(400).json({
        success: false,
        message: "La catégorie est requise pour un professionnel"
      });
    }
    
    // Vérifier que l'ID de catégorie est valide
    if (!mongoose.Types.ObjectId.isValid(categorieId)) {
      return res.status(400).json({
        success: false,
        message: "ID de catégorie invalide"
      });
    }
    
    // Vérifier que la catégorie existe
    const categorieExists = await CategorieProfessionnel.findById(categorieId);
    if (!categorieExists) {
      return res.status(400).json({
        success: false,
        message: "La catégorie spécifiée n'existe pas"
      });
    }
    
    // Vérifier si l'email est déjà utilisé
    const existingUser = await Professionnel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé"
      });
    }
    
    // Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(motDePasse, salt);
    
    // Créer le professionnel
    const newProfessionnel = new Professionnel({
      nom,
      prenom,
      email,
      motDePasse: hashedPassword,
      categorieId,
      telephone: telephone || '',
      adresse: adresse || '',
      statut: 'ACTIF'
    });
    
    await newProfessionnel.save();
    
    // Ne pas renvoyer le mot de passe
    const professionnelSansMdp = newProfessionnel.toObject();
    delete professionnelSansMdp.motDePasse;
    
    res.status(201).json({
      success: true,
      message: "Professionnel créé avec succès",
      data: professionnelSansMdp
    });
  } catch (error) {
    console.error('Erreur lors de la création du professionnel:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du professionnel",
      error: error.message
    });
  }
};

// Dans le fichier adminController.js
// Fonction pour mettre à jour un professionnel
exports.modifierProfessionnel = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, adresse, categorieId, statut } = req.body;
    
    // Vérifier que l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de professionnel invalide"
      });
    }
    
    // Vérifier si le professionnel existe
    const professionnel = await Professionnel.findById(id);
    if (!professionnel) {
      return res.status(404).json({
        success: false,
        message: "Professionnel non trouvé"
      });
    }
    
    // Préparer l'objet de mise à jour
    const updateData = {};
    
    // Mettre à jour les champs de base s'ils sont fournis
    if (nom) updateData.nom = nom;
    if (prenom) updateData.prenom = prenom;
    if (telephone !== undefined) updateData.telephone = telephone;
    if (adresse !== undefined) updateData.adresse = adresse;
    
    // Vérifier l'email s'il est fourni
    if (email && email !== professionnel.email) {
      const existingUser = await Professionnel.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà utilisé"
        });
      }
      updateData.email = email;
    }
    
    // Vérifier et mettre à jour la catégorie si elle est fournie
    if (categorieId) {
      // Vérifier que l'ID de catégorie est valide
      if (!mongoose.Types.ObjectId.isValid(categorieId)) {
        return res.status(400).json({
          success: false,
          message: "ID de catégorie invalide"
        });
      }
      
      // Vérifier que la catégorie existe
      const categorieExists = await CategorieProfessionnel.findById(categorieId);
      if (!categorieExists) {
        return res.status(400).json({
          success: false,
          message: "La catégorie spécifiée n'existe pas"
        });
      }
      
      updateData.categorieId = categorieId;
    }
    
    // Gérer le statut si fourni
    if (statut) {
      const statutsValides = ['ACTIF', 'INACTIF', 'SUSPENDU'];
      if (!statutsValides.includes(statut)) {
        return res.status(400).json({ message: 'Statut invalide' });
      }
      
      updateData.statut = statut;
      
      if (statut === 'INACTIF') {
        updateData.motDePasse = null;
        updateData.forceResetPassword = true;
      }
      
      if (statut === 'SUSPENDU') {
        updateData.suspendu = true;
        updateData.motDePasse = null;
        updateData.jeton = null;
      }
    }
    
    // Effectuer la mise à jour
    const professionnelMisAJour = await Professionnel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-motDePasse -__v');
    
    // Log des données après mise à jour
    console.log('Données après mise à jour:', professionnelMisAJour);
    
    res.json({
      success: true,
      message: "Professionnel mis à jour avec succès",
      data: professionnelMisAJour
    });
  } catch (error) {
    console.error('Erreur modification professionnel:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du professionnel",
      error: error.message
    });
  }
};

// Suppression d'un professionnel
exports.supprimerProfessionnel = async (req, res) => {
  try {
    const { id } = req.params;
    await Professionnel.findByIdAndDelete(id);
    res.json({ message: 'Professionnel supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression professionnel:', error);
    res.status(500).json({ message: 'Échec de la suppression' });
  }
};

// Gestion catégories
exports.listerCategories = async (req, res) => {
  try {
    const categories = await CategorieProfessionnel.find().select('-__v');
    res.json(categories);
  } catch (error) {
    console.error('Erreur liste catégories:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Ajouter cette fonction dans votre adminController.js

exports.getProfessionnelsByCategorie = async (req, res) => {
  try {
    const { id } = req.params;
    
    const professionnels = await Professionnel.find({ categorieId: id })
      .select('-motDePasse -__v')
      .lean();
    
    if (!professionnels) {
      return res.status(404).json({ message: 'Aucun professionnel trouvé pour cette catégorie' });
    }

    res.json(professionnels);
  } catch (error) {
    console.error('Erreur lors de la récupération des professionnels par catégorie:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.creerCategorie = async (req, res) => {
  try {
    const { nom, description } = req.body;
    
    const nouvelleCategorie = new CategorieProfessionnel({
      nom,
      description
    });

    await nouvelleCategorie.save();
    res.status(201).json(nouvelleCategorie);
  } catch (error) {
    console.error('Erreur création catégorie:', error);
    res.status(400).json({ message: 'Erreur de validation' });
  }
};

exports.modifierCategorie = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const categorie = await CategorieProfessionnel.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!categorie) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }

    res.json(categorie);
  } catch (error) {
    console.error('Erreur modification catégorie:', error);
    res.status(400).json({ message: 'Échec de la mise à jour' });
  }
};

exports.supprimerCategorie = async (req, res) => {
  try {
    const { id } = req.params;
    
    const categorie = await CategorieProfessionnel.findByIdAndDelete(id);
    if (!categorie) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }

    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression catégorie:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer tous les rendez-vous
exports.getAllRendezVous = async (req, res) => {
  try {
    // Récupérer tous les rendez-vous avec les informations des utilisateurs et professionnels
    const rendezVous = await RendezVous.find()
      .populate('utilisateur', 'nom prenom email')
      .populate('professionnel', 'nom prenom email')
      .sort({ date: -1 });
    
    // Compter les rendez-vous par statut
    const confirmes = rendezVous.filter(rdv => rdv.status === 'CONFIRME').length;
    const annules = rendezVous.filter(rdv => rdv.status === 'ANNULE').length;
    const pending = rendezVous.filter(rdv => rdv.status === 'PENDING').length;
    
    res.json({
      rendezVous,
      stats: {
        total: rendezVous.length,
        confirmes,
        annules,
        pending
      }
    });
  } catch (error) {
    console.error('Erreur getAllRendezVous:', error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des rendez-vous",
      error: error.message 
    });
  }
};

// Statistiques
exports.voirStatistiques = async (req, res) => {
  try {
    const [utilisateurs, professionnels, rendezVous] = await Promise.all([
      Utilisateur.countDocuments(),
      Professionnel.countDocuments(),
      RendezVous.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            confirmes: { $sum: { $cond: [{ $eq: ["$status", "Confirmé"] }, 1, 0] } },
            annules: { $sum: { $cond: [{ $eq: ["$status", "Annulé"] }, 1, 0] } }
          }
        }
      ])
    ]);

    res.json({
      utilisateurs,
      professionnels,
      rendezVous: {
        total: rendezVous[0]?.total || 0,
        confirmes: rendezVous[0]?.confirmes || 0,
        annules: rendezVous[0]?.annules || 0
      }
    });
  } catch (error) {
    console.error('Erreur statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = exports;
