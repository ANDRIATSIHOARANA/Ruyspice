const mongoose = require('mongoose');
const Notification = mongoose.model('Notification');

/**
 * Service pour gérer les notifications
 */
class NotificationService {
  /**
   * Crée une nouvelle notification pour un utilisateur
   * @param {string} utilisateurId - ID de l'utilisateur destinataire
   * @param {string} contenu - Contenu de la notification
   * @returns {Promise<Object>} - La notification créée
   */
  static async creerNotification(utilisateurId, contenu) {
    try {
      const notification = new Notification({
        contenu,
        utilisateur: utilisateurId,
        dateCreation: new Date()
      });
      
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les notifications d'un utilisateur
   * @param {string} utilisateurId - ID de l'utilisateur
   * @returns {Promise<Array>} - Liste des notifications
   */
  static async getNotificationsUtilisateur(utilisateurId) {
    try {
      return await Notification.find({ utilisateur: utilisateurId })
        .sort({ dateCreation: -1 });
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }

  /**
   * Marque une notification comme lue
   * @param {string} notificationId - ID de la notification
   * @returns {Promise<Object>} - La notification mise à jour
   */
  static async marquerCommeLue(notificationId) {
    try {
      return await Notification.findByIdAndUpdate(
        notificationId,
        { lue: true },
        { new: true }
      );
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      throw error;
    }
  }

  /**
   * Supprime une notification
   * @param {string} notificationId - ID de la notification
   * @returns {Promise<boolean>} - Succès de la suppression
   */
  static async supprimerNotification(notificationId) {
    try {
      await Notification.findByIdAndDelete(notificationId);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;