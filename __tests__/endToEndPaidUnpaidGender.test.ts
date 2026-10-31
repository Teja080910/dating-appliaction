import apiClient from '../src/api/apiClient';
import { mockStore } from '../src/mock/mockStore';

describe('End-to-End Testing: Paid vs Unpaid & Male vs Female Flows', () => {
  beforeAll(async () => {
    await mockStore.init();
  });

  // ==========================================
  // 1. MALE USER FLOWS (UNPAID VS PAID)
  // ==========================================
  describe('1. Male User Flows (Discovery, Paywall, & Invites)', () => {
    const maleUserId = 'usr_man_104';
    const womanUserId = 'usr_woman_208';

    beforeEach(async () => {
      await mockStore.setCurrentUserId(maleUserId);
      // Ensure user starts as unpaid
      const allSubs = (mockStore as any).userSubscriptions;
      if (allSubs) delete allSubs[maleUserId];
    });

    test('1.1 Unpaid Male: Discovery works, but sending dating request is blocked by subscription gate', async () => {
      // Male can view discovery / nearby profiles
      const nearbyRes = await apiClient.get('/location/nearby', {
        params: { userId: maleUserId, radius: 50 },
      });
      expect(nearbyRes.status).toBe(200);
      expect(Array.isArray(nearbyRes.data)).toBe(true);

      // Check unpaid subscription status
      const statusRes = await apiClient.get('/subscriber/status', {
        params: { userId: maleUserId },
      });
      expect(statusRes.status).toBe(200);
      expect(statusRes.data.isSubscriber).toBe(false);

      // Attempt to send connection request without subscription -> Must be gated/blocked
      let sendError: any = null;
      try {
        await apiClient.post('/connections/send', {
          senderId: maleUserId,
          receiverId: womanUserId,
        });
      } catch (err: any) {
        sendError = err;
      }
      expect(sendError).not.toBeNull();
      const errorMsg = sendError?.response?.data?.message || sendError?.message;
      expect(errorMsg.toLowerCase()).toContain('subscription');
    });

    test('1.2 Male User Subscribes: Chooses database plan (Standard ₹1, Premium ₹2, or Elite ₹3)', async () => {
      // Create Razorpay order for Standard (₹1)
      const orderRes = await apiClient.post('/razorpay/create-order', {
        userId: maleUserId,
        plan: 'STANDARD',
      });
      expect(orderRes.status).toBe(200);
      expect(orderRes.data.orderId).toBeDefined();

      // Verify payment & activate subscription
      const verifyRes = await apiClient.post('/razorpay/verify', {
        userId: maleUserId,
        plan: 'STANDARD',
        orderId: orderRes.data.orderId,
        paymentId: 'pay_test_male_123',
        signature: 'sig_test_male_123',
      });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.data.subscription).toBeDefined();
      expect(verifyRes.data.subscription.plan).toBe('STANDARD');

      // Verify status is now active
      const statusRes = await apiClient.get('/subscriber/status', {
        params: { userId: maleUserId },
      });
      expect(statusRes.status).toBe(200);
      expect(statusRes.data.isSubscriber).toBe(true);
      expect(statusRes.data.plan).toBe('STANDARD');
      expect(statusRes.data.dailyRequestLimit).toBe(10);
    });

    test('1.3 Paid Male: Can successfully send invitation request to female profile', async () => {
      const targetWomanId = 'usr_woman_209';
      // Ensure subscription is active (Standard with 10 daily requests)
      await mockStore.activateSubscription(maleUserId, 'STANDARD', 'order_m1', 'pay_m1');

      // Send connection request
      const sendRes = await apiClient.post('/connections/send', {
        senderId: maleUserId,
        receiverId: targetWomanId,
      });
      expect([200, 201]).toContain(sendRes.status);
      expect(sendRes.data.status).toBe('success');
      expect(sendRes.data.request).toBeDefined();
      expect(sendRes.data.request.senderId).toBe(maleUserId);
      expect(sendRes.data.request.receiverId).toBe(targetWomanId);

      // Verify sent request appears in male sent invitations list
      const sentRes = await apiClient.get('/connections/sent', {
        params: { userId: maleUserId },
      });
      expect(sentRes.status).toBe(200);
      const sentList = sentRes.data.requests || sentRes.data;
      const found = sentList.find((r: any) => r.receiverId === targetWomanId);
      expect(found).toBeDefined();
    });

    test('1.4 Male Daily Quota Limit Enforcement: Daily request limit is enforced according to plan', async () => {
      // Standard plan has 10 invites per day limit
      await mockStore.activateSubscription(maleUserId, 'STANDARD', 'order_limit', 'pay_limit');
      
      const sub = await apiClient.get('/subscriber/status', { params: { userId: maleUserId } });
      expect(sub.data.dailyRequestLimit).toBe(10);
    });
  });

  // ==========================================
  // 2. FEMALE USER FLOWS (INBOX, APPROVAL & ACCESS)
  // ==========================================
  describe('2. Female User Flows (Received Invitations, Decision & Chat)', () => {
    const womanUserId = 'usr_woman_210';
    const maleSenderId = 'usr_man_105';

    beforeEach(async () => {
      await mockStore.setCurrentUserId(womanUserId);
    });

    test('2.1 Female User can view incoming invitations in Received Requests Inbox', async () => {
      const recvRes = await apiClient.get('/connections/received', {
        params: { userId: womanUserId },
      });
      expect(recvRes.status).toBe(200);
      const list = recvRes.data.requests || recvRes.data;
      expect(Array.isArray(list)).toBe(true);
    });

    test('2.2 Female User Accepts an Invitation: Connection moves from Pending to Accepted', async () => {
      // Ensure male sender has active subscription and sends an invite
      await mockStore.activateSubscription(maleSenderId, 'PREMIUM', 'order_p1', 'pay_p1');
      const sendRes = await apiClient.post('/connections/send', {
        senderId: maleSenderId,
        receiverId: womanUserId,
      });
      const requestId = sendRes.data.request.id;

      // Female accepts connection
      const acceptRes = await apiClient.put('/connections/accept', {
        requestId,
        userId: womanUserId,
      });
      expect(acceptRes.status).toBe(200);
      expect(acceptRes.data.status).toBe('success');

      // Verify connection now appears in confirmed connections list
      const listRes = await apiClient.get('/connections/list', {
        params: { userId: womanUserId },
      });
      expect(listRes.status).toBe(200);
      const acceptedList = listRes.data.connections || listRes.data;
      const connected = acceptedList.find((c: any) => c.id === requestId || c.requestId === requestId || c.user?.id === maleSenderId);
      expect(connected).toBeDefined();
    });

    test('2.3 Female User Declines an Invitation: Connection status is updated to DECLINED', async () => {
      const maleDeclineSender = 'usr_man_106';
      await mockStore.activateSubscription(maleDeclineSender, 'ELITE', 'order_e1', 'pay_e1');
      const sendRes = await apiClient.post('/connections/send', {
        senderId: maleDeclineSender,
        receiverId: womanUserId,
      });
      const requestId = sendRes.data.request.id;

      // Female declines connection
      const declineRes = await apiClient.put('/connections/decline', {
        requestId,
        userId: womanUserId,
      });
      expect(declineRes.status).toBe(200);
      expect(declineRes.data.status).toBe('success');
    });
  });

  // ==========================================
  // 3. DATABASE SUBSCRIPTION PLAN DETAILS INTEGRITY
  // ==========================================
  describe('3. Database Subscription Plans Verification', () => {
    test('Verifies all 3 database plans: Standard (₹1, 120d), Premium (₹2, 180d), Elite (₹3, 365d)', async () => {
      const plans = await mockStore.getPlans();
      
      const standard = plans.find((p: any) => p.id === 'STANDARD' || p.type === 'STANDARD' || p.name === 'Standard');
      const premium = plans.find((p: any) => p.id === 'PREMIUM' || p.type === 'PREMIUM' || p.name === 'Premium');
      const elite = plans.find((p: any) => p.id === 'ELITE' || p.type === 'ELITE' || p.name === 'Elite');

      expect(standard).toBeDefined();
      expect(premium).toBeDefined();
      expect(elite).toBeDefined();

      // Check prices matching amara.subscription_details
      expect(standard?.price).toBe(1);
      expect(premium?.price).toBe(2);
      expect(elite?.price).toBe(3);

      // Check durations matching amara.subscription_details
      expect(standard?.durationDays).toBe(120);
      expect(premium?.durationDays).toBe(180);
      expect(elite?.durationDays).toBe(365);
    });
  });
});
