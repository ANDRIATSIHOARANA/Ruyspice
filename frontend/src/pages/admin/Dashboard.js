
import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { adminService } from '../../services/api';
import { 
  Users, UserCheck, Calendar, CheckCircle, XCircle, Clock, 
  BarChart2, Settings, TrendingUp, TrendingDown, Activity, RefreshCw, 
  List, Grid, Filter, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    utilisateurs: 0,
    professionnels: 0,
    totalUtilisateurs: 0,
    rendezVous: {
      total: 0,
      confirmes: 0,
      annules: 0,
      pending: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [showStats, setShowStats] = useState(true);
  const [trendData, setTrendData] = useState({
    users: { value: 0, isUp: true },
    professionals: { value: 0, isUp: true },
    appointments: { value: 0, isUp: true },
    confirmed: { value: 0, isUp: true },
    cancelled: { value: 0, isUp: false },
    pending: { value: 0, isUp: true }
  });

  useEffect(() => {
    loadDashboardData();
    loadRecentActivities();
  }, []);

  const loadRendezVousStats = async () => {
    try {
      // Récupérer directement tous les rendez-vous
      const appointmentsResponse = await adminService.getAppointments();
      console.log('Données rendez-vous brutes reçues:', appointmentsResponse);
      
      let allAppointments = [];
      
      // Vérifier la structure des données reçues
      if (appointmentsResponse.data && Array.isArray(appointmentsResponse.data.rendezVous)) {
        allAppointments = appointmentsResponse.data.rendezVous;
      } else if (appointmentsResponse.data && Array.isArray(appointmentsResponse.data)) {
        allAppointments = appointmentsResponse.data;
      } else {
        console.error('Format de données rendez-vous inattendu:', appointmentsResponse.data);
        throw new Error('Format de données rendez-vous inattendu');
      }
      
      console.log('Liste complète des rendez-vous:', allAppointments);
      
      // Afficher tous les statuts présents pour le débogage
      const statuses = allAppointments.map(rdv => rdv.status);
      console.log('Tous les statuts présents:', statuses);
      
      // Compter manuellement les rendez-vous par statut
      const confirmes = allAppointments.filter(rdv => rdv.status === "CONFIRME").length;
      const annules = allAppointments.filter(rdv => rdv.status === "ANNULE").length;
      const pending = allAppointments.filter(rdv => rdv.status === "PENDING").length;
      const total = allAppointments.length;
      
      console.log('Nombre de rendez-vous CONFIRME:', confirmes);
      console.log('Nombre de rendez-vous ANNULE:', annules);
      console.log('Nombre de rendez-vous PENDING:', pending);
      console.log('Nombre total de rendez-vous:', total);
      
      // Vérifier si les comptages sont cohérents
      if (confirmes + annules + pending !== total) {
        console.warn('Attention: Certains rendez-vous ont des statuts différents de CONFIRME, ANNULE ou PENDING');
        console.log('Statuts non comptabilisés:', 
          allAppointments.filter(rdv => 
            rdv.status !== "CONFIRME" && 
            rdv.status !== "ANNULE" && 
            rdv.status !== "PENDING"
          ).map(rdv => `${rdv._id}: ${rdv.status}`)
        );
      }
      
      return {
        total: total,
        confirmes: confirmes,
        annules: annules,
        pending: pending
      };
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      throw error;
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer les statistiques du tableau de bord
      const response = await adminService.getDashboardStats();
      console.log('Données statistiques reçues:', response.data);
      
      // Récupérer tous les utilisateurs pour compter correctement par rôle
      try {
        // Récupérer directement tous les utilisateurs sans filtre
        const usersResponse = await adminService.getUsers();
        console.log('Données utilisateurs reçues:', usersResponse.data);
        
        // Vérifier la structure des données reçues
        let allUsers = [];
        
        // Vérifier si les données sont dans usersResponse.data.utilisateurs ou directement dans usersResponse.data
        if (usersResponse.data && Array.isArray(usersResponse.data.utilisateurs)) {
          allUsers = usersResponse.data.utilisateurs;
        } else if (usersResponse.data && Array.isArray(usersResponse.data)) {
          allUsers = usersResponse.data;
        } else {
          console.error('Format de données inattendu:', usersResponse.data);
          throw new Error('Format de données inattendu');
        }
        
        console.log('Liste complète des utilisateurs:', allUsers);
        
        // Afficher tous les rôles présents pour le débogage
        const roles = allUsers.map(user => user.role);
        console.log('Tous les rôles présents:', roles);
        
        // Compter manuellement les utilisateurs par rôle
        const professionnels = allUsers.filter(user => user.role === "PROF").length;
        const utilisateurs = allUsers.filter(user => user.role === "UTILISATEUR").length;
        
        console.log('Nombre d\'utilisateurs avec rôle UTILISATEUR:', utilisateurs);
        console.log('Nombre d\'utilisateurs avec rôle PROF:', professionnels);
        
        // Vérifier si les comptages sont cohérents
        if (professionnels + utilisateurs !== allUsers.length) {
          console.warn('Attention: Certains utilisateurs ont des rôles différents de PROF ou UTILISATEUR');
          console.log('Rôles non comptabilisés:', 
            allUsers.filter(user => user.role !== "PROF" && user.role !== "UTILISATEUR")
              .map(user => `${user._id}: ${user.role}`)
          );
        }
        
        // Récupérer les statistiques des rendez-vous
        try {
          const rendezVousStats = await loadRendezVousStats();
          
          // Mettre à jour les statistiques avec les données corrigées
          const correctedStats = {
            utilisateurs: utilisateurs,
            professionnels: professionnels,
            totalUtilisateurs: allUsers.length,
            rendezVous: rendezVousStats
          };
          
          console.log('Statistiques corrigées:', correctedStats);
          setStats(correctedStats);
          calculateTrends(correctedStats);
          
        } catch (rdvErr) {
          console.error('Erreur lors de la récupération des rendez-vous:', rdvErr);
          
          // Si on ne peut pas récupérer les rendez-vous, utiliser les données originales
          const correctedStats = {
            ...response.data,
            utilisateurs: utilisateurs,
            professionnels: professionnels,
            totalUtilisateurs: allUsers.length
          };
          
          setStats(correctedStats);
          calculateTrends(correctedStats);
        }
        
      } catch (userErr) {
        console.error('Erreur lors de la récupération des utilisateurs:', userErr);
        // Continuer avec les statistiques originales si la récupération des utilisateurs échoue
        setStats(response.data);
        calculateTrends(response.data);
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivities = async () => {
    try {
      // Récupérer les rendez-vous récents
      const appointmentsResponse = await adminService.getAppointments();
      let recentAppointments = [];
      
      if (appointmentsResponse.data && Array.isArray(appointmentsResponse.data.rendezVous)) {
        recentAppointments = appointmentsResponse.data.rendezVous;
      } else if (appointmentsResponse.data && Array.isArray(appointmentsResponse.data)) {
        recentAppointments = appointmentsResponse.data;
      }
      
      // Récupérer les utilisateurs récemment inscrits
      const usersResponse = await adminService.getUsers();
      let recentUsers = [];
      
      if (usersResponse.data && Array.isArray(usersResponse.data.utilisateurs)) {
        recentUsers = usersResponse.data.utilisateurs;
      } else if (usersResponse.data && Array.isArray(usersResponse.data)) {
        recentUsers = usersResponse.data;
      }
      
      // Trier les rendez-vous par date de création (du plus récent au plus ancien)
      recentAppointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Trier les utilisateurs par date de création (si disponible)
      if (recentUsers.length > 0 && recentUsers[0].createdAt) {
        recentUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      
      // Créer des activités à partir des rendez-vous récents
      const appointmentActivities = recentAppointments.slice(0, 5).map(rdv => {
        let type, title, description;
        
        switch(rdv.status) {
          case 'CONFIRME':
            type = 'appointment';
            title = 'Rendez-vous confirmé';
            description = `Rendez-vous entre ${rdv.utilisateur?.prenom || 'Client'} et ${rdv.professionnel?.prenom || 'Professionnel'}`;
            break;
          case 'ANNULE':
            type = 'cancel';
            title = 'Rendez-vous annulé';
            description = `Rendez-vous annulé pour le motif: ${rdv.motif || 'Non spécifié'}`;
            break;
          case 'PENDING':
            type = 'pending';
            title = 'Nouveau rendez-vous';
            description = `Rendez-vous en attente pour le motif: ${rdv.motif || 'Non spécifié'}`;
            break;
          default:
            type = 'appointment';
            title = 'Rendez-vous';
            description = `Rendez-vous créé`;
        }
        
        return {
          id: rdv._id,
          type,
          title,
          description,
          time: formatTimeAgo(new Date(rdv.createdAt || Date.now())),
          data: rdv
        };
      });
      
      // Créer des activités à partir des utilisateurs récemment inscrits
      const userActivities = recentUsers.slice(0, 3).map(user => {
        const type = user.role === 'PROF' ? 'professional' : 'user';
        const title = user.role === 'PROF' ? 'Nouveau professionnel inscrit' : 'Nouvel utilisateur inscrit';
        const description = `${user.prenom || ''} ${user.nom || ''} a créé un compte`;
        
        return {
          id: user._id,
          type,
          title,
          description,
          time: formatTimeAgo(new Date(user.createdAt || Date.now() - Math.random() * 86400000)), // Fallback si pas de createdAt
          data: user
        };
      });
      
      // Combiner et trier toutes les activités par date
      const allActivities = [...appointmentActivities, ...userActivities]
        .sort((a, b) => {
          const dateA = a.data?.createdAt ? new Date(a.data.createdAt) : new Date();
          const dateB = b.data?.createdAt ? new Date(b.data.createdAt) : new Date();
          return dateB - dateA;
        })
        .slice(0, 8); // Limiter à 8 activités
      
      setRecentActivities(allActivities);
    } catch (err) {
      console.error('Erreur lors du chargement des activités récentes:', err);
      
      // En cas d'erreur, utiliser des données simulées minimales
      const fallbackActivities = [
        { 
          id: 1, 
          type: 'user', 
          title: 'Activité du système', 
          description: 'Impossible de charger les activités récentes', 
          time: 'À l\'instant' 
        }
      ];
      
      setRecentActivities(fallbackActivities);
    }
  };

  // Fonction pour calculer les tendances (à remplacer par des données réelles si disponibles)
  const calculateTrends = (data) => {
    // Dans une application réelle, ces tendances seraient calculées à partir de données historiques
    // Pour l'instant, nous utilisons des valeurs aléatoires pour la démonstration
    setTrendData({
      users: { 
        value: Math.floor(Math.random() * 10) + 1, 
        isUp: Math.random() > 0.3 
      },
      professionals: { 
        value: Math.floor(Math.random() * 8) + 1, 
        isUp: Math.random() > 0.3 
      },
      appointments: { 
        value: Math.floor(Math.random() * 15) + 5, 
        isUp: Math.random() > 0.3 
      },
      confirmed: { 
        value: Math.floor(Math.random() * 12) + 3, 
        isUp: Math.random() > 0.3 
      },
      cancelled: { 
        value: Math.floor(Math.random() * 5) + 1, 
        isUp: Math.random() < 0.7 // Plus de chances d'être en baisse (ce qui est positif)
      },
      pending: { 
        value: Math.floor(Math.random() * 7) + 2, 
        isUp: Math.random() > 0.5 
      }
    });
  };

  // Formater le temps écoulé (par exemple "Il y a 5 minutes")
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
      return `Il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
    } else if (diffHour > 0) {
      return `Il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
    } else if (diffMin > 0) {
      return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
    } else {
      return 'À l\'instant';
    }
  };

  const toggleStatsView = () => {
    console.log("Toggling stats view, current state:", showStats);
    setShowStats(prevState => !prevState);
  };

  // Données pour le graphique en camembert des rendez-vous
  const getPieChartData = () => {
    const confirmes = stats?.rendezVous?.confirmes || 0;
    const annules = stats?.rendezVous?.annules || 0;
    const pending = stats?.rendezVous?.pending || 0;
    
    return {
      labels: ['Confirmés', 'Annulés', 'En attente'],
      datasets: [
        {
          data: [confirmes, annules, pending],
          backgroundColor: [
            'rgba(76, 201, 240, 0.8)',
            'rgba(230, 57, 70, 0.8)',
            'rgba(248, 150, 30, 0.8)',
          ],
          borderColor: [
            'rgba(76, 201, 240, 1)',
            'rgba(230, 57, 70, 1)',
            'rgba(248, 150, 30, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Données pour le graphique en camembert des utilisateurs par rôle
  const getUsersPieChartData = () => {
    const utilisateurs = stats?.utilisateurs || 0;
    const professionnels = stats?.professionnels || 0;
    
    return {
      labels: ['Clients (UTILISATEUR)', 'Professionnels (PROF)'],
      datasets: [
        {
          data: [utilisateurs, professionnels],
          backgroundColor: [
            'rgba(67, 97, 238, 0.8)',
            'rgba(247, 37, 133, 0.8)',
          ],
          borderColor: [
            'rgba(67, 97, 238, 1)',
            'rgba(247, 37, 133, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Répartition des rendez-vous par statut',
        font: {
          size: 16
        },
        padding: {
          bottom: 15
        }
      }
    }
  };

  const usersPieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Répartition des utilisateurs',
        font: {
          size: 16
        },
        padding: {
          bottom: 15
        }
      }
    }
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'user': return <Users size={20} />;
      case 'appointment': return <Calendar size={20} />;
      case 'cancel': return <XCircle size={20} />;
      case 'professional': return <UserCheck size={20} />;
      case 'pending': return <Clock size={20} />;
      default: return <Activity size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h3><XCircle size={24} /> Erreur</h3>
        <p>{error}</p>
        <button 
          onClick={loadDashboardData}
          className="retry-button"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Débogage final avant le rendu
  console.log('Statistiques finales utilisées pour le rendu:', stats);

  // Calculer les pourcentages pour les statistiques d'utilisateurs
  const totalUsers = (stats?.utilisateurs || 0) + (stats?.professionnels || 0);
  const userPercentage = totalUsers > 0 ? Math.round((stats?.utilisateurs || 0) / totalUsers * 100) : 0;
  const profPercentage = totalUsers > 0 ? Math.round((stats?.professionnels || 0) / totalUsers * 100) : 0;

  // Calculer les pourcentages pour les statistiques de rendez-vous
  const totalRdv = stats?.rendezVous?.total || 0;
  const confirmedPercentage = totalRdv > 0 ? Math.round((stats?.rendezVous?.confirmes || 0) / totalRdv * 100) : 0;
  const cancelledPercentage = totalRdv > 0 ? Math.round((stats?.rendezVous?.annules || 0) / totalRdv * 100) : 0;
  const pendingPercentage = totalRdv > 0 ? Math.round((stats?.rendezVous?.pending || 0) / totalRdv * 100) : 0;

  return (
    <div className="admin-dashboard">
      {/* En-tête du tableau de bord */}
      <div className="dashboard-header">
        <h1>Tableau de Bord Administrateur</h1>
        <p>Gérez votre application et suivez les statistiques en temps réel. Visualisez les tendances et prenez des décisions éclairées.</p>
      </div>

      {/* Actions rapides - DÉPLACÉ AU DÉBUT DE LA PAGE */}
      <div className="quick-actions">
        <Link to="/admin/users" className="action-card">
          <div className="action-icon">
            <Users size={24} />
          </div>
          <div className="action-title">Gérer les Utilisateurs</div>
          <div className="action-description">Voir et modifier les comptes utilisateurs</div>
        </Link>

        <Link to="/admin/professionals" className="action-card">
          <div className="action-icon">
            <UserCheck size={24} />
          </div>
          <div className="action-title">Gérer les Professionnels</div>
          <div className="action-description">Administrer les comptes professionnels</div>
        </Link>

        <Link to="/admin/categories" className="action-card">
          <div className="action-icon">
            <Layers size={24} />
          </div>
          <div className="action-title">Gérer les Catégories</div>
          <div className="action-description">Administrer les catégories de services</div>
        </Link>
      </div>

      {/* Bouton de bascule pour les statistiques */}
      <div className="toggle-view-container">
        <button 
          className={`toggle-view-button ${showStats ? 'active' : ''}`}
          onClick={toggleStatsView}
        >
          {showStats ? (
            <>
              <BarChart2 size={18} /> Masquer les statistiques
            </>
          ) : (
            <>
              <BarChart2 size={18} /> Afficher les statistiques
            </>
          )}
        </button>
      </div>

      {/* Grille de statistiques conditionnelle */}
      {showStats && (
        <div className="stats-grid">
        <div className="stat-card users">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-title">Clients</div>
          <div className="stat-number">
            {stats?.utilisateurs || 0}
            <span>comptes ({userPercentage}%)</span>
          </div>
          <div className={`stat-trend ${trendData.users.isUp ? 'up' : 'down'}`}>
            {trendData.users.isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />} 
            {trendData.users.value}% ce mois
          </div>
        </div>

        <div className="stat-card professionals">
          <div className="stat-icon">
            <UserCheck size={24} />
          </div>
          <div className="stat-title">Professionnels</div>
          <div className="stat-number">
            {stats?.professionnels || 0}
            <span>inscrits ({profPercentage}%)</span>
          </div>
          <div className={`stat-trend ${trendData.professionals.isUp ? 'up' : 'down'}`}>
            {trendData.professionals.isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />} 
            {trendData.professionals.value}% ce mois
          </div>
        </div>

        <div className="stat-card appointments">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-title">Total Rendez-vous</div>
          <div className="stat-number">
            {stats?.rendezVous?.total || 0}
            <span>au total</span>
          </div>
          <div className={`stat-trend ${trendData.appointments.isUp ? 'up' : 'down'}`}>
            {trendData.appointments.isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />} 
            {trendData.appointments.value}% ce mois
          </div>
        </div>

        <div className="stat-card confirmed">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-title">Rendez-vous Confirmés</div>
          <div className="stat-number">
            {stats?.rendezVous?.confirmes || 0}
            <span>confirmés ({confirmedPercentage}%)</span>
          </div>
          <div className={`stat-trend ${trendData.confirmed.isUp ? 'up' : 'down'}`}>
            {trendData.confirmed.isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />} 
            {trendData.confirmed.value}% ce mois
          </div>
        </div>

        <div className="stat-card cancelled">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-title">Rendez-vous Annulés</div>
          <div className="stat-number">
            {stats?.rendezVous?.annules || 0}
            <span>annulés ({cancelledPercentage}%)</span>
          </div>
          <div className={`stat-trend ${trendData.cancelled.isUp ? 'up' : 'down'}`}>
            {trendData.cancelled.isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />} 
            {trendData.cancelled.value}% ce mois
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-title">Rendez-vous En Attente</div>
          <div className="stat-number">
            {stats?.rendezVous?.pending || 0}
            <span>en attente ({pendingPercentage}%)</span>
          </div>
          <div className={`stat-trend ${trendData.pending.isUp ? 'up' : 'down'}`}>
            {trendData.pending.isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />} 
            {trendData.pending.value}% ce mois
          </div>
        </div>
      </div>
      )}

      

      {/* Section des graphiques */}
      <div className="charts-section">
        {/* Graphique de répartition des utilisateurs */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Répartition des Utilisateurs</h3>
            <div className="chart-controls">
              <button className="chart-control-btn" onClick={loadDashboardData}>
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
          <div className="chart-body">
            {(stats?.utilisateurs > 0 || stats?.professionnels > 0) ? (
              <Pie data={getUsersPieChartData()} options={usersPieChartOptions} />
            ) : (
              <div className="no-data-message">
                <Users size={40} color="#6c757d" />
                <p>Aucun utilisateur à afficher</p>
              </div>
            )}
          </div>
        </div>

        {/* Graphique de répartition des rendez-vous */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Répartition des Rendez-vous</h3>
            <div className="chart-controls">
              <button className="chart-control-btn" onClick={loadDashboardData}>
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
          <div className="chart-body">
            {stats?.rendezVous?.total > 0 ? (
              <Pie data={getPieChartData()} options={pieChartOptions} />
            ) : (
              <div className="no-data-message">
                <Calendar size={40} color="#6c757d" />
                <p>Aucun rendez-vous à afficher</p>
              </div>
            )}
          </div>
        </div>
      </div>


        {/* Section d'activité récente */}
        <div className="recent-activity">
          <h2>
          <Activity size={24} />
          Activité Récente
        </h2>
        <div className="activity-list">
          {recentActivities.length > 0 ? (
            recentActivities.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-content">
                  <div className={`activity-icon ${activity.type}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="activity-details">
                    <h4>{activity.title}</h4>
                    <p>{activity.description}</p>
                  </div>
                </div>
                <div className="activity-time">{activity.time}</div>
              </div>
            ))
          ) : (
            <div className="no-activity">
              <p>Aucune activité récente à afficher</p>
            </div>
          )}
        </div>
      </div>
     
      {/* Bouton de rafraîchissement */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button 
          onClick={loadDashboardData} 
          className="refresh-button"
        >
          <RefreshCw size={18} /> Actualiser les données
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
