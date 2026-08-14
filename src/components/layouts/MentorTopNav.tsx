import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  CalendarClock,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { title: "Dashboard", url: "/mentor", icon: LayoutDashboard, exact: true },
  { title: "My Sessions", url: "/mentor/sessions", icon: CalendarClock },
  { title: "Profile", url: "/profile", icon: User },
];

export default function MentorTopNav() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isActive = (url: string, exact?: boolean) =>
    exact
      ? location.pathname === url
      : location.pathname === url || location.pathname.startsWith(url + "/");

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center h-14 px-6 gap-1">
        <Link
          to="/mentor"
          className="font-heading font-bold text-lg text-foreground tracking-tight mr-6"
        >
          SuperlativeBridge
        </Link>
        {user?.name && (
          <span className="text-sm text-foreground font-medium mr-2 hidden md:inline">
            {user.name}
          </span>
        )}
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full mr-4">
          Mentor
        </span>
        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive(item.url, item.exact)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.title}
            </Link>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </nav>
  );
}
