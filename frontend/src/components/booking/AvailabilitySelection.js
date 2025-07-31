import React, { useState, useEffect } from 'react';
import './AvailabilitySelection.css';

const AvailabilitySelection = ({ professional, availabilities, loading, onAvailabilitySelect, onBack }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [groupedAvailabilities, setGroupedAvailabilities] = useState({});
  const [noAvailabilities, setNoAvailabilities] = useState(false);

  // Grouper les disponibilités par date
  useEffect(() => {
    if (!availabilities || availabilities.length === 0) {
      setNoAvailabilities(true);
      return;
    }

    setNoAvailabilities(false);

    const grouped = availabilities.reduce((acc, availability) => {
      const date = new Date(availability.debut).toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = [];
      }
      
      acc[date].push(availability);
      return acc;
    }, {});
    
    setGroupedAvailabilities(grouped);
    
    // Sélectionner la première date par défaut
    if (Object.keys(grouped).length > 0 && !selectedDate) {
      setSelectedDate(Object.keys(grouped)[0]);
    }
  }, [availabilities, selectedDate]);

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Formater l'heure pour l'affichage
  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString('fr-FR', options);
  };

  if (loading) {
    return <div className="loading-container">Chargement des disponibilités...</div>;
  }

  if (noAvailabilities || !availabilities || availabilities.length === 0) {
    return (
      <div className="empty-container">
        <p>Aucune disponibilité pour ce professionnel.</p>
        <p>Veuillez sélectionner un autre professionnel ou revenir ultérieurement.</p>
        <button className="back-button" onClick={onBack}>
          Retour à la sélection du professionnel
        </button>
      </div>
    );
  }

  return (
    <div className="availability-selection-container">
      <div className="availability-selection-header">
        <button className="back-button" onClick={onBack}>
          ← Retour
        </button>
        <h2 className="availability-selection-title">Choisissez une disponibilité</h2>
      </div>
      
      <div className="professional-info-summary">
        <div className="professional-avatar-small">
          {professional.photo ? (
            <img 
              src={professional.photo.startsWith('http') ? professional.photo : `/api/uploads/photos/${professional.photo}`} 
              alt={`${professional.prenom} ${professional.nom}`} 
            />
          ) : (
            <div className="avatar-placeholder-small">
              {professional.prenom?.charAt(0)}{professional.nom?.charAt(0)}
            </div>
          )}
        </div>
        <div className="professional-details-small">
          <h3>{professional.prenom} {professional.nom}</h3>
          <p>Tarif: {professional.tarif ? `${professional.tarif}Ar` : 'Non spécifié'}</p>
        </div>
      </div>
      
      <div className="date-selector">
        <h3>Dates disponibles</h3>
        <div className="date-buttons">
          {Object.keys(groupedAvailabilities).map(date => (
            <button
              key={date}
              className={`date-button ${selectedDate === date ? 'selected' : ''}`}
              onClick={() => setSelectedDate(date)}
            >
              {formatDate(date)}
            </button>
          ))}
        </div>
      </div>
      
      {selectedDate && groupedAvailabilities[selectedDate] && (
        <div className="time-slots-container">
          <h3>Horaires disponibles pour le {formatDate(selectedDate)}</h3>
          <div className="time-slots-grid">
            {groupedAvailabilities[selectedDate].map(availability => (
              <button
                key={availability._id}
                className="time-slot-button"
                onClick={() => onAvailabilitySelect(availability)}
              >
                {formatTime(availability.debut)} - {formatTime(availability.fin)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilitySelection;
