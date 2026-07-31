import { useState, useMemo, useEffect, useRef } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { 
  FiX, 
  FiSearch, 
  FiCheckSquare, 
  FiTrash2, 
  FiAlertCircle, 
  FiTrendingUp, 
  FiBox, 
  FiFileText, 
  FiZap, 
  FiUsers, 
  FiShield, 
  FiCpu,
  FiRefreshCw
} from 'react-icons/fi';
import Button from '../ui/Button';

// Mapping categories to React Icons & color classes
const categoryConfigs = {
  revenue: { icon: FiTrendingUp, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  inventory: { icon: FiBox, bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  invoice: { icon: FiFileText, bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  ai_recommendation: { icon: FiZap, bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  customer: { icon: FiUsers, bg: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  security: { icon: FiShield, bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  system: { icon: FiCpu, bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

const priorityStyles = {
  critical: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
  high: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
  medium: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25',
  low: 'bg-slate-500/10 text-slate-400 border border-slate-550/25',
};

export default function NotificationDrawer() {
  const {
    notifications,
    loading,
    error,
    isDrawerOpen,
    setIsDrawerOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refetch,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState('All'); // All, Unread, Critical, Revenue, Inventory, Invoice
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotification, setSelectedNotification] = useState(null);
  
  const drawerRef = useRef(null);

  // Close drawer on clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (isDrawerOpen && drawerRef.current && !drawerRef.current.contains(event.target)) {
        // Prevent closing if clicking on modal or dropdown overlays
        if (!event.target.closest('.notification-modal')) {
          setIsDrawerOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDrawerOpen, setIsDrawerOpen]);

  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        if (selectedNotification) {
          setSelectedNotification(null);
        } else if (isDrawerOpen) {
          setIsDrawerOpen(false);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, selectedNotification, setIsDrawerOpen]);

  // Clean filters list
  const filters = ['All', 'Unread', 'Critical', 'Revenue', 'Inventory', 'Invoice'];

  // Filtering & searching logic
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    // Apply filters
    if (activeFilter === 'Unread') {
      result = result.filter(n => !n.read);
    } else if (activeFilter === 'Critical') {
      result = result.filter(n => n.priority === 'critical');
    } else if (activeFilter === 'Revenue') {
      result = result.filter(n => n.category === 'revenue');
    } else if (activeFilter === 'Inventory') {
      result = result.filter(n => n.category === 'inventory');
    } else if (activeFilter === 'Invoice') {
      result = result.filter(n => n.category === 'invoice');
    }

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        n =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [notifications, activeFilter, searchQuery]);

  // Detail Modal Trigger
  const handleOpenDetail = (notif) => {
    setSelectedNotification(notif);
    markAsRead(notif.id);
  };

  return (
    <>
      {/* Drawer Overlay Backdrop */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300" />
      )}

      {/* Slide-over Drawer Panel */}
      <aside
        ref={drawerRef}
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-slate-950 border-l border-white/10 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out transform ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="bg-cyan-500 text-slate-950 font-bold text-xs px-2.5 py-0.5 rounded-full">
                {notifications.filter(n => !n.read).length} new
              </span>
            )}
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition cursor-pointer"
            aria-label="Close notifications panel"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Search Bar & Filtering Tabs */}
        <div className="p-4 border-b border-white/5 space-y-3 bg-slate-900/20">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <FiX className="text-sm" />
              </button>
            )}
          </div>

          {/* Scrolling filter categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {filters.map((filt) => (
              <button
                key={filt}
                onClick={() => setActiveFilter(filt)}
                className={`text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-lg border transition-all shrink-0 cursor-pointer ${
                  activeFilter === filt
                    ? 'bg-cyan-400/15 border-cyan-400/30 text-cyan-300 ring-1 ring-cyan-400/10'
                    : 'bg-white/5 border-white/5 text-slate-350 hover:bg-white/10 hover:text-white'
                }`}
              >
                {filt}
              </button>
            ))}
          </div>
        </div>

        {/* Global Action Row */}
        {notifications.length > 0 && !error && !loading && (
          <div className="px-5 py-2.5 border-b border-white/5 flex justify-between items-center bg-slate-900/10 text-xs">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition font-medium cursor-pointer"
            >
              <FiCheckSquare className="text-sm" /> Mark all read
            </button>
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition font-medium cursor-pointer"
            >
              <FiTrash2 className="text-sm" /> Clear all
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            /* Loading State Skeletons */
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 rounded-2xl border border-white/5 bg-white/5 animate-pulse space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-1/4 bg-white/10 rounded"></div>
                    <div className="h-3 w-1/6 bg-white/10 rounded"></div>
                  </div>
                  <div className="h-4 w-3/4 bg-white/10 rounded"></div>
                  <div className="h-3 w-1/2 bg-white/10 rounded"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* Connection Error State */
            <div className="rounded-2xl border border-rose-500/15 bg-rose-500/5 p-5 text-center space-y-4 my-4">
              <FiAlertCircle className="text-3xl text-rose-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Sync Failure</p>
                <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
              </div>
              <Button
                onClick={refetch}
                variant="secondary"
                className="w-full text-xs font-bold gap-2 py-2 border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
              >
                <FiRefreshCw className="animate-spin text-sm" /> Reconnect Stream
              </Button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 border border-white/5 text-slate-500 mb-4 animate-bounce">
                <FiCheckSquare className="text-xl" />
              </div>
              <h3 className="text-sm font-semibold text-white">No notifications</h3>
              <p className="text-xs text-slate-550 mt-1 max-w-xs leading-relaxed">
                {searchQuery || activeFilter !== 'All'
                  ? 'No notifications match your current filter parameters or search queries.'
                  : 'You are completely caught up! We will alert you when system metrics change.'}
              </p>
              {(searchQuery || activeFilter !== 'All') && (
                <button
                  onClick={() => {
                    setActiveFilter('All');
                    setSearchQuery('');
                  }}
                  className="mt-4 text-xs font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            /* Notifications Cards List */
            <div className="space-y-3">
              {filteredNotifications.map((notif) => {
                const config = categoryConfigs[notif.category] || categoryConfigs.system;
                const CategoryIcon = config.icon;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleOpenDetail(notif)}
                    className={`group p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-3 relative ${
                      notif.read
                        ? 'bg-slate-950 border-white/5 hover:border-white/10'
                        : 'bg-white/5 border-white/10 hover:border-cyan-400/20 hover:bg-cyan-500/[0.02]'
                    }`}
                  >
                    {/* Unread dot indicator */}
                    {!notif.read && (
                      <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}

                    {/* Category Icon Wrapper */}
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${config.bg}`}>
                      <CategoryIcon className="text-base" />
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {/* Priority Badge */}
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider ${priorityStyles[notif.priority] || priorityStyles.medium}`}>
                          {notif.priority}
                        </span>
                        {/* Category Name */}
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                          {notif.category.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <h4 className={`text-xs font-bold truncate transition-colors ${notif.read ? 'text-slate-200' : 'text-white group-hover:text-cyan-300'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {notif.description}
                      </p>
                      <span className="text-[10px] text-slate-500 mt-2 block font-medium">
                        {notif.time}
                      </span>
                    </div>

                    {/* Inner Delete Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-white/5 transition cursor-pointer"
                      title="Delete Notification"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* Expanded Details Modal (Overlay) */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md notification-modal">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${categoryConfigs[selectedNotification.category]?.bg || categoryConfigs.system.bg}`}>
                  {(() => {
                    const IconComp = categoryConfigs[selectedNotification.category]?.icon || FiCpu;
                    return <IconComp className="text-lg" />;
                  })()}
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-cyan-400 tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-400/20">
                    {selectedNotification.category.replace('_', ' ')}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold uppercase tracking-wider">{selectedNotification.time}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white leading-snug">
                {selectedNotification.title}
              </h3>
              
              <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                <p className="text-xs text-slate-350 leading-relaxed">
                  {selectedNotification.description}
                </p>
              </div>

              {/* Status details metadata badges row */}
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-900 border border-white/5 p-2 rounded-xl text-center">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 block">Priority</span>
                  <span className={`text-[10px] uppercase font-bold tracking-wide mt-0.5 block ${
                    selectedNotification.priority === 'critical' ? 'text-rose-450' : 
                    selectedNotification.priority === 'high' ? 'text-amber-400' : 'text-cyan-300'
                  }`}>
                    {selectedNotification.priority}
                  </span>
                </div>
                <div className="flex-1 bg-slate-900 border border-white/5 p-2 rounded-xl text-center">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 block">Status</span>
                  <span className="text-[10px] uppercase font-bold tracking-wide text-emerald-400 mt-0.5 block">
                    Read
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  deleteNotification(selectedNotification.id);
                  setSelectedNotification(null);
                }}
                className="flex-1 gap-2 text-xs font-bold py-2.5 text-rose-300 hover:text-rose-200 border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10"
              >
                <FiTrash2 /> Delete Alert
              </Button>
              <Button
                variant="primary"
                onClick={() => setSelectedNotification(null)}
                className="flex-1 text-xs font-bold py-2.5"
              >
                Acknowledge
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
