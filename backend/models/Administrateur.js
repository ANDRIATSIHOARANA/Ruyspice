// models/Administrateur.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const administrateurSchema = new Schema({
  nom: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  motDePasse: {
    type: String,
    required: true
  }
}, { timestamps: true });

administrateurSchema.pre('save', async function(next) {
  if (this.isModified('motDePasse')) {
    this.motDePasse = await bcrypt.hash(this.motDePasse, 10);
  }
  next();
});

administrateurSchema.methods = {
  gererUtilisateurs: async function(action, userId, donnees) {
    const Utilisateur = mongoose.model('Utilisateur');
    try {
      switch(action) {
        case 'CREER':
          return await Utilisateur.create(donnees);
        case 'MODIFIER':
          return await Utilisateur.findByIdAndUpdate(userId, donnees, { new: true });
        case 'SUPPRIMER':
          return await Utilisateur.findByIdAndDelete(userId);
        case 'LISTER':
          return await Utilisateur.find();
        default:
          throw new Error('Action non valide');
      }
    } catch (err) {
      throw err;
    }
  },

  gererProfessionnels: async function(action, profId, donnees) {
    const Professionnel = mongoose.model('Professionnel');
    try {
      switch(action) {
        case 'CREER':
          return await Professionnel.create(donnees);
        case 'MODIFIER':
          return await Professionnel.findByIdAndUpdate(profId, donnees, { new: true });
        case 'SUPPRIMER':
          return await Professionnel.findByIdAndDelete(profId);
        case 'LISTER':
          return await Professionnel.find();
        default:
          throw new Error('Action non valide');
      }
    } catch (err) {
      throw err;
    }
  },

  gererCategories: async function(action, catId, donnees) {
    const CategorieProfessionnel = mongoose.model('CategorieProfessionnel');
    try {
      switch(action) {
        case 'CREER':
          return await CategorieProfessionnel.create(donnees);
        case 'MODIFIER':
          return await CategorieProfessionnel.findByIdAndUpdate(catId, donnees, { new: true });
        case 'SUPPRIMER':
          return await CategorieProfessionnel.findByIdAndDelete(catId);
        case 'LISTER':
          return await CategorieProfessionnel.find();
        default:
          throw new Error('Action non valide');
      }
    } catch (err) {
      throw err;
    }
  },

  voirStatistiques: async function() {
    try {
      return await mongoose.model('Statistiques').find();
    } catch (err) {
      throw err;
    }
  }
};

const Administrateur = mongoose.model('Administrateur', administrateurSchema);
module.exports = Administrateur;