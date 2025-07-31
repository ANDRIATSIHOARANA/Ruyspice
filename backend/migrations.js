const mongoose = require('mongoose');
require('dotenv').config();
const Professionnel = require('./models/Professionnel');

async function updateExistingDocuments() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
      .then(() => {
        console.log('Connecté à MongoDB pour la migration...');
      })
      .catch(err => {
        console.error('Erreur de connexion MongoDB:', err);
        process.exit(1);
      });

    // Exécution de la migration
    const result = await Professionnel.updateMany(
      {}, // Mettre à jour tous les documents
      { 
        $set: { 
          tarif: 0 
        }
      },
      { 
        upsert: false,
        multi: true 
      }
    );

    console.log('Migration terminée avec succès');
    console.log(`${result.modifiedCount} documents mis à jour`);

  } catch (error) {
    console.error('Échec de la migration:', error);
  } finally {
    // Fermeture de la connexion
    await mongoose.connection.close();
    console.log('Connexion à la base de données fermée');
    process.exit(0);
  }
}

// Exécuter la migration
updateExistingDocuments();