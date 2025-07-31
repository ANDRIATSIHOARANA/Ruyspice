/**
 * Script pour corriger les notifications existantes
 * 
 * Pour exécuter ce script:
 * 1. Assurez-vous que votre serveur MongoDB est en cours d'exécution
 * 2. Exécutez: node scripts/fix-notifications.js
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
    
    // 2. Identifier les notifications sans destinataire
    const notificationsWithoutRecipient = notifications.filter(
      notif => !notif.utilisateur && !notif.professionnel
    );
    
    console.log(`Nombre de notifications sans destinataire: ${notificationsWithoutRecipient.length}`);
    
    // 3. Identifier les notifications pour les utilisateurs (contenu contient "Votre rendez-vous")
    const userNotifications = notifications.filter(
      notif => notif.contenu && notif.contenu.includes('Votre rendez-vous')
    );
    
    console.log(`Nombre de notifications pour les utilisateurs: ${userNotifications.length}`);
    
    // 4. Corriger les notifications pour les utilisateurs
    let userNotificationsFixed = 0;
    
    for (const notif of userNotifications) {
      if (!notif.utilisateur) {
        // Extraire le nom du professionnel du contenu
        const match = notif.contenu.match(/avec ([^a-z]+) a été/i);
        if (match && match[1]) {
          const professionnelNomPrenom = match[1].trim();
          const [prenom, nom] = professionnelNomPrenom.split(' ');
          
          // Trouver le professionnel correspondant
          const professionnel = await Utilisateur.findOne({
            nom: { $regex: new RegExp(nom, 'i') },
            prenom: { $regex: new RegExp(prenom, 'i') },
            role: 'PROF'
          });
          
          if (professionnel) {
            // Trouver un rendez-vous correspondant
            const rendezVous = await RendezVous.findOne({
              professionnel: professionnel._id,
              status: notif.contenu.includes('confirmé') ? 'CONFIRME' : 'ANNULE'
            });
            
            if (rendezVous) {
              // Mettre à jour la notification
              notif.utilisateur = rendezVous.utilisateur;
              notif.rendezVousId = rendezVous._id;
              await notif.save();
              userNotificationsFixed++;
              console.log(`Notification ${notif._id} corrigée pour l'utilisateur ${rendezVous.utilisateur}`);
            }
          }
        }
      }
    }
    
    console.log(`Nombre de notifications utilisateur corrigées: ${userNotificationsFixed}`);
    
    // 5. Identifier les notifications pour les professionnels
    const profNotifications = notifications.filter(
      notif => notif.contenu && (notif.contenu.includes('Nouvelle demande') || notif.contenu.includes('a annulé son rendez-vous'))
    );
    
    console.log(`Nombre de notifications pour les professionnels: ${profNotifications.length}`);
    
    // 6. Corriger les notifications pour les professionnels
    let profNotificationsFixed = 0;
    
    for (const notif of profNotifications) {
      if (!notif.professionnel && notif.rendezVousId) {
        // Trouver le rendez-vous correspondant
        const rendezVous = await RendezVous.findById(notif.rendezVousId);
        
        if (rendezVous) {
          // Mettre à jour la notification
          notif.professionnel = rendezVous.professionnel;
          await notif.save();
          profNotificationsFixed++;
          console.log(`Notification ${notif._id} corrigée pour le professionnel ${rendezVous.professionnel}`);
        }
      }
    }
    
    console.log(`Nombre de notifications professionnel corrigées: ${profNotificationsFixed}`);
    
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