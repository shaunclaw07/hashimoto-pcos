"use client";

import Link from "next/link";
import { Home, ScanBarcode, Search, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/scanner", icon: ScanBarcode, label: "Scanner" },
  { href: "/products", icon: Search, label: "Suche" },
  { href: "/settings", icon: Settings, label: "Profil" },
];

export function BottomNav() {
  const pathname = usePathname();

  // Don't show nav on onboarding page
  if (pathname === "/onboarding") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 bottom-nav-safe">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl px-5 py-3 text-sm font-medium transition-all min-w-[4rem]",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className={cn("h-6 w-6 transition-transform", isActive ? "scale-110" : "")} />
              <span className="text-xs mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
