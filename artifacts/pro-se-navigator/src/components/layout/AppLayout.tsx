import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, useClerk } from "@clerk/react";
import { LogOut, Briefcase, Plus, MessageSquare, Scale, Menu, BookOpen, X, CreditCard, Zap, Settings, Sun, Moon, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBillingStatus } from "@/hooks/useBillingStatus";
import { useTheme } from "@//App";
import { CommandPalette } from "./CommandPalette";
import { useGetDashboard } from "@workspace/api-client-react";

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: "Free", color: "bg-slate-700/50 text-slate-300 border-slate-600" },
  advocate: { label: "Advocate", color: "bg-primary/20 text-primary border-primary/30" },
  warroom: { label: "War Room", color: "bg-[#D4A843]/20 text-[#D4A843] border-[#D4A843]/30" },
};

export function AppLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const [location] = useLocation();
  const { signOut, user } = useClerk();
  const { getToken } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { tier } = useBillingStatus();
  const { theme, setTheme } = useTheme();
  const [commandOpen, setCommandOpen] = useState(false);
  const { data: dashData } = useGetDashboard();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const navLinks = [
    { label: "Dashboard", href: "/dashboard", icon: Briefcase, active: location === "/dashboard" },
    { label: "New Case", href: "/cases/new", icon: Plus, active: location === "/cases/new" },
    { label: "Legal Research", href: "/research", icon: BookOpen, active: location.startsWith("/research") },
    { label: "AI Assistant", href: "/assistant", icon: MessageSquare, active: location.startsWith("/assistant") },
    { label: "Affiliates", href: "/affiliates", icon: Users, active: location.startsWith("/affiliates") },
  ];

  const tierInfo = TIER_LABELS[tier] ?? TIER_LABELS.free;
  const isPaid = tier === "advocate" || tier === "warroom";
  const initials = user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'U';

  const openPortal = async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json() as { url?: string };
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Failed to open billing portal", err);
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-sidebar-border flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-xl font-bold text-white flex items-center gap-2 tracking-tight">
            <Scale className="h-6 w-6 shrink-0 text-primary" />
            Pro Se Navigator
          </h1>
          <button
            className="md:hidden text-slate-400 hover:text-white p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border font-bold ${tierInfo.color}`}>
            {tierInfo.label} Tier
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Cases
        </div>
        {navLinks.slice(0, 2).map(({ label, href, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-primary text-white shadow-sm"
                : "text-slate-400 hover:bg-sidebar-accent hover:text-white"
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${active ? 'opacity-100' : 'opacity-70'}`} />
            {label}
          </Link>
        ))}

        <div className="pt-3 pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Tools
        </div>
        {navLinks.slice(2, 4).map(({ label, href, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-primary text-white shadow-sm"
                : "text-slate-400 hover:bg-sidebar-accent hover:text-white"
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${active ? 'opacity-100' : 'opacity-70'}`} />
            {label}
          </Link>
        ))}

        <div className="pt-3 pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Community
        </div>
        {navLinks.slice(4).map(({ label, href, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-primary text-white shadow-sm"
                : "text-slate-400 hover:bg-sidebar-accent hover:text-white"
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${active ? 'opacity-100' : 'opacity-70'}`} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <button
          onClick={() => setCommandOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-slate-400 hover:text-white hover:bg-sidebar-accent border border-sidebar-border/50 transition-all"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span>Search...</span>
          <kbd className="ml-auto text-[10px] font-mono opacity-60">⌘K</kbd>
        </button>

        <Link
          href="/pricing"
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
            location === "/pricing"
              ? "bg-primary text-white shadow-sm"
              : "text-slate-400 hover:bg-sidebar-accent hover:text-white"
          }`}
        >
          <CreditCard className={`h-4 w-4 shrink-0 ${location === '/pricing' ? 'opacity-100' : 'opacity-70'}`} />
          Billing & Plans
        </Link>

        {isPaid ? (
          <button
            onClick={() => { setSidebarOpen(false); void openPortal(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-400 hover:bg-sidebar-accent hover:text-white transition-all"
          >
            <Settings className="h-4 w-4 shrink-0 opacity-70" />
            Manage Billing
          </button>
        ) : (
          <Link
            href="/pricing"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-bold text-[#D4A843] hover:text-[#f3cd6e] hover:bg-sidebar-accent transition-all"
          >
            <Zap className="h-4 w-4 shrink-0" />
            Upgrade to Pro
          </Link>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-slate-400 hover:text-white hover:bg-sidebar-accent"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-sidebar-accent px-2"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>

          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase ml-2 shrink-0">
            {initials}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <div className="bg-primary/10 border-b border-primary/20 text-primary-foreground dark:text-primary px-4 py-2 text-center text-xs font-medium leading-snug">
        Legal information only — not legal advice. Always verify deadlines and local rules before filing.
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col
            backdrop-blur-xl border-r border-sidebar-border
            transform transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
            md:relative md:translate-x-0 md:z-auto
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <SidebarContent />
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
          <header className="h-14 border-b bg-card/80 backdrop-blur-md flex items-center justify-between px-4 z-10 shrink-0 sticky top-0">
            <button
              className="md:hidden p-2 -ml-2 rounded-md text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="font-serif font-semibold text-foreground truncate flex-1 text-sm md:text-base tracking-tight ml-2 md:ml-0">
              {title}
            </h2>
          </header>
          <div className="flex-1 overflow-auto flex flex-col min-h-0 relative z-0">
            {children}
          </div>
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} cases={dashData?.recentCases ?? []} />
    </div>
  );
}