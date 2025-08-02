const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

// Initialize models
require('../models/index');

// Import routes
const utilisateurRoutes = require('../routes/utilisateurRoutes');
const professionnelRoutes = require('../routes/professionnelRoutes');
const adminRoutes = require('../routes/adminRoutes');
const creneauRoutes = require('../routes/creneauRoutes');
const notificationRoutes = require('../routes/notificationRoutes');
const statistiquesRoutes = require('../routes/statistiquesRoutes');
const categorieRoutes = require('../routes/categorieRoutes');

const app = express();

// Configuration CORS pour Vercel - Accepter tous les domaines Vercel
app.use(cors({
  origin: [
    'https://ruyspice.vercel.app', 
    'https://rdv-project-mskrigtg7-tolojanaharys-projects.vercel.app',
    /^https:\/\/.*\.vercel\.app$/,
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware pour parser le JSON et les formulaires
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuration pour les uploads dans Vercel
const uploadsPath = '/tmp/uploads';
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

const photosPath = path.join(uploadsPath, 'photos');
if (!fs.existsSync(photosPath)) {
  fs.mkdirSync(photosPath, { recursive: true });
}

// Configuration pour servir les fichiers statiques
app.use('/uploads', express.static(uploadsPath));

// Middleware pour déboguer les requêtes API
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  if (req.originalUrl.includes('/profile') && req.method === 'PUT') {
    console.log('Requête PUT /profile détectée');
    console.log('Headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
  }
  next();
});

// Routes API
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/professionnels', professionnelRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/creneaux', creneauRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/statistiques', statistiquesRoutes);
app.use('/api/categories', categorieRoutes);

// Route de santé pour vérifier que l'API fonctionne
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Default route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API RDV App - Vercel Deployment',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/utilisateurs',
      '/api/professionnels',
      '/api/admin',
      '/api/categories'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// Connect to MongoDB
if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connecté à MongoDB');
  })
  .catch(err => {
    console.error('Erreur de connexion MongoDB:', err);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥');
  console.log(err.name, err.message);
});

module.exports = app;