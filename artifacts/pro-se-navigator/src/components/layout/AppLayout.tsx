import React from "react";
import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { LogOut, Briefcase, Plus, MessageSquare, Scale, Menu, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const [location] = useLocation();
  const { signOut } = useClerk();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="bg-blue-900 text-white p-2 text-center text-xs font-medium">
        This app provides legal information, not legal advice. It does not replace an attorney. Always verify deadlines, local rules, and legal strategy before filing.
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r">
          <div className="p-4 border-b border-sidebar-border">
            <h1 className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Pro Se Navigator
            </h1>
          </div>
          
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <Link href="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location === '/dashboard' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-slate-300 hover:bg-sidebar-accent hover:text-white'}`}>
              <Briefcase className="h-4 w-4" />
              Dashboard
            </Link>
            
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cases
            </div>
            
            <Link href="/cases/new" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location === '/cases/new' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-slate-300 hover:bg-sidebar-accent hover:text-white'}`}>
              <Plus className="h-4 w-4" />
              New Case
            </Link>
            
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tools
            </div>
            
            <Link href="/research" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.startsWith('/research') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-slate-300 hover:bg-sidebar-accent hover:text-white'}`}>
              <BookOpen className="h-4 w-4" />
              Legal Research
            </Link>
            
            <Link href="/assistant" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.startsWith('/assistant') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-slate-300 hover:bg-sidebar-accent hover:text-white'}`}>
              <MessageSquare className="h-4 w-4" />
              AI Assistant
            </Link>
          </nav>
          
          <div className="p-4 border-t border-sidebar-border">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-sidebar-accent" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
          <header className="h-14 border-b bg-white flex items-center justify-between px-6 shadow-sm z-10">
            <h2 className="font-semibold text-slate-800">{title}</h2>
          </header>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
