import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, User, Globe, Rocket, Users, Building2, FileText, ChevronLeft, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";

const mainNav = [
  { title: "Dashboard", url: "/student", icon: LayoutDashboard },
  { title: "Courses", url: "/courses", icon: BookOpen },
  { title: "My Profile", url: "/profile", icon: User },
];

const programNav = [
  { title: "Gov Programs", url: "/programs", icon: Globe },
  { title: "Visa Programs", url: "/visa-programs", icon: FileText },
  { title: "Entrepreneurs", url: "/entrepreneurship", icon: Rocket },
  { title: "Marketplace", url: "/marketplace", icon: Building2 },
  { title: "Community", url: "/community", icon: Users },
];

export function StudentSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border p-4">
        <Link to="/" className="flex items-center gap-2">
          {!collapsed ? (
            <div>
              <span className="font-heading font-bold text-lg text-foreground">SuperlativeBridge</span>
              <p className="text-xs text-muted-foreground">GIG Worker Portal</p>
            </div>
          ) : (
            <span className="font-heading font-bold text-lg text-foreground">SB</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Learning</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url} end={item.url === "/student"} activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Programs</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {programNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url} activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to Home">
              <Link to="/" className="text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4" />
                {!collapsed && <span>Back to Home</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Sign Out">
              <Link to="/signin" className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
                {!collapsed && <span>Sign Out</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
