import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [workshops, setWorkshops] = useState([]);
  const [activities, setActivities] = useState([]);
  const [emails, setEmails] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random().toString();
    const newToast = { id, ...toast };
    setToasts(prev => [newToast, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch initial data via REST API
  const refreshWorkshops = useCallback(async () => {
    try {
      const res = await fetch('/api/workshops');
      const data = await res.json();
      if (data.success) {
        setWorkshops(data.workshops);
      }
    } catch (err) {
      console.error('Failed to fetch workshops:', err);
    }
  }, []);

  const refreshActivities = useCallback(async () => {
    try {
      const res = await fetch('/api/activities');
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  }, []);

  const refreshEmails = useCallback(async () => {
    try {
      const res = await fetch('/api/emails');
      const data = await res.json();
      if (data.success) {
        setEmails(data.emails);
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([refreshWorkshops(), refreshActivities(), refreshEmails()]);
      setLoading(false);
    };
    initData();

    // Setup Socket connection
    const socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('⚡ Connected to real-time seat sync socket');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Disconnected from socket');
    });

    socketInstance.on('initial_state', (data) => {
      if (data.workshops) {
        refreshWorkshops();
      }
    });

    socketInstance.on('seat_update', (data) => {
      console.log('🔄 Seat update received:', data);
      setWorkshops(prev => prev.map(w => {
        if (w.id === data.workshopId) {
          return {
            ...w,
            registered_count: data.registeredCount,
            waitlist_count: data.waitlistCount,
            seats_left: data.seatsLeft,
            is_full: data.isFull
          };
        }
        return w;
      }));
    });

    socketInstance.on('activity_event', (event) => {
      console.log('📢 Activity event received:', event);
      setActivities(prev => [{
        id: Date.now(),
        workshop_id: event.workshopId,
        action_type: event.type,
        user_name: event.userName,
        message: event.message,
        created_at: event.timestamp || new Date().toISOString()
      }, ...prev]);

      // Trigger user-friendly toast
      if (event.type === 'WAITLIST_PROMOTED') {
        addToast({
          type: 'success',
          title: '🌟 Waitlist Auto-Promotion!',
          message: event.message
        });
      } else if (event.type === 'REGISTERED') {
        addToast({
          type: 'info',
          title: '🎟️ Seat Booked',
          message: event.message
        });
      } else if (event.type === 'CANCELLED') {
        addToast({
          type: 'warning',
          title: 'Seat Freed',
          message: event.message
        });
      }
    });

    socketInstance.on('email_sent', (email) => {
      console.log('📧 Email received via websocket:', email);
      setEmails(prev => [email, ...prev]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [addToast, refreshWorkshops, refreshActivities, refreshEmails]);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      workshops,
      activities,
      emails,
      toasts,
      loading,
      addToast,
      removeToast,
      refreshWorkshops,
      refreshActivities,
      refreshEmails,
      setWorkshops
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
