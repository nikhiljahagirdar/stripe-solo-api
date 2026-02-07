import type Stripe from 'stripe';
import { db } from '../db';
import type { NewCoupon, NewPromotionCode } from '../db/schema';
import { couponsTable, promotionCodesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

/**
 * Creates a new coupon in Stripe and saves it to the local database.
 * @param stripeAccountId - The connected Stripe account ID.
 * @param userId - The user performing the action.
 * @param userRole - The role of the user.
 * @param params - Coupon creation parameters.
 * @returns The newly created coupon object from the local database.
 */
export async function createCoupon(stripeAccountId: string, userId: number, params: Stripe.CouponCreateParams) {
  const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
  if (!stripe) {throw new Error('Stripe client could not be initialized.');}

  const stripeCoupon = await stripe.coupons.create(params);

  const newCoupon: NewCoupon = {
    userId,
    stripeCouponId: stripeCoupon.id,
    name: stripeCoupon.name,
    amountOff: stripeCoupon.amount_off ? String(stripeCoupon.amount_off) : null,
    percentOff: stripeCoupon.percent_off ? String(stripeCoupon.percent_off) : null,
    currency: stripeCoupon.currency,
    duration: stripeCoupon.duration,
    durationInMonths: stripeCoupon.duration_in_months,
    maxRedemptions: stripeCoupon.max_redemptions,
    timesRedeemed: stripeCoupon.times_redeemed,
    valid: stripeCoupon.valid,
    redeemBy: stripeCoupon.redeem_by ? new Date(stripeCoupon.redeem_by * 1000) : null,
  };

  const [insertedCoupon] = await db.insert(couponsTable).values(newCoupon).returning();
  return insertedCoupon;
}

/**
 * Deletes a coupon from Stripe and the local database.
 * @param stripeAccountId - The connected Stripe account ID.
 * @param userId - The user performing the action.
 * @param userRole - The role of the user.
 * @param stripeCouponId - The ID of the coupon to delete.
 * @returns A confirmation object.
 */
export async function deleteCoupon(stripeAccountId: string, userId: number, stripeCouponId: string) {
  const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
  if (!stripe) {throw new Error('Stripe client could not be initialized.');}

  await stripe.coupons.del(stripeCouponId);
  await db.delete(couponsTable).where(eq(couponsTable.stripeCouponId, stripeCouponId));

  return { id: stripeCouponId, object: 'coupon', deleted: true };
}

/**
 * Creates a new promotion code for an existing coupon.
 * @param stripeAccountId - The connected Stripe account ID.
 * @param userId - The user performing the action.
 * @param userRole - The role of the user.
 * @param params - Promotion code creation parameters.
 * @returns The newly created promotion code object from the local database.
 */
export async function createPromotionCode(stripeAccountId: string, userId: number, params: Stripe.PromotionCodeCreateParams) {
  const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
  if (!stripe) {throw new Error('Stripe client could not be initialized.');}

  const stripePromoCode = await stripe.promotionCodes.create(params);

  const newPromoCode: NewPromotionCode = {
    userId,
    stripePromotionCodeId: stripePromoCode.id,
    stripeCouponId: stripePromoCode.id,
    code: stripePromoCode.code,
    active: stripePromoCode.active,
    maxRedemptions: stripePromoCode.max_redemptions,
    timesRedeemed: stripePromoCode.times_redeemed,
    expiresAt: stripePromoCode.expires_at ? new Date(stripePromoCode.expires_at * 1000) : null,
  };

  const [insertedPromoCode] = await db.insert(promotionCodesTable).values(newPromoCode).returning();
  return insertedPromoCode;
}

/**
 * Deactivates a promotion code in Stripe and updates it in the local database.
 * @param stripeAccountId - The connected Stripe account ID.
 * @param userId - The user performing the action.
 * @param userRole - The role of the user.
 * @param stripePromotionCodeId - The ID of the promotion code to deactivate.
 * @returns The updated promotion code object.
 */
export async function deactivatePromotionCode(stripeAccountId: string, userId: number, stripePromotionCodeId: string) {
  const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
  if (!stripe) {throw new Error('Stripe client could not be initialized.');}

  await stripe.promotionCodes.update(stripePromotionCodeId, { active: false });

  const [updatedPromoCode] = await db.update(promotionCodesTable)
    .set({ active: false })
    .where(eq(promotionCodesTable.stripePromotionCodeId, stripePromotionCodeId))
    .returning();

  return updatedPromoCode;
}

/**
 * Updates a subscription to add a coupon or promotion code.
 * @param stripeAccountId - The connected Stripe account ID.
 * @param userId - The user performing the action.
 * @param userRole - The role of the user.
 * @param stripeSubscriptionId - The ID of the subscription to update.
 * @param discount - An object containing either a `coupon` ID or a `promotionCode` ID.
 * @returns The updated Stripe Subscription object.
 */
export async function applyDiscountToSubscription(stripeAccountId: string, userId: number, stripeSubscriptionId: string, discount: { coupon?: string; promotionCode?: string }) {
  const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
  if (!stripe) {throw new Error('Stripe client could not be initialized.');}

  const updateParams: any = {};
  if (discount.coupon) {
    updateParams.coupon = discount.coupon;
  } else if (discount.promotionCode) {
    updateParams.promotion_code = discount.promotionCode;
  } else {
    throw new Error('Either a coupon or promotionCode must be provided.');
  }

  return stripe.subscriptions.update(stripeSubscriptionId, updateParams);
}

/**
 * Creates a Stripe Checkout Session with support for discounts.
 * @param stripeAccountId - The connected Stripe account ID.
 * @param userId - The user performing the action.
 * @param userRole - The role of the user.
 * @param params - Checkout Session creation parameters.
 * @param discounts - An optional array of coupon or promotion code IDs to apply.
 * @returns The created Stripe Checkout Session object.
 */
export async function createCheckoutSession(stripeAccountId: string, userId: number, params: Stripe.Checkout.SessionCreateParams, discounts?: { coupon?: string; promotion_code?: string }[]) {
  const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
  if (!stripe) {throw new Error('Stripe client could not be initialized.');}

  params.allow_promotion_codes = true;

  if (discounts && discounts.length > 0) {
    params.discounts = discounts;
  }

  return stripe.checkout.sessions.create(params);
}

/**
 * Updates a subscription to apply multiple, stackable discounts.
 * @param stripeAccountId - The connected Stripe account ID.
 * @param userId - The user performing the action.
 * @param userRole - The role of the user.
 * @param stripeSubscriptionId - The ID of the subscription to update.
 * @param discounts - An array of coupon or promotion code IDs to apply.
 * @returns The updated Stripe Subscription object.
 */
export async function applyStackableDiscountsToSubscription(stripeAccountId: string, userId: number, stripeSubscriptionId: string, discounts: { coupon?: string; promotion_code?: string }[]) {
  const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
  if (!stripe) {throw new Error('Stripe client could not be initialized.');}

  if (!discounts || discounts.length === 0) {
    throw new Error('At least one discount must be provided.');
  }

  return stripe.subscriptions.update(stripeSubscriptionId, {
    discounts: discounts,
  });
}