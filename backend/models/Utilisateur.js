const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const RoleEnum = {
  UTILISATEUR: 'UTILISATEUR',
  PROF: 'PROF'
};

const StatutEnum = {
  ACTIF: 'ACTIF',
  INACTIF: 'INACTIF',
  SUSPENDU: 'SUSPENDU',
  PENDING: 'PENDING',
  CONFIRME: 'CONFIRME',
  ANNULE: 'ANNULE'
};

const utilisateurSchema = new mongoose.Schema({
  id: String,
  nom: {
    type: String,
    required: false,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      // Le mot de passe n'est requis que si l'utilisateur n'utilise pas de connexion sociale
      return !this.providerId;
    }
  },
  // Champs pour la connexion sociale
  // Champs pour l'authentification sociale
  providerId: {
    type: String,
    enum: ['google', 'facebook', 'github', 'twitter', null],
    default: null
  },
  providerUserId: {
    type: String,
    default: null
  },
  providerData: {
    type: Object,
    default: null
  },
  role: {
    type: String,
    enum: Object.values(RoleEnum),
    default: RoleEnum.UTILISATEUR
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
    default: ''
  },
  tarif: {
    type: Number,
    default: 0,
    min: [0, 'Le tarif ne peut pas être négatif']
  },
  categorieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategorieProfessionnel',
    default: null
  },
  date: Date,
  motif: String,
  statut: {
    type: String,
    enum: Object.values(StatutEnum),
    default: StatutEnum.PENDING,
    required: true
  },
  profilComplet: {
    type: Boolean,
    default: true // Par défaut, le profil est complet pour les utilisateurs normaux
  },
  historiqueRendezVous: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RendezVous'
  }]
});

utilisateurSchema.methods = {
  async sInscrire() {
    // Vérifier si le profil du professionnel est complet
    if (this.role === RoleEnum.PROF) {
      // Un profil de professionnel est considéré comme incomplet s'il n'a pas de catégorie
      // ou si d'autres informations essentielles sont manquantes
      this.profilComplet = Boolean(
        this.categorieId && 
        this.description && 
        this.description.trim() !== '' &&
        this.specialites && 
        this.specialites.length > 0
      );
      
      if (!this.profilComplet) {
        console.log('Professionnel inscrit avec un profil incomplet. Des informations supplémentaires seront nécessaires.');
      }
    } else {
      // Pour les utilisateurs normaux, le profil est toujours considéré comme complet
      this.profilComplet = true;
    }
    
    // Si l'utilisateur s'inscrit avec un mot de passe (pas via réseau social)
    if (this.password && !this.providerId) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    
    return await this.save();
  },
  
  async seConnecter(password) {
    // Si l'utilisateur utilise la connexion sociale, on ne vérifie pas le mot de passe
    if (this.providerId) {
      return true;
    }
    
    // Sinon, on vérifie le mot de passe
    if (!this.password) {
      throw new Error('Mot de passe non défini dans la base de données');
    }
    return await bcrypt.compare(password, this.password);
  },
  
  async connecterViaSocial(providerData) {
    this.providerId = providerData.provider;
    this.providerUserId = providerData.id;
    this.providerData = providerData;
    
    // Mettre à jour les informations de profil si elles sont disponibles
    if (providerData.displayName) {
      const nameParts = providerData.displayName.split(' ');
      if (nameParts.length > 1) {
        this.prenom = this.prenom || nameParts[0];
        this.nom = this.nom || nameParts.slice(1).join(' ');
      } else {
        this.prenom = this.prenom || providerData.displayName;
      }
    }
    
    if (providerData.emails && providerData.emails.length > 0) {
      this.email = this.email || providerData.emails[0].value;
    }
    
    if (providerData.photos && providerData.photos.length > 0) {
      this.photo = this.photo || providerData.photos[0].value;
    }
    
    return await this.save();
  },

  async reserverRendezVous(rendezVousData) {
    const rendezVous = new RendezVous({
      ...rendezVousData,
      utilisateurId: this._id
    });
    await rendezVous.save();
    this.historiqueRendezVous.push(rendezVous._id);
    return await this.save();
  },

  async annulerRendezVous(rendezVousId) {
    const rendezVous = await RendezVous.findById(rendezVousId);
    await rendezVous.modifierStatus('ANNULE');
    return rendezVous;
  },

  async modifierProfil(donnees) {
  // Traitement spécifique pour les professionnels
  if (this.role === RoleEnum.PROF) {
    // Gestion de categorieId
    this.categorieId = donnees.categorieId || this.categorieId || null;
    
    // Conversion explicite du tarif en nombre
    this.tarif = Number(donnees.tarif) || 0;
    
    // Gérer les spécialités
    if (donnees.specialites !== undefined) {
      if (typeof donnees.specialites === 'string') {
        try {
          // Essayer de parser si c'est une chaîne JSON
          this.specialites = JSON.parse(donnees.specialites);
        } catch (e) {
          // Si ce n'est pas du JSON valide, traiter comme une chaîne simple
          this.specialites = donnees.specialites.split(',').map(s => s.trim());
        }
      } else if (Array.isArray(donnees.specialites)) {
        this.specialites = donnees.specialites;
      } else {
        this.specialites = [donnees.specialites];
      }
    }
    
    // Mettre à jour le statut de complétion du profil
    this.profilComplet = Boolean(
      this.categorieId && 
      this.description && 
      this.description.trim() !== '' &&
      this.specialites && 
      this.specialites.length > 0
    );
  } else {
    // Pour les utilisateurs non-professionnels, réinitialiser ces champs
    this.categorieId = null;
    this.tarif = 0;
    this.specialites = [];
    this.profilComplet = true; // Les utilisateurs normaux ont toujours un profil complet
  }

  // Mise à jour des champs communs
  this.nom = donnees.nom !== undefined ? donnees.nom : this.nom;
  this.prenom = donnees.prenom !== undefined ? donnees.prenom : this.prenom;
  this.email = donnees.email !== undefined ? donnees.email : this.email;
  this.description = donnees.description !== undefined ? donnees.description : this.description;
  
  // Gestion du champ photo
  if (donnees.photo !== undefined) {
    this.photo = donnees.photo;
  }
  
  // Sauvegarder les modifications
  return await this.save();
}
};

module.exports = mongoose.model('Utilisateur', utilisateurSchema);

// Script pour vérifier les valeurs valides de l'enum role
if (require.main === module) {
  // Ce code s'exécute uniquement si le fichier est exécuté directement
  mongoose.connect('mongodb://localhost:27017/votre_base_de_donnees', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    const Utilisateur = mongoose.model('Utilisateur');
    
    console.log('\n=== VALEURS VALIDES POUR LE CHAMP ROLE ===');
    console.log(Utilisateur.schema.path('role').enumValues);
    console.log('==========================================');
    
    console.log('\n=== VALEURS VALIDES POUR LE CHAMP STATUT ===');
    console.log(Utilisateur.schema.path('statut').enumValues);
    console.log('==========================================');
    
    console.log('\n=== VALEURS VALIDES POUR LE CHAMP PROVIDERID ===');
    console.log(Utilisateur.schema.path('providerId').enumValues);
    console.log('==========================================\n');
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Erreur de connexion à la base de données:', err);
    process.exit(1);
  });
}
