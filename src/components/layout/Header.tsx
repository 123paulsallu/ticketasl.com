import { Link, useNavigate } from 'react-router-dom';
import { Bus, Menu, User, LogOut, LayoutDashboard, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export function Header() {
  const { user, profile, roles, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (hasRole('admin')) return '/admin';
    if (hasRole('company_admin')) return '/company';
    if (hasRole('driver')) return '/driver';
    return '/my-tickets';
  };

  const navLinks = [
    { href: '/search', label: 'Find Buses' },
    { href: '/companies', label: 'Bus Companies' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Bus className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-primary">Ticketa</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="max-w-[120px] truncate">
                    {profile?.full_name || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-tickets')}>
                  <Ticket className="mr-2 h-4 w-4" />
                  My Tickets
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth?mode=signup')} className="bg-accent hover:bg-accent/90">
                Sign Up
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <div className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-lg font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t pt-4 mt-4">
                {user ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      {profile?.full_name || user.email}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full mb-2"
                      onClick={() => {
                        navigate(getDashboardLink());
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full mb-2"
                      onClick={() => {
                        navigate('/my-tickets');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Ticket className="mr-2 h-4 w-4" />
                      My Tickets
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full mb-2"
                      onClick={() => {
                        navigate('/auth');
                        setMobileMenuOpen(false);
                      }}
                    >
                      Sign In
                    </Button>
                    <Button
                      className="w-full bg-accent hover:bg-accent/90"
                      onClick={() => {
                        navigate('/auth?mode=signup');
                        setMobileMenuOpen(false);
                      }}
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
