const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const disponibiliteSchema = new Schema({
  professionnel: {
    type: Schema.Types.ObjectId,
    ref: 'Professionnel',
    required: true
  },
  debut: { 
    type: Date,
    required: [true, 'La date de début est obligatoire'],
    index: true 
  },
  fin: { 
    type: Date,
    required: [true, 'La date de fin est obligatoire'],
    validate: {
      validator: function(v) {
        return v > this.debut;  // Vérification que la date de fin est après la date de début
      },
      message: 'La date de fin doit être postérieure à la date de début'
    }
  },
  status: {
    type: String,
    enum: ['disponible', 'reserve'],
    default: 'disponible'
  }
}, { timestamps: true });

module.exports = mongoose.model('Disponibilite', disponibiliteSchema);
