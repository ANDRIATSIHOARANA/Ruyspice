// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middlewares/auth').auth;

// Toutes les routes nécessitent une authentification
router.use(auth);

// Créer une nouvelle notification
router.post('/', async (req, res) => {
    try {
        const notification = new Notification(req.body);
        await notification.save();
        await notification.envoyerNotification();
        res.status(201).json(notification);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Récupérer toutes les notifications de l'utilisateur connecté
router.get('/', async (req, res) => {
    try {
        const notifications = await Notification.find({ destinataire: req.user.id })
            .sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Marquer une notification comme lue
router.put('/:id/lue', async (req, res) => {
    try {
        const notification = await Notification.findOne({ 
            _id: req.params.id, 
            destinataire: req.user.id 
        });
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }
        
        notification.lue = true;
        await notification.save();
        res.json(notification);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Supprimer une notification
router.delete('/:id', async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({ 
            _id: req.params.id, 
            destinataire: req.user.id 
        });
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }
        
        res.json({ message: 'Notification supprimée' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Marquer toutes les notifications comme lues
router.put('/toutes/lues', async (req, res) => {
    try {
        await Notification.updateMany(
            { destinataire: req.user.id, lue: false },
            { lue: true }
        );
        res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
