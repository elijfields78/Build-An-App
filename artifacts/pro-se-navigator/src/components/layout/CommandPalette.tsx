import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Search, Plus, FileText, CalendarClock, Scale, Gavel, ShieldAlert,
  BookOpenCheck, Handshake, BrainCircuit, ClipboardList, FileStack,
  UploadCloud, Mail, CheckSquare, Briefcase, FileSearch, LibraryBig,
  CalendarDays, Swords, UserCheck, ArrowRight, Zap, MessageSquare,
} from "lucide-react";

interface CaseItem {
  id: number;
  title: string;
  caseType?: string;
  status?: string;
}

interface CommandAction {
  id: string;
  label: string;
  hint: string;
  icon: React.ElementType;
  href: string;
  group: "Navigate" | "Cases" | "Actions" | "Tools";
}

const MODULE_ACTIONS: CommandAction[] = [
  { id: "new-case", label: "Create New Case", hint: "Start a new matter", icon: Plus, href: "/cases/new", group: "Actions" },
  { id: "research", label: "Legal Research", hint: "Search case law and statutes", icon: BookOpenCheck, href: "/research", group: "Tools" },
  { id: "assistant", label: "AI Assistant", hint: "Get guidance on your case", icon: MessageSquare, href: "/assistant", group: "Tools" },
  { id: "pricing", label: "View Pricing", hint: "Plans and upgrades", icon: Zap, href: "/pricing", group: "Tools" },
  { id: "affiliates", label: "Affiliate Center", hint: "Partner program", icon: Briefcase, href: "/affiliates", group: "Tools" },
  { id: "dashboard", label: "Dashboard", hint: "Back to overview", icon: FileText, href: "/dashboard", group: "Navigate" },
];

const CASE_MODULE_ICONS: Record<string, React.ElementType> = {
  story: FileText, memory: BrainCircuit, timeline: CalendarDays, evidence: UploadCloud,
  jurisdiction: Scale, "procedural-risk": ShieldAlert, ifp: Briefcase, complaint: FileSearch,
  "draft-review": Gavel, documents: FileStack, "dispute-letter": Mail, discovery: Search,
  motions: Swords, service: UserCheck, deadlines: CalendarClock, tasks: CheckSquare,
  "court-documents": ShieldAlert, administrative: ClipboardList, "case-law": BookOpenCheck,
  settlement: Handshake, playbooks: LibraryBig, agents: BrainCircuit, appeals: Scale,
};

export function CommandPalette({
  open,
  onOpenChange,
  cases,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cases: CaseItem[];
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, setLocation] = useLocation();

  const actions = useMemo(() => {
    const all: CommandAction[] = [...MODULE_ACTIONS];

    for (const caseItem of cases) {
      all.push({
        id: `case-${caseItem.id}`,
        label: caseItem.title,
        hint: `Case #${caseItem.id} · ${caseItem.caseType ?? "Civil"}`,
        icon: FileText,
        href: `/cases/${caseItem.id}`,
        group: "Cases",
      });

      for (const [slug, icon] of Object.entries(CASE_MODULE_ICONS)) {
        all.push({
          id: `case-${caseItem.id}-${slug}`,
          label: `${caseItem.title} → ${slug.replace(/-/g, " ")}`,
          hint: `Jump to ${slug} in this case`,
          icon,
          href: `/cases/${caseItem.id}/${slug}`,
          group: "Cases",
        });
      }
    }

    return all;
  }, [cases]);

  const filtered = useMemo(() => {
    if (!query.trim()) return actions.slice(0, 12);
    const q = query.toLowerCase();
    return actions.filter((a) => a.label.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q)).slice(0, 20);
  }, [actions, query]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const selected = filtered[selectedIndex];
        if (selected) {
          setLocation(selected.href);
          onOpenChange(false);
        }
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, selectedIndex, setLocation, onOpenChange]);

  if (!open) return null;

  const grouped = filtered.reduce((acc, action) => {
    if (!acc[action.group]) acc[action.group] = [];
    acc[action.group].push(action);
    return acc;
  }, {} as Record<string, CommandAction[]>);

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" onClick={() => onOpenChange(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Search cases, modules, actions..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results for "{query}"
            </div>
          )}
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{group}</div>
              {items.map((action) => {
                const Icon = action.icon;
                const idx = flatIndex++;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={action.id}
                    onClick={() => { setLocation(action.href); onOpenChange(false); }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                      isSelected ? "bg-primary/10 text-primary" : "hover:bg-accent/40"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-70" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{action.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{action.hint}</div>
                    </div>
                    {isSelected && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="border-t border-border px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>⌘K Toggle</span>
          </div>
          <span>{filtered.length} results</span>
        </div>
      </div>
    </div>
  );
}
