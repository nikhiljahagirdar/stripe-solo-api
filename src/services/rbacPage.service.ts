import { db } from '../db';
import { RbackPagesTable, RbackRolesPagesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const createPage = async (data: { pagename: string; pageUrl: string; groupName?: string } | { pagename: string; pageUrl: string; groupName?: string }[]) => {
  if (Array.isArray(data)) {
    const newPages = await db.insert(RbackPagesTable).values(data).returning();
    return newPages;
  } else {
    const [newPage] = await db.insert(RbackPagesTable).values(data).returning();
    return newPage;
  }
};

export const getAllPages = async () => {
  return db.select().from(RbackPagesTable).orderBy(RbackPagesTable.pagename);
};

export const getPageById = async (id: number) => {
  const [page] = await db.select().from(RbackPagesTable).where(eq(RbackPagesTable.id, id)).limit(1);
  return page;
};

export const updatePage = async (id: number | number[], data: { pagename?: string; pageUrl?: string; groupName?: string } | { id: number; pagename?: string; pageUrl?: string; groupName?: string }[]) => {
  if (Array.isArray(id) && Array.isArray(data)) {
    const updates = await Promise.all(
      data.map(item => 
        db.update(RbackPagesTable)
          .set({ pagename: item.pagename, pageUrl: item.pageUrl, groupName: item.groupName })
          .where(eq(RbackPagesTable.id, item.id))
          .returning()
      )
    );
    return updates.flat();
  } else if (typeof id === 'number' && !Array.isArray(data)) {
    const [updatedPage] = await db.update(RbackPagesTable)
      .set(data)
      .where(eq(RbackPagesTable.id, id))
      .returning();
    return updatedPage;
  }
  throw new Error('Invalid parameters: id and data must both be arrays or both be single values');
};

export const deletePage = async (id: number) => {
  await db.delete(RbackPagesTable).where(eq(RbackPagesTable.id, id));
  return { id, deleted: true };
};

export const assignRoleToPage = async (data: {
  roleId: number;
  pageId: number;
  userid?: number;
  isView?: boolean;
  isAdd?: boolean;
  isEdit?: boolean;
  isDelete?: boolean;
  isUpdate?: boolean;
} | {
  roleId: number;
  pageId: number;
  userid?: number;
  isView?: boolean;
  isAdd?: boolean;
  isEdit?: boolean;
  isDelete?: boolean;
  isUpdate?: boolean;
}[]) => {
  if (Array.isArray(data)) {
    const assignments = await db.insert(RbackRolesPagesTable).values(data).returning();
    return assignments;
  } else {
    const [assignment] = await db.insert(RbackRolesPagesTable).values(data).returning();
    return assignment;
  }
};

export const getRolePageAssignments = async (roleId?: number, pageId?: number) => {
  if (roleId && pageId) {
    return db.select().from(RbackRolesPagesTable)
      .where(and(eq(RbackRolesPagesTable.roleId, roleId), eq(RbackRolesPagesTable.pageId, pageId)));
  } else if (roleId) {
    return db.select().from(RbackRolesPagesTable)
      .where(eq(RbackRolesPagesTable.roleId, roleId));
  } else if (pageId) {
    return db.select().from(RbackRolesPagesTable)
      .where(eq(RbackRolesPagesTable.pageId, pageId));
  }
  
  return db.select().from(RbackRolesPagesTable);
};

export const updateRolePageAssignment = async (id: number | number[], data: {
  isView?: boolean;
  isAdd?: boolean;
  isEdit?: boolean;
  isDelete?: boolean;
  isUpdate?: boolean;
} | {
  id: number;
  isView?: boolean;
  isAdd?: boolean;
  isEdit?: boolean;
  isDelete?: boolean;
  isUpdate?: boolean;
}[]) => {
  if (Array.isArray(id) && Array.isArray(data)) {
    const updates = await Promise.all(
      data.map(item => 
        db.update(RbackRolesPagesTable)
          .set({ isView: item.isView, isAdd: item.isAdd, isEdit: item.isEdit, isDelete: item.isDelete, isUpdate: item.isUpdate })
          .where(eq(RbackRolesPagesTable.id, item.id))
          .returning()
      )
    );
    return updates.flat();
  } else if (typeof id === 'number' && !Array.isArray(data)) {
    const [updated] = await db.update(RbackRolesPagesTable)
      .set(data)
      .where(eq(RbackRolesPagesTable.id, id))
      .returning();
    return updated;
  }
  throw new Error('Invalid parameters: id and data must both be arrays or both be single values');
};

export const deleteRolePageAssignment = async (id: number) => {
  await db.delete(RbackRolesPagesTable).where(eq(RbackRolesPagesTable.id, id));
  return { id, deleted: true };
};

export const createDefaultRolePageAssignments = async (userId: number, roleId: number) => {
  // Get all pages
  const pages = await db.select().from(RbackPagesTable);
  
  // Create assignments for all pages with the user's role
  const assignments = pages.map(page => ({
    roleId,
    pageId: page.id,
    userid: userId,
    isView: false,
    isAdd: false,
    isEdit: false,
    isDelete: false,
    isUpdate: false
  }));
  
  if (assignments.length > 0) {
    return await db.insert(RbackRolesPagesTable).values(assignments).returning();
  }
  
  return [];
};

export const getUserPermissions = async (userId: number) => {
  return await db.select({
    id: RbackRolesPagesTable.id,
    roleId: RbackRolesPagesTable.roleId,
    userId: RbackRolesPagesTable.userid,
    pageId: RbackRolesPagesTable.pageId,
    pageName: RbackPagesTable.pagename,
    pageUrl: RbackPagesTable.pageUrl,
    groupName: RbackPagesTable.groupName,
    isView: RbackRolesPagesTable.isView,
    isAdd: RbackRolesPagesTable.isAdd,
    isEdit: RbackRolesPagesTable.isEdit,
    isDelete: RbackRolesPagesTable.isDelete,
    isUpdate: RbackRolesPagesTable.isUpdate,
    filters: RbackRolesPagesTable.filters
  })
  .from(RbackRolesPagesTable)
  .leftJoin(RbackPagesTable, eq(RbackRolesPagesTable.pageId, RbackPagesTable.id))
  .where(eq(RbackRolesPagesTable.userid, userId));
};

export const updateUserPermissionsBulk = async (userId: number, permissions: {
  id: number;
  isView?: boolean;
  isAdd?: boolean;
  isEdit?: boolean;
  isDelete?: boolean;
  isUpdate?: boolean;
  filters?: any;
}[]) => {
  const updates = await Promise.all(
    permissions.map(permission => 
      db.update(RbackRolesPagesTable)
        .set({
          isView: permission.isView,
          isAdd: permission.isAdd,
          isEdit: permission.isEdit,
          isDelete: permission.isDelete,
          isUpdate: permission.isUpdate,
          filters: permission.filters
        })
        .where(and(
          eq(RbackRolesPagesTable.id, permission.id),
          eq(RbackRolesPagesTable.userid, userId)
        ))
        .returning()
    )
  );
  return updates.flat();
};