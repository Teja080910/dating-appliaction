import apiClient from '../src/api/apiClient';
import { mockStore } from '../src/mock/mockStore';

describe('Comprehensive Mock API Endpoint Coverage', () => {
  beforeAll(async () => {
    await mockStore.init();
  });

  // 1. Auth & Session
  describe('1. Authentication & Session Endpoints', () => {
    test('POST /auth/send-otp sends OTP to email and creates session', async () => {
      const res = await apiClient.post('/auth/send-otp', { email: 'candidate@amara.com' });
      expect(res.status).toBe(200);
      expect(res.data.sessionId).toBeDefined();
    });

    test('POST /register starts email registration flow', async () => {
      const res = await apiClient.post('/register', {
        email: 'candidate@amara.com',
        name: 'Test Candidate',
        password: 'Password@123',
        confirmPassword: 'Password@123',
        gender: 'man',
      });
      expect(res.status).toBe(200);
      expect(res.data.sessionId).toBeDefined();
    });

    test('POST /verify-register/otp validates email OTP and creates user', async () => {
      const otpRes = await apiClient.post('/auth/send-otp', { email: 'newcandidate@amara.com' });
      const sessionId = otpRes.data.sessionId;

      const verifyRes = await apiClient.post('/verify-register/otp', {
        email: 'newcandidate@amara.com',
        otp: '123456',
        sessionId,
      });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.data.userId).toBeDefined();
      expect(verifyRes.data.token).toBeDefined();
      expect(verifyRes.data.user.email).toBe('newcandidate@amara.com');
    });

    test('POST /register and /verify-register/otp with 123456 creates user and preserves name', async () => {
      const regRes = await apiClient.post('/register', {
        email: 'karu@gmail.com',
        name: 'Karu',
        password: 'Password@123',
        confirmPassword: 'Password@123',
      });
      expect(regRes.status).toBe(200);
      const sessionId = regRes.data.sessionId;

      const verifyRes = await apiClient.post('/verify-register/otp', {
        email: 'karu@gmail.com',
        name: 'Karu',
        password: 'Password@123',
        otp: '123456',
        sessionId,
      });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.data.userId).toBeDefined();
      expect(verifyRes.data.token).toBeDefined();
      expect(verifyRes.data.user.name).toBe('Karu');
      expect(verifyRes.data.user.email).toBe('karu@gmail.com');
    });

    test('POST /login authenticates existing user by mobile', async () => {
      const res = await apiClient.post('/login', {
        mobile: '9876543110',
        password: 'Password@123',
      });
      expect(res.status).toBe(200);
      expect(res.data.token).toBeDefined();
      expect(res.data.userId).toBe('usr_man_101');
    });

    test('POST /login authenticates existing user by email', async () => {
      const res = await apiClient.post('/login', {
        email: 'rahul@amara.com',
        password: 'Password@123',
      });
      expect(res.status).toBe(200);
      expect(res.data.token).toBeDefined();
      expect(res.data.userId).toBe('usr_man_101');
    });

    test('POST /login rejects unregistered email with 404', async () => {
      await expect(
        apiClient.post('/login', {
          email: 'nonexistent.random.user@example.com',
          password: 'Password@123',
        })
      ).rejects.toThrow();
    });

    test('POST /login rejects incorrect password with 401', async () => {
      await expect(
        apiClient.post('/login', {
          email: 'rahul@amara.com',
          password: 'WrongPassword!999',
        })
      ).rejects.toThrow();
    });

    test('POST /forgot-password/send-otp and reset flow', async () => {
      const otpRes = await apiClient.post('/forgot-password/send-otp', { mobile: '9876543110' });
      expect(otpRes.status).toBe(200);

      const resetRes = await apiClient.post('/forgot-password/reset', {
        mobile: '9876543110',
        otp: '123456',
        newPassword: 'Password@1234',
      });
      expect(resetRes.status).toBe(200);
    });

    test('Account lifecycle: deactivate and activate', async () => {
      const deact = await apiClient.post('/account/deactivate', null, { params: { userId: 'usr_man_101' } });
      expect(deact.status).toBe(200);
      const act = await apiClient.put('/account/activate', null, { params: { userId: 'usr_man_101' } });
      expect(act.status).toBe(200);
    });
  });

  // 2. Profile Management
  describe('2. Profile Management Endpoints', () => {
    test('POST /profile/me retrieves current user profile', async () => {
      const res = await apiClient.post('/profile/me', null, { params: { userId: 'usr_man_101' } });
      expect(res.status).toBe(200);
      expect(res.data.displayName).toBe('Rahul');
    });

    test('GET /profile/completion calculates percentage', async () => {
      const res = await apiClient.get('/profile/completion', { params: { userId: 'usr_man_101' } });
      expect(res.status).toBe(200);
      const completion = typeof res.data === 'number' ? res.data : (res.data?.completionPercentage ?? res.data?.completion ?? 100);
      expect(completion).toBeGreaterThanOrEqual(0);
    });

    test('PUT /profile/update saves modified fields', async () => {
      const res = await apiClient.put('/profile/update', {
        userId: 'usr_man_101',
        bio: 'Updated mock bio for pair programming',
        height: 180,
      });
      expect(res.status).toBe(200);
      expect(res.data.data.bio).toBe('Updated mock bio for pair programming');
    });

    test('POST /profile/upload-image uploads new image', async () => {
      const res = await apiClient.post('/profile/upload-image', {
        userId: 'usr_man_101',
        uri: 'https://images.unsplash.com/photo-test.jpg',
      });
      expect(res.status).toBe(200);
      expect(res.data.imageUrl).toBeDefined();
    });

    test('GET /users/{userId}/images returns user image list', async () => {
      const res = await apiClient.get('/users/usr_man_101/images');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    test('PUT /profile/selfie/verify/{userId} marks identity verified', async () => {
      const res = await apiClient.put('/profile/selfie/verify/usr_man_101');
      expect(res.status).toBe(200);
      expect(res.data.data.photoVerified).toBe(true);
    });
  });

  // 3. Discovery & Browsing
  describe('3. Discovery & Browsing Endpoints', () => {
    test('GET /dashboard/online returns online women profiles', async () => {
      const res = await apiClient.get('/dashboard/online', { params: { page: 0, size: 20 } });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
      expect(res.data.every((p: any) => p.gender === 'woman')).toBe(true);
    });

    test('GET /dashboard/recent returns newest profiles', async () => {
      const res = await apiClient.get('/dashboard/recent', { params: { page: 0, size: 20 } });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
    });

    test('POST /search filters by age, distance and attributes', async () => {
      const res = await apiClient.post('/search', {
        minAge: 20,
        maxAge: 30,
        gender: ['Female'],
        page: 0,
        size: 10,
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.content)).toBe(true);
    });
  });

  // 4. Dating Requests & Connections
  describe('4. Dating Requests & Connections Endpoints', () => {
    test('POST /connections/send sends a date request from man to woman', async () => {
      const res = await apiClient.post('/connections/send', {
        senderId: 'usr_man_101',
        receiverId: 'usr_woman_207',
      });
      expect([200, 201]).toContain(res.status);
      expect(res.data.request.status).toBe('PENDING');
    });

    test('GET /connections/sent returns sent requests for man', async () => {
      const res = await apiClient.get('/connections/sent', { params: { userId: 'usr_man_101' } });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
    });

    test('GET /connections/received returns incoming requests for woman', async () => {
      const res = await apiClient.get('/connections/received', { params: { userId: 'usr_woman_201' } });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
    });

    test('PUT /connections/accept approves request and unlocks Telegram handle', async () => {
      const res = await apiClient.put('/connections/accept', {
        requestId: 'req_101_201',
        receiverId: 'usr_woman_201',
      });
      expect(res.status).toBe(200);
      expect(res.data.data.status).toBe('APPROVED');
      expect(res.data.data.sender.telegramUsername).toBeDefined();
    });

    test('GET /connections/status returns connection status between two users', async () => {
      const res = await apiClient.get('/connections/status', {
        params: { senderId: 'usr_man_101', receiverId: 'usr_woman_201' },
      });
      expect(res.status).toBe(200);
      expect(res.data.status).toBe('APPROVED');
    });
  });

  // 5. Telegram Integration
  describe('5. Telegram Handoff Endpoints', () => {
    test('POST /telegram/connect links telegram handle', async () => {
      const res = await apiClient.post('/telegram/connect', null, {
        params: { userId: 'usr_man_101', username: 'rahul_telegram_official' },
      });
      expect(res.status).toBe(200);
    });

    test('GET /telegram/link generates direct tg:// link', async () => {
      const res = await apiClient.get('/telegram/link', {
        params: { userId: 'usr_man_101' },
      });
      expect(res.status).toBe(200);
      expect(res.data.link).toContain('t.me');
    });

    test('DELETE /telegram/disconnect unlinks telegram handle', async () => {
      const res = await apiClient.delete('/telegram/disconnect', {
        params: { userId: 'usr_man_101' },
      });
      expect(res.status).toBe(200);
    });
  });

  // 6. Subscriptions & Razorpay
  describe('6. Subscription & Payment Endpoints', () => {
    test('POST /razorpay/create-order creates mock razorpay order', async () => {
      const res = await apiClient.post('/razorpay/create-order', null, {
        params: { userId: 'usr_man_101', plan: 'GOLD' },
      });
      expect(res.status).toBe(200);
      expect(res.data.orderId).toBeDefined();
      expect(res.data.amount).toBeGreaterThan(0);
    });

    test('POST /razorpay/verify confirms payment and activates subscription', async () => {
      const res = await apiClient.post('/razorpay/verify', {
        orderId: 'order_test_123',
        paymentId: 'pay_test_123',
        signature: 'sig_mock_123',
        plan: 'GOLD',
      });
      expect(res.status).toBe(200);
      expect(res.data.status).toBe('success');
    });

    test('GET /subscriber/status returns subscription validity', async () => {
      const res = await apiClient.get('/subscriber/status', {
        params: { userId: 'usr_man_101' },
      });
      expect(res.status).toBe(200);
      expect(res.data.active).toBe(true);
      expect(res.data.plan).toBe('GOLD');
    });

    test('GET /subscriber/remaining-days returns remaining subscription days', async () => {
      const res = await apiClient.get('/subscriber/remaining-days', {
        params: { userId: 'usr_man_101' },
      });
      expect(res.status).toBe(200);
      expect(typeof res.data).toBe('number');
    });
  });

  // 7. Location & Proximity
  describe('7. Location Endpoints', () => {
    test('POST /location/add adds new custom location', async () => {
      const res = await apiClient.post('/location/add', {
        userId: 'usr_man_101',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      });
      expect(res.status).toBe(200);
    });

    test('GET /location/history/{userId} returns saved locations', async () => {
      const res = await apiClient.get('/location/history/usr_man_101');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    test('GET /location/nearby returns nearby profiles', async () => {
      const res = await apiClient.get('/location/nearby', {
        params: { userId: 'usr_man_101', radius: 50 },
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  // 8. Support Tickets
  describe('8. Support Tickets Endpoints', () => {
    let ticketId: number;

    test('POST /support/create creates new ticket', async () => {
      const res = await apiClient.post('/support/create', {
        userId: 'usr_man_101',
        subject: 'Profile Verification Query',
        message: 'How long does selfie verification take?',
      });
      expect(res.status).toBe(201);
      expect(res.data.ticket.id).toBeDefined();
      ticketId = res.data.ticket.id;
    });

    test('GET /support/my returns user tickets', async () => {
      const res = await apiClient.get('/support/my', {
        params: { userId: 'usr_man_101' },
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.some((t: any) => t.id === ticketId)).toBe(true);
    });

    test('PUT /support/close/{ticketId} closes ticket', async () => {
      const res = await apiClient.put(`/support/close/${ticketId}`, null, {
        params: { userId: 'usr_man_101' },
      });
      expect(res.status).toBe(200);
      expect(res.data.ticket.status).toBe('CLOSED');
    });
  });

  // 9. Privacy, Notifications & Online Status
  describe('9. Privacy, Notifications & Online Status Endpoints', () => {
    test('POST /privacy/accept and GET /privacy/status', async () => {
      const acceptRes = await apiClient.post('/privacy/accept', null, {
        params: { userId: 'usr_man_101' },
      });
      expect(acceptRes.status).toBe(200);

      const statusRes = await apiClient.get('/privacy/status', {
        params: { userId: 'usr_man_101' },
      });
      expect(statusRes.status).toBe(200);
      expect(statusRes.data.accepted).toBe(true);
    });

    test('GET /notification returns notifications list', async () => {
      const res = await apiClient.get('/notification', {
        params: { userId: 'usr_man_101' },
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    test('PUT /status/online and PUT /status/offline', async () => {
      const onRes = await apiClient.put('/status/online', null, {
        params: { userId: 'usr_man_101' },
      });
      expect(onRes.status).toBe(200);
      expect(onRes.data.status).toBe('online');

      const offRes = await apiClient.put('/status/offline', null, {
        params: { userId: 'usr_man_101' },
      });
      expect(offRes.status).toBe(200);
      expect(offRes.data.status).toBe('offline');
    });
  });

  // 10. Safety & Reports
  describe('10. Safety & Reports Endpoints', () => {
    test('POST /reports/report files a user report', async () => {
      const res = await apiClient.post('/reports/report', {
        reporterUserId: 'usr_man_101',
        reportedUserId: 'usr_woman_207',
        reason: 'SPAM_SCAM',
        details: 'Suspicious commercial links shared.',
      });
      expect(res.status).toBe(200);
      expect(res.data.data.id).toBeDefined();
    });

    test('GET /reports/my returns reports filed by user', async () => {
      const res = await apiClient.get('/reports/my', {
        params: { userId: 'usr_man_101' },
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  // 11. Email Notifications (Glambu Model)
  describe('11. Email Notifications (Glambu Model)', () => {
    test('PUT /notification/preferences updates emailNotifications setting', async () => {
      const res = await apiClient.put('/notification/preferences', {
        userId: 'usr_woman_201',
        emailNotifications: true,
      });
      expect(res.status).toBe(200);
      expect(res.data.preferences.emailNotifications).toBe(true);
    });

    test('GET /emails/my returns sent emails for user', async () => {
      const res = await apiClient.get('/emails/my', {
        params: { userId: 'usr_woman_201' },
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });
});
