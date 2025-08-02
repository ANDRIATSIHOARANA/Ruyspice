// Configuration centralisée pour l'application
const config = {
  // Configuration API
  API_BASE_URL: process.env.REACT_APP_API_URL || (
    process.env.NODE_ENV === 'production' 
      ? '/api' 
      : 'http://localhost:5000/api'
  ),
  
  // Configuration Firebase
  FIREBASE_CONFIG: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-api-key",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "demo-project",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "demo-app-id"
  },
  
  // Configuration de l'environnement
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  
  // Configuration des fonctionnalités
  FEATURES: {
    ENABLE_FIREBASE_AUTH: false, // Désactivé temporairement pour éviter les erreurs
    ENABLE_3D_CHARACTER: true,
    ENABLE_CHAT: true,
    ENABLE_NOTIFICATIONS: true
  }
};

export default config;