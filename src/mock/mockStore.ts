import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  mockData,
  MockUser,
  MockProfile,
  MockRequest,
  MockSubscriptionPlan,
  MockUserSubscription,
} from './data';

const USERS_KEY = '@amara_mock_users';
const PROFILES_KEY = '@amara_mock_profiles';
const REQUESTS_KEY = '@amara_mock_requests';
const SUBSCRIPTIONS_KEY = '@amara_mock_subscriptions';
const IMAGES_KEY = '@amara_mock_images';
const CURRENT_USER_ID_KEY = '@amara_mock_current_user_id';
const SUPPORT_TICKETS_KEY = '@amara_mock_support_tickets';

export interface MockUserImage {
  id: number;
  userId: string;
  imageUrl: string;
  isProfile: boolean;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface MockSupportTicket {
  id: number;
  userId: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  closedAt?: string;
}

class MockStore {
  private users: MockUser[] = [];
  private profiles: MockProfile[] = [];
  private requests: MockRequest[] = [];
  private plans: MockSubscriptionPlan[] = [];
  private userSubscriptions: Record<string, MockUserSubscription> = {};
  private images: MockUserImage[] = [];
  private otpSessions: Record<string, { otp: string; mobile: string; createdAt: number }> = {};
  private currentUserId: string | null = null;
  private supportTickets: MockSupportTicket[] = [];
  private initialized = false;

  public async init() {
    if (this.initialized) return;

    try {
      const storedUsers = await AsyncStorage.getItem(USERS_KEY);
      this.users = storedUsers ? JSON.parse(storedUsers) : [...mockData.users];

      for (const defaultUser of mockData.users) {
        const existingIdx = this.users.findIndex(
          (u) => String(u.userId) === String(defaultUser.userId) || u.mobile === defaultUser.mobile
        );
        if (existingIdx < 0) {
          this.users.push(defaultUser);
        }
      }
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(this.users));

      const storedProfiles = await AsyncStorage.getItem(PROFILES_KEY);
      this.profiles = storedProfiles ? JSON.parse(storedProfiles) : [...mockData.profiles];

      for (const defaultProfile of mockData.profiles) {
        const existingIdx = this.profiles.findIndex((p) => String(p.userId) === String(defaultProfile.userId));
        if (existingIdx >= 0) {
          if (
            defaultProfile.photos &&
            (!this.profiles[existingIdx].photos ||
              this.profiles[existingIdx].photos.length < 2 ||
              this.profiles[existingIdx].photos.some((ph: string) =>
                ph.includes('1507003211169') || ph.includes('1492562080023')
              ))
          ) {
            this.profiles[existingIdx].photos = [...defaultProfile.photos];
          }
          if (defaultProfile.displayName) {
            this.profiles[existingIdx].displayName = defaultProfile.displayName;
          }
        } else {
          this.profiles.push(defaultProfile);
        }
      }
      this.profiles.forEach((p) => {
        if (p.displayName) {
          p.displayName = p.displayName.replace(/,\s*\d+$/, '').trim();
        }
      });
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(this.profiles));

      const storedRequests = await AsyncStorage.getItem(REQUESTS_KEY);
      this.requests = storedRequests ? JSON.parse(storedRequests) : [...mockData.requests];

      // Sanitize requests to strictly uphold PRD BR-01:
      // Only men can be senders, and only women can be receivers.
      const validRequests = this.requests.filter((r) => {
        const senderGender = r.sender?.gender?.toLowerCase();
        const receiverGender = r.receiver?.gender?.toLowerCase();
        if (senderGender === 'woman' || senderGender === 'female') return false;
        if (receiverGender === 'man' || receiverGender === 'male') return false;
        return true;
      });
      // Also ensure all default mockData.requests exist
      for (const defaultReq of mockData.requests) {
        const matchIdx = validRequests.findIndex((r) => r.id === defaultReq.id);
        if (matchIdx < 0) {
          validRequests.push(defaultReq);
        } else {
          // Sync sender/receiver displayNames
          if (defaultReq.sender?.displayName && validRequests[matchIdx].sender) {
            validRequests[matchIdx].sender.displayName = defaultReq.sender.displayName;
          }
          if (defaultReq.receiver?.displayName && validRequests[matchIdx].receiver) {
            validRequests[matchIdx].receiver.displayName = defaultReq.receiver.displayName;
          }
        }
      }
      validRequests.forEach((r) => {
        if (r.sender?.displayName) {
          r.sender.displayName = r.sender.displayName.replace(/,\s*\d+$/, '').trim();
        }
        if (r.receiver?.displayName) {
          r.receiver.displayName = r.receiver.displayName.replace(/,\s*\d+$/, '').trim();
        }
      });
      this.requests = validRequests;
      await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(this.requests));

