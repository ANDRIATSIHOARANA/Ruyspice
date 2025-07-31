import React, { useState, useEffect } from 'react';
import CategorySelection from './CategorySelection';
import ProfessionalList from './ProfessionalList';
import AvailabilitySelection from './AvailabilitySelection';
import MotifSelection from './MotifSelection'; // Nouveau composant
import BookingSummary from './BookingSummary';
import { userService } from '../../services/api';
import './BookingWorkflow.css';

const BookingWorkflow = ({ onBookingComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [motif, setMotif] = useState(''); // Nouveau state pour le motif
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingData, setBookingData] = useState({});

  // Charger les disponibilités lorsqu'un professionnel est sélectionné
  useEffect(() => {
    const fetchAvailabilities = async () => {
      if (!selectedProfessional) return;
      
      try {
        setLoading(true);
        const response = await userService.getProfessionalAvailabilities(selectedProfessional._id);
        
        // Extraire les disponibilités selon la structure de la réponse
        let availabilitiesData;
        
        if (response.data && response.data.success === true) {
          availabilitiesData = response.data.data;
        } else {
          availabilitiesData = response.data;
        }
        
        setAvailabilities(Array.isArray(availabilitiesData) ? availabilitiesData : []);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des disponibilités:', err);
        setError('Impossible de charger les disponibilités. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };

    if (selectedProfessional) {
      fetchAvailabilities();
    }
  }, [selectedProfessional]);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setStep(2);
  };

  const handleProfessionalSelect = (professional) => {
    setSelectedProfessional(professional);
    setStep(3);
  };

  const handleAvailabilitySelect = (availability) => {
    setSelectedAvailability(availability);
    setStep(4); // Aller à l'étape du motif au lieu de la confirmation
  };

  const handleMotifSubmit = (motifText) => {
    setMotif(motifText);
    
    // Préparer les données de réservation avec le motif
    setBookingData({
      professionnelId: selectedProfessional._id,
      date: new Date(selectedAvailability.debut).toISOString(),
      motif: motifText, // Utiliser le motif saisi par l'utilisateur
      status: 'PENDING'
    });
    
    setStep(5); // Aller à l'étape de confirmation
  };

  const handleConfirmBooking = async () => {
    try {
      await onBookingComplete(bookingData);
      // Réinitialiser le workflow
      setStep(1);
      setSelectedCategory(null);
      setSelectedProfessional(null);
      setSelectedAvailability(null);
      setMotif('');
      setAvailabilities([]);
      setBookingData({});
    } catch (error) {
      console.error('Erreur lors de la confirmation de la réservation:', error);
      setError('Erreur lors de la confirmation de la réservation. Veuillez réessayer.');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      
      // Réinitialiser les données en fonction de l'étape
      if (step === 3) {
        setSelectedProfessional(null);
      } else if (step === 4) {
        setSelectedAvailability(null);
      } else if (step === 5) {
        setMotif('');
      }
    }
  };

  return (
    <div className="booking-workflow">
      <div className="booking-steps">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Catégorie</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Professionnel</div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Disponibilité</div>
        <div className={`step ${step >= 4 ? 'active' : ''}`}>4. Motif</div>
        <div className={`step ${step >= 5 ? 'active' : ''}`}>5. Confirmation</div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Fermer</button>
        </div>
      )}

      <div className="booking-content">
        {step === 1 && (
          <CategorySelection onCategorySelect={handleCategorySelect} />
        )}
        
        {step === 2 && (
          <ProfessionalList 
            categoryId={selectedCategory} 
            onProfessionalSelect={handleProfessionalSelect}
            onBack={handleBack}
          />
        )}
        
        {step === 3 && (
          <AvailabilitySelection 
            professional={selectedProfessional}
            availabilities={availabilities}
            loading={loading}
            onAvailabilitySelect={handleAvailabilitySelect}
            onBack={handleBack}
          />
        )}
        
        {step === 4 && (
          <MotifSelection 
            onMotifSubmit={handleMotifSubmit}
            onBack={handleBack}
          />
        )}
        
        {step === 5 && (
          <BookingSummary 
            professional={selectedProfessional}
            availability={selectedAvailability}
            motif={motif}
            onConfirm={handleConfirmBooking}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
};

export default BookingWorkflow;
