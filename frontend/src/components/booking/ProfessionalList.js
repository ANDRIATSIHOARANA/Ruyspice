import React, { useState, useEffect } from 'react';
import { userService } from '../../services/api';
import './ProfessionalList.css';

const ProfessionalList = ({ categoryId, onProfessionalSelect, onBack }) => {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPro, setSelectedPro] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  
  // URL de base de l'API - IMPORTANT: utilisez l'URL complète avec http:// ou https://
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Afficher l'URL de base pour débogage
  console.log('API_BASE_URL utilisée:', API_BASE_URL);

  useEffect(() => {
    if (categoryId) {
      fetchProfessionals();
    }
  }, [categoryId]);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const response = await userService.getProfessionalsByCategory(categoryId);
      
      // Extraire les données selon la structure de la réponse
      let professionalsData;
      
      if (response.data && response.data.success === true) {
        professionalsData = response.data.data;
      } else if (response.data && response.data.professionnels) {
        professionalsData = response.data.professionnels;
      } else {
        professionalsData = response.data;
      }
      
      // S'assurer que nous avons un tableau
      setProfessionals(Array.isArray(professionalsData) ? professionalsData : []);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des professionnels:', err);
      setError('Impossible de charger les professionnels. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  };

  const handleProfessionalClick = (professional) => {
    if (selectedPro && selectedPro._id === professional._id) {
      setSelectedPro(null);
    } else {
      setSelectedPro(professional);
    }
  };

  const handleSelectProfessional = () => {
    if (selectedPro) {
      onProfessionalSelect(selectedPro);
    }
  };

  // Fonction pour obtenir l'URL absolue de la photo
  // CORRIGÉE pour utiliser directement le chemin /uploads/photos/ qui fonctionne
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
    
    // Utiliser directement le chemin /uploads/photos/ qui fonctionne (sans le préfixe /api)
    const absoluteUrl = `${API_BASE_URL}/uploads/photos/${fileName}`;
    
    return absoluteUrl;
  };

  // Fonction pour gérer les erreurs d'image
  const handleImageError = (professionalId) => {
    console.error(`Erreur de chargement de l'image pour le professionnel ${professionalId}`);
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

  if (loading) {
    return <div className="loading-container">Chargement des professionnels...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button className="back-button" onClick={onBack}>
          Retour aux catégories
        </button>
      </div>
    );
  }

  if (!professionals || professionals.length === 0) {
    return (
      <div className="empty-container">
        <p>Aucun professionnel disponible dans cette catégorie.</p>
        <button className="back-button" onClick={onBack}>
          Retour aux catégories
        </button>
      </div>
    );
  }

  return (
    <div className="professionals-container">
      <div className="professionals-header">
        <button className="back-button" onClick={onBack}>
          ← Retour aux catégories
        </button>
        <h2 className="professionals-title">Choisissez un professionnel</h2>
      </div>
      
      <div className="professionals-grid">
        {professionals.map(professional => {
          // Calculer l'URL de la photo une seule fois par professionnel
          const photoUrl = professional.photo 
            ? getPhotoUrl(professional.photo, professional._id) 
            : '/default-avatar.png';
            
          return (
            <div 
              key={professional._id} 
              className={`professional-card ${selectedPro && selectedPro._id === professional._id ? 'selected' : ''}`}
              onClick={() => handleProfessionalClick(professional)}
            >
              <div className="professional-avatar">
                {professional.photo && !imageErrors[professional._id] ? (
                  <div className="profile-image">
                    <img 
                      src={photoUrl} 
                      alt={`${professional.prenom} ${professional.nom}`}
                      className="profile-photo"
                      data-professional-id={professional._id}
                      onClick={(e) => openPhotoModal(e, photoUrl)}
                      onError={() => handleImageError(professional._id)}
                    />
                    <div className="photo-overlay">
                      <span>Voir photo</span>
                    </div>
                  </div>
                ) : (
                  <div className="avatar-placeholder">
                    {professional.prenom?.charAt(0)}{professional.nom?.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="professional-info">
                <h3 className="professional-name">{professional.prenom} {professional.nom}</h3>
                
                {professional.specialites && professional.specialites.length > 0 && (
                  <div className="professional-specialties">
                    {professional.specialites.map((specialite, index) => (
                      <span key={index} className="specialty-tag">
                        {typeof specialite === 'object' ? specialite.nom : specialite}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="professional-tarif">
                  Tarif: {professional.tarif ? `${professional.tarif}Ar` : 'Non spécifié'}
                </div>
                
                {selectedPro && selectedPro._id === professional._id && (
                  <div className="professional-details">
                    <p className="professional-description">
                      {professional.description || 'Aucune description disponible.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedPro && (
        <div className="selection-actions">
          <button 
            className="select-professional-btn"
            onClick={handleSelectProfessional}
          >
            Sélectionner {selectedPro.prenom} {selectedPro.nom}
          </button>
        </div>
      )}

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
                console.error("Erreur de chargement de l'image dans la modal");
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

export default ProfessionalList;