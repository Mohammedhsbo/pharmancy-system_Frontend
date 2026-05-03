import { useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, Clock, Package, FileText, CheckCheck } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { isArabic, useLanguageStore } from '../../store/useLanguageStore';
import { Button } from '../ui/Button';

const typeIcons = {
  low_stock: AlertTriangle,
  expiring_soon: Clock,
  expired: Package,
  system: FileText,
  invoice: FileText,
};

const typeColors = {
  low_stock: 'text-warning',
  expiring_soon: 'text-warning',
  expired: 'text-danger',
  system: 'text-primary',
  invoice: 'text-success',
};

export function NotificationDropdown() {
  const { language, t } = useLanguageStore();
  const rtl = isArabic(language);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data?.unreadCount || 0);
    } catch {
      // Silently fail for polling
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications({ limit: 20 });
      setNotifications(response?.data || []);
      await fetchUnreadCount();
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [fetchUnreadCount]);

  // Poll unread count every 30s
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch full list when dropdown opens
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    const target = notifications.find((n) => n._id === id);
    if (!target || target.isRead) return;

    try {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await notificationService.markAsRead(id);
      fetchUnreadCount();
    } catch {
      // Revert on failure
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await notificationService.markAllAsRead();
      fetchUnreadCount();
    } catch {
      fetchNotifications();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={`absolute -top-0.5 ${rtl ? '-left-0.5' : '-right-0.5'} min-w-[18px] h-[18px] flex items-center justify-center bg-danger text-white text-[10px] font-bold rounded-full px-1 ring-2 ring-card`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute ${rtl ? 'left-0' : 'right-0'} mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-card border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden`}>
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-background/50">
              <div>
                <h3 className="font-semibold text-white">{t('notifications.title')}</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-primary mt-0.5">
                    {t('notifications.unread', { count: unreadCount })}
                  </p>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="gap-1.5 text-xs h-8"
                >
                  <CheckCheck size={14} />
                  {t('notifications.markAllRead')}
                </Button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-gray-500 mt-2">{t('notifications.loading')}</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <Bell size={28} className="mx-auto text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500">{t('notifications.empty')}</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = typeIcons[n.type] || FileText;
                  const color = typeColors[n.type] || 'text-gray-400';

                  return (
                    <div
                      key={n._id}
                      className={`p-4 border-b border-white/5 flex gap-3 hover:bg-white/5 transition-colors cursor-pointer ${
                        !n.isRead ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                    >
                      <div className={`mt-0.5 ${color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            !n.isRead
                              ? 'text-white font-medium'
                              : 'text-gray-400'
                          }`}
                        >
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {n.message}
                          </p>
                        )}
                        {n.createdAt && (
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(n.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : undefined)}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-600 shrink-0 mt-0.5">
                        {t(`notifications.types.${n.type}`)}
                      </span>
                      {!n.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
