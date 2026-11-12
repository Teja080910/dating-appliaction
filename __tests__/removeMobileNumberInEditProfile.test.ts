import { mockStore } from '../src/mock/mockStore';
import apiClient from '../src/api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Remove Mobile Number in Edit Profile', () => {
  beforeEach(async () => {
    await mockStore.init();
  });

  it('clears mobile number from database and profile when saved with empty phone', async () => {
    // 1. Initial state: Rahul has a phone number
    await mockStore.saveProfile({
      userId: 'usr_man_101',
      mobile: '+91 9999999999',
    });
    const initialProfile = await mockStore.getProfileByUserId('usr_man_101');
    expect(initialProfile?.mobile).toBe('+91 9999999999');

    // 2. Client removes mobile number and calls PUT /profile/update with mobile: ""
    const updateRes = await apiClient.put('/profile/update', {
      userId: 'usr_man_101',
      displayName: 'Rahul Sharma',
      mobile: '',
      phoneNumber: '',
    });

    expect(updateRes.status).toBe(200);

    // 3. Fetch profile again from database
    const updatedProfile = await mockStore.getProfileByUserId('usr_man_101');
    expect(updatedProfile?.mobile).toBe('');
    expect((updatedProfile as any)?.phone).toBe('');
    expect((updatedProfile as any)?.phoneNumber).toBe('');
    expect((updatedProfile as any)?.mobileNumber).toBe('');

    // 4. Also verify user record is cleared
    const user = await mockStore.findUserById('usr_man_101');
    expect(user?.mobile).toBe('');
  });

  it('updates phone number when a new valid number is provided', async () => {
    const updateRes = await apiClient.put('/profile/update', {
      userId: 'usr_man_101',
      displayName: 'Rahul Sharma',
      mobile: '+91 9876543210',
    });

    expect(updateRes.status).toBe(200);

    const updatedProfile = await mockStore.getProfileByUserId('usr_man_101');
    expect(updatedProfile?.mobile).toBe('+91 9876543210');
  });
});
