import React, { createContext, useState } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    // Initialisation sécurisée avec une fonction
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        return {
          isAuthenticated: true,
          user,
          token
        };
      } catch (error) {
        // En cas d'erreur de parsing, nettoyer le localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.error('Erreur lors du parsing des données utilisateur:', error);
      }
    }
    
    return {
      isAuthenticated: false,
      user: null,
      token: null
    };
  });

  const login = async (data) => {
    try {
      if (!data.token || !data.user) {
        throw new Error('Données de connexion invalides');
      }
      
      // Sauvegarder dans le localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Mettre à jour l'état
      setAuth({
        isAuthenticated: true,
        user: data.user,
        token: data.token
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
      throw error;
    }
  };

  const logout = () => {
    // Nettoyer le localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Réinitialiser l'état
    setAuth({
      isAuthenticated: false,
      user: null,
      token: null
    });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};