import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockStore } from '../src/mock/mockStore';
import { isSameUserId, isResolvedApiUserId } from '../src/utils/sessionState';
import apiClient from '../src/api/apiClient';

describe('Woman Profile Image Upload and Open Stability', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await mockStore.resetAll();
    await mockStore.init();
  });

  test('1. isSameUserId correctly identifies string userId and numeric id for woman accounts', () => {
    expect(isSameUserId('usr_woman_201', '201')).toBe(true);
    expect(isSameUserId('201', 'usr_woman_201')).toBe(true);
    expect(isSameUserId('usr_woman_201', 'usr_woman_201')).toBe(true);
    expect(isSameUserId('201', '201')).toBe(true);

    // Different users should not match
    expect(isSameUserId('usr_woman_201', 'usr_woman_202')).toBe(false);
    expect(isSameUserId('201', '202')).toBe(false);
    expect(isSameUserId('usr_woman_201', 'usr_man_101')).toBe(false);
  });

  test('2. isResolvedApiUserId rejects invalid IDs like NaN, null, and undefined', () => {
    expect(isResolvedApiUserId('NaN')).toBe(false);
    expect(isResolvedApiUserId('nan')).toBe(false);
    expect(isResolvedApiUserId('null')).toBe(false);
    expect(isResolvedApiUserId('undefined')).toBe(false);
    expect(isResolvedApiUserId('0')).toBe(false);
    expect(isResolvedApiUserId('')).toBe(false);

    // Valid woman account userIds
    expect(isResolvedApiUserId('usr_woman_201')).toBe(true);
    expect(isResolvedApiUserId('201')).toBe(true);
    expect(isResolvedApiUserId('SA1005')).toBe(true);
  });

  test('3. Woman account image upload in mockStore succeeds and updates profile photos', async () => {
    const womanUserId = 'usr_woman_201';
    const testImageUrl = 'https://images.unsplash.com/photo-test-woman.jpg';

    // Upload image
    const newImage = await mockStore.addUserImage(womanUserId, testImageUrl);
    expect(newImage).toBeDefined();
    expect(newImage.imageUrl).toBe(testImageUrl);

    // Verify images query for woman account via both 'usr_woman_201' and numeric '201'
    const imagesByStringId = await mockStore.getUserImages(womanUserId);
    expect(imagesByStringId.some((img) => img.imageUrl === testImageUrl)).toBe(true);

    const imagesByNumericId = await mockStore.getUserImages('201');
    expect(imagesByNumericId.some((img) => img.imageUrl === testImageUrl)).toBe(true);

    // Verify profile photos array was updated
    const profile = await mockStore.getProfileByUserId(womanUserId);
    expect(profile?.photos).toBeDefined();
    expect(profile?.photos?.includes(testImageUrl)).toBe(true);
  });

  test('4. Saving woman profile with phone number does not falsely conflict with herself', async () => {
    const womanUserId = 'usr_woman_201';

    // Woman profile saving her own phone number
    const updated = await mockStore.saveProfile({
      userId: womanUserId,
      displayName: 'Ananya Updated',
      mobile: '9876543210',
      phoneNumber: '9876543210',
    });

    expect(updated).toBeDefined();
    expect(updated.displayName).toBe('Ananya Updated');
    expect(updated.mobile).toBe('9876543210');
  });

  test('5. Woman account upload image via API adapter succeeds', async () => {
    const womanUserId = 'usr_woman_201';
    const uploadRes = await apiClient.post('/profile/upload-image', {
      photo: {
        uri: 'file:///data/user/0/com.amara/cache/new_woman_photo.jpg',
      },
    }, {
      params: { userId: womanUserId },
    });

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.data.status).toBe('success');
    expect(uploadRes.data.imageUrl).toBeDefined();

    // Verify photos array can be saved via PUT /profile/update
    const newPhotoUrl = uploadRes.data.imageUrl;
    const updateRes = await apiClient.put('/profile/update', {
      userId: womanUserId,
      photos: [newPhotoUrl],
      profileImageUrl: newPhotoUrl,
    });

    expect(updateRes.status).toBe(200);
    expect(updateRes.data.data.photos).toContain(newPhotoUrl);
  });

  test('6. FormData request removes manual Content-Type header so native multipart boundary is preserved', async () => {
    const formData = new FormData();
    formData.append('photo', {
      uri: 'file:///data/user/0/com.amara/cache/test.jpg',
      name: 'test.jpg',
      type: 'image/jpeg',
    } as any);
    formData.append('image', {
      uri: 'file:///data/user/0/com.amara/cache/test.jpg',
      name: 'test.jpg',
      type: 'image/jpeg',
    } as any);

    const config: any = {
      url: '/profile/upload-image',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    // Run through apiClient request interceptors
    const requestInterceptor: any = (apiClient.interceptors.request as any).handlers[0]?.fulfilled;
    if (requestInterceptor) {
      const processedConfig = await requestInterceptor(config);
      // Content-Type should have been deleted so boundary is not stripped
      expect(processedConfig.headers['Content-Type']).toBeUndefined();
    }

    const res = await apiClient.post('/profile/upload-image', formData, {
      params: { userId: 'usr_woman_201' },
    });
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('success');
  });

  test('7. All images uploaded by woman account are returned for man accounts in discovery and profile queries', async () => {
    const womanUserId = 'usr_woman_201';
    const photos = [
      'https://images.unsplash.com/photo-woman-1.jpg',
      'https://images.unsplash.com/photo-woman-2.jpg',
      'https://images.unsplash.com/photo-woman-3.jpg',
    ];

    // Woman updates profile with 3 photos
    await apiClient.put('/profile/update', {
      userId: womanUserId,
      photos,
      images: photos,
      profileImageUrl: photos[0],
    });

    // Man queries discovery profiles
    const manUserId = 'usr_man_101';
    const discoveryRes = await apiClient.get('/dashboard/recent', {
      params: { userId: manUserId, gender: 'woman' },
    });
    expect(discoveryRes.status).toBe(200);
    const womanCard = discoveryRes.data.content?.find((p: any) => p.userId === womanUserId || p.id === 201)
      || discoveryRes.data.find?.((p: any) => p.userId === womanUserId || p.id === 201);
    expect(womanCard).toBeDefined();
    expect(womanCard.photos.length).toBe(3);

    // Man queries woman images via /users/:id/images
    const imagesRes = await apiClient.get(`/users/${womanUserId}/images`);
    expect(imagesRes.status).toBe(200);
    expect(imagesRes.data.length).toBe(3);

    // Man queries woman profile via /profile/me
    const profileRes = await apiClient.post('/profile/me', null, {
      params: { userId: womanUserId },
    });
    expect(profileRes.status).toBe(200);
    expect(profileRes.data.photos.length).toBe(3);
    expect(profileRes.data.images.length).toBe(3);
  });
});
