import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, BookOpen, FolderTree, GraduationCap, Settings, Shield, LogOut, GitBranch } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Courses", url: "/admin/courses", icon: BookOpen },
  { title: "Categories", url: "/admin/categories", icon: FolderTree },
  { title: "Mentors", url: "/admin/mentors", icon: GraduationCap },
  { title: "Integrations", url: "/admin/integrations", icon: GitBranch },
  { title: "Audit", url: "/admin/audit", icon: Shield },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export default function AdminTopNav() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isActive = (item: typeof navItems[0]) =>
    item.exact ? location.pathname === item.url : location.pathname.startsWith(item.url);

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center h-14 px-6 gap-1">
        <Link to="/" className="font-heading font-bold text-lg text-foreground tracking-tight mr-6">
          SuperlativeBridge
        </Link>
        {user?.name && <span className="text-sm text-foreground font-medium mr-2 hidden md:inline">{user.name}</span>}
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full mr-4">Admin</span>
        <div className="flex items-center gap-0.5 overflow-x-auto flex-1">
          {navItems.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive(item)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="hidden lg:inline">{item.title}</span>
            </Link>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground ml-2" onClick={signOut}>
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </nav>
  );
}
