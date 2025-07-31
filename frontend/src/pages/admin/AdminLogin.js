
import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Toast from '../../components/common/Toast';
import API from '../../services/api';
import { Lock, Mail, Shield, AlertCircle, BarChart2, Users, Calendar } from 'lucide-react';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [credentials, setCredentials] = useState({
    email: '',
    motDePasse: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [animateForm, setAnimateForm] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const wrapperRef = useRef(null);
  const fullText = "Ensemble, faisons avancer votre entreprise aujourd'hui !";

  // Animation à l'entrée
  useEffect(() => {
    setTimeout(() => setAnimateForm(true), 100);
    
    // Démarrer l'animation de frappe directement
    setTimeout(() => {
      setShowTyping(true);
      let index = 0;
      const typeInterval = setInterval(() => {
        if (index < fullText.length) {
          setTypedText(fullText.substring(0, index + 1));
          index++;
        } else {
          clearInterval(typeInterval);
        }
      }, 50); // Vitesse de frappe
    }, 1000); // Délai avant de commencer à taper
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await API.post('/admin/connexion', credentials);
      
      const data = response.data;

      if (data.token && data.admin) {
        // Animation de succès avant redirection
        setAnimateForm(false);
        
        await login({
          token: data.token,
          user: { ...data.admin, role: 'ADMIN' }
        });
        
        setToastMessage('Connexion réussie');
        setShowToast(true);
        
        // Délai pour l'animation avant redirection
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 800);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Identifiants invalides';
      setError(errorMessage);
      setToastMessage(errorMessage);
      setShowToast(true);
      
      // Animation d'erreur
      const formElement = document.querySelector('.admin-login-card');
      formElement.classList.add('shake');
      setTimeout(() => {
        formElement.classList.remove('shake');
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      {showToast && (
        <Toast
          message={toastMessage}
          type={error ? 'error' : 'success'}
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
      
      <div 
        ref={wrapperRef}
        className={`admin-login-wrapper ${animateForm ? 'animate-in' : 'animate-out'}`}
      >
        {/* Fond avec formes animées */}
        <div className="admin-login-background">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
        
        {/* Partie gauche - Centre de contrôle */}
        <div className="admin-login-left">
          {showTyping && (
            <div className="admin-typing-message">
              <div className="typing-indicator"></div>
              <p>{typedText}</p>
            </div>
          )}
          
          <div className="admin-login-logo">
            <Shield size={40} />
          </div>
          
          <h1>Centre de Contrôle</h1>
          
          <div className="admin-features">
            <div className="admin-feature">
              <BarChart2 size={24} />
              <p>Suivez vos performances et analysez vos données en temps réel</p>
            </div>
            <div className="admin-feature">
              <Users size={24} />
              <p>Gérez vos utilisateurs et leurs permissions en toute sécurité</p>
            </div>
            <div className="admin-feature">
              <Calendar size={24} />
              <p>Planifiez et organisez vos rendez-vous efficacement</p>
            </div>
          </div>
          
          <p className="admin-tagline">Votre portail d'administration</p>
        </div>
        
        {/* Partie droite - Formulaire de connexion */}
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-icon">
              <Lock size={32} />
            </div>
            <h2>Connexion Admin</h2>
            <p>Accédez à votre espace d'administration pour gérer votre entreprise</p>
          </div>
          
          
          {error && (
            <div className="error-message">
              <AlertCircle size={24} />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">
                <Mail size={20} />
                Adresse email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                placeholder="Entrez votre adresse email"
                required
                className={error ? 'input-error' : ''}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="motDePasse">
                <Lock size={20} />
                Mot de passe
              </label>
              <input
                type="password"
                id="motDePasse"
                name="motDePasse"
                value={credentials.motDePasse}
                onChange={handleChange}
                placeholder="Entrez votre mot de passe"
                required
                className={error ? 'input-error' : ''}
              />
            </div>
            
            <button 
              type="submit" 
              className={`submit-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loader"></div>
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <span>Se connecter</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
