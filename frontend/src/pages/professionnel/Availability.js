import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { professionalService } from '../../services/api';
import styles from './Availability.module.css';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaPlus, 
  FaTrash, 
  FaPen, 
  FaCalendarCheck, 
  FaCalendarDay, 
  FaExclamationTriangle,
  FaRegCalendarPlus,
  FaRegClock,
  FaRegCalendarCheck,
  FaInfoCircle,
  FaArrowLeft
} from 'react-icons/fa';

const Availability = () => {
  const navigate = useNavigate(); // Hook pour la navigation
  // États
  const [availabilities, setAvailabilities] = useState([]);
  const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('list'); // 'list' ou 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingSlot, setEditingSlot] = useState(null);

  // Fonction pour retourner au tableau de bord
  const handleBackToDashboard = () => {
    navigate('/professional/dashboard');
  };

  // Chargement initial des disponibilités
  useEffect(() => {
    loadAvailabilities();
  }, []);

  // Fonction pour charger les disponibilités depuis l'API
  const loadAvailabilities = async () => {
    try {
      setLoading(true);
      const response = await professionalService.getAvailabilities();
      
      // Vérifier la structure de la réponse
      console.log('Réponse API:', response);
      
      // Extraire les données selon la structure de la réponse
      let availabilitiesData;
      
      if (response.data && response.data.success === true) {
        // Nouvelle structure API
        availabilitiesData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        // Structure directe
        availabilitiesData = response.data;
      } else {
        // Fallback
        availabilitiesData = [];
        console.error('Structure de réponse inattendue:', response.data);
      }
      
      // S'assurer que nous avons un tableau et que chaque élément a un ID
      const processedData = Array.isArray(availabilitiesData) 
        ? availabilitiesData.map(slot => {
            // Vérifier si l'ID est présent et le format correct
            if (!slot._id && slot.id) {
              slot._id = slot.id; // Normaliser l'ID si nécessaire
            }
            
            // Log pour déboguer
            console.log('Disponibilité chargée:', {
              id: slot._id || slot.id,
              debut: slot.debut,
              fin: slot.fin
            });
            
            return slot;
          })
        : [];
      
      setAvailabilities(processedData);
      setLoading(false);
    } catch (error) {
      console.error('Erreur détaillée lors du chargement des disponibilités:', error);
      setError('Erreur lors du chargement des disponibilités');
      setAvailabilities([]); // Initialiser avec un tableau vide en cas d'erreur
      setLoading(false);
    }
  };

  // Fonction pour ajouter une nouvelle disponibilité
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Validation des champs
      if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
        setError('Veuillez remplir tous les champs');
        return;
      }
      
      const startDateTime = new Date(`${newSlot.date}T${newSlot.startTime}:00`);
      const endDateTime = new Date(`${newSlot.date}T${newSlot.endTime}:00`);
      
      // Validation des dates
      if (isNaN(startDateTime)) throw new Error('Date de début invalide');
      if (isNaN(endDateTime)) throw new Error('Date de fin invalide');
  
      if (endDateTime <= startDateTime) {
        setError('L\'heure de fin doit être après l\'heure de début');
        return;
      }
      
      // Si nous sommes en mode édition
      if (editingSlot) {
        // Vérifier si l'ID est présent
        const slotId = editingSlot._id || editingSlot.id;
        
        if (!slotId) {
          console.error('Impossible de modifier: ID manquant', editingSlot);
          setError('Impossible de modifier cette disponibilité: ID manquant');
          return;
        }
        
        console.log('Suppression de la disponibilité avec ID:', slotId);
        
        // Supprimer l'ancienne disponibilité
        await professionalService.deleteAvailability(slotId);
        
        // Créer une nouvelle disponibilité
        await professionalService.addAvailability({
          disponibilite: {
            debut: startDateTime.toISOString(),
            fin: endDateTime.toISOString()
          }
        });
        
        setEditingSlot(null);
        showSuccessMessage('Disponibilité mise à jour avec succès');
      } else {
        // Sinon, ajout d'une nouvelle disponibilité
        const response = await professionalService.addAvailability({
          disponibilite: {
            debut: startDateTime.toISOString(),
            fin: endDateTime.toISOString()
          }
        });
        
        console.log('Nouvelle disponibilité ajoutée, réponse:', response);
        showSuccessMessage('Disponibilité ajoutée avec succès');
      }
      
      // Recharger les disponibilités et réinitialiser le formulaire
      await loadAvailabilities();
      setNewSlot({ date: '', startTime: '', endTime: '' });
      
    } catch (error) {
      console.error('Erreur détaillée:', error);
      setError(error.response?.data?.message || 'Une erreur est survenue');
    }
  };

  // Fonction pour supprimer une disponibilité
  const handleDelete = async (slot) => {
    // Vérifier si l'ID est présent
    const slotId = slot._id || slot.id;
    
    if (!slotId) {
      console.error('Impossible de supprimer: ID manquant', slot);
      setError('Impossible de supprimer cette disponibilité: ID manquant');
      return;
    }
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) return;
    
    try {
      console.log('Suppression de la disponibilité avec ID:', slotId);
      await professionalService.deleteAvailability(slotId);
      await loadAvailabilities();
      showSuccessMessage('Disponibilité supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError('Erreur lors de la suppression de la disponibilité');
    }
  };

  // Fonction pour éditer une disponibilité
  const handleEdit = (slot) => {
    // Vérifier si les données nécessaires sont présentes
    if (!slot || !slot.debut || !slot.fin) {
      setError('Impossible de modifier cette disponibilité: données incomplètes');
      return;
    }
    
    const startDate = new Date(slot.debut);
    const endDate = new Date(slot.fin);
    
    if (isNaN(startDate) || isNaN(endDate)) {
      setError('Impossible de modifier cette disponibilité: dates invalides');
      return;
    }
    
    // Vérifier si l'ID est présent
    if (!slot._id && !slot.id) {
      console.warn('Édition d\'une disponibilité sans ID:', slot);
    }
    
    setEditingSlot(slot);
    setNewSlot({
      date: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: endDate.toTimeString().slice(0, 5)
    });
    
    // Faire défiler jusqu'au formulaire
    const formSection = document.querySelector(`.${styles.formSection}`);
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Fonction pour annuler l'édition
  const handleCancelEdit = () => {
    setEditingSlot(null);
    setNewSlot({ date: '', startTime: '', endTime: '' });
  };

  // Fonction pour afficher un message de succès temporaire
  const [successMessage, setSuccessMessage] = useState('');
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  // Fonctions de formatage des dates et heures
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return 'Date invalide';
    
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date) 
      ? 'Heure invalide' 
      : date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
  };

  // Fonctions pour la vue calendrier
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Ajuster pour que la semaine commence le lundi (0 = lundi, 6 = dimanche)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    const days = [];
    
    // Jours du mois précédent
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        currentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i)
      });
    }
    
    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        currentMonth: true,
        date: new Date(year, month, i),
        isToday: isToday(new Date(year, month, i))
      });
    }
    
    // Jours du mois suivant
    const totalDaysNeeded = 42; // 6 semaines * 7 jours
    const remainingDays = totalDaysNeeded - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        currentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }
    
    return days;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const getAvailabilitiesForDate = (date) => {
    return availabilities.filter(slot => {
      const slotDate = new Date(slot.debut);
      return slotDate.getDate() === date.getDate() &&
             slotDate.getMonth() === date.getMonth() &&
             slotDate.getFullYear() === date.getFullYear();
    });
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date) => {
    setNewSlot({
      ...newSlot,
      date: date.toISOString().split('T')[0]
    });
    
    // Faire défiler jusqu'au formulaire
    const formSection = document.querySelector(`.${styles.formSection}`);
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Jours de la semaine pour l'en-tête du calendrier
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Affichage du chargement
  if (loading) {
    return (
      <div className={styles.availabilityContainer}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p>Chargement de vos disponibilités...</p>
          <small className={styles.loadingHint}>Veuillez patienter pendant que nous récupérons vos créneaux...</small>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.availabilityContainer}>
      {/* Bouton retour vers le tableau de bord */}
      <button 
        className={styles.backButton}
        onClick={handleBackToDashboard}
      >
        <FaArrowLeft /> Retour au tableau de bord
      </button>

      <h1 className={styles.pageTitle}>Gestion des Disponibilités</h1>
      <p className={styles.pageSubtitle}>
        Définissez vos créneaux horaires pour permettre aux clients de prendre rendez-vous avec vous.
      </p>

      {/* Boutons de changement de vue */}
      <div className={styles.viewToggle}>
        <button 
          className={`${styles.viewButton} ${currentView === 'list' ? styles.activeView : ''}`}
          onClick={() => setCurrentView('list')}
        >
          <FaRegCalendarCheck /> Vue Liste
        </button>
        <button 
          className={`${styles.viewButton} ${currentView === 'calendar' ? styles.activeView : ''}`}
          onClick={() => setCurrentView('calendar')}
        >
          <FaCalendarAlt /> Vue Calendrier
        </button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className={styles.errorMessage}>
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      {/* Message de succès */}
      {successMessage && (
        <div className={styles.successMessage}>
          <FaRegCalendarCheck />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Contenu principal */}
      <div className={styles.contentWrapper}>
        {/* Formulaire d'ajout/édition */}
        <div className={styles.formSection}>
          <h2 className={styles.formTitle}>
            <FaRegCalendarPlus />
            {editingSlot ? 'Modifier un créneau' : 'Ajouter un créneau'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="date">
                <FaCalendarDay /> Date
              </label>
              <input
                type="date"
                id="date"
                className={styles.formControl}
                value={newSlot.date}
                onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]} // Date minimum = aujourd'hui
                required
              />
            </div>
            
            <div className={styles.timeInputsContainer}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="startTime">
                  <FaRegClock /> Heure de début
                </label>
                <input
                  type="time"
                  id="startTime"
                  className={styles.formControl}
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="endTime">
                  <FaClock /> Heure de fin
                </label>
                <input
                  type="time"
                  id="endTime"
                  className={styles.formControl}
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton}>
                {editingSlot ? <FaPen /> : <FaPlus />}
                {editingSlot ? 'Mettre à jour' : 'Ajouter'}
              </button>
              
              {editingSlot && (
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={handleCancelEdit}
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Liste des créneaux */}
        <div className={styles.slotsSection}>
          <h2 className={styles.slotsTitle}>
            <FaRegCalendarCheck />
            Mes créneaux disponibles
          </h2>
          
          <div className={styles.slotsList}>
            {availabilities.length === 0 ? (
              <div className={styles.emptySlots}>
                <FaRegCalendarPlus />
                <p>Aucun créneau disponible</p>
                <span>Ajoutez votre premier créneau pour commencer à recevoir des rendez-vous</span>
              </div>
            ) : (
              availabilities.map((slot, index) => {
                // Récupérer l'ID de la disponibilité
                const slotId = slot._id || slot.id;
                
                return (
                  <div 
                    key={slotId || `slot-${index}-${slot.debut}-${slot.fin}`} 
                    className={styles.slotCard}
                  >
                    <div className={styles.slotDate}>
                      <FaCalendarDay />
                      {formatDate(slot.debut)}
                    </div>
                    <div className={styles.slotTime}>
                      <FaRegClock />
                      {formatTime(slot.debut)} - {formatTime(slot.fin)}
                    </div>
                    {!slotId && (
                      <div className={styles.slotWarning}>
                        <FaInfoCircle />
                        <span>ID manquant - Rechargez la page</span>
                      </div>
                    )}
                    <div className={styles.slotActions}>
                      <button 
                        className={styles.editButton}
                        onClick={() => handleEdit(slot)}
                      >
                        <FaPen /> Modifier
                      </button>
                      {slotId && (
                        <button 
                          className={styles.deleteButton}
                          onClick={() => handleDelete(slot)}
                        >
                          <FaTrash /> Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Vue Calendrier */}
      {currentView === 'calendar' && (
        <div className={styles.calendarView}>
          <h2 className={styles.calendarTitle}>
            <FaCalendarAlt />
            Calendrier des disponibilités
          </h2>
          
          <div className={styles.calendarNavigation}>
            <button onClick={handlePrevMonth} className={styles.calendarNavButton}>
              &lt; Mois précédent
            </button>
            <h3 className={styles.calendarMonth}>
              {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={handleNextMonth} className={styles.calendarNavButton}>
              Mois suivant &gt;
            </button>
          </div>
          
          <div className={styles.calendarHeader}>
            {weekDays.map((day, index) => (
              <div key={`weekday-${index}`} className={styles.calendarDay}>{day}</div>
            ))}
          </div>
          
          <div className={styles.calendarGrid}>
            {generateCalendarDays().map((day, index) => {
              const dayAvailabilities = getAvailabilitiesForDate(day.date);
              const hasSlots = dayAvailabilities.length > 0;
              
              return (
                <div 
                  key={`day-${day.date.toISOString()}`}
                  className={`
                    ${styles.calendarCell}
                    ${!day.currentMonth ? styles.calendarCellOtherMonth : ''}
                    ${day.isToday ? styles.calendarCellToday : ''}
                    ${hasSlots ? styles.calendarCellWithSlots : ''}
                  `}
                  onClick={() => day.currentMonth && handleDateClick(day.date)}
                >
                  <div className={styles.calendarDate}>{day.day}</div>
                  {hasSlots && (
                    <div className={styles.calendarSlots}>
                      {dayAvailabilities.length} créneau{dayAvailabilities.length > 1 ? 'x' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Availability;
