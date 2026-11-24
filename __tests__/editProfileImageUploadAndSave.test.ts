import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockStore } from '../src/mock/mockStore';
import { isDeletedPhotoUri } from '../src/utils/imageHelpers';

describe('Edit Profile Image Upload and Persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('adds newly uploaded image to mockStore and syncs to user profile photos', async () => {
    const userId = 'usr_upload_test_1';

    // Initial state: 2 photos
    await mockStore.saveProfile({
      userId,
      photos: [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg',
      ],
    });

    const profileBefore = await mockStore.getProfileByUserId(userId);
    expect(profileBefore?.photos).toHaveLength(2);

    // Upload new image
    const newImageUri = 'file:///data/user/0/cache/new_profile_image.jpg';
    const uploaded = await mockStore.addUserImage(userId, newImageUri);

    expect(uploaded).toBeDefined();
    expect(uploaded.imageUrl).toBe(newImageUri);
    expect(uploaded.id).toBeGreaterThan(0);

    // Profile photos should now contain the new image
    const profileAfter = await mockStore.getProfileByUserId(userId);
    expect(profileAfter?.photos).toContain(newImageUri);
    expect(profileAfter?.photos).toHaveLength(3);
  });

  it('isDeletedPhotoUri correctly identifies deleted URIs and avoids false positives on fresh uploads', () => {
    const deletedList = [
      'https://example.com/old_deleted.jpg',
      'file:///cache/deleted_one.jpg',
    ];

    expect(isDeletedPhotoUri('https://example.com/old_deleted.jpg', deletedList)).toBe(true);
    expect(isDeletedPhotoUri('file:///cache/deleted_one.jpg', deletedList)).toBe(true);

    // Newly uploaded photos with different URIs or generic filenames should NOT be flagged as deleted
    expect(isDeletedPhotoUri('file:///cache/fresh_upload_123.jpg', deletedList)).toBe(false);
    expect(isDeletedPhotoUri('https://example.com/photo_456.jpg', deletedList)).toBe(false);
  });

  it('stores user photos scoped to active userId without wiping out on subsequent saves', async () => {
    const userId = 'usr_upload_test_2';
    const photos = [
      'https://example.com/p1.jpg',
      'https://example.com/p2.jpg',
      'https://example.com/p3.jpg',
    ];

    await AsyncStorage.setItem(`user_photos_${userId}`, JSON.stringify(photos));

    const storedRaw = await AsyncStorage.getItem(`user_photos_${userId}`);
    expect(storedRaw).toBeDefined();
    const parsed = JSON.parse(storedRaw!);
    expect(parsed).toEqual(photos);

    // Update profile with photos
    await mockStore.saveProfile({
      userId,
      displayName: 'Test User',
      photos,
    });

    const userImages = await mockStore.getUserImages(userId);
    expect(userImages.length).toBe(3);
    expect(userImages.map((img) => img.imageUrl)).toEqual(photos);
  });
});
