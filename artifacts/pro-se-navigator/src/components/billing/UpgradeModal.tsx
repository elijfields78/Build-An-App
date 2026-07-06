import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCreateCheckoutSession, useGetBillingPlans } from "@workspace/api-client-react";
import { Loader2, Zap, Shield, Star } from "lucide-react";
import { toast } from "sonner";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredTier?: "advocate" | "warroom";
  featureName?: string;
}

const TIER_ORDER = ["Advocate", "War Room"];

function formatPrice(unitAmount: number | null | undefined, currency: string) {
  if (!unitAmount) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(unitAmount / 100);
}

export function UpgradeModal({ open, onOpenChange, requiredTier, featureName }: UpgradeModalProps) {
  const { data: plans, isLoading: plansLoading } = useGetBillingPlans();
  const createCheckout = useCreateCheckoutSession();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const sortedPlans = plans
    ?.filter((p) => p.prices?.length > 0)
    .sort((a, b) => {
      const aPrice = a.prices[0]?.unitAmount ?? 0;
      const bPrice = b.prices[0]?.unitAmount ?? 0;
      return aPrice - bPrice;
    }) ?? [];

  const handleCheckout = async (priceId: string) => {
    setCheckingOut(priceId);
    try {
      const result = await createCheckout.mutateAsync({ data: { priceId } });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      toast.error("Failed to start checkout. Please try again.");
      setCheckingOut(null);
    }
  };

  const tierIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("war room")) return <Shield className="h-5 w-5" />;
    if (lower.includes("advocate")) return <Star className="h-5 w-5" />;
    return <Zap className="h-5 w-5" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {featureName ? `Unlock ${featureName}` : "Upgrade Your Plan"}
          </DialogTitle>
          <DialogDescription>
            {requiredTier === "warroom"
              ? "This feature requires the War Room plan."
              : requiredTier === "advocate"
              ? "This feature requires the Advocate plan or higher."
              : "Choose the plan that fits your needs."}
          </DialogDescription>
        </DialogHeader>

        {plansLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sortedPlans.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>Pricing plans are being set up. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {sortedPlans.map((plan) => {
              const monthlyPrice = plan.prices.find(
                (p: any) => p.recurring?.interval === "month"
              ) ?? plan.prices[0];
              const isHighlighted = requiredTier === "warroom"
                ? plan.name.toLowerCase().includes("war room")
                : plan.name.toLowerCase().includes("advocate");

              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-6 flex flex-col gap-4 ${
                    isHighlighted
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-slate-200"
                  }`}
                >
                  {isHighlighted && (
                    <Badge className="self-start">Recommended</Badge>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-primary">{tierIcon(plan.name)}</span>
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-slate-600">{plan.description}</p>
                  )}
                  <div className="text-3xl font-bold">
                    {monthlyPrice
                      ? `${formatPrice(monthlyPrice.unitAmount, monthlyPrice.currency ?? "usd")}`
                      : "—"}
                    <span className="text-base font-normal text-slate-500">/mo</span>
                  </div>
                  <Button
                    className="w-full mt-auto"
                    variant={isHighlighted ? "default" : "outline"}
                    disabled={checkingOut === monthlyPrice?.id || createCheckout.isPending}
                    onClick={() => monthlyPrice?.id && handleCheckout(monthlyPrice.id)}
                  >
                    {checkingOut === monthlyPrice?.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Get {plan.name}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-2">
          Secure payment via Stripe · Cancel anytime
        </p>
      </DialogContent>
    </Dialog>
  );
}
