const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/firstData', {
  useNewUrlParser: true,
  useUnifiedTopology: true
  })
  .then(() => console.log('Connexion à MongoDB réussie'))
  .catch((err) => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
  });

// Configurer les relations
const Utilisateur = require('../models/Utilisateur');
const RendezVous = require('../models/RendezVous');
const Professionnel = require('../models/Professionnel');
const Statistiques = require('../models/Statistiques');

// Relation Utilisateur - RendezVous
Utilisateur.schema.virtual('historiqueRendezVous', {
    ref: 'RendezVous',
    localField: '_id',
    foreignField: 'utilisateurId'
  });



// Relation Professionnel - RendezVous
Professionnel.schema.virtual('rendezVous', {
    ref: 'RendezVous',
    localField: '_id',
    foreignField: 'professionnelId'
  });

// Relation Administrateur - Utilisateur
Administrateur.schema.virtual('utilisateursGeres', {
    ref: 'Utilisateur',
    localField: '_id',
    foreignField: 'administrateurId'
  });

// Relation Administrateur - Statistiques
Administrateur.schema.virtual('statistiquesGlobales', {
    ref: 'Statistiques',
    localField: '_id',
    foreignField: 'administrateurId'
  });

// Relation Administrateur - CategorieProfessionnel
Administrateur.schema.virtual('categoriesGerees', {
    ref: 'CategorieProfessionnel',
    localField: '_id',
    foreignField: 'administrateurId'
  });

// Relation Professionnel - Statistiques
Professionnel.schema.virtual('statsDetails', {
  ref: 'Statistiques',
  localField: 'statistiques',
  foreignField: '_id'
});

// Relation Professionnel - CategorieProfessionnel
Professionnel.schema.virtual('categorie', {
  ref: 'CategorieProfessionnel',
  localField: 'categorieId',
  foreignField: '_id'
});

module.exports = mongoose;