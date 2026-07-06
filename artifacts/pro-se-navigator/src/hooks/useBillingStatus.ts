import { useGetBillingStatus } from "@workspace/api-client-react";

export type Tier = "free" | "advocate" | "warroom";

const TIER_RANK: Record<Tier, number> = { free: 0, advocate: 1, warroom: 2 };

export function useBillingStatus() {
  const query = useGetBillingStatus();

  const tier: Tier = (query.data?.tier as Tier) ?? "free";

  function hasAccess(minTier: Tier): boolean {
    return TIER_RANK[tier] >= TIER_RANK[minTier];
  }

  return {
    ...query,
    tier,
    hasAccess,
    isFree: tier === "free",
    isAdvocate: tier === "advocate",
    isWarRoom: tier === "warroom",
  };
}
