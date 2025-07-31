import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash, FiX, FiSave, FiDollarSign, FiInfo, FiAlertCircle, FiSearch, FiFilter, FiArrowLeft } from 'react-icons/fi';
import './Categories.css';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [editMode, setEditMode] = useState(null);
  const [formData, setFormData] = useState({ nom: '', description: '', tarif: '0' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('nom');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' ou 'table'
  const [showForm, setShowForm] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Statistiques simplifiées
  const [totalCategories, setTotalCategories] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      setTotalCategories(categories.length);
    }
  }, [categories]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await adminService.getCategories();
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setCategories(response.data.data);
      } else {
        setCategories([]);
        showNotification('Format de données incorrect', 'error');
      }
    } catch (error) {
      setCategories([]);
      showNotification('Erreur lors du chargement des catégories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tarifNumber = parseFloat(formData.tarif);
    if (isNaN(tarifNumber)) {
      showNotification('Le tarif doit être un nombre valide', 'error');
      return;
    }

    const dataToSend = { ...formData, tarif: tarifNumber };
    try {
      if (editMode) {
        await adminService.updateCategory(editMode, dataToSend);
        showNotification('Catégorie mise à jour avec succès!', 'success');
      } else {
        await adminService.createCategory(dataToSend);
        showNotification('Catégorie ajoutée avec succès!', 'success');
      }
      resetForm();
      loadCategories();
      setShowForm(false);
    } catch (error) {
      showNotification('Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        await adminService.deleteCategory(id);
        showNotification('Catégorie supprimée avec succès!', 'success');
        loadCategories();
      } catch (error) {
        showNotification('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleEdit = (category) => {
    setFormData({
      nom: category.nom || '',
      description: category.description || '',
      tarif: category.tarif !== undefined ? category.tarif.toString() : '0'
    });
    setEditMode(category._id);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ nom: '', description: '', tarif: '0' });
    setEditMode(null);
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedCategories = categories
    .filter(category => 
      category.nom.toLowerCase().includes(filterText.toLowerCase()) || 
      (category.description && category.description.toLowerCase().includes(filterText.toLowerCase()))
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'nom') {
        comparison = a.nom.localeCompare(b.nom);
      } else if (sortBy === 'tarif') {
        comparison = a.tarif - b.tarif;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Variants pour les animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="category-management-container">
      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div 
            className={`notification-toast ${notification.type}`}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <div className="notification-content">
              {notification.type === 'success' ? (
                <FiInfo className="notification-icon" />
              ) : (
                <FiAlertCircle className="notification-icon" />
              )}
              <span>{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton de retour */}
      <div className="page-navigation">
        <Link to="/admin/dashboard" className="back-button">
          <FiArrowLeft className="back-icon" /> Retour au tableau de bord
        </Link>
      </div>

      <div className="category-management-header">
        <h1>Gestion des Catégories</h1>
        <p>Gérez les catégories de services disponibles sur la plateforme</p>
      </div>

      {/* Contrôles */}
      <div className="category-management-controls">
        <div className={`search-container ${searchFocused ? 'focused' : ''}`}>
          <FiSearch className="search-icon" />
          <motion.input
            type="text"
            placeholder="Rechercher une catégorie..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="search-input"
            initial={{ width: "100%" }}
            animate={{ width: searchFocused ? "105%" : "100%" }}
            transition={{ duration: 0.3 }}
          />
          {filterText && (
            <motion.button 
              className="clear-search"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={() => setFilterText('')}
            >
              ×
            </motion.button>
          )}
        </div>

        <div className="action-container">
          <button 
            className="add-button"
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
          >
            {showForm ? <FiX /> : <FiPlus />}
            {showForm ? 'Annuler' : 'Nouvelle catégorie'}
          </button>

          <div className="view-buttons">
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
        </div>
      </div>

      {/* Formulaire */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            className="category-form-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2>{editMode ? 'Modifier la catégorie' : 'Ajouter une nouvelle catégorie'}</h2>
            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    placeholder="Nom de la catégorie"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Description de la catégorie"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Tarif (Ar / heure)</label>
                  <div className="input-with-icon">
                    <FiDollarSign className="input-icon" />
                    <input
                      type="number"
                      name="tarif"
                      min="0"
                      step="0.01"
                      value={formData.tarif}
                      onChange={handleChange}
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-button">
                  {editMode ? (
                    <>
                      <FiSave className="button-icon" /> Mettre à jour
                    </>
                  ) : (
                    <>
                      <FiPlus className="button-icon" /> Ajouter
                    </>
                  )}
                </button>
                
                {editMode && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="cancel-button"
                  >
                    <FiX className="button-icon" /> Annuler
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Affichage des catégories */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des catégories...</p>
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <div className="categories-table-container">
              <table className="categories-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('nom')} className="sortable-header">
                      Nom {sortBy === 'nom' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                    <th>Description</th>
                    <th onClick={() => toggleSort('tarif')} className="sortable-header">
                      Tarif {sortBy === 'tarif' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedCategories.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="no-results">
                        <div className="no-categories-message">
                          <i className="info-icon">ℹ️</i>
                          <p>Aucune catégorie trouvée</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedCategories.map((category) => (
                      <tr key={category._id}>
                        <td className="category-name">{category.nom}</td>
                        <td className="category-description">{category.description || 'Aucune description'}</td>
                        <td className="category-tarif">{category.tarif} Ar / heure</td>
                        <td className="category-actions">
                          <button
                            onClick={() => handleEdit(category)}
                            className="edit-button"
                            title="Modifier"
                          >
                            <FiEdit className="action-icon" />
                          </button>
                          <button
                            onClick={() => handleDelete(category._id)}
                            className="delete-button"
                            title="Supprimer"
                          >
                            <FiTrash className="action-icon" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <motion.div 
              className="categories-cards-container"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="categories-grid">
                <AnimatePresence>
                  {filteredAndSortedCategories.length === 0 ? (
                    <motion.div 
                      className="no-categories-message"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <i className="info-icon">ℹ️</i>
                      <p>Aucune catégorie trouvée</p>
                    </motion.div>
                  ) : (
                    filteredAndSortedCategories.map((category, index) => (
                      <motion.div 
                        key={category._id} 
                        className="category-card"
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -5 }}
                      >
                        <div className="card-status-indicator" style={{ backgroundColor: getTarifColor(category.tarif) }}></div>
                        <div className="card-header">
                          <div className="card-avatar">
                            {category.nom.charAt(0)}
                          </div>
                          <div className="card-category-info">
                            <h3 className="card-category-name">{category.nom}</h3>
                            <p className="card-category-tarif">{category.tarif} Ar / heure</p>
                          </div>
                        </div>
                        <div className="card-description">
                          <p>{category.description || 'Aucune description'}</p>
                        </div>
                        <div className="card-actions">
                          <button
                            onClick={() => handleEdit(category)}
                            className="card-edit-button"
                          >
                            <FiEdit className="button-icon" /> Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(category._id)}
                            className="card-delete-button"
                          >
                            <FiTrash className="button-icon" /> Supprimer
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

// Fonction pour déterminer la couleur en fonction du tarif
const getTarifColor = (tarif) => {
  const numTarif = parseFloat(tarif);
  if (numTarif < 20) return 'var(--success-color)';
  if (numTarif < 50) return 'var(--warning-color)';
  return 'var(--error-color)';
};

export default CategoryList;