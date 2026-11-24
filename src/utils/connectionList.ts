/**
 * Returns true when the account attached to a connection is deleted /
 * deactivated and should therefore be hidden from invitation lists.
 */
export const isConnectionAccountDeleted = (account: any): boolean => {
  if (!account || typeof account !== 'object') return false;

  const profile = account.profile || {};
  const user = account.user || {};

  if (
    [account.isDeleted, profile.isDeleted, user.isDeleted,
     account.deleted, profile.deleted, user.deleted].some((v) => v === true)
  ) {
    return true;
  }

  if (
    [account.deactivated, profile.deactivated, user.deactivated,
     account.isDeactivated, profile.isDeactivated, user.isDeactivated].some((v) => v === true)
  ) {
    return true;
  }

  if ([account.isActive, profile.isActive, user.isActive].some((v) => v === false)) {
    return true;
  }

  const status = String(
    account.status || profile.status || user.status ||
    account.accountStatus || profile.accountStatus || user.accountStatus || ''
  ).toUpperCase();

  return [
    'DELETED',
    'DEACTIVATED',
    'INACTIVE',
    'SUSPENDED',
    'SCHEDULED_FOR_DELETION',
    'PENDING_DELETION',
  ].includes(status);
};

/**
 * Removes duplicate rows from a connection list.
 *
 * The same invitation can be returned by several sources (received/sent lists,
 * the connections list, locally cached accepted connections and synthetic
 * notification invites). Duplicate ids make React warn about duplicate keys and
 * render the same card twice, so keep a single row per id and prefer the most
 * advanced status when two rows collide.
 */
export const dedupeConnections = <T extends { id?: any; status?: string }>(list: T[]): T[] => {
  const statusRank = (status?: string) => {
    const s = String(status || '').toUpperCase();
    if (s === 'ACCEPTED' || s === 'APPROVED') return 3;
    if (s === 'DECLINED' || s === 'REJECTED' || s === 'CANCELLED') return 0;
    return 2;
  };

  const indexById = new Map<string, number>();
  const result: T[] = [];

  for (const item of list) {
    const rawId = String((item as any)?.id ?? '').trim();
    const hasUsableId = rawId !== '' && rawId !== '0' && rawId !== 'undefined' && rawId !== 'null';

    if (!hasUsableId) {
      result.push(item);
      continue;
    }

    const key = `id:${rawId}`;
    const existingIndex = indexById.get(key);

    if (existingIndex === undefined) {
      indexById.set(key, result.length);
      result.push(item);
      continue;
    }

    const previous = result[existingIndex];
    if (statusRank(item.status) >= statusRank(previous.status)) {
      result[existingIndex] = { ...previous, ...item };
    }
  }

  return result;
};
