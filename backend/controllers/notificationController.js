const NotificationService = require('../services/notificationService');

/**
 * Récupère toutes les notifications de l'utilisateur connecté
 */
exports.getMesNotifications = async (req, res) => {
  try {
    const notifications = await NotificationService.getNotificationsUtilisateur(req.utilisateur.id);
    res.json(notifications);
  } catch (error) {
    console.error('Erreur getMesNotifications:', error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des notifications",
      error: error.message 
    });
  }
};

/**
 * Marque une notification comme lue
 */
exports.marquerCommeLue = async (req, res) => {
  try {
    const notification = await NotificationService.marquerCommeLue(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée" });
    }
    
    res.json({ message: "Notification marquée comme lue", notification });
  } catch (error) {
    console.error('Erreur marquerCommeLue:', error);
    res.status(500).json({ 
      message: "Erreur lors du marquage de la notification",
      error: error.message 
    });
  }
};

/**
 * Supprime une notification
 */
exports.supprimerNotification = async (req, res) => {
  try {
    await NotificationService.supprimerNotification(req.params.id);
    res.json({ message: "Notification supprimée avec succès" });
  } catch (error) {
    console.error('Erreur supprimerNotification:', error);
    res.status(500).json({ 
      message: "Erreur lors de la suppression de la notification",
      error: error.message 
    });
  }
};

/**
 * Marque toutes les notifications de l'utilisateur comme lues
 */
exports.marquerToutesCommeLues = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    await Notification.updateMany(
      { utilisateur: req.utilisateur.id, lue: false },
      { lue: true }
    );
    
    res.json({ message: "Toutes les notifications ont été marquées comme lues" });
  } catch (error) {
    console.error('Erreur marquerToutesCommeLues:', error);
    res.status(500).json({ 
      message: "Erreur lors du marquage des notifications",
      error: error.message 
    });
  }
};