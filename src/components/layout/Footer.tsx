import { Link } from 'react-router-dom';
import { Bus, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                <Bus className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold">Ticketa</span>
            </Link>
            <p className="text-sm text-primary-foreground/80">
              Sierra Leone's trusted bus ticketing platform. Book your journey with confidence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <Link to="/search" className="hover:text-primary-foreground transition-colors">
                  Find Buses
                </Link>
              </li>
              <li>
                <Link to="/companies" className="hover:text-primary-foreground transition-colors">
                  Bus Companies
                </Link>
              </li>
              <li>
                <Link to="/my-tickets" className="hover:text-primary-foreground transition-colors">
                  My Tickets
                </Link>
              </li>
            </ul>
          </div>

          {/* For Business */}
          <div>
            <h3 className="font-semibold mb-4">For Business</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <Link to="/auth?mode=signup&role=company" className="hover:text-primary-foreground transition-colors">
                  Register Your Company
                </Link>
              </li>
              <li>
                <Link to="/company" className="hover:text-primary-foreground transition-colors">
                  Company Dashboard
                </Link>
              </li>
              <li>
                <Link to="/driver" className="hover:text-primary-foreground transition-colors">
                  Driver Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Freetown, Sierra Leone</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+232 XX XXX XXX</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>support@ticketa.sl</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Ticketa. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
