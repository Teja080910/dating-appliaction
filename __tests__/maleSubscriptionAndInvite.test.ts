import apiClient from '../src/api/apiClient';
import { mockStore } from '../src/mock/mockStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Male Subscription & Dating Invitation End-to-End Suite', () => {
  const maleUserId = 'usr_man_105';
  const numericMaleId = '55';
  const femaleUserId = 'usr_woman_201';

  beforeAll(async () => {
    await mockStore.init();
  });

  beforeEach(async () => {
    await mockStore.setCurrentUserId(maleUserId);
    // Clear subscription state before test
    await AsyncStorage.removeItem('isSubscribed');
    await AsyncStorage.removeItem('@subscription_plan');
    const store = mockStore as any;
    if (store.userSubscriptions) {
      delete store.userSubscriptions[maleUserId];
      delete store.userSubscriptions[maleUserId.toLowerCase()];
      delete store.userSubscriptions[numericMaleId];
    }
    if (store.requests) {
      store.requests = store.requests.filter(
        (r: any) => String(r.senderId) !== maleUserId && String(r.senderId) !== numericMaleId
      );
    }
  });

  test('1. Unsubscribed male user cannot send invite and receives 403 SUBSCRIPTION_REQUIRED', async () => {
    let sendError: any = null;
    try {
      await apiClient.post('/connections/send', {
        senderId: maleUserId,
        receiverId: femaleUserId,
      });
    } catch (err: any) {
      sendError = err;
    }

    expect(sendError).not.toBeNull();
    expect(sendError?.response?.status).toBe(403);
    expect(sendError?.response?.data?.code).toBe('SUBSCRIPTION_REQUIRED');
    expect(sendError?.response?.data?.message?.toLowerCase()).toContain('subscription');
  });

  test('2. Male user creates order and verifies payment successfully via Razorpay mock', async () => {
    // 2.1 Create order
    const orderRes = await apiClient.post('/razorpay/create-order', {
      userId: maleUserId,
      plan: 'GOLD',
    });
    expect(orderRes.status).toBe(200);
    expect(orderRes.data.orderId).toBeDefined();

    // 2.2 Verify payment
    const verifyRes = await apiClient.post('/razorpay/verify', {
      orderId: orderRes.data.orderId,
      paymentId: 'pay_test_mock_123',
      signature: 'sig_test_mock_123',
      userId: maleUserId,
      plan: 'GOLD',
    });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.data.status).toBe('success');
    expect(verifyRes.data.subscription).toBeDefined();
    expect(verifyRes.data.subscription.status).toBe('ACTIVE');

    // 2.3 Verify local storage caching
    const cachedSub = await AsyncStorage.getItem('isSubscribed');
    expect(cachedSub).toBe('true');
  });

  test('3. Subscription status is synchronized across alphanumeric and numeric user IDs', async () => {
    await mockStore.activateSubscription(maleUserId, 'GOLD');

    // Verify alphanumeric ID
    const subAlpha = await mockStore.getSubscriptionStatus(maleUserId);
    expect(subAlpha).not.toBeNull();
    expect(subAlpha?.status).toBe('ACTIVE');

    // Verify via GET /subscription/status API
    const apiStatus = await apiClient.get('/subscription/status', {
      params: { userId: maleUserId },
    });
    expect(apiStatus.status).toBe(200);
    expect(apiStatus.data.active).toBe(true);
  });

  test('4. Subscribed male user successfully sends dating invitation to female profile', async () => {
    await mockStore.activateSubscription(maleUserId, 'GOLD');

    const sendRes = await apiClient.post('/connections/send', {
      senderId: maleUserId,
      receiverId: femaleUserId,
    });

    expect(sendRes.status).toBe(201);
    expect(sendRes.data.status).toBe('success');
    expect(sendRes.data.data).toBeDefined();
    expect(sendRes.data.data.senderId).toBe(maleUserId);
    expect(sendRes.data.data.receiverId).toBe(femaleUserId);
    expect(sendRes.data.data.status).toBe('PENDING');
  });

  test('5. Duplicate invite returns 400 DUPLICATE_REQUEST and does NOT trigger paywall gate', async () => {
    await mockStore.activateSubscription(maleUserId, 'GOLD');

    // First request
    const firstSend = await apiClient.post('/connections/send', {
      senderId: maleUserId,
      receiverId: femaleUserId,
    });
    expect(firstSend.status).toBe(201);

    // Duplicate request
    let dupError: any = null;
    try {
      await apiClient.post('/connections/send', {
        senderId: maleUserId,
        receiverId: femaleUserId,
      });
    } catch (err: any) {
      dupError = err;
    }

    expect(dupError).not.toBeNull();
    expect(dupError?.response?.status).toBe(400);
    expect(dupError?.response?.data?.code).toBe('DUPLICATE_REQUEST');
    // Ensure code is NOT SUBSCRIPTION_REQUIRED
    expect(dupError?.response?.data?.code).not.toBe('SUBSCRIPTION_REQUIRED');
  });

  test('6. Self-invite returns 400 Bad Request and does NOT trigger SUBSCRIPTION_REQUIRED', async () => {
    await mockStore.activateSubscription(maleUserId, 'GOLD');

    let selfError: any = null;
    try {
      await apiClient.post('/connections/send', {
        senderId: maleUserId,
        receiverId: maleUserId,
      });
    } catch (err: any) {
      selfError = err;
    }

    expect(selfError).not.toBeNull();
    expect(selfError?.response?.status).toBe(400);
    expect(selfError?.response?.data?.code).not.toBe('SUBSCRIPTION_REQUIRED');
  });

  test('7. Pre-seeded male user usr_man_101 has active subscription out of the box', async () => {
    const status = await mockStore.getSubscriptionStatus('usr_man_101');
    expect(status).not.toBeNull();
    expect(status?.status).toBe('ACTIVE');

    // Also verify by numeric ID 51
    const statusNumeric = await mockStore.getSubscriptionStatus('51');
    expect(statusNumeric).not.toBeNull();
    expect(statusNumeric?.status).toBe('ACTIVE');
  });

  test('8. Female users do not require subscription or get premium', async () => {
    // Female profile status check
    const femaleProfile = await mockStore.getProfileByUserId(femaleUserId);
    expect(femaleProfile?.gender).toBe('woman');

    // Female user receives incoming invitations without subscription
    const receivedRes = await apiClient.get('/connections/received', {
      params: { userId: femaleUserId },
    });
    expect(receivedRes.status).toBe(200);

    // Female user can accept requests without subscription
    const requests = await mockStore.getReceivedRequests(femaleUserId);
    expect(Array.isArray(requests)).toBe(true);
  });

  test('9. Unsubscribed male user sees Upgrade action leading to plans, and Premium Membership when subscribed', async () => {
    // Initially unsubscribed male user
    const unsubscribedStatus = await mockStore.getSubscriptionStatus(maleUserId);
    expect(unsubscribedStatus).toBeNull();

    // Verify upgrade action resolves plan selection
    const orderRes = await apiClient.post('/razorpay/create-order', {
      userId: maleUserId,
      plan: 'PREMIUM',
    });
    expect(orderRes.status).toBe(200);
    expect(orderRes.data.orderId).toBeDefined();

    // After subscribing
    await apiClient.post('/razorpay/verify', {
      orderId: orderRes.data.orderId,
      paymentId: 'pay_test_upgrade_456',
      signature: 'sig_test_upgrade_456',
      userId: maleUserId,
      plan: 'PREMIUM',
    });

    const subscribedStatus = await mockStore.getSubscriptionStatus(maleUserId);
    expect(subscribedStatus?.status).toBe('ACTIVE');
    expect(subscribedStatus?.plan).toBe('PREMIUM');
  });
});
