import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./button";
import { Sheet, SheetContent, SheetTrigger } from "./sheet";
import { Separator } from "./separator";
import { useAuth } from "@/hooks/use-auth";
import { Menu, Home, MessageSquare, Shield, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
}

function NavItem({ href, icon, children, isActive }: NavItemProps) {
  return (
    <Link href={href}>
      <a className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
        isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
      )}>
        {icon}
        <span>{children}</span>
      </a>
    </Link>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [open, setOpen] = useState(false);

  const navItems = (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Mod Platform
        </h2>
        <div className="space-y-1">
          <NavItem
            href="/"
            icon={<Home className="h-4 w-4" />}
            isActive={location === "/"}
          >
            Home
          </NavItem>
          <NavItem
            href="/chat"
            icon={<MessageSquare className="h-4 w-4" />}
            isActive={location === "/chat"}
          >
            Chat
          </NavItem>
          {user?.isAdmin && (
            <NavItem
              href="/admin"
              icon={<Shield className="h-4 w-4" />}
              isActive={location === "/admin"}
            >
              Admin
            </NavItem>
          )}
        </div>
      </div>
      <Separator />
      <div className="px-3 py-2">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="outline" size="icon" className="fixed top-4 left-4">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w-[300px]">
          {navItems}
        </SheetContent>
      </Sheet>
      <nav className="hidden lg:block fixed top-0 left-0 h-screen w-[240px] border-r bg-card">
        {navItems}
      </nav>
    </>
  );
}
