import { db } from '../db';
import { users, roles } from '../db/schema';
import { eq, and, or, ilike, desc, asc, count } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export interface UserFilters {
  roleId?: number;
  parentId?: number;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
}

export const getAllUsers = async (filters: UserFilters = {}) => {
  const {
    status,
    roleId,
    parentId,
    search,
    page = 1,
    pageSize = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = filters;

  const offset = (page - 1) * pageSize;
  const conditions = [];

  if (status) {conditions.push(eq(users.status, status));}
  if (roleId) {conditions.push(eq(users.roleId, roleId));}
  if (parentId !== undefined) {conditions.push(eq(users.parentId, parentId));}
  if (search) {
    conditions.push(
      or(
        ilike(users.firstName, `%${search}%`),
        ilike(users.lastName, `%${search}%`),
        ilike(users.email, `%${search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const sortColumn = {
    id: users.id,
    firstName: users.firstName,
    lastName: users.lastName,
    email: users.email,
    status: users.status,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt
  }[sortBy] || users.createdAt;

  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  const [data, totalResult] = await Promise.all([
    db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      parentId: users.parentId,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      role: {
        id: roles.id,
        name: roles.name,
      },
    }).from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset),
    
    db.select({ count: count() })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(whereClause)
  ]);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total: totalResult[0]?.count ?? 0,
      totalPages: Math.ceil((totalResult[0]?.count ?? 0) / pageSize)
    }
  };
};

export const getUserById = async (id: number) => {
  const result = await db.select({
    id: users.id,
    firstName: users.firstName,
    lastName: users.lastName,
    email: users.email,
    parentId: users.parentId,
    status: users.status,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
    role: {
      id: roles.id,
      name: roles.name,
    },
  }).from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, id))
    .limit(1);
  
  return result[0] || null;
};

export const createUser = async (data: { firstName: string; lastName: string; email: string; password: string; roleId: number; parentId?: number; status?: string; }) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const result = await db.insert(users).values({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    passwordHash: hashedPassword,
    roleId: data.roleId,
    parentId: data.parentId || 0,
    status: data.status || 'active',
  }).returning({
    id: users.id,
    firstName: users.firstName,
    lastName: users.lastName,
    email: users.email,
    parentId: users.parentId,
    status: users.status,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  });
  
  const newUser = result[0];
  
  // Create default RBAC page assignments for the new user
  // try {
  //   await createDefaultRolePageAssignments(newUser.id, data.roleId);
  // } catch (error) {
  //   console.error('Failed to create default RBAC assignments:', error);
  // }
  
  return newUser;
};

export const updateUser = async (id: number, data: { firstName?: string; lastName?: string; email?: string; status?: string; parentId?: number }) => {
  const result = await db.update(users).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(users.id, id)).returning({
    id: users.id,
    firstName: users.firstName,
    lastName: users.lastName,
    email: users.email,
    parentId: users.parentId,
    status: users.status,
    updatedAt: users.updatedAt,
  });
  return result[0] || null;
};

export const getUserByEmail = async (email: string) => {
  const result = await db.select({
    id: users.id,
    firstName: users.firstName,
    lastName: users.lastName,
    email: users.email,
    parentId: users.parentId,
    status: users.status,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
    role: {
      id: roles.id,
      name: roles.name,
    },
  }).from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.email, email))
    .limit(1);
  
  return result[0] || null;
};

export const getUserWithPasswordByEmail = async (email: string) => {
  const result = await db.select({
    id: users.id,
    firstName: users.firstName,
    lastName: users.lastName,
    email: users.email,
    passwordHash: users.passwordHash,
    parentId: users.parentId,
    status: users.status,
    roleId: users.roleId,
  }).from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  return result[0] || null;
};

export const deleteUser = async (id: number) => {
  const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
  return result[0] || null;
};