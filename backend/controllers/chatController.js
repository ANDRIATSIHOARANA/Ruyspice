const Professionnel = require('../models/Professionnel');
const Category = require('../models/Category');
const CategorieProfessionnel = require('../models/CategorieProfessionnel');
const { Op } = require('sequelize');

/**
 * ChatController - Contrôleur pour gérer les requêtes du chatbot intelligent
 * 
 * Fonctionnalités:
 * - Analyse sémantique des requêtes utilisateur
 * - Filtrage intelligent des professionnels par domaine d'expertise
 * - Réponses contextuelles basées sur le contenu de la requête
 */
const ChatController = {
  /**
   * Analyser une requête utilisateur et fournir une réponse contextuelle
   * @param {Object} req - Requête HTTP avec query, domaine et userId
   * @param {Object} res - Réponse HTTP
   */
  async processQuery(req, res) {
    try {
      const { query, domaine, userId } = req.body;

      if (!query) {
        return res.status(400).json({ success: false, message: 'La requête est vide' });
      }

      // Analyser la requête pour déterminer l'intention
      const intention = await analyzerIntention(query);
      
      // Générer une réponse contextuelle basée sur l'intention
      let response = '';
      let suggestedProfessionals = [];

      switch (intention.type) {
        case 'rechercheProfessionnel':
          // Rechercher des professionnels pertinents
          suggestedProfessionals = await rechercherProfessionnels(query, domaine);
          
          if (suggestedProfessionals.length > 0) {
            response = `J'ai trouvé ${suggestedProfessionals.length} professionnel(s) qui pourrai(en)t vous aider avec votre demande concernant "${intention.sujet}".`;
          } else {
            response = `Désolé, je n'ai pas trouvé de professionnels correspondant à votre demande concernant "${intention.sujet}". Pourriez-vous reformuler ou essayer une autre requête?`;
          }
          break;
          
        case 'information':
          response = await genererInformationGenerale(intention.sujet);
          break;
          
        case 'aide':
          response = `Je peux vous aider à trouver des professionnels qualifiés, obtenir des informations sur nos services, ou répondre à vos questions générales. N'hésitez pas à me demander par exemple "Je cherche un médecin spécialiste en cardiologie" ou "Comment prendre rendez-vous ?".`;
          break;
          
        default:
          response = `Je n'ai pas bien compris votre demande. Pourriez-vous reformuler ou me préciser comment je peux vous aider ?`;
      }

      return res.status(200).json({
        success: true,
        message: response,
        suggestedProfessionals,
        intention: intention.type
      });
      
    } catch (error) {
      console.error('Erreur lors du traitement de la requête chat:', error);
      return res.status(500).json({
        success: false,
        message: "Une erreur est survenue lors du traitement de votre demande."
      });
    }
  }
};

/**
 * Analyse l'intention de l'utilisateur à partir de sa requête
 * @param {string} query - La requête utilisateur
 * @returns {Object} L'intention détectée et le sujet
 */
async function analyzerIntention(query) {
  const queryLower = query.toLowerCase();
  
  // Mots-clés pour la recherche de professionnels
  const motsClefsRecherche = [
    'cherche', 'recherche', 'trouver', 'besoin', 'voir', 'consulter',
    'rendez-vous', 'rdv', 'réserver', 'prendre', 'disponible'
  ];
  
  // Mots-clés pour des demandes d'information
  const motsClefsInfo = [
    'comment', 'quoi', 'pourquoi', 'où', 'quand', 'qui',
    'information', 'renseignement', 'expliquer', 'détail'
  ];
  
  // Mots-clés pour des demandes d'aide
  const motsClefsAide = [
    'aide', 'aider', 'assister', 'support', 'secours', 
    'assistance', 'problème', 'difficulté', 'soutien'
  ];

  // Détecter le type d'intention
  let type = 'inconnu';
  
  if (motsClefsRecherche.some(mot => queryLower.includes(mot))) {
    type = 'rechercheProfessionnel';
  } else if (motsClefsInfo.some(mot => queryLower.includes(mot))) {
    type = 'information';
  } else if (motsClefsAide.some(mot => queryLower.includes(mot))) {
    type = 'aide';
  }
  
  // Extraire le sujet principal (simplification basique)
  let sujet = extraireSujet(queryLower);
  
  return { type, sujet };
}

/**
 * Extrait le sujet principal de la requête
 * @param {string} query - La requête utilisateur
 * @returns {string} Le sujet principal
 */
