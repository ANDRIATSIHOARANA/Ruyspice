import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProfessionalPublicProfile from './pages/professionnel/ProfessionalPublicProfile';
import Home from './pageAccueil/Home';


// Import des composants d'authentification
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminLogin from './pages/admin/AdminLogin';

// Import des composants utilisateur
import UserDashboard from './pages/utilisateur/Dashboard';
import UserProfile from './pages/utilisateur/Profile';
import BookAppointment from './pages/utilisateur/BookAppointment';

// Import des composants professionnel
import ProfessionalDashboard from './pages/professionnel/Dashboard';
import ProfessionalProfile from './pages/professionnel/Profile';
import Availability from './pages/professionnel/Availability';

// Import des composants admin
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import Categories from './pages/admin/Categories';
import Statistics from './pages/admin/Statistics';
import ProfessionalManagement from './pages/admin/ProfessionalManagement';

// Import du composant PrivateRoute
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Route par défaut */}
          <Route path="/" element={<Home />} />

          {/* Routes publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Routes protégées pour les utilisateurs */}
          <Route element={<PrivateRoute />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/profile" element={<UserProfile />} />
            <Route path="/user/book-appointment" element={<BookAppointment />} />
          </Route>
          
          <Route path="/professional/:id" element={<ProfessionalPublicProfile />} />

          {/* Routes protégées pour les professionnels */}
          <Route element={<PrivateRoute />}>
            <Route path="/professional/dashboard" element={<ProfessionalDashboard />} />
            <Route path="/professional/profile" element={<ProfessionalProfile />} />
            <Route path="/professional/availability" element={<Availability />} />
          </Route>

          

          {/* Routes protégées pour l'admin */}
          <Route element={<PrivateRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/categories" element={<Categories />} />
            <Route path="/admin/statistics" element={<Statistics />} />
            <Route path="/admin/professionals" element={<ProfessionalManagement />} />
          </Route>

          {/* Route pour gérer les URLs non trouvées */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
