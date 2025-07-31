const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middlewares/auth');

/**
 * Routes pour le chatbot intelligent
 */

// Route pour traiter les requêtes du chat (accessible sans authentification)
router.post('/chat', chatController.processQuery);

// Route pour traiter les requêtes du chat avec contexte utilisateur (nécessite authentification)
router.post('/chat/auth', auth, chatController.processQuery);

module.exports = router;