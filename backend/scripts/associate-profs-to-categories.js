/**
 * Script pour associer les professionnels existants à une catégorie
 * 
 * Pour exécuter ce script:
 * 1. Assurez-vous que votre serveur MongoDB est en cours d'exécution
 * 2. Exécutez: node scripts/associate-profs-to-categories.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Modèles
const Utilisateur = require('../models/Utilisateur');
const CategorieProfessionnel = require('../models/CategorieProfessionnel');

// Connexion à la base de données
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connecté à MongoDB'))
.catch(err => {
  console.error('Erreur de connexion MongoDB:', err);
  process.exit(1);
});

// Fonction principale pour associer les professionnels aux catégories
async function associateProfessionnelsToCategories() {
  try {
    console.log('=== Association des professionnels aux catégories ===');
    
    // 1. Récupérer toutes les catégories
    const categories = await CategorieProfessionnel.find();
    console.log(`Nombre total de catégories: ${categories.length}`);
    
    if (categories.length === 0) {
      console.log('Aucune catégorie trouvée. Impossible de continuer.');
      return;
    }
    
    // Afficher les catégories disponibles
    console.log('Catégories disponibles:');
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.nom} (${cat._id})`);
    });
    
    // 2. Récupérer tous les professionnels
    const professionnels = await Utilisateur.find({ role: 'PROF' });
    console.log(`Nombre total de professionnels: ${professionnels.length}`);
    
    if (professionnels.length === 0) {
      console.log('Aucun professionnel trouvé. Impossible de continuer.');
      return;
    }
    
    // Afficher les professionnels
    console.log('Professionnels:');
    professionnels.forEach((prof, index) => {
      console.log(`${index + 1}. ${prof.prenom} ${prof.nom} (${prof._id}) - Catégorie: ${prof.categorieId || 'Non définie'}`);
    });
    
    // 3. Associer chaque professionnel à une catégorie
    console.log('\nAssociation des professionnels aux catégories...');
    
    // Utiliser la première catégorie par défaut
    const defaultCategory = categories[0];
    console.log(`Catégorie par défaut: ${defaultCategory.nom} (${defaultCategory._id})`);
    
    let updatedCount = 0;
    
    for (const prof of professionnels) {
      if (!prof.categorieId) {
        console.log(`Association du professionnel ${prof.prenom} ${prof.nom} (${prof._id}) à la catégorie ${defaultCategory.nom}`);
        
        prof.categorieId = defaultCategory._id;
        await prof.save();
        updatedCount++;
      } else {
        console.log(`Le professionnel ${prof.prenom} ${prof.nom} (${prof._id}) est déjà associé à une catégorie: ${prof.categorieId}`);
        
        // Vérifier si la catégorie existe
        const categorieExists = await CategorieProfessionnel.findById(prof.categorieId);
        
        if (!categorieExists) {
          console.log(`La catégorie ${prof.categorieId} n'existe pas. Association à la catégorie par défaut.`);
          prof.categorieId = defaultCategory._id;
          await prof.save();
          updatedCount++;
        }
      }
    }
    
    console.log(`\n${updatedCount} professionnels ont été associés à une catégorie.`);
    
    // 4. Vérifier les associations
    const updatedProfessionnels = await Utilisateur.find({ role: 'PROF' });
    console.log('\nVérification des associations:');
    updatedProfessionnels.forEach((prof, index) => {
      console.log(`${index + 1}. ${prof.prenom} ${prof.nom} (${prof._id}) - Catégorie: ${prof.categorieId}`);
    });
    
    console.log('=== Association terminée ===');
  } catch (error) {
    console.error('Erreur lors de l\'association des professionnels aux catégories:', error);
  } finally {
    // Fermer la connexion à la base de données
    mongoose.connection.close();
  }
}

// Exécuter la fonction
associateProfessionnelsToCategories();