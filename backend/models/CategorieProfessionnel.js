const mongoose = require('mongoose');

const categorieProfessionnelSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom de la catégorie est requis'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  tarif: {
    type: Number,
    required: [true, 'Le tarif est requis'],
    min: [0, 'Le tarif ne peut pas être négatif']
  },
  specialites: {
    type: [String],
    default: []
  }
}, { timestamps: true });
// Méthode statique pour ajouter une catégorie
categorieProfessionnelSchema.statics.ajouterCategorie = async function(categorieData) {
  try {
    const categorie = await this.create(categorieData);
    return categorie;
  } catch (error) {
    throw new Error(`Erreur lors de l'ajout de la catégorie: ${error.message}`);
  }
};

// Méthode statique pour supprimer une catégorie
categorieProfessionnelSchema.statics.supprimerCategorie = async function(id) {
  try {
    const categorie = await this.findByIdAndDelete(id);
    if (!categorie) {
      throw new Error('Catégorie non trouvée');
    }
    return categorie;
  } catch (error) {
    throw new Error(`Erreur lors de la suppression de la catégorie: ${error.message}`);
  }
};

// Méthode statique pour mettre à jour une catégorie
categorieProfessionnelSchema.statics.mettreAJourCategorie = async function(id, updateData) {
  try {
    const categorie = await this.findByIdAndUpdate(id, updateData, { 
      new: true,
      runValidators: true
    });
    
    if (!categorie) {
      throw new Error('Catégorie non trouvée');
    }
    
    return categorie;
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour de la catégorie: ${error.message}`);
  }
};

categorieProfessionnelSchema.statics.ajouterSpecialites = async function(id, specialites) {
  try {
    const categorie = await this.findById(id);
    if (!categorie) {
      throw new Error('Catégorie non trouvée');
    }
    
    // Ajouter les nouvelles spécialités sans doublons
    const specialitesUniques = [...new Set([...categorie.specialites, ...specialites])];
    categorie.specialites = specialitesUniques;
    
    await categorie.save();
    return categorie;
  } catch (error) {
    throw new Error(`Erreur lors de l'ajout des spécialités: ${error.message}`);
  }
};

// Méthode pour lier un professionnel à une catégorie
categorieProfessionnelSchema.statics.lierAProfessionnel = async function(professionnelId, specialite) {
  try {
    const categorie = await this.findOne({ 
      specialites: specialite 
    });
    
    if (!categorie) {
      throw new Error('Spécialité non trouvée dans une catégorie');
    }
    
    const professionnel = await mongoose.model('Professionnel').findById(professionnelId);
    if (!professionnel) {
      throw new Error('Professionnel non trouvé');
    }
    
    professionnel.categorieId = categorie._id;
    professionnel.specialites = [...new Set([...professionnel.specialites, specialite])];
    await professionnel.save();
    
    return professionnel;
  } catch (error) {
    throw new Error(`Erreur lors de la liaison professionnel-categorie: ${error.message}`);
  }
};

module.exports = mongoose.model('CategorieProfessionnel', categorieProfessionnelSchema);
