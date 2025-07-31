const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom de la catégorie est requis'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  tarif: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);