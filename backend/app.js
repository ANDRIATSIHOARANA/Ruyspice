const express = require('express');
const cors = require('cors');
const categorieRoutes = require('./routes/categorieRoutes');

const app = express();

// Configuration CORS
app.use(cors({
  origin: 'http://localhost:3000', // URL du frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware pour parser le JSON
app.use(express.json());

// Définition des routes
app.use('/api/professionnels', professionnelRoutes);
app.use('/api/categories', categorieRoutes); // Route pour les catégories

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

module.exports = app;
