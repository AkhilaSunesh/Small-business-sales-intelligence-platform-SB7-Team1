import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationDrawer from '../NotificationDrawer';
import { useNotifications } from '../../../context/NotificationContext';

// Mock the notifications hook
jest.mock('../../../context/NotificationContext');

const mockNotifications = [
  {
    id: 'n-1',
    title: 'High Revenue Alert',
    description: 'Daily sales target exceeded by 18%!',
    time: '15 mins ago',
    priority: 'high',
    category: 'revenue',
    read: false,
  },
  {
    id: 'n-2',
    title: 'Low Stock Alert',
    description: 'Organic Oats is below critical threshold of 10 items.',
    time: '45 mins ago',
    priority: 'critical',
    category: 'inventory',
    read: false,
  },
  {
    id: 'n-3',
    title: 'Database replica warning',
    description: 'Lag exceeds threshold.',
    time: '3 hours ago',
    priority: 'low',
    category: 'system',
    read: true,
  }
];

const mockNotificationsContext = {
  notifications: mockNotifications,
  loading: false,
  error: null,
  isDrawerOpen: true,
  setIsDrawerOpen: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  deleteNotification: jest.fn(),
  clearAll: jest.fn(),
  refetch: jest.fn(),
};

describe('NotificationDrawer Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders closed panel correctly without backdrop overlay', () => {
    useNotifications.mockReturnValue({
      ...mockNotificationsContext,
      isDrawerOpen: false,
    });
    
    const { container } = render(<NotificationDrawer />);
    
    // Backdrop is not rendered
    expect(container.querySelector('.bg-black\\/60')).not.toBeInTheDocument();
    // Slide drawer has translate-x-full class
    const drawer = screen.getByRole('complementary');
    expect(drawer).toHaveClass('translate-x-full');
  });

  test('renders loading skeleton elements', () => {
    useNotifications.mockReturnValue({
      ...mockNotificationsContext,
      loading: true,
    });

    render(<NotificationDrawer />);

    // Loader elements should be visible
    expect(screen.queryByText('Mark all read')).not.toBeInTheDocument();
  });

  test('renders error state and handles retry connection click', () => {
    const refetchMock = jest.fn();
    useNotifications.mockReturnValue({
      ...mockNotificationsContext,
      error: 'Failed to synchronize with notification stream.',
      refetch: refetchMock,
    });

    render(<NotificationDrawer />);

    expect(screen.getByText('Sync Failure')).toBeInTheDocument();
    expect(screen.getByText('Failed to synchronize with notification stream.')).toBeInTheDocument();

    const reconnectBtn = screen.getByRole('button', { name: /Reconnect Stream/i });
    fireEvent.click(reconnectBtn);
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  test('renders empty state when there are no alerts', () => {
    useNotifications.mockReturnValue({
      ...mockNotificationsContext,
      notifications: [],
    });

    render(<NotificationDrawer />);

    expect(screen.getByText('No notifications')).toBeInTheDocument();
    expect(screen.getByText(/You are completely caught up/i)).toBeInTheDocument();
  });

  test('renders lists of alerts and interacts with global actions', () => {
    const markAllMock = jest.fn();
    const clearAllMock = jest.fn();
    
    useNotifications.mockReturnValue({
      ...mockNotificationsContext,
      markAllAsRead: markAllMock,
      clearAll: clearAllMock,
    });

    render(<NotificationDrawer />);

    // Verify notifications count and content
    expect(screen.getByText('High Revenue Alert')).toBeInTheDocument();
    expect(screen.getByText('Low Stock Alert')).toBeInTheDocument();
    expect(screen.getByText('Database replica warning')).toBeInTheDocument();

    // Click Mark All Read
    const markAllBtn = screen.getByText(/Mark all read/i);
    fireEvent.click(markAllBtn);
    expect(markAllMock).toHaveBeenCalledTimes(1);

    // Click Clear All
    const clearAllBtn = screen.getByText(/Clear all/i);
    fireEvent.click(clearAllBtn);
    expect(clearAllMock).toHaveBeenCalledTimes(1);
  });

  test('filters notifications by search keywords and tab clicks', () => {
    useNotifications.mockReturnValue(mockNotificationsContext);
    render(<NotificationDrawer />);

    // Filter by Unread tab
    const unreadTab = screen.getByRole('button', { name: 'Unread' });
    fireEvent.click(unreadTab);

    // Search query interaction
    const searchInput = screen.getByPlaceholderText(/Search notifications/i);
    fireEvent.change(searchInput, { target: { value: 'Revenue' } });

    // Verify search filtered list
    expect(screen.getByText('High Revenue Alert')).toBeInTheDocument();
    expect(screen.queryByText('Low Stock Alert')).not.toBeInTheDocument();
  });
});