function extraireSujet(query) {
  // Liste des prépositions et articles à ignorer
  const motsAIgnorer = ['le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'a', 'à', 'au', 'aux', 'en', 'par', 'pour', 'sur', 'avec'];
  
  // Supprimer la ponctuation
  const texteNettoye = query.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  
  // Diviser en mots
  const mots = texteNettoye.split(' ');
  
  // Filtrer les mots courts et les mots à ignorer
  const motsFiltres = mots.filter(mot => mot.length > 2 && !motsAIgnorer.includes(mot));
  
  // Identifier les mots potentiellement importants (noms propres ou métiers/spécialités)
  const categories = ['médecin', 'docteur', 'avocat', 'notaire', 'professeur', 'enseignant', 
                      'coach', 'thérapeute', 'consultant', 'expert', 'spécialiste'];
                      
  // Chercher des combinaisons pertinentes
  for (let i = 0; i < motsFiltres.length - 1; i++) {
    if (categories.includes(motsFiltres[i].toLowerCase())) {
      return `${motsFiltres[i]} ${motsFiltres[i+1]}`;
    }
  }
  
  // Si pas de combinaison trouvée, renvoyer les 3 premiers mots filtrés ou une partie de la requête
  return motsFiltres.slice(0, 3).join(' ') || query.substring(0, 30);
}

/**
 * Recherche des professionnels en fonction de la requête et du domaine
 * @param {string} query - La requête utilisateur
 * @param {string} domaine - Le domaine détecté par le frontend
 * @returns {Array} Les professionnels correspondants
 */
async function rechercherProfessionnels(query, domaine) {
  // Extraire les mots-clés pertinents de la requête
  const queryLower = query.toLowerCase();
  const motsClefs = queryLower.split(' ')
    .filter(mot => mot.length > 3) // Filtrer les mots courts
    .map(mot => mot.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")) // Nettoyer la ponctuation
    .filter(mot => !['comment', 'pourquoi', 'cherche', 'recherche', 'besoin', 'avec'].includes(mot)); // Exclure certains mots
  
  // Convertir le domaine en catégorie
  const mapDomaineToCategory = {
    medical: ['santé', 'médecine'],
    juridique: ['droit', 'justice'],
    education: ['éducation', 'enseignement'],
    ministeriel: ['administration', 'gouvernement']
  };
  
  // Sélectionner les catégories pertinentes
  const categoriesRecherchees = mapDomaineToCategory[domaine] || [];
  
  try {
    // Rechercher des catégories correspondant aux mots-clés
    let categories = [];
    if (categoriesRecherchees.length > 0) {
      // Si un domaine a été détecté, chercher dans ces catégories
      categories = await Category.findAll({
        where: {
          nom: {
            [Op.or]: categoriesRecherchees.map(cat => ({ [Op.like]: `%${cat}%` }))
          }
        }
      });
    } else if (motsClefs.length > 0) {
      // Sinon, chercher des catégories correspondant aux mots-clés
      categories = await Category.findAll({
        where: {
          [Op.or]: motsClefs.map(mot => ({
            [Op.or]: [
              { nom: { [Op.like]: `%${mot}%` } },
              { description: { [Op.like]: `%${mot}%` } }
            ]
          }))
        }
      });
    }
    
    if (categories.length === 0) {
      return []; // Aucune catégorie correspondante trouvée
    }
    
    // Récupérer les IDs des catégories
    const categoryIds = categories.map(cat => cat.id);
    
    // Trouver les professionnels liés à ces catégories
    const professionnelsCategories = await CategorieProfessionnel.findAll({
      where: {
        categoryId: {
          [Op.in]: categoryIds
        }
      }
    });
    
    if (professionnelsCategories.length === 0) {
      return []; // Aucun professionnel dans ces catégories
    }
    
    // Récupérer les IDs des professionnels
    const professionnelIds = professionnelsCategories.map(pc => pc.professionnelId);
    
    // Récupérer les détails des professionnels
    const professionnels = await Professionnel.findAll({
      where: {
        id: {
          [Op.in]: professionnelIds
        }
      },
      // Limiter à 5 résultats
      limit: 5
    });
    
    // Ajouter le domaine aux résultats
    return professionnels.map(prof => {
      const profData = prof.toJSON();
      profData.domaine = categories.find(cat => {
        const pc = professionnelsCategories.find(
          p => p.professionnelId === prof.id && p.categoryId === cat.id
        );
        return pc !== undefined;
      })?.nom || '';
      
      return profData;
    });
  } catch (error) {
    console.error('Erreur lors de la recherche de professionnels:', error);
    return [];
  }
}

/**
 * Génère des informations générales basées sur le sujet demandé
 * @param {string} sujet - Le sujet de la demande d'information
 * @returns {string} L'information générale
 */
async function genererInformationGenerale(sujet) {
  const sujetLower = sujet.toLowerCase();
  
  // Base de connaissances simple
  const informations = {
    'rendez-vous': 'Pour prendre rendez-vous, vous pouvez utiliser notre système de réservation en ligne. Sélectionnez d\'abord une catégorie, puis un professionnel qui vous convient, choisissez le motif de votre consultation, et enfin une date et un horaire disponible.',
    
    'compte': 'Vous pouvez créer un compte gratuitement en cliquant sur "S\'inscrire" en haut à droite. Un compte vous permet de gérer vos rendez-vous, de recevoir des notifications et d\'accéder à votre historique.',
    
    'annulation': 'Pour annuler un rendez-vous, connectez-vous à votre compte, accédez à la section "Mes rendez-vous" dans votre tableau de bord, puis cliquez sur le bouton "Annuler" à côté du rendez-vous concerné.',
    
    'paiement': 'Le paiement s\'effectue directement auprès du professionnel lors de votre rendez-vous. Notre plateforme ne gère pas les transactions financières entre les utilisateurs et les professionnels.',
    
    'contact': 'Pour contacter notre équipe de support, vous pouvez nous envoyer un email à support@rdv-project.com ou utiliser le formulaire de contact accessible depuis le pied de page du site.'
  };
  
  // Vérifier si le sujet correspond à une information connue
  for (const [key, value] of Object.entries(informations)) {
    if (sujetLower.includes(key)) {
      return value;
    }
  }
  
  // Réponse par défaut
  return `Je n'ai pas d'informations spécifiques sur "${sujet}". N'hésitez pas à reformuler votre question ou à contacter notre équipe de support pour plus d'aide.`;
}

module.exports = ChatController;