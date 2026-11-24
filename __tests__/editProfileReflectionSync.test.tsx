import { mockStore } from '../src/mock/mockStore';
import apiClient from '../src/api/apiClient';

describe('Edit Profile Data Persistence and Reflection Sync', () => {
  const testUserId = 'usr_edit_sync_test_101';

  beforeEach(async () => {
    await mockStore.init();
    (mockStore as any).initialized = true;

    // Create a base user
    await mockStore.createUser({
      userId: testUserId,
      name: 'Initial User',
      email: 'edit_sync_test@amara.com',
      mobile: '+91 9111111111',
      gender: 'woman',
    });

    await mockStore.saveProfile({
      userId: testUserId,
      name: 'Initial User',
      displayName: 'Initial User',
      bio: 'Initial Bio',
      dob: '2000-01-01',
      age: 26,
      mobile: '+91 9111111111',
      telegramUsername: 'initial_tg',
    });
  });

  test('PUT /profile/update saves and persists updated displayName, bio, dob, age, mobile, and telegram', async () => {
    const updatePayload = {
      userId: testUserId,
      name: 'Kavya Sharma',
      displayName: 'Kavya',
      bio: 'Loves classical dance and coffee dates',
      dob: '1998-05-15',
      age: 28,
      mobile: '+91 9876543210',
      telegramUsername: 'kavya_amara',
    };

    const updateRes = await apiClient.put('/profile/update', updatePayload);
    expect(updateRes.status).toBe(200);

    // Fetch the updated profile via GET /profile/me/{userId}
    const profileRes = await apiClient.get(`/profile/me/${testUserId}`);
    expect(profileRes.status).toBe(200);

    const profileData = profileRes.data?.data || profileRes.data;
    expect(profileData.displayName).toBe('Kavya');
    expect(profileData.bio).toBe('Loves classical dance and coffee dates');
    expect(profileData.dob).toBe('1998-05-15');
    expect(profileData.age).toBe(28);
    expect(profileData.mobile).toBe('+91 9876543210');
    expect(profileData.telegramUsername).toBe('kavya_amara');

    // Also verify underlying store
    const storedProfile = await mockStore.getProfileByUserId(testUserId);
    expect(storedProfile?.displayName).toBe('Kavya');
    expect(storedProfile?.bio).toBe('Loves classical dance and coffee dates');
    expect(storedProfile?.dob).toBe('1998-05-15');
    expect(storedProfile?.mobile).toBe('+91 9876543210');
    expect(storedProfile?.telegramUsername).toBe('kavya_amara');

    const storedUser = await mockStore.findUserById(testUserId);
    expect(storedUser?.name).toBe('Kavya');
    expect(storedUser?.mobile).toBe('+91 9876543210');
    expect(storedUser?.telegramUsername).toBe('kavya_amara');
  });

  test('Calling PUT /profile/update-basic updates basic values without losing dob or mobile in store', async () => {
    const basicPayload = {
      userId: testUserId,
      displayName: 'Kavya Updated',
      bio: 'New bio details',
      age: 28,
    };

    const basicRes = await apiClient.put('/profile/update-basic', basicPayload);
    expect(basicRes.status).toBe(200);

    const profile = await mockStore.getProfileByUserId(testUserId);
    expect(profile?.displayName).toBe('Kavya Updated');
    expect(profile?.bio).toBe('New bio details');
    // Dob and mobile must remain intact
    expect(profile?.dob).toBe('2000-01-01');
    expect(profile?.mobile).toBe('+91 9111111111');
  });

  test('Saving profile without any contact method (empty phone and telegram) succeeds cleanly', async () => {
    const noContactPayload = {
      userId: testUserId,
      name: 'Riya',
      displayName: 'Riya',
      bio: 'Bio without contact details',
      dob: '2001-08-20',
      age: 25,
    };

    const res = await apiClient.put('/profile/update', noContactPayload);
    expect(res.status).toBe(200);

    const profileRes = await apiClient.get(`/profile/me/${testUserId}`);
    expect(profileRes.status).toBe(200);
    expect(profileRes.data.displayName).toBe('Riya');
    expect(profileRes.data.bio).toBe('Bio without contact details');
    expect(profileRes.data.dob).toBe('2001-08-20');
  });
});
