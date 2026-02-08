require("dotenv").config();
const Stripe = require("stripe");
const { faker } = require("@faker-js/faker");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const TOTAL_CUSTOMERS = 100;
const TOTAL_PRODUCTS = 15;
const CURRENCY = "usd";

const TEST_CARDS = [
  "4242424242424242", // success
  "4000000000009995", // decline
  "4000002500003155", // 3ds
];

async function createProducts() {
  const prices = [];

  for (let i = 0; i < TOTAL_PRODUCTS; i++) {
    const product = await stripe.products.create({
      name: faker.commerce.productName(),
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: faker.number.int({ min: 1000, max: 20000 }),
      currency: CURRENCY,
      recurring: {
        interval: faker.helpers.arrayElement(["month", "year"]),
      },
    });

    prices.push(price);
  }

  return prices;
}

async function createCustomerWithCard() {
  const customer = await stripe.customers.create({
    name: faker.person.fullName(),
    email: faker.internet.email(),
  });

  const paymentMethod = await stripe.paymentMethods.create({
    type: "card",
    card: {
      number: faker.helpers.arrayElement(TEST_CARDS),
      exp_month: 12,
      exp_year: 2030,
      cvc: "123",
    },
  });

  await stripe.paymentMethods.attach(paymentMethod.id, {
    customer: customer.id,
  });

  await stripe.customers.update(customer.id, {
    invoice_settings: { default_payment_method: paymentMethod.id },
  });

  return { customer, paymentMethod };
}

async function createPayment(customerId, paymentMethodId) {
  return stripe.paymentIntents.create({
    amount: faker.number.int({ min: 2000, max: 50000 }),
    currency: CURRENCY,
    customer: customerId,
    payment_method: paymentMethodId,
    confirm: true,
    off_session: true,
  });
}

async function createSubscription(customerId, priceId) {
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
  });
}

async function maybeRefund(paymentIntent) {
  if (paymentIntent.status !== "succeeded") return;

  if (Math.random() < 0.3) {
    const isPartial = Math.random() < 0.5;

    await stripe.refunds.create({
      payment_intent: paymentIntent.id,
      amount: isPartial
        ? Math.floor(paymentIntent.amount / 2)
        : undefined,
    });

    console.log("   ↳ Refund created");
  }
}

async function createConnectedAccount() {
  return stripe.accounts.create({
    type: "express",
    country: "US",
    email: faker.internet.email(),
    capabilities: {
      transfers: { requested: true },
    },
  });
}

async function createTransfer(amount, connectedAccountId) {
  return stripe.transfers.create({
    amount: amount,
    currency: CURRENCY,
    destination: connectedAccountId,
  });
}

async function createPayout(connectedAccountId, amount) {
  return stripe.payouts.create(
    {
      amount: amount,
      currency: CURRENCY,
    },
    {
      stripeAccount: connectedAccountId,
    }
  );
}

async function seed() {
  console.log("🚀 Creating products...");
  const prices = await createProducts();

  console.log("🚀 Creating connected account for payouts...");
  const connectedAccount = await createConnectedAccount();

  console.log("🚀 Generating 100 customers & transactions...\n");

  for (let i = 0; i < TOTAL_CUSTOMERS; i++) {
    try {
      const { customer, paymentMethod } =
        await createCustomerWithCard();

      const paymentIntent = await createPayment(
        customer.id,
        paymentMethod.id
      );

      const price = faker.helpers.arrayElement(prices);

      const subscription = await createSubscription(
        customer.id,
        price.id
      );

      await maybeRefund(paymentIntent);

      if (paymentIntent.status === "succeeded") {
        await createTransfer(
          Math.floor(paymentIntent.amount * 0.8),
          connectedAccount.id
        );
      }

      if (Math.random() < 0.25) {
        await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: true,
        });
      }

      console.log(
        `✔ ${i + 1}/100 | ${paymentIntent.status}`
      );
    } catch (err) {
      console.log("❌ Error:", err.message);
    }
  }

  console.log("🚀 Creating payout from connected account...");

  await createPayout(connectedAccount.id, 50000);

  console.log("\n✅ Full Stripe test ecosystem generated!");
}

seed();
