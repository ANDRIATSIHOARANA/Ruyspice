const mongoose = require('mongoose');
    const Schema = mongoose.Schema;
    
    const professionnelSchema = new Schema({
      nom: {
        type: String,
        required: true
      },
      prenom: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true,
        unique: true
      },
      password: {
        type: String,
        required: true
      },
      role: {
        type: String,
        default: 'PROF'
      },
      statut: {
        type: String,
        required: true,
        enum: ['ACTIF', 'INACTIF', 'SUSPENDU'],
        default: 'ACTIF'
      },
      specialites: {
        type: [String],
        default: []
      },
      description: {
        type: String,
        default: ''
      },
      photo: {
        type: String,
        default: null
      },
      tarif: {
        type: Number,
        default: 0
      },
      
      categorieId: {
        type: Schema.Types.ObjectId,
        ref: 'CategorieProfessionnel'
      },
      historiqueRendezVous: {
        type: [Schema.Types.Mixed],
        default: []
      }
    }, { timestamps: true });

    professionnelSchema.methods.choisirSpecialite = async function(specialite) {
      try {
        const categorie = await mongoose.model('CategorieProfessionnel').findOne({ 
          specialites: specialite 
        });
        
        if (!categorie) {
          throw new Error('Spécialité non trouvée dans une catégorie');
        }
        
        this.categorieId = categorie._id;
        this.specialites = [...new Set([...this.specialites, specialite])];
        await this.save();
        
        return true;
      } catch (error) {
        throw new Error(`Erreur lors du choix de la spécialité: ${error.message}`);
      }
    };
    
    professionnelSchema.methods = {
      ajouterDisponibilite: async function(date) {
        this.disponibilites.push(date);
        return await this.save();
      },
    
      accepterRendezVous: async function(rendezVousId) {
        try {
          const rendezVous = await mongoose.model('RendezVous').findById(rendezVousId);
          if (!rendezVous) throw new Error('RendezVous non trouvé');
          rendezVous.status = 'CONFIRME';
          await rendezVous.save();
          return true;
        } catch (err) {
          throw err;
        }
      },
    
      refuserRendezVous: async function(rendezVousId) {
        try {
          const rendezVous = await mongoose.model('RendezVous').findById(rendezVousId);
          if (!rendezVous) throw new Error('RendezVous non trouvé');
          rendezVous.status = 'ANNULE';
          await rendezVous.save();
          return true;
        } catch (err) {
          throw err;
        }
      },
    
      modifierProfil: async function(donnees) {
        Object.assign(this, donnees);
        return await this.save();
      }
    };
    
    // Créer et exporter le modèle
    const Professionnel = mongoose.model('Professionnel', professionnelSchema);
    module.exports = Professionnel;