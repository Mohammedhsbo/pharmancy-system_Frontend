import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationDropdown } from './NotificationDropdown';
import { ToastContainer } from '../ui/Toast';
import { useAuthStore } from '../../store/useAuthStore';
import { isArabic, useLanguageStore } from '../../store/useLanguageStore';
import { useUIStore } from '../../store/useUIStore';
import { Avatar, AvatarFallback } from '../ui/Avatar';
import { Languages, Menu, LogOut } from 'lucide-react';

export function Layout() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, sidebarMobileOpen, openMobileSidebar, closeMobileSidebar } = useUIStore();
  const { language, t, toggleLanguage } = useLanguageStore();
  const rtl = isArabic(language);

  return (
    <div className="min-h-screen bg-background text-white flex">
      {/* Mobile sidebar overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed
            ? rtl ? 'lg:mr-20' : 'lg:ml-20'
            : rtl ? 'lg:mr-64' : 'lg:ml-64'
        }`}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6">
          {/* Left: mobile menu + page breadcrumb */}
          <div className="flex items-center gap-4">
            <button
              onClick={openMobileSidebar}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Right: notifications + user */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-white/10 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              title={t('switchLanguage')}
            >
              <Languages size={16} />
              <span>{language === 'ar' ? 'EN' : 'AR'}</span>
            </button>

            <NotificationDropdown />

            <div className="h-8 w-px bg-white/10" />

            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white leading-tight">
                  {user?.name || t('userFallback')}
                </p>
                <p className="text-xs text-gray-400">
                  {t(`roles.${user?.role || 'user'}`)}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors rounded-lg"
                title={t('logout')}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
