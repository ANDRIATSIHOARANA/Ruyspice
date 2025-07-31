import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { userService } from '../../services/api';
import Toast from '../../components/common/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUserMd, 
  FaCalendarAlt, 
  FaClipboardList, 
  FaArrowRight, 
  FaArrowLeft, 
  FaCheckCircle,
  FaSearch,
  FaClock,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaStar
} from 'react-icons/fa';
import './BookAppointment.css';

const BookAppointment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = useContext(AuthContext);
  const [professionals, setProfessionals] = useState([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState([]);
  const [selectedPro, setSelectedPro] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [motif, setMotif] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [specialties, setSpecialties] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  // Fonction pour naviguer vers le tableau de bord
  const navigateToDashboard = () => {
    navigate('/user/dashboard');
  };
  
  // URL de base de l'API
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  // Charger les professionnels une seule fois au chargement du composant
  useEffect(() => {
    const loadProfessionals = async () => {
      if (!auth?.isAuthenticated) {
        navigate('/login');
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await userService.getProfessionals();
        
        // Vérifier que la réponse contient bien un tableau de professionnels
        let professionalsData = [];
        
        if (response && response.data) {
          // Si response.data est un tableau, l'utiliser directement
          if (Array.isArray(response.data)) {
            professionalsData = response.data;
          } 
          // Si response.data a une propriété data qui est un tableau, l'utiliser
          else if (response.data.data && Array.isArray(response.data.data)) {
            professionalsData = response.data.data;
          }
        }
        
        console.log('Professionnels chargés:', professionalsData);
        console.log('Structure de la réponse API:', JSON.stringify(response, null, 2));
        
        // Vérifier la structure des données de chaque professionnel
        professionalsData.forEach((pro, index) => {
          console.log(`Professionnel ${index} - ID: ${pro._id}, Nom: ${pro.nom}, Prénom: ${pro.prenom}`);
          console.log(`Spécialités: ${JSON.stringify(pro.specialites)}`);
          
          // Vérifier les différentes propriétés qui pourraient contenir des spécialités
          if (pro.specialite) console.log(`Propriété 'specialite': ${pro.specialite}`);
          if (pro.domain) console.log(`Propriété 'domain': ${pro.domain}`);
        });
        
        setProfessionals(professionalsData);
        setFilteredProfessionals(professionalsData);
        
        // Extract unique specialties avec plus de vérifications
        const allSpecialtiesSet = new Set();
        professionalsData.forEach(pro => {
          if (pro.specialites && Array.isArray(pro.specialites)) {
            pro.specialites.forEach(s => allSpecialtiesSet.add(s));
          } else if (pro.specialite) {
            allSpecialtiesSet.add(pro.specialite);
          } else if (pro.domain) {
            allSpecialtiesSet.add(pro.domain);
          }
        });
        
        const allSpecialties = Array.from(allSpecialtiesSet);
        console.log('Toutes les spécialités disponibles:', allSpecialties);
        
        setSpecialties(allSpecialties);
        
        if (professionalsData.length === 0) {
          setError('Aucun professionnel disponible pour le moment');
        }
        
        // Marquer les données comme chargées
        setDataLoaded(true);
      } catch (err) {
        console.error('Erreur lors du chargement des professionnels:', err);
        setError('Erreur lors du chargement des professionnels');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfessionals();
  }, [auth, navigate]);

  // Filtrer les professionnels en fonction des critères de recherche
  useEffect(() => {
    // Ne filtrer que si les professionnels sont chargés
    if (professionals && Array.isArray(professionals)) {
      console.log('Filtrage des professionnels - Terme de recherche:', searchTerm);
      console.log('Filtrage des professionnels - Filtre de spécialité:', specialtyFilter);
      
      const filtered = professionals.filter(pro => {
        const fullName = `${pro.nom} ${pro.prenom}`.toLowerCase();
        const matchesSearch = searchTerm === '' || fullName.includes(searchTerm.toLowerCase());
        
        // Vérifier différentes propriétés pour les spécialités
        let matchesSpecialty = specialtyFilter === '';
        
        if (specialtyFilter !== '') {
          if (pro.specialites && Array.isArray(pro.specialites)) {
            matchesSpecialty = pro.specialites.includes(specialtyFilter);
          } else if (pro.specialite) {
            matchesSpecialty = pro.specialite === specialtyFilter;
          } else if (pro.domain) {
            matchesSpecialty = pro.domain === specialtyFilter;
          }
        }
        
        const isMatch = matchesSearch && matchesSpecialty;
        
        // Log détaillé pour chaque professionnel
        if (specialtyFilter !== '') {
          console.log(`Professionnel ${pro._id} (${pro.nom} ${pro.prenom}): matchesSearch=${matchesSearch}, matchesSpecialty=${matchesSpecialty}, isMatch=${isMatch}`);
          console.log(`  Spécialités disponibles:`, pro.specialites || pro.specialite || pro.domain || 'aucune');
        }
        
        return isMatch;
      });
      
      console.log(`Résultat du filtrage: ${filtered.length} professionnels sur ${professionals.length} correspondent aux critères`);
      setFilteredProfessionals(filtered);
    } else {
      // Si professionals n'est pas un tableau, initialiser filteredProfessionals comme un tableau vide
      setFilteredProfessionals([]);
      if (dataLoaded) {
        console.error('La variable professionals n\'est pas un tableau valide:', professionals);
      }
    }
  }, [searchTerm, specialtyFilter, professionals, dataLoaded]);

  // Gérer les paramètres d'URL et localStorage une fois que les professionnels sont chargés
  useEffect(() => {
    // Ne traiter les paramètres que si les professionnels sont chargés
    if (!dataLoaded || !Array.isArray(professionals) || professionals.length === 0) {
      console.log('Paramètres d\'URL non traités: données non chargées ou professionnels non disponibles');
      return;
    }
    
    console.log('Traitement des paramètres d\'URL et localStorage...');
    
    // Récupérer les paramètres d'URL
    const urlParams = new URLSearchParams(window.location.search);
    const professionalId = urlParams.get('professionalId');
    const specialty = urlParams.get('specialty');
    const step = urlParams.get('step');
    
    console.log('Paramètres d\'URL détectés:', { professionalId, specialty, step });
    
    // Si nous avons un ID de professionnel dans l'URL
    if (professionalId) {
      const selectedProfessional = professionals.find(p => p._id === professionalId);
      if (selectedProfessional) {
        console.log('Professionnel trouvé via URL:', selectedProfessional);
        setSelectedPro(selectedProfessional);
        
        // Si un paramètre step est spécifié, l'utiliser, sinon aller à l'étape 2
        const targetStep = step ? parseInt(step) : 2;
        setCurrentStep(targetStep);
        
        // Si le professionnel a des spécialités, définir la première comme filtre
        if (selectedProfessional.specialites && selectedProfessional.specialites.length > 0) {
          setSpecialtyFilter(selectedProfessional.specialites[0]);
        }
        return; // Sortir pour éviter de traiter les autres sources
      }
    } 
    // Si nous avons une spécialité dans l'URL
    else if (specialty) {
      console.log('Spécialité trouvée via URL:', specialty);
      setSpecialtyFilter(specialty);
      
      // Filtrer les professionnels par cette catégorie
      const filteredPros = filterProfessionalsByCategory(professionals, specialty);
      console.log('Professionnels filtrés par catégorie:', filteredPros);
      
      // Mettre à jour la liste des professionnels filtrés
      setFilteredProfessionals(filteredPros);
      
      // MODIFICATION: Rester à l'étape 1 par défaut, sauf si step est explicitement spécifié
      if (step) {
        const targetStep = parseInt(step);
        if (targetStep >= 1 && targetStep <= 4) {
          setCurrentStep(targetStep);
        }
      } else {
        // Par défaut, aller à l'étape 1 pour la sélection de catégorie/spécialité
        setCurrentStep(1);
      }
      
      return; // Sortir pour éviter de traiter les autres sources
    }
    // Si nous avons seulement un paramètre step dans l'URL
    else if (step) {
      const targetStep = parseInt(step);
      if (targetStep >= 1 && targetStep <= 4) {
        setCurrentStep(targetStep);
      }
      return; // Sortir pour éviter de traiter les autres sources
    }
    
    // Si aucun paramètre d'URL, vérifier localStorage
    try {
      const storedProfessionalData = localStorage.getItem('selectedBookingProfessional');
      const storedSpecialty = localStorage.getItem('selectedBookingSpecialty');
      
      console.log('Données trouvées dans localStorage - Professionnel:', storedProfessionalData);
      console.log('Données trouvées dans localStorage - Spécialité:', storedSpecialty);
      
      if (storedProfessionalData) {
        const data = JSON.parse(storedProfessionalData);
        console.log('Données trouvées dans localStorage:', data);
        
        // Vérifier si nous avons un objet professionnel ou un objet avec une propriété professional
        const pro = data.professional || data;
        
        if (pro && pro._id) {
          console.log('Professionnel trouvé dans localStorage:', pro);
          
          // Vérifier si ce professionnel existe dans notre liste
          const existingPro = professionals.find(p => p._id === pro._id);
          if (existingPro) {
            setSelectedPro(existingPro);
          } else {
            setSelectedPro(pro);
          }
          
          setCurrentStep(2); // Passer directement à l'étape 2 (sélection de date)
          
          // Si le professionnel a des spécialités, mettre à jour le filtre
          if (pro.specialites && pro.specialites.length > 0) {
            setSpecialtyFilter(pro.specialites[0]);
          }
          
          // Nettoyer localStorage après utilisation
          localStorage.removeItem('selectedBookingProfessional');
        }
      } else if (storedSpecialty) {
        // Si nous avons seulement une spécialité stockée
        console.log('Spécialité trouvée dans localStorage:', storedSpecialty);
        setSpecialtyFilter(storedSpecialty);
        
        // Filtrer les professionnels par cette catégorie
        const filteredPros = filterProfessionalsByCategory(professionals, storedSpecialty);
        console.log('Professionnels filtrés par catégorie (localStorage):', filteredPros);
        
        // Mettre à jour la liste des professionnels filtrés
        setFilteredProfessionals(filteredPros);
        
        // MODIFICATION: Rester à l'étape 1 par défaut
        setCurrentStep(1);
        
        // Nettoyer localStorage après utilisation
        localStorage.removeItem('selectedBookingSpecialty');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données depuis localStorage:', error);
    }
  }, [dataLoaded, professionals, location.search, specialtyFilter]);

  // Charger tous les créneaux disponibles lorsqu'un professionnel est sélectionné
  useEffect(() => {
    // Charger tous les créneaux disponibles pour un professionnel
    const loadAllAvailableSlots = async () => {
      if (!selectedPro) return;
      
      try {
        setIsLoading(true);
        console.log('Chargement des disponibilités pour le professionnel:', selectedPro._id);
        
        // Appeler l'API pour obtenir toutes les disponibilités du professionnel
        const response = await userService.getProfessionalAvailabilities(selectedPro._id);
        
        // Vérifier que la réponse contient bien un tableau de créneaux
        if (response && response.data) {
          // Vérifier si les données sont dans response.data ou response.data.data
          let slots = [];
          
          if (Array.isArray(response.data)) {
            slots = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            slots = response.data.data;
          } else if (response.data.success && response.data.data && Array.isArray(response.data.data)) {
            slots = response.data.data;
          }
          
          console.log('Créneaux disponibles récupérés:', slots);
          setAvailableSlots(slots);
          
          if (slots.length === 0) {
            console.log('Aucun créneau disponible pour ce professionnel');
          }
        } else {
          console.log('Réponse invalide de l\'API:', response);
          setAvailableSlots([]);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des disponibilités:', err);
        setError('Erreur lors du chargement des disponibilités');
        setAvailableSlots([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedPro) {
      loadAllAvailableSlots();
    }
  }, [selectedPro]);

  const handleProfessionalSelect = (pro) => {
    console.log('Professionnel sélectionné:', pro);
    console.log('Spécialités du professionnel:', pro.specialites || pro.specialite || pro.domain || 'aucune');
    
    setSelectedPro(pro);
    setCurrentStep(2);
    // Reset slot when changing professional
    setSelectedSlot(null);
    
    // Mettre à jour l'URL avec l'ID du professionnel et l'étape
    const newUrl = `${window.location.pathname}?professionalId=${pro._id}&step=2`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    
    console.log('URL mise à jour:', newUrl);
  };


  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setCurrentStep(3);
    
    // Mettre à jour l'URL avec l'étape 3
    if (selectedPro) {
      const newUrl = `${window.location.pathname}?professionalId=${selectedPro._id}&step=3`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPro) {
      setError('Veuillez sélectionner un professionnel');
      return;
    }

    if (!selectedSlot) {
      setError('Veuillez sélectionner un créneau horaire');
      return;
    }

    if (!motif) {
      setError('Veuillez indiquer le motif du rendez-vous');
      return;
    }

    try {
      setIsLoading(true);
      const appointmentData = {
        professionnelId: selectedPro._id,
        date: new Date(selectedSlot.debut).toISOString(),
        motif: motif,
        status: 'PENDING',
        disponibiliteId: selectedSlot._id
      };

      await userService.bookAppointment(appointmentData);
      setShowToast(true);
      setCurrentStep(4);
      
      // Rester sur la page actuelle et réinitialiser le formulaire après 3 secondes
      setTimeout(() => {
        // Réinitialiser le formulaire
        setSelectedPro(null);
        setSelectedSlot(null);
        setMotif('');
        setCurrentStep(1);
        setSearchTerm('');
      }, 3000);
      
    } catch (err) {
      console.error('Erreur de réservation:', err);
      setError(err.response?.data?.message || 'Erreur lors de la réservation');
    } finally {
      setIsLoading(false);
    }
  };

  const goToStep = (step) => {
    if (step < currentStep) {
      setCurrentStep(step);
      
      // Mettre à jour l'URL avec la nouvelle étape
      let newUrl = `${window.location.pathname}?step=${step}`;
      
      // Si un professionnel est sélectionné, l'inclure dans l'URL
      if (selectedPro && step >= 2) {
        newUrl = `${window.location.pathname}?professionalId=${selectedPro._id}&step=${step}`;
      }
      
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString('fr-FR', options);
  };
  
  // Fonction pour obtenir l'URL absolue de la photo
  const getPhotoUrl = (photoPath, professionalId) => {
    // Si l'image a déjà échoué ou n'existe pas, retourner l'image par défaut
    if (imageErrors[professionalId] || !photoPath) {
      return '/default-avatar.png';
    }

    // Si c'est déjà une URL complète ou une image en base64
    if (photoPath.startsWith('data:image/') || photoPath.startsWith('http')) {
      return photoPath;
    }

    // Extraire le nom du fichier
    const fileName = photoPath.split('/').pop();
    
    // Utiliser directement le chemin /uploads/photos/ qui fonctionne
    const absoluteUrl = `${API_BASE_URL}/uploads/photos/${fileName}`;
    
    return absoluteUrl;
  };

  // Fonction pour gérer les erreurs d'image
  const handleImageError = (professionalId) => {
    setImageErrors(prev => ({
      ...prev,
      [professionalId]: true
    }));
  };

  // Fonction pour ouvrir la photo en grand
  const openPhotoModal = (e, photoUrl) => {
    e.stopPropagation(); // Empêcher la sélection du professionnel
    setSelectedPhoto(photoUrl);
  };

  // Fonction pour fermer la photo
  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };
  
  // Fonction pour filtrer les professionnels par catégorie/spécialité
  const filterProfessionalsByCategory = (pros, category) => {
    if (!category || !pros || !Array.isArray(pros)) return pros;
    
    return pros.filter(pro => {
      if (pro.specialites && Array.isArray(pro.specialites)) {
        return pro.specialites.includes(category);
      } else if (pro.specialite) {
        return pro.specialite === category;
      } else if (pro.domain) {
        return pro.domain === category;
      }
      return false;
    });
  };

  if (!auth?.isAuthenticated) {
    return (
      <div className="book-appointment-container">
        <p>Veuillez vous connecter pour réserver un rendez-vous</p>
        <button onClick={() => navigate('/login')}>Se connecter</button>
      </div>
    );
  }

  // Logs de débogage pour l'état actuel
  console.log('État actuel - Filtre de spécialité:', specialtyFilter);
  console.log('État actuel - Professionnels filtrés:', filteredProfessionals.length);
  console.log('État actuel - Étape courante:', currentStep);
  console.log('État actuel - Professionnel sélectionné:', selectedPro ? `${selectedPro.prenom} ${selectedPro.nom}` : 'aucun');
  
  return (
    <div className="book-appointment-container" id="booking-section">
      {error && (
        <Toast 
          message={error}
          type="error"
          duration={3000}
          onClose={() => setError('')}
        />
      )}

      {showToast && (
        <Toast 
          message="Rendez-vous réservé avec succès!"
          type="success"
          duration={2000}
          onClose={() => setShowToast(false)}
        />
      )}

      <div className="booking-header">
        <div className="header-top">
          <h1>Réserver un rendez-vous</h1>
          <button 
            className="dashboard-btn"
            onClick={navigateToDashboard}
            aria-label="Retour au tableau de bord"
          >
            <FaArrowLeft /> Tableau de bord
          </button>
        </div>
        <div className="booking-steps">
          <div 
            className={`step ${currentStep >= 1 ? 'active' : ''}`}
            onClick={() => goToStep(1)}
          >
            <div className="step-number">1</div>
            <span className="step-label">Professionnel</span>
          </div>
          <div className="step-connector"></div>
          <div 
            className={`step ${currentStep >= 2 ? 'active' : ''} ${!selectedPro ? 'disabled' : ''}`}
            onClick={() => selectedPro && goToStep(2)}
          >
            <div className="step-number">2</div>
            <span className="step-label">Date & Heure</span>
          </div>
          <div className="step-connector"></div>
          <div 
            className={`step ${currentStep >= 3 ? 'active' : ''} ${!selectedSlot ? 'disabled' : ''}`}
            onClick={() => selectedSlot && goToStep(3)}
          >
            <div className="step-number">3</div>
            <span className="step-label">Détails</span>
          </div>
          <div className="step-connector"></div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''} disabled`}>
            <div className="step-number">4</div>
            <span className="step-label">Confirmation</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div 
            key="step1"
            className="booking-step-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div className="step-title" variants={itemVariants}>
              <FaUserMd className="step-icon" />
              <h2>Choisissez un professionnel</h2>
            </motion.div>

            <motion.div className="search-filters" variants={itemVariants}>
              <div className="search-bar">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Rechercher un professionnel..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="specialty-filter">
                <select 
                  value={specialtyFilter} 
                  onChange={(e) => {
                    console.log('Changement de filtre de spécialité:', e.target.value);
                    setSpecialtyFilter(e.target.value);
                  }}
                >
                  <option value="">Toutes les spécialités</option>
                  {specialties.map((specialty, index) => (
                    <option key={index} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </div>
            </motion.div>

            <motion.div className="professionals-grid" variants={itemVariants}>
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Chargement des professionnels...</p>
                </div>
              ) : !filteredProfessionals || !Array.isArray(filteredProfessionals) ? (
                <div className="no-results">
                  <p>Erreur lors du chargement des professionnels</p>
                </div>
              ) : filteredProfessionals.length === 0 ? (
                <div className="no-results">
                  <p>Aucun professionnel ne correspond à votre recherche {specialtyFilter ? `en ${specialtyFilter}` : ''}</p>
                  
                  {specialtyFilter && professionals && professionals.length > 0 && (
                    <>
                      <p className="all-pros-title">Voici tous les professionnels disponibles:</p>
                      <div className="all-professionals-list">
                        {professionals.map(pro => (
                          <motion.div 
                            key={pro._id} 
                            className={`professional-card ${selectedPro?._id === pro._id ? 'selected' : ''}`}
                            onClick={() => handleProfessionalSelect(pro)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="professional-avatar">
                              {pro.photo ? (
                                <div className="profile-image">
                                  <img 
                                    src={getPhotoUrl(pro.photo, pro._id)} 
                                    alt={`${pro.prenom} ${pro.nom}`}
                                    className="profile-photo"
                                    onClick={(e) => openPhotoModal(e, getPhotoUrl(pro.photo, pro._id))}
                                    onError={() => handleImageError(pro._id)}
                                  />
                                  <div className="photo-overlay">
                                    <span>Voir photo</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="avatar-placeholder">
                                  {pro.prenom?.charAt(0)}{pro.nom?.charAt(0)}
                                </div>
                              )}
                            </div>
                            
                            <div className="professional-details">
                              <h3>{pro.prenom} {pro.nom}</h3>
                              
                              {pro.specialites && pro.specialites.length > 0 && (
                                <div className="professional-specialties">
                                  {pro.specialites.map((specialite, index) => (
                                    <span key={index} className="specialty-tag">{specialite}</span>
                                  ))}
                                </div>
                              )}
                              
                              {pro.tarif && (
                                <p className="professional-tarif">Tarif: {pro.tarif}Ar</p>
                              )}
                              
                              {pro.rating && (
                                <div className="professional-rating">
                                  {Array.from({ length: 5 }).map((_, index) => (
                                    <FaStar 
                                      key={index} 
                                      className={index < Math.floor(pro.rating) ? 'star-filled' : 'star-empty'} 
                                    />
                                  ))}
                                  <span>({pro.reviewCount || 0})</span>
                                </div>
                              )}
                            </div>
                            
                            <button className="select-professional-btn">
                              Choisir <FaArrowRight />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                filteredProfessionals.map(pro => (
                  <motion.div 
                    key={pro._id} 
                    className={`professional-card ${selectedPro?._id === pro._id ? 'selected' : ''}`}
                    onClick={() => handleProfessionalSelect(pro)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="professional-avatar">
                      {pro.photo ? (
                        <div className="profile-image">
                          <img 
                            src={getPhotoUrl(pro.photo, pro._id)} 
                            alt={`${pro.prenom} ${pro.nom}`}
                            className="profile-photo"
                            onClick={(e) => openPhotoModal(e, getPhotoUrl(pro.photo, pro._id))}
                            onError={() => handleImageError(pro._id)}
                          />
                          <div className="photo-overlay">
                            <span>Voir photo</span>
                          </div>
                        </div>
                      ) : (
                        <div className="avatar-placeholder">
                          {pro.prenom?.charAt(0)}{pro.nom?.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    <div className="professional-details">
                      <h3>{pro.prenom} {pro.nom}</h3>
                      
                      {pro.specialites && pro.specialites.length > 0 && (
                        <div className="professional-specialties">
                          {pro.specialites.map((specialite, index) => (
                            <span key={index} className="specialty-tag">{specialite}</span>
                          ))}
                        </div>
                      )}
                      
                      {pro.tarif && (
                        <p className="professional-tarif">Tarif: {pro.tarif}Ar</p>
                      )}
                      
                      {pro.rating && (
                        <div className="professional-rating">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <FaStar 
                              key={index} 
                              className={index < Math.floor(pro.rating) ? 'star-filled' : 'star-empty'} 
                            />
                          ))}
                          <span>({pro.reviewCount || 0})</span>
                        </div>
                      )}
                    </div>
                    
                    <button className="select-professional-btn">
                      Choisir <FaArrowRight />
                    </button>
                  </motion.div>
                ))
              )}
            </motion.div>
          </motion.div>
        )}

        {currentStep === 2 && selectedPro && (
          <motion.div 
            key="step2"
            className="booking-step-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div className="step-title" variants={itemVariants}>
              <FaCalendarAlt className="step-icon" />
              <h2>Choisissez un créneau disponible</h2>
            </motion.div>

            <motion.div className="selected-professional-summary" variants={itemVariants}>
              <div className="professional-avatar small">
                {selectedPro.photo ? (
                  <div className="profile-image">
                    <img 
                      src={getPhotoUrl(selectedPro.photo, selectedPro._id)} 
                      alt={`${selectedPro.prenom} ${selectedPro.nom}`}
                      className="profile-photo"
                      onClick={(e) => openPhotoModal(e, getPhotoUrl(selectedPro.photo, selectedPro._id))}
                      onError={() => handleImageError(selectedPro._id)}
                    />
                  </div>
                ) : (
                  <div className="avatar-placeholder">
                    {selectedPro.prenom?.charAt(0)}{selectedPro.nom?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="professional-info">
                <h3>{selectedPro.prenom} {selectedPro.nom}</h3>
                {selectedPro.specialites && selectedPro.specialites.length > 0 && (
                  <p className="specialty">{selectedPro.specialites[0]}</p>
                )}
              </div>
              <button 
                className="change-btn"
                onClick={() => setCurrentStep(1)}
              >
                Changer
              </button>
            </motion.div>

            <motion.div 
              className="time-slots-container"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <h3>Créneaux disponibles</h3>
              
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Chargement des disponibilités...</p>
                </div>
              ) : !availableSlots || availableSlots.length === 0 ? (
                <div className="no-slots">
                  <p>Aucun créneau disponible pour ce professionnel</p>
                  <p>Veuillez sélectionner un autre professionnel</p>
                </div>
              ) : (
                <div className="slots-by-date">
                  {/* Grouper les créneaux par date */}
                  {Object.entries(
                    availableSlots.reduce((acc, slot) => {
                      const date = new Date(slot.debut).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                      
                      if (!acc[date]) {
                        acc[date] = [];
                      }
                      
                      acc[date].push(slot);
                      return acc;
                    }, {})
                  ).sort((a, b) => {
                    // Trier les dates chronologiquement
                    const dateA = new Date(a[1][0].debut);
                    const dateB = new Date(b[1][0].debut);
                    return dateA - dateB;
                  }).map(([date, slots]) => (
                    <div key={date} className="date-slots-group">
                      <h4 className="date-header">{date}</h4>
                      <div className="time-slots-grid">
                        {slots.map(slot => (
                          <motion.div 
                            key={slot._id}
                            className={`time-slot ${selectedSlot?._id === slot._id ? 'selected' : ''}`}
                            onClick={() => handleSlotSelect(slot)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FaClock className="slot-icon" />
                            <span>{formatTime(slot.debut)} - {formatTime(slot.fin)}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div className="step-navigation" variants={itemVariants}>
              <button 
                className="back-btn"
                onClick={() => setCurrentStep(1)}
              >
                <FaArrowLeft /> Retour
              </button>
              
              <button 
                className="next-btn"
                onClick={() => selectedSlot && setCurrentStep(3)}
                disabled={!selectedSlot}
              >
                Continuer <FaArrowRight />
              </button>
            </motion.div>
          </motion.div>
        )}

        {currentStep === 3 && selectedPro && selectedSlot && (
          <motion.div 
            key="step3"
            className="booking-step-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div className="step-title" variants={itemVariants}>
              <FaClipboardList className="step-icon" />
              <h2>Détails du rendez-vous</h2>
            </motion.div>

            <motion.div className="appointment-summary" variants={itemVariants}>
              <div className="summary-card">
                <div className="summary-header">
                  <h3>Résumé de votre rendez-vous</h3>
                </div>
                
                <div className="summary-body">
                  <div className="summary-item">
                    <FaUserMd className="summary-icon" />
                    <div className="summary-content">
                      <span className="summary-label">Professionnel</span>
                      <span className="summary-value">{selectedPro.prenom} {selectedPro.nom}</span>
                    </div>
                  </div>
                  
                  <div className="summary-item">
                    <FaCalendarAlt className="summary-icon" />
                    <div className="summary-content">
                      <span className="summary-label">Date</span>
                      <span className="summary-value">
                        {new Date(selectedSlot.debut).toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="summary-item">
                    <FaClock className="summary-icon" />
                    <div className="summary-content">
                      <span className="summary-label">Heure</span>
                      <span className="summary-value">
                        {formatTime(selectedSlot.debut)} - {formatTime(selectedSlot.fin)}
                      </span>
                    </div>
                  </div>
                  
                  {selectedPro.adresse && (
                    <div className="summary-item">
                      <FaMapMarkerAlt className="summary-icon" />
                      <div className="summary-content">
                        <span className="summary-label">Adresse</span>
                        <span className="summary-value">{selectedPro.adresse}</span>
                      </div>
                    </div>
                  )}
                  
                  {selectedPro.telephone && (
                    <div className="summary-item">
                      <FaPhone className="summary-icon" />
                      <div className="summary-content">
                        <span className="summary-label">Téléphone</span>
                        <span className="summary-value">{selectedPro.telephone}</span>
                      </div>
                    </div>
                  )}
                  
                  {selectedPro.email && (
                    <div className="summary-item">
                      <FaEnvelope className="summary-icon" />
                      <div className="summary-content">
                        <span className="summary-label">Email</span>
                        <span className="summary-value">{selectedPro.email}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.form onSubmit={handleSubmit} className="motif-form" variants={itemVariants}>
              <div className="form-group">
                <label>Motif du rendez-vous:</label>
                <textarea
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Décrivez brièvement le motif de votre rendez-vous"
                  rows={4}
                />
              </div>

              <div className="step-navigation">
                <button 
                  type="button"
                  className="back-btn"
                  onClick={() => setCurrentStep(2)}
                  disabled={isLoading}
                >
                  <FaArrowLeft /> Retour
                </button>
                
                <button 
                  type="submit" 
                  className="confirm-btn"
                  disabled={isLoading || !motif}
                >
                  {isLoading ? 'Réservation en cours...' : 'Confirmer le rendez-vous'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}

        {currentStep === 4 && selectedPro && selectedSlot && (
          <motion.div 
            key="step4"
            className="booking-step-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="confirmation-container"
              variants={itemVariants}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <div className="confirmation-icon">
                <FaCheckCircle />
              </div>
              <h2>Rendez-vous confirmé!</h2>
              <p>Votre rendez-vous a été réservé avec succès.</p>
              <p>Un email de confirmation vous a été envoyé.</p>
              
              <div className="confirmation-details">
                <div className="confirmation-item">
                  <span className="label">Professionnel:</span>
                  <span className="value">{selectedPro.prenom} {selectedPro.nom}</span>
                </div>
                
                <div className="confirmation-item">
                  <span className="label">Date:</span>
                  <span className="value">
                    {new Date(selectedSlot.debut).toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                
                <div className="confirmation-item">
                  <span className="label">Heure:</span>
                  <span className="value">
                    {formatTime(selectedSlot.debut)} - {formatTime(selectedSlot.fin)}
                  </span>
                </div>
              </div>
              
              <p className="redirect-message">
                Vous allez pouvoir réserver un nouveau rendez-vous...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Modal pour afficher la photo en grand */}
      {selectedPhoto && (
        <div className="photo-modal" onClick={closePhotoModal}>
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={closePhotoModal}>&times;</span>
            <img 
              src={selectedPhoto} 
              alt="Photo du professionnel" 
              className="modal-photo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-avatar.png';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
