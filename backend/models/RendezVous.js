const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Définition des statuts possibles pour un rendez-vous
const StatusEnum = {
  PENDING: 'PENDING',
  CONFIRME: 'CONFIRME', 
  ANNULE: 'ANNULE',
  TERMINE: 'TERMINE'
};

const rendezVousSchema = new Schema({
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  professionnel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  motif: {
    type: String,
    required: true
  },
  // 2. Correction de la déclaration du champ status
  status: {
    type: String,
    enum: Object.values(StatusEnum),
    default: StatusEnum.PENDING
  },
  // Champ pour indiquer si le rendez-vous a été supprimé par le professionnel
  supprimeProfessionnel: {
    type: Boolean,
    default: false
  },
  // Champ pour indiquer si le rendez-vous a été supprimé par l'utilisateur
  supprimeUtilisateur: {
    type: Boolean,
    default: false
  },
  disponibilite: {
    type: Schema.Types.ObjectId,
    ref: 'Disponibilite'
  }
}, { timestamps: true });

// Middleware pre-save pour mettre à jour la date de modification
rendezVousSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

rendezVousSchema.methods = {
  async modifierStatus(nouveauStatus) {
    if (!Object.values(StatusEnum).includes(nouveauStatus)) {
      throw new Error('Statut invalide');
    }
    this.status = nouveauStatus;
    await this.save();
    await this.envoyerNotification();
  },

  async envoyerNotification() {
    try {
      // Récupérer le modèle Notification de manière sûre
      const Notification = mongoose.model('Notification');
      
      // Déterminer le type de notification en fonction du statut
      let type = 'AUTRE';
      if (this.status === StatusEnum.CONFIRME) {
        type = 'CONFIRMATION';
      } else if (this.status === StatusEnum.ANNULE) {
        type = 'ANNULATION';
      }
      
      // Créer une notification pour l'utilisateur avec référence au rendez-vous
      const notification = new Notification({
        contenu: `Votre rendez-vous du ${this.date.toLocaleDateString()} a été ${this.status.toLowerCase()}`,
        utilisateur: this.utilisateur,
        rendezVousId: this._id, // Ajouter l'ID du rendez-vous
        type: type,
        lue: false,
        dateCreation: new Date()
      });
      
      await notification.save();
      console.log(`Notification créée pour l'utilisateur ${this.utilisateur} avec référence au rendez-vous ${this._id}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      // Ne pas propager l'erreur pour éviter de bloquer le processus principal
    }
  },
  
  // Nouvelle méthode pour marquer comme supprimé par l'utilisateur
  async marquerSupprimeParUtilisateur() {
    this.supprimeUtilisateur = true;
    await this.save();
  },
  
  // Nouvelle méthode pour marquer comme supprimé par le professionnel
  async marquerSupprimeParProfessionnel() {
    this.supprimeProfessionnel = true;
    await this.save();
  }
};

module.exports = mongoose.model('RendezVous', rendezVousSchema);
