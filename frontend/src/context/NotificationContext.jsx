import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import API_BASE from '../config/api';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

const MAX_VISIBLE_TOASTS = 3;
const TOAST_DURATION_MS = 3500;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const lastNotificationRef = useRef({ message: null, time: 0 });
  const initialLoadDone = useRef(false);
  const seenNotificationIds = useRef(new Set());
  // Track messages currently in-flight (POST hasn't returned yet) so the
  // poller won't re-toast them before we learn their DB id.
  const pendingMessages = useRef(new Set());
  const isFetching = useRef(false);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addNotification = useCallback(async (notification) => {
    const now = Date.now();
    const msgKey = `${notification.type || 'info'}::${notification.message}`;

    // Prevent adding the exact same toast (same message+type) within the last 3 seconds
    if (
      lastNotificationRef.current.message === notification.message &&
      lastNotificationRef.current.type === (notification.type || 'info') &&
      (now - lastNotificationRef.current.time) < 3000
    ) {
      return; 
    }
    
    lastNotificationRef.current = { message: notification.message, type: notification.type || 'info', time: now };

    // Mark this message as "pending" so the poller won't re-toast it
    pendingMessages.current.add(msgKey);

    const localId = Date.now() + Math.random();
    const newToast = {
      timestamp: new Date(),
      ...notification,
      id: localId,
    };
    
    setToasts(prev => {
      // Prevent duplicate toasts on screen at the same time
      if (prev.some(t => t.message === notification.message && t.type === (notification.type || 'info'))) {
        return prev;
      }
      const updated = [...prev, newToast];
      // Cap visible toasts — drop the oldest ones when over the limit
      if (updated.length > MAX_VISIBLE_TOASTS) {
        return updated.slice(updated.length - MAX_VISIBLE_TOASTS);
      }
      return updated;
    });
    
    setTimeout(() => {
      removeToast(localId);
    }, TOAST_DURATION_MS);

    // Persist to backend and update bell dropdown
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        const res = await fetch(`${API_BASE}/notifications.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            type: notification.type || 'info',
            message: notification.message
          })
        });
        const data = await res.json();
        
        if (data.status === 'success' && data.id) {
          // Add to seen so the poller doesn't toast it again
          seenNotificationIds.current.add(String(data.id));
          
          // Add directly to dropdown list
          const newDbNotif = {
            id: data.id,
            user_id: user.id,
            type: notification.type || 'info',
            message: notification.message,
            is_read: 0,
            created_at: new Date().toISOString()
          };
          setNotifications(prev => [newDbNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      }
    } catch (e) {
      console.error("Failed to persist notification", e);
    } finally {
      // Whether the POST succeeded or failed, clear the pending flag
      pendingMessages.current.delete(msgKey);
    }
  }, [removeToast]);

  const markAllAsRead = useCallback(async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
      await fetch(`${API_BASE}/notifications.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id })
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (isFetching.current) return;
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    isFetching.current = true;
    try {
      const res = await fetch(`${API_BASE}/notifications.php?user_id=${user.id}`);
      const data = await res.json();
      
      if (data.status === 'success') {
        const newNotifs = data.data;
        const newUnread = newNotifs.filter(n => parseInt(n.is_read) === 0);
        
        if (initialLoadDone.current) {
          newUnread.forEach(n => {
            const nId = String(n.id);
            if (!seenNotificationIds.current.has(nId)) {
              const msgKey = `${n.type || 'info'}::${n.message}`;
              if (pendingMessages.current.has(msgKey)) {
                seenNotificationIds.current.add(nId);
                return;
              }

              const toastId = `db-${n.id}`;
              setToasts(t => {
                if (t.some(existingToast => existingToast.message === n.message && existingToast.type === (n.type || 'info'))) {
                  return t;
                }
                const updated = [...t, { ...n, timestamp: n.created_at, id: toastId }];
                if (updated.length > MAX_VISIBLE_TOASTS) {
                  return updated.slice(updated.length - MAX_VISIBLE_TOASTS);
                }
                return updated;
              });
              setTimeout(() => removeToast(toastId), TOAST_DURATION_MS);
              seenNotificationIds.current.add(nId);
            }
          });
        } else {
          newNotifs.forEach(n => seenNotificationIds.current.add(String(n.id)));
          initialLoadDone.current = true;
        }
        
        setNotifications(newNotifs);
        setUnreadCount(newUnread.length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      isFetching.current = false;
    }
  }, [removeToast]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    
    // Custom event to stop interval on logout or trigger refresh
    const handleAuthChange = () => {
      if (!localStorage.getItem('user')) {
        // User logged out — reset everything
        setNotifications([]);
        setUnreadCount(0);
        initialLoadDone.current = false;
        seenNotificationIds.current.clear();
        pendingMessages.current.clear();
        isFetching.current = false;
      } else {
        // User just logged in — treat next fetch as the initial load so we
        // don't re-toast all pre-existing unread notifications.
        initialLoadDone.current = false;
        seenNotificationIds.current.clear();
        pendingMessages.current.clear();
        fetchNotifications();
      }
    };
    
    window.addEventListener('userUpdated', handleAuthChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('userUpdated', handleAuthChange);
    };
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllAsRead, refreshNotifications: fetchNotifications }}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={`toast-${toast.id}`} className={`toast-message glass border-${toast.type || 'success'}`}>
              <div className={`toast-icon bg-${toast.type || 'success'}`}>
                {toast.type === 'error' ? '✕' : toast.type === 'warning' ? '!' : '✓'}
              </div>
              <div className="toast-content">
                {toast.message}
              </div>
              <button className="toast-close" onClick={() => removeToast(toast.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </NotificationContext.Provider>
  );
};

