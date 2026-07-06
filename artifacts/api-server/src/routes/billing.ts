import { Router } from "express";
import { getAuth } from "@clerk/express";
import { billingStorage } from "../lib/billingStorage";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { getUserTier } from "../lib/tierGate";
import { logger } from "../lib/logger";

const router = Router();

// GET /billing/status — returns current user tier + subscription info + usage
router.get("/billing/status", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await billingStorage.getOrCreateUser(userId);
    const tier = await getUserTier(userId);

    let subscription = null;
    if (user?.stripeCustomerId) {
      subscription = await billingStorage.getActiveSubscription(user.stripeCustomerId);
    }

    const usage = tier === "free" ? await billingStorage.getMonthlyUsageSummary(userId) : null;

    return res.json({
      tier,
      stripeCustomerId: user?.stripeCustomerId ?? null,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            productName: subscription.product_name,
            currentPeriodEnd: subscription.current_period_end,
          }
        : null,
      usage,
    });
  } catch (err) {
    logger.error({ err }, "Error fetching billing status");
    return res.status(500).json({ error: "Failed to fetch billing status" });
  }
});

// GET /billing/plans — returns available Stripe products+prices
router.get("/billing/plans", async (_req, res) => {
  try {
    const products = await billingStorage.getProductsWithPrices();
    return res.json(products);
  } catch (err) {
    logger.error({ err }, "Error fetching billing plans");
    return res.status(500).json({ error: "Failed to fetch billing plans" });
  }
});

// POST /billing/checkout — create a Stripe Checkout session
router.post("/billing/checkout", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { priceId } = req.body as { priceId: string };
    if (!priceId) return res.status(400).json({ error: "priceId required" });

    const allowedPriceIds = await billingStorage.getAllowedPriceIds();
    if (!allowedPriceIds.includes(priceId)) {
      return res.status(400).json({ error: "Invalid price ID" });
    }

    const user = await billingStorage.getOrCreateUser(userId);
    const stripe = await getUncachableStripeClient();

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { userId } });
      await billingStorage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
      customerId = customer.id;
    }

    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/dashboard?billing=success`,
      cancel_url: `${baseUrl}/pricing?billing=cancel`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "Error creating checkout session");
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// POST /billing/portal — create a Stripe Customer Portal session
router.post("/billing/portal", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await billingStorage.getUser(userId);
    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: "No billing account found" });
    }

    const stripe = await getUncachableStripeClient();
    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/dashboard`,
    });

    return res.json({ url: portalSession.url });
  } catch (err) {
    logger.error({ err }, "Error creating portal session");
    return res.status(500).json({ error: "Failed to create portal session" });
  }
});

export default router;
