import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAppContext } from './AppContext';
import notificationService from '../services/notificationService';

const NotificationContext = createContext(null);

const MOCK_NOTIFICATIONS = {
  Admin: [
    { id: 'a1', title: 'System CPU Warning', description: 'Server memory utilization exceeded 85% for more than 15 minutes.', time: '10 mins ago', priority: 'high', category: 'system', read: false },
    { id: 'a2', title: 'Security Alert: Failed Logins', description: 'Multiple failed login attempts detected on IP 192.168.1.104.', time: '1 hour ago', priority: 'critical', category: 'security', read: false },
    { id: 'a3', title: 'Database Replication Delay', description: 'Read replica delay has reached 4.2 seconds. Monitoring replication lag.', time: '3 hours ago', priority: 'medium', category: 'system', read: false },
    { id: 'a4', title: 'New User Registered', description: 'User Sarah Miller created a new account under Sales Executive role.', time: 'Yesterday', priority: 'low', category: 'system', read: true },
    { id: 'a5', title: 'API Gateway Health Check', description: 'Endpoint response latency is currently nominal (45ms average).', time: 'Yesterday', priority: 'low', category: 'system', read: true },
  ],
  Owner: [
    { id: 'o1', title: 'High Revenue Alert', description: 'Daily sales target exceeded by 18%! Total revenue hit $12,450.', time: '15 mins ago', priority: 'high', category: 'revenue', read: false },
    { id: 'o2', title: 'Low Stock Alert: Organic Oats', description: 'Organic Oats (SKU: OAT-ORG-10) is below critical threshold of 10 items.', time: '45 mins ago', priority: 'critical', category: 'inventory', read: false },
    { id: 'o3', title: 'AI Recommendation', description: 'Cross-selling opportunity: Bundle Herbal Teas with Honey Jar for a projected 5.4% margin bump.', time: '2 hours ago', priority: 'medium', category: 'ai_recommendation', read: false },
    { id: 'o4', title: 'Sales Forecast Alert', description: 'AI predicts a 15% surge in warm beverage sales over the next two weeks due to seasonal temperature drop.', time: '4 hours ago', priority: 'medium', category: 'revenue', read: true },
    { id: 'o5', title: 'Overdue Invoice #INV-2026-089', description: 'Acme Corp invoice for $1,850 is overdue by 5 days.', time: 'Yesterday', priority: 'high', category: 'invoice', read: true },
    { id: 'o6', title: 'Business Insights Report', description: 'Weekly performance summary shows customer retention improved by 3.2% vs previous period.', time: '2 days ago', priority: 'low', category: 'revenue', read: true },
  ],
  'Store Manager': [
    { id: 'm1', title: 'Critical Stock: Toilet Paper', description: 'Eco Toilet Paper Pack is out of stock in Aisle 4. 0 units left.', time: '5 mins ago', priority: 'critical', category: 'inventory', read: false },
    { id: 'm2', title: 'Product Update: Price Adjustment', description: 'Supplier adjusted MSRP for Almond Milk (1L) from $3.99 to $4.29.', time: '1 hour ago', priority: 'medium', category: 'inventory', read: false },
    { id: 'm3', title: 'Pending Delivery #DLV-490', description: 'Shipment from Organic Distributing scheduled for today at 2:00 PM is delayed by 1 hour.', time: '2 hours ago', priority: 'high', category: 'inventory', read: false },
    { id: 'm4', title: 'Customer Order Issue #ORD-8812', description: 'Customer requested cancellation for order #ORD-8812 due to incorrect delivery address.', time: 'Yesterday', priority: 'high', category: 'customer', read: true },
    { id: 'm5', title: 'Reorder Reminder', description: 'Weekly automated inventory reorder sheet generated and ready for approval.', time: 'Yesterday', priority: 'low', category: 'inventory', read: true },
  ],
  'Sales Executive': [
    { id: 'e1', title: 'Assigned Invoice #INV-2026-102', description: 'Invoice for $450 assigned to you. Customer: John Doe.', time: '20 mins ago', priority: 'medium', category: 'invoice', read: false },
    { id: 'e2', title: 'Sales Target Approaching', description: 'You are at 92% of your monthly sales target. Only $800 remaining to unlock tier-2 bonus.', time: '2 hours ago', priority: 'high', category: 'revenue', read: false },
    { id: 'e3', title: 'Customer Follow-up: Jane Smith', description: 'Schedule a call with Jane Smith regarding her inquiry about custom ordering options.', time: '4 hours ago', priority: 'medium', category: 'customer', read: false },
    { id: 'e4', title: 'Payment Reminder Sent', description: 'Automatic payment reminder sent to client Bob Johnson for invoice #INV-2026-095 ($300).', time: 'Yesterday', priority: 'low', category: 'invoice', read: true },
    { id: 'e5', title: 'Assigned Task: Catalog Update', description: 'Please review and verify prices for the new autumn drink catalog by EOD.', time: 'Yesterday', priority: 'high', category: 'system', read: true },
  ],
};

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAppContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Initialize notifications based on user role
  const loadNotificationsForRole = useCallback(async (role) => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationService.getNotifications({ page: 1, limit: 100 });
      const liveItems = (res && res.data) || [];

      // Map live items from backend to UI format
      const mappedLiveItems = liveItems.map((item, idx) => {
        const isLowStock = item.type === 'LOW_STOCK';
        const priority = item.severity === 'CRITICAL' ? 'critical' : 'high';
        const category = isLowStock ? 'inventory' : 'invoice';
        const id = isLowStock
          ? `live-stock-${item.productId || idx}`
          : `live-invoice-${item.invoiceId || idx}`;

        return {
          id,
          title: isLowStock ? `Low Stock: ${item.productName}` : `Overdue Invoice: ${item.invoiceNumber}`,
          description: item.message,
          time: isLowStock ? 'Recent' : `${item.daysOverdue} day(s) overdue`,
          priority,
          category,
          read: false,
        };
      });

      // Filter live items based on user role — show relevant categories only
      let roleKey = role || 'Owner';
      let filteredLive = mappedLiveItems;
      if (roleKey === 'Store Manager') {
        filteredLive = mappedLiveItems.filter(item => item.category === 'inventory');
      } else if (roleKey === 'Sales Executive') {
        filteredLive = mappedLiveItems.filter(item => item.category === 'invoice');
      }
      // Owner and Admin see all notification types

      // Apply persistent read/deleted state from localStorage
      const storedRead    = JSON.parse(localStorage.getItem('marketmind:read-notifications')    || '[]');
      const storedDeleted = JSON.parse(localStorage.getItem('marketmind:deleted-notifications') || '[]');

      const finalNotifications = filteredLive
        .map(item => ({ ...item, read: storedRead.includes(item.id) ? true : item.read }))
        .filter(item => !storedDeleted.includes(item.id));

      setNotifications(finalNotifications);
    } catch (err) {
      console.error('Failed to load live notifications:', err);
      setError('Failed to sync notifications. Please check your connection and try again.');
      // On API failure, show empty list rather than mock data
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync on login/role change
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      loadNotificationsForRole(user.role);
    } else {
      setNotifications([]);
    }
  }, [user?.role, isAuthenticated, loadNotificationsForRole]);

  // Unread badge count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Actions
  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      const storedRead = JSON.parse(localStorage.getItem('marketmind:read-notifications') || '[]');
      if (!storedRead.includes(id)) {
        storedRead.push(id);
        localStorage.setItem('marketmind:read-notifications', JSON.stringify(storedRead));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      try {
        const ids = prev.map(n => n.id);
        const storedRead = JSON.parse(localStorage.getItem('marketmind:read-notifications') || '[]');
        ids.forEach(id => {
          if (!storedRead.includes(id)) storedRead.push(id);
        });
        localStorage.setItem('marketmind:read-notifications', JSON.stringify(storedRead));
      } catch (e) {
        console.error(e);
      }
      return prev.map(n => ({ ...n, read: true }));
    });
  }, []);

  const deleteNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      const storedDeleted = JSON.parse(localStorage.getItem('marketmind:deleted-notifications') || '[]');
      if (!storedDeleted.includes(id)) {
        storedDeleted.push(id);
        localStorage.setItem('marketmind:deleted-notifications', JSON.stringify(storedDeleted));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications(prev => {
      try {
        const ids = prev.map(n => n.id);
        const storedDeleted = JSON.parse(localStorage.getItem('marketmind:deleted-notifications') || '[]');
        ids.forEach(id => {
          if (!storedDeleted.includes(id)) storedDeleted.push(id);
        });
        localStorage.setItem('marketmind:deleted-notifications', JSON.stringify(storedDeleted));
      } catch (e) {
        console.error(e);
      }
      return [];
    });
  }, []);

  // Force-trigger error state for UI demonstration
  const triggerDemoError = useCallback(() => {
    setError('Failed to sync notification stream. Remote endpoint refused gateway connection.');
  }, []);

  const refetch = useCallback(() => {
    if (user?.role) {
      loadNotificationsForRole(user.role);
    }
  }, [user?.role, loadNotificationsForRole]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      isDrawerOpen,
      setIsDrawerOpen,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      triggerDemoError,
      refetch,
    }),
    [notifications, unreadCount, loading, error, isDrawerOpen, markAsRead, markAllAsRead, deleteNotification, clearAll, triggerDemoError, refetch]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
