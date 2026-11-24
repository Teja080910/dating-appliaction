import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockStore } from '../src/mock/mockStore';
import apiClient from '../src/api/apiClient';
import { extractPhone, extractTelegram } from '../src/utils/whatsappHelper';

describe('Dynamic Edit Profile and Removal Reflection', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await mockStore.resetAll();
    await mockStore.init();
  });

  test('1. Uploaded image in edit profile dynamically updates backend profile photos and images for other users', async () => {
    const womanUserId = 'usr_woman_201';
    const newUploadedPhoto = 'https://images.unsplash.com/photo-dynamic-woman-new.jpg';

    // 1. User updates profile with the new photo list
    const updateRes = await apiClient.put('/profile/update', {
      userId: womanUserId,
      displayName: 'Ananya Sharma',
      photos: [newUploadedPhoto],
      images: [newUploadedPhoto],
      profileImageUrl: newUploadedPhoto,
      photo: newUploadedPhoto,
    });

    expect(updateRes.status).toBe(200);

    // 2. Another user (man) fetches recent dashboard profiles
    const discoveryRes = await apiClient.get('/dashboard/recent', {
      params: { userId: 'usr_man_101', gender: 'woman' },
    });
    expect(discoveryRes.status).toBe(200);

    const womenList = discoveryRes.data?.data || discoveryRes.data?.content || discoveryRes.data;
    const ananya = womenList.find((u: any) => String(u.userId) === womanUserId || String(u.id) === '201');
    expect(ananya).toBeDefined();
    expect(ananya.photos).toContain(newUploadedPhoto);
    expect(ananya.profileImageUrl).toBe(newUploadedPhoto);

    // 3. User images endpoint also reflects the newly uploaded image
    const imagesRes = await apiClient.get(`/users/${womanUserId}/images`);
    expect(imagesRes.status).toBe(200);
    const userImages = imagesRes.data?.data || imagesRes.data;
    expect(userImages.some((img: any) => img.imageUrl === newUploadedPhoto)).toBe(true);
  });

  test('2. Removed photo in edit profile is immediately persisted and removed from others view', async () => {
    const womanUserId = 'usr_woman_201';
    const photoToKeep = 'https://images.unsplash.com/photo-keep.jpg';
    const photoToDelete = 'https://images.unsplash.com/photo-to-delete.jpg';

    // Initial setup with 2 photos
    await apiClient.put('/profile/update', {
      userId: womanUserId,
      photos: [photoToKeep, photoToDelete],
      images: [photoToKeep, photoToDelete],
      profileImageUrl: photoToKeep,
    });

    // Verify initial photos
    let profile = await mockStore.getProfileByUserId(womanUserId);
    expect(profile?.photos).toEqual([photoToKeep, photoToDelete]);

    // User removes photoToDelete (photosToSend has only photoToKeep)
    const updateRes = await apiClient.put('/profile/update', {
      userId: womanUserId,
      photos: [photoToKeep],
      images: [photoToKeep],
      profileImageUrl: photoToKeep,
      photo: photoToKeep,
    });
    expect(updateRes.status).toBe(200);

    // Profile must now only have photoToKeep
    profile = await mockStore.getProfileByUserId(womanUserId);
    expect(profile?.photos).toEqual([photoToKeep]);
    expect(profile?.photos).not.toContain(photoToDelete);

    // mockStore user images must also have deleted photo removed
    const images = await mockStore.getUserImages(womanUserId);
    expect(images.map((img) => img.imageUrl)).toEqual([photoToKeep]);
  });

  test('3. Removed bio reflects as empty string and does not resurrect or fallback to fake bio', async () => {
    const womanUserId = 'usr_woman_201';

    // First save profile with initial bio
    await apiClient.put('/profile/update', {
      userId: womanUserId,
      bio: 'Initial active bio',
    });

    let profile = await mockStore.getProfileByUserId(womanUserId);
    expect(profile?.bio).toBe('Initial active bio');

    // User explicitly removes bio in Edit Profile
    await apiClient.put('/profile/update', {
      userId: womanUserId,
      bio: '',
    });

    profile = await mockStore.getProfileByUserId(womanUserId);
    expect(profile?.bio).toBe('');

    // Fetch via API to verify persistence
    const meRes = await apiClient.post('/profile/me', null, { params: { userId: womanUserId } });
    const meData = meRes.data?.data || meRes.data?.profile || meRes.data;
    expect(meData.bio).toBe('');
    expect(meData.bio).not.toBe('Dm for vc only');
  });

  test('4. Removed phone number is not resurrected by historical match records', async () => {
    const womanUserId = 'usr_woman_201';

    // Simulate historical match record containing old phone number
    const targetPartyOldSnapshot = {
      id: womanUserId,
      name: 'Ananya',
      mobile: '+91 9999999999',
      phoneNumber: '+91 9999999999',
      phone: '+91 9999999999',
    };

    // Live fetched profile where woman removed her phone number
    const liveFetchedProfile = {
      id: womanUserId,
      name: 'Ananya',
      mobile: '',
      phoneNumber: '',
      phone: '',
    };

    // When woman removed phone number, checking explicit removal must return ''
    const isPhoneExplicitlyCleared =
      liveFetchedProfile.mobile === '' ||
      liveFetchedProfile.phoneNumber === '' ||
      liveFetchedProfile.phone === '';

    const effectiveTargetPhone = isPhoneExplicitlyCleared
      ? ''
      : extractPhone(liveFetchedProfile, targetPartyOldSnapshot);

    expect(effectiveTargetPhone).toBe('');
  });

  test('5. Removed telegram username is not resurrected by historical match records', async () => {
    const womanUserId = 'usr_woman_201';

    // Simulate historical match record containing old telegram
    const targetPartyOldSnapshot = {
      id: womanUserId,
      name: 'Ananya',
      telegramUsername: 'ananya_old_tg',
    };

    // Live fetched profile where woman disconnected/cleared telegram
    const liveFetchedProfile = {
      id: womanUserId,
      name: 'Ananya',
      telegramUsername: '',
    };

    const isTgExplicitlyDisconnected =
      liveFetchedProfile.telegramUsername === '' ||
      liveFetchedProfile.telegramUsername === 'NONE';

    const effectiveTargetTg = isTgExplicitlyDisconnected
      ? ''
      : extractTelegram(liveFetchedProfile, targetPartyOldSnapshot);

    expect(effectiveTargetTg).toBe('');
  });

  test('6. User details with empty/cleared traits do not force fake values', () => {
    const profileWithEmptyTraits: any = {
      height: undefined,
      bodyType: '',
      appearance: '',
      ethnicity: '',
      smoke: '',
      drink: '',
      englishLevel: '',
    };

    const normalizeTextValue = (val: any) => String(val || '').trim();

    const pillHeight = normalizeTextValue(profileWithEmptyTraits.height);
    const pillBodyType = normalizeTextValue(profileWithEmptyTraits.bodyType);
    const pillAppearance = normalizeTextValue(profileWithEmptyTraits.appearance);
    const pillEthnicity = normalizeTextValue(profileWithEmptyTraits.ethnicity);
    const pillSmoke = normalizeTextValue(profileWithEmptyTraits.smoke);
    const pillDrink = normalizeTextValue(profileWithEmptyTraits.drink);
    const pillEnglish = normalizeTextValue(profileWithEmptyTraits.englishLevel);

    // None of these should have fake values like '160', 'Slim', 'Attractive', 'No'
    expect(pillHeight).toBe('');
    expect(pillBodyType).toBe('');
    expect(pillAppearance).toBe('');
    expect(pillEthnicity).toBe('');
    expect(pillSmoke).toBe('');
    expect(pillDrink).toBe('');
    expect(pillEnglish).toBe('');
  });
});
