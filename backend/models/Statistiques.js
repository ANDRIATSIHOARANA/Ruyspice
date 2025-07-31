// models/Statistiques.js
const mongoose = require('mongoose');

const statistiquesSchema = new mongoose.Schema({
  nombreRendezVous: {
    type: Number,
    default: 0
  },
  tauxRendezVousConfirme: {
    type: Number,
    default: 0
  },
  rendezVousParSemaine: {
    type: Number,
    default: 0
  },
  rendezVousParMois: {
    type: Number,
    default: 0
  }
});

statistiquesSchema.methods = {
  async afficherGraphiques() {
    // Logique pour générer et retourner les graphiques
    return {
      nombreRendezVous: this.nombreRendezVous,
      tauxRendezVousConfirme: this.tauxRendezVousConfirme,
      rendezVousParSemaine: this.rendezVousParSemaine,
      rendezVousParMois: this.rendezVousParMois
    };
  }
};

module.exports = mongoose.model('Statistiques', statistiquesSchema);