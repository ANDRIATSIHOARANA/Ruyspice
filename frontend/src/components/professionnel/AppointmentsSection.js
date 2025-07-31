import React, { useState } from 'react';
import { Calendar, Clock, User, FileText, Check, X, Trash2, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import './AppointmentsSection.css';

const AppointmentsSection = ({ appointments, onAppointmentAction }) => {
  const [activeTab, setActiveTab] = useState('pending');

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const getStatusCount = (status) => {
    return appointments.filter(app => app.status === status).length;
  };

  // Fonction pour obtenir l'icône de statut appropriée
  const getStatusIcon = (status) => {
    switch(status) {
      case 'PENDING':
        return <Clock size={18} className="status-icon pending-icon" />;
      case 'CONFIRME':
        return <Check size={18} className="status-icon confirmed-icon" />;
      case 'ANNULE':
        return <X size={18} className="status-icon cancelled-icon" />;
      default:
        return <AlertCircle size={18} className="status-icon" />;
    }
  };

  const renderAppointmentCard = (appointment) => {
    if (!appointment?.utilisateur) return null;

    // Déterminer le statut en français pour l'affichage
    const statusText = {
      'PENDING': 'en attente',
      'CONFIRME': 'confirmé',
      'ANNULE': 'annulé'
    }[appointment.status] || 'inconnu';

    return (
      <div key={appointment._id || `appointment-${appointment.date}`} 
           className={`appointment-card ${appointment.status.toLowerCase()}`}>
        <div className="appointment-header">
          <div className="appointment-status-indicator"></div>
          <h4 className="appointment-title">
            Rendez-vous {statusText}
          </h4>
          {getStatusIcon(appointment.status)}
        </div>
        
        <div className="appointment-details">
          <div className="appointment-detail-item">
            <div className="detail-label">
              <CalendarIcon className="appointment-icon" size={16} />
              <span>Date et heure:</span>
            </div>
            <div className="detail-value">{formatDate(appointment.date)}</div>
          </div>
          
          <div className="appointment-detail-item">
            <div className="detail-label">
              <User className="appointment-icon" size={16} />
              <span>Client:</span>
            </div>
            <div className="detail-value">{appointment.utilisateur.nom} {appointment.utilisateur.prenom}</div>
          </div>
          
          <div className="appointment-detail-item">
            <div className="detail-label">
              <FileText className="appointment-icon" size={16} />
              <span>Motif:</span>
            </div>
            <div className="detail-value">{appointment.motif}</div>
          </div>
        </div>
        
        <div className="appointment-actions">
          {appointment.status === 'PENDING' && (
            <>
              <button 
                onClick={() => onAppointmentAction(appointment._id, 'accept')}
                className="action-button accept"
              >
                <Check size={16} />
                <span>Accepter</span>
              </button>
              <button 
                onClick={() => onAppointmentAction(appointment._id, 'reject')}
                className="action-button reject"
              >
                <X size={16} />
                <span>Refuser</span>
              </button>
            </>
          )}
          {appointment.status === 'CONFIRME' && (
            <button 
              onClick={() => onAppointmentAction(appointment._id, 'delete')}
              className="action-button delete"
            >
              <Trash2 size={16} />
              <span>Supprimer</span>
            </button>
          )}
          {appointment.status === 'ANNULE' && (
            <button 
              onClick={() => onAppointmentAction(appointment._id, 'delete')}
              className="action-button delete"
            >
              <Trash2 size={16} />
              <span>Supprimer</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderAppointmentMobile = (appointment) => {
    if (!appointment?.utilisateur) return null;

    // Déterminer le statut en français pour l'affichage
    const statusText = {
      'PENDING': 'en attente',
      'CONFIRME': 'confirmé',
      'ANNULE': 'annulé'
    }[appointment.status] || 'inconnu';

    return (
      <div key={`mobile-${appointment._id}`} 
           className={`appointment-item-mobile ${appointment.status.toLowerCase()}`}>
        <div className="appointment-mobile-header">
          <span className={`appointment-mobile-status ${appointment.status.toLowerCase()}`}>
            {statusText}
          </span>
          <div className="appointment-mobile-date">
            {new Date(appointment.date).toLocaleDateString('fr-FR', { 
              day: '2-digit', 
              month: 'short' 
            })}
            <br />
            {new Date(appointment.date).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
        
        <div className="appointment-mobile-content">
          <div className="appointment-mobile-row">
            <User className="appointment-mobile-icon" />
            <span className="appointment-mobile-label">Client:</span>
            <span className="appointment-mobile-value">
              {appointment.utilisateur.nom} {appointment.utilisateur.prenom}
            </span>
          </div>
          
          <div className="appointment-mobile-reason">
            <strong>Motif:</strong> {appointment.motif}
          </div>
        </div>
        
        <div className="appointment-mobile-actions">
          {appointment.status === 'PENDING' && (
            <>
              <button 
                onClick={() => onAppointmentAction(appointment._id, 'accept')}
                className="action-button-mobile accept"
              >
                Accepter
              </button>
              <button 
                onClick={() => onAppointmentAction(appointment._id, 'reject')}
                className="action-button-mobile reject"
              >
                Refuser
              </button>
            </>
          )}
          {(appointment.status === 'CONFIRME' || appointment.status === 'ANNULE') && (
            <button 
              onClick={() => onAppointmentAction(appointment._id, 'delete')}
              className="action-button-mobile delete"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderAppointmentsList = (status, emptyIcon, emptyMessage) => {
    const filteredAppointments = appointments.filter(app => app.status === status);
    
    return (
      <>
        {/* Vue desktop - cartes */}
        <div className="appointments-list">
          {filteredAppointments.map(renderAppointmentCard)}
          {filteredAppointments.length === 0 && (
            <div className="no-appointments">
              {emptyIcon}
              <p>{emptyMessage}</p>
            </div>
          )}
        </div>

        {/* Vue mobile - liste compacte */}
        <div className="appointments-list-mobile">
          {filteredAppointments.map(renderAppointmentMobile)}
          {filteredAppointments.length === 0 && (
            <div className="no-appointments">
              {emptyIcon}
              <p>{emptyMessage}</p>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="appointments-container">
      <h3 className="section-title">Gestion des rendez-vous</h3>
      
      <div className="appointments-tabs">
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          En attente
          <span className="tab-count">{getStatusCount('PENDING')}</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'confirmed' ? 'active' : ''}`}
          onClick={() => setActiveTab('confirmed')}
        >
          Confirmés
          <span className="tab-count">{getStatusCount('CONFIRME')}</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'cancelled' ? 'active' : ''}`}
          onClick={() => setActiveTab('cancelled')}
        >
          Annulés
          <span className="tab-count">{getStatusCount('ANNULE')}</span>
        </button>
      </div>
      
      <div className="appointments-content">
        {activeTab === 'pending' && renderAppointmentsList(
          'PENDING',
          <Clock className="empty-icon" size={48} />,
          'Aucun rendez-vous en attente'
        )}
        
        {activeTab === 'confirmed' && renderAppointmentsList(
          'CONFIRME',
          <Check className="empty-icon" size={48} />,
          'Aucun rendez-vous confirmé'
        )}
        
        {activeTab === 'cancelled' && renderAppointmentsList(
          'ANNULE',
          <X className="empty-icon" size={48} />,
          'Aucun rendez-vous annulé'
        )}
      </div>
    </div>
  );
};

export default AppointmentsSection;