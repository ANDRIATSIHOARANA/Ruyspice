
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/api';
import './SmartSearch.css';

const SmartSearch = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [realCategories, setRealCategories] = useState([]); // Stocke les catégories réelles de la base de données
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const API_KEY = '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'; // Même clé API que le chat
  const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  // Fonction pour fermer la barre de recherche et retourner au dashboard
  const handleCloseSearch = () => {
    console.log('Fermeture de la barre de recherche');
    window.location.href = '/user/dashboard'; // Alternative à navigate
  };

  // Obtenir une icône pour une catégorie
  const getCategoryIcon = (category) => {
    const categoryLower = category.toLowerCase();
    
    // Icônes génériques pour différentes catégories de services
    if (categoryLower.includes('général') || categoryLower.includes('general')) return '👤';
    if (categoryLower.includes('dent')) return '😁';
    if (categoryLower.includes('ophtalmo') || categoryLower.includes('yeux') || categoryLower.includes('oeil')) return '👁️';
    if (categoryLower.includes('pédiatr') || categoryLower.includes('enfant')) return '👶';
    if (categoryLower.includes('gynéco') || categoryLower.includes('gyneco')) return '👩';
    if (categoryLower.includes('dermat') || categoryLower.includes('peau')) return '🧴';
    if (categoryLower.includes('cardio') || categoryLower.includes('coeur')) return '❤️';
    if (categoryLower.includes('ortho') || categoryLower.includes('os')) return '🦴';
    if (categoryLower.includes('psycho') || categoryLower.includes('mental')) return '🧠';
    if (categoryLower.includes('nutri') || categoryLower.includes('diet')) return '🥗';
    if (categoryLower.includes('radio') || categoryLower.includes('image')) return '📷';
    if (categoryLower.includes('chirurg')) return '✂️';
    if (categoryLower.includes('neuro')) return '🧠';
    if (categoryLower.includes('allergo')) return '🤧';
    if (categoryLower.includes('uro')) return '💧';
    if (categoryLower.includes('massage')) return '💆';
    if (categoryLower.includes('coiffure') || categoryLower.includes('cheveux')) return '💇';
    if (categoryLower.includes('beauté') || categoryLower.includes('esthétique')) return '💅';
    if (categoryLower.includes('sport') || categoryLower.includes('fitness')) return '🏋️';
    if (categoryLower.includes('yoga')) return '🧘';
    if (categoryLower.includes('conseil') || categoryLower.includes('coaching')) return '💬';
    
    // Icône par défaut
    return '📅';
  };

  // Extraire les catégories réelles à partir des professionnels
  const extractCategories = useCallback((professionals) => {
    const specialtiesSet = new Set();
    
    professionals.forEach(pro => {
      if (pro.specialites && Array.isArray(pro.specialites)) {
        pro.specialites.forEach(specialite => {
          specialtiesSet.add(specialite);
        });
      }
    });
    
    const extractedCategories = Array.from(specialtiesSet).map(specialite => ({
      id: specialite.toLowerCase().replace(/\s+/g, '-'),
      name: specialite,
      icon: getCategoryIcon(specialite)
    }));
    
    setRealCategories(extractedCategories); // Stocker les catégories réelles
    setCategories(extractedCategories); // Utiliser ces catégories par défaut
  }, []);

  // Charger tous les professionnels au chargement du composant
  // et vérifier les paramètres d'URL
  useEffect(() => {
    const fetchAllProfessionals = async () => {
      try {
        const response = await userService.getAllProfessionals();
        const professionalsData = response.data && Array.isArray(response.data) 
          ? response.data 
          : (response.data && response.data.success && Array.isArray(response.data.data) 
            ? response.data.data 
            : []);
        
        setProfessionals(professionalsData);
        extractCategories(professionalsData);
        
        // Vérifier les paramètres d'URL
        const urlParams = new URLSearchParams(window.location.search);
        const selectedProfessionalId = urlParams.get('selectedProfessionalId');
        const specialty = urlParams.get('specialty');
        
        // Si un ID de professionnel est présent dans l'URL
        if (selectedProfessionalId) {
          const selectedPro = professionalsData.find(pro => pro._id === selectedProfessionalId);
          if (selectedPro) {
            // Stocker dans localStorage avec timestamp pour forcer la mise à jour
            const data = {
              professional: selectedPro,
              timestamp: new Date().getTime()
            };
            localStorage.setItem('selectedBookingProfessional', JSON.stringify(data));
            
            // Émettre un événement de stockage personnalisé
            window.dispatchEvent(new Event('localStorageChange'));
            
            // Faire défiler vers la section de réservation
            setTimeout(() => {
              const bookingSection = document.getElementById('booking-section');
              if (bookingSection) {
                bookingSection.scrollIntoView({ behavior: 'smooth' });
              }
            }, 300);
          }
        } 
        // Si seulement une spécialité est présente dans l'URL
        else if (specialty) {
          setSearchQuery(specialty);
          
          // Faire défiler vers la section de réservation
          setTimeout(() => {
            const bookingWorkflow = document.querySelector('.booking-workflow');
            if (bookingWorkflow) {
              bookingWorkflow.scrollIntoView({ behavior: 'smooth' });
            }
          }, 300);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des professionnels:', error);
      }
    };

    fetchAllProfessionals();
  }, [extractCategories]);

  // Fermer les suggestions lorsqu'on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSearchFocus(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Ne pas afficher automatiquement les catégories lorsque l'input est en focus
  useEffect(() => {
    if (searchFocus && !searchQuery.trim()) {
      // Garder les suggestions ouvertes mais sans afficher les catégories immédiatement
      setShowSuggestions(true);
      setShowCategories(false);
    }
  }, [searchFocus, searchQuery, realCategories]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      setShowSuggestions(true);
      setIsSearching(true);
      
      // Utiliser un debounce pour éviter trop d'appels API
      const timeoutId = setTimeout(() => {
        generateSuggestions(query);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      // Si la recherche est vide mais en focus, ne pas montrer les catégories immédiatement
      if (searchFocus) {
        setShowCategories(false); // Ne pas afficher les catégories pendant la saisie
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
        setShowCategories(false);
      }
      setIsSearching(false);
    }
  };

  // Fonction pour calculer la pertinence d'un professionnel par rapport à une requête
  const calculateRelevance = (professional, query) => {
    const queryLower = query.toLowerCase();
    let score = 0;
    
    // Vérifier le nom et prénom
    if (professional.nom?.toLowerCase().includes(queryLower)) {
      score += 10;
    }
    if (professional.prenom?.toLowerCase().includes(queryLower)) {
      score += 10;
    }
    
    // Vérifier les spécialités
    if (professional.specialites) {
      for (const specialite of professional.specialites) {
        if (specialite.toLowerCase().includes(queryLower)) {
          score += 15;
        } else if (queryLower.includes(specialite.toLowerCase())) {
          score += 8;
        }
      }
    }
    
    // Vérifier la ville ou l'adresse si disponible
    if (professional.ville?.toLowerCase().includes(queryLower)) {
      score += 5;
    }
    if (professional.adresse?.toLowerCase().includes(queryLower)) {
      score += 3;
    }
    
    // Vérifier si des mots-clés généraux sont présents dans la requête
    const serviceKeywords = [
      'service', 'prestation', 'consultation', 'rendez-vous', 'rdv',
      'spécialiste', 'professionnel', 'expert', 'réservation', 'disponible',
      'horaire', 'tarif', 'prix', 'séance', 'conseil'
    ];
    
    for (const keyword of serviceKeywords) {
      if (queryLower.includes(keyword)) {
        score += 2; // Bonus pour les requêtes liées aux services
      }
    }
    
    return score;
  };

  // Fonction pour trouver les catégories pertinentes uniquement parmi les catégories réelles
  const findRelevantCategories = (query) => {
    const queryLower = query.toLowerCase();
    
    // Filtrer les catégories réelles qui correspondent à la requête
    const relevantCategories = realCategories.filter(category => 
      category.name.toLowerCase().includes(queryLower) || 
      queryLower.includes(category.name.toLowerCase())
    );
    
    // Si nous avons des catégories pertinentes, les utiliser
    if (relevantCategories.length > 0) {
      return relevantCategories.slice(0, 5); // Limiter à 5 catégories
    }
    
    // Si aucune catégorie ne correspond, retourner quelques catégories réelles
    // pour toujours avoir quelque chose à afficher
    return realCategories.slice(0, 5); // Retourner les 5 premières catégories réelles
  };

  // Fonction pour trouver des professionnels similaires (fallback)
  const findSimilarProfessionals = (query) => {
    // Si la requête est trop courte, retourner des professionnels aléatoires
    if (query.length < 3) {
      return professionals
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);
    }
    
    // Sinon, essayer de trouver des professionnels avec un score minimum
    const scoredProfessionals = professionals.map(pro => ({
      professional: pro,
      score: calculateRelevance(pro, query)
    }));
    
    // Trier par score
    scoredProfessionals.sort((a, b) => b.score - a.score);
    
    // Prendre les 5 meilleurs, même avec un score faible
    return scoredProfessionals
      .slice(0, 5)
      .map(item => item.professional);
  };

  const generateSuggestions = async (query) => {
    try {
      // Si nous n'avons pas de professionnels, ne rien faire
      if (!professionals || professionals.length === 0) {
        setIsSearching(false);
        setSuggestions([]);
        setShowCategories(false);
        return;
      }
      
      // Calculer la pertinence de chaque professionnel
      const scoredProfessionals = professionals.map(pro => ({
        professional: pro,
        score: calculateRelevance(pro, query)
      }));
      
      // Trier par score de pertinence (du plus élevé au plus bas)
      scoredProfessionals.sort((a, b) => b.score - a.score);
      
      // Prendre les 5 meilleurs résultats avec un score minimum
      const relevantProfessionals = scoredProfessionals
        .filter(item => item.score > 0)
        .slice(0, 5)
        .map(item => item.professional);
      
      // Si nous avons des résultats pertinents, les utiliser
      if (relevantProfessionals.length > 0) {
        setSuggestions(relevantProfessionals);
        setShowCategories(false);
        setIsSearching(false);
        return;
      }
      
      // Ne pas afficher automatiquement les catégories pendant la saisie
      // Seulement lors de la soumission du formulaire ou lorsque l'utilisateur a terminé sa recherche
      
      // Si aucun résultat pertinent localement, utiliser l'API pour des suggestions intelligentes
      const context = `
        Tu es un assistant de recherche pour un site de réservation de rendez-vous avec des professionnels.
        L'utilisateur recherche: "${query}"
        
        Voici la liste des professionnels disponibles sur le site:
        ${professionals.map(pro => `- ID: ${pro._id}, Nom: ${pro.prenom} ${pro.nom}, Spécialités: ${pro.specialites?.join(', ') || 'Généraliste'}`).join('\n')}
        
        Voici les catégories réellement disponibles dans notre base de données:
        ${realCategories.map(cat => `- ${cat.name}`).join('\n')}
        
        Retourne-moi un objet JSON avec une propriété "ids" contenant un tableau des IDs des 5 professionnels les plus pertinents pour cette recherche.
        Exemple: {"ids": ["id1", "id2", "id3", "id4", "id5"]}
        
        Analyse la requête et trouve les professionnels qui correspondent le mieux aux besoins exprimés.
        Si la requête mentionne une spécialité, un service, ou un type de prestation, trouve les professionnels avec les spécialités correspondantes.
        
        Si tu ne trouves pas de professionnels pertinents, ajoute une propriété "categories" avec un tableau de spécialités qui pourraient être pertinentes.
        IMPORTANT: Pour "categories", utilise UNIQUEMENT les catégories qui existent réellement dans notre base de données (listées ci-dessus).
        Exemple: {"ids": [], "categories": ["Coiffure", "Esthétique"]}
        
        IMPORTANT: Ne retourne JAMAIS un tableau vide pour "ids" ET "categories". Si tu ne trouves rien de pertinent, suggère au moins des catégories existantes ou des professionnels généralistes.
      `;
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Assistant Recherche RDV'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku',
          messages: [
            { role: 'system', content: context },
            { role: 'user', content: `Recherche: ${query}` }
          ],
          max_tokens: 200,
          temperature: 0.3,
          response_format: { type: "json_object" }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Essayer de parser la réponse JSON
      try {
        const parsedResponse = JSON.parse(aiResponse);
        const suggestedIds = parsedResponse.ids || [];
        
        // Filtrer les professionnels correspondant aux IDs suggérés
        const suggestedProfessionals = professionals.filter(pro => 
          suggestedIds.includes(pro._id)
        );
        
        // Si l'API a retourné des professionnels pertinents, les afficher
        if (suggestedProfessionals.length > 0) {
          setSuggestions(suggestedProfessionals);
          setShowCategories(false);
        } 
        // Sinon, vérifier s'il y a des catégories suggérées
        else if (parsedResponse.categories && parsedResponse.categories.length > 0) {
          // Filtrer pour ne garder que les catégories qui existent réellement
          const existingCategoryNames = realCategories.map(cat => cat.name.toLowerCase());
          
          const validCategories = parsedResponse.categories.filter(cat => 
            existingCategoryNames.includes(cat.toLowerCase())
          );
          
          // Si des catégories valides ont été trouvées
          if (validCategories.length > 0) {
            const aiCategories = validCategories.map(cat => {
              // Trouver la catégorie réelle correspondante pour obtenir l'ID et l'icône corrects
              const realCat = realCategories.find(
                rc => rc.name.toLowerCase() === cat.toLowerCase()
              ) || {
                id: cat.toLowerCase().replace(/\s+/g, '-'),
                name: cat,
                icon: getCategoryIcon(cat)
              };
              
              return realCat;
            });
            
            setCategories(aiCategories);
            setShowCategories(true);
            setSuggestions([]);
          } 
          // Si aucune catégorie valide, utiliser quelques catégories réelles
          else {
            setCategories(realCategories.slice(0, 5));
            setShowCategories(true);
            setSuggestions([]);
          }
        }
        // Si aucune suggestion, trouver des professionnels similaires ou aléatoires
        else {
          const fallbackProfessionals = findSimilarProfessionals(query);
          setSuggestions(fallbackProfessionals);
          setShowCategories(false);
        }
      } catch (error) {
        console.error('Erreur lors du parsing de la réponse:', error);
        // En cas d'erreur, trouver des professionnels similaires ou aléatoires
        const fallbackProfessionals = findSimilarProfessionals(query);
        setSuggestions(fallbackProfessionals);
        setShowCategories(false);
      }
    } catch (error) {
      console.error('Erreur lors de la génération des suggestions:', error);
      // En cas d'erreur, trouver des professionnels similaires ou aléatoires
      const fallbackProfessionals = findSimilarProfessionals(query);
      setSuggestions(fallbackProfessionals);
      setShowCategories(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log('Recherche soumise:', searchQuery);
    
    if (searchQuery.trim()) {
      // L'utilisateur a terminé sa recherche, maintenant on peut afficher les catégories si nécessaire
      setIsSearching(true);
      generateSuggestions(searchQuery).then(() => {
        // Si nous n'avons pas trouvé de professionnels mais que nous avons des catégories pertinentes
        if (suggestions.length === 0 && !showCategories) {
          // Chercher des catégories pertinentes
          const relevantCategories = findRelevantCategories(searchQuery);
          if (relevantCategories.length > 0) {
            setCategories(relevantCategories);
            setShowCategories(true);
          }
        }
        
        // Si nous avons des suggestions, utiliser la première suggestion
        if (suggestions.length > 0) {
          handleProfessionalClick(suggestions[0]);
        } else if (showCategories && categories.length > 0) {
          // Si nous avons des catégories, utiliser la première catégorie
          handleCategoryClick(categories[0].name);
        }
        
        setIsSearching(false);
      }).catch(error => {
        console.error('Erreur lors de la génération des suggestions:', error);
        setIsSearching(false);
      });
    }
  };

  const handleCategoryClick = (categoryName) => {
    // Mettre à jour la recherche avec la catégorie sélectionnée
    setSearchQuery(categoryName);
    // Fermer les suggestions
    setShowSuggestions(false);
    
    try {
      // Stocker la catégorie sélectionnée dans localStorage au format attendu par BookAppointment
      localStorage.setItem('selectedBookingSpecialty', categoryName);
      
      // Émettre un événement de stockage personnalisé
      window.dispatchEvent(new Event('localStorageChange'));
      
      // Utiliser window.location.href pour forcer un rechargement complet de la page
      // Ne pas ajouter step=2 pour les catégories car l'utilisateur doit d'abord choisir un professionnel
      window.location.href = `/user/book-appointment?specialty=${encodeURIComponent(categoryName)}`;
    } catch (error) {
      console.error('Erreur lors de la navigation:', error);
    }
  };

  // Fonction pour gérer le clic sur un professionnel
  const handleProfessionalClick = (professional) => {
    // Fermer les suggestions
    setShowSuggestions(false);
    console.log('Professionnel sélectionné:', professional);
    
    try {
      // S'assurer que le professionnel a un ID valide
      if (!professional || !professional._id) {
        console.error('Professionnel invalide:', professional);
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
      
      // Utiliser window.location.href pour forcer un rechargement complet de la page
      // Ne pas ajouter de paramètre step pour que le composant utilise l'étape par défaut (1)
      window.location.href = `/user/book-appointment?professionalId=${professional._id}`;
    } catch (error) {
      console.error('Erreur lors de la sélection du professionnel:', error);
    }
  };

  // Fonction pour gérer le focus sur l'input
  const handleInputFocus = () => {
    setSearchFocus(true);
    // Ne pas afficher les catégories immédiatement lors du focus
    setShowCategories(false);
    setShowSuggestions(true);
  };

  // Fonction pour gérer la perte de focus sur l'input
  const handleInputBlur = () => {
    // Attendre un peu avant de masquer les suggestions pour permettre les clics
    setTimeout(() => {
      setSearchFocus(false);
      if (!searchQuery.trim()) {
        setShowSuggestions(false);
        setShowCategories(false);
      }
    }, 200);
  };

  // Générer des placeholders dynamiques pour l'input
  const placeholders = [
    "Rechercher un professionnel...",
    "Besoin d'un service spécifique ?",
    "Trouver un spécialiste pour vos besoins...",
    "Coiffure, massage, coaching...",
    "Rechercher par nom ou par spécialité...",
    "Trouvez le professionnel idéal..."
  ];
  
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  // Changer le placeholder périodiquement
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prevIndex) => (prevIndex + 1) % placeholders.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="smart-search-container" ref={searchRef}>
      {/* Bouton de fermeture repositionné en haut de la barre de recherche */}
      <button 
        type="button" 
        className="close-search-button"
        onClick={handleCloseSearch}
        aria-label="Fermer la recherche"
      >
        ✕
      </button>
      
      <form onSubmit={handleSearchSubmit} className="search-form">
        <div className={`search-input-container ${searchFocus ? 'focused' : ''}`}>
          <span className="search-icon-prefix" role="img" aria-label="Rechercher">
            🔍
          </span>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={placeholders[placeholderIndex]}
            className="search-input"
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          {searchQuery && (
            <button 
              type="button" 
              className="clear-search-button"
              onClick={() => {
                setSearchQuery('');
                inputRef.current.focus();
              }}
            >
              ✕
            </button>
          )}
        </div>
        <button type="submit" className="search-button">
          Rechercher
        </button>
      </form>
      
      {showSuggestions && (
        <div className="search-suggestions">
          {isSearching ? (
            <div className="searching-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              <h4 className="suggestions-title">Professionnels suggérés</h4>
              <ul className="suggestions-list">
                {suggestions.map(professional => (
                  <li key={professional._id} className="suggestion-item">
                    <button 
                      className="suggestion-link"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleProfessionalClick(professional);
                      }}
                      type="button"
                      aria-label={`Réserver un rendez-vous avec ${professional.prenom} ${professional.nom}`}
                    >
                      <div className="suggestion-avatar">
                        {professional.photo ? (
                          <img 
                            src={professional.photo.startsWith('http') ? professional.photo : `/api/uploads/photos/${professional.photo}`} 
                            alt={`${professional.prenom} ${professional.nom}`} 
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {professional.prenom?.charAt(0)}{professional.nom?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="suggestion-info">
                        <span className="suggestion-name">{professional.prenom} {professional.nom}</span>
                        {professional.specialites && professional.specialites.length > 0 && (
                          <span className="suggestion-specialties">
                            {professional.specialites.join(', ')}
                          </span>
                        )}
                        {professional.ville && (
                          <span className="suggestion-location">
                            <span role="img" aria-label="Localisation">📍</span> {professional.ville}
                          </span>
                        )}
                      </div>
                      <div className="view-profile-button">
                        <span>Réserver</span>
                        <span className="arrow-icon">→</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : showCategories && categories.length > 0 ? (
            <>
              <h4 className="suggestions-title">Catégories disponibles</h4>
              <ul className="categories-list">
                {categories.map(category => (
                  <li key={category.id} className="category-item">
                    <button 
                      className="category-button"
                      onClick={() => handleCategoryClick(category.name)}
                      type="button"
                    >
                      <span className="category-icon" role="img" aria-label={category.name}>
                        {category.icon}
                      </span>
                      <span className="category-name">{category.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="search-tip">
                <span role="img" aria-label="Astuce" className="tip-icon">💡</span>
                <span>Essayez de rechercher par nom ou par catégorie</span>
              </div>
            </>
          ) : suggestions.length > 0 ? (
            <>
              <h4 className="suggestions-title">Professionnels suggérés</h4>
              <ul className="suggestions-list">
                {suggestions.map(professional => (
                  <li key={professional._id} className="suggestion-item">
                    <button 
                      className="suggestion-link"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleProfessionalClick(professional);
                      }}
                      type="button"
                      aria-label={`Réserver un rendez-vous avec ${professional.prenom} ${professional.nom}`}
                    >
                      <div className="suggestion-avatar">
                        {professional.photo ? (
                          <img 
                            src={professional.photo.startsWith('http') ? professional.photo : `/api/uploads/photos/${professional.photo}`} 
                            alt={`${professional.prenom} ${professional.nom}`} 
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {professional.prenom?.charAt(0)}{professional.nom?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="suggestion-info">
                        <span className="suggestion-name">{professional.prenom} {professional.nom}</span>
                        {professional.specialites && professional.specialites.length > 0 && (
                          <span className="suggestion-specialties">
                            {professional.specialites.join(', ')}
                          </span>
                        )}
                        {professional.ville && (
                          <span className="suggestion-location">
                            <span role="img" aria-label="Localisation">📍</span> {professional.ville}
                          </span>
                        )}
                      </div>
                      <div className="view-profile-button">
                        <span>Réserver</span>
                        <span className="arrow-icon">→</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="no-suggestions">
              <p>Consultez les spécialités de nos professionnels en attendant.</p>
              <ul className="categories-list">
                {realCategories.slice(0, 5).map(category => (
                  <li key={category.id} className="category-item">
                    <button 
                      className="category-button"
                      onClick={() => handleCategoryClick(category.name)}
                      type="button"
                    >
                      <span className="category-icon" role="img" aria-label={category.name}>
                        {category.icon}
                      </span>
                      <span className="category-name">{category.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
