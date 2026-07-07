import { getUncachableStripeClient } from "../../artifacts/api-server/src/lib/stripeClient";

async function seedProducts() {
  const stripe = await getUncachableStripeClient();

  console.log("Checking for existing products...");

  const advocateExists = await stripe.products.search({
    query: "name:'Advocate' AND active:'true'",
  });

  if (advocateExists.data.length === 0) {
    const advocate = await stripe.products.create({
      name: "Advocate",
      description: "Full access for pro se litigants handling active cases.",
      metadata: { tier: "advocate" },
    });
    await stripe.prices.create({
      product: advocate.id,
      unit_amount: 2000,
      currency: "usd",
      recurring: { interval: "month" },
    });
    console.log(`Created Advocate plan: ${advocate.id}`);
  } else {
    console.log("Advocate plan already exists, skipping.");
  }

  const warRoomExists = await stripe.products.search({
    query: "name:'War Room' AND active:'true'",
  });

  if (warRoomExists.data.length === 0) {
    const warRoom = await stripe.products.create({
      name: "War Room",
      description: "Maximum firepower for complex, multi-issue litigation.",
      metadata: { tier: "warroom" },
    });
    await stripe.prices.create({
      product: warRoom.id,
      unit_amount: 7900,
      currency: "usd",
      recurring: { interval: "month" },
    });
    console.log(`Created War Room plan: ${warRoom.id}`);
  } else {
    console.log("War Room plan already exists, skipping.");
  }

  console.log("Done! Products will sync to the database via webhooks.");
}

seedProducts().catch((err) => {
  console.error("Failed to seed products:", err.message);
  process.exit(1);
});
