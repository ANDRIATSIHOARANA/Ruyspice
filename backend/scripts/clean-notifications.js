/**
 * Script pour nettoyer les notifications incorrectes
 * 
 * Pour exécuter ce script:
 * 1. Assurez-vous que votre serveur MongoDB est en cours d'exécution
 * 2. Exécutez: node scripts/clean-notifications.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Modèles
const Notification = require('../models/Notification');

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

// Fonction principale pour nettoyer les notifications
async function cleanNotifications() {
  try {
    console.log('=== Nettoyage des notifications ===');
    
    // 1. Récupérer toutes les notifications
    const notifications = await Notification.find({});
    console.log(`Nombre total de notifications: ${notifications.length}`);
    
    // 2. Identifier les notifications incorrectes (notifications pour professionnels avec contenu destiné aux utilisateurs)
    const incorrectNotifications = notifications.filter(
      notif => notif.professionnel && notif.contenu && notif.contenu.includes('Votre rendez-vous')
    );
    
    console.log(`Nombre de notifications incorrectes: ${incorrectNotifications.length}`);
    
    if (incorrectNotifications.length > 0) {
      console.log('Exemples de notifications incorrectes:');
      incorrectNotifications.slice(0, 3).forEach(notif => {
        console.log(`- ${notif._id}: ${notif.contenu}`);
      });
      
      // 3. Supprimer les notifications incorrectes
      const deleteResult = await Notification.deleteMany({
        _id: { $in: incorrectNotifications.map(notif => notif._id) }
      });
      
      console.log(`${deleteResult.deletedCount} notifications incorrectes supprimées`);
    }
    
    console.log('=== Nettoyage terminé ===');
  } catch (error) {
    console.error('Erreur lors du nettoyage des notifications:', error);
  } finally {
    // Fermer la connexion à la base de données
    mongoose.connection.close();
  }
}

// Exécuter la fonction
cleanNotifications();