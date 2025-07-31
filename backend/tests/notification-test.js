/**
 * Script de test pour vérifier les notifications
 * 
 * Pour exécuter ce script:
 * 1. Assurez-vous que votre serveur MongoDB est en cours d'exécution
 * 2. Exécutez: node tests/notification-test.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Modèles
const Notification = require('../models/Notification');
const Professionnel = require('../models/Professionnel');
const Utilisateur = require('../models/Utilisateur');

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

// Fonction principale de test
async function testNotifications() {
  try {
    console.log('=== Test des notifications ===');
    
    // 1. Vérifier les professionnels existants
    const professionnels = await Professionnel.find({}).limit(5);
    console.log(`Nombre de professionnels trouvés: ${professionnels.length}`);
    
    if (professionnels.length === 0) {
      console.log('Aucun professionnel trouvé. Impossible de continuer les tests.');
      return;
    }
    
    const professionnel = professionnels[0];
    console.log(`Professionnel sélectionné pour le test: ${professionnel._id} (${professionnel.nom} ${professionnel.prenom})`);
    
    // 2. Vérifier les utilisateurs existants
    const utilisateurs = await Utilisateur.find({}).limit(5);
    console.log(`Nombre d'utilisateurs trouvés: ${utilisateurs.length}`);
    
    if (utilisateurs.length === 0) {
      console.log('Aucun utilisateur trouvé. Impossible de continuer les tests.');
      return;
    }
    
    const utilisateur = utilisateurs[0];
    console.log(`Utilisateur sélectionné pour le test: ${utilisateur._id} (${utilisateur.nom} ${utilisateur.prenom})`);
    
    // 3. Vérifier les notifications existantes
    const existingNotifications = await Notification.find({
      professionnel: professionnel._id
    });
    
    console.log(`Nombre de notifications existantes pour le professionnel: ${existingNotifications.length}`);
    
    if (existingNotifications.length > 0) {
      console.log('Exemples de notifications existantes:');
      existingNotifications.slice(0, 3).forEach(notif => {
        console.log(`- ${notif._id}: ${notif.contenu} (lue: ${notif.lue})`);
      });
    }
    
    // 4. Créer une nouvelle notification de test
    console.log('Création d\'une nouvelle notification de test...');
    
    const newNotification = new Notification({
      contenu: `Notification de test créée le ${new Date().toLocaleString()}`,
      professionnel: professionnel._id,
      type: 'AUTRE',
      lue: false,
      dateCreation: new Date()
    });
    
    await newNotification.save();
    console.log(`Nouvelle notification créée avec l'ID: ${newNotification._id}`);
    
    // 5. Vérifier que la notification a été créée
    const verifyNotification = await Notification.findById(newNotification._id);
    
    if (verifyNotification) {
      console.log('Notification correctement enregistrée dans la base de données:');
      console.log(verifyNotification);
    } else {
      console.log('Erreur: La notification n\'a pas été correctement enregistrée.');
    }
    
    // 6. Vérifier à nouveau toutes les notifications pour le professionnel
    const updatedNotifications = await Notification.find({
      professionnel: professionnel._id
    });
    
    console.log(`Nombre de notifications après ajout: ${updatedNotifications.length}`);
    
    console.log('=== Test terminé ===');
  } catch (error) {
    console.error('Erreur lors du test des notifications:', error);
  } finally {
    // Fermer la connexion à la base de données
    mongoose.connection.close();
  }
}

// Exécuter le test
testNotifications();