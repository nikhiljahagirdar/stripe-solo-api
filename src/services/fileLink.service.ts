import { db } from '../db';
import { fileLinksTable, type FileLink, type NewFileLink } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

export class FileLinkService {
  async create(userId: number, stripeAccountId: number, fileLinkData: any): Promise<FileLink> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const stripeFileLink = await stripe.fileLinks.create(fileLinkData);
    
    const newFileLink: NewFileLink = {
      userId,
      stripeAccountId,
      stripeFileLinkId: stripeFileLink.id,
      stripeFileId: stripeFileLink.file as string,
      url: stripeFileLink.url,
      expired: stripeFileLink.expired,
      expiresAt: stripeFileLink.expires_at ? new Date(stripeFileLink.expires_at * 1000) : null,
      created: stripeFileLink.created,
    };

    const [fileLink] = await db.insert(fileLinksTable).values(newFileLink).returning();
    return fileLink!;
  }

  async findByUser(userId: number, accountId?: number, year?: number): Promise<FileLink[]> {
    const conditions = [eq(fileLinksTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(fileLinksTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${fileLinksTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${fileLinksTable.createdAt} <= ${endDate}`);
    }
    return db.select().from(fileLinksTable).where(and(...conditions));
  }

  async findById(userId: number, id: number): Promise<FileLink | undefined> {
    const [fileLink] = await db.select().from(fileLinksTable)
      .where(and(eq(fileLinksTable.id, id), eq(fileLinksTable.userId, userId)))
      .limit(1);
    return fileLink!;
  }
}