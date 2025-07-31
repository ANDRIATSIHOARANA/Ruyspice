const mongoose = require('mongoose');
const Utilisateur = require('./models/Utilisateur');

// Connectez-vous à votre base de données
mongoose.connect('mongodb://localhost:27017/votre_base_de_donnees', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('=== VALEURS VALIDES POUR LE CHAMP ROLE ===');
  console.log(Utilisateur.schema.path('role').enumValues);
  console.log('=== VALEURS VALIDES POUR LE CHAMP STATUT ===');
  console.log(Utilisateur.schema.path('statut').enumValues);
  console.log('==========================================');
  mongoose.disconnect();
})
.catch(err => {
  console.error('Erreur de connexion à la base de données:', err);
});