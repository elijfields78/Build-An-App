import { type RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { billingStorage } from "./billingStorage";
import { logger } from "./logger";

export type Tier = "free" | "advocate" | "warroom";

function productNameToTier(name?: string): Tier {
  if (!name) return "free";
  const lower = name.toLowerCase();
  if (lower.includes("war room") || lower.includes("warroom")) return "warroom";
  if (lower.includes("advocate")) return "advocate";
  return "free";
}

const TIER_RANK: Record<Tier, number> = { free: 0, advocate: 1, warroom: 2 };

export async function getUserTier(userId: string): Promise<Tier> {
  try {
    const user = await billingStorage.getUser(userId);
    if (!user?.stripeCustomerId) return "free";

    const sub = await billingStorage.getActiveSubscription(user.stripeCustomerId);
    if (!sub) return "free";

    return productNameToTier(sub.product_name as string | undefined);
  } catch (err) {
    logger.warn({ err, userId }, "Failed to resolve user tier, defaulting to free");
  }
  return "free";
}

export function requireTier(minTier: Tier): RequestHandler {
  return async (req, res, next): Promise<void> => {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const tier = await getUserTier(userId);
    if (TIER_RANK[tier] < TIER_RANK[minTier]) {
      res.status(403).json({
        error: "upgrade_required",
        requiredTier: minTier,
        currentTier: tier,
        message: `This feature requires the ${minTier === "advocate" ? "Advocate ($20/mo)" : "War Room ($79/mo)"} plan.`,
      });
      return;
    }
    next();
  };
}
