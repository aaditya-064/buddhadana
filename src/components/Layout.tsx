import { useState, useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  FolderOpen,
  KanbanSquare,
  Workflow,
  Shield,
  Users,
  ScrollText,
  BarChart3,
  FileUp,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/files', icon: FolderOpen, label: 'Files' },
  { to: '/projects', icon: KanbanSquare, label: 'Projects' },
  { to: '/workflows', icon: Workflow, label: 'Workflows' },
  { to: '/vault', icon: Shield, label: 'Vault' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/import', icon: FileUp, label: 'Data Import' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/audit-logs', icon: ScrollText, label: 'Audit Logs' },
];

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<{ label: string; to?: string }[]>([]);

  // Expose breadcrumb setter via a custom event for child components
  const updateBreadcrumbs = (crumbs: { label: string; to?: string }[]) => {
    setBreadcrumbs(crumbs);
  };

  // Listen for breadcrumb updates from child components
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setBreadcrumbs(detail);
    };
    window.addEventListener('breadcrumbs-update', handler);
    return () => window.removeEventListener('breadcrumbs-update', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-saffron-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🪷</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-sm leading-tight">Buddha Dana Udhyog</h1>
            <p className="text-xs text-gray-500">Pvt. Ltd.</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-4.5 h-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm text-gray-500 overflow-hidden">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                {crumb.to ? (
                  <a href={crumb.to} className="hover:text-primary-600 truncate">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-gray-900 font-medium truncate">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function updateBreadcrumbs(crumbs: { label: string; to?: string }[]) {
  window.dispatchEvent(new CustomEvent('breadcrumbs-update', { detail: crumbs }));
}
