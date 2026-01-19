import { Moon, Sun, Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useLowStockProducts } from '@/hooks/useProducts';

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { data: lowStockProducts } = useLowStockProducts();
  const lowStockCount = lowStockProducts?.length || 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <SidebarTrigger className="md:hidden">
        <Menu className="h-5 w-5" />
      </SidebarTrigger>

      <div className="flex items-center gap-3 flex-1">
        <img src="/rk-logo.svg" alt="RK Enterprises" style={{ height: '40px', objectFit: 'contain' }} />
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {lowStockCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {lowStockCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-3 border-b">
              <h3 className="font-semibold">Notifications</h3>
            </div>
            {lowStockCount > 0 ? (
              <>
                <DropdownMenuItem className="p-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-destructive">Low Stock Alert</span>
                    <span className="text-sm text-muted-foreground">
                      {lowStockCount} product(s) are below reorder level
                    </span>
                  </div>
                </DropdownMenuItem>
              </>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No new notifications
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
}
