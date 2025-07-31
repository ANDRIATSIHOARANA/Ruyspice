const CategorieProfessionnel = require('../models/CategorieProfessionnel');
const Utilisateur = require('../models/Utilisateur');
const mongoose = require('mongoose');

// Récupérer toutes les catégories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await CategorieProfessionnel.find();
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Récupérer une catégorie par son ID
exports.getCategorieById = async (req, res) => {
  try {
    const categorie = await CategorieProfessionnel.findById(req.params.id);
    
    if (!categorie) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }
    
    res.status(200).json({
      success: true,
      data: categorie
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Récupérer les professionnels d'une catégorie
exports.getProfessionnelsByCategorie = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Recherche des professionnels pour la catégorie ${id}`);
    
    // Vérifier si l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`ID de catégorie invalide: ${id}`);
      return res.status(400).json({
        success: false,
        message: 'ID de catégorie invalide'
      });
    }
    
    // Vérifier si la catégorie existe
    const categorie = await CategorieProfessionnel.findById(id);
    
    if (!categorie) {
      console.log(`Catégorie ${id} non trouvée`);
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }
    
    console.log(`Catégorie ${id} trouvée: ${categorie.nom}`);
    
    // Récupérer tous les professionnels de cette catégorie
    const professionnels = await Utilisateur.find({
      categorieId: id,
      role: 'PROF'
    }).select('-password -__v');
    
    console.log(`Requête pour trouver les professionnels avec categorieId=${id} et role=PROF`);
    console.log(`Trouvé ${professionnels.length} professionnels pour la catégorie ${id}`);
    
    // Si aucun professionnel n'est trouvé, vérifier si des professionnels existent avec cette catégorie
    if (professionnels.length === 0) {
      // Vérifier tous les professionnels pour déboguer
      const allProfs = await Utilisateur.find({ role: 'PROF' }).select('_id nom prenom email categorieId');
      console.log(`Tous les professionnels (${allProfs.length}):`, allProfs);
      
      // Vérifier si le champ categorieId est correctement défini
      const profsWithCategory = allProfs.filter(prof => prof.categorieId);
      console.log(`Professionnels avec categorieId défini (${profsWithCategory.length}):`, profsWithCategory);
      
      // Vérifier si des professionnels ont la catégorie recherchée
      const profsWithThisCategory = allProfs.filter(prof => prof.categorieId && prof.categorieId.toString() === id);
      console.log(`Professionnels avec categorieId=${id} (${profsWithThisCategory.length}):`, profsWithThisCategory);
    }
    
    res.status(200).json({
      success: true,
      data: professionnels
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des professionnels par catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Créer une nouvelle catégorie
exports.createCategorie = async (req, res) => {
  try {
    console.log('Données reçues pour la création de catégorie:', req.body);
    
    // Vérifier que les champs requis sont présents
    const { nom, description, tarif } = req.body;
    
    if (!nom) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la catégorie est requis'
      });
    }
    
    // Vérifier que le tarif est présent et le convertir en nombre
    if (tarif === undefined || tarif === null || tarif === '') {
      return res.status(400).json({
        success: false,
        message: 'Le tarif est requis'
      });
    }
    
    const tarifNumber = parseFloat(tarif);
    
    if (isNaN(tarifNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Le tarif doit être un nombre valide'
      });
    }
    
    // Créer la nouvelle catégorie
    const categorie = new CategorieProfessionnel({
      nom,
      description: description || '',
      tarif: tarifNumber
    });
    
    await categorie.save();
    console.log('Catégorie créée avec succès:', categorie);
    
    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      data: categorie
    });
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Mettre à jour une catégorie
exports.updateCategorie = async (req, res) => {
  try {
    const { nom, description, tarif } = req.body;
    
    // Vérifier que les champs requis sont présents
    if (!nom) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la catégorie est requis'
      });
    }
    
    // Vérifier que le tarif est présent et le convertir en nombre
    if (tarif === undefined || tarif === null || tarif === '') {
      return res.status(400).json({
        success: false,
        message: 'Le tarif est requis'
      });
    }
    
    const tarifNumber = parseFloat(tarif);
    
    if (isNaN(tarifNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Le tarif doit être un nombre valide'
      });
    }
    
    const categorie = await CategorieProfessionnel.findByIdAndUpdate(
      req.params.id,
      { 
        nom, 
        description: description || '', 
        tarif: tarifNumber 
      },
      { new: true, runValidators: true }
    );
    
    if (!categorie) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Catégorie mise à jour avec succès',
      data: categorie
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Supprimer une catégorie
exports.deleteCategorie = async (req, res) => {
  try {
    const categorie = await CategorieProfessionnel.findByIdAndDelete(req.params.id);
    
    if (!categorie) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Catégorie supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
