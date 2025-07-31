/**
 * Script amélioré pour corriger les notifications existantes
 * 
 * Pour exécuter ce script:
 * 1. Assurez-vous que votre serveur MongoDB est en cours d'exécution
 * 2. Exécutez: node scripts/fix-notifications-improved.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Modèles
const Notification = require('../models/Notification');
const Utilisateur = require('../models/Utilisateur');
const RendezVous = require('../models/RendezVous');

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

// Fonction principale pour corriger les notifications
async function fixNotifications() {
  try {
    console.log('=== Correction des notifications ===');
    
    // 1. Récupérer toutes les notifications
    const notifications = await Notification.find({});
    console.log(`Nombre total de notifications: ${notifications.length}`);
    
    // 2. Identifier les notifications sans professionnel
    const notificationsWithoutProfessionnel = notifications.filter(
      notif => !notif.professionnel
    );
    
    console.log(`Nombre de notifications sans professionnel: ${notificationsWithoutProfessionnel.length}`);
    
    // 3. Récupérer tous les professionnels
    const professionnels = await Utilisateur.find({ role: 'PROF' });
    console.log(`Nombre de professionnels trouvés: ${professionnels.length}`);
    
    if (professionnels.length === 0) {
      console.log('Aucun professionnel trouvé. Impossible de continuer.');
      return;
    }
    
    // 4. Pour chaque notification sans professionnel, essayer de trouver le professionnel correspondant
    let notificationsFixed = 0;
    
    for (const notif of notificationsWithoutProfessionnel) {
      // Si la notification a un utilisateur, chercher les rendez-vous de cet utilisateur
      if (notif.utilisateur) {
        console.log(`Traitement de la notification ${notif._id} pour l'utilisateur ${notif.utilisateur}`);
        
        // Extraire le nom du professionnel du contenu si possible
        let professionnelId = null;
        
        // Essayer d'extraire le nom du professionnel du contenu
        const matchProfName = notif.contenu.match(/avec ([^a-z]+) a été/i);
        if (matchProfName && matchProfName[1]) {
          const professionnelNomPrenom = matchProfName[1].trim();
          console.log(`Nom du professionnel extrait: "${professionnelNomPrenom}"`);
          
          // Diviser le nom et prénom
          const parts = professionnelNomPrenom.split(' ');
          const prenom = parts[0];
          const nom = parts.slice(1).join(' ');
          
          // Chercher le professionnel par nom et prénom
          const professionnel = await Utilisateur.findOne({
            prenom: { $regex: new RegExp(prenom, 'i') },
            nom: { $regex: new RegExp(nom, 'i') },
            role: 'PROF'
          });
          
          if (professionnel) {
            console.log(`Professionnel trouvé: ${professionnel._id} (${professionnel.prenom} ${professionnel.nom})`);
            professionnelId = professionnel._id;
          }
        }
        
        // Si on n'a pas trouvé le professionnel par le nom, chercher par les rendez-vous
        if (!professionnelId) {
          // Chercher les rendez-vous de cet utilisateur
          const rendezVous = await RendezVous.find({ utilisateur: notif.utilisateur });
          
          if (rendezVous.length > 0) {
            console.log(`${rendezVous.length} rendez-vous trouvés pour l'utilisateur ${notif.utilisateur}`);
            
            // Utiliser le professionnel du dernier rendez-vous
            professionnelId = rendezVous[rendezVous.length - 1].professionnel;
            console.log(`Professionnel du dernier rendez-vous: ${professionnelId}`);
          }
        }
        
        // Si on a trouvé un professionnel, mettre à jour la notification
        if (professionnelId) {
          notif.professionnel = professionnelId;
          await notif.save();
          notificationsFixed++;
          console.log(`Notification ${notif._id} mise à jour avec le professionnel ${professionnelId}`);
        } else {
          console.log(`Impossible de trouver un professionnel pour la notification ${notif._id}`);
        }
      }
    }
    
    console.log(`Nombre de notifications corrigées: ${notificationsFixed}`);
    
    // 5. Créer des notifications de test pour chaque professionnel si nécessaire
    console.log('=== Création de notifications de test ===');
    
    for (const professionnel of professionnels) {
      // Vérifier si le professionnel a déjà des notifications
      const existingNotifications = await Notification.find({ professionnel: professionnel._id });
      
      if (existingNotifications.length === 0) {
        console.log(`Aucune notification trouvée pour le professionnel ${professionnel._id}. Création d'une notification de test.`);
        
        // Créer une notification de test
        const testNotification = new Notification({
          contenu: `Notification de test pour ${professionnel.prenom} ${professionnel.nom} créée le ${new Date().toLocaleString()}`,
          professionnel: professionnel._id,
          type: 'AUTRE',
          lue: false,
          dateCreation: new Date()
        });
        
        await testNotification.save();
        console.log(`Notification de test créée pour le professionnel ${professionnel._id}`);
      } else {
        console.log(`${existingNotifications.length} notifications trouvées pour le professionnel ${professionnel._id}`);
      }
    }
    
    console.log('=== Correction terminée ===');
  } catch (error) {
    console.error('Erreur lors de la correction des notifications:', error);
  } finally {
    // Fermer la connexion à la base de données
    mongoose.connection.close();
  }
}

// Exécuter la fonction
fixNotifications();