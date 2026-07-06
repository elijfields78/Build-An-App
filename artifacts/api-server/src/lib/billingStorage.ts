import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

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
    return (result.rows[0] as any) ?? null;
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
    const productsMap = new Map<string, any>();
    for (const row of result.rows as any[]) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          metadata: row.product_metadata,
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id).prices.push({
          id: row.price_id,
          unitAmount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
        });
      }
    }
    return Array.from(productsMap.values());
  }
}

export const billingStorage = new BillingStorage();
