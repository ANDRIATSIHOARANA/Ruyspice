import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { professionalService } from '../../services/api';
import { 
  Calendar, Clock, Percent, Bell, 
  Download, ChevronRight, ChevronLeft,
  LogOut, Menu, X, CalendarCheck
} from 'lucide-react';
import authService from '../../services/authService';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import AppointmentsSection from '../../components/professionnel/AppointmentsSection';
import './Dashboard.css';

// Enregistrer les composants ChartJS nécessaires
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

const ProfessionalDashboard = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [successMessage, setSuccessMessage] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Fonction pour basculer le menu mobile
  const toggleMobileMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Toggle mobile menu - État actuel:', isMobileMenuOpen);
    setIsMobileMenuOpen(prev => {
      console.log('Toggle mobile menu - Nouvel état:', !prev);
      return !prev;
    });
  };

  // Fonction pour faire défiler vers les rendez-vous
  const scrollToAppointments = () => {
    // Essayer d'abord avec le sélecteur principal
    const appointmentsContainer = document.querySelector('.appointments-container');
    if (appointmentsContainer) {
      appointmentsContainer.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      // Fallback: essayer de trouver par le titre "Gestion des rendez-vous"
      const titleElement = document.querySelector('h3.section-title');
      if (titleElement && titleElement.textContent.includes('Gestion des rendez-vous')) {
        titleElement.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      } else {
        // Dernier fallback: chercher par texte
        const allH3 = document.querySelectorAll('h3');
        for (let h3 of allH3) {
          if (h3.textContent.includes('Gestion des rendez-vous')) {
            h3.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
            break;
          }
        }
      }
    }
    // Fermer le menu mobile si ouvert
    setIsMobileMenuOpen(false);
  };
  
  // Fonction de déconnexion
  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      authService.logout();
      navigate('/login');
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, currentMonth, currentYear]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      console.log('Début de fetchData');
      
      const [appointmentsResponse, statsResponse, notificationsResponse] = await Promise.all([
        professionalService.getAppointments(),
        professionalService.getStats(),
        professionalService.getNotifications()
      ]);
      
      console.log('Réponses reçues:', {
        appointments: appointmentsResponse,
        stats: statsResponse,
        notifications: notificationsResponse
      });
      
      // S'assurer que les données sont des tableaux
      const appointmentsData = Array.isArray(appointmentsResponse.data) ? appointmentsResponse.data : [];
      setAppointments(appointmentsData);
      
      setStats(statsResponse.data);
      
      // Vérifier la structure de la réponse des notifications
      console.log('Structure de notificationsResponse:', notificationsResponse);
      
      // S'assurer que les données de notification sont un tableau
      let notificationsData = [];
      
      if (notificationsResponse && notificationsResponse.data) {
        console.log('Type de notificationsResponse.data:', typeof notificationsResponse.data);
        
        // Si data.data est un tableau (format {success: true, data: [...]} )
        if (notificationsResponse.data.data && Array.isArray(notificationsResponse.data.data)) {
          console.log('Utilisation de notificationsResponse.data.data (tableau)');
          notificationsData = notificationsResponse.data.data.filter(item => item && typeof item === 'object');
        }
        // Si data est directement un tableau
        else if (Array.isArray(notificationsResponse.data)) {
          console.log('Utilisation de notificationsResponse.data (tableau)');
          notificationsData = notificationsResponse.data.filter(item => item && typeof item === 'object');
        } 
        // Si data contient un champ 'notifications' qui est un tableau
        else if (notificationsResponse.data.notifications && Array.isArray(notificationsResponse.data.notifications)) {
          console.log('Utilisation de notificationsResponse.data.notifications (tableau)');
          notificationsData = notificationsResponse.data.notifications.filter(item => item && typeof item === 'object');
        }
        // Si data est un objet avec une propriété success
        else if (notificationsResponse.data.success === true) {
          console.log('Format avec success=true détecté');
          if (notificationsResponse.data.data && Array.isArray(notificationsResponse.data.data)) {
            console.log('Utilisation de notificationsResponse.data.data');
            notificationsData = notificationsResponse.data.data.filter(item => item && typeof item === 'object');
          } else {
            console.warn('Format de données inattendu:', notificationsResponse.data);
          }
        }
        // Si data est un autre type d'objet
        else if (typeof notificationsResponse.data === 'object') {
          console.log('Traitement de notificationsResponse.data comme objet');
          // Convertir l'objet en tableau et ajouter un ID si nécessaire
          notificationsData = Object.entries(notificationsResponse.data)
            .filter(([key, value]) => value !== null && typeof value === 'object' && key !== 'success') 
            .map(([key, value]) => {
              // S'assurer que chaque notification a un ID unique
              if (!value._id) {
                value._id = key;
              }
              return value;
            });
        }
      }
      
      // Journaliser les notifications pour le débogage
      console.log('Notifications traitées:', notificationsData);
      
      // S'assurer que chaque notification a un ID pour la clé React
      notificationsData = notificationsData.map((notif, index) => {
        if (!notif._id) {
          console.log(`Ajout d'un ID généré pour la notification à l'index ${index}`);
          return { ...notif, _id: `notification-${index}` };
        }
        return notif;
      });
      
      setNotifications(notificationsData);
      
      // Calculer le nombre de notifications non lues
      const unread = notificationsData.filter(notif => notif && !notif.lue).length;
      console.log(`Nombre de notifications non lues: ${unread}`);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      console.error('Détails de l\'erreur:', error.message, error.stack);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
      console.log('Fin de fetchData');
    }
  };

  const handleAppointmentAction = async (id, action) => {
    try {
      if (!id) {
        alert('Erreur: Identifiant de rendez-vous manquant');
        return;
      }
      
      console.log(`Action ${action} sur le rendez-vous ${id}`);
      
      if (action === 'accept') {
        await professionalService.acceptAppointment(id);
      } else if (action === 'reject') {
        await professionalService.rejectAppointment(id);
      } else if (action === 'delete') {
        // Confirmation avant suppression
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
          await professionalService.deleteAppointment(id);
        } else {
          return; // Annulation de la suppression
        }
      }
      
      await fetchData();
      // Afficher un message de succès
      setSuccessMessage(`Le rendez-vous a été ${
        action === 'accept' ? 'accepté' : 
        action === 'reject' ? 'refusé' : 
        'supprimé'
      } avec succès`);
      
      // Effacer le message après 3 secondes
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error(`Erreur lors de l'action ${action}:`, error);
      // Afficher un message d'erreur plus détaillé
      alert(`Erreur lors du traitement de la demande: ${error.response?.data?.message || error.message || 'Erreur inconnue'}`);
    }
  };

  const handleNotificationClick = async (id) => {
    try {
      console.log('Marquage de la notification comme lue, ID:', id);
      
      // Vérifier que l'ID est valide
      if (!id || id.startsWith('notification-')) {
        console.warn('ID de notification non valide:', id);
        console.log('Mise à jour locale sans appel API pour ID:', id);
        // Mettre à jour l'état local sans appel API
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => 
            notif._id === id ? { ...notif, lue: true } : notif
          )
        );
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        return;
      }
      
      console.log('Appel API pour marquer la notification comme lue, ID:', id);
      const response = await professionalService.markNotificationAsRead(id);
      console.log('Réponse de l\'API markNotificationAsRead:', response);
      
      // Mettre à jour l'état local
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif._id === id ? { ...notif, lue: true } : notif
        )
      );
      
      // Mettre à jour le compteur de notifications non lues
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      console.log('Notification marquée comme lue avec succès, nouveau compteur:', unreadCount - 1);
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      console.error('Détails de l\'erreur:', error.message, error.stack);
      // Afficher un message d'erreur à l'utilisateur
      alert('Erreur lors du marquage de la notification comme lue');
    }
  };

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

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Fonction pour naviguer entre les mois
  const navigateMonth = (direction) => {
    let newMonth = currentMonth;
    let newYear = currentYear;
    
    if (direction === 'next') {
      newMonth++;
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
    } else {
      newMonth--;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  // Obtenir le nom du mois actuel
  const getCurrentMonthName = () => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${months[currentMonth]} ${currentYear}`;
  };

  // Générer des données pour les graphiques (si les données réelles ne sont pas disponibles)
  const generateChartData = () => {
    // Données pour le graphique d'évolution des rendez-vous
    const appointmentsChartData = {
      labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
      datasets: [
        {
          label: 'Rendez-vous',
          data: stats?.repartitionJours || [4, 6, 8, 5, 7, 3, 1],
          fill: true,
          backgroundColor: 'rgba(78, 84, 200, 0.1)',
          borderColor: 'rgba(78, 84, 200, 1)',
          tension: 0.4,
          pointBackgroundColor: 'rgba(78, 84, 200, 1)',
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };

    // Données pour le graphique de répartition des statuts
    const statusChartData = {
      labels: ['Confirmés', 'En attente', 'Annulés'],
      datasets: [
        {
          data: [
            stats?.confirmes || appointments.filter(app => app.status === 'CONFIRME').length || 65,
            stats?.enAttente || appointments.filter(app => app.status === 'PENDING').length || 25,
            stats?.annules || appointments.filter(app => app.status === 'ANNULE').length || 10
          ],
          backgroundColor: [
            'rgba(46, 204, 113, 0.8)',
            'rgba(241, 196, 15, 0.8)',
            'rgba(231, 76, 60, 0.8)'
          ],
          borderColor: [
            'rgba(46, 204, 113, 1)',
            'rgba(241, 196, 15, 1)',
            'rgba(231, 76, 60, 1)'
          ],
          borderWidth: 1
        }
      ]
    };

    // Données pour le graphique de tendance mensuelle
    const monthlyTrendData = {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
      datasets: [
        {
          label: 'Rendez-vous 2023',
          data: [12, 19, 15, 25, 22, 30, 28, 25, 30, 28, 32, 35],
          borderColor: 'rgba(78, 84, 200, 1)',
          backgroundColor: 'rgba(78, 84, 200, 0.5)',
          borderWidth: 2,
          type: 'line',
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Taux de confirmation (%)',
          data: [70, 75, 68, 80, 82, 85, 78, 80, 83, 85, 88, 90],
          borderColor: 'rgba(46, 204, 113, 1)',
          backgroundColor: 'rgba(46, 204, 113, 0.5)',
          borderWidth: 2,
          type: 'line',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };

    return {
      appointmentsChartData,
      statusChartData,
      monthlyTrendData
    };
  };

  const { appointmentsChartData, statusChartData, monthlyTrendData } = generateChartData();

  // Options pour les graphiques
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#e1e1e1',
        borderWidth: 1,
        padding: 10,
        boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
        usePointStyle: true
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          precision: 0
        }
      }
    }
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      }
    },
    cutout: '70%'
  };

  const mixedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Nombre de rendez-vous'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Taux de confirmation (%)'
        },
        grid: {
          drawOnChartArea: false
        },
        min: 0,
        max: 100
      }
    }
  };

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <div className="loading-text">Chargement de votre tableau de bord</div>
        <div className="loading-subtext">Nous préparons vos statistiques et rendez-vous...</div>
      </div>
    );
  }

  if (error) {
    return <div className="error-state">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        {/* Bouton hamburger pour mobile */}
        <button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          type="button"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className={`dashboard-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link 
            to="/professional/profile" 
            className="profile-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Gérer mon profil
          </Link>
          <Link 
            to="/professional/availability" 
            className="availability-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Gérer mes disponibilités
          </Link>
          <button 
            onClick={scrollToAppointments}
            className="appointments-scroll-btn"
          >
            <CalendarCheck size={16} />
            <span>Mes rendez-vous</span>
          </button>
        </nav>
        
        <div className="dashboard-actions">
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
          
          <div className="notification-icon" onClick={toggleNotifications}>
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </div>
        </div>
      </div>

      {/* Menu mobile séparé */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-container">
          <div className="mobile-menu-content">
            <Link 
              to="/professional/profile" 
              className="mobile-menu-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Gérer mon profil
            </Link>
            <Link 
              to="/professional/availability" 
              className="mobile-menu-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Gérer mes disponibilités
            </Link>
            <button 
              onClick={scrollToAppointments}
              className="mobile-menu-link mobile-menu-button"
            >
              <CalendarCheck size={20} />
              <span>Mes rendez-vous</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay pour fermer le menu mobile */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Panneau de notifications */}
      {showNotifications && (
        <div className="notifications-panel">
          <h3>Notifications</h3>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="notification-item">
                <div className="notification-content">
                  <p className="notification-message">Aucune notification</p>
                </div>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification._id} 
                  className={`notification-item ${!notification.lue ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification._id)}
                >
                  <div className="notification-content">
                    <p className="notification-message">{notification.contenu}</p>
                    <span className="notification-date">
                      {notification.dateCreation ? formatDate(notification.dateCreation) : 'Date inconnue'}
                    </span>
                  </div>
                  {!notification.lue && (
                    <span className="notification-badge">Nouveau</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Section des statistiques */}
      <div className="stats-section">
        <h3 className="text-2xl font-bold mb-6">Statistiques clés</h3>
        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* KPI 1 : Rendez-vous totaux */}
            <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Total des rendez-vous</p>
                  <p className="text-3xl font-bold">{stats.total || 0}</p>
                </div>
              </div>
            </div>

            {/* KPI 2 : En attente */}
            <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-yellow-500">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">En attente</p>
                  <p className="text-3xl font-bold">{stats.enAttente || 0}</p>
                </div>
              </div>
            </div>

            {/* KPI 3 : Taux de confirmation */}
            <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-green-500">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Percent className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Taux de confirmation</p>
                  <p className="text-3xl font-bold">{stats.tauxConfirmation || 0}%</p>
                  <p className="text-xs text-gray-400 mt-1">
                    ({stats.confirmes || 0} confirmés / {stats.total || 0} total)
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="stats-unavailable">
            <p className="text-center text-gray-600 py-6">
              Vous n'avez pas de statistiques disponibles pour le moment.
            </p>
          </div>
        )}
      </div>

      {/* Section des graphiques */}
      <div className="charts-section">
        <div className="chart-row">
          {/* Graphique 1: Répartition par statut */}
          <div className="chart-container">
            <div className="chart-header">
              <h3>Répartition par statut</h3>
              <div className="chart-actions">
                <button className="chart-action-btn">
                  <Download size={16} />
                  <span>Exporter</span>
                </button>
              </div>
            </div>
            <div className="chart-body">
              {stats ? (
                <Doughnut data={statusChartData} options={doughnutChartOptions} />
              ) : (
                <div className="chart-unavailable">
                  <p>Vous n'avez pas de statistiques disponibles pour le moment.</p>
                </div>
              )}
            </div>
          </div>

          {/* Graphique 2: Rendez-vous par jour de la semaine */}
          <div className="chart-container">
            <div className="chart-header">
              <h3>Rendez-vous par jour</h3>
              <div className="chart-actions">
                <div className="period-selector">
                  <select 
                    value={selectedPeriod} 
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="period-select"
                  >
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                    <option value="year">Cette année</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="chart-body">
              {stats ? (
                <Line data={appointmentsChartData} options={lineChartOptions} />
              ) : (
                <div className="chart-unavailable">
                  <p>Vous n'avez pas de statistiques disponibles pour le moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Graphique 3: Tendance mensuelle */}
        <div className="chart-container full-width">
          <div className="chart-header">
            <h3>Tendance mensuelle</h3>
            <div className="chart-actions">
              <div className="month-navigator">
                <button onClick={() => navigateMonth('prev')} className="month-nav-btn">
                  <ChevronLeft size={16} />
                </button>
                <span className="current-month">{getCurrentMonthName()}</span>
                <button onClick={() => navigateMonth('next')} className="month-nav-btn">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
          <div className="chart-body">
            {stats ? (
              <Bar data={monthlyTrendData} options={mixedChartOptions} />
            ) : (
              <div className="chart-unavailable">
                <p>Vous n'avez pas de statistiques disponibles pour le moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message de succès juste au-dessus de la section des rendez-vous */}
      {successMessage && (
        <div className="success-message" style={{ marginBottom: '20px' }}>
          {successMessage}
        </div>
      )}

      {/* Section des rendez-vous avec le nouveau composant */}
      <AppointmentsSection 
        appointments={appointments} 
        onAppointmentAction={handleAppointmentAction} 
      />
    </div>
  );
};

export default ProfessionalDashboard;