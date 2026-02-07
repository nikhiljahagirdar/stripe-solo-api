import { db } from '../db';
import { customerTable, paymentIntentsTable } from '../db/schema';
import type { SQL} from 'drizzle-orm';
import { eq, or, ilike, and, sql, count, asc, desc, sum, max } from 'drizzle-orm';
import type { NewCustomer, UpdateCustomer, Customer } from '../types/customer.interface';
import { getOrCreateStripeClient } from '../services/client.service';
import { getDateRangeFilters } from '../utils/dateFilter.utils';

/**
 * Customer response with aggregated payment data.
 */
interface CustomerWithPayments extends Customer {
  totalAmountSpent: number;
  lastPaymentStatus: string | null;
  paymentMethodTypes: string[];
}

/**
 * Paginated customer response.
 */
interface PaginatedCustomers {
  customers: CustomerWithPayments[];
  totalCount: number;
}

/**
 * Builds a year filter clause for the given year.
 */
/**
 * Builds filter clauses for dynamic filters.
 */
const buildFilterClauses = (filter: Record<string, any>): (SQL | undefined)[] => {
  return Object.entries(filter).reduce((acc, [key, value]) => {
    if (key in customerTable) {
      acc.push(eq(customerTable[key as keyof typeof customerTable.$inferSelect], value));
    }
    return acc;
  }, [] as (SQL | undefined)[]);
};

/**
 * Builds the order by clause from sort string.
 */
const buildOrderBy = (sort?: string): SQL | undefined => {
  if (!sort) {
    return desc(customerTable.id);
  }
  const [column, direction] = sort.split(':');
  // @ts-ignore - Dynamic column checking
  if (column in customerTable) {
    const col = customerTable[column as keyof typeof customerTable.$inferSelect];
    return direction === 'desc' ? desc(col) : asc(col);
  }
  return desc(customerTable.id);
};

/**
 * Normalizes customer data with default values.
 */
const normalizeCustomer = (customer: any): CustomerWithPayments => ({
  ...customer,
  totalAmountSpent: customer.totalAmountSpent || 0,
  lastPaymentStatus: customer.lastPaymentStatus || null,
  paymentMethodTypes: customer.paymentMethodTypes || [],
});

/**
 * Checks if user is authorized to access the customer.
 */
const isAuthorized = (customerId: number, userId: number, userRole: string): boolean => {
  return customerId === userId || userRole === 'Admin';
};

/**
 * Syncs customer data with Stripe.
 */
const syncCustomerToStripe = async (customer: Customer, userId: number): Promise<void> => {
  try {
    if (!customer.stripeAccountId || !customer.stripeCustomerId) {
      return; // Skip sync if Stripe IDs are missing
    }

    const stripe = await getOrCreateStripeClient(customer.stripeAccountId, userId);
    
    if (!stripe) {
      console.warn(`Failed to get Stripe client for account ${customer.stripeAccountId}`);
      return;
    }
    
    await stripe.customers.update(
      customer.stripeCustomerId,
      {
        name: customer.name || undefined,
        email: customer.email || undefined,
      }
    );
  } catch (error) {
    console.error(`Failed to sync customer ${customer.id} to Stripe:`, error);
    // Don't throw - allow operation to continue even if Stripe sync fails
  }
};

/**
 * Finds all customers with pagination, search, sorting, and filtering.
 * @param options - Options for pagination, search, sorting, and filtering.
 * @returns A promise that resolves to an object containing the customers for the page and the total count.
 */
export const findAll = async (options: {
  page?: number;
  pageSize?: number;
  query?: string;
  sort?: string;
  filter?: Record<string, any>;
  accountId?: number;
  year?: number;
  month?: number;
} = {}): Promise<PaginatedCustomers> => {
  const { page = 1, pageSize = 10, query, sort, filter, accountId, year, month } = options;

  // Build the where clause dynamically
  const whereClauses: (SQL | undefined)[] = [];

  if (query) {
    const searchQuery = `%${query}%`;
    whereClauses.push(
      or(
        ilike(customerTable.name, searchQuery),
        ilike(customerTable.email, searchQuery)
      )
    );
  }

  if (accountId) {
    whereClauses.push(eq(customerTable.stripeAccountId, accountId));
  }

  // Add year and month filters (if month is empty, filters all by selected year)
  const createdColumn = sql`TO_TIMESTAMP(${customerTable.created})`;
  const dateFilters = getDateRangeFilters(createdColumn as any, year, month);
  whereClauses.push(...dateFilters);

  if (filter) {
    whereClauses.push(...buildFilterClauses(filter));
  }

  const whereCondition = and(...whereClauses);
  const orderBy = buildOrderBy(sort);

  // Get customers with payment data
  const customersQuery = db
    .select({
      id: customerTable.id,
      userId: customerTable.userId,
      stripeAccountId: customerTable.stripeAccountId,
      stripeCustomerId: customerTable.stripeCustomerId,
      email: customerTable.email,
      name: customerTable.name,
      liveMode: customerTable.liveMode,
      created: customerTable.created,
      createdAt: customerTable.createdAt,
      updatedAt: customerTable.updatedAt,
      totalAmountSpent: sum(paymentIntentsTable.amount),
      lastPaymentStatus: max(paymentIntentsTable.status),
      paymentMethodTypes: sql<string[]>`array_agg(distinct ${paymentIntentsTable.paymentMethodTypes})`,
    })
    .from(customerTable)
    .leftJoin(paymentIntentsTable, eq(customerTable.stripeCustomerId, paymentIntentsTable.stripeCustomerId))
    .where(whereCondition)
    .groupBy(customerTable.id)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  if (orderBy) {
    customersQuery.orderBy(orderBy);
  }

  // Perform two queries: one for the data page, one for the total count
  const [customers, total] = await Promise.all([
    customersQuery,
    db.select({ value: count() }).from(customerTable).where(whereCondition)
  ]);

  return {
    customers: customers.map(normalizeCustomer),
    totalCount: total[0]?.value ?? 0
  };
};

