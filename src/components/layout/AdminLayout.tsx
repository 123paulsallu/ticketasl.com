import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Route, 
  FileText,
  LogOut,
  Bus,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const menuItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Companies', url: '/admin/companies', icon: Building2 },
  { title: 'Users', url: '/admin/users', icon: Users },
];

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex border-r">
          <div className="p-4 border-b">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Bus className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">Ticketa</span>
            </Link>
            <p className="text-xs text-muted-foreground mt-2">Admin Dashboard</p>
          </div>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          end={item.url === '/admin'}
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted"
                          activeClassName="bg-muted text-primary font-medium"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                {profile?.full_name?.[0] || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{profile?.full_name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <header className="md:hidden flex items-center justify-between p-4 border-b">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Bus className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-primary">Ticketa</span>
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <h2 className="font-semibold">Admin Menu</h2>
                  </div>
                  <nav className="flex-1 space-y-1">
                    {menuItems.map((item) => (
                      <NavLink
                        key={item.title}
                        to={item.url}
                        end={item.url === '/admin'}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted"
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    ))}
                  </nav>
                  <Button variant="outline" className="mt-4" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 bg-muted/30">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">{title}</h1>
            </div>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
