const CategorieProfessionnel = require('../models/CategorieProfessionnel');

// Récupérer toutes les catégories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await CategorieProfessionnel.find();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
      error: error.message
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
    const newCategory = new CategorieProfessionnel({
      nom,
      description: description || '',
      tarif: tarifNumber
    });
    
    // Sauvegarder la catégorie dans la base de données
    const savedCategory = await newCategory.save();
    console.log('Catégorie créée avec succès:', savedCategory);
    
    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      data: savedCategory
    });
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la catégorie',
      error: error.message
    });
  }
};

// Mettre à jour une catégorie
exports.updateCategorie = async (req, res) => {
  try {
    console.log(`Mise à jour de la catégorie ${req.params.id} avec les données:`, req.body);
    
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
    
    // Mettre à jour la catégorie
    const updatedCategory = await CategorieProfessionnel.findByIdAndUpdate(
      req.params.id,
      { 
        nom, 
        description: description || '', 
        tarif: tarifNumber 
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }
    
    console.log('Catégorie mise à jour avec succès:', updatedCategory);
    
    res.json({
      success: true,
      message: 'Catégorie mise à jour avec succès',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la catégorie',
      error: error.message
    });
  }
};

// Supprimer une catégorie
exports.deleteCategorie = async (req, res) => {
  try {
    const deletedCategory = await CategorieProfessionnel.findByIdAndDelete(req.params.id);
    
    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }
    
    res.json({
      success: true,
      message: 'Catégorie supprimée avec succès',
      data: {}
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la catégorie',
      error: error.message
    });
  }
};