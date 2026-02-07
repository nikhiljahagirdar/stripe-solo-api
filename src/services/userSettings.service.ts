import { db } from '../db';
import type { UserSetting, NewUserSetting } from '../db/schema';
import { usersSettingsTable, settingsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Get all user settings for a specific user
 */
export async function getUserSettings(userId: number): Promise<UserSetting[]> {
  return await db
    .select()
    .from(usersSettingsTable)
    .where(eq(usersSettingsTable.userId, userId));
}

/**
 * Get all user settings with setting details
 */
export async function getUserSettingsWithDetails(userId: number) {
  return await db
    .select({
      id: usersSettingsTable.id,
      userId: usersSettingsTable.userId,
      settingId: usersSettingsTable.settingId,
      value: usersSettingsTable.value,
      createdAt: usersSettingsTable.createdAt,
      updatedAt: usersSettingsTable.updatedAt,
      settingKey: settingsTable.key,
      settingDefaultValue: settingsTable.value,
    })
    .from(usersSettingsTable)
    .innerJoin(settingsTable, eq(usersSettingsTable.settingId, settingsTable.settingsId))
    .where(eq(usersSettingsTable.userId, userId));
}

/**
 * Get a specific user setting by ID
 */
export async function getUserSettingById(
  id: number,
  userId: number
): Promise<UserSetting | undefined> {
  const [userSetting] = await db
    .select()
    .from(usersSettingsTable)
    .where(and(eq(usersSettingsTable.id, id), eq(usersSettingsTable.userId, userId)));
  
  return userSetting!;
}

/**
 * Get a user setting by setting ID
 */
export async function getUserSettingBySettingId(
  userId: number,
  settingId: number
): Promise<UserSetting | undefined> {
  const [userSetting] = await db
    .select()
    .from(usersSettingsTable)
    .where(
      and(
        eq(usersSettingsTable.userId, userId),
        eq(usersSettingsTable.settingId, settingId)
      )
    );
  
  return userSetting!;
}

/**
 * Create a new user setting
 */
export async function createUserSetting(data: NewUserSetting): Promise<UserSetting> {
  const [newUserSetting] = await db
    .insert(usersSettingsTable)
    .values(data)
    .returning();
  
  return newUserSetting!;
}

/**
 * Update a user setting
 */
export async function updateUserSetting(
  id: number,
  userId: number,
  data: Partial<Omit<UserSetting, 'id' | 'userId' | 'settingId' | 'createdAt'>>
): Promise<UserSetting | undefined> {
  const [updated] = await db
    .update(usersSettingsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(usersSettingsTable.id, id), eq(usersSettingsTable.userId, userId)))
    .returning();
  
  return updated!;
}

/**
 * Upsert a user setting (create or update based on userId and settingId)
 */
export async function upsertUserSetting(
  userId: number,
  settingId: number,
  value: string
): Promise<UserSetting> {
  const existing = await getUserSettingBySettingId(userId, settingId);
  
  if (existing) {
    const updated = await db
      .update(usersSettingsTable)
      .set({ value, updatedAt: new Date() })
      .where(and(eq(usersSettingsTable.userId, userId), eq(usersSettingsTable.settingId, settingId)))
      .returning();
    if (!updated[0]) {
      throw new Error('Failed to update user setting');
    }
    return updated[0]!;
  } else {
    const created = await db
      .insert(usersSettingsTable)
      .values({ userId, settingId, value })
      .returning();
    if (!created[0]) {
      throw new Error('Failed to create user setting');
    }
    return created[0]!;
  }
}

/**
 * Delete a user setting
 */
export async function deleteUserSetting(id: number, userId: number): Promise<boolean> {
  const result = await db
    .delete(usersSettingsTable)
    .where(and(eq(usersSettingsTable.id, id), eq(usersSettingsTable.userId, userId)))
    .returning();
  
  return result.length > 0;
}

/**
 * Delete all user settings for a user
 */
export async function deleteAllUserSettings(userId: number): Promise<number> {
  const result = await db
    .delete(usersSettingsTable)
    .where(eq(usersSettingsTable.userId, userId))
    .returning();
  
  return result.length;
}
