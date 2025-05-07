import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Building } from "lucide-react";
import { useTenantRole } from "@/hooks/useTenantRole";

interface NavBarProps {
  tenant?: {
    name: string;
    slug: string;
    id?: string;
  };
  onSignOut?: () => void;
}

export function NavBar({ tenant, onSignOut }: NavBarProps) {
  const { user, profile, signOut } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  // Use the slug, not the ID for the tenant role lookup
  const { role } = useTenantRole(tenant?.slug, user?.id);

  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut();
    } else {
      await signOut();
      if (tenant) {
        navigate(`/tenant/${tenant.slug}/auth`);
      } else {
        navigate("/");
      }
    }
  };

  const getDisplayName = () => {
    if (profile?.first_name) return profile.first_name;
    if (user?.email) {
      const username = user.email.split("@")[0];
      return username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getInitials = () => {
    if (profile?.first_name) return profile.first_name[0].toUpperCase();
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return "U";
  };

  const getProfileLink = () => {
    if (tenant) {
      return `/tenant/${tenant.slug}/profile`;
    } else {
      return "/profile";
    }
  };

  const showManageTenants =
    (tenant?.slug && role === "owner") || (user && location.pathname === "/");

  return (
    <header className="bg-background border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          {tenant ? (
            <Link to={`/tenant/${tenant.slug}`} className="text-lg font-semibold">
              {tenant.name}
            </Link>
          ) : (
            <Link to="/dashboard" className="text-xl font-semibold text-primary">
              Chabod
            </Link>
          )}
        </div>

        <div>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{getDisplayName()}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email || user?.email}</p>
                </div>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link to={getProfileLink()} className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>個人資料</span>
                  </Link>
                </DropdownMenuItem>

                {showManageTenants && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center cursor-pointer">
                      <Building className="mr-2 h-4 w-4" />
                      <span>管理教會</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-600 hover:text-red-700 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>登出</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link to="/auth">登入</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
