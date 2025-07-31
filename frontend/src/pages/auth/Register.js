import React, { useState, useEffect } from 'react';
import { authService } from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, UserCheck, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import './Register.css';

// Styles inline pour corriger la superposition des icônes et des champs
const inlineStyles = {
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%'
  },
  inputIcon: {
    position: 'absolute',
    left: '15px',
    color: '#666666',
    zIndex: 5,
    pointerEvents: 'none'
  },
  input: {
    width: '100%',
    padding: '15px 15px 15px 45px',
    border: '1px solid #e1e1e1',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    position: 'relative',
    zIndex: 1
  }
};

const Register = () => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    confirmMotDePasse: '',
    role: 'UTILISATEUR'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formStep, setFormStep] = useState(1);
  const navigate = useNavigate();

  // Animation d'entrée
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 300);
  }, []);

  // Évaluer la force du mot de passe
  useEffect(() => {
    const { motDePasse } = formData;
    let strength = 0;
    
    if (motDePasse.length > 0) strength += 1;
    if (motDePasse.length >= 8) strength += 1;
    if (/[A-Z]/.test(motDePasse)) strength += 1;
    if (/[0-9]/.test(motDePasse)) strength += 1;
    if (/[^A-Za-z0-9]/.test(motDePasse)) strength += 1;
    
    setPasswordStrength(strength);
  }, [formData.motDePasse]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Réinitialiser les messages d'erreur lors de la saisie
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.nom || !formData.prenom) {
      setError('Veuillez remplir tous les champs');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (formData.motDePasse.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    if (formData.motDePasse !== formData.confirmMotDePasse) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (formStep === 1 && validateStep1()) {
      setFormStep(2);
    } else if (formStep === 2 && validateStep2()) {
      setFormStep(3);
    }
  };

  const prevStep = () => {
    setFormStep(formStep - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    const submitData = {
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email,
      password: formData.motDePasse,
      role: formData.role
    };

    try {
      const response = await authService.register(submitData);
      if (response.data) {
        setSuccess('Inscription réussie! Redirection vers la page de connexion...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'inscription';
      setError(errorMessage);
      
      // Animer l'erreur
      const errorElement = document.querySelector('.error-message');
      if (errorElement) {
        errorElement.classList.add('shake');
        setTimeout(() => errorElement.classList.remove('shake'), 500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Faible';
    if (passwordStrength <= 4) return 'Moyen';
    return 'Fort';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'red';
    if (passwordStrength <= 4) return 'orange';
    return 'green';
  };

  const renderFormStep = () => {
    switch (formStep) {
      case 1:
        return (
          <>
            <h2 className="form-title">Créez votre compte</h2>
            <p className="form-subtitle">Étape 1 : Informations personnelles</p>
            
            <div className="form-group">
              <div style={inlineStyles.inputWrapper}>
                <User style={inlineStyles.inputIcon} />
                <input 
                  type="text" 
                  name="nom"
                  value={formData.nom} 
                  onChange={handleChange} 
                  placeholder="Nom" 
                  required 
                  style={inlineStyles.input}
                />
              </div>
            </div>
            
            <div className="form-group">
              <div style={inlineStyles.inputWrapper}>
                <User style={inlineStyles.inputIcon} />
                <input 
                  type="text" 
                  name="prenom"
                  value={formData.prenom} 
                  onChange={handleChange} 
                  placeholder="Prénom" 
                  required 
                  style={inlineStyles.input}
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn-next" onClick={nextStep}>
                Suivant <ArrowRight size={18} />
              </button>
            </div>
          </>
        );
      
      case 2:
        return (
          <>
            <h2 className="form-title">Créez votre compte</h2>
            <p className="form-subtitle">Étape 2 : Adresse email</p>
            
            <div className="form-group">
              <div style={inlineStyles.inputWrapper}>
                <Mail style={inlineStyles.inputIcon} />
                <input 
                  type="email" 
                  name="email"
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="Email" 
                  required 
                  style={inlineStyles.input}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="select-label">Type de compte</label>
              <div className="role-selector">
                <div 
                  className={`role-option ${formData.role === 'UTILISATEUR' ? 'selected' : ''}`}
                  onClick={() => setFormData({...formData, role: 'UTILISATEUR'})}
                >
                  <User size={24} />
                  <span>Utilisateur</span>
                </div>
                <div 
                  className={`role-option ${formData.role === 'PROF' ? 'selected' : ''}`}
                  onClick={() => setFormData({...formData, role: 'PROF'})}
                >
                  <UserCheck size={24} />
                  <span>Professionnel</span>
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn-prev" onClick={prevStep}>
                Retour
              </button>
              <button type="button" className="btn-next" onClick={nextStep}>
                Suivant <ArrowRight size={18} />
              </button>
            </div>
          </>
        );
      
      case 3:
        return (
          <>
            <h2 className="form-title">Créez votre compte</h2>
            <p className="form-subtitle">Étape 3 : Sécurité</p>
            
            <div className="form-group">
              <div style={inlineStyles.inputWrapper}>
                <Lock style={inlineStyles.inputIcon} />
                <input 
                  type="password" 
                  name="motDePasse"
                  value={formData.motDePasse} 
                  onChange={handleChange} 
                  placeholder="Mot de passe" 
                  required 
                  style={inlineStyles.input}
                />
              </div>
              {formData.motDePasse && (
                <div className="password-strength">
                  <div className="strength-bars">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div 
                        key={level}
                        className={`strength-bar ${passwordStrength >= level ? 'active' : ''}`}
                        style={{backgroundColor: passwordStrength >= level ? getPasswordStrengthColor() : ''}}
                      ></div>
                    ))}
                  </div>
                  <span className="strength-text" style={{color: getPasswordStrengthColor()}}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <div style={inlineStyles.inputWrapper}>
                <Lock style={inlineStyles.inputIcon} />
                <input 
                  type="password" 
                  name="confirmMotDePasse"
                  value={formData.confirmMotDePasse} 
                  onChange={handleChange} 
                  placeholder="Confirmer le mot de passe" 
                  required 
                  style={inlineStyles.input}
                />
              </div>
              {formData.motDePasse && formData.confirmMotDePasse && (
                <div className="password-match">
                  {formData.motDePasse === formData.confirmMotDePasse ? (
                    <span className="match-success"><CheckCircle size={16} /> Les mots de passe correspondent</span>
                  ) : (
                    <span className="match-error"><AlertCircle size={16} /> Les mots de passe ne correspondent pas</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn-prev" onClick={prevStep}>
                Retour
              </button>
              <button type="submit" className="btn-submit" disabled={isLoading}>
                {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
              </button>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`register-container ${isLoaded ? 'loaded' : ''}`}>
      <div className="register-card">
        {error && <div className="error-message"><AlertCircle size={18} /> {error}</div>}
        {success && <div className="success-message"><CheckCircle size={18} /> {success}</div>}
        
        <form onSubmit={handleSubmit}>
          {renderFormStep()}
        </form>
        
        <div className="form-steps">
          {[1, 2, 3].map((step) => (
            <div 
              key={step} 
              className={`step-indicator ${formStep === step ? 'active' : ''} ${formStep > step ? 'completed' : ''}`}
            ></div>
          ))}
        </div>
        
        <div className="form-footer">
          <p>Vous avez déjà un compte ? <Link to="/login">Connectez-vous</Link></p>
        </div>
      </div>
      
      <div className="register-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
      </div>
    </div>
  );
};

export default Register;
