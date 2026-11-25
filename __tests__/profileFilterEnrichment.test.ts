jest.mock('../src/api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('../src/api/useProfile', () => ({
  normalizeProfile: (payload: any) => payload?.data ?? payload ?? {},
}));

import apiClient from '../src/api/apiClient';
import {
  enrichProfilesWithFilterFields,
  clearProfileFilterMetaCache,
} from '../src/utils/profileFilterEnrichment';

const mockedGet = apiClient.get as jest.Mock;

describe('profile filter enrichment', () => {
  beforeEach(() => {
    clearProfileFilterMetaCache();
    mockedGet.mockReset();
  });

  it('merges englishLevel and ethnicity from the full profile', async () => {
    mockedGet.mockResolvedValue({
      data: { englishLevel: 'Medium', ethnicity: 'South Asian' },
    });

    const items = await enrichProfilesWithFilterFields(
      [{ userId: 'u1', name: 'A' }],
      { english: true, ethnicity: true }
    );

    expect(items[0].englishLevel).toBe('Medium');
    expect(items[0].ethnicity).toBe('South Asian');
  });

  it('merges fields under item.profile too', async () => {
    mockedGet.mockResolvedValue({
      data: { englishLevel: 'Very Good', ethnicity: 'Asian' },
    });

    const items = await enrichProfilesWithFilterFields(
      [{ userId: 'u2', profile: { name: 'B' } }],
      { english: true, ethnicity: true }
    );

    expect(items[0].profile.englishLevel).toBe('Very Good');
    expect(items[0].profile.ethnicity).toBe('Asian');
  });

  it('caches profiles between searches', async () => {
    mockedGet.mockResolvedValue({
      data: { englishLevel: 'Good', ethnicity: 'White/Caucasian' },
    });

    await enrichProfilesWithFilterFields([{ userId: 'u3' }], { english: true });
    await enrichProfilesWithFilterFields([{ userId: 'u3' }], { english: true });

    expect(mockedGet).toHaveBeenCalledTimes(1);
  });

  it('does nothing when neither filter is active', async () => {
    const original = [{ userId: 'u4' }];
    const items = await enrichProfilesWithFilterFields(original, {});

    expect(items).toBe(original);
    expect(mockedGet).not.toHaveBeenCalled();
  });
});
