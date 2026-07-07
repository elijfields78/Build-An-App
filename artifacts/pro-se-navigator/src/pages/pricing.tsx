import React, { useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetBillingStatus, useGetBillingPlans, useCreateCheckoutSession, useCreatePortalSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Zap, Star, Shield, ExternalLink, Users } from "lucide-react";
import { toast } from "sonner";

function formatPrice(unitAmount: number | null | undefined, currency: string) {
  if (!unitAmount) return "$0";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(unitAmount / 100);
}

const TIER_FEATURES: Record<string, string[]> = {
  free: [
    "1 active case",
    "Story Builder",
    "Evidence upload (5 files)",
    "5 legal research queries/month",
    "3 court document scans/month",
    "Watermarked complaint export",
  ],
  advocate: [
    "Unlimited cases",
    "Full Story Builder & AI summaries",
    "Unlimited evidence upload",
    "Unlimited legal research",
    "Unlimited document scans",
    "Clean complaint export (no watermark)",
    "Jurisdiction Analyzer",
    "Fee Waiver (IFP) questionnaire",
    "AI Assistant — priority",
  ],
  warroom: [
    "Everything in Advocate",
    "Unlimited dispute letters",
    "Advanced AI legal strategy analysis",
    "Multi-defendant case management",
    "Priority AI queue",
    "Full document history export",
  ],
};

function tierKey(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("war room") || lower.includes("warroom")) return "warroom";
  if (lower.includes("advocate")) return "advocate";
  return "free";
}

function PlanIcon({ tier }: { tier: string }) {
  if (tier === "warroom") return <Shield className="h-8 w-8 text-[#D4A843]" />;
  if (tier === "advocate") return <Star className="h-8 w-8 text-primary" />;
  return <Zap className="h-8 w-8 text-muted-foreground" />;
}

