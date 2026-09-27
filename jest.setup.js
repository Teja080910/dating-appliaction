jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-encrypted-storage', () => {
  const values = new Map();
  return {
    setItem: jest.fn(async (key, value) => values.set(key, value)),
    getItem: jest.fn(async (key) => values.get(key) ?? null),
    removeItem: jest.fn(async (key) => values.delete(key)),
    clear: jest.fn(async () => values.clear()),
  };
});
