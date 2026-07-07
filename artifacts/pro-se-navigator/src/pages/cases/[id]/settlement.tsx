import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Banknote, CheckCircle2, FileText, Handshake, Plus, Target, Trash2, TrendingUp } from "lucide-react";

type LeverageItem = {
  id: string;
  category: "Evidence" | "Procedure" | "Damages" | "Admissions" | "Cost pressure" | "Reputation";
  title: string;
  detail: string;
  strength: "Weak" | "Developing" | "Strong" | "Trial-ready";
};

const seedItems: LeverageItem[] = [
  { id: "admin-record", category: "Procedure", title: "Notice/cure record", detail: "Show the user attempted resolution before escalation through letters, proof of delivery, and response windows.", strength: "Developing" },
  { id: "damages", category: "Damages", title: "Damages documentation", detail: "Collect receipts, denials, financial loss, emotional distress notes, costs, and supporting records.", strength: "Weak" },
  { id: "trial-readiness", category: "Evidence", title: "Exhibit-ready proof file", detail: "Map each key allegation to an exhibit, witness, source document, or verified admission.", strength: "Developing" },
];

const settlementSignals = [
  { Icon: FileText, title: "Demand package", copy: "Admin letters + evidence + damages" },
  { Icon: Target, title: "Trial readiness", copy: "Prepared case creates settlement pressure" },
  { Icon: Banknote, title: "Damages proof", copy: "Numbers, receipts, losses, declarations" },
  { Icon: TrendingUp, title: "Risk map", copy: "Procedure + merits + cost pressure" },
];

const strengthValue = { Weak: 25, Developing: 50, Strong: 75, "Trial-ready": 100 } as const;
const strengthClass = {
  Weak: "border-destructive/40 text-destructive bg-destructive/10",
  Developing: "border-[#D4A843]/40 text-[#D4A843] bg-[#D4A843]/10",
  Strong: "border-blue-400/40 text-blue-400 bg-blue-400/10",
  "Trial-ready": "border-emerald-500/40 text-emerald-500 bg-emerald-500/10",
} as const;

export default function SettlementLeverageCenter({ params }: { params: { id: string } }) {
  const [items, setItems] = usePersistentState<LeverageItem[]>(`case:${params.id}:settlement-leverage`, seedItems);
  const [draft, setDraft] = usePersistentState<Omit<LeverageItem, "id">>(`case:${params.id}:settlement-draft`, {
    category: "Evidence",
    title: "",
    detail: "",
    strength: "Developing",
  });

  const average = Math.round(items.reduce((sum, item) => sum + strengthValue[item.strength], 0) / Math.max(items.length, 1));

  const addItem = () => {
    if (!draft.title.trim()) return;
    setItems((current) => [{ id: crypto.randomUUID(), ...draft }, ...current]);
    setDraft({ category: "Evidence", title: "", detail: "", strength: "Developing" });
  };

  return (
    <CaseLayout caseId={params.id} title="Settlement Leverage Center">
      <div className="space-y-6">
        <Card className="overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-background">
          <CardHeader>
            <Badge variant="outline" className="w-fit uppercase tracking-[0.3em] text-[10px]">Resolution posture</Badge>
            <CardTitle className="font-serif text-3xl flex items-center gap-3"><Handshake className="h-7 w-7 text-emerald-500" /> Build to settle, prepare to litigate</CardTitle>
            <CardDescription className="max-w-3xl">
              Track the pressure points that make the case look organized, documented, procedurally clean, and expensive to ignore. The goal is stronger resolution posture without reckless threats or unsupported claims.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border/60 bg-background/60 p-4 md:col-span-2">
              <div className="flex justify-between text-sm mb-2"><span>Leverage readiness</span><span className="font-mono font-bold">{average}%</span></div>
              <Progress value={average} className="h-2" />
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <div className="text-3xl font-mono font-bold text-emerald-500">{items.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">pressure points</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Add pressure point</CardTitle>
              <CardDescription>Capture evidence, procedure, damages, admissions, and cost pressure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as LeverageItem["category"] }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {["Evidence", "Procedure", "Damages", "Admissions", "Cost pressure", "Reputation"].map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              <div className="grid gap-2"><Label>Title</Label><Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></div>
              <div className="grid gap-2"><Label>Details</Label><Textarea className="min-h-28" value={draft.detail} onChange={(event) => setDraft((current) => ({ ...current, detail: event.target.value }))} /></div>
              <div className="grid gap-2">
                <Label>Strength</Label>
                <select value={draft.strength} onChange={(event) => setDraft((current) => ({ ...current, strength: event.target.value as LeverageItem["strength"] }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {["Weak", "Developing", "Strong", "Trial-ready"].map((strength) => <option key={strength} value={strength}>{strength}</option>)}
                </select>
              </div>
              <Button onClick={addItem} className="w-full">Save leverage item</Button>
            </CardContent>
          </Card>

          <div className="xl:col-span-2 grid gap-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex gap-2 mb-2"><Badge variant="outline">{item.category}</Badge><Badge variant="outline" className={strengthClass[item.strength]}>{item.strength}</Badge></div>
                      <CardTitle className="font-serif text-xl">{item.title}</CardTitle>
                      <CardDescription className="mt-2 leading-6">{item.detail}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setItems((current) => current.filter((saved) => saved.id !== item.id))}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {settlementSignals.map(({ Icon, title, copy }) => (
            <Card key={title} className="bg-card/70">
              <CardContent className="p-4">
                <Icon className="h-5 w-5 text-primary mb-3" />
                <div className="font-bold text-sm">{title}</div>
                <div className="text-xs text-muted-foreground mt-1">{copy}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </CaseLayout>
  );
}
