jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      setItem: jest.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      removeItem: jest.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
      multiRemove: jest.fn(() => Promise.resolve()),
    },
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveSearchFilters,
  getSavedSearchFilters,
  clearSavedSearchFilters,
} from '../src/utils/types/AsyncStorage';

describe('Search filter scoping', () => {
  beforeEach(async () => {
    await clearSavedSearchFilters('userA');
    await clearSavedSearchFilters('userB');
    (AsyncStorage.getItem as jest.Mock).mockClear();
  });

  it('does not leak one account filters into another', async () => {
    await saveSearchFilters({ minAge: 30, maxAge: 45, isFilterActive: true }, 'userA');

    expect(await getSavedSearchFilters('userA')).toMatchObject({ minAge: 30, maxAge: 45 });
    expect(await getSavedSearchFilters('userB')).toBeNull();
  });

  it('does not write the global fallback when a user is provided', async () => {
    await saveSearchFilters({ minAge: 25, isFilterActive: true }, 'userA');

    expect(await AsyncStorage.getItem('@search_filters')).toBeNull();
    expect(await AsyncStorage.getItem('@search_filters_userA')).not.toBeNull();
  });

  it('still works for guest/global filters when no user is provided', async () => {
    await saveSearchFilters({ minAge: 22, isFilterActive: true });

    expect(await getSavedSearchFilters()).toMatchObject({ minAge: 22 });
  });
});
