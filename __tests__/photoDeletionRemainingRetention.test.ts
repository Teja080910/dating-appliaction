import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockStore } from '../src/mock/mockStore';

describe('Photo Deletion and Remaining Photos Retention', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('keeps remaining photos intact and does NOT wipe them out when one photo is deleted', async () => {
    const userId = 'usr_test_retention_1';

    // Seed user with 4 photos
    const initialPhotos = [
      'https://images.example.com/photo1.jpg',
      'https://images.example.com/photo2.jpg',
      'https://images.example.com/photo3.jpg',
      'https://images.example.com/photo4.jpg',
    ];

    await mockStore.saveProfile({
      userId,
      photos: [...initialPhotos],
    });

    const profileBefore = await mockStore.getProfileByUserId(userId);
    expect(profileBefore?.photos).toHaveLength(4);

    // Delete photo at index 1 (photo2.jpg)
    const success = await mockStore.deleteUserImage(
      'photo2.jpg',
      userId,
      'https://images.example.com/photo2.jpg'
    );
    expect(success).toBe(true);

    // Profile should now contain exactly 3 remaining photos
    const profileAfter = await mockStore.getProfileByUserId(userId);
    expect(profileAfter?.photos).toHaveLength(3);
    expect(profileAfter?.photos).not.toContain('https://images.example.com/photo2.jpg');
    expect(profileAfter?.photos).toContain('https://images.example.com/photo1.jpg');
    expect(profileAfter?.photos).toContain('https://images.example.com/photo3.jpg');
    expect(profileAfter?.photos).toContain('https://images.example.com/photo4.jpg');
  });

  it('exact URI matching avoids filtering remaining photos with generic or temp names', () => {
    const deletedList = [
      'file:///data/user/0/com.datingappliaction/cache/temp_123.jpg',
    ];

    const getAbsoluteUrl = (u: string) => u;

    const isDeletedUri = (uri: string | null | undefined) => {
      if (!uri || !Array.isArray(deletedList) || deletedList.length === 0) return false;
      const clean = uri.trim();
      if (!clean) return false;
      const abs = getAbsoluteUrl(clean) || clean;
      return deletedList.some((d) => {
        if (!d) return false;
        const cleanD = String(d).trim();
        if (!cleanD) return false;
        if (cleanD === clean || cleanD === abs) return true;
        const dAbs = getAbsoluteUrl(cleanD) || cleanD;
        return dAbs === abs || dAbs === clean;
      });
    };

    // The deleted URI is recognized as deleted
    expect(isDeletedUri('file:///data/user/0/com.datingappliaction/cache/temp_123.jpg')).toBe(true);

    // Another photo with a different path or URI is NOT deleted (not wiped out by filename collision)
    expect(isDeletedUri('file:///data/user/0/com.datingappliaction/cache/temp_456.jpg')).toBe(false);
    expect(isDeletedUri('https://images.example.com/temp_123.jpg')).toBe(false);
  });
});
