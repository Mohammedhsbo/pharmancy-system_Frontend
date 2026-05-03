
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MonitorSmartphone,
  ClipboardList,
  BarChart3,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { isArabic, useLanguageStore } from '../../store/useLanguageStore';
import { useUIStore } from '../../store/useUIStore';
import { ROLES } from '../../utils/constants';
import { cn } from '../../utils/cn';

const navItems = [
  {
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: [ROLES.ADMIN, ROLES.PHARMACIST],
  },
  {
    labelKey: 'nav.inventory',
    icon: Package,
    path: '/inventory',
    roles: [ROLES.ADMIN, ROLES.PHARMACIST],
  },
  {
    labelKey: 'nav.pos',
    icon: MonitorSmartphone,
    path: '/pos',
    roles: [ROLES.ADMIN, ROLES.PHARMACIST, ROLES.CASHIER],
  },
  {
    labelKey: 'nav.patients',
    icon: ClipboardList,
    path: '/patients',
    roles: [ROLES.ADMIN, ROLES.PHARMACIST],
  },
  {
    labelKey: 'nav.reports',
    icon: BarChart3,
    path: '/reports',
    roles: [ROLES.ADMIN],
  },
  {
    labelKey: 'nav.users',
    icon: Users,
    path: '/users',
    roles: [ROLES.ADMIN],
  },
];

export function Sidebar() {
  const { user } = useAuthStore();
  const { language, t } = useLanguageStore();
  const rtl = isArabic(language);
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, closeMobileSidebar } =
    useUIStore();
  const navigate = useNavigate();

  // Filter nav items based on user role
  const visibleItems = navItems.filter(
    (item) => !user?.role || item.roles.includes(user.role)
  );

  const handleNavClick = (path) => {
    navigate(path);
    closeMobileSidebar();
  };

  return (
    <aside
      className={cn(
        'bg-card border-r border-white/5 h-screen flex flex-col fixed top-0 z-50 transition-all duration-300',
        sidebarCollapsed ? 'w-20' : 'w-64',
        rtl ? 'border-l border-r-0' : 'border-r',
        sidebarMobileOpen ? (rtl ? 'right-0' : 'left-0') : (rtl ? '-right-64 lg:right-0' : '-left-64 lg:left-0')
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 shrink-0">
        <div
          className={cn(
            'flex items-center gap-2.5 text-primary font-bold text-xl transition-all cursor-pointer',
            sidebarCollapsed && 'justify-center'
          )}
          onClick={() => handleNavClick('/dashboard')}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
            <Package size={20} />
          </div>
          {!sidebarCollapsed && (
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              PharmERP
            </span>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          {sidebarCollapsed ? (
            rtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />
          ) : (
            rtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {!sidebarCollapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 px-3 mb-3">
            {t('mainMenu')}
          </p>
        )}
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => closeMobileSidebar()}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                isActive
                  ? 'bg-primary/10 text-primary font-medium shadow-sm'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-white/5',
                sidebarCollapsed && 'justify-center px-0'
              )
            }
            title={sidebarCollapsed ? t(item.labelKey) : undefined}
          >
            <item.icon size={20} className="shrink-0" />
            {!sidebarCollapsed && <span className="text-sm">{t(item.labelKey)}</span>}

            {/* Tooltip for collapsed mode */}
            {sidebarCollapsed && (
              <div className={cn(
                'absolute px-2 py-1 bg-card border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl',
                rtl ? 'right-full mr-2' : 'left-full ml-2'
              )}>
                {t(item.labelKey)}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer — version */}
      <div className="px-4 py-3 border-t border-white/5 shrink-0">
        {!sidebarCollapsed && (
          <p className="text-[10px] text-gray-600 text-center">
            PharmERP v1.0.0
          </p>
        )}
      </div>
    </aside>
  );
}
