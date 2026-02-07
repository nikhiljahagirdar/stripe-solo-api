export type Layout = 'admin' | 'member' | 'minimal';

export interface LayoutSettings {
  layout: Layout;
  showHeader: boolean;
  showNotifications: boolean;
}

/**
 * Decide layout based on user and path.
 * - registration and password-change routes => minimal (no header)
 * - admin users => admin layout (header + notifications)
 * - authenticated members => member layout (header + notifications)
 * - unauthenticated => minimal
 */
export const getLayoutFor = (opts: { user?: { id: number; role?: string }; path?: string }): LayoutSettings => {
  const { user, path = '' } = opts;
  const noHeaderPaths = ['/auth/register', '/auth/password/change'];

  if (noHeaderPaths.includes(path)) {
    return { layout: 'minimal', showHeader: false, showNotifications: false };
  }

  if (!user) {
    return { layout: 'minimal', showHeader: false, showNotifications: false };
  }

  if (user.role === 'Admin') {
    return { layout: 'admin', showHeader: true, showNotifications: true };
  }

  return { layout: 'member', showHeader: true, showNotifications: true };
};
