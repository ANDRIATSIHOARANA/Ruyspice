import axios from 'axios';
import config from '../config/config';

const API = axios.create({
  baseURL: config.API_BASE_URL,
  headers: {
    //'Content-Type': 'application/json'
  }
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
      config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if ((error.response?.status === 403 || error.response?.status === 401) 
        && !error.config.url.includes('/auth/login')) {
      /*if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        //window.location.href = '/login';
      }*/
    }
    return Promise.reject(error);
  }
);

export const userService = {
  updateProfile: async (data) => {
    try {
      // Récupérer l'utilisateur courant pour déterminer son rôle
      const user = authService.getCurrentUser();
      const isProfessional = user?.role === 'PROF';
      
      // Sélectionner l'endpoint approprié selon le rôle
      const endpoint = isProfessional ? '/professionnels/profile' : '/utilisateurs/profile';
      
      // Vérifier si data est une instance de FormData
      const isFormData = data instanceof FormData;
      
      // Configurer les headers en fonction du type de données
      const config = {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };
      
      // Ne pas définir Content-Type pour FormData, le navigateur le fera automatiquement
      if (!isFormData) {
        config.headers['Content-Type'] = 'application/json';
      }
      
      // Traitement des données si ce n'est pas un FormData
      let requestData = data;
      if (!isFormData) {
        // Créer une copie des données pour éviter de modifier l'original
        requestData = { ...data };
        
        // S'assurer que photo est une chaîne ou null
        if (requestData.photo && typeof requestData.photo === 'object') {
          requestData.photo = '';
        }
        
        // Traitement des spécialités
        if (requestData.specialites && Array.isArray(requestData.specialites)) {
          // Assurons-nous que c'est bien un tableau de chaînes
          requestData.specialites = requestData.specialites.map(spec => 
            typeof spec === 'object' && spec.nom ? spec.nom : spec
          );
        } 
        // Si c'est une chaîne, la convertir en tableau
        else if (requestData.specialites && typeof requestData.specialites === 'string') {
          requestData.specialites = requestData.specialites.split(',').map(s => s.trim());
        }
        
        // Log des données JSON pour debug
        console.log(`Données JSON envoyées à ${endpoint}:`, requestData);
      } else {
        // Log des données FormData pour debug
        console.log('Données FormData envoyées:', Object.fromEntries(data.entries()));
        
        // Vérifier si la photo est incluse
        const photoFile = data.get('photo');
        if (photoFile instanceof File) {
          console.log('Photo incluse dans FormData:', photoFile.name, photoFile.type, photoFile.size);
        } else if (data.get('photoPath')) {
          console.log('Chemin de photo existante inclus:', data.get('photoPath'));
        }
        
        // Si c'est un professionnel, vérifier les champs spécifiques
        if (isProfessional) {
          // S'assurer que tarif est bien inclus comme chaîne
          if (data.get('tarif') !== null) {
            console.log('Tarif envoyé:', data.get('tarif'));
          }
          
          // S'assurer que specialites est bien inclus
          if (data.get('specialites') !== null) {
            console.log('Spécialités envoyées:', data.get('specialites'));
          }
          
          // S'assurer que categorieId est bien inclus
          if (data.get('categorieId') !== null) {
            console.log('Catégorie envoyée:', data.get('categorieId'));
          }
        }
        
        console.log(`Données FormData envoyées à ${endpoint}`);
      }
      
      const response = await API.put(endpoint, requestData, config);
      
      if (!response.data) {
        throw new Error('Réponse invalide du serveur');
      }
      
      // Si la réponse contient une URL de photo, la stocker dans localStorage
      if (response.data.photoUrl) {
        localStorage.setItem('userPhotoUrl', response.data.photoUrl);
        console.log('Photo URL sauvegardée dans localStorage:', response.data.photoUrl);
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur updateProfile:', error);
      if (error.response?.status === 401) {
        throw new Error('Session expirée');
      }
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  },

  // Cette méthode est maintenant obsolète car updateProfile gère à la fois JSON et FormData
  // et sélectionne automatiquement le bon endpoint selon le rôle de l'utilisateur
  updateProfileJSON: async (data) => {
    return userService.updateProfile(data);
  },

  uploadPhoto: async (formData) => {
    try {
      // Vérifier que formData est bien une instance de FormData
      if (!(formData instanceof FormData)) {
        throw new Error('Les données doivent être au format FormData');
      }
      
      // Log des données FormData pour debug
      const photoFile = formData.get('photo');
      if (photoFile instanceof File) {
        console.log('Photo à télécharger:', photoFile.name, photoFile.type, photoFile.size);
      } else {
        console.warn('Aucun fichier photo trouvé dans FormData');
      }
      
      // Ne pas définir Content-Type pour FormData, le navigateur le fera automatiquement avec la boundary
      const config = {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };
      
      const response = await API.post('/utilisateurs/upload-photo', formData, config);
      
      // Si la réponse contient une URL de photo, la stocker dans localStorage
      if (response.data && response.data.photo) {
        localStorage.setItem('userPhotoUrl', response.data.photo);
        console.log('Photo URL sauvegardée dans localStorage:', response.data.photo);
        
        // Assurer la compatibilité avec l'ancien format de réponse
        if (!response.data.photoUrl) {
          response.data.photoUrl = response.data.photo;
        }
      }
      
      return response;
    } catch (error) {
      console.error('Erreur uploadPhoto:', error);
      if (error.response?.status === 401) {
        throw new Error('Session expirée');
      }
      throw new Error(error.response?.data?.message || 'Erreur lors du téléchargement de la photo');
    }
  },

  getProfile: () => {
    return API.get('/utilisateurs/profile', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  getCategories: async () => {
    try {
      const response = await API.get('/categories', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des catégories');
    }
  },

  
getAvailableSlots: async (professionalId, date) => {
  try {
      const response = await API.get(
          `/professionnels/${professionalId}/disponibilites?date=${date}&disponible=true`,
          {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
          }
      );
      
      if (!response.data) {
          throw new Error('Aucune disponibilité trouvée');
      }
      
      return {
          data: response.data
      };
  } catch (error) {
      console.error('Erreur lors de la récupération des disponibilités:', error);
      throw error;
  }
},


// Modifier la fonction getAppointments :
getAppointments: async () => {
  try {
    const response = await API.get('/utilisateurs/mes-rendez-vous', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    console.log('Réponse API complète:', response);
    return response;
  } catch (error) {
    console.error('Erreur getAppointments:', error);
    throw error;
  }
},

deleteAppointment: async (id) => {
  try {
    // Vérifier si l'ID est valide
    if (!id) {
      console.error('ID de rendez-vous invalide:', id);
      return Promise.reject(new Error('ID de rendez-vous invalide'));
    }
    
    // Utiliser le bon endpoint pour supprimer un rendez-vous
    const response = await API.delete(`/utilisateurs/rendez-vous/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response;
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    throw error;
  }
},

createAppointment: async (appointmentData) => {
  try {
    const response = await API.post('/utilisateurs/rendez-vous', appointmentData);
    return response;
  } catch (error) {
    console.error('Erreur lors de la création du rendez-vous:', error);
    throw error;
  }
},

cancelAppointment: async (appointmentId) => {
  try {
    const response = await API.put(`/utilisateurs/rendez-vous/${appointmentId}/annuler`);
    return response;
  } catch (error) {
    console.error('Erreur lors de l\'annulation du rendez-vous:', error);
    throw error;
  }
},

  getProfessionals: () => {
    return API.get('/professionnels', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  bookAppointment: (appointmentData) => {
    return API.post('/utilisateurs/rendez-vous', appointmentData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  },

  getProfessional: (id) => {
    return API.get(`/utilisateurs/professionals/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },
  
  getProfessionalsByCategory: async (categoryId) => {
    try {
      const response = await API.get(`/categories/${categoryId}/professionnels`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des professionnels par catégorie:', error);
      throw error;
    }
  },
  
  getAllProfessionals: async () => {
    try {
      const response = await API.get('/professionnels', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des professionnels:', error);
      throw error;
    }
  },

  getProfessionalAvailabilities: async (professionalId) => {
    try {
      // Ajouter un paramètre pour indiquer qu'on veut uniquement les disponibilités non réservées
      const response = await API.get(`/professionnels/${professionalId}/disponibilites?disponible=true`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.data) {
        throw new Error('Aucune disponibilité trouvée');
      }
      
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des disponibilités:', error);
      throw error;
    }
  },

  getAvailability: (professionalId) => {
    return API.get(`/professionnels/${professionalId}/disponibilites?disponible=true`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },
  
  // Ajouter une fonction pour récupérer toutes les disponibilités d'un professionnel (pour le professionnel lui-même)
  getAllProfessionalAvailabilities: async (professionalId) => {
    try {
      const response = await API.get(`/professionnels/${professionalId}/disponibilites?all=true`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.data) {
        throw new Error('Aucune disponibilité trouvée');
      }
      
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des disponibilités:', error);
      throw error;
    }
  }
};
            

export const authService = {
  login: async (credentials) => {
    try {
      const response = await API.post('/utilisateurs/connexion', {
        email: credentials.email,
        password: credentials.password
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response;
    } catch (error) {
      throw error;
    }
  },

  register: async (userData) => {
    try {
      console.log('Données envoyées:', userData); // Pour debug
      const response = await API.post('/utilisateurs/inscription', userData);
      return response;
    } catch (error) {
      console.error('Erreur d\'inscription:', error.response?.data);
      throw error;
    }
  },

  // Nouvelle fonction pour gérer la connexion via réseaux sociaux
  socialLogin: async (userData) => {
    try {
      console.log('Données de connexion sociale envoyées:', userData);
      // Modifiez cette URL pour qu'elle corresponde à votre configuration backend
      const response = await API.post('/utilisateurs/social-login', userData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response;
    } catch (error) {
      console.error('Erreur de connexion sociale:', error.response?.data);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};


export const professionalService = {
  getProfile: () => {
    return API.get('/professionnels/profile', { 
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  updateProfile: async (data) => {
    try {
      // Vérifier si data est une instance de FormData
      const isFormData = data instanceof FormData;
      
      // Configurer les headers en fonction du type de données
      const config = {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };
      
      // Ne pas définir Content-Type pour FormData, le navigateur le fera automatiquement
      if (!isFormData) {
        config.headers['Content-Type'] = 'application/json';
      }
      
      // Si ce n'est pas un FormData, traiter les données
      let requestData = data;
      if (!isFormData) {
        // Créer une copie des données pour éviter de modifier l'original
        requestData = { ...data };
        
        // S'assurer que photo est une chaîne
        if (requestData.photo && typeof requestData.photo === 'object') {
          requestData.photo = '';
        }
        
        // Traitement des spécialités
        if (requestData.specialites && Array.isArray(requestData.specialites)) {
          // Assurons-nous que c'est bien un tableau de chaînes
          requestData.specialites = requestData.specialites.map(spec => 
            typeof spec === 'object' && spec.nom ? spec.nom : spec
          );
        } 
        // Si c'est une chaîne, la convertir en tableau
        else if (requestData.specialites && typeof requestData.specialites === 'string') {
          requestData.specialites = requestData.specialites.split(',').map(s => s.trim());
        }
        
        // Log des données JSON pour debug
        console.log('Données JSON envoyées à /professionnels/profile:', requestData);
      } else {
        // Log des données FormData pour debug de manière sécurisée
        const formDataEntries = {};
        for (let [key, value] of data.entries()) {
          if (key === 'photo') {
            formDataEntries[key] = value instanceof File ? 
              `[File: ${value.name}, ${value.type}, ${value.size} bytes]` : value;
          } else if (key === 'photoPath' && typeof value === 'string' && value.length > 30) {
            formDataEntries[key] = value.substring(0, 30) + '...';
          } else {
            formDataEntries[key] = value;
          }
        }
        console.log('Données FormData envoyées à /professionnels/profile:', formDataEntries);
        
        // Vérifier si la photo est incluse
        const photoFile = data.get('photo');
        if (photoFile instanceof File) {
          console.log('Photo incluse dans FormData:', photoFile.name, photoFile.type, photoFile.size);
        } else if (data.get('photoPath')) {
          console.log('Chemin de photo existante inclus:', data.get('photoPath'));
        }
        
        // Vérifier les champs spécifiques
        if (data.get('tarif') !== null) {
          console.log('Tarif envoyé:', data.get('tarif'));
        }
        
        if (data.get('specialites') !== null) {
          console.log('Spécialités envoyées:', data.get('specialites'));
        }
        
        if (data.get('categorieId') !== null) {
          console.log('Catégorie envoyée:', data.get('categorieId'));
        }
      }
      
      const response = await API.put('/professionnels/profile', requestData, config);
      
      // Si la réponse contient une URL de photo, la stocker dans localStorage
      if (response.data && response.data.photoUrl) {
        localStorage.setItem('userPhotoUrl', response.data.photoUrl);
        console.log('Photo URL sauvegardée dans localStorage:', response.data.photoUrl);
      }
      
      return response;
    } catch (error) {
      console.error('Erreur updateProfile:', error);
      if (error.response?.status === 401) {
        throw new Error('Session expirée');
      }
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    }
  },

  getCategories: () => {
    return API.get('/categories', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  updateCategory: (id, data) => {
    // S'assurer que le tarif est un nombre
    const dataToSend = {
      ...data,
      tarif: typeof data.tarif === 'string' ? parseFloat(data.tarif) : data.tarif
    };
    
    return API.put(`/categories/${id}`, dataToSend, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
  },

  getAppointments: () => {
    return API.get('/professionnels/appointments', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  },
  
  getStats: () => {
    return API.get('/professionnels/stats', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  },

  acceptAppointment: (id) => {
    return API.put(`/professionnels/appointments/${id}/accept`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  },

  rejectAppointment: (id) => {
    return API.put(`/professionnels/appointments/${id}/reject`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  },
  addAvailability: (availability) => {
    return API.post('/professionnels/disponibilites', availability, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
  },

  getAvailabilities: async () => {
    try {
      const response = await API.get('/professionnels/disponibilites', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Vérifier la structure de la réponse
      console.log('Réponse brute getAvailabilities:', response);
      
      // Normaliser la réponse pour toujours renvoyer un tableau
      if (response.data && response.data.success === true && Array.isArray(response.data.data)) {
        return { data: response.data.data };
      } else if (response.data && Array.isArray(response.data)) {
        return { data: response.data };
      } else {
        console.warn('Format de réponse inattendu dans getAvailabilities:', response.data);
        return { data: [] }; // Renvoyer un tableau vide en cas de format inattendu
      }
    } catch (error) {
      console.error('Erreur getAvailabilities:', error);
      throw error;
    }
  },


  deleteAvailability: (id) => {
    return API.delete(`/professionnels/disponibilites/${id}`, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
  },

  getNotifications: () => {
    console.log('Appel de getNotifications');
    return API.get('/professionnels/notifications', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(response => {
      console.log('Réponse de getNotifications:', response);
      return response;
    }).catch(error => {
      console.error('Erreur getNotifications:', error);
      throw error;
    });
  },

  markNotificationAsRead: (id) => {
    // Vérifier que l'ID est valide
    if (!id || typeof id !== 'string') {
      console.error('ID de notification invalide:', id);
      return Promise.reject(new Error('ID de notification invalide'));
    }
    
    // Journaliser pour le débogage
    console.log(`Marquage de la notification ${id} comme lue`);
    
    return API.put(`/professionnels/notifications/${id}/lue`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(response => {
      console.log('Réponse de markNotificationAsRead:', response);
      return response;
    }).catch(error => {
      console.error('Erreur markNotificationAsRead:', error);
      throw error;
    });
  },

  deleteAppointment: (id) => {
    return API.delete(`/professionnels/appointments/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  }
};



export const adminService = {
  getDashboardStats: () => {
    return API.get('/admin/statistiques', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },
  
  getAppointments: () => {
    return API.get('/admin/rendez-vous', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },
  
  getUsers: (params) => {
    return API.get('/admin/utilisateurs', {
      params: { ...params, action: 'LISTER' },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  updateUser: (userId, data) => {
    return API.put(`/admin/utilisateurs/${userId}`, data, { // Envoi direct des données
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
  },

  deleteUser: (userId) => {
    return API.delete(`/admin/utilisateurs/${userId}`, {
      params: { action: 'SUPPRIMER' },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  getProfessionnels: (params) => {
    return API.get('/admin/professionnels', {
      params,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  getProfessionnelsByCategorie: async (categoryId) => {
    try {
      const response = await API.get(`/categories/${categoryId}/professionnels`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des professionnels par catégorie:', error);
      throw error;
    }
  },

  updateProfessional: (id, data) => {
    return API.put(`/admin/professionnels/${id}`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },
  deleteProfessional: (id) => {
    return API.delete(`/admin/professionnels/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },
  
  getCategories: () => {
    return API.get('/categories', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },
  
  getCategoriesWithProfessionnels: async () => {
    try {
      const response = await API.get('/categories-with-professionnels', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des catégories');
    }
  },

  getStatistics: () => {
    return API.get('/statistiques', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },
  
  createCategory: (data) => {
    console.log('Envoi des données pour la création de catégorie:', data);
    
    // S'assurer que le tarif est un nombre
    const dataToSend = {
      ...data,
      tarif: typeof data.tarif === 'string' ? parseFloat(data.tarif) : data.tarif
    };
    
    return API.post('/categories', dataToSend, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
  },
  
  updateCategory: (id, data) => {
    console.log(`Mise à jour de la catégorie ${id} avec les données:`, data);
    
    // S'assurer que le tarif est un nombre
    const dataToSend = {
      ...data,
      tarif: typeof data.tarif === 'string' ? parseFloat(data.tarif) : data.tarif
    };
    
    return API.put(`/categories/${id}`, dataToSend, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
  },
  
  deleteCategory: (id) => {
    return API.delete(`/categories/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },
};

export default API;
