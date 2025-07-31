import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../../services/api';
import Toast from '../../components/common/Toast';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import styles from './Profile.module.css';

const Profile = () => {
  const navigate = useNavigate();

// Fonction pour retourner au dashboard
const handleReturnToDashboard = () => {
  navigate('/user/dashboard');
};
  const [profile, setProfile] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    photo: ''
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [photoPreviewError, setPhotoPreviewError] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Afficher un message toast
  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const loadProfile = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      setPhotoPreviewError(false);
      
      // Récupérer l'URL de la photo depuis localStorage
      const savedPhotoUrl = localStorage.getItem('userPhotoUrl');
      if (savedPhotoUrl) {
        console.log('Photo URL récupérée depuis localStorage:', savedPhotoUrl);
        setPhotoUrl(savedPhotoUrl);
      }
      
      // Charger les données du localStorage
      const storedUser = authService.getCurrentUser();
      if (storedUser) {
        setProfile({
          nom: storedUser.nom || '',
          prenom: storedUser.prenom || '',
          email: storedUser.email || '',
          motDePasse: '',
          photo: storedUser.photo || savedPhotoUrl || ''
        });
      }
      
      // Puis mettre à jour avec les données du serveur
      const response = await userService.getProfile();
      const userData = response.data;
      
      // Si le serveur renvoie une URL de photo, la stocker
      if (userData.photo) {
        localStorage.setItem('userPhotoUrl', userData.photo);
        setPhotoUrl(userData.photo);
      }
      
      setProfile(prev => ({
        ...prev,
        nom: userData.nom || prev.nom,
        prenom: userData.prenom || prev.prenom,
        email: userData.email || prev.email,
        motDePasse: '',
        photo: userData.photo || savedPhotoUrl || prev.photo
      }));
      
      // Mettre à jour le localStorage avec les nouvelles données
      const updatedUser = {
        ...storedUser,
        nom: userData.nom || storedUser.nom,
        prenom: userData.prenom || storedUser.prenom,
        email: userData.email || storedUser.email,
        photo: userData.photo || savedPhotoUrl || storedUser.photo
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
    } catch (error) {
      console.error('Erreur de chargement:', error);
      setError('Erreur lors du chargement du profil');
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const checkToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!checkToken()) return;
    
    try {
      setIsSaving(true);
      setError('');
      setUpdateSuccess(false); // Réinitialiser l'état de succès
      
      // Vérifier les champs obligatoires
      if (!profile.nom.trim() || !profile.prenom.trim() || !profile.email.trim()) {
        throw new Error('Tous les champs obligatoires doivent être remplis');
      }
      
      // Si une photo a été sélectionnée, l'envoyer séparément
      if (photoFile) {
        try {
          const uploadedPhotoUrl = await handlePhotoUpload();
          if (uploadedPhotoUrl) {
            console.log('URL de photo après upload:', uploadedPhotoUrl);
            setPhotoUrl(uploadedPhotoUrl);
          }
        } catch (photoError) {
          console.error('Erreur lors de l\'upload de la photo:', photoError);
          // Continuer avec la mise à jour du profil même si l'upload de la photo échoue
        }
      }
      
      // Préparer les données pour la mise à jour du profil
      const dataToUpdate = {
        nom: profile.nom.trim(),
        prenom: profile.prenom.trim(),
        email: profile.email.trim()
      };
      
      // Ajouter l'URL de la photo si disponible
      if (photoUrl) {
        dataToUpdate.photoPath = photoUrl;
      }
      
      if (profile.motDePasse && profile.motDePasse.trim()) {
        dataToUpdate.motDePasse = profile.motDePasse.trim();
      }
      
      // Mettre à jour le profil
      const response = await userService.updateProfile(dataToUpdate);
      
      if (response) {
        // Mettre à jour le localStorage avec les nouvelles données
        const currentUser = authService.getCurrentUser();
        const updatedUser = { 
          ...currentUser, 
          nom: profile.nom.trim(),
          prenom: profile.prenom.trim(),
          email: profile.email.trim(),
          photo: photoUrl || currentUser.photo
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Réinitialiser le mot de passe
        setProfile(prev => ({
          ...prev,
          motDePasse: ''
        }));
        
        showToastMessage('Profil mis à jour avec succès!', 'success');
        setUpdateSuccess(true); // Activer le message de confirmation
        
        // Faire défiler vers le message de confirmation
        setTimeout(() => {
          const confirmationElement = document.getElementById('update-confirmation');
          if (confirmationElement) {
            confirmationElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } catch (err) {
      console.error('Erreur complète:', err);
      setError(err.message || 'Erreur lors de la mise à jour');
      showToastMessage(err.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type et la taille du fichier
      if (!file.type.startsWith('image/')) {
        showToastMessage('Veuillez sélectionner une image valide', 'error');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        showToastMessage('La taille de l\'image ne doit pas dépasser 5MB', 'error');
        return;
      }
      
      setPhotoFile(file);
      
      // Prévisualisation de l'image
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({
          ...prev,
          photo: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return null;
    
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      
      const response = await userService.uploadPhoto(formData);
      
      if (response.data && response.data.photoUrl) {
        // Mettre à jour le profil avec la nouvelle photo
        const photoUrl = response.data.photoUrl;
        
        setProfile(prev => ({
          ...prev,
          photo: photoUrl
        }));
        
        // Mettre à jour le localStorage
        const currentUser = authService.getCurrentUser();
        const updatedUser = { ...currentUser, photo: photoUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('userPhotoUrl', photoUrl);
        
        // Vérifier l'accessibilité de l'URL de la photo
        debugImageUrl(getPhotoUrl(photoUrl));
        
        showToastMessage('Photo de profil mise à jour avec succès!', 'success');
        
        return photoUrl;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors du téléchargement de la photo:', error);
      showToastMessage('Erreur lors du téléchargement de la photo', 'error');
      throw error;
    } finally {
      setPhotoFile(null);
    }
  };


  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    
    // Si c'est déjà une URL complète ou une image en base64
    if (photoPath.startsWith('http') || photoPath.startsWith('data:image')) {
      return photoPath;
    }
    
    // Construire l'URL complète
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Assurer que le chemin commence par /
    const normalizedPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
    
    console.log('Construction de l\'URL de la photo:', `${apiUrl}${normalizedPath}`);
    return `${apiUrl}${normalizedPath}`;
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

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Chargement de votre profil...</p>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      {/* Particules d'animation */}
      <div className={styles.particle}></div>
      <div className={styles.particle}></div>
      <div className={styles.particle}></div>
      <div className={styles.particle}></div>
      
      {showToast && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
      {/* Bouton de retour */}
      <button 
        onClick={handleReturnToDashboard} 
        className={styles.backButton}
      >
        <i className="fas fa-arrow-left"></i> Retour au tableau de bord
      </button>

      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Mon Profil</h1>
          <p className={styles.subtitle}>Gérez vos informations personnelles et vos préférences</p>
        </div>
        
        <div className={styles.profileCard}>
          <div className={styles.photoSection}>
            <div className={styles.photoContainer}>
              {(profile.photo || photoUrl) && !photoPreviewError ? (
                <img 
                  src={getPhotoUrl(photoUrl || profile.photo)} 
                  alt={`${profile.prenom} ${profile.nom}`} 
                  className={styles.profilePhoto}
                  onLoad={() => {
                    console.log('Image chargée avec succès:', getPhotoUrl(photoUrl || profile.photo));
                  }}
                  onError={(e) => {
                    console.error('Erreur de chargement de l\'image:', e);
                    debugImageUrl(getPhotoUrl(photoUrl || profile.photo));
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
                <i className="fas fa-camera"></i> Changer la photo
              </label>
              <input
                type="file"
                id="photo"
                name="photo"
                onChange={handlePhotoChange}
                accept="image/*"
                className={styles.photoInput}
              />
              {photoFile && (
                <button 
                  type="button" 
                  className={styles.uploadButton}
                  onClick={handlePhotoUpload}
                  disabled={isSaving}
                >
                  <i className="fas fa-upload"></i> Télécharger la photo
                </button>
              )}
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={`${styles.formLabel} ${styles.required}`}>Nom:</label>
              <input
                type="text"
                value={profile.nom}
                onChange={(e) => setProfile({...profile, nom: e.target.value})}
                required
                className={styles.formControl}
                placeholder="Votre nom"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={`${styles.formLabel} ${styles.required}`}>Prénom:</label>
              <input
                type="text"
                value={profile.prenom}
                onChange={(e) => setProfile({...profile, prenom: e.target.value})}
                required
                className={styles.formControl}
                placeholder="Votre prénom"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={`${styles.formLabel} ${styles.required}`}>Email:</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                required
                className={styles.formControl}
                placeholder="votre@email.com"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nouveau mot de passe (optionnel):</label>
              <input
                type="password"
                value={profile.motDePasse}
                onChange={(e) => setProfile({...profile, motDePasse: e.target.value})}
                className={styles.formControl}
                placeholder="Laissez vide pour conserver le mot de passe actuel"
              />
            </div>
            
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <span className={styles.loadingSpinner}></span>
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i> Mettre à jour
                  </>
                )}
              </button>
            </div>
          </form>
          
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
                  Vos informations personnelles ont été mises à jour et enregistrées.
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
      </div>
    </div>
  );
};

export default Profile;
