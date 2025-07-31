import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminService } from '../../services/api';
import { Link } from 'react-router-dom';
import './UserManagement.css';
import { motion, AnimatePresence } from 'framer-motion';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' ou 'cards'
  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const searchInputRef = useRef(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.prenom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const isUtilisateur = user.role === 'UTILISATEUR';

    return matchesSearch && isUtilisateur;
  });

  // Statistiques des utilisateurs
  const userStats = {
    total: filteredUsers.length,
    actifs: filteredUsers.filter(u => u.statut === 'ACTIF').length,
    inactifs: filteredUsers.filter(u => u.statut === 'INACTIF').length,
    suspendus: filteredUsers.filter(u => u.statut === 'SUSPENDU').length
  };

  // Fonction pour obtenir l'URL de la photo de l'utilisateur
  const getUserPhotoUrl = (user) => {
    if (!user || !user.photo) return null;
    
    // Si c'est déjà une URL complète ou une image en base64
    if (user.photo.startsWith('data:image/') || user.photo.startsWith('http')) {
      return user.photo;
    }
    
    // Utiliser directement l'URL correcte pour les photos
    return `${API_BASE_URL}${user.photo.startsWith('/') ? '' : '/'}${user.photo}`;
  };

  // Obtenir les initiales de l'utilisateur pour l'avatar de secours
  const getUserInitials = (user) => {
    if (!user || !user.nom) return 'U';
    return `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase();
  };

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getUsers({ 
        search: searchTerm,
        role: 'UTILISATEUR'
      });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      setUpdateError('Erreur lors du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Focus sur la recherche au chargement
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleStatusChange = async (userId, newStatus) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);

      if (!userId || !newStatus) {
        throw new Error('Données manquantes');
      }
  
      const validStatuses = ['ACTIF', 'INACTIF', 'SUSPENDU'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error('Statut invalide');
      }
  
      // Mise à jour optimiste
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId ? { 
            ...user, 
            statut: newStatus,
            canAccess: newStatus !== 'SUSPENDU',
            canLogin: newStatus === 'ACTIF'
          } : user
        )
      );

      // Appel API
      await adminService.updateUser(userId, { 
        statut: newStatus,
        action: 'UPDATE_STATUS'
      });

      // Recharger les données pour confirmer la mise à jour
      await loadUsers();
      
      // Notification de succès
      showNotification('Succès', 'Statut mis à jour avec succès', 'success');

    } catch (error) {
      console.error('Erreur détaillée:', error.response?.data);
      setUpdateError(error.message);
      
      // Restaurer l'état précédent en cas d'erreur
      await loadUsers();
      showNotification('Erreur', `Échec de la mise à jour: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const initiateDelete = (user) => {
    setUserToDelete(user);
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    try {
      setIsUpdating(true);
      await adminService.deleteUser(userToDelete._id);
      setShowConfirmModal(false);
      setUserToDelete(null);
      await loadUsers();
      showNotification('Succès', 'Utilisateur supprimé avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showNotification('Erreur', 'Erreur lors de la suppression de l\'utilisateur', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(selectedUser && selectedUser._id === user._id ? null : user);
  };

  // Fonction pour déboguer les problèmes d'image
  const debugImageUrl = (url) => {
    if (!url) return;
    
    console.log('Débogage de l\'URL d\'image:', url);
    
    // Créer une requête de test pour vérifier si l'image est accessible
    fetch(url, { method: 'HEAD' })
      .then(response => {
        console.log('Statut de l\'image:', response.status, response.statusText);
        if (!response.ok) {
          console.error('L\'image n\'est pas accessible:', url);
        }
      })
      .catch(error => {
        console.error('Erreur lors de la vérification de l\'image:', error);
      });
  };

  // Fonction pour afficher des notifications stylisées (à implémenter avec une bibliothèque comme react-toastify)
  const showNotification = (title, message, type) => {
    // Cette fonction est un placeholder - vous pourriez utiliser react-toastify ou une autre bibliothèque
    // Pour l'instant, on utilise alert comme fallback
    alert(`${title}: ${message}`);
  };

  // Animation variants pour Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ACTIF': return 'var(--success-color)';
      case 'INACTIF': return 'var(--warning-color)';
      case 'SUSPENDU': return 'var(--error-color)';
      default: return 'var(--gray-color)';
    }
  };

  return (
    <div className="user-management-container">
      <motion.div 
        className="page-navigation"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/admin/dashboard" className="back-button">
          <i className="back-icon">←</i>
          <span>Retour au tableau de bord</span>
        </Link>
      </motion.div>

      <motion.div 
        className="user-management-header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h1>Gestion des Utilisateurs</h1>
        <p>Gérez les comptes utilisateurs, leurs statuts et leurs permissions</p>
      </motion.div>

      <motion.div 
        className="user-management-controls"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="search-container">
          <i className="search-icon">🔍</i>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="view-toggle">
          <button 
            className={`view-button ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <i className="view-icon">📋</i>
            
          </button>
          <button 
            className={`view-button ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            <i className="view-icon">📇</i>
           
          </button>
        </div>
      </motion.div>

      <motion.div 
        className="stats-dashboard"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{userStats.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-progress">
            <div className="progress-bar" style={{ width: '100%', backgroundColor: 'var(--primary-color)' }}></div>
          </div>
        </div>
        
        <div className="stat-card active">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{userStats.actifs}</div>
            <div className="stat-label">Actifs</div>
          </div>
          <div className="stat-progress">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${userStats.total ? (userStats.actifs / userStats.total) * 100 : 0}%`,
                backgroundColor: 'var(--success-color)'
              }}
            ></div>
          </div>
        </div>
        
        <div className="stat-card inactive">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{userStats.inactifs}</div>
            <div className="stat-label">Inactifs</div>
          </div>
          <div className="stat-progress">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${userStats.total ? (userStats.inactifs / userStats.total) * 100 : 0}%`,
                backgroundColor: 'var(--warning-color)'
              }}
            ></div>
          </div>
        </div>
        
        <div className="stat-card suspended">
          <div className="stat-icon">🚫</div>
          <div className="stat-content">
            <div className="stat-value">{userStats.suspendus}</div>
            <div className="stat-label">Suspendus</div>
          </div>
          <div className="stat-progress">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${userStats.total ? (userStats.suspendus / userStats.total) * 100 : 0}%`,
                backgroundColor: 'var(--error-color)'
              }}
            ></div>
          </div>
        </div>
      </motion.div>

      {updateError && (
        <motion.div 
          className="error-message"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <i className="error-icon">⚠️</i>
          <span>{updateError}</span>
          <button 
            className="close-error" 
            onClick={() => setUpdateError(null)}
          >
            ×
          </button>
        </motion.div>
      )}

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          >
            Chargement des utilisateurs...
          </motion.p>
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <motion.div 
              className="users-table-container"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Nom complet</th>
                    <th>Email</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user, index) => (
                        <motion.tr 
                          key={user._id} 
                          className={`user-row ${(user.statut || '').toLowerCase()}`}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ 
                            scale: 1.01, 
                            boxShadow: "0 5px 15px rgba(0,0,0,0.1)" 
                          }}
                          onClick={() => handleUserSelect(user)}
                        >
                          <td className="user-name">
                            <div className="avatar">
                              {user.photo ? (
                                <img 
                                  src={getUserPhotoUrl(user)} 
                                  alt={`${user.prenom} ${user.nom}`}
                                  className="user-photo"
                                  onLoad={() => {
                                    console.log('Image chargée avec succès:', getUserPhotoUrl(user));
                                  }}
                                  onError={(e) => {
                                    console.error('Erreur de chargement de l\'image:', e);
                                    debugImageUrl(getUserPhotoUrl(user));
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML = getUserInitials(user);
                                  }}
                                />
                              ) : (
                                getUserInitials(user)
                              )}
                            </div>
                            <div className="user-fullname">
                              <span className="user-lastname">{user.nom || ''}</span>
                              {' '}
                              <span className="user-firstname">{user.prenom || ''}</span>
                            </div>
                          </td>
                          <td className="user-email">{user.email || '-'}</td>
                          <td className="user-status">
                            <span className={`status-badge ${(user.statut || '').toLowerCase()}`}>
                              {user.statut || 'INCONNU'}
                              {user.statut === 'INACTIF' && <small> (Accès limité)</small>}
                              {user.statut === 'SUSPENDU' && <small> (Accès refusé)</small>}
                            </span>
                          </td>
                          <td className="user-actions">
                            <div className="action-container">
                              <select
                                className="status-select"
                                value={user.statut || ''}
                                onChange={(e) => handleStatusChange(user._id, e.target.value)}
                                disabled={isUpdating}
                              >
                                <option value="">Modifier statut</option>
                                <option value="ACTIF">Actif</option>
                                <option value="INACTIF">Inactif</option>
                                <option value="SUSPENDU">Suspendu</option>
                              </select>

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  initiateDelete(user);
                                }}
                                className="delete-button"
                                disabled={isUpdating}
                              >
                                <i className="delete-icon">🗑️</i>
                                <span>Supprimer</span>
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <motion.tr 
                        className="no-results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <td colSpan="4">
                          <div className="no-users-message">
                            <i className="info-icon">ℹ️</i>
                            <p>Aucun utilisateur trouvé</p>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </motion.div>
          ) : (
            <motion.div 
              className="users-cards-container"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredUsers.length > 0 ? (
                <div className="users-grid">
                  <AnimatePresence>
                    {filteredUsers.map((user, index) => (
                      <motion.div 
                        key={user._id}
                        className={`user-card ${(user.statut || '').toLowerCase()} ${selectedUser && selectedUser._id === user._id ? 'selected' : ''}`}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ 
                          scale: 1.03, 
                          boxShadow: "0 10px 25px rgba(0,0,0,0.15)" 
                        }}
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="card-status-indicator" style={{ backgroundColor: getStatusColor(user.statut) }}></div>
                        <div className="card-header">
                          <div className="card-avatar">
                            {user.photo ? (
                              <img 
                                src={getUserPhotoUrl(user)} 
                                alt={`${user.prenom} ${user.nom}`}
                                className="user-photo"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  e.target.parentNode.innerHTML = getUserInitials(user);
                                }}
                              />
                            ) : (
                              getUserInitials(user)
                            )}
                          </div>
                          <div className="card-user-info">
                            <h3 className="card-user-name">
                              {user.prenom || ''} {user.nom || ''}
                            </h3>
                            <p className="card-user-email">{user.email || '-'}</p>
                          </div>
                        </div>
                        
                        <div className="card-status">
                          <span className={`status-badge ${(user.statut || '').toLowerCase()}`}>
                            {user.statut || 'INCONNU'}
                          </span>
                        </div>
                        
                        <div className="card-actions">
                          <select
                            className="status-select"
                            value={user.statut || ''}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleStatusChange(user._id, e.target.value);
                            }}
                            disabled={isUpdating}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Modifier statut</option>
                            <option value="ACTIF">Actif</option>
                            <option value="INACTIF">Inactif</option>
                            <option value="SUSPENDU">Suspendu</option>
                          </select>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              initiateDelete(user);
                            }}
                            className="delete-button"
                            disabled={isUpdating}
                          >
                            <i className="delete-icon">🗑️</i>
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.div 
                  className="no-users-message"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <i className="info-icon">ℹ️</i>
                  <p>Aucun utilisateur trouvé</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </>
      )}

      {/* Modal de confirmation de suppression */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="confirm-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className="modal-header">
                <h3>Confirmer la suppression</h3>
                <button 
                  className="close-modal"
                  onClick={() => setShowConfirmModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userToDelete?.prenom} {userToDelete?.nom}</strong> ?</p>
                <p className="warning-text">Cette action est irréversible.</p>
              </div>
              <div className="modal-footer">
                <button 
                  className="cancel-button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isUpdating}
                >
                  Annuler
                </button>
                <button 
                  className="confirm-button"
                  onClick={handleDelete}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Suppression...' : 'Confirmer la suppression'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Détails de l'utilisateur sélectionné */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            className="user-details-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedUser(null)}
          >
            <motion.div 
              className="user-details-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="details-header">
                <h2>Détails de l'utilisateur</h2>
                <button 
                  className="close-details"
                  onClick={() => setSelectedUser(null)}
                >
                  ×
                </button>
              </div>
              
              <div className="user-profile-header">
                <div className="large-avatar">
                  {selectedUser.photo ? (
                    <img 
                      src={getUserPhotoUrl(selectedUser)} 
                      alt={`${selectedUser.prenom} ${selectedUser.nom}`}
                      className="user-photo"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = getUserInitials(selectedUser);
                      }}
                    />
                  ) : (
                    getUserInitials(selectedUser)
                  )}
                </div>
                <h3>{selectedUser.prenom} {selectedUser.nom}</h3>
                <span className={`status-badge ${(selectedUser.statut || '').toLowerCase()}`}>
                  {selectedUser.statut || 'INCONNU'}
                </span>
              </div>
              
              <div className="user-details-content">
                <div className="detail-item">
                  <div className="detail-label">Email</div>
                  <div className="detail-value">{selectedUser.email || '-'}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Date d'inscription</div>
                  <div className="detail-value">
                    {selectedUser.dateCreation 
                      ? new Date(selectedUser.dateCreation).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'}
                  </div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Dernière connexion</div>
                  <div className="detail-value">
                    {selectedUser.dernierConnexion 
                      ? new Date(selectedUser.dernierConnexion).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Jamais connecté'}
                  </div>
                </div>
              </div>
              
              <div className="user-details-actions">
                <select
                  className="status-select"
                  value={selectedUser.statut || ''}
                  onChange={(e) => handleStatusChange(selectedUser._id, e.target.value)}
                  disabled={isUpdating}
                >
                  <option value="">Modifier statut</option>
                  <option value="ACTIF">Actif</option>
                  <option value="INACTIF">Inactif</option>
                  <option value="SUSPENDU">Suspendu</option>
                </select>

                <button 
                  onClick={() => initiateDelete(selectedUser)}
                  className="delete-button"
                  disabled={isUpdating}
                >
                  <i className="delete-icon">🗑️</i>
                  <span>Supprimer</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;