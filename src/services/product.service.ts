import { db } from '../db';
import type { NewProduct, Product } from '../db/schema';
import { productTable, priceTable } from '../db/schema';
import type { SQL} from 'drizzle-orm';
import { eq, or, ilike, and, count, asc, desc, gte, lte, isNotNull, between } from 'drizzle-orm';

/**
 * Finds all products with pagination, search, sorting, and filtering.
 * @param options - Options for pagination, search, sorting, and filtering.
 * @returns A promise that resolves to an object containing the products for the page and the total count.
 */
export const findAll = async (options: {
  page?: number;
  pageSize?: number;
  query?: string;
  sort?: string;
  filter?: Record<string, any>;
  userId?: number;
  startDate?: string;
  endDate?: string;
  name?: string;
  description?: string;
  active?: boolean;
  priceRange?: string;
  currency?: string;
  interval?: string;
  hasPrice?: boolean;
  accountId?: number;
  year?: number;
} = {}): Promise<{ products: any[], totalCount: number }> => {
  const { page = 1, pageSize = 10, query, sort, filter, userId, startDate, endDate, name, description, priceRange, currency, interval, hasPrice, accountId, year } = options;

  // Build the where clause dynamically
  const whereClauses: (SQL | undefined)[] = [];
  
  if (userId) {
    whereClauses.push(eq(productTable.userId, userId));
  }

  if (accountId) {
    whereClauses.push(eq(priceTable.stripeAccountId, accountId));
  }
  
  if (startDate) {
    whereClauses.push(gte(productTable.created_at, new Date(startDate)));
  }
  if (endDate) {
    whereClauses.push(lte(productTable.created_at, new Date(endDate)));
  }
  
  if (year) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
    whereClauses.push(gte(productTable.created_at, startOfYear));
    whereClauses.push(lte(productTable.created_at, endOfYear));
  }
  
  if (name) {
    whereClauses.push(ilike(productTable.name, `%${name}%`));
  }
  
  if (description) {
    whereClauses.push(ilike(productTable.description, `%${description}%`));
  }
  
  if (currency) {
    whereClauses.push(eq(priceTable.currency, currency));
  }
  
  if (interval) {
    whereClauses.push(eq(priceTable.recurringInterval, interval));
  }
  
  if (hasPrice !== undefined) {
    if (hasPrice) {
      whereClauses.push(isNotNull(priceTable.id));
    }
  }
  
  if (query) {
    const searchQuery = `%${query}%`;
    whereClauses.push(
      or(
        ilike(productTable.name, searchQuery),
        ilike(productTable.description, searchQuery)
      )
    );
  }

  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      if (key in productTable) {
        whereClauses.push(eq(productTable[key as keyof typeof productTable.$inferSelect], value));
      }
    }
  }

  // Build the order by clause
  let orderBy: SQL | undefined;
  if (sort) {
    const [column, direction] = sort.split(':');
    const sortableColumns = {
      'name': productTable.name,
      'description': productTable.description,
      'createdAt': productTable.created_at,
      'updatedAt': productTable.updated_at,
      'unitAmount': priceTable.unitAmount,
      'currency': priceTable.currency,
    };
    
    if (sortableColumns[column as keyof typeof sortableColumns]) {
      const col = sortableColumns[column as keyof typeof sortableColumns];
      orderBy = direction === 'desc' ? desc(col) : asc(col);
    }
  }

  // Handle price range filtering
  if (priceRange) {
    const [min, max] = priceRange.split('-').map(Number);
    if (min && max) {
      whereClauses.push(between(priceTable.unitAmount, min.toString(), max.toString()));
    }
  }

  const finalWhereCondition = and(...whereClauses);

  // Build query with price join
  const baseQuery = db
    .select({
      id: productTable.id,
      userId: productTable.userId,
      stripeProductId: productTable.stripeProductId,
      name: productTable.name,
      description: productTable.description,
      created_at: productTable.created_at,
      updated_at: productTable.updated_at,
      prices: {
        id: priceTable.id,
        stripePriceId: priceTable.stripePriceId,
        unitAmount: priceTable.unitAmount,
        currency: priceTable.currency,
        recurringInterval: priceTable.recurringInterval,
        active: priceTable.active,
      }
    })
    .from(productTable)
    .leftJoin(priceTable, eq(productTable.stripeProductId, priceTable.stripeProductId));

  // Perform two queries: one for the data page, one for the total count
  const [products, total] = await Promise.all([
    baseQuery
      .where(finalWhereCondition)
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .orderBy(orderBy || desc(productTable.created_at)),
    db.select({ value: count() })
      .from(productTable)
      .leftJoin(priceTable, eq(productTable.stripeProductId, priceTable.stripeProductId))
      .where(finalWhereCondition)
  ]);

  return {
    products,
    totalCount: total[0]?.value ?? 0
  };
};

/**
 * Finds a product by its ID.
 * @param id The ID of the product to find.
 * @returns A promise that resolves to the found product or `undefined` if not found.
 */
export const find = async (id: number): Promise<Product | undefined> => {
  return db.query.productTable.findFirst({
    where: eq(productTable.id, id),
  });
};

/**
 * Creates a new product.
 * @param productInfo The product data to create.
 * @returns A promise that resolves to the newly created product.
 */
export const create = async (productInfo: NewProduct): Promise<Product> => {
  const [newProduct] = await db.insert(productTable).values(productInfo).returning();
  return newProduct!;
};

/**
 * Updates an existing product.
 * @param id The ID of the product to update.
 * @param updates The partial product data to apply.
 * @returns A promise that resolves to the updated product or `undefined` if not found.
 */
export const update = async (id: number, updates: Partial<Product>): Promise<Product | undefined> => {
  const [updatedProduct] = await db
    .update(productTable)
    .set({ ...updates })
    .where(eq(productTable.id, id))
    .returning();

  return updatedProduct!;
};

/**
 * Removes a product by its ID.
 * @param id The ID of the product to remove.
 * @returns A promise that resolves when the operation is complete.
 */
export const remove = async (id: number): Promise<void> => {
  await db.delete(productTable).where(eq(productTable.id, id));
};
