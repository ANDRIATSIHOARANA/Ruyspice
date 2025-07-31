import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = () => {
  const { auth } = useContext(AuthContext);
  const location = useLocation();

  // Permettre l'accès à la page de login admin
  if (location.pathname === '/admin/login') {
    return <Outlet />;
  }

  // Vérification de l'authentification
  if (!auth || !auth.isAuthenticated || !auth.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = auth.user?.role || 'Utilisateur';
  const currentPath = location.pathname;

  // Vérification des accès selon le rôle
  if (
    (userRole === 'Utilisateur' && !currentPath.startsWith('/user')) ||
    (userRole === 'PROF' && !currentPath.startsWith('/professional')) ||
    (userRole === 'ADMIN' && !currentPath.startsWith('/admin'))
  ) {
    switch (userRole) {
      case 'PROF':
        return <Navigate to="/professional/dashboard" replace />;
      case 'ADMIN':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/user/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default PrivateRoute;