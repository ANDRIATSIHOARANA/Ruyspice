
import React from 'react';
import { Link } from 'react-router-dom';

// Fonctions utilitaires pour les réponses du chatbot

/**
 * Vérifie si le message de l'utilisateur concerne l'utilisation du site ou une question sur le MESupReS
 * @param {string} message - Le message de l'utilisateur
 * @returns {boolean} - Vrai si le message concerne l'utilisation du site ou une question sur le MESupReS
 */
export const isHelpOrMESupReSQuestion = (message) => {
  if (!message) return false;
  
  const lowerMessage = message.toLowerCase();
  
  // Patterns pour détecter les questions sur l'utilisation du site
  const siteUsagePatterns = [
    /comment (?:utiliser|naviguer|se servir de|fonctionne) (?:le site|la plateforme|l'application)/i,
    /comment (?:prendre|réserver|faire|planifier) (?:un|des) rendez-vous/i,
    /comment (?:s'inscrire|créer un compte|s'enregistrer)/i,
    /comment (?:modifier|annuler|changer) (?:un|mon|des) rendez-vous/i,
    /(?:guide|tutoriel|aide|instructions) (?:d'utilisation|pour utiliser)/i,
    /(?:je ne sais pas|je ne comprends pas) comment (?:utiliser|faire)/i,
    /(?:perdu|confus|besoin d'aide)/i,
    // Patterns plus généraux pour la prise de rendez-vous
    /prendre rendez-vous/i,
    /réserver (?:un|des) rendez-vous/i,
    /comment (?:prendre|réserver|faire|planifier)/i,
    /rendez-vous dans (?:ce|cette|le|la) (?:site|plateforme)/i,
    /(?:rdv|rendez-vous) (?:en ligne|sur le site|sur la plateforme)/i,
    /(?:procédure|démarche|étape) (?:pour|de) (?:rdv|rendez-vous)/i,
    /(?:obtenir|avoir|fixer) (?:un|des) (?:rdv|rendez-vous)/i
  ];
  
  // Patterns pour détecter les questions sur le MESupReS
  const mesupresPatterns = [
    /mesupres c'est quoi/i,
    /c'est quoi (le |la |)mesupres/i,
    /qu(?:'|e)(?:st-ce que|) (?:le|c'est le|) (?:mesupres|ministère|mesupr)/i,
    /(?:rôle|mission|fonction|objectif|but) (?:du|de la|de|des) (?:mesupres|ministère|mesupr)/i,
    /(?:service|département|direction) (?:du|de la|de|des) (?:mesupres|ministère|mesupr)/i,
    /(?:contact|coordonnée|adresse|téléphone|email) (?:du|de la|de|des) (?:mesupres|ministère|mesupr)/i,
    /(?:horaire|heure d'ouverture) (?:du|de la|de|des) (?:mesupres|ministère|mesupr)/i,
    /(?:information|renseignement) (?:sur|à propos de|concernant) (?:le|la|les) (?:mesupres|ministère|mesupr)/i,
    /où (?:est|se trouve|est situé|est localisé) (?:le |)(?:mesupres|ministère|mesupr)/i,
    /localisation (?:du|de la|de|des) (?:mesupres|ministère|mesupr)/i,
    /(?:mesupres|ministère|mesupr) (?:se trouve|est situé|est)/i
  ];
  
  // Vérifier si le message correspond à l'un des patterns
  return siteUsagePatterns.some(pattern => pattern.test(lowerMessage)) || 
         mesupresPatterns.some(pattern => pattern.test(lowerMessage));
};

/**
 * Vérifie si le message est une demande explicite de professionnels
 * @param {string} message - Le message de l'utilisateur
 * @returns {boolean} - Vrai si c'est une demande de professionnels
 */
export const checkForProfessionalRequest = (message) => {
  if (!message) return false;
  
  const lowerMessage = message.toLowerCase();
  
  // Patterns pour détecter une demande de professionnels
  const professionalRequestPatterns = [
    /professionnel(s)?\s+disponible(s)?/i,
    /cherche\s+(un|des)\s+professionnel(s)?/i,
    /suggère(-moi)?\s+(des|quelques)?\s+professionnel(s)?/i,
    /besoin\s+d['e]un\s+professionnel/i,
    /trouver?\s+(un|des)\s+professionnel(s)?/i,
    /voir\s+(les|des)\s+professionnel(s)?/i,
    /liste\s+de(s)?\s+professionnel(s)?/i,
    /qui\s+peut\s+m['e]aider/i,
    /disponibilité(s)?\s+de(s)?\s+professionnel(s)?/i,
    /rendez-vous/i,
    /rdv/i,
    /consulter/i,
    /consultation/i
  ];
  
  return professionalRequestPatterns.some(pattern => pattern.test(lowerMessage));
};

/**
 * Détecte si le message de l'utilisateur demande des informations sur les domaines disponibles
 * @param {string} message - Le message de l'utilisateur
 * @returns {boolean} - True si l'utilisateur demande les domaines disponibles
 */
export const isDomainsListRequest = (message) => {
  if (!message) return false;
  
  const lowerMessage = message.toLowerCase();
  
  // Mots-clés qui indiquent une demande de liste de domaines
  const domainListKeywords = [
    'quels domaines', 'quels sont les domaines', 'liste des domaines', 
    'domaines disponibles', 'tous les domaines', 'tout les domaine',
    'catégories disponibles', 'quelles catégories', 'quelles sont les catégories',
    'spécialités disponibles', 'quelles spécialités'
  ];
  
  return domainListKeywords.some(keyword => lowerMessage.includes(keyword));
};

/**
 * Détecte si l'utilisateur demande un professionnel dans un domaine spécifique
 * @param {string} message - Le message de l'utilisateur
 * @param {Array} availableDomains - Les domaines disponibles dans la base de données
 * @returns {string|null} - Le domaine détecté ou null
 */
export const detectDomainRequest = (message, availableDomains = []) => {
  if (!message || !availableDomains.length) return null;
  
  // Vérifier d'abord si c'est une demande de liste de domaines
  if (isDomainsListRequest(message)) {
    return null; // Ne pas détecter de domaine spécifique si l'utilisateur demande la liste
  }
  
  const lowerMessage = message.toLowerCase();
  
  // Créer un dictionnaire de synonymes pour chaque domaine
  const domainSynonyms = {
    'informatique': ['informatique', 'développeur', 'programmeur', 'codeur', 'tech', 'it', 'logiciel', 'système', 'réseau', 'ordinateur', 'web', 'site', 'application', 'développement'],
    'dokotera': ['dokotera', 'médecin', 'docteur', 'santé', 'soins', 'consultation', 'traitement', 'médical', 'clinique', 'hôpital', 'maladie', 'symptôme'],
    'mecanicien': ['mecanicien', 'mécanique', 'réparation', 'voiture', 'auto', 'véhicule', 'moteur', 'garage', 'panne', 'automobile'],
    'rh': ['rh', 'ressources humaines', 'recrutement', 'carrière', 'emploi', 'cv', 'entretien', 'embauche', 'personnel', 'gestion']
  };
  
  // Vérifier chaque domaine et ses synonymes
  for (const domain of availableDomains) {
    const domainLower = domain.toLowerCase();
    
    // Vérifier si le domaine est mentionné directement
    if (lowerMessage.includes(domainLower)) {
      return domain;
    }
    
    // Vérifier les synonymes du domaine
    const synonyms = domainSynonyms[domainLower] || [];
    for (const synonym of synonyms) {
      if (lowerMessage.includes(synonym)) {
        return domain;
      }
    }
  }
  
  return null;
};

/**
 * Vérifie si une question est hors sujet par rapport au contexte du MESupReS
 * @param {string} question - La question de l'utilisateur
 * @returns {boolean} - True si la question est hors sujet, false sinon
 */
export const isOffTopicQuestion = (question) => {
  // Convertir la question en minuscules pour faciliter la comparaison
  const lowerQuestion = question.toLowerCase();
  
  // Liste de mots-clés pertinents au contexte du MESupReS
  const relevantKeywords = [
    'professeur', 'prof', 'professionnel', 'enseignant', 'chercheur', 
    'université', 'faculté', 'école', 'institut', 'formation',
    'cours', 'étude', 'étudier', 'enseigner', 'recherche',
    'ministère', 'mesupr', 'mesupres', 'supérieur', 'scientifique',
    'rendez-vous', 'rdv', 'réserver', 'prendre', 'contacter',
    'informatique', 'mathématiques', 'physique', 'chimie', 'biologie',
    'médecine', 'droit', 'économie', 'gestion', 'lettres',
    'suggestion', 'suggérer', 'proposer', 'recommander', 'trouver'
  ];
  
  // Vérifier si la question contient au moins un mot-clé pertinent
  const isRelevant = relevantKeywords.some(keyword => lowerQuestion.includes(keyword));
  
  // Si la question contient un mot-clé pertinent, elle n'est pas hors sujet
  if (isRelevant) {
    return false;
  }
  
  // Liste de questions personnelles ou hors contexte
  const offTopicPatterns = [
    /comment (?:tu |vous |t'|s')?appell/i,
    /quel est ton nom/i,
    /qui es[- ]tu/i,
    /tu es qui/i,
    /parle[- ]moi de toi/i,
    /raconte[- ]moi/i,
    /d'où viens[- ]tu/i,
    /où habites[- ]tu/i,
    /quel âge as[- ]tu/i,
    /es[- ]tu (?:un robot|une ia|humain)/i,
    /es[- ]tu marié/i,
    /as[- ]tu des enfants/i,
    /quelle heure est[- ]il/i,
    /quel temps fait[- ]il/i,
    /blague|joke|drôle/i,
    /chanson|chante/i,
    /poème|poésie/i,
    /histoire drôle/i,
    /comment vas[- ]tu/i
  ];
  
  // Vérifier si la question correspond à un pattern hors sujet
  return offTopicPatterns.some(pattern => pattern.test(lowerQuestion));
};

/**
 * Vérifie si le message est une question sur MESupReS
 * @param {string} message - Le message de l'utilisateur
 * @returns {boolean} - Vrai si c'est une question sur MESupReS
 */
export const isMESupReSQuestion = (message) => {
  if (!message) return false;
  
  const lowerMessage = message.toLowerCase();
  
  // Patterns pour détecter les questions sur MESupReS
  const meSupReSPatterns = [
    /mesupres/i,
    /ministère/i,
    /enseignement supérieur/i,
    /recherche scientifique/i,
    /minist[eè]re de l['']enseignement/i
  ];
  
  return meSupReSPatterns.some(pattern => pattern.test(lowerMessage));
};

/**
 * Détecte le type spécifique de question sur le MESupReS
 * @param {string} message - Le message de l'utilisateur
 * @returns {string} - Type de question (définition, localisation, rôle, contact, général)
 */
export const detectMESupReSQuestionType = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Questions sur la définition
  if (/mesupres c'est quoi|c'est quoi (le |la |)mesupres|qu(?:'|e)(?:st-ce que|) (?:le|c'est le|) (?:mesupres|ministère|mesupr)/i.test(lowerMessage)) {
    return "définition";
  }
  
  // Questions sur la localisation
  if (/où (?:est|se trouve|est situé|est localisé) (?:le |)(?:mesupres|ministère|mesupr)|localisation (?:du|de la|de|des) (?:mesupres|ministère|mesupr)|(?:mesupres|ministère|mesupr) (?:se trouve|est situé|est)/i.test(lowerMessage)) {
    return "localisation";
  }
  
  // Questions sur les rôles/missions
  if (/(?:rôle|mission|fonction|objectif|but) (?:du|de la|de|des) (?:mesupres|ministère|mesupr)/i.test(lowerMessage)) {
    return "rôle";
  }
  
  // Questions sur les contacts
  if (/(?:contact|coordonnée|adresse|téléphone|email) (?:du|de la|de|des) (?:mesupres|ministère|mesupr)/i.test(lowerMessage)) {
    return "contact";
  }
  
  // Par défaut
  return "général";
};

/**
 * Génère une réponse intelligente en fonction du contexte de la question
 * @param {string} userMessage - Le message de l'utilisateur
 * @param {Function} generateUniqueId - Fonction pour générer un ID unique
 * @param {Array} availableDomains - Les domaines disponibles dans la base de données
 * @returns {Object} - Objet message formaté
 */
export const generateSmartResponse = (userMessage, generateUniqueId, availableDomains = []) => {
  if (!userMessage) {
    return {
      id: generateUniqueId('bot'),
      text: "Comment puis-je vous aider aujourd'hui ?",
      sender: 'bot'
    };
  }
  
  const lowerMessage = userMessage.toLowerCase();
  
  // Vérifier en priorité si c'est une demande de liste des domaines disponibles
  if (isDomainsListRequest(userMessage)) {
    // Si aucun domaine n'est disponible
    if (!availableDomains || availableDomains.length === 0) {
      return {
        id: generateUniqueId('bot'),
        text: "Je suis désolé, mais aucun domaine n'est disponible pour le moment.",
        sender: 'bot'
      };
    }
    
    // Si la question demande combien de domaines sont disponibles
    if (lowerMessage.includes("combien") || lowerMessage.includes("nombre")) {
      return {
        id: generateUniqueId('bot'),
        text: `Nous avons actuellement ${availableDomains.length} domaines disponibles sur notre plateforme : ${availableDomains.join(', ')}.`,
        sender: 'bot',
        showCategories: true,
        availableDomains: availableDomains
      };
    }
    
    // Réponse standard pour une demande de liste de domaines
    return {
      id: generateUniqueId('bot'),
      text: "Voici tous les domaines disponibles sur notre plateforme :",
      sender: 'bot',
      showCategories: true,
      availableDomains: availableDomains
    };
  }
  
  // Vérifier en priorité si c'est une question sur MESupReS
  if (isMESupReSQuestion(userMessage)) {
    return getMESupReSResponse(userMessage, generateUniqueId);
  }
  
  // Vérifier si c'est une question sur le nom ou l'identité du chatbot
  if (lowerMessage.includes("t'appele") || 
      lowerMessage.includes("ton nom") || 
      lowerMessage.includes("qui es-tu") ||
      lowerMessage.includes("tu es qui")) {
    return {
      id: generateUniqueId('bot'),
      text: "Je suis l'assistant virtuel de MESupReS. Je suis là pour vous aider à trouver des professionnels et répondre à vos questions.",
      sender: 'bot'
    };
  }
  
  // Vérifier si c'est une salutation
  if (lowerMessage.match(/^(bonjour|salut|hello|hey|hi|coucou|bonsoir)(\s|$)/i)) {
    return {
      id: generateUniqueId('bot'),
      text: "Bonjour ! Je suis l'assistant virtuel de MESupReS. Comment puis-je vous aider aujourd'hui ?",
      sender: 'bot'
    };
  }
  
  // Vérifier si c'est un remerciement
  if (lowerMessage.match(/(merci|thanks|thank you|je te remercie)/i)) {
    return {
      id: generateUniqueId('bot'),
      text: "Je vous en prie ! N'hésitez pas si vous avez d'autres questions.",
      sender: 'bot'
    };
  }
  
  // Vérifier si c'est une demande de professionnels
  const isProfessionalRequest = checkForProfessionalRequest(userMessage);
  
  if (isProfessionalRequest) {
    // Détection du domaine dans la demande
    const domainRequest = detectDomainRequest(userMessage, availableDomains);
    
    // Si un domaine est détecté mais qu'il n'est pas dans la liste des domaines disponibles
    if (domainRequest && availableDomains.length > 0 && !availableDomains.includes(domainRequest)) {
      return {
        id: generateUniqueId('bot'),
        text: `Je suis désolé, mais le domaine "${domainRequest}" n'est pas disponible actuellement. Voici les domaines disponibles :`,
        sender: 'bot',
        showCategories: true,
        availableDomains: availableDomains
      };
    }
    
    if (domainRequest) {
      return {
        id: generateUniqueId('bot'),
        text: `Voici les professionnels disponibles dans le domaine ${domainRequest} :`,
        sender: 'bot',
        showProfessionals: true,
        domain: domainRequest
      };
    } else {
      // Si aucun professionnel n'est disponible
      if (!professionals || professionals.length === 0) {
        return {
          id: generateUniqueId('bot'),
          text: "Je suis désolé, mais aucun professionnel n'est disponible actuellement. Veuillez réessayer plus tard.",
          sender: 'bot'
        };
      }
      
      return {
        id: generateUniqueId('bot'),
        text: "Voici quelques professionnels disponibles actuellement :",
        sender: 'bot',
        showProfessionals: true
      };
    }
  }
  
  // Détection du domaine spécifique
  const domainRequest = detectDomainRequest(userMessage, availableDomains);
  if (domainRequest) {
    // Vérifier si le domaine demandé existe dans la liste des domaines disponibles
    if (availableDomains.length > 0 && !availableDomains.includes(domainRequest)) {
      return {
        id: generateUniqueId('bot'),
        text: `Je suis désolé, mais le domaine "${domainRequest}" n'est pas disponible actuellement. Voici les domaines disponibles :`,
        sender: 'bot',
        showCategories: true,
        availableDomains: availableDomains
      };
    }
    
    return {
      id: generateUniqueId('bot'),
      text: `Vous cherchez un professionnel en ${domainRequest}. Voici les spécialistes disponibles :`,
      sender: 'bot',
      showProfessionals: true,
      domain: domainRequest
    };
  }
  
  // Réponses pour les questions générales
  if (lowerMessage.includes("aide") || lowerMessage.includes("help")) {
    return {
      id: generateUniqueId('bot'),
      text: "Je peux vous aider à trouver des professionnels dans différents domaines comme l'informatique, la médecine, la mécanique ou les ressources humaines. Que recherchez-vous exactement ?",
      sender: 'bot'
    };
  }
  
  if (lowerMessage.includes("service") || lowerMessage.includes("offre")) {
    return {
      id: generateUniqueId('bot'),
      text: "Notre plateforme vous permet de trouver et prendre rendez-vous avec des professionnels dans divers domaines. Vous pouvez consulter leurs disponibilités et réserver directement en ligne.",
      sender: 'bot'
    };
  }
  
  // Vérifier si c'est une question sur l'aide ou le fonctionnement du site
  if (isHelpOrMESupReSQuestion(userMessage)) {
    return getHelpResponse(userMessage, generateUniqueId);
  }
  
  // Vérifier si c'est une question hors sujet
  if (isOffTopicQuestion(userMessage)) {
    return getOffTopicQuestionResponse(generateUniqueId);
  }
  
  // Si aucune intention spécifique n'est détectée, répondre de manière générique
  const genericResponses = [
    "Comment puis-je vous aider aujourd'hui ? Vous cherchez un professionnel dans un domaine particulier ?",
    "Je peux vous aider à trouver un professionnel. Dans quel domaine souhaitez-vous prendre rendez-vous ?",
    "Bonjour ! Je suis là pour vous aider à trouver le bon professionnel. Dites-moi ce dont vous avez besoin."
  ];
  
  return {
    id: generateUniqueId('bot'),
    text: genericResponses[Math.floor(Math.random() * genericResponses.length)],
    sender: 'bot'
  };
};

/**
 * Génère une réponse pour les questions sur l'utilisation du site
 * @param {string} message - Le message de l'utilisateur
 * @param {Function} generateUniqueId - Fonction pour générer un ID unique
 * @returns {Object} - Objet message formaté
 */
export const getHelpResponse = (message, generateUniqueId) => {
  const lowerMessage = message.toLowerCase();
  
  // Réponses pour la prise de rendez-vous
  if (/comment (?:prendre|réserver|faire|planifier) (?:un|des) rendez-vous/i.test(lowerMessage)) {
    return {
      id: generateUniqueId ? generateUniqueId('bot') : 'bot-' + Date.now(),
      text: "Pour prendre rendez-vous sur notre plateforme, suivez ces étapes simples :\n\n" +
            "1. Connectez-vous à votre compte (ou créez-en un si vous n'en avez pas)\n" +
            "2. Utilisez la barre de recherche ou parcourez les catégories pour trouver un professionnel\n" +
            "3. Consultez le profil du professionnel et cliquez sur 'Prendre rendez-vous'\n" +
            "4. Sélectionnez une date et un créneau horaire disponible dans le calendrier\n" +
            "5. Remplissez le formulaire en précisant l'objet de votre rendez-vous\n" +
            "6. Confirmez votre rendez-vous\n\n" +
            "Vous recevrez une confirmation par email avec tous les détails de votre rendez-vous. Souhaitez-vous que je vous aide à trouver un professionnel maintenant ?",
      sender: 'bot'
    };
  }
  
  // Réponses pour l'inscription/création de compte
  if (/comment (?:s'inscrire|créer un compte|s'enregistrer)/i.test(lowerMessage)) {
    return {
      id: generateUniqueId ? generateUniqueId('bot') : 'bot-' + Date.now(),
      text: "Pour créer un compte sur notre plateforme :\n\n" +
            "1. Cliquez sur le bouton 'S'inscrire' en haut à droite de la page d'accueil\n" +
            "2. Choisissez entre une inscription avec votre email ou via votre compte Google\n" +
            "3. Si vous choisissez l'email, remplissez le formulaire avec vos informations personnelles\n" +
            "4. Créez un mot de passe sécurisé\n" +
            "5. Acceptez les conditions d'utilisation\n" +
            "6. Cliquez sur 'Créer mon compte'\n\n" +
            "Vous recevrez un email de confirmation pour activer votre compte. Avez-vous besoin d'aide pour autre chose ?",
      sender: 'bot'
    };
  }
  
  // Réponses pour la modification/annulation de rendez-vous
  if (/comment (?:modifier|annuler|changer) (?:un|mon|des) rendez-vous/i.test(lowerMessage)) {
    return {
      id: generateUniqueId ? generateUniqueId('bot') : 'bot-' + Date.now(),
      text: "Pour modifier ou annuler un rendez-vous :\n\n" +
            "1. Connectez-vous à votre compte\n" +
            "2. Accédez à votre tableau de bord utilisateur\n" +
            "3. Dans la section 'Mes rendez-vous', trouvez le rendez-vous concerné\n" +
            "4. Pour modifier : cliquez sur l'icône de modification, puis choisissez une nouvelle date/heure\n" +
            "5. Pour annuler : cliquez sur l'icône d'annulation, puis confirmez votre choix\n\n" +
            "Notez que les modifications ou annulations doivent être effectuées au moins 24 heures avant l'heure prévue du rendez-vous. Puis-je vous aider avec autre chose ?",
      sender: 'bot'
    };
  }
  
  // Réponse générale sur l'utilisation du site
  return {
    id: generateUniqueId ? generateUniqueId('bot') : 'bot-' + Date.now(),
    text: "Voici comment utiliser notre plateforme de rendez-vous :\n\n" +
          "• Pour prendre rendez-vous : recherchez un professionnel, sélectionnez un créneau disponible et confirmez votre réservation\n" +
          "• Pour vous inscrire : cliquez sur 'S'inscrire' et suivez les instructions\n" +
          "• Pour gérer vos rendez-vous : connectez-vous et accédez à votre tableau de bord\n" +
          "• Pour modifier/annuler un rendez-vous : allez dans 'Mes rendez-vous' sur votre tableau de bord\n\n" +
          "Que souhaitez-vous faire précisément ? Je peux vous donner des instructions plus détaillées.",
    sender: 'bot'
  };
};

/**
 * Génère une réponse pour les questions sur MESupReS
 * @param {string} message - Le message de l'utilisateur
 * @param {Function} generateUniqueId - Fonction pour générer un ID unique
 * @returns {Object} - Objet message formaté
 */
export const getMESupReSResponse = (message, generateUniqueId) => {
  const lowerMessage = message.toLowerCase();
  
  // Réponses spécifiques selon le type de question
  if (lowerMessage.includes("où") || 
      lowerMessage.includes("ou") || 
      lowerMessage.includes("adresse") || 
      lowerMessage.includes("trouve")) {
    return {
      id: generateUniqueId('bot'),
      text: "Le Ministère de l'Enseignement Supérieur et de la Recherche Scientifique (MESupReS) est situé à Antananarivo, Madagascar. Vous pouvez visiter leur site officiel pour plus d'informations.",
      sender: 'bot'
    };
  }
  
  if (lowerMessage.includes("contact") || 
      lowerMessage.includes("téléphone") || 
      lowerMessage.includes("appeler") || 
      lowerMessage.includes("joindre")) {
    return {
      id: generateUniqueId('bot'),
      text: "Vous pouvez contacter le MESupReS par téléphone au [numéro de téléphone] ou par email à [adresse email]. Vous pouvez également visiter leur site web officiel pour plus d'informations de contact.",
      sender: 'bot'
    };
  }
  
  if (lowerMessage.includes("service") || 
      lowerMessage.includes("offre") || 
      lowerMessage.includes("propose")) {
    return {
      id: generateUniqueId('bot'),
      text: "Le MESupReS est responsable de l'enseignement supérieur et de la recherche scientifique à Madagascar. Il supervise les universités, établit les politiques d'enseignement supérieur, et coordonne les programmes de recherche scientifique.",
      sender: 'bot'
    };
  }
  
  // Réponse générique pour les autres questions sur MESupReS
  const responses = [
    "Le MESupReS (Ministère de l'Enseignement Supérieur et de la Recherche Scientifique) est responsable de l'enseignement supérieur à Madagascar.",
    "Le MESupReS supervise les universités et établissements d'enseignement supérieur à Madagascar.",
    "Le MESupReS établit les politiques d'enseignement supérieur et coordonne les programmes de recherche scientifique à Madagascar."
  ];
  
  return {
    id: generateUniqueId('bot'),
    text: responses[Math.floor(Math.random() * responses.length)],
    sender: 'bot'
  };
};

/**
 * Retourne une réponse standardisée pour les questions hors sujet
 * @param {Function} generateUniqueId - Fonction pour générer un ID unique
 * @returns {Object} - Objet message formaté
 */
export const getOffTopicQuestionResponse = (generateUniqueId) => {
  const responses = [
    "Je suis un assistant virtuel dédié uniquement au Ministère de l'Enseignement Supérieur et de la Recherche Scientifique (MESupReS) et à ce site. Je peux vous aider à trouver des informations sur les services du ministère, les professionnels disponibles, et comment prendre rendez-vous. Pour toute autre question en dehors de ce contexte, je ne pourrai malheureusement pas vous répondre.",
    
    "Désolé, je suis spécialisé uniquement dans les services du MESupReS. Je ne peux pas répondre à des questions en dehors de ce contexte. Je serais ravi de vous aider pour toute information concernant le ministère, ses professionnels ou la prise de rendez-vous.",
    
    "En tant qu'assistant du MESupReS, je suis programmé pour vous aider uniquement avec les services du ministère et ce site. N'hésitez pas à me poser des questions sur nos professionnels, nos services ou la prise de rendez-vous.",
    
    "Je ne peux répondre qu'aux questions concernant le MESupReS, ses services, ses professionnels et la prise de rendez-vous. Pour d'autres sujets, veuillez consulter un moteur de recherche ou un assistant virtuel généraliste.",
    
    "Cette question semble être hors sujet. Je suis uniquement conçu pour vous aider avec les services du MESupReS, comme trouver un professionnel ou prendre un rendez-vous. Comment puis-je vous aider dans ce contexte spécifique ?",
    
    "Je suis désolé, mais je ne peux pas répondre à cette question car elle ne concerne pas le MESupReS ou l'utilisation de cette plateforme. Je suis là pour vous aider à naviguer sur ce site, trouver des professionnels et prendre des rendez-vous.",
    
    "Ma mission est de vous assister uniquement pour les services liés au MESupReS. Je peux vous aider à trouver des professionnels, prendre rendez-vous ou vous informer sur le ministère, mais je ne peux pas répondre à des questions hors de ce cadre.",
    
    "Je suis spécialisé dans l'assistance concernant le MESupReS et ses services. Pour cette question qui sort de mon domaine d'expertise, je ne peux malheureusement pas vous fournir de réponse. Puis-je vous aider avec quelque chose concernant le ministère ou la prise de rendez-vous ?"
  ];
  
  return {
    id: generateUniqueId ? generateUniqueId('bot') : 'bot-' + Date.now(),
    text: responses[Math.floor(Math.random() * responses.length)],
    sender: 'bot'
  };
};

/**
 * Retourne une réponse standardisée pour les questions sur la prise de rendez-vous
 * @param {Function} generateUniqueId - Fonction pour générer un ID unique
 * @returns {Object} - Objet message formaté
 */
export const getResponseForAppointmentQuestion = (generateUniqueId) => {
  const responses = [
    "Pour prendre rendez-vous, vous pouvez sélectionner un domaine puis choisir un professionnel disponible. Voici les domaines d'expertise disponibles :",
    "Vous souhaitez prendre rendez-vous ? Je peux vous aider à trouver un professionnel. Commencez par sélectionner un domaine d'expertise :",
    "Pour réserver un rendez-vous, veuillez d'abord sélectionner un domaine, puis choisir un professionnel qui correspond à vos besoins :"
  ];
  
  return {
    id: generateUniqueId ? generateUniqueId('bot') : 'bot-' + Date.now(),
    text: responses[Math.floor(Math.random() * responses.length)],
    sender: 'bot',
    showCategories: true // Indicateur pour afficher les catégories disponibles
  };
};

/**
 * Composant ChatResponses - Affiche les messages du chat avec suggestions de professionnels
 * 
 * @param {Array} messages - Liste des messages à afficher
 * @param {Array} professionals - Liste des professionnels disponibles
 * @param {Function} onProfessionalClick - Fonction appelée lors du clic sur un professionnel
 * @returns {JSX.Element} - Composant de rendu des messages
 */
const ChatResponses = ({ messages, professionals = [], onProfessionalClick }) => {
  // Formatter la date pour l'affichage
  const formatTime = (timestamp) => {
    const date = new Date(timestamp || Date.now());
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filtrer les professionnels par domaine si spécifié dans le message
  const getFilteredProfessionals = (message) => {
    if (!professionals || professionals.length === 0) return [];
    
    // Si un domaine spécifique est demandé, filtrer les professionnels
    if (message.domain) {
      return professionals.filter(pro => 
        pro.domaine && pro.domaine.toLowerCase() === message.domain.toLowerCase()
      );
    }
    
    // Sinon retourner tous les professionnels (limités à 5 pour l'affichage)
    return message.showProfessionals ? professionals.slice(0, 5) : [];
  };

  // Afficher les catégories disponibles si demandé
  const renderAvailableCategories = (message) => {
    if (!message.showCategories) return null;
    
    const domains = message.availableDomains || [];
    
    if (domains.length === 0) {
      return (
        <div className="available-categories">
          <p>Aucun domaine n'est disponible pour le moment.</p>
        </div>
      );
    }
    
    return (
      <div className="available-categories">
        <ul className="categories-list">
          {domains.map((domain, index) => (
            <li key={index} className="category-item">
              <span className="category-name">{domain}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Rendu des professionnels suggérés avec indication de domaine
  const renderSuggestedProfessionals = (message) => {
    const filteredProfessionals = getFilteredProfessionals(message);
    
    if (!filteredProfessionals || filteredProfessionals.length === 0) {
      return null;
    }

    return (
      <div className="suggested-professionals">
        <h4>Professionnels recommandés:</h4>
        <ul>
          {filteredProfessionals.map((pro, index) => (
            <li key={index} className="professional-card">
              <div className="professional-info">
                <span className="professional-name">{pro.prenom} {pro.nom}</span>
                {pro.specialite && <span className="professional-specialty">• {pro.specialite}</span>}
                {pro.domaine && <span className="professional-domain">• {pro.domaine}</span>}
              </div>
              <Link 
                to={`/professional/${pro.id}`} 
                className="view-profile-btn"
                onClick={() => onProfessionalClick && onProfessionalClick(pro)}
              >
                Voir profil
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Traitement du contenu du message pour détecter les URLs et les formatter comme liens
  const processMessageContent = (content) => {
    if (typeof content !== 'string') return content;

    // Regex pour détecter les URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Diviser le contenu en segments texte/URL
    let parts = content.split(urlRegex);
    
    // Extraire les URLs
    const urls = content.match(urlRegex) || [];
    
    // Reconstruire le contenu avec des liens pour les URLs
    return parts.map((part, i) => {
      if (urls.includes(part)) {
        return (
          <a 
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-link"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Formater le texte avec des sauts de ligne
  const formatText = (text) => {
    if (!text) return null;
    
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {processMessageContent(line)}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="chat-responses">
      {messages.map((message, index) => (
        <div
          key={message.id || index}
          className={`message-container ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
        >
          <div className={`message ${message.sender === 'user' ? 'user' : 'bot'}`}>
            <div className="message-content">
              {formatText(message.text)}
            </div>
            <div className="message-time">
              {formatTime(message.timestamp)}
            </div>
          </div>
          {(message.showProfessionals || message.domain) && renderSuggestedProfessionals(message)}
          {message.showCategories && renderAvailableCategories(message)}
        </div>
      ))}
    </div>
  );
};

export default ChatResponses;
