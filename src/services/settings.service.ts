import { db } from '../db';
import type { Setting, NewSetting } from '../db/schema';
import { settingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get all settings
 */
export async function getAllSettings(): Promise<Setting[]> {
  return await db.select().from(settingsTable);
}

/**
 * Get a setting by ID
 */
export async function getSettingById(settingsId: number): Promise<Setting | undefined> {
  const [setting] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.settingsId, settingsId));
  
  return setting!;
}

/**
 * Get a setting by key
 */
export async function getSettingByKey(key: string): Promise<Setting | undefined> {
  const [setting] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, key));
  
  return setting!;
}

/**
 * Create a new setting
 */
export async function createSetting(data: NewSetting): Promise<Setting> {
  const [newSetting] = await db
    .insert(settingsTable)
    .values(data)
    .returning();
  
  return newSetting!;
}

/**
 * Update a setting by ID
 */
export async function updateSetting(
  settingsId: number,
  data: Partial<Omit<Setting, 'settingsId' | 'createdAt'>>
): Promise<Setting | undefined> {
  const [updated] = await db
    .update(settingsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(settingsTable.settingsId, settingsId))
    .returning();
  
  return updated!;
}

/**
 * Delete a setting by ID
 */
export async function deleteSetting(settingsId: number): Promise<boolean> {
  const result = await db
    .delete(settingsTable)
    .where(eq(settingsTable.settingsId, settingsId))
    .returning();
  
  return result.length > 0;
}
