import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Barcode,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  Settings,
  HelpCircle,
  Users,
  ScrollText,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  permission?: string; // Permission required to view this item
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if user has a specific permission
  const hasPermission = (permission: string) => {
    if (!user?.role || typeof user.role === 'string' || !user.role.permissions || !Array.isArray(user.role.permissions)) return false;
    return user.role.permissions.includes(permission);
  };

  // Main dashboard item (standalone)
  const mainNavItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      // Dashboard is usually accessible to everyone logged in
    },
  ];

  // FTTH Section
  const ftthSection: NavSection = {
    title: 'FTTH SECTION',
    items: [
      {
        title: 'Produk',
        href: '/products',
        icon: Package,
        permission: 'products.view',
      },
      {
        title: 'Inventory / SN',
        href: '/inventory',
        icon: Barcode,
        badge: 8,
        permission: 'inventory.view',
      },
      {
        title: 'Stock In',
        href: '/stock-in',
        icon: ArrowDownToLine,
        permission: 'inventory.stock_in',
      },
      {
        title: 'Stock Out',
        href: '/stock-out',
        icon: ArrowUpFromLine,
        permission: 'inventory.stock_out',
      },
      {
        title: 'Audit / Scan',
        href: '/audit',
        icon: Search,
        permission: 'inventory.audit',
      },
    ],
  };

  // SAT Section
  const satSection: NavSection = {
    title: 'SAT SECTION',
    items: [
      {
        title: 'Dashboard SAT',
        href: '/sat/dashboard',
        icon: LayoutDashboard,
        permission: 'sat.dashboard.view',
      },
      {
        title: 'Produk SAT',
        href: '/sat/products',
        icon: Package,
        permission: 'sat.products.view',
      },
      {
        title: 'Inventory SAT',
        href: '/sat/inventory',
        icon: Barcode,
        permission: 'sat.inventory.view',
      },
      {
        title: 'Stock In SAT',
        href: '/sat/stock-in',
        icon: ArrowDownToLine,
        permission: 'sat.inventory.stock_in',
      },
      {
        title: 'Stock Out SAT',
        href: '/sat/stock-out',
        icon: ArrowUpFromLine,
        permission: 'sat.inventory.stock_out',
      },
    ],
  };

  // Bottom navigation
  const bottomNavItems: NavItem[] = [
    {
      title: 'Manajemen User',
      href: '/users',
      icon: Users,
      permission: 'users.manage',
    },
    {
      title: 'Activity Log',
      href: '/activity-log',
      icon: ScrollText,
      permission: 'activity_log.view',
    },
    {
      title: 'Log Aktivitas Pengeditan',
      href: '/detailed-audit',
      icon: ScrollText,
      permission: 'activity_log.view',
    },
    {
      title: 'Manajemen Role',
      href: '/role-management',
      icon: Shield,
      permission: 'roles.view',
    },
    {
      title: 'Pengaturan',
      href: '/settings',
      icon: Settings,
      permission: 'settings.view',
    },
    {
      title: 'Bantuan',
      href: '/help',
      icon: HelpCircle,
      permission: 'help.view', // Assuming there's a help permission
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo - Mobile Only */}
          <div className="lg:hidden p-4 border-b flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Inventory SaaS</h1>
              <p className="text-xs text-muted-foreground">FTWH Warehouse</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6 pt-2">
            {/* Branding - Desktop */}
            <div className="hidden lg:flex items-center space-x-3 px-3 py-4 mb-2 border-b">
              <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center shadow-inner">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="overflow-hidden">
                <h1 className="text-sm font-bold leading-tight truncate">Inventory SaaS</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold opacity-70">Warehouse System</p>
              </div>
            </div>

            {/* Main Dashboard */}
            <div>
              <ul className="space-y-1">
                {mainNavItems.map((item) => {
                  // Only show items if user has the required permission
                  if (item.permission && !hasPermission(item.permission)) {
                    return null;
                  }

                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

                  return (
                    <li key={item.href}>
                      <NavLink
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span>{item.title}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* FTTH Section */}
            <div>
              <h2 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 px-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-primary/20" />
                {ftthSection.title}
                <div className="h-px flex-1 bg-primary/20" />
              </h2>
              <ul className="space-y-1">
                {ftthSection.items.map((item) => {
                  // Only show items if user has the required permission
                  if (item.permission && !hasPermission(item.permission)) {
                    return null;
                  }

                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

                  return (
                    <li key={item.href}>
                      <NavLink
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-medium">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* SAT Section */}
            <div>
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-2 px-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-zinc-900/10 dark:bg-zinc-100/10" />
                {satSection.title}
                <div className="h-px flex-1 bg-zinc-900/10 dark:bg-zinc-100/10" />
              </h2>
              <ul className="space-y-1">
                {satSection.items.map((item) => {
                  if (item.permission && !hasPermission(item.permission)) {
                    return null;
                  }

                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

                  return (
                    <li key={item.href}>
                      <NavLink
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="flex-1">{item.title}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Bottom Navigation */}
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                Lainnya
              </h2>
              <ul className="space-y-1">
                {bottomNavItems.map((item) => {
                  // Only show items if user has the required permission
                  if (item.permission && !hasPermission(item.permission)) {
                    return null;
                  }

                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

                  return (
                    <li key={item.href}>
                      <NavLink
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span>{item.title}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          {/* Footer Info */}
          <div className="p-4 border-t">
            <div className="bg-accent/50 rounded-lg p-3">
              <p className="text-xs font-medium">Status Server</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}