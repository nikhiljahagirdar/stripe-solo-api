import { db } from '../db';
import { roles, users } from '../db/schema';
import { eq, count } from 'drizzle-orm';

interface RoleInput {
    name: string;
}

/**
 * Creates a new role.
 * @param {RoleInput} data - The data for the new role.
 * @returns The newly created role object.
 */
export async function createRole(data: RoleInput) {
    const [newRole] = await db.insert(roles).values(data).returning();
    return newRole;
}

/**
 * Retrieves all roles from the database.
 * @returns An array of all role objects.
 */
export async function getRoles() {
    return db.select().from(roles).orderBy(roles.name);
}

/**
 * Retrieves a single role by its ID.
 * @param {number} id - The ID of the role to retrieve.
 * @returns The role object or undefined if not found.
 */
export async function getRoleById(id: number) {
    const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    return role;
}

/**
 * Retrieves a single role by its name.
 * @param {string} name - The name of the role to retrieve.
 * @returns The role object or undefined if not found.
 */
export async function getRoleByName(name: string) {
  const [role] = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
  return role;
}

/**
 * Updates a role's name.
 * @param {number} id - The ID of the role to update.
 * @param {RoleInput} data - The new data for the role.
 * @returns The updated role object.
 */
export async function updateRole(id: number, data: RoleInput) {
    const [updatedRole] = await db.update(roles)
        .set({ name: data.name })
        .where(eq(roles.id, id))
        .returning();

    if (!updatedRole) {
        throw new Error(`Role with ID ${id} not found.`);
    }

    return updatedRole;
}

/**
 * Deletes a role, preventing deletion if it is currently in use.
 * @param {number} id - The ID of the role to delete.
 * @returns A confirmation object.
 */
export async function deleteRole(id: number) {
    // Safety Check: Ensure the role is not assigned to any users.
    const [usersWithRole] = await db.select({
        userCount: count()
    })
        .from(users)
        .where(eq(users.roleId, id));

    if (usersWithRole && usersWithRole.userCount > 0) {
        throw new Error(`Cannot delete role. It is currently assigned to ${usersWithRole.userCount} user(s).`);
    }

    const result = await db.delete(roles).where(eq(roles.id, id));

    if (result.rowCount === 0) {
        throw new Error(`Role with ID ${id} not found.`);
    }

    return { id, deleted: true };
}