export default function PricingPage() {
  const { data: status, isLoading: statusLoading } = useGetBillingStatus();
  const { data: plans, isLoading: plansLoading } = useGetBillingPlans();
  const createCheckout = useCreateCheckoutSession();
  const createPortal = useCreatePortalSession();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const currentTier = (status?.tier as string) ?? "free";

  const handleCheckout = async (priceId: string) => {
    setCheckingOut(priceId);
    try {
      const result = await createCheckout.mutateAsync({ data: { priceId } });
      if (result.url) window.location.href = result.url;
    } catch {
      toast.error("Failed to start checkout. Please try again.");
      setCheckingOut(null);
    }
  };

  const handlePortal = async () => {
    try {
      const result = await createPortal.mutateAsync();
      if (result.url) window.location.href = result.url;
    } catch {
      toast.error("Failed to open billing portal. Please try again.");
    }
  };

  const sortedPlans = plans
    ?.filter((p) => p.prices?.length > 0)
    .sort((a, b) => {
      const aPrice = a.prices[0]?.unitAmount ?? 0;
      const bPrice = b.prices[0]?.unitAmount ?? 0;
      return aPrice - bPrice;
    }) ?? [];

  const freePlan = { id: "free", name: "Free", description: "Get started with the basics", prices: [] };
  const allPlans = [freePlan, ...sortedPlans];

  const isLoading = statusLoading || plansLoading;

  return (
    <AppLayout title="Pricing & Plans">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 tracking-tighter">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            Pro se litigants deserve powerful tools. Start free, upgrade when you need more firepower.
          </p>
          {status?.subscription && (
            <div className="mt-8 inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-5 py-2.5 rounded-full text-sm font-bold tracking-wide">
              <Check className="h-4 w-4" />
              Active subscription: {status.subscription.productName}
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary hover:bg-primary/20 h-auto p-1.5 ml-2 rounded uppercase text-[10px]"
                onClick={handlePortal}
                disabled={createPortal.isPending}
              >
                {createPortal.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Manage
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {allPlans.map((plan) => {
              const tier = tierKey(plan.name);
              const monthlyPrice = plan.prices.find((p: any) => p.recurring?.interval === "month") ?? plan.prices[0];
              const isCurrent = currentTier === tier;
              const isPopular = tier === "advocate";
              const isWarRoom = tier === "warroom";
              const features = TIER_FEATURES[tier] ?? [];

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl border p-8 flex flex-col gap-6 bg-card/50 backdrop-blur-sm transition-all duration-300
                    ${isPopular ? "border-primary shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)] bg-gradient-to-b from-primary/5 to-transparent -translate-y-2" : "border-border/50 hover:border-border"}
                    ${isWarRoom ? "border-[#D4A843]/50 shadow-[0_0_30px_-10px_rgba(212,168,67,0.15)]" : ""}
                  `}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                      Most Popular
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${isPopular ? 'bg-primary/10' : isWarRoom ? 'bg-[#D4A843]/10' : 'bg-muted/30'}`}>
                      <PlanIcon tier={tier} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-foreground">{plan.name}</h2>
                      {plan.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-end gap-1.5 mt-2 mb-2">
                    <span className="text-5xl font-mono font-bold text-foreground tracking-tighter">
                      {monthlyPrice ? formatPrice(monthlyPrice.unitAmount, monthlyPrice.currency ?? "usd") : "$0"}
                    </span>
                    <span className="text-muted-foreground mb-1.5 font-medium">/mo</span>
                  </div>

                  <ul className="space-y-4 flex-1">
                    {features.map((feat) => (
                      <li key={feat} className="flex items-start gap-3 text-sm text-foreground/80 leading-snug">
                        <Check className={`h-4 w-4 shrink-0 mt-0.5 ${isPopular ? 'text-primary' : isWarRoom ? 'text-[#D4A843]' : 'text-muted-foreground'}`} />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-6 mt-auto">
                    {isCurrent ? (
                      <Button variant="outline" disabled className="w-full h-12 font-bold uppercase tracking-wider text-xs border-border/50">
                        Current Plan
                      </Button>
                    ) : tier === "free" ? (
                      <Button variant="outline" disabled className="w-full h-12 font-bold uppercase tracking-wider text-xs border-border/50">
                        Free Forever
                      </Button>
                    ) : (
                      <Button
                        className={`w-full h-12 font-bold uppercase tracking-wider text-xs shadow-lg transition-transform hover:-translate-y-0.5
                          ${isPopular ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25' : ''}
                          ${isWarRoom ? 'bg-[#D4A843] text-black hover:bg-[#b58f38] shadow-[#D4A843]/20' : ''}
                        `}
                        variant={isPopular ? "default" : "outline"}
                        disabled={checkingOut === monthlyPrice?.id || createCheckout.isPending}
                        onClick={() => monthlyPrice?.id && handleCheckout(monthlyPrice.id)}
                      >
                        {checkingOut === monthlyPrice?.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Upgrade to {plan.name}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-20 border-t border-border/50 pt-12">
          <div className="mb-12 rounded-3xl border border-[#D4A843]/30 bg-[#D4A843]/5 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[#D4A843] font-bold uppercase tracking-widest text-[10px] mb-2">
                <Users className="h-4 w-4" /> Educators / coaches / community leaders
              </div>
              <h2 className="font-serif text-2xl font-bold">Earn recurring revenue by referring Pro Se Navigator.</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                If you teach credit, litigation, legal research, or self-representation, the affiliate center models recurring partner income and gives you a copy-paste pitch.
              </p>
            </div>
            <Button asChild className="bg-[#D4A843] text-black hover:bg-[#b58f38]">
              <Link href="/affiliates">Open Affiliate Center</Link>
            </Button>
          </div>

          <h2 className="text-2xl font-serif font-bold text-foreground mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 max-w-4xl mx-auto text-sm">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel from the billing portal at any time. You keep access until the end of your billing period.",
              },
              {
                q: "Is my data secure?",
                a: "All data is encrypted in transit and at rest. We never share your case information.",
              },
              {
                q: "What counts as a research query?",
                a: "Each question you submit in the Legal Research section counts as one query.",
              },
              {
                q: "Can I upgrade mid-month?",
                a: "Yes. Stripe prorates the charge so you only pay for the remaining days.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="space-y-2">
                <p className="font-bold text-foreground text-base tracking-tight">{q}</p>
                <p className="text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}