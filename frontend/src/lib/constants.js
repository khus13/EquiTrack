/** Shared constants so the same words are used everywhere. */

export const ROLE_LEVEL = { user: 1, admin: 2, super_admin: 3 };
export const ROLE_LABEL = { user: 'User', admin: 'Admin', super_admin: 'Super Admin' };

/** true when the user's role is at least `role` */
export const hasRole = (user, role) => !!user && (ROLE_LEVEL[user.role] || 0) >= ROLE_LEVEL[role];

/** Where each role lands after login. */
export const homePathFor = (user) =>
  hasRole(user, 'super_admin') ? '/super-admin' : hasRole(user, 'admin') ? '/admin' : '/dashboard';

export const STATUSES = ['Pending', 'In Progress', 'Solved'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const EQUIPMENT_STATUS_LABEL = {
  operational: 'Operational',
  needs_repair: 'Needs repair',
  under_repair: 'Under repair',
  retired: 'Retired',
};

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB (must match the backend)
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
