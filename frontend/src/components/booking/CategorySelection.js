import React, { useState, useEffect } from 'react';
import { userService } from '../../services/api';
import './CategorySelection.css';

const CategorySelection = ({ onCategorySelect }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await userService.getCategories();
        setCategories(response.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des catégories:', err);
        setError('Impossible de charger les catégories. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des catégories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button 
          className="retry-button" 
          onClick={() => window.location.reload()}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (categories.length === 0) {
    return <div className="empty-container">Aucune catégorie disponible pour le moment.</div>;
  }

  return (
    <div className="categories-container">
      <h2 className="categories-title">Choisissez une catégorie</h2>
      <div className="categories-grid">
        {categories.map(category => (
          <div 
            key={category._id} 
            className="category-card"
            onClick={() => onCategorySelect(category._id)}
          >
            <div className="category-icon">
              {category.nom.charAt(0).toUpperCase()}
            </div>
            <h3 className="category-name">{category.nom}</h3>
            <p className="category-description">{category.description}</p>
            
            <button className="category-select-btn">
              Sélectionner
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySelection;
