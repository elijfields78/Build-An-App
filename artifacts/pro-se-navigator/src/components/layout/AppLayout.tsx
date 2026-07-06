import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { LogOut, Briefcase, Plus, MessageSquare, Scale, Menu, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navLinks = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Briefcase,
      active: location === "/dashboard",
    },
    {
      label: "New Case",
      href: "/cases/new",
      icon: Plus,
      active: location === "/cases/new",
    },
    {
      label: "Legal Research",
      href: "/research",
      icon: BookOpen,
      active: location.startsWith("/research"),
    },
    {
      label: "AI Assistant",
      href: "/assistant",
      icon: MessageSquare,
      active: location.startsWith("/assistant"),
    },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <h1 className="font-serif text-lg font-bold text-white flex items-center gap-2">
          <Scale className="h-5 w-5 shrink-0" />
          Pro Se Navigator
        </h1>
        <button
          className="md:hidden text-slate-400 hover:text-white p-1"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="pb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Navigation
        </div>
        {navLinks.map(({ label, href, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-slate-300 hover:bg-sidebar-accent hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-sidebar-accent"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Disclaimer banner */}
      <div className="bg-blue-900 text-white px-4 py-2 text-center text-xs font-medium leading-snug">
        Legal information only — not legal advice. Always verify deadlines and local rules before filing.
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — drawer on mobile, fixed on desktop */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground flex flex-col
            transform transition-transform duration-200 ease-in-out
            md:relative md:translate-x-0 md:z-auto
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 overflow-hidden">
          <header className="h-14 border-b bg-white flex items-center justify-between px-4 shadow-sm z-10 shrink-0">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 mr-2"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="font-semibold text-slate-800 truncate flex-1 text-sm md:text-base">
              {title}
            </h2>
          </header>
          <div className="flex-1 overflow-auto flex flex-col min-h-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
