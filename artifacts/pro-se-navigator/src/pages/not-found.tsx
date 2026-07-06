import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Aurora gradient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/20 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md mx-4 relative z-10 text-center">
        <ShieldAlert className="h-16 w-16 text-primary mx-auto mb-6 opacity-80" />
        <h1 className="text-6xl font-serif font-bold text-foreground mb-4 tracking-tighter">404</h1>
        <p className="text-xl font-medium text-foreground/80 mb-2">Jurisdiction Denied</p>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-xs mx-auto">
          The page you are looking for has been dismissed without prejudice. It may have been moved or no longer exists.
        </p>
        <Link 
          href="/dashboard" 
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          Return to Command Center
        </Link>
      </div>
    </div>
  );
}