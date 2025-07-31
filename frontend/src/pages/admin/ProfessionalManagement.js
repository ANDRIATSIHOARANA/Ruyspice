import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, 
  FiChevronLeft, 
  FiUser, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiXCircle, 
  FiTrash2, 
  FiGrid, 
  FiList,
  FiEdit,
  FiMail,
  FiRefreshCw
} from 'react-icons/fi';
import './ProfessionalManagement.css';

const ProfessionalManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'table'
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return `http://localhost:5000${photoPath}`;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const isProfessional = user.role === 'PROF';
    
    return matchesSearch && isProfessional;
  });

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getUsers({ 
        role: 'PROF'
      });
      
      setUsers(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      // Notification plus élégante à implémenter
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      setIsUpdating(true);

      if (!id || !newStatus) {
        throw new Error('Données manquantes');
      }

      const validStatuses = ['ACTIF', 'INACTIF', 'SUSPENDU'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error('Statut invalide');
      }

      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === id ? { 
            ...user, 
            statut: newStatus
          } : user
        )
      );

      const response = await adminService.updateUser(id, { 
        statut: newStatus
      });

      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === id ? response.data : user
        )
      );

      // Notification plus élégante
      toast.success('Statut mis à jour avec succès');

    } catch (error) {
      console.error('Erreur:', error);
      await loadUsers();
      toast.error(`Échec de la mise à jour: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await adminService.deleteUser(id);
        await loadUsers();
        // Notification plus élégante
        toast.success('Utilisateur supprimé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'ACTIF': return <FiCheckCircle className="status-icon active" />;
      case 'INACTIF': return <FiAlertCircle className="status-icon inactive" />;
      case 'SUSPENDU': return <FiXCircle className="status-icon suspended" />;
      default: return <FiUser className="status-icon" />;
    }
  };

  // Fonction pour afficher une notification toast
  const toast = {
    success: (message) => {
      // Implémentation à remplacer par une vraie bibliothèque de toast
      console.log('Success:', message);
      alert(message);
    },
    error: (message) => {
      // Implémentation à remplacer par une vraie bibliothèque de toast
      console.error('Error:', message);
      alert(message);
    }
  };

  const renderGridView = () => (
    <AnimatePresence>
      <motion.div 
        className="professionals-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {isLoading ? (
          <div className="loading-container">
            <motion.div 
              className="loading-spinner"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <FiRefreshCw size={30} />
            </motion.div>
            <p>Chargement des professionnels...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <motion.div 
            className="no-results"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <FiUser size={48} />
            <p>Aucun professionnel trouvé</p>
            <button className="refresh-button" onClick={loadUsers}>
              <FiRefreshCw /> Actualiser
            </button>
          </motion.div>
        ) : (
          filteredUsers.map((user, index) => (
            <motion.div 
              key={user._id} 
              className="professional-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * Math.min(index, 5), duration: 0.3 }}
              whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              layout
            >
              <div className="card-banner" />
              <div className="professional-header">
                <div className="professional-avatar">
                  {user.photo ? (
                    <img 
                      src={getPhotoUrl(user.photo)} 
                      alt={`${user.nom || ''} ${user.prenom || ''}`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = `<div class="avatar-initials">${user.nom ? user.nom.charAt(0) : "?"}</div>`;
                      }}
                    />
                  ) : (
                    <div className="avatar-initials">{user.nom ? user.nom.charAt(0) : "?"}</div>
                  )}
                </div>
                <div className="professional-info">
                  <h3>{(user.nom || '') + ' ' + (user.prenom || '')}</h3>
                  <div className="professional-email">
                    <FiMail className="email-icon" />
                    <p>{user.email || '-'}</p>
                  </div>
                  <div className={`professional-status ${(user.statut || '').toLowerCase()}`}>
                    {getStatusIcon(user.statut)}
                    <span>{user.statut || 'INCONNU'}</span>
                  </div>
                </div>
              </div>
              
              <div className="professional-details">
                {user.specialite && (
                  <div className="detail-item">
                    <span className="detail-label">Spécialité:</span>
                    <span className="detail-value">{user.specialite}</span>
                  </div>
                )}
                {user.telephone && (
                  <div className="detail-item">
                    <span className="detail-label">Téléphone:</span>
                    <span className="detail-value">{user.telephone}</span>
                  </div>
                )}
              </div>
              
              <div className="professional-actions">
                <div className="status-selector">
                  <select
                    value={user.statut || ''}
                    onChange={(e) => handleStatusChange(user._id, e.target.value)}
                    disabled={isUpdating}
                    className={`status-select ${(user.statut || '').toLowerCase()}`}
                  >
                    <option value="">Statut</option>
                    <option value="ACTIF">Actif</option>
                    <option value="INACTIF">Inactif</option>
                    <option value="SUSPENDU">Suspendu</option>
                  </select>
                </div>
                
                <motion.button 
                  onClick={() => handleDelete(user._id)}
                  className="delete-button"
                  disabled={isUpdating}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiTrash2 /> Supprimer
                </motion.button>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </AnimatePresence>
  );

  const renderTableView = () => (
    <motion.div 
      className="professionals-table-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      {isLoading ? (
        <div className="loading-container">
          <motion.div 
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <FiRefreshCw size={30} />
          </motion.div>
          <p>Chargement des professionnels...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <motion.div 
          className="no-results"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <FiUser size={48} />
          <p>Aucun professionnel trouvé</p>
          <button className="refresh-button" onClick={loadUsers}>
            <FiRefreshCw /> Actualiser
          </button>
        </motion.div>
      ) : (
        <table className="professionals-table">
          <thead>
            <tr>
              <th>Professionnel</th>
              <th>Email</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <motion.tr 
                key={user._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * Math.min(index, 10), duration: 0.2 }}
                whileHover={{ backgroundColor: "rgba(74, 108, 247, 0.05)" }}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="table-avatar">
                      {user.photo ? (
                        <img 
                          src={getPhotoUrl(user.photo)} 
                          alt={`${user.nom || ''} ${user.prenom || ''}`}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = `<div class="avatar-initials">${user.nom ? user.nom.charAt(0) : "?"}</div>`;
                          }}
                        />
                      ) : (
                        <div className="avatar-initials">{user.nom ? user.nom.charAt(0) : "?"}</div>
                      )}
                    </div>
                    <span>{(user.nom || '') + ' ' + (user.prenom || '')}</span>
                  </div>
                </td>
                <td>{user.email || '-'}</td>
                <td>
                  <div className={`table-status ${(user.statut || '').toLowerCase()}`}>
                    {getStatusIcon(user.statut)}
                    <span>{user.statut || 'INCONNU'}</span>
                  </div>
                </td>
                <td>
                  <div className="table-actions">
                    <select
                      value={user.statut || ''}
                      onChange={(e) => handleStatusChange(user._id, e.target.value)}
                      disabled={isUpdating}
                      className={`status-select ${(user.statut || '').toLowerCase()}`}
                      style={{ marginRight: '0.5rem' }}
                    >
                      <option value="">Statut</option>
                      <option value="ACTIF">Actif</option>
                      <option value="INACTIF">Inactif</option>
                      <option value="SUSPENDU">Suspendu</option>
                    </select>
                    <button 
                      className="table-action-button delete"
                      onClick={() => handleDelete(user._id)}
                      disabled={isUpdating}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      )}
    </motion.div>
  );

  return (
    <motion.div 
      className="admin-dashboard professional-management"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="dashboard-header">
        <motion.button 
          className="back-button"
          onClick={() => navigate(-1)}
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiChevronLeft /> Retour
        </motion.button>
        
        <motion.h1
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
        >
          Gestion des Professionnels
        </motion.h1>
      </div>

      <div className="management-controls">
        <div className={`search-container ${searchFocused ? 'focused' : ''}`}>
          <FiSearch className="search-icon" />
          <motion.input
            type="text"
            placeholder="Rechercher un professionnel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="search-input"
            initial={{ width: "100%" }}
            animate={{ width: searchFocused ? "105%" : "100%" }}
            transition={{ duration: 0.3 }}
          />
          {searchTerm && (
            <motion.button 
              className="clear-search"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={() => setSearchTerm('')}
            >
              ×
            </motion.button>
          )}
        </div>

        <div className="view-toggle">
          <button 
            className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <FiGrid className="view-icon" /> 📇
          </button>
          <button 
            className={`view-button ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <FiList className="view-icon" /> 📋
          </button>
        </div>
      </div>

      <div className="dashboard-stats">
        <motion.div 
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -5 }}
        >
          <div className="stat-icon">
            <FiUser />
          </div>
          <div className="stat-content">
            <h3>Total</h3>
            <p className="stat-value">{filteredUsers.length}</p>
          </div>
        </motion.div>
        
        <motion.div 
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -5 }}
        >
          <div className="stat-icon active">
            <FiCheckCircle />
          </div>
          <div className="stat-content">
            <h3>Actifs</h3>
            <p className="stat-value">
              {filteredUsers.filter(user => user.statut === 'ACTIF').length}
            </p>
          </div>
        </motion.div>
        
        <motion.div 
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ y: -5 }}
        >
          <div className="stat-icon inactive">
            <FiAlertCircle />
          </div>
          <div className="stat-content">
            <h3>Inactifs</h3>
            <p className="stat-value">
              {filteredUsers.filter(user => user.statut === 'INACTIF').length}
            </p>
          </div>
        </motion.div>
      </div>

      {viewMode === 'grid' ? renderGridView() : renderTableView()}
    </motion.div>
  );
};

export default ProfessionalManagement;