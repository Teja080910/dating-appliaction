import { isDeletedProfile } from '../src/components/HomeTabComponents/UserList';
import { isDeletedUserRecord } from '../src/api/useDiscovery';

describe('Deleted Account Filtering in Discover & Search', () => {
  it('correctly identifies accounts with isDeleted: true', () => {
    const user = { id: 1, name: 'Alice', isDeleted: true };
    expect(isDeletedProfile(user)).toBe(true);
    expect(isDeletedUserRecord(user)).toBe(true);
  });

  it('correctly identifies accounts with deleted: true', () => {
    const user = { id: 2, name: 'Bob', deleted: true };
    expect(isDeletedProfile(user)).toBe(true);
    expect(isDeletedUserRecord(user)).toBe(true);
  });

  it('correctly identifies accounts with status: DELETED or DEACTIVATED', () => {
    const user1 = { id: 3, name: 'Charlie', status: 'DELETED' };
    const user2 = { id: 4, name: 'David', status: 'DEACTIVATED' };
    const user3 = { id: 5, name: 'Eva', profile: { status: 'deleted' } };
    expect(isDeletedProfile(user1)).toBe(true);
    expect(isDeletedProfile(user2)).toBe(true);
    expect(isDeletedProfile(user3)).toBe(true);
    expect(isDeletedUserRecord(user1)).toBe(true);
    expect(isDeletedUserRecord(user2)).toBe(true);
    expect(isDeletedUserRecord(user3)).toBe(true);
  });

  it('correctly identifies accounts with accountStatus: DELETED or SCHEDULED_FOR_DELETION', () => {
    const user1 = { id: 6, name: 'Frank', accountStatus: 'DELETED' };
    const user2 = { id: 7, name: 'Grace', accountStatus: 'SCHEDULED_FOR_DELETION' };
    expect(isDeletedProfile(user1)).toBe(true);
    expect(isDeletedProfile(user2)).toBe(true);
  });

  it('correctly excludes accounts matching deletedIds list', () => {
    const user = { id: 'user_123', name: 'Hannah' };
    const deletedIds = ['user_123', 'user_999'];
    expect(isDeletedProfile(user, deletedIds)).toBe(true);
  });

  it('keeps normal active accounts', () => {
    const user = {
      id: 'usr_valid_1',
      name: 'Active User',
      isDeleted: false,
      status: 'ACTIVE',
      accountStatus: 'ACTIVE',
      isActive: true,
    };
    expect(isDeletedProfile(user, ['other_id'])).toBe(false);
    expect(isDeletedUserRecord(user)).toBe(false);
  });
});
