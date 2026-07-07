import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePersistentState } from "@/hooks/usePersistentState";
import { CalendarDays, FileText, Gavel, MailCheck, Plus, ShieldCheck, Trash2, UploadCloud } from "lucide-react";

type TimelineCategory = "Fact" | "Evidence" | "Admin Letter" | "Filing" | "Deadline" | "Settlement";

type TimelineEvent = {
  id: string;
  date: string;
  category: TimelineCategory;
  title: string;
  detail: string;
  proof: string;
  significance: "Background" | "Claim element" | "Procedural trigger" | "Settlement leverage" | "Damages proof";
};

const today = new Date().toISOString().slice(0, 10);
const seedEvents: TimelineEvent[] = [
  { id: "seed-dispute", date: today, category: "Fact", title: "Core dispute event", detail: "Capture the main event that started the dispute.", proof: "Evidence to attach", significance: "Claim element" },
  { id: "seed-notice", date: today, category: "Admin Letter", title: "Notice / dispute letter", detail: "Track when notice was sent and what cure was requested.", proof: "Certified mail, email, portal proof", significance: "Settlement leverage" },
  { id: "seed-deadline", date: today, category: "Deadline", title: "Response deadline", detail: "Track response windows from filings, service, letters, orders, and discovery.", proof: "Rule/order/source to verify", significance: "Procedural trigger" },
];

const categoryIcon = {
  Fact: FileText,
  Evidence: UploadCloud,
  "Admin Letter": MailCheck,
  Filing: Gavel,
  Deadline: CalendarDays,
  Settlement: ShieldCheck,
} as const;

const categoryClass = {
  Fact: "border-primary/40 text-primary bg-primary/10",
  Evidence: "border-emerald-500/40 text-emerald-500 bg-emerald-500/10",
  "Admin Letter": "border-blue-400/40 text-blue-400 bg-blue-400/10",
  Filing: "border-purple-400/40 text-purple-400 bg-purple-400/10",
  Deadline: "border-[#D4A843]/40 text-[#D4A843] bg-[#D4A843]/10",
  Settlement: "border-pink-400/40 text-pink-400 bg-pink-400/10",
} as const;

export default function LitigationTimeline({ params }: { params: { id: string } }) {
  const [events, setEvents] = usePersistentState<TimelineEvent[]>(`case:${params.id}:timeline-events`, seedEvents);
  const [draft, setDraft] = usePersistentState<Omit<TimelineEvent, "id">>(`case:${params.id}:timeline-draft`, {
    date: today,
    category: "Fact",
    title: "",
    detail: "",
    proof: "",
    significance: "Background",
  });

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const addEvent = () => {
    if (!draft.date || !draft.title.trim()) return;
    setEvents((current) => [{ id: crypto.randomUUID(), ...draft }, ...current]);
    setDraft({ date: today, category: "Fact", title: "", detail: "", proof: "", significance: "Background" });
  };

  return (
    <CaseLayout caseId={params.id} title="Litigation Timeline Builder">
      <div className="space-y-6">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background">
          <CardHeader>
            <Badge variant="outline" className="w-fit uppercase tracking-[0.3em] text-[10px]">Chronology engine</Badge>
            <CardTitle className="font-serif text-3xl flex items-center gap-3"><CalendarDays className="h-7 w-7 text-primary" /> Litigation Timeline</CardTitle>
            <CardDescription className="max-w-3xl">
              Build a judge-readable chronology that connects facts, proof, letters, filings, deadlines, damages, and settlement leverage. Later, agents will use this as chronological memory.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {(["Fact", "Evidence", "Admin Letter", "Filing", "Deadline", "Settlement"] as TimelineCategory[]).map((category) => (
              <div key={category} className="rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="text-2xl font-mono font-bold text-primary">{events.filter((event) => event.category === category).length}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{category}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Add timeline event</CardTitle>
              <CardDescription>Capture what happened, when, why it matters, and what proves it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2"><Label>Date</Label><Input type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as TimelineCategory }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                    {Object.keys(categoryIcon).map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-2"><Label>Title</Label><Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></div>
              <div className="grid gap-2"><Label>Details</Label><Textarea className="min-h-24" value={draft.detail} onChange={(event) => setDraft((current) => ({ ...current, detail: event.target.value }))} /></div>
              <div className="grid gap-2"><Label>Proof / source</Label><Input value={draft.proof} onChange={(event) => setDraft((current) => ({ ...current, proof: event.target.value }))} placeholder="Exhibit, email, receipt, docket entry..." /></div>
              <div className="grid gap-2">
                <Label>Significance</Label>
                <select value={draft.significance} onChange={(event) => setDraft((current) => ({ ...current, significance: event.target.value as TimelineEvent["significance"] }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {["Background", "Claim element", "Procedural trigger", "Settlement leverage", "Damages proof"].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <Button className="w-full" onClick={addEvent}>Add event</Button>
            </CardContent>
          </Card>

          <div className="xl:col-span-2 relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border hidden md:block" />
            <div className="space-y-4">
              {sortedEvents.map((event) => {
                const Icon = categoryIcon[event.category];
                return (
                  <Card key={event.id} className="relative md:ml-12 bg-card/70 border-border/60">
                    <div className="hidden md:flex absolute -left-[3.25rem] top-5 h-10 w-10 rounded-full border border-border bg-background items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant="outline" className={categoryClass[event.category]}>{event.category}</Badge>
                            <Badge variant="outline">{event.significance}</Badge>
                            <Badge variant="outline" className="font-mono">{event.date}</Badge>
                          </div>
                          <h3 className="font-serif text-xl">{event.title}</h3>
                          <p className="text-sm text-muted-foreground leading-6 mt-2 whitespace-pre-wrap">{event.detail}</p>
                          <div className="mt-3 rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs text-muted-foreground">Proof: {event.proof || "Not linked yet"}</div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setEvents((current) => current.filter((saved) => saved.id !== event.id))}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </CaseLayout>
  );
}
