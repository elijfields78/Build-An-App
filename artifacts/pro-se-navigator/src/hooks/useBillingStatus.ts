import { useGetBillingStatus } from "@workspace/api-client-react";

export type Tier = "free" | "advocate" | "warroom";

const TIER_RANK: Record<Tier, number> = { free: 0, advocate: 1, warroom: 2 };

export type UsageInfo = Record<string, { used: number; limit: number }>;

export function useBillingStatus() {
  const query = useGetBillingStatus();

  const tier: Tier = (query.data?.tier as Tier) ?? "free";
  const usage = (query.data as { usage?: UsageInfo } | undefined)?.usage ?? null;

  function hasAccess(minTier: Tier): boolean {
    return TIER_RANK[tier] >= TIER_RANK[minTier];
  }

  return {
    ...query,
    tier,
    usage,
    hasAccess,
    isFree: tier === "free",
    isAdvocate: tier === "advocate",
    isWarRoom: tier === "warroom",
  };
}
