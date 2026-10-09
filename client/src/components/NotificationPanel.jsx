import { useEffect, useState } from 'react';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notificationService';

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getNotifications()
      .then((items) => { if (active) setNotifications(items); })
      .catch((apiError) => {
        if (active) setError(apiError.response?.data?.message || 'Notifications could not be loaded.');
      });
    return () => { active = false; };
  }, []);

  const markOneRead = async (notification) => {
    if (notification.readAt) return;
    try {
      const updated = await markNotificationRead(notification._id);
      setNotifications((items) => items.map((item) => (item._id === updated._id ? updated : item)));
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Notification could not be marked as read.');
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      const readAt = new Date().toISOString();
      setNotifications((items) => items.map((item) => ({ ...item, readAt })));
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Notifications could not be marked as read.');
    }
  };

  const unreadCount = notifications.filter((item) => !item.readAt).length;

  return (
    <details className="notification-panel">
      <summary>Notifications{unreadCount ? ` · ${unreadCount} new` : ''}</summary>
      {error && <p className="venue-alert error" role="alert">{error}</p>}
      {notifications.length > 0 && unreadCount > 0 && (
        <button className="notification-read-all" type="button" onClick={markAllRead}>Mark all as read</button>
      )}
      <div className="notification-list">
        {notifications.length === 0
          ? <p>No notifications yet.</p>
          : notifications.map((notification) => (
            <button
              className={`notification-item ${notification.readAt ? 'read' : 'unread'}`}
              type="button"
              key={notification._id}
              onClick={() => markOneRead(notification)}
            >
              <span>{notification.message}</span>
              <small>{new Date(notification.createdAt).toLocaleString()}</small>
            </button>
          ))}
      </div>
    </details>
  );
}
