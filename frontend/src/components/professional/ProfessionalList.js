import React, { useState, useEffect } from 'react';
import { userService } from '../../services/api';
import './ProfessionalList.css';

const ProfessionalList = () => {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      const response = await userService.getProfessionals();
      setProfessionals(response.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des professionnels');
      setLoading(false);
    }
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return '/default-avatar.png';
    if (photoPath.startsWith('http')) return photoPath;
    return `http://localhost:5000${photoPath}`;
  };

  // Fonction pour ouvrir la photo en grand
  const openPhotoModal = (photoUrl) => {
    setSelectedPhoto(photoUrl);
  };

  // Fonction pour fermer la photo
  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="professional-list-container">
      <h2>Professionnels Disponibles</h2>
      <div className="professional-grid">
        {professionals.map((pro) => (
          <div key={pro._id} className="professional-card">
            <div className="profile-image">
              <img 
                src={getPhotoUrl(pro.photo)}
                alt={`${pro.nom} ${pro.prenom}`}
                className="profile-photo"
                onClick={() => openPhotoModal(getPhotoUrl(pro.photo))}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.png';
                }}
              />
              <div className="photo-overlay">
                <span>Voir photo</span>
              </div>
            </div>
            <div className="profile-info">
              <h3>{pro.nom} {pro.prenom}</h3>
              <p className="email">{pro.email}</p>
              {pro.specialites && pro.specialites.length > 0 && (
                <div className="specialties">
                  {pro.specialites.map((specialite, index) => (
                    <span key={index} className="specialty-tag">
                      {specialite}
                    </span>
                  ))}
                </div>
              )}
              {pro.description && (
                <p className="description">{pro.description}</p>
              )}
              <button 
                className="book-button"
                onClick={() => window.location.href = `/professional/${pro._id}`}
              >
                Voir le profil et les disponibilités
              </button>
            </div>
          </div>
        ))}
      </div>

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

export default ProfessionalList;
