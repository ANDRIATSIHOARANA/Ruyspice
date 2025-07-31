import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../../services/api';

const NotificationsSection = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use useCallback to memoize the fetchNotifications function
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Assuming we'll use the appointments data to generate notifications
      const response = await userService.getAppointments();
      
      // Transform appointments into notifications
      const notificationItems = response.data
        .filter(appointment => 
          // Only show recent status changes (within the last 7 days)
          new Date(appointment.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        )
        .map(appointment => ({
          id: appointment._id,
          message: getNotificationMessage(appointment),
          date: new Date(appointment.updatedAt || appointment.date),
          status: appointment.status,
          isRead: false // You might want to add a read/unread feature later
        }));
      
      setNotifications(notificationItems);
    } catch (err) {
      console.error('Erreur de chargement des notifications:', err);
      setError('Erreur lors du chargement des notifications');
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array since it doesn't depend on any props or state

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]); // Now correctly including fetchNotifications in the dependency array

  const getNotificationMessage = (appointment) => {
    const professionalName = `${appointment.professionnel?.prenom || ''} ${appointment.professionnel?.nom || ''}`.trim();
    const date = new Date(appointment.date).toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short'
    });

    switch (appointment.status) {
      case 'CONFIRME':
        return `Votre rendez-vous avec ${professionalName} le ${date} a été confirmé.`;
      case 'ANNULE':
        return `Votre rendez-vous avec ${professionalName} le ${date} a été annulé.`;
      case 'PENDING':
        return `Votre demande de rendez-vous avec ${professionalName} le ${date} est en attente de confirmation.`;
      default:
        return `Mise à jour du statut de votre rendez-vous avec ${professionalName} le ${date}.`;
    }
  };

  const markAsRead = (id) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  if (isLoading) return <div className="p-4">Chargement des notifications...</div>;
  
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Notifications</h2>
      
      {notifications.length === 0 ? (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p>Aucune notification récente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`border rounded-lg p-3 shadow-sm ${notification.isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                  notification.status === 'CONFIRME' ? 'bg-green-500' :
                  notification.status === 'ANNULE' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`}></div>
                
                <div className="flex-1">
                  <p className={`${notification.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {notification.date.toLocaleString('fr-FR', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsSection;
