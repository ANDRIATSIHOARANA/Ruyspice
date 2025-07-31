// models/Creneau.js
const mongoose = require('mongoose');

const creneauSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  heureDebut: {
    type: String,
    required: true
  },
  heureFin: {
    type: String,
    required: true
  },
  professionnel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professionnel',
    required: true
  },
  rendezVous: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RendezVous'
  }
});

module.exports = mongoose.model('Creneau', creneauSchema);