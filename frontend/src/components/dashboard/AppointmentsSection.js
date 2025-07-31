import React, { useState, useEffect } from 'react';
import { userService } from '../../services/api';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUser, FaInfoCircle, FaTrash } from 'react-icons/fa';
import './AppointmentsSection.css';

const AppointmentsSection = ({ appointments: propAppointments, onCancel }) => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' ou 'oldest'

  useEffect(() => {
    if (propAppointments) {
      setAppointments(propAppointments);
      setIsLoading(false);
    } else {
      fetchAppointments();
    }
  }, [propAppointments]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await userService.getAppointments();
      setAppointments(response.data);
    } catch (err) {
      console.error('Erreur de chargement:', err);
      setError('Erreur lors du chargement des rendez-vous');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Voulez-vous vraiment annuler ce rendez-vous ?')) {
      try {
        await userService.cancelAppointment(id);
        if (onCancel) {
          onCancel(id);
        } else {
          await fetchAppointments();
        }
      } catch (err) {
        console.error('Erreur d\'annulation:', err);
        alert("Échec de l'annulation du rendez-vous");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous définitivement supprimer ce rendez-vous ?')) {
      try {
        await userService.deleteAppointment(id);
        await fetchAppointments();
      } catch (err) {
        console.error('Erreur de suppression:', err);
        alert("Échec de la suppression du rendez-vous");
      }
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true;
    if (filter === 'pending') return appointment.status === 'PENDING';
    if (filter === 'confirmed') return appointment.status === 'CONFIRME';
    if (filter === 'cancelled') return appointment.status === 'ANNULE';
    return true;
  });

  // Tri des rendez-vous
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Fonction pour déterminer si un rendez-vous est passé
  const isAppointmentPast = (dateString) => {
    const appointmentDate = new Date(dateString);
    const now = new Date();
    return appointmentDate < now;
  };

  // Fonction pour obtenir la classe CSS du statut
  const getStatusClass = (status, isPast) => {
    if (isPast) return 'status-past';
    if (status === 'PENDING') return 'status-pending';
    if (status === 'CONFIRME') return 'status-confirmed';
    if (status === 'ANNULE') return 'status-cancelled';
    return '';
  };

  // Fonction pour obtenir le libellé du statut
  const getStatusLabel = (status, isPast) => {
    if (isPast) return 'Passé';
    if (status === 'PENDING') return 'En attente';
    if (status === 'CONFIRME') return 'Confirmé';
    if (status === 'ANNULE') return 'Annulé';
    return status;
  };

  return (
    <div className="appointments-section">
      <div className="appointments-header">
        <div className="filter-buttons">
          <button 
            onClick={() => setFilter('all')}
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          >
            Tous
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`filter-button ${filter === 'pending' ? 'active' : ''}`}
          >
            En attente
          </button>
          <button 
            onClick={() => setFilter('confirmed')}
            className={`filter-button ${filter === 'confirmed' ? 'active' : ''}`}
          >
            Confirmés
          </button>
          <button 
            onClick={() => setFilter('cancelled')}
            className={`filter-button ${filter === 'cancelled' ? 'active' : ''}`}
          >
            Annulés
          </button>
        </div>
        
        <div className="sort-options">
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Plus récents</option>
            <option value="oldest">Plus anciens</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des rendez-vous...</p>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}

      {!isLoading && sortedAppointments.length === 0 && (
        <div className="empty-state">
          <FaCalendarAlt className="empty-icon" />
          <p className="empty-text">
            Aucun rendez-vous {filter !== 'all' && `${
              filter === 'pending' ? 'en attente' : 
              filter === 'confirmed' ? 'confirmé' : 
              'annulé'
            }`} trouvé
          </p>
          <p className="empty-subtext">
            {filter === 'all' 
              ? "Vous n'avez pas encore de rendez-vous. Réservez-en un dès maintenant !" 
              : "Changez de filtre pour voir d'autres rendez-vous."}
          </p>
        </div>
      )}

      {!isLoading && sortedAppointments.length > 0 && (
        <div className="appointments-list">
          {sortedAppointments.map((appointment) => {
            const isPast = isAppointmentPast(appointment.date);
            const statusClass = getStatusClass(appointment.status, isPast);
            const statusLabel = getStatusLabel(appointment.status, isPast);
            
            return (
              <div 
                key={appointment._id} 
                className={`appointment-card ${isPast ? 'past-appointment' : ''}`}
              >
                <div className="appointment-header">
                  <span className={`appointment-status ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>
                
                <div className="appointment-body">
                  <div className="appointment-detail">
                    <FaUser className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Professionnel</span>
                      <span className="detail-value">
                        {appointment.professionnel?.nom} {appointment.professionnel?.prenom}
                      </span>
                    </div>
                  </div>
                  
                  <div className="appointment-detail">
                    <FaCalendarAlt className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Date</span>
                      <span className="detail-value">
                        {formatDate(appointment.date)}
                      </span>
                    </div>
                  </div>
                  
                  {appointment.professionnel?.adresse && (
                    <div className="appointment-detail">
                      <FaMapMarkerAlt className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Adresse</span>
                        <span className="detail-value">
                          {appointment.professionnel.adresse}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="appointment-detail">
                    <FaInfoCircle className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Motif</span>
                      <span className="detail-value">{appointment.motif}</span>
                    </div>
                  </div>
                </div>
                
                <div className="appointment-footer">
                  {appointment.status === 'PENDING' && !isPast && (
                    <button 
                      onClick={() => handleCancel(appointment._id)}
                      className="cancel-button"
                    >
                      Annuler
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(appointment._id)}
                    className="delete-button"
                    title="Supprimer ce rendez-vous"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AppointmentsSection;
