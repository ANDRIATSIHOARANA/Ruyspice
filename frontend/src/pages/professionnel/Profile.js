import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/api';
import Toast from '../../components/common/Toast';
import authService from '../../services/authService';
import styles from './Profile.module.css';
import { FiChevronLeft } from 'react-icons/fi'; // Importer l'icône de flèche

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    specialites: [],
    description: '',
    photo: '',
    tarif: '0',
    categorieId: null,
    photoPath: ''
  });
  
  // Fonction pour construire l'URL complète de la photo
  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    
    // Vérifier si c'est une chaîne base64
    if (photoPath.startsWith('data:image/')) {
      return photoPath;
    }
    
    // Si l'URL est déjà absolue (commence par http ou https), la retourner telle quelle
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath;
    }
    
    // Sinon, ajouter l'URL de base de l'API
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${apiUrl}${photoPath}`;
  };
  
  const [categories, setCategories] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [specialiteInput, setSpecialiteInput] = useState('');
  const [photoPreviewError, setPhotoPreviewError] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Fonction pour retourner au tableau de bord
  const handleBackToDashboard = () => {
    navigate('/professional/dashboard');
  };

  // Fetch des catégories au chargement
  const loadCategories = useCallback(async () => {
    try {
      const response = await userService.getCategories();
      if (response?.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  }, []);

  // Afficher un message toast
  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Chargement du profil
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setPhotoPreviewError(false);
      
      const response = await userService.getProfile();
      
      if (response?.data) {
        // Récupérer les données du profil
        const profileData = response.data;
        
        // Si le profil a une catégorie, récupérer son ID
        if (profileData.categorie && profileData.categorie._id) {
          profileData.categorieId = profileData.categorie._id;
        }
        
        // Vérifier si la photo existe dans la réponse
        if (profileData.photo) {
          console.log('Photo chargée depuis l\'API:', 
            profileData.photo.substring(0, 30) + '...');
          profileData.photoPath = profileData.photo;
          
          // Mettre à jour le localStorage avec l'URL de la photo
          // Ne pas stocker les images base64 dans localStorage (trop volumineuses)
          if (!profileData.photo.startsWith('data:image/')) {
            localStorage.setItem('userPhotoUrl', profileData.photo);
          }
        } else {
          // Si pas de photo dans la réponse, essayer de récupérer depuis localStorage
          const savedPhotoUrl = localStorage.getItem('userPhotoUrl');
          if (savedPhotoUrl) {
            console.log('Photo récupérée depuis localStorage:', 
              savedPhotoUrl.substring(0, 30) + '...');
            profileData.photo = savedPhotoUrl;
            profileData.photoPath = savedPhotoUrl;
          }
        }
        
        // Normaliser les spécialités
        if (profileData.specialites) {
          // Si c'est une chaîne JSON, la parser
          if (typeof profileData.specialites === 'string') {
            try {
              profileData.specialites = JSON.parse(profileData.specialites);
            } catch (e) {
              console.error('Erreur lors du parsing des spécialités:', e);
              profileData.specialites = [];
            }
          }
          
          // S'assurer que c'est un tableau
          if (!Array.isArray(profileData.specialites)) {
            profileData.specialites = profileData.specialites 
              ? [profileData.specialites] 
              : [];
          }
        } else {
          profileData.specialites = [];
        }
        
        setProfile(profileData);
      } else {
        showToastMessage(response?.message || 'Erreur lors du chargement du profil', 'error');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      
      // Si l'erreur est due à l'authentification, rediriger vers la page de connexion
      if (error.message === 'Session expirée' || error.response?.status === 401) {
        authService.logout();
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProfile();
    loadCategories();
    
    // Charger la catégorie sélectionnée depuis localStorage
    const savedCategoryId = localStorage.getItem('selectedCategoryId');
    if (savedCategoryId) {
      setProfile(prev => ({
        ...prev,
        categorieId: savedCategoryId
      }));
    }
    
    // Charger l'URL de la photo depuis localStorage si disponible
    const savedPhotoUrl = localStorage.getItem('userPhotoUrl');
    if (savedPhotoUrl) {
      setProfile(prev => ({
        ...prev,
        photo: savedPhotoUrl,
        photoPath: savedPhotoUrl
      }));
    }
  }, [loadProfile, loadCategories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToastMessage('La taille de l\'image ne doit pas dépasser 5MB', 'error');
        return;
      }
      
      // Vérifier le type de fichier
      if (!file.type.match('image.*')) {
        showToastMessage('Veuillez sélectionner une image valide', 'error');
        return;
      }
      
      setPhotoFile(file);
      setPhotoPreviewError(false);
      
      // Prévisualisation de la photo
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          setProfile(prev => ({
            ...prev,
            photo: event.target.result
          }));
        } catch (error) {
          console.error('Erreur lors de la prévisualisation:', error);
          setPhotoPreviewError(true);
        }
      };
      reader.onerror = () => {
        console.error('Erreur lors de la lecture du fichier');
        setPhotoPreviewError(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSpecialiteInputChange = (e) => {
    setSpecialiteInput(e.target.value);
  };

  const addSpecialite = () => {
    if (specialiteInput.trim()) {
      // Vérifier si la spécialité existe déjà
      if (profile.specialites.includes(specialiteInput.trim())) {
        showToastMessage('Cette spécialité existe déjà', 'error');
        return;
      }
      
      setProfile(prev => ({
        ...prev,
        specialites: [...prev.specialites, specialiteInput.trim()]
      }));
      setSpecialiteInput('');
    }
  };

  const removeSpecialite = (index) => {
    setProfile(prev => ({
      ...prev,
      specialites: prev.specialites.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setUpdateSuccess(false); // Réinitialiser l'état de succès
      
      const formData = new FormData();
      
      // Ajouter les champs textuels avec conversion explicite des types
      formData.append('nom', profile.nom || '');
      formData.append('prenom', profile.prenom || '');
      formData.append('email', profile.email || '');
      formData.append('description', profile.description || '');
      
      // Conversion explicite du tarif en chaîne
      formData.append('tarif', String(profile.tarif || 0));
      
      // Gestion de categorieId (chaîne vide si non défini)
      formData.append('categorieId', profile.categorieId || '');
      
      // Conversion explicite des spécialités en JSON
      formData.append('specialites', JSON.stringify(profile.specialites || []));
      
      // Ajouter la photo si elle a été modifiée
      if (photoFile) {
        console.log('Envoi de la nouvelle photo:', photoFile.name);
        formData.append('photo', photoFile);
      } else if (profile.photoPath && typeof profile.photoPath === 'string' && !photoPreviewError) {
        // Si c'est un chemin existant et qu'il n'y a pas eu d'erreur, on l'envoie tel quel
        // Ne pas envoyer les données base64 directement, seulement les chemins de fichiers
        if (!profile.photoPath.startsWith('data:image/')) {
          console.log('Utilisation de la photo existante:', 
            profile.photoPath.substring(0, 30) + '...');
          formData.append('photoPath', profile.photoPath);
        }
      }
      
      // Log pour debug (sans afficher les données binaires)
      const formDataEntries = {};
      for (let [key, value] of formData.entries()) {
        if (key === 'photo') {
          formDataEntries[key] = '[File data]';
        } else if (key === 'photoPath' && typeof value === 'string' && value.length > 30) {
          formDataEntries[key] = value.substring(0, 30) + '...';
        } else {
          formDataEntries[key] = value;
        }
      }
      console.log('Données envoyées (FormData):', formDataEntries);
      
      const response = await userService.updateProfile(formData);
      
      if (response.success) {
        showToastMessage('Profil mis à jour avec succès');
        
        // Stocker l'URL de la photo dans le localStorage pour la persistance
        if (response.photoUrl) {
          localStorage.setItem('userPhotoUrl', response.photoUrl);
          console.log('Photo URL sauvegardée:', 
            response.photoUrl.substring(0, 30) + '...');
        }
        
        // Réinitialiser l'état du fichier photo
        setPhotoFile(null);
        setPhotoPreviewError(false);
        
        // Activer le message de confirmation
        setUpdateSuccess(true);
        
        // Faire défiler vers le message de confirmation
        setTimeout(() => {
          const confirmationElement = document.getElementById('update-confirmation');
          if (confirmationElement) {
            confirmationElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
        
        loadProfile(); // Recharger le profil pour avoir les données à jour
      } else {
        showToastMessage(response.message || 'Erreur lors de la mise à jour du profil', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      showToastMessage(error.message || 'Erreur lors de la mise à jour du profil', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className={styles.loadingContainer}>Chargement du profil...</div>;
  }

  return (
    <div className={styles.profileContainer}>
      {showToast && <Toast message={toastMessage} type={toastType} />}
      
      {/* Bouton retour */}
      <button 
        onClick={handleBackToDashboard} 
        className={styles.backButton}
        aria-label="Retour au tableau de bord"
      >
        <FiChevronLeft /> Retour au tableau de bord
      </button>
      
      <h1 className={styles.title}>Mon Profil Professionnel</h1>
      
      <div className={styles.profileCard}>
        <form onSubmit={handleSubmit}>
          <div className={styles.photoSection}>
            <div className={styles.photoContainer}>
              {profile.photo && !photoPreviewError ? (
                <img 
                  src={getPhotoUrl(profile.photo)} 
                  alt={`${profile.prenom} ${profile.nom}`} 
                  className={styles.profilePhoto}
                  onError={(e) => {
                    console.error('Erreur de chargement de l\'image');
                    e.target.onerror = null;
                    e.target.src = '/default-avatar.png';
                    setPhotoPreviewError(true);
                  }}
                />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <span>{profile.prenom?.charAt(0)}{profile.nom?.charAt(0)}</span>
                </div>
              )}
            </div>
            
            <div className={styles.photoUpload}>
              <label htmlFor="photo" className={styles.photoUploadLabel}>
                Changer la photo
              </label>
              <input
                type="file"
                id="photo"
                name="photo"
                onChange={handlePhotoChange}
                accept="image/*"
                className={styles.photoInput}
              />
              {photoPreviewError && (
                <p className={styles.photoError}>
                  Erreur avec l'image. Veuillez en choisir une autre.
                </p>
              )}
            </div>
          </div>
          
          {/* Reste du formulaire inchangé */}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="prenom">Prénom</label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                value={profile.prenom || ''}
                onChange={handleChange}
                className={styles.formControl}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="nom">Nom</label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={profile.nom || ''}
                onChange={handleChange}
                className={styles.formControl}
                required
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email || ''}
              onChange={handleChange}
              className={styles.formControl}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="categorieId">Catégorie professionnelle</label>
            <select
              id="categorieId"
              name="categorieId"
              value={profile.categorieId || ''}
              onChange={(e) => {
                const selectedCategoryId = e.target.value;
                setProfile(prev => ({
                  ...prev,
                  categorieId: selectedCategoryId
                }));
                localStorage.setItem('selectedCategoryId', selectedCategoryId);
              }}
              className={styles.formControl}
              required
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.nom}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label>Spécialités</label>
            <div className={styles.specialitesContainer}>
              {profile.specialites && profile.specialites.map((specialite, index) => (
                <div key={index} className={styles.specialiteTag}>
                  <span>{specialite}</span>
                  <button 
                    type="button" 
                    onClick={() => removeSpecialite(index)}
                    className={styles.removeSpecialite}
                    aria-label="Supprimer cette spécialité"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className={styles.addSpecialiteContainer}>
              <input
                type="text"
                value={specialiteInput}
                onChange={handleSpecialiteInputChange}
                placeholder="Ajouter une spécialité"
                className={styles.specialiteInput}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSpecialite();
                  }
                }}
              />
              <button 
                type="button" 
                onClick={addSpecialite}
                className={styles.addSpecialiteButton}
                aria-label="Ajouter une spécialité"
              >
                +
              </button>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="description">Description professionnelle</label>
            <textarea
              id="description"
              name="description"
              value={profile.description || ''}
              onChange={handleChange}
              className={styles.formControl}
              rows={4}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="tarif">Tarif (Ar)</label>
            <input
              type="number"
              id="tarif"
              name="tarif"
              value={profile.tarif || '0'}
              onChange={handleChange}
              className={styles.formControl}
              min="0"
              step="0.01"
            />
          </div>
          
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSaving}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Message de confirmation après mise à jour réussie */}
      {updateSuccess && (
        <div 
          id="update-confirmation" 
          className={styles.confirmationMessage}
        >
          <div className={styles.confirmationIcon}>
            <i className="fas fa-check-circle"></i>
          </div>
          <div className={styles.confirmationContent}>
            <h3 className={styles.confirmationTitle}>Profil mis à jour avec succès!</h3>
            <p className={styles.confirmationText}>
              Vos informations professionnelles ont été mises à jour et enregistrées.
            </p>
            <button 
              className={styles.confirmationButton}
              onClick={() => setUpdateSuccess(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