      const storedSubscriptions = await AsyncStorage.getItem(SUBSCRIPTIONS_KEY);
      const parsedSubs = storedSubscriptions ? JSON.parse(storedSubscriptions) : {};
      this.userSubscriptions = {
        ...mockData.subscriptions.userSubscriptions,
        ...parsedSubs,
      };

      const storedImages = await AsyncStorage.getItem(IMAGES_KEY);
      this.images = storedImages ? JSON.parse(storedImages) : [];

      const storedSupportTickets = await AsyncStorage.getItem(SUPPORT_TICKETS_KEY);
      this.supportTickets = storedSupportTickets ? JSON.parse(storedSupportTickets) : [];

      this.plans = [...mockData.subscriptions.plans];
      this.initialized = true;
    } catch (e) {
      console.warn('[MockStore] Failed to load mock storage, using in-memory fallbacks', e);
      this.users = [...mockData.users];
      this.profiles = [...mockData.profiles];
      this.requests = [...mockData.requests];
      this.plans = [...mockData.subscriptions.plans];
      this.userSubscriptions = { ...mockData.subscriptions.userSubscriptions };
      this.images = [];
      this.supportTickets = [];
      this.initialized = true;
    }
  }

  // --- Users & Auth ---
  public async getCurrentUserId(): Promise<string> {
    await this.init();
    if (this.currentUserId) return this.currentUserId;
    try {
      const stored = await AsyncStorage.getItem(CURRENT_USER_ID_KEY);
      if (stored) {
        this.currentUserId = stored;
        return stored;
      }
    } catch {}
    return 'usr_man_101';
  }

  public async setCurrentUserId(userId: string): Promise<void> {
    this.currentUserId = userId;
    try {
      await AsyncStorage.setItem(CURRENT_USER_ID_KEY, userId);
    } catch {}
  }

  public async getUsers(): Promise<MockUser[]> {
    await this.init();
    return this.users;
  }

  public async findUserByMobile(mobile: string): Promise<MockUser | undefined> {
    await this.init();
    const cleanMobile = String(mobile).replace(/\D/g, '');
    return this.users.find((u) => u.mobile.replace(/\D/g, '') === cleanMobile);
  }

  public async findUserById(userId: string): Promise<MockUser | undefined> {
    await this.init();
    return this.users.find((u) => String(u.userId) === String(userId) || String(u.id) === String(userId));
  }

  public async createUser(userData: Partial<MockUser>): Promise<MockUser> {
    await this.init();
    const id = this.users.length ? Math.max(...this.users.map((u) => u.id)) + 1 : 1;
    const userId = userData.userId || `usr_${userData.gender === 'woman' ? 'woman' : 'man'}_${100 + id}`;
    const newUser: MockUser = {
      id,
      userId,
      name: userData.name || 'New User',
      mobile: userData.mobile || '',
      password: userData.password || '',
      gender: userData.gender || 'man',
      telegramUsername: userData.telegramUsername || '',
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    return newUser;
  }

  // --- OTP Management ---
  public createOtp(mobile: string, customOtp = '123456'): { otp: string; sessionId: string } {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.otpSessions[sessionId] = {
      otp: customOtp,
      mobile,
      createdAt: Date.now(),
    };
    // Also track by mobile directly
    this.otpSessions[mobile] = {
      otp: customOtp,
      mobile,
      createdAt: Date.now(),
    };
    return { otp: customOtp, sessionId };
  }

  public verifyOtp(mobile: string, otp: string, sessionId?: string): boolean {
    // In mock mode, allow standard test OTP '123456' or session OTP
    if (otp === '123456' || otp === '000000') return true;
    if (sessionId && this.otpSessions[sessionId]?.otp === otp) return true;
    if (this.otpSessions[mobile]?.otp === otp) return true;
    return false;
  }

  // --- Profiles ---
  public async getProfiles(genderFilter?: string): Promise<MockProfile[]> {
    await this.init();
    let list = this.profiles;
    if (genderFilter) {
      const target = genderFilter.toLowerCase();
      if (target.includes('woman') || target.includes('female')) {
        list = this.profiles.filter((p) => p.gender === 'woman');
      } else if (target.includes('man') || target.includes('male')) {
        list = this.profiles.filter((p) => p.gender === 'man');
      }
    }
    return list.map((p, index) => ({
      ...p,
      id: p.id || (p.gender === 'woman' ? 201 + index : 101 + index),
      online: p.online !== undefined ? p.online : true,
      currentCity: p.currentCity || (p as any).city || (p.gender === 'woman' ? 'Mumbai' : 'Delhi'),
    }));
  }

  public async getProfileByUserId(userId: string): Promise<MockProfile | undefined> {
    await this.init();
    const cleanId = String(userId || '').trim().toLowerCase();
    if (!cleanId) return undefined;

    // Check profiles first - match exact userId, numeric id, or suffix (e.g. '201' -> 'usr_woman_201')
    const profile = this.profiles.find((p) => {
      const pUserId = String(p.userId || '').toLowerCase();
      const pId = String((p as any).id || '').toLowerCase();
      return (
        pUserId === cleanId ||
        pId === cleanId ||
        (cleanId.length >= 3 && pUserId.endsWith(cleanId)) ||
        (pUserId.length >= 3 && cleanId.endsWith(pUserId))
      );
    });
    if (profile) {
      return {
        ...profile,
        id: profile.id || (profile.gender === 'woman' ? 201 : 101),
        online: profile.online !== undefined ? profile.online : true,
        currentCity: profile.currentCity || (profile as any).city || (profile.gender === 'woman' ? 'Mumbai' : 'Delhi'),
      };
    }

    // Fallback to user account
    const user = await this.findUserById(userId);
    if (user) {
      const isWoman = user.gender === 'woman' || cleanId.includes('woman') || cleanId.startsWith('2');
      return {
        userId: user.userId,
        name: user.name,
        displayName: `${user.name}, 24`,
        age: 24,
        gender: isWoman ? 'woman' : 'man',
        bio: 'Welcome to my profile!',
        photos: isWoman
          ? [
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
            ]
          : [
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
            ],
        telegramUsername: user.telegramUsername || '',
      };
    }
    return undefined;
  }

  public async saveProfile(profileData: Partial<MockProfile>): Promise<MockProfile> {
    await this.init();
    const userId = String(profileData.userId);
    const existingIndex = this.profiles.findIndex((p) => String(p.userId) === userId);

    let updated: MockProfile;
    if (existingIndex >= 0) {
      updated = {
        ...this.profiles[existingIndex],
        ...profileData,
        userId,
      };
      this.profiles[existingIndex] = updated;
    } else {
      updated = {
        userId,
        displayName: profileData.displayName || `${profileData.name || 'User'}, ${profileData.age || 21}`,
        name: profileData.name || 'User',
        age: profileData.age || 21,
        dob: profileData.dob || '2000-01-01',
        gender: profileData.gender || 'woman',
        bio: profileData.bio || '',
        photos: profileData.photos || [
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80',
        ],
        telegramUsername: profileData.telegramUsername || '',
      };
      this.profiles.push(updated);
    }

    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(this.profiles));
    return updated;
  }

  // --- User Images ---
  public async getUserImages(userId: string): Promise<MockUserImage[]> {
    await this.init();
    return this.images.filter((img) => String(img.userId) === String(userId));
  }

  public async addUserImage(userId: string, imageUrl: string, isProfile = false): Promise<MockUserImage> {
    await this.init();
    const id = this.images.length ? Math.max(...this.images.map((i) => i.id)) + 1 : 1;
    const newImage: MockUserImage = {
      id,
      userId: String(userId),
      imageUrl,
      isProfile,
      fileName: `image_${id}.jpg`,
      fileType: 'image/jpeg',
      fileSize: 102400,
      uploadedAt: new Date().toISOString(),
    };
    this.images.push(newImage);
    await AsyncStorage.setItem(IMAGES_KEY, JSON.stringify(this.images));

    // Also sync with profile photos array
    const profile = await this.getProfileByUserId(userId);
    if (profile) {
      if (!profile.photos) profile.photos = [];
      profile.photos.push(imageUrl);
      await this.saveProfile(profile);
    }

    return newImage;
  }

  public async setProfilePhoto(userId: string, imageId: number): Promise<boolean> {
    await this.init();
    let updated = false;
    for (const img of this.images) {
      if (String(img.userId) === String(userId)) {
        if (img.id === imageId) {
          img.isProfile = true;
          updated = true;
        } else {
          img.isProfile = false;
        }
      }
    }
    if (updated) {
      await AsyncStorage.setItem(IMAGES_KEY, JSON.stringify(this.images));
    }
    return updated;
  }

  public async deleteUserImage(imageId: number): Promise<boolean> {
    await this.init();
    const index = this.images.findIndex((i) => i.id === imageId);
    if (index >= 0) {
      this.images.splice(index, 1);
      await AsyncStorage.setItem(IMAGES_KEY, JSON.stringify(this.images));
      return true;
    }
    return false;
  }

  // --- Connections & Dating Requests ---
  public async getRequests(): Promise<MockRequest[]> {
    await this.init();
    return this.requests;
  }

  public async getSentRequests(userId: string): Promise<MockRequest[]> {
    await this.init();
    return this.requests
      .filter((r) => String(r.senderId) === String(userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r) => {
        if (r.status !== 'APPROVED') {
          return {
            ...r,
            sender: r.sender ? { ...r.sender, telegramUsername: '' } : undefined,
            receiver: r.receiver ? { ...r.receiver, telegramUsername: '' } : undefined,
          };
        }
        return r;
      });
  }

  public async getReceivedRequests(userId: string): Promise<MockRequest[]> {
    await this.init();
    return this.requests
      .filter((r) => String(r.receiverId) === String(userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r) => {
        if (r.status !== 'APPROVED') {
          return {
            ...r,
            sender: r.sender ? { ...r.sender, telegramUsername: '' } : undefined,
            receiver: r.receiver ? { ...r.receiver, telegramUsername: '' } : undefined,
          };
        }
        return r;
      });
  }

  public async getRequestStatus(user1: string, user2: string): Promise<'NONE' | 'PENDING' | 'APPROVED'> {
    await this.init();
    const req = this.requests.find(
      (r) =>
        (String(r.senderId) === String(user1) && String(r.receiverId) === String(user2)) ||
        (String(r.senderId) === String(user2) && String(r.receiverId) === String(user1))
    );
    return req ? req.status : 'NONE';
  }

  public async getConnectionStatus(user1: string, user2: string): Promise<'NONE' | 'PENDING' | 'APPROVED'> {
    return this.getRequestStatus(user1, user2);
  }

  public async sendRequest(senderId: string, receiverId: string): Promise<MockRequest> {
    await this.init();

    const senderProfile = await this.getProfileByUserId(senderId);
    if (!senderProfile || !senderProfile.displayName || !senderProfile.dob || !senderProfile.gender || (senderProfile.photos || []).filter(Boolean).length < 2) {
      throw new Error('Profile must be complete with name, DOB, gender, and at least 2 photos before sending requests.');
    }

    const subscription = await this.getSubscriptionStatus(senderId);
    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new Error('An active subscription is required to send dating requests.');
    }

    const dailyLimit = subscription.plan === 'BASIC' ? 10 : subscription.plan === 'GOLD' ? 20 : Infinity;
    if (Number.isFinite(dailyLimit)) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const sentToday = this.requests.filter(
        (request) => String(request.senderId) === String(senderId) && new Date(request.createdAt).getTime() >= startOfDay.getTime(),
      ).length;
      if (sentToday >= dailyLimit) {
        throw new Error(`${subscription.plan} plan daily request limit reached.`);
      }
    }

    // Check duplicate
    const existing = this.requests.find(
      (r) => String(r.senderId) === String(senderId) && String(r.receiverId) === String(receiverId)
    );
    if (existing) {
      throw new Error('A request to this profile has already been sent.');
    }

    const receiverProfile = await this.getProfileByUserId(receiverId);

    const senderGender = senderProfile?.gender?.toLowerCase() || '';
    const receiverGender = receiverProfile?.gender?.toLowerCase() || '';

    if (senderGender === 'woman' || senderGender === 'female') {
      throw new Error('Women cannot send dating requests per BR-01.');
    }
    if (receiverGender === 'man' || receiverGender === 'male') {
      throw new Error('Dating requests can only be sent to women per BR-01.');
    }

    const newRequest: MockRequest = {
      id: `req_${Date.now()}`,
      senderId,
      receiverId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sender: senderProfile,
      receiver: receiverProfile,
    };

    this.requests.unshift(newRequest);
    await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(this.requests));
    return newRequest;
  }

  public async acceptRequest(requestIdOrSenderId?: string | null, receiverId?: string): Promise<MockRequest> {
    await this.init();
    let reqIndex = -1;

    if (requestIdOrSenderId) {
      const searchId = String(requestIdOrSenderId).trim();
      reqIndex = this.requests.findIndex(
        (r) =>
          String(r.id) === searchId ||
          (receiverId && String(r.senderId) === searchId && String(r.receiverId) === String(receiverId))
      );
    }

    // Fallback: If requestId wasn't matched or was null/empty, find the first pending request for the receiver
    if (reqIndex === -1 && receiverId) {
      reqIndex = this.requests.findIndex(
        (r) => String(r.receiverId) === String(receiverId) && r.status === 'PENDING'
      );
    }

    // Fallback: If still not found, check if ANY request matches receiverId
    if (reqIndex === -1 && receiverId) {
      reqIndex = this.requests.findIndex((r) => String(r.receiverId) === String(receiverId));
    }

    if (reqIndex === -1) {
      throw new Error('Connection request not found.');
    }

    const req = this.requests[reqIndex];
    const senderProfile = await this.getProfileByUserId(req.senderId);
    const receiverProfile = await this.getProfileByUserId(req.receiverId);
    const updated: MockRequest = {
      ...req,
      status: 'APPROVED',
      updatedAt: new Date().toISOString(),
      sender: senderProfile || req.sender,
      receiver: receiverProfile || req.receiver,
    };

    this.requests[reqIndex] = updated;
    await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(this.requests));
    return updated;
  }

  public async cancelOrDeclineRequest(requestId: string): Promise<boolean> {
    await this.init();
    const target = String(requestId || '').trim().toLowerCase();
    const index = this.requests.findIndex((r) => {
      const rId = String(r.id || '').trim().toLowerCase();
      const rReceiverId = String(r.receiverId || '').trim().toLowerCase();
      const rReceiverUserId = String(r.receiver?.userId || '').trim().toLowerCase();
      return rId === target || rReceiverId === target || rReceiverUserId === target;
    });
    if (index >= 0) {
      this.requests.splice(index, 1);
      await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(this.requests));
      return true;
    }
    return false;
  }

  // --- Support tickets ---
  public async createSupportTicket(
    userId: string,
    subject: string,
    message: string,
  ): Promise<MockSupportTicket> {
    await this.init();
    const ticket: MockSupportTicket = {
      id: this.supportTickets.length
        ? Math.max(...this.supportTickets.map((item) => item.id)) + 1
        : 1,
      userId: String(userId),
      subject: String(subject || '').trim() || 'Support request',
      message: String(message || '').trim(),
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    this.supportTickets.unshift(ticket);
    await AsyncStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(this.supportTickets));
    return ticket;
  }

  public async getSupportTickets(userId: string, status?: string): Promise<MockSupportTicket[]> {
    await this.init();
    return this.supportTickets.filter((ticket) => {
      const belongsToUser = String(ticket.userId) === String(userId);
      const matchesStatus = !status || ticket.status === String(status).toUpperCase();
      return belongsToUser && matchesStatus;
    });
  }

  public async closeSupportTicket(ticketId: number, userId: string): Promise<MockSupportTicket | null> {
    await this.init();
    const ticket = this.supportTickets.find(
      (item) => item.id === Number(ticketId) && String(item.userId) === String(userId),
    );
    if (!ticket) return null;
    ticket.status = 'CLOSED';
    ticket.closedAt = new Date().toISOString();
    await AsyncStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(this.supportTickets));
    return ticket;
  }

  // --- Subscriptions ---
  public async getPlans(): Promise<MockSubscriptionPlan[]> {
    await this.init();
    return this.plans;
  }

  public async getSubscriptionStatus(userId: string): Promise<MockUserSubscription | null> {
    await this.init();
    const subscription = this.userSubscriptions[userId] || null;
    if (subscription?.endDate && new Date(subscription.endDate).getTime() <= Date.now()) {
      return { ...subscription, status: 'EXPIRED' };
    }
    return subscription;
  }

  public async activateSubscription(
    userId: string,
    planId: string,
    orderId = `order_${Date.now()}`,
    paymentId = `pay_${Date.now()}`
  ): Promise<MockUserSubscription> {
    await this.init();
    const plan = this.plans.find((p) => p.id === planId) || this.plans[0];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (plan.durationMonths || 1));

    const subscription: MockUserSubscription = {
      id: `sub_${Date.now()}`,
      userId,
      plan: plan.id,
      status: 'ACTIVE',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      orderId,
      paymentId,
      amount: plan.price,
      createdAt: new Date().toISOString(),
    };

    this.userSubscriptions[userId] = subscription;
    await AsyncStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(this.userSubscriptions));
    return subscription;
  }

  public async getApprovedConnections(userId: string): Promise<MockRequest[]> {
    await this.init();
    const cleanId = String(userId);
    return this.requests.filter(
      (r) =>
        r.status === 'APPROVED' &&
        (String(r.senderId) === cleanId || String(r.receiverId) === cleanId)
    );
  }

  public async disconnectTelegram(userId: string): Promise<void> {
    await this.init();
    const profile = await this.getProfileByUserId(userId);
    if (profile) {
      profile.telegramUsername = '';
      await this.saveProfile(profile);
    }
    const user = await this.findUserById(userId);
    if (user) {
      user.telegramUsername = '';
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    }
  }

  public async deactivateUser(userId: string): Promise<void> {
    await this.init();
    const user = await this.findUserById(userId);
    if (user) {
      (user as any).isActive = false;
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    }
  }

  public async activateUser(userId: string): Promise<void> {
    await this.init();
    const user = await this.findUserById(userId);
    if (user) {
      (user as any).isActive = true;
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    }
  }

  public async deleteUser(userId: string): Promise<void> {
    await this.init();
    const index = this.users.findIndex((u) => String(u.userId) === String(userId) || String(u.id) === String(userId));
    if (index >= 0) {
      this.users.splice(index, 1);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    }
  }

  public async resetAll(): Promise<void> {
    await AsyncStorage.removeItem(USERS_KEY);
    await AsyncStorage.removeItem(PROFILES_KEY);
    await AsyncStorage.removeItem(REQUESTS_KEY);
    await AsyncStorage.removeItem(SUBSCRIPTIONS_KEY);
    this.initialized = false;
    await this.init();
  }
}

export const mockStore = new MockStore();
