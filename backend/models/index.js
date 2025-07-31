// Ce fichier initialise tous les modèles dans le bon ordre
// pour éviter les problèmes de dépendances circulaires

// Importer les modèles dans le bon ordre
require('./Utilisateur');
require('./Notification');
require('./RendezVous');
require('./Disponibilite');
// Autres modèles...

// Exporter les modèles pour pouvoir les utiliser ailleurs
module.exports = {
  Utilisateur: require('./Utilisateur'),
  Notification: require('./Notification'),
  RendezVous: require('./RendezVous'),
  Disponibilite: require('./Disponibilite'),
  // Autres modèles...
};