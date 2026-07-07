import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Copy, DollarSign, Megaphone, Network, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

const partnerTypes = [
  "Credit repair educators",
  "FCRA / FDCPA litigation teachers",
  "Pro se community leaders",
  "Discord and Facebook group admins",
  "Seminar hosts and coaches",
  "YouTube / TikTok legal education creators",
];

const defaultPitch = `Your community is already using generic AI tools to organize legal research, drafts, and strategy.\n\nPro Se Navigator is built specifically for self-represented litigants: case workspaces, evidence organization, administrative process letters, docket/deadline intelligence, case law verification, and AI-assisted drafting support.\n\nYou keep teaching. Pro Se Navigator gives your students the operating system to execute between lessons. Founding partners can earn recurring commission for every subscriber they refer.`;

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function AffiliatesPage() {
  const [referredUsers, setReferredUsers] = useState("100");
  const [monthlyPrice, setMonthlyPrice] = useState("97");
  const [commission, setCommission] = useState("30");
  const [pitch, setPitch] = useState(defaultPitch);

  const monthlyEarnings = useMemo(() => {
    const users = Number(referredUsers) || 0;
    const price = Number(monthlyPrice) || 0;
    const pct = Number(commission) || 0;
    return users * price * (pct / 100);
  }, [referredUsers, monthlyPrice, commission]);

  const copyPitch = async () => {
    await navigator.clipboard.writeText(pitch);
    toast.success("Affiliate pitch copied");
  };

  return (
    <AppLayout title="Affiliate Partner Center">
      <div className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8">
        <Card className="relative overflow-hidden border-[#D4A843]/30 bg-[radial-gradient(circle_at_top_left,rgba(212,168,67,0.24),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] text-white shadow-2xl shadow-[#D4A843]/10">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[#D4A843]/20 blur-3xl" />
          <CardContent className="relative z-10 p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
              <div className="lg:col-span-2">
                <Badge className="bg-[#D4A843]/15 text-[#D4A843] border-[#D4A843]/30 mb-4" variant="outline">
                  <Sparkles className="mr-2 h-3.5 w-3.5" /> Revenue engine
                </Badge>
                <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight">
                  Turn legal educators into recurring growth partners.
                </h1>
                <p className="mt-4 max-w-2xl text-slate-300 leading-7">
                  Pro Se Navigator should not compete with educators, coaches, and community leaders. It should power their communities and pay them for distribution.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Target partner outcome</div>
                <div className="mt-2 text-3xl font-mono font-bold text-[#D4A843]">$2k–$10k/mo</div>
                <p className="mt-2 text-sm text-slate-300">Potential recurring partner income for strong educators with loyal audiences.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#D4A843]" /> Affiliate Earnings Calculator
              </CardTitle>
              <CardDescription>
                Model how recurring commissions could work for credit, litigation, and pro se educators.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="grid gap-2">
                <Label htmlFor="users">Referred users</Label>
                <Input id="users" value={referredUsers} onChange={(event) => setReferredUsers(event.target.value)} type="number" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Monthly plan price</Label>
                <Input id="price" value={monthlyPrice} onChange={(event) => setMonthlyPrice(event.target.value)} type="number" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="commission">Commission %</Label>
                <Input id="commission" value={commission} onChange={(event) => setCommission(event.target.value)} type="number" />
              </div>
              <div className="rounded-xl border border-[#D4A843]/30 bg-[#D4A843]/10 p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Estimated monthly commission</div>
                <div className="mt-1 text-3xl font-mono font-bold text-[#D4A843]">{currency(monthlyEarnings)}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" /> Recommended Structure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                "30% recurring commission for 12 months",
                "40% founding educator commission for selected partners",
                "Custom landing pages and partner codes",
                "Rewardful or FirstPromoter + Stripe first",
                "Custom affiliate dashboard later",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" /> Copy-Paste Partner Pitch
              </CardTitle>
              <CardDescription>
                Use this for educators, group admins, seminar hosts, and litigation coaches.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea className="min-h-64" value={pitch} onChange={(event) => setPitch(event.target.value)} />
              <Button onClick={copyPitch}>
                <Copy className="mr-2 h-4 w-4" /> Copy pitch
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Users className="h-5 w-5 text-[#D4A843]" /> Best Partner Targets
              </CardTitle>
              <CardDescription>
                The fastest path to MRR is through trusted educators who already tell audiences which tools to use.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {partnerTypes.map((type) => (
                <div key={type} className="rounded-lg border border-border/60 bg-background/50 p-3 text-sm font-medium">
                  {type}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="font-serif">Partner compliance guardrail</CardTitle>
            <CardDescription>
              Affiliates should promote Pro Se Navigator as legal-information, organization, research, and drafting-support software — not as a law firm, attorney substitute, or guaranteed case-winning tool.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </AppLayout>
  );
}
