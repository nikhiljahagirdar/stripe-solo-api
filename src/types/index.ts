/**
 * @interface User
 * @description Represents a user in the system.
 */
export interface User {
  id: number;
  email: string;
  passwordHash: string;
  roleId: number;
}

/**
 * @interface Role
 * @description Represents a user role in the system.
 */
export interface Role {
  id: number;
  name: string;
}

/**
 * @interface StripeAccount
 * @description Represents a connected Stripe account.
 */
export interface StripeAccount {
  id: number;
  userId: number;
  name: string;
  authMethod: 'oauth' | 'api_keys';
  stripeAccountId?: string;
  accessToken?: string;
  refreshToken?: string;
  encryptedApiKey?: string;
  encryptedSecretKey?: string;
  createdAt: Date;
}

/**
 * @interface AnalyticsCache
 * @description Represents a cached analytics entry.
 */
export interface AnalyticsCache {
  id: number;
  accountId: number;
  data: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * @interface NewUser
 * @description Represents the data structure for creating a new user.
 */
export interface NewUser {
  email: string;
  passwordHash: string;
  roleId: number;
}

/**
 * @interface NewStripeAccount
 * @description Represents the data structure for creating a new Stripe account entry.
 */
export interface NewStripeAccount {
  userId: number;
  name: string;
  authMethod: 'oauth' | 'api_keys';
  stripeAccountId?: string;
  accessToken?: string;
  refreshToken?: string;
  encryptedApiKey?: string;
  encryptedSecretKey?: string;
}

/**
 * @interface JWTPayload
 * @description Represents the payload structure of a JSON Web Token (JWT).
 */
export interface JWTPayload {
  id: number;
  email: string;
  role: string;
}