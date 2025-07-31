// Importation des modules nécessaires
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SmartChat.css';
import { 
  getResponseForAppointmentQuestion, 
  isOffTopicQuestion, 
  getOffTopicQuestionResponse,
  generateSmartResponse,
  detectDomainRequest,
  // Nouvelles importations pour les fonctionnalités ajoutées
  isHelpOrMESupReSQuestion,
  getHelpResponse,
  getMESupReSResponse
} from './ChatResponses';

// Fonction pour vérifier si l'utilisateur demande explicitement des professionnels
const checkForProfessionalRequest = (text) => {
  const professionalKeywords = [
    'professionnel', 'professionnels', 'expert', 'experts', 'spécialiste', 'spécialistes',
    'enseignant', 'enseignants', 'chercheur', 'chercheurs', 'professeur', 'professeurs',
    'rendez-vous', 'rdv', 'consulter', 'consultation', 'rencontrer', 'contacter'
  ];
  
  const textLower = text.toLowerCase();
  
  return professionalKeywords.some(keyword => textLower.includes(keyword));
};

// Fonction pour détecter le domaine à partir du texte de l'utilisateur
const detectDomain = (text, availableDomains = []) => {
  if (!text || !availableDomains || availableDomains.length === 0) {
    return null;
  }
  
  const textLower = text.toLowerCase();
  
  // Vérifier d'abord si un domaine exact est mentionné
  for (const domain of availableDomains) {
    if (textLower.includes(domain.toLowerCase())) {
      return domain;
    }
  }
  
  // Si aucun domaine exact n'est trouvé, vérifier les mots-clés associés à chaque domaine
  const domainKeywords = {
    'informatique': ['développement', 'programmation', 'web', 'intelligence artificielle', 'logiciel', 'application', 'code', 'système'],
    'mathématiques': ['algèbre', 'statistiques', 'calcul', 'géométrie', 'probabilités'],
    'physique': ['mécanique', 'nucléaire', 'quantique', 'électromagnétisme', 'thermodynamique'],
    'biologie': ['microbiologie', 'génétique', 'cellule', 'organisme', 'écologie'],
    'chimie': ['organique', 'biochimie', 'molécule', 'réaction', 'élément'],
    'médecine': ['santé', 'soin', 'traitement', 'thérapie', 'diagnostic', 'clinique'],
    'droit': ['juridique', 'légal', 'loi', 'avocat', 'juriste', 'législation'],
    'économie': ['finance', 'marché', 'investissement', 'gestion', 'commerce'],
    'éducation': ['enseignement', 'formation', 'pédagogie', 'apprentissage', 'didactique']
  };
  
  for (const domain of availableDomains) {
    const keywords = domainKeywords[domain.toLowerCase()] || [];
    if (keywords.some(keyword => textLower.includes(keyword))) {
      return domain;
    }
  }
  
  return null;
};

// Configuration d'axios pour utiliser la bonne URL de base
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API = axios.create({
  baseURL: API_BASE_URL
});

// Fonction utilitaire pour naviguer de manière fiable - non utilisée car remplacée par window.location.href direct
const navigateToUrl = (url) => {
  window.location.href = url;
};

// Ajouter le token d'authentification si nécessaire
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Configuration de l'API OpenRouter
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Données fictives de professionnels pour garantir le fonctionnement
const MOCK_PROFESSIONALS = [
  { 
    _id: 'prof1', 
    prenom: 'Jean', 
    nom: 'Dupont', 
    specialite: 'Informatique', 
    categorie: 'Enseignant',
    specialites: ['Développement Web', 'Intelligence Artificielle'] 
  },
  { 
    _id: 'prof2', 
    prenom: 'Marie', 
    nom: 'Martin', 
    specialite: 'Mathématiques', 
    categorie: 'Chercheur',
    specialites: ['Algèbre', 'Statistiques'] 
  },
  { 
    _id: 'prof3', 
    prenom: 'Pierre', 
    nom: 'Durand', 
    specialite: 'Physique', 
    categorie: 'Enseignant-Chercheur',
    specialites: ['Mécanique Quantique', 'Physique Nucléaire'] 
  },
  { 
    _id: 'prof4', 
    prenom: 'Sophie', 
    nom: 'Lefebvre', 
    specialite: 'Biologie', 
    categorie: 'Enseignant',
    specialites: ['Microbiologie', 'Génétique'] 
  },
  { 
    _id: 'prof5', 
    prenom: 'Thomas', 
    nom: 'Bernard', 
    specialite: 'Chimie', 
    categorie: 'Chercheur',
    specialites: ['Chimie Organique', 'Biochimie'] 
  }
];

const SmartChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 'init-1', 
      text: "Bonjour ! Je suis votre assistant virtuel du MESupReS. Comment puis-je vous aider à trouver un professionnel ou un service ?", 
      sender: 'bot' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [professionals, setProfessionals] = useState(MOCK_PROFESSIONALS); // Initialiser avec des données fictives
  const [categories, setCategories] = useState([]);
  const [availableDomains, setAvailableDomains] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(true); // Considérer les données comme déjà chargées
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messageIdCounterRef = useRef(1);
  const chatWindowRef = useRef(null);
  const navigate = useNavigate();

  // Générer un ID unique pour chaque message
  const generateUniqueId = (prefix = '') => {
    return `${prefix}-${Date.now()}-${messageIdCounterRef.current++}`;
  };

  // Charger les professionnels et les catégories au démarrage
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Chargement des données des professionnels...');
        
        // Essayer d'abord avec /professionnels
        try {
          const proResponse = await API.get('/professionnels');
          console.log('Professionnels chargés depuis /professionnels:', proResponse.data);
          if (proResponse.data && proResponse.data.data && proResponse.data.data.length > 0) {
            setProfessionals(proResponse.data.data);
            console.log('Professionnels chargés avec succès:', proResponse.data.data);
          } else {
            console.log('Aucun professionnel retourné par l\'API, utilisation des données fictives');
          }
        } catch (error) {
          console.error('Erreur lors du chargement depuis /professionnels, tentative avec /professionals:', error);
          
          // Si ça échoue, essayer avec /professionals
          try {
            const proResponse = await API.get('/professionals');
            console.log('Professionnels chargés depuis /professionals:', proResponse.data);
            if (proResponse.data && proResponse.data.data && proResponse.data.data.length > 0) {
              setProfessionals(proResponse.data.data);
              console.log('Professionnels chargés avec succès:', proResponse.data.data);
            }
          } catch (error) {
            console.error('Erreur lors du chargement depuis /professionals, utilisation des données fictives:', error);
            // Les données fictives sont déjà chargées par défaut
          }
        }
        
        // Charger les catégories
        try {
          const catResponse = await API.get('/categories');
          console.log('Catégories chargées:', catResponse.data);
          if (catResponse.data && catResponse.data.data) {
            setCategories(catResponse.data.data);
            
            // Extraire les noms des domaines disponibles
            const domains = catResponse.data.data.map(category => 
              category.nom ? category.nom.toLowerCase() : ''
            ).filter(Boolean);
            
            setAvailableDomains(domains);
            console.log('Domaines disponibles:', domains);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des catégories:', error);
          // Définir des domaines par défaut en cas d'échec
          const defaultDomains = ['informatique', 'mathématiques', 'physique', 'biologie', 'chimie', 'médecine', 'droit', 'économie', 'éducation'];
          setAvailableDomains(defaultDomains);
        }
        
        setIsDataLoaded(true);
        console.log('Données chargées avec succès');
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        // Ne pas afficher de message d'erreur, car nous avons déjà des données fictives
      }
    };
    
    fetchData();
  }, []);

  // Faire défiler vers le bas lorsque de nouveaux messages sont ajoutés
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Si le chat n'est pas ouvert et qu'un nouveau message du bot arrive, afficher une notification
    if (!isOpen && messages.length > 0 && messages[messages.length - 1].sender === 'bot') {
      setHasNewMessage(true);
    }
  }, [messages, isOpen]);

  // Effet pour l'animation d'ouverture/fermeture
  useEffect(() => {
    if (isOpen) {
      // Réinitialiser la notification de nouveau message lorsque le chat est ouvert
      setHasNewMessage(false);
      
      // Focus sur l'input après l'animation d'ouverture
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 400); // Attendre que l'animation soit terminée
    }
  }, [isOpen]);

  // Ouvrir/fermer le chat
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Gérer la soumission du message
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Ajouter le message de l'utilisateur
    const userMessage = { id: generateUniqueId('user'), text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Traiter le message de l'utilisateur
    processUserMessage(userMessage.text);
  };

  // Trouver des professionnels pertinents en fonction des termes de recherche
  const findRelevantProfessionals = (searchTerms) => {
    console.log('Recherche de professionnels pour les termes:', searchTerms);
    
    if (!searchTerms || typeof searchTerms !== 'string') {
      console.log('Termes de recherche invalides, retour de professionnels aléatoires');
      return getRandomProfessionals(3);
    }
    
    const searchTermsLower = searchTerms.toLowerCase();
    
    // Rechercher des professionnels par spécialité, nom ou catégorie
    const relevantPros = professionals.filter(pro => {
      const fullName = `${pro.prenom || ''} ${pro.nom || ''}`.toLowerCase();
      const speciality = (pro.specialite || '').toLowerCase();
      const category = (pro.categorie || '').toLowerCase();
      const specialities = Array.isArray(pro.specialites) 
        ? pro.specialites.map(s => s.toLowerCase()) 
        : [];
      
      return (
        fullName.includes(searchTermsLower) ||
        speciality.includes(searchTermsLower) ||
        category.includes(searchTermsLower) ||
        specialities.some(s => s.includes(searchTermsLower))
      );
    });
    
    console.log(`Trouvé ${relevantPros.length} professionnels pertinents`);
    
    // Si aucun professionnel pertinent n'est trouvé, retourner des professionnels aléatoires
    if (relevantPros.length === 0) {
      console.log('Aucun professionnel pertinent trouvé, retour de professionnels aléatoires');
      return getRandomProfessionals(3);
    }
    
    // Limiter à 3 professionnels maximum
    return relevantPros.slice(0, 3);
  };

  // Obtenir des professionnels aléatoires
  const getRandomProfessionals = (count) => {
    // Créer une copie du tableau pour ne pas modifier l'original
    const shuffled = [...professionals];
    
    // Mélanger le tableau
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Retourner le nombre demandé de professionnels
    return shuffled.slice(0, count);
  };

  // Traiter le message de l'utilisateur et générer une réponse
  const processUserMessage = async (userText) => {
    try {
      console.log('Traitement du message utilisateur:', userText);
      
      // Vérifier si les données sont chargées
      if (!isDataLoaded) {
        setMessages(prev => [...prev, { 
          id: generateUniqueId('bot'), 
          text: "Chargement des professionnels en cours. Veuillez patienter...", 
          sender: 'bot' 
        }]);
        setIsTyping(false);
        return;
      }
      
      // Simuler un délai de réflexion pour donner l'impression que le bot réfléchit
      // Délai aléatoire entre 1 et 2 secondes
      const thinkingDelay = 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, thinkingDelay));
      
      // Vérifier si la question est hors sujet
      if (isOffTopicQuestion(userText)) {
        console.log('Question hors sujet détectée');
        const offTopicResponse = getOffTopicQuestionResponse(generateUniqueId);
        setMessages(prev => [...prev, offTopicResponse]);
        setIsTyping(false);
        return;
      }
      
      // Vérifier si la question concerne l'utilisation du site ou le MESupReS
      const isHelpQuestion = isHelpOrMESupReSQuestion(userText);
      console.log('Est-ce une question d\'aide ou sur le MESupReS:', isHelpQuestion);
    
      if (isHelpQuestion) {
        console.log('Question sur l\'utilisation du site ou sur le MESupReS détectée');
      
        // Déterminer si c'est une question sur l'utilisation du site ou sur le MESupReS
        const isMESupReSQuestion = !(/(?:comment|utiliser|naviguer|prendre|réserver|s'inscrire|modifier|annuler)/i.test(userText.toLowerCase()));
      
        if (isMESupReSQuestion) {
          // Si c'est une question sur le MESupReS, répondre sans suggérer de professionnels ni de catégories
          const mesupresResponse = getMESupReSResponse(userText, generateUniqueId);
          setMessages(prev => [...prev, mesupresResponse]);
          setIsTyping(false);
          return;
        } else {
          // Si c'est une question sur l'utilisation du site, répondre et suggérer des professionnels
          const helpResponse = getHelpResponse(userText, generateUniqueId);
          setMessages(prev => [...prev, helpResponse]);
        
          // Ajouter un petit délai avant d'afficher les professionnels
          await new Promise(resolve => setTimeout(resolve, 500));
        
          // Suggérer des professionnels après avoir répondu à la question
          const relevantPros = getRandomProfessionals(2);
          if (relevantPros.length > 0) {
            setMessages(prev => [...prev, { 
              id: generateUniqueId('bot'), 
              text: "Si vous souhaitez prendre rendez-vous, voici quelques professionnels disponibles :", 
              sender: 'bot' 
            }]);
          
            relevantPros.forEach(pro => {
              addProfessionalSuggestion(pro);
            });
          }
        }
      
        setIsTyping(false);
        return;
      }
      
      // Vérifier si l'utilisateur demande explicitement des professionnels
      const isProfessionalRequest = checkForProfessionalRequest(userText);
      console.log('Est-ce une demande de professionnel:', isProfessionalRequest);
      
      // Détecter le domaine à partir du texte de l'utilisateur
      const detectedDomain = detectDomain(userText, availableDomains);
      console.log('Domaine détecté:', detectedDomain);
      
      // Vérifier si l'utilisateur demande un domaine qui n'existe pas
      const domainRequest = detectDomainRequest(userText, availableDomains);
      if (domainRequest && !domainRequest.exists && domainRequest.domain) {
        console.log(`Domaine demandé non existant: ${domainRequest.domain}`);
        
        // Afficher un message indiquant que le domaine n'existe pas et suggérer les domaines disponibles
        setMessages(prev => [...prev, { 
          id: generateUniqueId('bot'), 
          text: `Je suis désolé, mais nous n'avons pas de professionnels dans le domaine "${domainRequest.domain}". Voici les domaines disponibles :`, 
          sender: 'bot' 
        }]);
        
        // Afficher les catégories disponibles
        setMessages(prev => [...prev, { 
          id: generateUniqueId('bot'), 
          text: "Veuillez sélectionner un domaine :", 
          sender: 'bot',
          showCategories: true,
          availableDomains: availableDomains
        }]);
        
        setIsTyping(false);
        return;
      }
      
      // Si c'est une demande générale de professionnels sans domaine spécifique
      if (isProfessionalRequest && !detectedDomain) {
        console.log('Demande générale de professionnels détectée');
        
        // Afficher un message suggérant de choisir un domaine
        setMessages(prev => [...prev, { 
          id: generateUniqueId('bot'), 
          text: "Dans quel domaine recherchez-vous un professionnel ? Voici les domaines disponibles :", 
          sender: 'bot' 
        }]);
        
        // Afficher les catégories disponibles
        setMessages(prev => [...prev, { 
          id: generateUniqueId('bot'), 
          text: "Veuillez sélectionner un domaine :", 
          sender: 'bot',
          showCategories: true,
          availableDomains: availableDomains
        }]);
        
        setIsTyping(false);
        return;
      }
      
      // Générer une réponse intelligente en fonction du contexte
      const smartResponse = generateSmartResponse(userText, generateUniqueId, availableDomains);
      
      // Ajouter le domaine détecté à la réponse
      if (detectedDomain) {
        smartResponse.domain = detectedDomain;
      }
      
      setMessages(prev => [...prev, smartResponse]);
      
      // Si c'est une demande explicite de professionnels ou si un domaine a été détecté
      if (isProfessionalRequest || smartResponse.domain) {
        // Rechercher des professionnels pertinents
        let relevantPros = [];
        
        // Si un domaine spécifique a été détecté dans la réponse, filtrer par ce domaine
        if (smartResponse.domain) {
          console.log(`Domaine détecté: ${smartResponse.domain}`);
          relevantPros = professionals.filter(pro => {
            const speciality = (pro.specialite || '').toLowerCase();
            const specialities = Array.isArray(pro.specialites) 
              ? pro.specialites.map(s => s.toLowerCase()) 
              : [];
              
            return speciality.includes(smartResponse.domain.toLowerCase()) || 
                   specialities.some(s => s.includes(smartResponse.domain.toLowerCase()));
          });
          
          // Si aucun professionnel n'est trouvé avec le domaine exact, essayer une recherche plus large
          if (relevantPros.length === 0) {
            console.log('Aucun professionnel trouvé pour le domaine exact, élargissement de la recherche');
            relevantPros = findRelevantProfessionals(smartResponse.domain);
          }
        } else {
          // Sinon, utiliser la recherche standard
          relevantPros = findRelevantProfessionals(userText);
        }
        
        console.log('Professionnels à afficher:', relevantPros);
        
        // Ajouter un petit délai avant d'afficher les professionnels
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (relevantPros.length > 0) {
          // Limiter à 3 professionnels maximum
          const limitedPros = relevantPros.slice(0, 3);
          limitedPros.forEach(pro => {
            addProfessionalSuggestion(pro);
          });
        } else {
          console.log('Aucun professionnel pertinent trouvé, suggestion des catégories disponibles');
          
          // Afficher un message indiquant qu'aucun professionnel spécifique n'a été trouvé
          setMessages(prev => [...prev, { 
            id: generateUniqueId('bot'), 
            text: "Je n'ai pas trouvé de professionnels correspondant exactement à votre demande. Voici les domaines disponibles :", 
            sender: 'bot' 
          }]);
          
          // Afficher les catégories disponibles
          setMessages(prev => [...prev, { 
            id: generateUniqueId('bot'), 
            text: "Veuillez sélectionner un domaine :", 
            sender: 'bot',
            showCategories: true,
            availableDomains: availableDomains
          }]);
        }
      } else if (!smartResponse.showCategories) {
        // Si ce n'est pas une demande de professionnels et que la réponse intelligente n'a pas déjà suggéré d'afficher les catégories
        console.log('Pas de demande spécifique détectée, mais pas de suggestion de catégories');
        // Ne rien faire de plus, juste afficher la réponse intelligente
      }
      
      // Si la réponse intelligente suggère d'afficher les catégories disponibles
      if (smartResponse.showCategories) {
        console.log('Affichage des catégories disponibles');
        
        // Ajouter un message pour présenter les catégories
        setMessages(prev => [...prev, { 
          id: generateUniqueId('bot'), 
          text: "Voici les domaines disponibles. Veuillez en sélectionner un :", 
          sender: 'bot',
          showCategories: true,
          availableDomains: availableDomains
        }]);
        
        setIsTyping(false);
        return;
      }
      
      // Rechercher des professionnels pertinents
      let relevantPros = [];
      
      // Si un domaine spécifique a été détecté dans la réponse, filtrer par ce domaine
      if (smartResponse.domain) {
        console.log(`Domaine détecté: ${smartResponse.domain}`);
        relevantPros = professionals.filter(pro => {
          const speciality = (pro.specialite || '').toLowerCase();
          const specialities = Array.isArray(pro.specialites) 
            ? pro.specialites.map(s => s.toLowerCase()) 
            : [];
            
          return speciality.includes(smartResponse.domain.toLowerCase()) || 
                 specialities.some(s => s.includes(smartResponse.domain.toLowerCase()));
        });
        
        // Si aucun professionnel n'est trouvé avec le domaine exact, essayer une recherche plus large
        if (relevantPros.length === 0) {
          console.log('Aucun professionnel trouvé pour le domaine exact, élargissement de la recherche');
          relevantPros = findRelevantProfessionals(smartResponse.domain);
        }
      } else {
        // Sinon, utiliser la recherche standard
        relevantPros = findRelevantProfessionals(userText);
      }
      
      console.log('Professionnels à afficher:', relevantPros);
      
      // Ajouter un petit délai avant d'afficher les professionnels
      // pour donner l'impression d'une conversation plus naturelle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (relevantPros.length > 0) {
        // Limiter à 3 professionnels maximum
        const limitedPros = relevantPros.slice(0, 3);
        limitedPros.forEach(pro => {
          addProfessionalSuggestion(pro);
        });
      } else if (isProfessionalRequest || smartResponse.domain) {
        console.log('Aucun professionnel pertinent trouvé, suggestion des catégories disponibles');
        
        // Afficher un message indiquant qu'aucun professionnel spécifique n'a été trouvé
        setMessages(prev => [...prev, { 
          id: generateUniqueId('bot'), 
          text: "Je n'ai pas trouvé de professionnels correspondant exactement à votre demande. Voici les domaines disponibles :", 
          sender: 'bot' 
        }]);
        
        // Afficher les catégories disponibles
        setMessages(prev => [...prev, { 
          id: generateUniqueId('bot'), 
          text: "Veuillez sélectionner un domaine :", 
          sender: 'bot',
          showCategories: true,
          availableDomains: availableDomains
        }]);
      }
    } catch (error) {
      console.error('Erreur lors du traitement du message:', error);
      setMessages(prev => [...prev, { 
        id: generateUniqueId('bot'), 
        text: "Désolé, une erreur s'est produite. Veuillez réessayer.", 
        sender: 'bot' 
      }]);
      
      // Suggérer les catégories disponibles en cas d'erreur
      setMessages(prev => [...prev, { 
        id: generateUniqueId('bot'), 
        text: "Voici les domaines disponibles. Veuillez en sélectionner un :", 
        sender: 'bot',
        showCategories: true,
        availableDomains: availableDomains
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Ajouter une suggestion de professionnel
  const addProfessionalSuggestion = (pro) => {
    console.log('Ajout d\'une suggestion de professionnel:', pro);
    if (!pro) {
      console.error('Tentative d\'ajout d\'un professionnel null ou undefined');
      return;
    }
    
    const proName = `${pro.prenom || ''} ${pro.nom || ''}`.trim();
    const proSpeciality = pro.specialite || '';
    const proMessage = {
      id: generateUniqueId('pro'),
      professional: pro,
      text: `${proName}${proSpeciality ? ` - ${proSpeciality}` : ''}`,
      sender: 'suggestion'
    };
    console.log('Message de suggestion créé:', proMessage);
    setMessages(prev => [...prev, proMessage]);
  };

  // Gérer la sélection d'un domaine - version corrigée
  const handleDomainSelection = (domain) => {
    console.log('Domaine sélectionné:', domain);
    
    try {
      // Stocker la catégorie sélectionnée dans localStorage
      // IMPORTANT: Stocker la valeur directe, pas dans un objet
      localStorage.setItem('selectedBookingSpecialty', domain);
      console.log('Domaine stocké dans localStorage:', domain);
      
      // Émettre un événement de stockage personnalisé pour forcer la mise à jour
      window.dispatchEvent(new Event('localStorageChange'));
      
      // Fermer le chat
      setIsOpen(false);
      
      // Redirection vers l'étape 1 (au lieu de l'étape 2)
      // Ne pas ajouter de paramètre step pour que le composant utilise l'étape par défaut (1)
      window.location.href = `/user/book-appointment?specialty=${encodeURIComponent(domain)}`;
    } catch (error) {
      console.error('Erreur lors de la navigation vers la page de réservation:', error);
    }
  };
  
  // Gérer le clic sur le bouton "Voir tous les professionnels"
  const handleViewAllProfessionals = (domain) => {
    console.log('Navigation vers tous les professionnels du domaine:', domain);
    
    try {
      // Stocker la catégorie sélectionnée dans localStorage au format attendu par BookAppointment
      // IMPORTANT: Stocker la valeur directe, pas dans un objet
      localStorage.setItem('selectedBookingSpecialty', domain);
      
      // Émettre un événement de stockage personnalisé pour forcer la mise à jour
      window.dispatchEvent(new Event('localStorageChange'));
      
      // Fermer le chat avant la navigation
      setIsOpen(false);
      
      // Redirection directe
      window.location.href = `/user/book-appointment?specialty=${encodeURIComponent(domain)}`;
    } catch (error) {
      console.error('Erreur lors de la navigation vers la page de réservation:', error);
    }
  };

  // Gérer le clic sur un professionnel suggéré
  const handleProfessionalClick = (professional) => {
    console.log('Professionnel cliqué:', professional);
    
    if (professional) {
      try {
        // S'assurer que le professionnel a un ID valide
        const proId = professional._id || professional.id;
        if (!proId) {
          console.error('Professionnel sans ID valide:', professional);
          return;
        }
        
        // Stocker les données du professionnel dans localStorage
        localStorage.setItem('selectedBookingProfessional', JSON.stringify(professional));
        console.log('Données du professionnel stockées dans localStorage:', professional);
        
        // Si le professionnel a des spécialités, stocker également la première spécialité
        if (professional.specialites && professional.specialites.length > 0) {
          localStorage.setItem('selectedBookingSpecialty', professional.specialites[0]);
        }
        
        // Émettre un événement de stockage personnalisé pour forcer la mise à jour
        window.dispatchEvent(new Event('localStorageChange'));
        
        // Fermer le chat avant la navigation
        setIsOpen(false);
        
        // Utiliser la fonction utilitaire pour naviguer de manière fiable
        const url = `/user/book-appointment?professionalId=${proId}&step=2`;
        navigateToUrl(url);
      } catch (error) {
        console.error('Erreur lors de la sélection du professionnel:', error);
      }
    }
  };

  // Rendu du composant
  return (
    <div className="smart-chat-container">
      <button 
        className={`chat-toggle-button ${isOpen ? 'open' : ''} ${hasNewMessage ? 'has-new-message' : ''}`} 
        onClick={toggleChat}
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {isOpen ? (
          <span className="close-icon">&times;</span>
        ) : (
          <span className="chat-icon">
            <i className="fas fa-comments"></i>
            {hasNewMessage && <div className="new-message-notification">1</div>}
          </span>
        )}
      </button>
      
      <div 
        ref={chatWindowRef}
        className={`chat-window ${isOpen ? 'open' : ''}`}
      >
        <div className="chat-header">
          <h3>Assistant MESupReS</h3>
          <button 
            className="close-button" 
            onClick={toggleChat}
            aria-label="Fermer le chat"
          >
            &times;
          </button>
        </div>
        
        <div className="chat-messages">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`message ${message.sender === 'user' ? 'user-message' : 
                message.sender === 'bot' ? 'bot-message' : 
                'suggestion-message'}`}
              onClick={() => message.sender === 'suggestion' && message.professional && handleProfessionalClick(message.professional)}
              style={message.sender === 'suggestion' ? { cursor: 'pointer', position: 'relative' } : {}}
              aria-label={message.sender === 'suggestion' ? "Cliquez pour prendre rendez-vous avec ce professionnel" : undefined}
            >
              {message.sender === 'suggestion' && (
                <i className="fas fa-user-md suggestion-icon"></i>
              )}
              {message.text}
              {message.sender === 'suggestion' && (
                <span className="book-appointment-hint"> (Cliquez pour prendre rendez-vous)</span>
              )}
              
              {/* Afficher les catégories disponibles si nécessaire */}
              {message.showCategories && message.availableDomains && message.availableDomains.length > 0 && (
                <div className="categories-list">
                  {message.availableDomains.map((domain, index) => (
                    <button 
                      key={domain} 
                      className="category-button"
                      onClick={() => handleDomainSelection(domain)}
                      style={{"--index": index}}
                      aria-label={`Sélectionner le domaine ${domain}`}
                    >
                      <i className="fas fa-graduation-cap" style={{marginRight: '5px'}}></i>
                      {domain}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Afficher le bouton "Voir tous les professionnels" si nécessaire */}
              {message.showViewAllButton && message.domain && (
                <div className="view-all-button-container">
                  <button 
                    className="view-all-button"
                    onClick={() => handleViewAllProfessionals(message.domain)}
                    aria-label={`Voir tous les professionnels en ${message.domain}`}
                  >
                    <i className="fas fa-users" style={{marginRight: '8px'}}></i>
                    Voir tous les professionnels en {message.domain}
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="typing-indicator">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Posez votre question..."
            ref={inputRef}
            aria-label="Votre message"
          />
          <button 
            type="submit" 
            disabled={!inputValue.trim() || isTyping}
            aria-label="Envoyer"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default SmartChat;
