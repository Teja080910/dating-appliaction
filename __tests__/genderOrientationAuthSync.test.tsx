import { mockStore } from '../src/mock/mockStore';
import apiClient from '../src/api/apiClient';

describe('Gender Orientation & Auth Account Persistence', () => {
  const femaleEmail = 'ananya.test@gmail.com';
  const femalePassword = 'Password@123';

  beforeEach(async () => {
    await mockStore.init();
    (mockStore as any).initialized = true;
  });

  test('Creating a female account and setting gender orientation preserves woman gender on login', async () => {
    // 1. Create woman user through mock adapter / store
    const user = await mockStore.createUser({
      name: 'Ananya',
      email: femaleEmail,
      password: femalePassword,
      gender: 'woman',
    });

    expect(user.gender).toBe('woman');
    expect(user.userId).toContain('woman');

    // 2. Set profile gender to woman
    await mockStore.saveProfile({
      userId: user.userId,
      name: 'Ananya',
      displayName: 'Ananya',
      gender: 'woman',
    });

    // 3. User logs in via POST /login
    const loginRes = await apiClient.post('/auth/login', {
      email: femaleEmail,
      password: femalePassword,
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.data.user.gender).toBe('woman');
    expect(loginRes.data.user.userId).toBe(user.userId);

    // 4. Check profile retrieved via GET /profile/me
    const profileRes = await apiClient.get(`/profile/me/${user.userId}`);
    expect(profileRes.status).toBe(200);
    expect(profileRes.data.gender).toBe('woman');
  });

  test('Calling POST /profile/gender-orientation updates both profile and user to woman', async () => {
    const user = await mockStore.createUser({
      name: 'Priya',
      email: 'priya.orient@gmail.com',
      password: femalePassword,
    });

    // Update gender orientation
    const res = await apiClient.post('/profile/gender-orientation', {
      userId: user.userId,
      gender: 'woman',
      orientation: 'straight',
    });

    expect(res.status).toBe(200);

    // Profile must be woman
    const profile = await mockStore.getProfileByUserId(user.userId);
    expect(profile?.gender).toBe('woman');

    // Logging in must return woman
    const loginRes = await apiClient.post('/auth/login', {
      email: 'priya.orient@gmail.com',
      password: femalePassword,
    });
    expect(loginRes.data.user.gender).toBe('woman');
  });
});
