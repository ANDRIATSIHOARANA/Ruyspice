const express = require('express');
const router = express.Router();
const categorieController = require('../controllers/categorieController');
const { authenticateToken } = require('../middlewares/auth');

// Routes publiques
router.get('/', categorieController.getAllCategories);
router.get('/:id', categorieController.getCategorieById);
router.get('/:id/professionnels', categorieController.getProfessionnelsByCategorie);

// Middleware pour vérifier que l'utilisateur est un administrateur
const isAdmin = (req, res, next) => {
  if (req.utilisateur.role !== 'ADMIN') {
    return res.status(403).json({ message: "Accès non autorisé" });
  }
  next();
};

// Application du middleware d'authentification pour toutes les routes protégées suivantes
router.use(authenticateToken);

// Routes protégées (admin uniquement)
router.post('/', isAdmin, categorieController.createCategorie);
router.put('/:id', isAdmin, categorieController.updateCategorie);
router.delete('/:id', isAdmin, categorieController.deleteCategorie);

module.exports = router;
