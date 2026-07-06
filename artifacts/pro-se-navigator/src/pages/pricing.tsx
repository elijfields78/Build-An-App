import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetBillingStatus, useGetBillingPlans, useCreateCheckoutSession, useCreatePortalSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Zap, Star, Shield, ExternalLink } from "lucide-react";
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
  if (tier === "warroom") return <Shield className="h-6 w-6 text-amber-500" />;
  if (tier === "advocate") return <Star className="h-6 w-6 text-primary" />;
  return <Zap className="h-6 w-6 text-slate-400" />;
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
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Simple, Transparent Pricing</h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            Pro se litigants deserve powerful tools. Start free, upgrade when you need more firepower.
          </p>
          {status?.subscription && (
            <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              <Check className="h-4 w-4" />
              Active subscription: {status.subscription.productName}
              <Button
                variant="ghost"
                size="sm"
                className="text-green-800 hover:text-green-900 h-auto p-0 ml-2 underline"
                onClick={handlePortal}
                disabled={createPortal.isPending}
              >
                {createPortal.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {allPlans.map((plan) => {
              const tier = tierKey(plan.name);
              const monthlyPrice = plan.prices.find((p: any) => p.recurring?.interval === "month") ?? plan.prices[0];
              const isCurrent = currentTier === tier;
              const isPopular = tier === "advocate";
              const features = TIER_FEATURES[tier] ?? [];

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-7 flex flex-col gap-5 shadow-sm transition-shadow hover:shadow-md ${
                    isPopular
                      ? "border-primary ring-2 ring-primary bg-primary/5"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1">
                      Most Popular
                    </Badge>
                  )}

                  <div className="flex items-center gap-3">
                    <PlanIcon tier={tier} />
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
                      {plan.description && (
                        <p className="text-xs text-slate-500">{plan.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">
                      {monthlyPrice ? formatPrice(monthlyPrice.unitAmount, monthlyPrice.currency ?? "usd") : "$0"}
                    </span>
                    <span className="text-slate-500 mb-1">/mo</span>
                  </div>

                  <ul className="space-y-2 flex-1">
                    {features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button variant="outline" disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : tier === "free" ? (
                    <Button variant="outline" disabled className="w-full">
                      Free Forever
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isPopular ? "default" : "outline"}
                      disabled={checkingOut === monthlyPrice?.id || createCheckout.isPending}
                      onClick={() => monthlyPrice?.id && handleCheckout(monthlyPrice.id)}
                    >
                      {checkingOut === monthlyPrice?.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Get {plan.name}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-8">
          All plans include a 7-day free trial · Secured by Stripe · Cancel anytime
        </p>

        <div className="mt-12 border-t pt-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-sm">
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
              <div key={q}>
                <p className="font-semibold text-slate-800 mb-1">{q}</p>
                <p className="text-slate-600">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
