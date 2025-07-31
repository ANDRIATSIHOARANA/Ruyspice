// Imports des bibliothèques tierces
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCalendarAlt, FaUserCircle, FaBell, FaClipboardList, FaUserMd, FaHistory, FaSearch, FaComment, FaListUl, FaChevronLeft, FaChevronRight, FaBars, FaTimes } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';

// Imports des contextes et services
import { AuthContext } from '../../context/AuthContext';
import { userService } from '../../services/api';

// Imports des composants
import BookingWorkflow from '../../components/booking/BookingWorkflow';
import AppointmentsSection from '../../components/dashboard/AppointmentsSection';
import NotificationsSection from '../../components/dashboard/NotificationsSection';
import SmartChat from '../../components/chat/SmartChat';
import SmartSearch from '../../components/search/SmartSearch';

// Import des styles
import './Dashboard.css';

// Composant Sidebar intégré
const Sidebar = ({ user, onLogout, activeTab, setActiveTab, setShowBookingWorkflow, isVisible, onClose }) => {
  const location = useLocation();
  const path = location.pathname;
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fonction pour déterminer si un lien est actif
  // eslint-disable-next-line no-unused-vars
  const isActive = (route) => {
    return path === route ? 'active' : '';
  };

  // Obtenir les initiales de l'utilisateur pour l'avatar
  const getUserInitials = () => {
    if (!user || !user.nom) return 'U';
    return `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase();
  };

  // Fonction pour obtenir l'URL de la photo de l'utilisateur
  const getUserPhotoUrl = () => {
    if (!user || !user.photo) return null;
    
    // Si c'est déjà une URL complète ou une image en base64
    if (user.photo.startsWith('data:image/') || user.photo.startsWith('http')) {
      return user.photo;
    }
    
    // Utiliser directement l'URL correcte pour les photos
    return `${API_BASE_URL}/uploads/photos/${user.photo}`;
  };

  // Effet pour déboguer l'affichage de la photo
  useEffect(() => {
    if (user?.photo) {
      console.log('Photo utilisateur:', user.photo);
      console.log('URL construite:', getUserPhotoUrl());
      
      // Tester l'accessibilité de l'URL
      fetch(getUserPhotoUrl(), { method: 'HEAD' })
        .then(response => {
          console.log('Test d\'accessibilité de la photo:', response.status, response.statusText);
        })
        .catch(error => {
          console.error('Erreur lors du test d\'accessibilité:', error);
        });
    }
  }, [user]);

  const handleBookingClick = (e) => {
    e.preventDefault();
    setActiveTab(null); // Désactiver les onglets
    setShowBookingWorkflow(true);
    onClose(); // Fermer la sidebar sur mobile
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setShowBookingWorkflow(false);
    onClose(); // Fermer la sidebar sur mobile
  };

  return (
    <div className={`dashboard-sidebar ${isVisible ? 'visible' : ''}`}>
      <div className="sidebar-header">
        <Link to="/dashboard" className="logo">
          <div className="logo-icon">RDV</div>
          <span>RDV-Project</span>
        </Link>
      </div>

      <div className="user-profile">
        {user?.photo ? (
          <div className="user-avatar">
            <img 
              src={getUserPhotoUrl()} 
              alt={`${user.prenom} ${user.nom}`}
              onError={(e) => {
                console.error('Erreur de chargement de l\'image:', e);
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = getUserInitials();
              }}
            />
          </div>
        ) : (
          <div className="user-avatar">{getUserInitials()}</div>
        )}
        <div className="user-details">
          <span className="user-name">{user?.prenom} {user?.nom || 'Utilisateur'}</span>
        </div>
      </div>

      <nav className="nav-menu">
        <div className="nav-section">
          <h3 className="nav-section-title">Menu Principal</h3>
          <ul className="nav-list">
            <li className="nav-item">
              <Link to="/dashboard" className={`nav-link ${activeTab === null ? 'active' : ''}`} onClick={() => handleNavClick(null)}>
                <MdDashboard className="nav-icon" />
                <span>Tableau de bord</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="#" className={`nav-link ${activeTab === 'booking' ? 'active' : ''}`} onClick={handleBookingClick}>
                <FaCalendarAlt className="nav-icon" />
                <span>Réserver un rendez-vous</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="#" className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`} onClick={(e) => {
                e.preventDefault();
                handleNavClick('appointments');
              }}>
                <FaClipboardList className="nav-icon" />
                <span>Mes rendez-vous</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="nav-section">
          <h3 className="nav-section-title">Mon Compte</h3>
          <ul className="nav-list">
            <li className="nav-item">
              <Link to="#" className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`} onClick={(e) => {
                e.preventDefault();
                handleNavClick('notifications');
              }}>
                <FaBell className="nav-icon" />
                <span>Notifications</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/user/profile" className="nav-link" onClick={onClose}>
                <FaUserCircle className="nav-icon" />
                <span>Mon profil</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-button" onClick={onLogout}>
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

// Composant de chat intégré directement
const ChatComponent = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="chat-container">
      <button className="close-chat" onClick={onClose}>×</button>
      <div className="chat-wrapper" style={{ width: '100%', height: '100%' }}>
        <SmartChat />
      </div>
    </div>
  );
};

// Composant de recherche intégré directement
const SearchComponent = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="search-overlay">
      <div className="search-container">
        <button className="close-search" onClick={onClose}>×</button>
        <SmartSearch />
      </div>
    </div>
  );
};

// Composant de vue calendrier intégré directement
const CalendarView = ({ appointments, onCancel }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Jours de la semaine pour l'en-tête du calendrier
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Fonctions pour la navigation du calendrier
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Fonctions utilitaires pour le calendrier
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Générer les jours du calendrier
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

  // Obtenir les rendez-vous pour une date spécifique
  const getAppointmentsForDate = (date) => {
    if (!appointments) return [];
    
    return appointments.filter(appointment => {
      const appDate = new Date(appointment.date);
      return appDate.getDate() === date.getDate() &&
             appDate.getMonth() === date.getMonth() &&
             appDate.getFullYear() === date.getFullYear();
    });
  };

  // Formater l'heure pour l'affichage
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="calendar-view">
      <div className="calendar-navigation">
        <button onClick={handlePrevMonth} className="calendar-nav-button">
          <FaChevronLeft /> Mois précédent
        </button>
        <h3 className="calendar-month">
          {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={handleNextMonth} className="calendar-nav-button">
          Mois suivant <FaChevronRight />
        </button>
      </div>
      
      <div className="calendar-grid">
        <div className="calendar-header">
          {weekDays.map((day, index) => (
            <div key={`weekday-${index}`} className="calendar-day-header">{day}</div>
          ))}
        </div>
        
        <div className="calendar-days">
          {generateCalendarDays().map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day.date);
            const hasAppointments = dayAppointments.length > 0;
            
            return (
              <div 
                key={`day-${index}`} 
                className={`calendar-day ${!day.currentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''}`}
              >
                <div className="day-number">{day.day}</div>
                
                {hasAppointments && (
                  <div className="day-appointments">
                    {dayAppointments.map((appointment, appIndex) => (
                      <div 
                        key={`app-${appIndex}`} 
                        className={`day-appointment ${appointment.status.toLowerCase()}`}
                        title={`${appointment.motif} avec ${appointment.professionnel?.prenom} ${appointment.professionnel?.nom}`}
                      >
                        <div className="appointment-time">{formatTime(appointment.date)}</div>
                        <div className="appointment-pro">{appointment.professionnel?.nom}</div>
                        
                        {appointment.status === 'CONFIRME' && new Date(appointment.date) > new Date() && (
                          <button 
                            className="appointment-cancel-btn" 
                            onClick={() => onCancel(appointment._id)}
                            title="Annuler"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { auth } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingWorkflow, setShowBookingWorkflow] = useState(false);
  const [activeTab, setActiveTab] = useState(null); // null = dashboard principal, 'appointments', 'notifications', 'booking'
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [confirmedAppointments, setConfirmedAppointments] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [expiredAppointments, setExpiredAppointments] = useState([]);
  const notificationShownRef = useRef({});
  const [showChat, setShowChat] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [calendarView, setCalendarView] = useState(false); // État pour basculer entre vue liste et vue calendrier
  const [isSidebarVisible, setIsSidebarVisible] = useState(false); // État pour la sidebar mobile

  // Fonction pour basculer la sidebar avec useCallback pour éviter les re-renders
  const toggleSidebar = useCallback(() => {
    console.log('🔄 TOGGLE SIDEBAR - État actuel:', isSidebarVisible);
    setIsSidebarVisible(prev => {
      const newState = !prev;
      console.log('✅ NOUVEAU ÉTAT:', newState);
      return newState;
    });
  }, [isSidebarVisible]);

  // Fonction pour fermer la sidebar
  const closeSidebar = useCallback(() => {
    console.log('❌ FERMETURE SIDEBAR');
    setIsSidebarVisible(false);
  }, []);

  // Effet pour déboguer les changements d'état de la sidebar
  useEffect(() => {
    console.log('📊 ÉTAT SIDEBAR CHANGÉ:', isSidebarVisible);
    // Forcer un re-render du DOM
    const sidebar = document.querySelector('.dashboard-sidebar');
    if (sidebar) {
      if (isSidebarVisible) {
        sidebar.classList.add('visible');
        console.log('✅ Classe "visible" ajoutée');
      } else {
        sidebar.classList.remove('visible');
        console.log('❌ Classe "visible" supprimée');
      }
    }
  }, [isSidebarVisible]);

  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchData();
    }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    // Filtrer les rendez-vous confirmés
    if (appointments && appointments.length > 0) {
      const confirmed = appointments.filter(app => app.status === 'CONFIRME');
      setConfirmedAppointments(confirmed);
      
      // Vérifier les rendez-vous expirés
      const now = new Date();
      const expired = confirmed.filter(app => new Date(app.date) < now);
      setExpiredAppointments(expired);
    }
  }, [appointments]);

  // Vérifier périodiquement les rendez-vous expirés
  useEffect(() => {
    const checkExpiredAppointments = () => {
      const now = new Date();
      
      confirmedAppointments.forEach(appointment => {
        const appointmentDate = new Date(appointment.date);
        
        // Si le rendez-vous est passé et qu'une notification n'a pas encore été montrée
        if (appointmentDate < now && !notificationShownRef.current[appointment._id]) {
          // Marquer cette notification comme montrée
          notificationShownRef.current[appointment._id] = true;
          
          // Afficher une notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Rappel de rendez-vous", {
              body: `Votre rendez-vous avec ${appointment.professionnel?.prenom} ${appointment.professionnel?.nom} a commencé.`,
              icon: "/logo.png"
            });
          } else if ("Notification" in window && Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
              if (permission === "granted") {
                new Notification("Rappel de rendez-vous", {
                  body: `Votre rendez-vous avec ${appointment.professionnel?.prenom} ${appointment.professionnel?.nom} a commencé.`,
                  icon: "/logo.png"
                });
              }
            });
          }
        }
      });
    };
    
    // Vérifier toutes les minutes
    const intervalId = setInterval(checkExpiredAppointments, 60000);
    
    // Vérifier immédiatement au chargement
    checkExpiredAppointments();
    
    return () => clearInterval(intervalId);
  }, [confirmedAppointments]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [profileResponse, appointmentsResponse] = await Promise.all([
        userService.getProfile(),
        userService.getAppointments(),
      ]);
      setUserProfile(profileResponse.data);
      setAppointments(appointmentsResponse.data);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    try {
      await userService.cancelAppointment(id);
      fetchData();
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
    }
  };

  const handleBookingComplete = async (bookingData) => {
    try {
      await userService.createAppointment(bookingData);
      setBookingSuccess(true);
      setShowBookingWorkflow(false);
      setActiveTab(null); // Retour au dashboard principal
      fetchData(); // Rafraîchir les données pour afficher le nouveau rendez-vous
      
      // Réinitialiser le message de succès après 5 secondes
      setTimeout(() => {
        setBookingSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Erreur lors de la création du rendez-vous:', error);
    }
  };

  const handleLogout = () => {
    // Logique de déconnexion
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const toggleChat = () => {
    setShowChat(prevState => !prevState);
  };

  const toggleSearch = () => {
    setShowSearch(prevState => !prevState);
  };

  const toggleCalendarView = () => {
    console.log("Toggling calendar view, current state:", calendarView);
    setCalendarView(prevState => !prevState);
  };

  // Fonction pour calculer le temps restant avant un rendez-vous
  const calculateTimeRemaining = (appointmentDate) => {
    const now = new Date();
    const appDate = new Date(appointmentDate);
    const diffTime = appDate - now;
    
    if (diffTime <= 0) return "Maintenant";
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} jour${diffDays > 1 ? 's' : ''} ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} heure${diffHours > 1 ? 's' : ''} ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  };

  // Formater la date pour l'affichage
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

  const renderHeader = () => (
    <header className="dashboard-header">
      <div className="header-left">
        <button 
          className="sidebar-toggle-button"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          type="button"
        >
          {isSidebarVisible ? <FaTimes /> : <FaBars />}
        </button>
        <h1>Tableau de bord</h1>
      </div>
      <div className="user-info">
        <div className="header-actions">
          <button 
            className="header-action-button"
            onClick={toggleSearch}
            title="Rechercher"
          >
            <FaSearch />
          </button>
          <button 
            className="header-action-button"
            onClick={toggleChat}
            title="Chat"
          >
            <FaComment />
          </button>
        </div>
        <span>
          Bienvenue, {userProfile?.prenom} {userProfile?.nom}
        </span>
      </div>
    </header>
  );

  const renderConfirmedAppointments = () => (
    <div className="confirmed-appointments-section">
      <div className="section-header-with-toggle">
        <h2 className="section-title">Mes prochains rendez-vous</h2>
        <div className="view-toggle-buttons">
          <button 
            className={`view-toggle-button ${!calendarView ? 'active' : ''}`}
            onClick={() => {
              console.log("Switching to list view");
              setCalendarView(false);
            }}
            title="Vue liste"
          >
            <FaListUl />
          </button>
          <button 
            className={`view-toggle-button ${calendarView ? 'active' : ''}`}
            onClick={() => {
              console.log("Switching to calendar view");
              setCalendarView(true);
            }}
            title="Vue calendrier"
          >
            <FaCalendarAlt />
          </button>
        </div>
      </div>
      
      {calendarView ? (
        <CalendarView 
          appointments={appointments} 
          onCancel={handleCancelAppointment} 
        />
      ) : confirmedAppointments.length === 0 ? (
        <div className="no-appointments">
          <p>Vous n'avez pas de rendez-vous confirmés pour le moment.</p>
          <p>Réservez un rendez-vous et attendez la confirmation du professionnel.</p>
          <button 
            className="book-appointment-button"
            onClick={() => {
              setShowBookingWorkflow(true);
              setActiveTab('booking');
            }}
          >
            Réserver un rendez-vous
          </button>
        </div>
      ) : (
        <>
          {/* Vue desktop - cartes */}
          <div className="appointments-grid">
            {confirmedAppointments.map(appointment => {
              const appointmentDate = new Date(appointment.date);
              const now = new Date();
              const isPast = appointmentDate < now;
              
              return (
                <div key={appointment._id} className={`appointment-card ${isPast ? 'past-appointment' : ''}`}>
                  <div className="appointment-header">
                    <span className={`appointment-status ${isPast ? 'status-past' : 'status-confirmed'}`}>
                      {isPast ? 'Passé' : 'Confirmé'}
                    </span>
                    <span className="appointment-date">{formatDate(appointment.date)}</span>
                  </div>
                  <div className="appointment-body">
                    <div className="appointment-detail">
                      <div className="detail-icon">
                        <FaUserMd />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Professionnel</div>
                        <div className="detail-value">{appointment.professionnel?.prenom} {appointment.professionnel?.nom}</div>
                      </div>
                    </div>
                    <div className="appointment-detail">
                      <div className="detail-icon">
                        <FaHistory />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Temps</div>
                        <div className="detail-value">
                          {isPast 
                            ? "Rendez-vous passé" 
                            : `Dans ${calculateTimeRemaining(appointment.date)}`
                          }
                        </div>
                      </div>
                    </div>
                    <div className="appointment-reason">
                      <strong>Motif:</strong> {appointment.motif}
                    </div>
                  </div>
                  {!isPast && (
                    <div className="appointment-footer">
                      <button className="cancel-button" onClick={() => handleCancelAppointment(appointment._id)}>
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Vue mobile - liste compacte */}
          <div className="appointments-list-mobile">
            {confirmedAppointments.map(appointment => {
              const appointmentDate = new Date(appointment.date);
              const now = new Date();
              const isPast = appointmentDate < now;
              
              return (
                <div key={`mobile-${appointment._id}`} className={`appointment-item-mobile ${isPast ? 'past-appointment' : ''}`}>
                  <div className="appointment-mobile-header">
                    <span className={`appointment-mobile-status ${isPast ? 'status-past' : 'status-confirmed'}`}>
                      {isPast ? 'Passé' : 'Confirmé'}
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
                      <FaUserMd className="appointment-mobile-icon" />
                      <span className="appointment-mobile-label">Médecin:</span>
                      <span className="appointment-mobile-value">
                        {appointment.professionnel?.prenom} {appointment.professionnel?.nom}
                      </span>
                    </div>
                    
                    <div className="appointment-mobile-row">
                      <FaHistory className="appointment-mobile-icon" />
                      <span className="appointment-mobile-label">Temps:</span>
                      <span className="appointment-mobile-value">
                        {isPast 
                          ? "Rendez-vous passé" 
                          : `Dans ${calculateTimeRemaining(appointment.date)}`
                        }
                      </span>
                    </div>
                    
                    <div className="appointment-mobile-reason">
                      <strong>Motif:</strong> {appointment.motif}
                    </div>
                  </div>
                  
                  {!isPast && (
                    <div className="appointment-mobile-actions">
                      <button 
                        className="cancel-button-mobile" 
                        onClick={() => handleCancelAppointment(appointment._id)}
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  if (isLoading) return <div className="loading-state">Chargement...</div>;
  if (error) return <div className="error-state">Une erreur est survenue: {error}</div>;

  return (
    <div className="dashboard-layout">
      {/* Overlay pour fermer la sidebar sur mobile */}
      {isSidebarVisible && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
      
      <Sidebar 
        user={userProfile} 
        onLogout={handleLogout} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        setShowBookingWorkflow={setShowBookingWorkflow}
        isVisible={isSidebarVisible}
        onClose={closeSidebar}
      />
      
      <div className="dashboard-main">
        {renderHeader()}
        
        {/* Composant de recherche */}
        <SearchComponent isOpen={showSearch} onClose={() => setShowSearch(false)} />
        
        {bookingSuccess && (
          <div className="success-message">
            Votre rendez-vous a été réservé avec succès ! Vous recevrez une notification lorsqu'il sera confirmé.
          </div>
        )}
        
        {/* Afficher le contenu en fonction de l'onglet actif */}
        {showBookingWorkflow ? (
          <div className="booking-workflow-section">
            <div className="section-header">
              <h2 className="section-title">Réserver un rendez-vous</h2>
              <button 
                className="close-button"
                onClick={() => {
                  setShowBookingWorkflow(false);
                  setActiveTab(null);
                }}
              >
                &times;
              </button>
            </div>
            <BookingWorkflow onBookingComplete={handleBookingComplete} />
          </div>
        ) : activeTab === 'appointments' ? (
          <div className="appointments-section">
            <div className="section-header">
              <h2 className="section-title">Tous mes rendez-vous</h2>
              <button 
                className="close-button"
                onClick={() => setActiveTab(null)}
              >
                &times;
              </button>
            </div>
            <AppointmentsSection
              appointments={appointments}
              onCancel={handleCancelAppointment}
            />
          </div>
        ) : activeTab === 'notifications' ? (
          <div className="notifications-section">
            <div className="section-header">
              <h2 className="section-title">Notifications</h2>
              <button 
                className="close-button"
                onClick={() => setActiveTab(null)}
              >
                &times;
              </button>
            </div>
            <NotificationsSection />
          </div>
        ) : (
          // Dashboard principal - affiche uniquement les rendez-vous confirmés
          <>
            {renderConfirmedAppointments()}
            
            <div className="quick-actions">
              <button 
                className="action-button"
                onClick={() => {
                  setShowBookingWorkflow(true);
                  setActiveTab('booking');
                }}
              >
                <FaCalendarAlt className="action-icon" />
                <span>Réserver un rendez-vous</span>
              </button>
              
              <button 
                className="action-button"
                onClick={() => setActiveTab('appointments')}
              >
                <FaClipboardList className="action-icon" />
                <span>Voir tous mes rendez-vous</span>
              </button>
              
              <button 
                className="action-button"
                onClick={() => setActiveTab('notifications')}
              >
                <FaBell className="action-icon" />
                <span>Voir mes notifications</span>
              </button>
            </div>
          </>
        )}
        
        {/* Composant de chat */}
        <ChatComponent isOpen={showChat} onClose={() => setShowChat(false)} />
        
        {/* Bouton flottant pour ouvrir le chat */}
        {!showChat && (
          <button 
            className="chat-toggle-button"
            onClick={toggleChat}
            title="Ouvrir le chat"
          >
            <FaComment />
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;