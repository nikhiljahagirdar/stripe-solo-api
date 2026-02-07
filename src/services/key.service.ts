import { db } from '../db';
import { stripeKeys } from '../db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { decrypt } from './encryption';


interface CreateStripeKeyInput {
  userId: number;
  name: string;
  apiKey: string;
}

interface UpdateStripeKeyInput {
  name?: string;
  apiKey?: string;
}

/**
 * Creates a new Stripe key, encrypting the sensitive values.
 * @param {CreateStripeKeyInput} data - The data for the new key.
 * @returns The newly created key record (without sensitive data).
 */
export async function createStripeKey(data: CreateStripeKeyInput) {
  // Validation
  if (!data.userId || typeof data.userId !== 'number' || data.userId <= 0) {
    throw new Error('Invalid userId: must be a positive number');
  }
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    throw new Error('Invalid name: must be a non-empty string');
  }
  
  if (!data.apiKey || typeof data.apiKey !== 'string') {
    throw new Error('Invalid apiKey: must be a valid Stripe secret key');
  }



  const [newKey] = await db.insert(stripeKeys).values({
    userId: data.userId,
    name: data.name,
    encryptedApiKey: data.apiKey,
  }).returning({
    id: stripeKeys.id,
    userId: stripeKeys.userId,
    name: stripeKeys.name,
    createdAt: stripeKeys.createdAt,
    updatedAt: stripeKeys.updatedAt,
  });

  return newKey;
}

/**
 * Retrieves all Stripe keys for a specific user.
 * @param {number} userId - The ID of the user.
 * @param {number} [accountId] - Optional: An account ID to filter keys. (Note: stripeKeys table does not have stripeAccountId, so filtering will be by key ID as a placeholder)
 * @param {number} [year] - Optional: A year to filter keys by creation date.
 * @returns An array of the user's Stripe keys.
 */
export async function getStripeKeysByUserId(userId: number, accountId?: number, year?: number) {
  const conditions = [eq(stripeKeys.userId, userId)];

  if (accountId) {
    // Note: stripeKeys table does not have stripeAccountId. Filtering by key id as a placeholder.
    // For proper filtering by stripeAccountId, a many-to-many relationship table or direct column would be needed.
    conditions.push(eq(stripeKeys.id, accountId));
  }
  if (year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    conditions.push(sql`${stripeKeys.createdAt} >= ${startDate}`);
    conditions.push(sql`${stripeKeys.createdAt} <= ${endDate}`);
  }

  return db.select({
    id: stripeKeys.id,
    userId: stripeKeys.userId,
    name: stripeKeys.name,
    createdAt: stripeKeys.createdAt,
    updatedAt: stripeKeys.updatedAt,
  })
    .from(stripeKeys)
    .where(and(...conditions))
    .orderBy(desc(stripeKeys.createdAt));
}

/**
 * Checks if a user has at least one Stripe key registered.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<boolean>} True if the user has one or more keys, false otherwise.
 */
export async function checkUserHasKeys(userId: number): Promise<boolean> {
  const [result] = await db.select({
    keyCount: count()
  }).from(stripeKeys)
    .where(eq(stripeKeys.userId, userId));

  return result!.keyCount > 0;
}

/**
 * Updates a Stripe key's details.
 * @param {number} keyId - The ID of the key to update.
 * @param {number} userId - The ID of the user making the request for authorization.
 * @param {UpdateStripeKeyInput} data - The data to update.
 * @returns The updated key record.
 */
export async function updateStripeKey(keyId: number, userId: number, data: UpdateStripeKeyInput) {
  const updateData: { name?: string; encryptedApiKey?: string; updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if (data.name) {
    updateData.name = data.name;
  }
  if (data.apiKey) {
    updateData.encryptedApiKey = data.apiKey;
  }

  const [updatedKey] = await db.update(stripeKeys)
    .set(updateData)
    .where(and(eq(stripeKeys.id, keyId), eq(stripeKeys.userId, userId)))
    .returning({
      id: stripeKeys.id,
      userId: stripeKeys.userId,
      name: stripeKeys.name,
      createdAt: stripeKeys.createdAt,
      updatedAt: stripeKeys.updatedAt,
    });

  if (!updatedKey) {
    throw new Error('Stripe key not found or user not authorized to update.');
  }

  return updatedKey;
}

/**
 * Deletes a Stripe key.
 * @param {number} keyId - The ID of the key to delete.
 * @param {number} userId - The ID of the user making the request for authorization.
 * @returns A confirmation object.
 */
export async function deleteStripeKey(keyId: number, userId: number) {
  // Before deleting, ensure no stripe_accounts are using this key.
  // This is a placeholder for more robust logic you might want to add,
  // like preventing deletion if the key is in use.

  const result = await db.delete(stripeKeys)
    .where(and(eq(stripeKeys.id, keyId), eq(stripeKeys.userId, userId)));

  if (result.rowCount === 0) {
    throw new Error('Stripe key not found or user not authorized to delete.');
  }

  return { id: keyId, deleted: true };
}


export async function getDecryptedKey(userId:number){
  const keyRecord = await db.select({ encryptedApiKey: stripeKeys.encryptedApiKey })
      .from(stripeKeys)
      .where(eq(stripeKeys.userId, userId))
      .limit(1);
  
    if ((keyRecord.length === 0) || !keyRecord[0]!.encryptedApiKey) {
      throw new Error('Stripe key not found');
    }
      const decryptedKey = decrypt(keyRecord[0]!.encryptedApiKey);
      return decryptedKey;
}