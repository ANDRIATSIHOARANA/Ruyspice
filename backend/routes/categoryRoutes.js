const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/auth');

// Routes publiques
router.get('/', categoryController.getAllCategories);

// Routes protégées par authentification
router.use(authMiddleware);

// Middleware pour vérifier que l'utilisateur est un administrateur
const isAdmin = (req, res, next) => {
  if (req.utilisateur.role !== 'ADMIN') {
    return res.status(403).json({ message: "Accès non autorisé" });
  }
  next();
};

// Routes protégées par le rôle administrateur
router.post('/', isAdmin, categoryController.createCategory);
router.put('/:id', isAdmin, categoryController.updateCategory);
router.delete('/:id', isAdmin, categoryController.deleteCategory);

module.exports = router;