import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { authService } from '../../services/api';
import Toast from '../../components/common/Toast';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import './Login.css';

// Import Firebase dependencies
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';

// Firebase configuration - replace with your own config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

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
  passwordToggle: {
    position: 'absolute',
    right: '15px',
    zIndex: 5,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666666'
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
  },
  passwordInput: {
    width: '100%',
    padding: '15px 45px 15px 45px',
    border: '1px solid #e1e1e1',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    position: 'relative',
    zIndex: 1
  }
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [socialLoginLoading, setSocialLoginLoading] = useState({
    google: false,
    facebook: false
  });

  // Animation d'entrée
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 300);
  }, []);

  // Effet pour l'animation des yeux de l'avatar
  useEffect(() => {
    // Lorsque le mot de passe est modifié, fermer les yeux de l'avatar
    if (credentials.password.length > 0) {
      setIsPasswordFocused(true);
    } else {
      setIsPasswordFocused(false);
    }
  }, [credentials.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');

      if (!credentials.email || !credentials.password) {
        setError('Veuillez remplir tous les champs');
        return;
      }

      const response = await authService.login(credentials);

      if (response.data && response.data.token && response.data.user) {
        const { token, user } = response.data;
        await login({ token, user });
        
        setShowToast(true);

        setTimeout(() => {
          const redirectPath = user.role === 'PROF'
            ? '/professional/dashboard'
            : user.role === 'ADMIN'
              ? '/admin/dashboard'
              : '/user/dashboard';
          navigate(redirectPath);
        }, 1500);
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect');
      
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

  const togglePasswordVisibility = () => {
    // Ajouter un effet d'animation pour les yeux lors du basculement
    // Fermer les yeux brièvement lors du basculement
    setIsPasswordFocused(false);
    
    // Après un court délai, revenir à l'état normal basé sur la présence du mot de passe
    setTimeout(() => {
      if (credentials.password.length > 0) {
        setIsPasswordFocused(true);
      }
    }, 300);
    
    // Basculer l'état de visibilité du mot de passe
    setShowPassword(prevState => !prevState);
  };

  // Fonction pour gérer la connexion avec Google
  const handleGoogleLogin = async () => {
    try {
      setSocialLoginLoading({ ...socialLoginLoading, google: true });
      setError('');
      
      // Connexion avec Google via Firebase
      const result = await signInWithPopup(auth, googleProvider);
      
      // Récupérer les informations de l'utilisateur
      const { user } = result;
      const userData = {
        email: user.email,
        nom: user.displayName?.split(' ')[1] || '',
        prenom: user.displayName?.split(' ')[0] || '',
        providerId: 'google',
        providerUserId: user.uid,
        photoURL: user.photoURL
        // Ne pas spécifier le rôle ici, laissez le backend utiliser la valeur par défaut
      };
      
      console.log('Données utilisateur Google:', userData);
      
      // Envoyer les données au backend pour créer/connecter l'utilisateur
      const response = await authService.socialLogin(userData);
      
      if (response.data && response.data.token && response.data.user) {
        const { token, user: loggedUser } = response.data;
        await login({ token, user: loggedUser });
        
        setShowToast(true);
        
        setTimeout(() => {
          const redirectPath = loggedUser.role === 'PROF'
            ? '/professional/dashboard'
            : loggedUser.role === 'ADMIN'
              ? '/admin/dashboard'
              : '/user/dashboard';
          navigate(redirectPath);
        }, 1500);
      }
    } catch (err) {
      console.error('Erreur de connexion avec Google:', err);
      setError(err.response?.data?.message || 'Échec de la connexion avec Google. Veuillez réessayer.');
      
      // Animer l'erreur
      const errorElement = document.querySelector('.error-message');
      if (errorElement) {
        errorElement.classList.add('shake');
        setTimeout(() => errorElement.classList.remove('shake'), 500);
      }
    } finally {
      setSocialLoginLoading({ ...socialLoginLoading, google: false });
    }
  };

  // Fonction pour gérer la connexion avec Facebook
  const handleFacebookLogin = async () => {
    try {
      setSocialLoginLoading({ ...socialLoginLoading, facebook: true });
      setError('');
      
      // Connexion avec Facebook via Firebase
      const result = await signInWithPopup(auth, facebookProvider);
      
      // Récupérer les informations de l'utilisateur
      const { user } = result;
      const userData = {
        email: user.email,
        nom: user.displayName?.split(' ')[1] || '',
        prenom: user.displayName?.split(' ')[0] || '',
        providerId: 'facebook',
        providerUserId: user.uid,
        photoURL: user.photoURL
        // Ne pas spécifier le rôle ici, laissez le backend utiliser la valeur par défaut
      };
      
      // Envoyer les données au backend pour créer/connecter l'utilisateur
      const response = await authService.socialLogin(userData);
      
      if (response.data && response.data.token && response.data.user) {
        const { token, user: loggedUser } = response.data;
        await login({ token, user: loggedUser });
        
        setShowToast(true);
        
        setTimeout(() => {
          const redirectPath = loggedUser.role === 'PROF'
            ? '/professional/dashboard'
            : loggedUser.role === 'ADMIN'
              ? '/admin/dashboard'
              : '/user/dashboard';
          navigate(redirectPath);
        }, 1500);
      }
    } catch (err) {
      console.error('Erreur de connexion avec Facebook:', err);
      setError('Échec de la connexion avec Facebook. Veuillez réessayer.');
      
      // Animer l'erreur
      const errorElement = document.querySelector('.error-message');
      if (errorElement) {
        errorElement.classList.add('shake');
        setTimeout(() => errorElement.classList.remove('shake'), 500);
      }
    } finally {
      setSocialLoginLoading({ ...socialLoginLoading, facebook: false });
    }
  };

  return (
    <div className={`login-container ${isLoaded ? 'loaded' : ''}`}>
      {showToast && !error && (
        <Toast
          message="Connexion réussie ! Redirection..."
          type="success"
          duration={2000}
          onClose={() => setShowToast(false)}
        />
      )}

      <div className="login-card">
        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="login-header">
          <h2 className="form-title">Connexion</h2>
          <p className="form-subtitle">Heureux de vous revoir ! Connectez-vous à votre compte.</p>
        </div>

        {/* Avatar avec animation */}
        <div className={`avatar ${isPasswordFocused ? 'closed' : 'open'}`}>
          <div className="eyes">
            <div className="eye"></div>
            <div className="eye"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div style={inlineStyles.inputWrapper}>
              <Mail size={18} style={inlineStyles.inputIcon} />
              <input
                id="email"
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                placeholder="Entrez votre email"
                required
                style={inlineStyles.input}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div style={inlineStyles.inputWrapper}>
              <Lock size={18} style={inlineStyles.inputIcon} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="Entrez votre mot de passe"
                required
                style={inlineStyles.passwordInput}
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                style={inlineStyles.passwordToggle}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Se souvenir de moi</label>
            </div>
            <Link to="/forgot-password" className="forgot-password">
              Mot de passe oublié ?
            </Link>
          </div>

          <button type="submit" disabled={isLoading} className="btn-submit">
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Se connecter</span>
              </>
            )}
          </button>
        </form>

        <div className="form-footer">
          <p>Vous n'avez pas de compte ? <Link to="/register">Inscrivez-vous</Link></p>
        </div>

        <div className="social-login">
          <p className="social-text">Ou connectez-vous avec</p>
          <div className="social-buttons">
            <button 
              type="button" 
              className="social-btn google"
              onClick={handleGoogleLogin}
              disabled={socialLoginLoading.google}
            >
              {socialLoginLoading.google ? (
                <span className="loading-spinner small"></span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
              )}
              <span>Google</span>
            </button>
            <button 
              type="button" 
              className="social-btn facebook"
              onClick={handleFacebookLogin}
              disabled={socialLoginLoading.facebook}
            >
              {socialLoginLoading.facebook ? (
                <span className="loading-spinner small"></span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" stroke="#1877F2" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              )}
              <span>Facebook</span>
            </button>
          </div>
        </div>
      </div>

      <div className="login-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
      </div>
    </div>
  );
};

export default Login;
