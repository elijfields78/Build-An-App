import { db } from "@workspace/db";
import { usersTable, userUsageTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const FREE_TIER_LIMITS: Record<string, number> = {
  research_ask: 3,
  court_doc_scan: 2,
};

export class BillingStorage {
  async getOrCreateUser(userId: string, email?: string) {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (existing) return existing;

    const [created] = await db
      .insert(usersTable)
      .values({ id: userId, email: email ?? null })
      .returning();
    return created;
  }

  async updateUserStripeInfo(
    userId: string,
    data: { stripeCustomerId?: string; stripeSubscriptionId?: string }
  ) {
    const [updated] = await db
      .update(usersTable)
      .set(data)
      .where(eq(usersTable.id, userId))
      .returning();
    return updated;
  }

  async getUser(userId: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    return user ?? null;
  }

  async getActiveSubscription(stripeCustomerId: string) {
    const result = await db.execute(
      sql`SELECT s.*, p.name as product_name, p.metadata as product_metadata, pr.unit_amount, pr.recurring
          FROM stripe.subscriptions s
          JOIN stripe.prices pr ON pr.id = s.items->0->>'price'
          JOIN stripe.products p ON p.id = pr.product
          WHERE s.customer = ${stripeCustomerId}
            AND s.status IN ('active', 'trialing')
          ORDER BY s.created DESC
          LIMIT 1`
    );
    return (result.rows[0] as Record<string, unknown>) ?? null;
  }

  async getProductsWithPrices() {
    const result = await db.execute(
      sql`SELECT
            p.id as product_id,
            p.name as product_name,
            p.description as product_description,
            p.metadata as product_metadata,
            p.active as product_active,
            pr.id as price_id,
            pr.unit_amount,
            pr.currency,
            pr.recurring,
            pr.active as price_active
          FROM stripe.products p
          LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
          WHERE p.active = true
          ORDER BY pr.unit_amount ASC NULLS FIRST`
    );
    const productsMap = new Map<string, Record<string, unknown>>();
    for (const row of result.rows as Record<string, unknown>[]) {
      const productId = row.product_id as string;
      if (!productsMap.has(productId)) {
        productsMap.set(productId, {
          id: productId,
          name: row.product_name,
          description: row.product_description,
          metadata: row.product_metadata,
          prices: [],
        });
      }
      if (row.price_id) {
        (productsMap.get(productId)!.prices as unknown[]).push({
          id: row.price_id,
          unitAmount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
        });
      }
    }
    return Array.from(productsMap.values());
  }

  async getAllowedPriceIds(): Promise<string[]> {
    const result = await db.execute(
      sql`SELECT pr.id FROM stripe.prices pr
          JOIN stripe.products p ON p.id = pr.product
          WHERE p.active = true AND pr.active = true AND pr.recurring IS NOT NULL`
    );
    return (result.rows as Record<string, unknown>[]).map((r) => r.id as string);
  }

  async getUsage(userId: string, feature: string): Promise<number> {
    const month = currentMonth();
    const [row] = await db
      .select({ count: userUsageTable.count })
      .from(userUsageTable)
      .where(
        and(
          eq(userUsageTable.userId, userId),
          eq(userUsageTable.feature, feature),
          eq(userUsageTable.month, month)
        )
      );
    return row?.count ?? 0;
  }

  async incrementUsage(userId: string, feature: string): Promise<number> {
    const month = currentMonth();
    const result = await db.execute(
      sql`INSERT INTO user_usage (user_id, feature, month, count, updated_at)
          VALUES (${userId}, ${feature}, ${month}, 1, NOW())
          ON CONFLICT (user_id, feature, month)
          DO UPDATE SET count = user_usage.count + 1, updated_at = NOW()
          RETURNING count`
    );
    return ((result.rows[0] as Record<string, unknown>)?.count as number) ?? 1;
  }

  async getMonthlyUsageSummary(userId: string): Promise<Record<string, { used: number; limit: number }>> {
    const month = currentMonth();
    const rows = await db
      .select()
      .from(userUsageTable)
      .where(and(eq(userUsageTable.userId, userId), eq(userUsageTable.month, month)));

    const summary: Record<string, { used: number; limit: number }> = {};
    for (const [feature, limit] of Object.entries(FREE_TIER_LIMITS)) {
      const row = rows.find((r) => r.feature === feature);
      summary[feature] = { used: row?.count ?? 0, limit };
    }
    return summary;
  }
}

export const billingStorage = new BillingStorage();
