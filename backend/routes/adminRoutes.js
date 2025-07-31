const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, authenticateToken } = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

// Connexion admin
router.post('/connexion', adminController.connexion);
router.get('/categories/:id/professionnels', adminController.getProfessionnelsByCategorie);

// Gestion utilisateurs
router.get('/utilisateurs', auth, isAdmin, adminController.listerUtilisateurs);
router.put('/utilisateurs/:userId', auth, isAdmin, adminController.modifierUtilisateur);
router.delete('/utilisateurs/:userId', auth, isAdmin, adminController.supprimerUtilisateur);

// Gestion professionnels
router.get('/professionnels', auth, isAdmin, adminController.listerProfessionnels);
//router.get('/admin/professionnels', auth, adminController.listerProfessionnels);
router.put('/professionnels/:id', adminController.modifierProfessionnel);
router.delete('/professionnels/:id', auth, adminController.supprimerProfessionnel);


// Statistiques
router.get('/statistiques', auth, isAdmin, adminController.voirStatistiques);

// Gestion des rendez-vous
router.get('/rendez-vous', auth, isAdmin, adminController.getAllRendezVous);

// Gestion catégories
router.route('/categories')
  .get(auth, isAdmin, adminController.listerCategories)
  .post(auth, isAdmin, adminController.creerCategorie);

router.route('/categories/:id')
  .put(auth, isAdmin, adminController.modifierCategorie)
  .delete(auth, isAdmin, adminController.supprimerCategorie);

module.exports = router;