/**
 * Finds a customer by their ID.
 * @param id The ID of the customer to find.
 * @returns A promise that resolves to the found customer or `undefined` if not found.
 */
export const findById = async (id: number): Promise<Customer | undefined> => {
  if (!Number.isFinite(id)) {
    return undefined;
  }
  return db.query.customerTable.findFirst({
    where: eq(customerTable.id, id),
  });
};

/**
 * Finds a customer by their Stripe customer ID
 * @param stripeCustomerId The Stripe customer ID to find.
 * @param userId Optional userId for authorization check.
 * @returns A promise that resolves to the found customer or `undefined` if not found.
 */
export const findByStripeId = async (stripeCustomerId: string, userId?: number): Promise<Customer | undefined> => {
  const whereClauses = [eq(customerTable.stripeCustomerId, stripeCustomerId)];
  
  if (userId) {
    whereClauses.push(eq(customerTable.userId, userId));
  }
  
  return db.query.customerTable.findFirst({
    where: and(...whereClauses),
  });
};

/**
 * Finds a customer by their ID for a specific user, with authorization check.
 * @param id The ID of the customer to find.
 * @param userId The ID of the user requesting the customer.
 * @param userRole The role of the user requesting the customer.
 * @returns A promise that resolves to the found customer or `undefined` if not found or not authorized.
 */
export const findForUser = async (id: number, userId: number, userRole: string): Promise<CustomerWithPayments | undefined> => {
  if (!Number.isFinite(id)) {
    return undefined;
  }

  const [customer] = await db
    .select({
      id: customerTable.id,
      userId: customerTable.userId,
      stripeAccountId: customerTable.stripeAccountId,
      stripeCustomerId: customerTable.stripeCustomerId,
      email: customerTable.email,
      name: customerTable.name,
      liveMode: customerTable.liveMode,
      created: customerTable.created,
      createdAt: customerTable.createdAt,
      updatedAt: customerTable.updatedAt,
      totalAmountSpent: sum(paymentIntentsTable.amount),
      lastPaymentStatus: max(paymentIntentsTable.status),
      paymentMethodTypes: sql<string[]>`array_agg(distinct ${paymentIntentsTable.paymentMethodTypes})`,
    })
    .from(customerTable)
    .leftJoin(paymentIntentsTable, eq(customerTable.stripeCustomerId, paymentIntentsTable.stripeCustomerId))
    .where(eq(customerTable.id, id))
    .groupBy(customerTable.id)
    .limit(1);

  if (!customer || !isAuthorized(customer.userId, userId, userRole)) {
    return undefined;
  }

  return normalizeCustomer(customer);
};

/**
 * Creates a new customer.
 * @param customerInfo The customer data to create.
 * @returns A promise that resolves to the newly created customer.
 */
export const create = async (customerInfo: NewCustomer, userId: number): Promise<Customer> => {
  const [newCustomer] = await db.insert(customerTable).values(customerInfo).returning();
  
  // Sync with Stripe after creation
  await syncCustomerToStripe(newCustomer!, userId);

  return newCustomer!;
};

/**
 * Updates an existing customer.
 * @param id The ID of the customer to update.
 * @param updates The partial customer data to apply.
 * @returns A promise that resolves to the updated customer or `undefined` if not found.
 */
export const update = async (
  id: number,
  updates: UpdateCustomer,
  userId: number,
  userRole: string
): Promise<Customer | undefined> => {
  if (!Number.isFinite(id)) {
    return undefined;
  }

  const customerRecord = await findById(id);
  if (!customerRecord || !isAuthorized(customerRecord.userId, userId, userRole)) {
    return undefined;
  }

  const [updatedCustomer] = await db
    .update(customerTable)
    .set({ ...updates })
    .where(eq(customerTable.id, id))
    .returning();

  // Sync with Stripe after update
  if (updatedCustomer) {
    await syncCustomerToStripe(updatedCustomer, userId);
  }

  return updatedCustomer;
};

/**
 * Removes a customer by their ID.
 * @param id The ID of the customer to remove.
 * @returns A promise that resolves when the operation is complete.
 */
export const remove = async (id: number): Promise<void> => {
  await db.delete(customerTable).where(eq(customerTable.id, id));
};
