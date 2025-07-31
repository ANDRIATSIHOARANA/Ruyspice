import React from 'react';
import './BookingSummary.css';

const BookingSummary = ({ professional, availability, motif, onConfirm, onBack }) => {
  // Fonction pour formater la date en français
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Fonction pour formater l'heure en français
  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString('fr-FR', options);
  };

  return (
    <div className="booking-summary-container">
      <div className="booking-summary-header">
        <button className="back-button" onClick={onBack}>
          ← Retour
        </button>
        <h2 className="booking-summary-title">Résumé de votre réservation</h2>
      </div>
      
      <div className="booking-summary-content">
        <div className="booking-professional-info">
          <h3>Professionnel</h3>
          <div className="professional-card-summary">
            <div className="professional-avatar-summary">
              {professional.photo ? (
                <img 
                  src={professional.photo.startsWith('http') ? professional.photo : `/api/uploads/photos/${professional.photo}`} 
                  alt={`${professional.prenom} ${professional.nom}`} 
                />
              ) : (
                <div className="avatar-placeholder-summary">
                  {professional.prenom.charAt(0)}{professional.nom.charAt(0)}
                </div>
              )}
            </div>
            
            <div className="professional-details-summary">
              <p className="professional-name-summary">{professional.prenom} {professional.nom}</p>
              
              {professional.specialites && professional.specialites.length > 0 && (
                <div className="professional-specialties-summary">
                  {professional.specialites.map((specialite, index) => (
                    <span key={index} className="specialty-tag-summary">{specialite}</span>
                  ))}
                </div>
              )}
              
              <p className="professional-tarif-summary">
                Tarif: {professional.tarif ? `${professional.tarif}Ar` : 'Non spécifié'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="booking-date-time-info">
          <h3>Date et heure</h3>
          <p className="booking-date">{formatDate(availability.debut)}</p>
          <p className="booking-time">
            de {formatTime(availability.debut)} à {formatTime(availability.fin)}
          </p>
        </div>
        
        <div className="booking-motif-info">
          <h3>Motif du rendez-vous</h3>
          <p className="booking-motif">{motif}</p>
        </div>
        
        <div className="booking-notes">
          <p>Votre rendez-vous sera en attente de confirmation par le professionnel.</p>
          <p>Vous recevrez une notification dès que le professionnel aura accepté votre demande.</p>
        </div>
      </div>
      
      <div className="booking-actions">
        <button className="cancel-button" onClick={onBack}>
          Modifier
        </button>
        <button className="confirm-button" onClick={onConfirm}>
          Confirmer la réservation
        </button>
      </div>
    </div>
  );
};

export default BookingSummary;
