import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase,
  FileText,
  LayoutDashboard,
  LineChart,
  LogOut,
  User,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();

  // Hide navbar on login and signup pages
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      // Still navigate to login even if signOut fails
      navigate("/login");
    }
  };

  // Define nav items with role requirements
  const allNavItems = [
    { path: "/jobs", icon: Briefcase, label: "Jobs", roles: ['worker', 'admin'] as string[] },
    { path: "/my-contracts", icon: FileText, label: "Contracts", roles: ['worker', 'admin'] as string[] },
    { path: "/dashboard", icon: LayoutDashboard, label: "Post Job", roles: ['grower', 'admin'] as string[] },
    { path: "/admin", icon: LineChart, label: "Admin", roles: ['admin'] as string[] },
  ];

  // Filter nav items based on user role
  const visibleNavItems = allNavItems.filter((item) => {
    try {
      if (!user || !userRole) return false;
      return item.roles.includes(userRole);
    } catch (error) {
      console.error("Error filtering nav items:", error);
      return false;
    }
  });

  const totalItems = Math.max(1, visibleNavItems.length + (user ? 1 : 0));

  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 px-4">
      <div className="mx-auto w-full max-w-md">
        <div 
          className="grid gap-2 rounded-3xl border border-border bg-white/90 p-2 shadow-lg backdrop-blur"
          style={{ gridTemplateColumns: `repeat(${totalItems}, 1fr)` }}
        >
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center rounded-2xl px-2 py-2 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="mb-1 h-5 w-5" strokeWidth={isActive ? 2.3 : 1.7} />
                {item.label}
              </Link>
            );
          })}
          {user ? (
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="h-auto flex-col rounded-2xl px-2 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground"
              >
                <LogOut className="mb-1 h-5 w-5" strokeWidth={1.7} />
                Sign Out
              </Button>
            </div>
          ) : (
            <Link
              to="/login"
              className={`flex flex-col items-center rounded-2xl px-2 py-2 text-[13px] font-medium transition-colors ${
                location.pathname === "/login" || location.pathname === "/signup"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="mb-1 h-5 w-5" strokeWidth={location.pathname === "/login" || location.pathname === "/signup" ? 2.3 : 1.7} />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

