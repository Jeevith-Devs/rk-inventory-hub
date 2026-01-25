import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  ShoppingCart,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  Box,
  TrendingUp,
  TrendingDown,
  FileCheck,
  Sun,
  Moon,
  IndianRupee
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

const mainNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
];

const masterItems = [
  { title: 'Products', url: '/products', icon: Package },
  { title: 'Suppliers', url: '/suppliers', icon: Truck },
  { title: 'Customers', url: '/customers', icon: Users },
];

const transactionItems = [
  { title: 'Stock In (Purchase)', url: '/purchases', icon: TrendingUp },
  { title: 'Stock Out (Sales)', url: '/sales', icon: TrendingDown },
  { title: 'Quotations', url: '/quotations', icon: FileCheck },
  { title: 'Purchase Orders', url: '/purchase-orders', icon: FileText },
];

const reportItems = [
  { title: 'Reports', url: '/reports', icon: Box },
  { title: 'Payment Status', url: '/mis-report', icon: IndianRupee },
];

export function AppSidebar() {
  const { signOut, user, userRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { state, setOpenMobile, isMobile } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (items: { url: string }[]) => items.some(item => isActive(item.url));

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const NavItem = ({ item }: { item: { title: string; url: string; icon: React.ComponentType<{ className?: string }> } }) => (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          onClick={handleNavClick}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent',
            isActive(item.url) && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          )}
        >
          <item.icon className="h-4 w-4" />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar className="border-r border-sidebar-border">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <img src={logo} alt="RK Enterprises" className="h-10 w-auto" />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-sidebar-foreground">RK ENTERPRISES</span>
            <span className="text-[10px] text-sidebar-foreground/60">Inventory Management</span>
          </div>
        )}
      </div>

      <SidebarContent className="px-2 py-4">
        {/* Main Nav */}
        <SidebarGroup>
          <SidebarMenu>
            {mainNavItems.map((item) => (
              <NavItem key={item.title} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Masters */}
        <SidebarGroup>
          <Collapsible defaultOpen={isGroupActive(masterItems)} className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-xs font-semibold uppercase text-sidebar-foreground/60 hover:bg-sidebar-accent/50 rounded-lg">
                {!collapsed && <span>Masters</span>}
                {!collapsed && <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {masterItems.map((item) => (
                    <NavItem key={item.title} item={item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Transactions */}
        <SidebarGroup>
          <Collapsible defaultOpen={isGroupActive(transactionItems)} className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-xs font-semibold uppercase text-sidebar-foreground/60 hover:bg-sidebar-accent/50 rounded-lg">
                {!collapsed && <span>Transactions</span>}
                {!collapsed && <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {transactionItems.map((item) => (
                    <NavItem key={item.title} item={item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Reports */}
        <SidebarGroup>
          <Collapsible defaultOpen={isGroupActive(reportItems)} className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-xs font-semibold uppercase text-sidebar-foreground/60 hover:bg-sidebar-accent/50 rounded-lg">
                {!collapsed && <span>Reports</span>}
                {!collapsed && <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {reportItems.map((item) => (
                    <NavItem key={item.title} item={item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Settings - Admin Only */}
        {userRole === 'admin' && (
          <SidebarGroup>
            <SidebarMenu>
              <NavItem item={{ title: 'Settings', url: '/settings', icon: Settings }} />
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.email}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{userRole || 'User'}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
