import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./button";
import { Sheet, SheetContent, SheetTrigger } from "./sheet";
import { Menu, Home, Shield, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
}

function NavItem({ href, icon, children, isActive }: NavItemProps) {
  return (
    <div>
      <Link href={href}>
        <div className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
          isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
        )}>
          {icon}
          <span>{children}</span>
        </div>
      </Link>
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const navItems = (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-2xl font-bold tracking-tight text-primary">
          Hype Mod
        </h2>
        <div className="space-y-1">
          <NavItem
            href="/"
            icon={<Home className="h-4 w-4" />}
            isActive={location === "/"}
          >
            Mods
          </NavItem>
          <NavItem
            href="/admin"
            icon={<Shield className="h-4 w-4" />}
            isActive={location === "/admin"}
          >
            Admin
          </NavItem>
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