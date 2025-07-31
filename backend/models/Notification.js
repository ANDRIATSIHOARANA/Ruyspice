const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  contenu: {
    type: String,
    required: true
  },
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: function() {
      return !this.professionnel;
    }
  },
  professionnel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: function() {
      return !this.utilisateur;
    }
  },
  lue: {
    type: Boolean,
    default: false
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['RESERVATION', 'ANNULATION', 'CONFIRMATION', 'REFUS', 'RAPPEL', 'AUTRE', 'SUPPRESSION'],
    default: 'AUTRE'
  },
  rendezVousId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RendezVous',
    required: false
  }
});

// Ajouter des index pour améliorer les performances
notificationSchema.index({ professionnel: 1, lue: 1 });
notificationSchema.index({ utilisateur: 1, lue: 1 });
notificationSchema.index({ dateCreation: -1 });

// Créer et exporter le modèle
const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
