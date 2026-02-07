import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, getUserByEmail, getUserWithPasswordByEmail } from './user.service';
import { getRoleByName, getRoleById } from './role.service';
import { db } from '../db';
import { RbackPagesTable, RbackRolesPagesTable } from '../db/schema';
import { eq, or } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env['JWT_SECRET'];

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export const registerUser = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleName?: string;
}) => {
  const { firstName, lastName, email, password, roleName } = userData;

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  let role = await getRoleByName(roleName || 'Admin');
  if (!role) {
    role = await getRoleByName('Admin');
  }

  if (!role) {
    throw new Error('Default Admin role not found in the database.');
  }

  await createUser({
    firstName,
    lastName,
    email,
    password,
    roleId: role.id,
  });
};

export const authenticateUser = async (email: string, password: string) => {
  const user = await getUserWithPasswordByEmail(email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  const userRole = await getRoleById(user.roleId);
  if (!userRole) {
    throw new Error('User role not found');
  }

  const token = jwt.sign(
    { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: userRole.name },
    JWT_SECRET ,
    { expiresIn: '48h' }
  );

  return {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: userRole.name
    }
  };
};

export const getUserPermissions = async (userId: number, roleId: number) => {
  const permissions = await db
    .select({
      id: RbackPagesTable.id,
      groupName: RbackPagesTable.groupName,
      pagename: RbackPagesTable.pagename,
      pageUrl: RbackPagesTable.pageUrl,
      isAdd: RbackRolesPagesTable.isAdd,
      isEdit: RbackRolesPagesTable.isEdit,
      isDelete: RbackRolesPagesTable.isDelete,
      isUpdate: RbackRolesPagesTable.isUpdate,
      filters: RbackRolesPagesTable.filters,
    })
    .from(RbackPagesTable)
    .leftJoin(RbackRolesPagesTable, eq(RbackPagesTable.id, RbackRolesPagesTable.pageId))
    .where(
      or(
        eq(RbackRolesPagesTable.roleId, roleId),
        eq(RbackRolesPagesTable.userid, userId)
      )
    );

  return permissions;
};