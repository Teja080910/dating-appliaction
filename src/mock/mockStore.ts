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
const NOTIFICATIONS_KEY = '@amara_mock_notifications';
const NOTIFICATION_PREFS_KEY = '@amara_mock_notification_prefs';
const EMAILS_KEY = '@amara_mock_emails';
const BLOCKED_USERS_KEY = '@amara_mock_blocked_users';

export const TEST_USER_KEYWORDS = [
  'user one',
  'user 1',
  'userone',
  'user_one',
  'new amara',
  'new amara user',
  'new amara users',
  'teja',
];

export const isTestUserOrProfile = (entity: any): boolean => {
  if (!entity) return false;
  if (typeof entity === 'string') {
    const s = entity.toLowerCase().trim();
    return TEST_USER_KEYWORDS.some((kw) => s.includes(kw));
  }
  const name = String(entity.name || entity.displayName || '').toLowerCase().trim();
  const email = String(entity.email || '').toLowerCase().trim();
  const mobile = String(entity.mobile || '').toLowerCase().trim();
  const telegram = String(entity.telegramUsername || '').toLowerCase().trim();
  const userId = String(entity.userId || entity.id || '').toLowerCase().trim();

  return TEST_USER_KEYWORDS.some(
    (kw) =>
      name.includes(kw) ||
      email.includes(kw) ||
      mobile.includes(kw) ||
      telegram.includes(kw) ||
      userId.includes(kw)
  );
};

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

export interface MockNotification {
  id: number;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type?: 'MATCH' | 'INVITE' | 'SYSTEM' | 'TELEGRAM';
  createdAt: string;
}

export interface MockNotificationPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  matchAlerts: boolean;
}

export interface MockEmailMessage {
  id: string;
  userId: string;
  toEmail: string;
  subject: string;
  body: string;
  type: 'PENDING_INVITE_REMINDER' | 'WEEKLY_DIGEST' | 'SUBSCRIPTION' | 'SECURITY';
  sentAt: string;
}

class MockStore {
  private users: MockUser[] = [];
  private profiles: MockProfile[] = [];
  private requests: MockRequest[] = [];
  private plans: MockSubscriptionPlan[] = [];
  private userSubscriptions: Record<string, MockUserSubscription> = {};
  private notifications: MockNotification[] = [];
  private notificationPreferences: Record<string, MockNotificationPreferences> = {};
  private emails: MockEmailMessage[] = [];
  private images: MockUserImage[] = [];
  private otpSessions: Record<string, { otp: string; mobile: string; createdAt: number }> = {};
  private currentUserId: string | null = null;
  private supportTickets: MockSupportTicket[] = [];
  private blockedUsers: Record<string, string[]> = {};
  private initialized = false;

  private matchUserId(a?: any, b?: any): boolean {
    if (!a || !b) return false;
    const sa = String(a).toLowerCase().trim();
    const sb = String(b).toLowerCase().trim();
    if (sa === sb) return true;
    const na = sa.replace(/\D/g, '');
    const nb = sb.replace(/\D/g, '');
    return Boolean(na && nb && na === nb);
  }

  public async init() {
    if (this.initialized) return;

    try {
      const storedUsers = await AsyncStorage.getItem(USERS_KEY);
      this.users = storedUsers ? JSON.parse(storedUsers) : [...mockData.users];

      for (const defaultUser of mockData.users) {
        const existingIdx = this.users.findIndex(
          (u) => String(u.userId) === String(defaultUser.userId) || u.mobile === defaultUser.mobile
        );
        if (existingIdx >= 0) {
          this.users[existingIdx] = { ...this.users[existingIdx], ...defaultUser };
        } else {
          this.users.push(defaultUser);
        }
      }
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(this.users));

      const storedProfiles = await AsyncStorage.getItem(PROFILES_KEY);
      this.profiles = storedProfiles ? JSON.parse(storedProfiles) : [...mockData.profiles];

      for (const defaultProfile of mockData.profiles) {
        const existingIdx = this.profiles.findIndex((p) => String(p.userId) === String(defaultProfile.userId));
        if (existingIdx >= 0) {
          const existing = this.profiles[existingIdx];
          const hasUserCustomPhotos = Array.isArray(existing.photos) && existing.photos.some((url: string) => !defaultProfile.photos.includes(url));
          const hasUserDeletedPhotos = Array.isArray(existing.photos) && existing.photos.length < defaultProfile.photos.length;

          this.profiles[existingIdx] = {
            ...defaultProfile,
            ...existing,
            photos: (hasUserCustomPhotos || hasUserDeletedPhotos) ? existing.photos : defaultProfile.photos,
            photo: (hasUserCustomPhotos || hasUserDeletedPhotos) ? (existing.photo || existing.photos?.[0]) : defaultProfile.photo,
          };
          if (hasUserCustomPhotos || hasUserDeletedPhotos) {
            (this.profiles[existingIdx] as any).profileImageUrl = (existing as any).profileImageUrl || existing.photos?.[0];
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
      // Also ensure all default mockData.requests exist without clobbering user-modified statuses (e.g. APPROVED)
      for (const defaultReq of mockData.requests) {
        const matchIdx = validRequests.findIndex((r) => r.id === defaultReq.id);
        if (matchIdx < 0) {
          validRequests.push(defaultReq);
        } else {
          const existing = validRequests[matchIdx];
          validRequests[matchIdx] = {
            ...defaultReq,
            ...existing,
            status: existing.status || defaultReq.status,
            updatedAt: existing.updatedAt || defaultReq.updatedAt,
          };
        }
      }

      // Re-apply any accepted/declined connections from persistent AsyncStorage
      for (const r of validRequests) {
        const reqAccepted = (await AsyncStorage.getItem(`accepted_conn_${r.id}`).catch(() => null)) === 'true';
        const senderAccepted = r.senderId ? (await AsyncStorage.getItem(`accepted_conn_${r.senderId}`).catch(() => null)) === 'true' : false;
        if (reqAccepted || senderAccepted) {
          r.status = 'APPROVED';
        }
        const reqDeclined = (await AsyncStorage.getItem(`declined_conn_${r.id}`).catch(() => null)) === 'true';
        const senderDeclined = r.senderId ? (await AsyncStorage.getItem(`declined_conn_${r.senderId}`).catch(() => null)) === 'true' : false;
        if (reqDeclined || senderDeclined) {
          r.status = 'DECLINED';
        }
      }
      validRequests.forEach((r) => {
        if (r.sender?.displayName) {
          r.sender.displayName = r.sender.displayName.replace(/,\s*\d+$/, '').trim();
        }
        if (r.receiver?.displayName) {
          r.receiver.displayName = r.receiver.displayName.replace(/,\s*\d+$/, '').trim();
        }
        if (r.sender) {
          const sProfile = this.profiles.find((p) => String(p.userId).toLowerCase() === String(r.senderId).toLowerCase());
          if (sProfile?.telegramUsername) {
            r.sender.telegramUsername = sProfile.telegramUsername;
          } else if (r.sender.telegramUsername === 'rahul_amara') {
            r.sender.telegramUsername = '';
          }
        }
        if (r.receiver) {
          const rProfile = this.profiles.find((p) => String(p.userId).toLowerCase() === String(r.receiverId).toLowerCase());
          if (rProfile?.telegramUsername) {
            r.receiver.telegramUsername = rProfile.telegramUsername;
          } else if (r.receiver.telegramUsername === 'ananya_amara') {
            r.receiver.telegramUsername = '';
          }
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

      // Pre-link numeric and alphanumeric keys for seed subscriptions
      for (const [key, sub] of Object.entries(this.userSubscriptions)) {
        if (sub && sub.userId) {
          this.userSubscriptions[sub.userId.toLowerCase()] = sub;
          const u = this.users.find((user) => String(user.userId).toLowerCase() === String(sub.userId).toLowerCase() || String(user.id) === String(sub.userId));
          if (u) {
            if (u.id) this.userSubscriptions[String(u.id)] = sub;
            if (u.userId) {
              this.userSubscriptions[u.userId] = sub;
              this.userSubscriptions[u.userId.toLowerCase()] = sub;
            }
          }
        }
      }

      const storedImages = await AsyncStorage.getItem(IMAGES_KEY);
      this.images = storedImages ? JSON.parse(storedImages) : [];

      const storedSupportTickets = await AsyncStorage.getItem(SUPPORT_TICKETS_KEY);
      this.supportTickets = storedSupportTickets ? JSON.parse(storedSupportTickets) : [];

      const storedNotifications = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      this.notifications = storedNotifications
        ? JSON.parse(storedNotifications)
        : [
            {
              id: 1,
              userId: 'usr_man_101',
              title: 'Welcome to AMARA',
              message: 'Your profile has been created successfully.',
              read: false,
              type: 'SYSTEM',
              createdAt: new Date().toISOString(),
            },
          ];

      const storedPrefs = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      this.notificationPreferences = storedPrefs ? JSON.parse(storedPrefs) : {};

      const storedEmails = await AsyncStorage.getItem(EMAILS_KEY);
      this.emails = storedEmails ? JSON.parse(storedEmails) : [];

      const storedBlocked = await AsyncStorage.getItem(BLOCKED_USERS_KEY);
      this.blockedUsers = storedBlocked ? JSON.parse(storedBlocked) : {};

      this.plans = [...mockData.subscriptions.plans];
      await this.purgeTestUsers();
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
      this.blockedUsers = {};
      this.notifications = [
        {
          id: 1,
          userId: 'usr_man_101',
          title: 'Welcome to AMARA',
          message: 'Your profile has been created successfully.',
          read: false,
          type: 'SYSTEM',
          createdAt: new Date().toISOString(),
        },
      ];
      this.notificationPreferences = {};
      this.emails = [];
      this.initialized = true;
    }
  }

  public async purgeTestUsers(): Promise<void> {
    const testUserIds = new Set<string>();

    this.users.forEach((u) => {
      if (isTestUserOrProfile(u)) {
        if (u.userId) testUserIds.add(String(u.userId));
        if (u.id) testUserIds.add(String(u.id));
      }
    });

    this.profiles.forEach((p) => {
      if (isTestUserOrProfile(p)) {
        if (p.userId) testUserIds.add(String(p.userId));
        if (p.id) testUserIds.add(String(p.id));
      }
    });

    if (testUserIds.size > 0) {
      this.users = this.users.filter(
        (u) => !testUserIds.has(String(u.userId)) && !testUserIds.has(String(u.id)) && !isTestUserOrProfile(u)
      );
      this.profiles = this.profiles.filter(
        (p) => !testUserIds.has(String(p.userId)) && !testUserIds.has(String(p.id)) && !isTestUserOrProfile(p)
      );
      this.requests = this.requests.filter(
        (r) =>
          !testUserIds.has(String(r.senderId)) &&
          !testUserIds.has(String(r.receiverId)) &&
          !isTestUserOrProfile(r.sender) &&
          !isTestUserOrProfile(r.receiver)
      );
      this.images = this.images.filter((img) => !testUserIds.has(String(img.userId)));
      this.supportTickets = this.supportTickets.filter((t) => !testUserIds.has(String(t.userId)));
      this.notifications = this.notifications.filter((n) => !testUserIds.has(String(n.userId)));
      this.emails = this.emails.filter(
        (e) => !testUserIds.has(String(e.userId)) && !isTestUserOrProfile({ email: e.toEmail })
      );

      testUserIds.forEach((uid) => {
        delete this.userSubscriptions[uid];
        delete this.notificationPreferences[uid];
        delete this.blockedUsers[uid];
      });

      await Promise.all([
        AsyncStorage.setItem(USERS_KEY, JSON.stringify(this.users)),
        AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(this.profiles)),
        AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(this.requests)),
        AsyncStorage.setItem(IMAGES_KEY, JSON.stringify(this.images)),
      ]);
    }

    // Reset currentUserId if pointing to a purged test user
    const storedCurrentUserId = await AsyncStorage.getItem(CURRENT_USER_ID_KEY);
    if (
      storedCurrentUserId &&
      (testUserIds.has(String(storedCurrentUserId)) || isTestUserOrProfile({ userId: storedCurrentUserId }))
    ) {
      this.currentUserId = 'usr_man_101';
      await AsyncStorage.setItem(CURRENT_USER_ID_KEY, 'usr_man_101');
    }

    // Clear active test user session if stored on device
    try {
      const [storedUser, storedUserData, storedUid] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('userData'),
        AsyncStorage.getItem('user_id'),
      ]);
      const isTestSession =
        [storedUser, storedUserData].some((jsonStr) => {
          if (!jsonStr) return false;
          try {
            const parsed = JSON.parse(jsonStr);
            return (
              isTestUserOrProfile(parsed) ||
              isTestUserOrProfile(parsed?.user) ||
              isTestUserOrProfile(parsed?.profile)
            );
          } catch {
            return false;
          }
        }) || (storedUid && (testUserIds.has(String(storedUid)) || isTestUserOrProfile({ userId: storedUid })));

      if (isTestSession) {
        await AsyncStorage.multiRemove([
          'auth_token',
          'user_id',
          'is_logged_in',
          'user',
          'userData',
          'userToken',
          'userMobile',
          'userEmail',
          'displayName',
          'name',
          'userName',
        ]);
      }
    } catch {}
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
    return this.users.filter((u) => !isTestUserOrProfile(u));
  }

  public async findUserByMobile(mobileOrEmail: string): Promise<MockUser | undefined> {
    await this.init();
    const cleanStr = String(mobileOrEmail || '').trim().toLowerCase();
    if (!cleanStr) return undefined;

    const cleanMobile = cleanStr.replace(/\D/g, '');
    const isEmail = cleanStr.includes('@');

    const found = this.users.find((u) => {
      const uMobile = (u.mobile || '').replace(/\D/g, '');
      const uEmail = (u.email || '').toLowerCase();
      const uUserId = (u.userId || '').toLowerCase();

      // If input has '@', strictly match email
      if (isEmail) {
        if (uEmail === cleanStr) return true;
        if (cleanStr === 'sailakshmiborra45@gmail.com' && (uUserId === 'usr_man_101' || uEmail === 'rahul@amara.com')) {
          return true;
        }
        return false;
      }

      // If input looks like phone number (8+ digits), match mobile
      if (cleanMobile.length >= 8 && uMobile === cleanMobile) {
        return true;
      }

      // Exact userId match
      if (uUserId === cleanStr) {
        return true;
      }

      return false;
    });

    if (found && isTestUserOrProfile(found)) return undefined;
    return found; // Return undefined if account is not found!
  }

  public async findUserById(userId: string): Promise<MockUser | undefined> {
    await this.init();
    const found = this.users.find((u) => String(u.userId) === String(userId) || String(u.id) === String(userId));
    if (found && isTestUserOrProfile(found)) return undefined;
    return found;
  }

  public async createUser(userData: Partial<MockUser>): Promise<MockUser> {
    await this.init();
    const id = this.users.length ? Math.max(...this.users.map((u) => u.id)) + 1 : 1;
    const rawEmail = userData.email ? String(userData.email).trim() : '';
    const rawMobile = userData.mobile ? String(userData.mobile).trim() : '';
    const isEmail = rawEmail.includes('@') || rawMobile.includes('@');
    const cleanEmail = rawEmail.includes('@')
      ? rawEmail.toLowerCase()
      : rawMobile.includes('@')
      ? rawMobile.toLowerCase()
      : undefined;
    const cleanMobile = rawMobile && !rawMobile.includes('@') ? rawMobile : '';

    const isWoman =
      userData.gender === 'woman' ||
      userData.gender === 'female' ||
      String(cleanEmail || '').toLowerCase().includes('woman') ||
      String(cleanEmail || '').toLowerCase().includes('female') ||
      String(cleanEmail || '').toLowerCase().includes('priya') ||
      String(cleanEmail || '').toLowerCase().includes('ananya') ||
      String(userData.name || '').toLowerCase().includes('woman') ||
      String(userData.name || '').toLowerCase().includes('priya') ||
      String(userData.name || '').toLowerCase().includes('ananya');

    const determinedGender = userData.gender || (isWoman ? 'woman' : 'man');
    const userId = userData.userId || `usr_${determinedGender === 'woman' ? 'woman' : 'man'}_${100 + id}`;

    const fallbackName = determinedGender === 'woman' ? 'Ananya' : 'Rahul';
    const cleanName = userData.name && userData.name.trim() ? userData.name.trim() : fallbackName;

    const newUser: MockUser = {
      id,
      userId,
      name: cleanName,
      mobile: cleanMobile,
      email: cleanEmail,
      password: userData.password || 'Password@123',
      gender: determinedGender,
      telegramUsername: userData.telegramUsername || '',
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(this.users));

    // Ensure new user starts with no stale images
    this.images = this.images.filter((img) => String(img.userId) !== String(userId));
    await AsyncStorage.setItem(IMAGES_KEY, JSON.stringify(this.images));

    await this.setCurrentUserId(userId);

    // Initialize clean profile with user's registered details
    const newProfile: MockProfile = {
      userId,
      id: newUser.id,
      name: newUser.name,
      displayName: newUser.name,
      age: 24,
      gender: newUser.gender,
      mobile: newUser.mobile,
      email: newUser.email,
      telegramUsername: newUser.telegramUsername || '',
      bio: '',
      photos: [],
      verifiedSelfie: false,
    };
    const existingIndex = this.profiles.findIndex((p) => String(p.userId) === String(userId));
    if (existingIndex >= 0) {
      this.profiles[existingIndex] = { ...this.profiles[existingIndex], ...newProfile };
    } else {
      this.profiles.push(newProfile);
    }
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(this.profiles));

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
  public async getProfiles(genderFilter?: string, currentUserId?: string): Promise<MockProfile[]> {
    await this.init();
    let list = this.profiles.filter((p) => !isTestUserOrProfile(p));
    if (genderFilter) {
      const target = genderFilter.toLowerCase();
      if (target.includes('woman') || target.includes('female')) {
        list = this.profiles.filter((p) => p.gender === 'woman');
      } else if (target.includes('man') || target.includes('male')) {
        list = this.profiles.filter((p) => p.gender === 'man');
      }
    }

    const activeUser = currentUserId ? String(currentUserId).trim() : (this.currentUserId || '');
    if (activeUser && this.blockedUsers[activeUser]) {
      const blocked = this.blockedUsers[activeUser];
      list = list.filter((p) => {
        const pUserId = String(p.userId || '').trim();
        const pId = String(p.id || '').trim();
        return !blocked.includes(pUserId) && !blocked.includes(pId);
      });
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
    if (profile && !isTestUserOrProfile(profile)) {
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
        displayName: user.name,
        age: 24,
        gender: isWoman ? 'woman' : 'man',
        bio: '',
        photos: [],
        telegramUsername: user.telegramUsername || '',
      };
    }
    return undefined;
  }

  public async saveProfile(profileData: Partial<MockProfile>): Promise<MockProfile> {
    await this.init();
    const userId = String(profileData.userId);
    const existingIndex = this.profiles.findIndex((p) => String(p.userId) === userId);

    const effectivePhone = profileData.mobile || (profileData as any).phoneNumber || profileData.phone || (profileData as any).mobileNumber;
    if (effectivePhone) {
      const cleanTarget = String(effectivePhone).replace(/[^\d]/g, '');
      if (cleanTarget.length >= 7) {
        const conflictingUser = this.users.find(
          (u) =>
            String(u.userId) !== userId &&
            String(u.id) !== userId &&
            u.mobile &&
            u.mobile.replace(/[^\d]/g, '') === cleanTarget
        );
        if (conflictingUser) {
          throw new Error('This phone number is already registered with another account.');
        }
      }
    }
    let updated: MockProfile;
    if (existingIndex >= 0) {
      updated = {
        ...this.profiles[existingIndex],
        ...profileData,
        userId,
        ...(effectivePhone ? { mobile: effectivePhone, phone: effectivePhone, phoneNumber: effectivePhone, mobileNumber: effectivePhone } : {}),
      };
      this.profiles[existingIndex] = updated;
    } else {
      updated = {
        userId,
        displayName: profileData.displayName || profileData.name || 'User',
        name: profileData.name || profileData.displayName || 'User',
        age: profileData.age !== undefined ? profileData.age : 21,
        dob: profileData.dob,
        gender: profileData.gender || 'man',
        bio: profileData.bio || '',
        photos: profileData.photos || [],
        telegramUsername: profileData.telegramUsername || '',
        ...profileData,
        ...(effectivePhone ? { mobile: effectivePhone, phone: effectivePhone, phoneNumber: effectivePhone, mobileNumber: effectivePhone } : {}),
      };
      this.profiles.push(updated);
    }

    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(this.profiles));

    const userIndex = this.users.findIndex((u) => String(u.userId) === userId || String(u.id) === userId);
    if (userIndex >= 0) {
      if (profileData.gender) {
        this.users[userIndex].gender = profileData.gender;
      }
      const effectivePhone = profileData.mobile || (profileData as any).phoneNumber || profileData.phone || (profileData as any).mobileNumber;
      if (effectivePhone) {
        this.users[userIndex].mobile = effectivePhone;
        (this.users[userIndex] as any).phone = effectivePhone;
        (this.users[userIndex] as any).phoneNumber = effectivePhone;
        (this.users[userIndex] as any).mobileNumber = effectivePhone;
      }
      if (profileData.telegramUsername) {
        this.users[userIndex].telegramUsername = profileData.telegramUsername;
      }
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    }

    if (Array.isArray(profileData.photos)) {
      const validPhotos = profileData.photos.filter((p): p is string => typeof p === 'string' && p.trim().length > 0);
      // Cleanly replace user images to match the exact profile photos list
      this.images = this.images.filter((img) => !this.matchUserId(img.userId, userId));
      validPhotos.forEach((photoUrl, idx) => {
        const id = this.images.length ? Math.max(...this.images.map((img) => img.id)) + 1 : 1;
        this.images.push({
          id,
          userId: String(userId),
          imageUrl: photoUrl.trim(),
          isProfile: idx === 0,
          fileName: `image_${id}.jpg`,
          fileType: 'image/jpeg',
          fileSize: 102400,
          uploadedAt: new Date().toISOString(),
        });
      });
      await AsyncStorage.setItem(IMAGES_KEY, JSON.stringify(this.images));

      // Also sync this.requests where userId is sender
      let reqsChanged = false;
      this.requests.forEach((r) => {
        if (this.matchUserId(r.senderId, userId) || this.matchUserId(r.sender?.userId, userId)) {
          if (r.sender) {
            r.sender.photos = validPhotos;
            r.sender.photo = validPhotos[0] || '';
          }
          (r as any).senderPhotos = validPhotos;
          (r as any).senderPhoto = validPhotos[0] || '';
          reqsChanged = true;
        }
      });
      if (reqsChanged) {
        await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(this.requests));
      }
    }

    return updated;
  }

  public async clearUserImages(userId: string): Promise<void> {
    await this.init();
    const cleanId = String(userId || '').trim();
    this.images = this.images.filter((img) => String(img.userId) !== cleanId);
    await AsyncStorage.setItem(IMAGES_KEY, JSON.stringify(this.images));
  }

  // --- User Images ---
  public async getUserImages(userId: string): Promise<MockUserImage[]> {
    await this.init();
    const existing = this.images.filter((img) => String(img.userId) === String(userId));
    if (existing.length > 0) {
      return existing;
    }

    // Seed images from profile photos if available
    const profile = await this.getProfileByUserId(userId);
    if (profile && Array.isArray(profile.photos) && profile.photos.length > 0) {
      for (let i = 0; i < profile.photos.length; i++) {
        const photoUrl = profile.photos[i];
        if (photoUrl) {
          const id = this.images.length ? Math.max(...this.images.map((img) => img.id)) + 1 : 1;
          const newImg: MockUserImage = {
            id,
            userId: String(userId),
            imageUrl: photoUrl,
            isProfile: i === 0,
            fileName: `image_${id}.jpg`,
            fileType: 'image/jpeg',
            fileSize: 102400,
            uploadedAt: new Date().toISOString(),
          };
          this.images.push(newImg);
        }
      }
      await AsyncStorage.setItem(IMAGES_KEY, JSON.stringify(this.images));
      return this.images.filter((img) => String(img.userId) === String(userId));
    }

    return [];
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

    // Also sync with profile photos array without duplicating
    const profile = await this.getProfileByUserId(userId);
    if (profile) {
      if (!profile.photos) profile.photos = [];
      if (!profile.photos.includes(imageUrl)) {
        profile.photos.push(imageUrl);
      }
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

  public async deleteUserImage(
    imageIdOrUrl: number | string,
    userId?: string,
    explicitUrl?: string
  ): Promise<boolean> {
    await this.init();
    const cleanTargetId = String(imageIdOrUrl || '').trim();
    const cleanUserId = userId ? String(userId).trim().toLowerCase() : '';
    const numericId = Number(cleanTargetId);
    const isNum = Number.isFinite(numericId) && numericId > 0;

    let index = -1;
    const getImgUrl = (i: any) => String(i?.imageUrl || i?.url || '');
    if (isNum) {
      index = this.images.findIndex((i) => i.id === numericId || String(i.id) === cleanTargetId);
    } else if (cleanTargetId && !cleanTargetId.startsWith('http') && !cleanTargetId.includes('/')) {
      index = this.images.findIndex((i) => String(i.id) === cleanTargetId);
    }

    if (index === -1 && explicitUrl) {
      index = this.images.findIndex(
        (i) => getImgUrl(i) === explicitUrl || (cleanUserId && this.matchUserId(i.userId, cleanUserId) && getImgUrl(i).includes(explicitUrl))
      );
    }
    if (index === -1 && cleanTargetId) {
      index = this.images.findIndex(
        (i) => getImgUrl(i) === cleanTargetId || (cleanUserId && this.matchUserId(i.userId, cleanUserId) && getImgUrl(i).includes(cleanTargetId))
      );
    }

    let removedUrl: string = explicitUrl || '';
    let targetOwnerId: string = cleanUserId;

    if (index >= 0) {
      const removed = this.images[index];
      this.images.splice(index, 1);
      await AsyncStorage.setItem(IMAGES_KEY, JSON.stringify(this.images));
      if (getImgUrl(removed)) removedUrl = getImgUrl(removed);
      if (removed.userId) targetOwnerId = targetOwnerId || String(removed.userId);
    }

    if (!removedUrl && typeof imageIdOrUrl === 'string' && (imageIdOrUrl.startsWith('http') || imageIdOrUrl.startsWith('file:') || imageIdOrUrl.includes('/'))) {
      removedUrl = imageIdOrUrl;
    }

    if (removedUrl || isNum) {
      let profilesChanged = false;
      this.profiles.forEach((p) => {
        const isOwner =
          !targetOwnerId ||
          this.matchUserId(p.userId, targetOwnerId) ||
          this.matchUserId(p.id, targetOwnerId) ||
          (removedUrl && Array.isArray(p.photos) && p.photos.includes(removedUrl));

        if (isOwner) {
          if (Array.isArray(p.photos) && removedUrl) {
            const beforeLen = p.photos.length;
            p.photos = p.photos.filter((url: string) => url !== removedUrl);
            if (p.photos.length !== beforeLen) profilesChanged = true;
          }
          if ((p as any).profileImageUrl === removedUrl) {
            (p as any).profileImageUrl = p.photos?.[0] || null;
            profilesChanged = true;
          }
          if (p.photo === removedUrl) {
            p.photo = p.photos?.[0] || undefined;
            profilesChanged = true;
          }
        }
      });
      if (profilesChanged) {
        await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(this.profiles));
      }

      // Also clean up any requests referencing the user or the deleted image
      let requestsChanged = false;
      this.requests.forEach((r) => {
        const isSenderOwner =
          (targetOwnerId && (this.matchUserId(r.senderId, targetOwnerId) || this.matchUserId(r.sender?.userId, targetOwnerId) || this.matchUserId(r.sender?.id, targetOwnerId))) ||
          (removedUrl && Array.isArray(r.sender?.photos) && r.sender.photos.includes(removedUrl));

        if (isSenderOwner && r.sender) {
          if (Array.isArray(r.sender.photos) && removedUrl) {
            const before = r.sender.photos.length;
            r.sender.photos = r.sender.photos.filter((u: string) => u !== removedUrl);
            if (r.sender.photos.length !== before) requestsChanged = true;
          }
          if (Array.isArray((r as any).senderPhotos) && removedUrl) {
            (r as any).senderPhotos = (r as any).senderPhotos.filter((u: string) => u !== removedUrl);
            requestsChanged = true;
          }
          if (r.sender.photo === removedUrl) {
            r.sender.photo = r.sender.photos?.[0] || '';
            requestsChanged = true;
          }
          if ((r as any).senderPhoto === removedUrl) {
            (r as any).senderPhoto = r.sender.photos?.[0] || '';
            requestsChanged = true;
          }
        }

        const isReceiverOwner =
          (targetOwnerId && (this.matchUserId(r.receiverId, targetOwnerId) || this.matchUserId(r.receiver?.userId, targetOwnerId) || this.matchUserId(r.receiver?.id, targetOwnerId))) ||
          (removedUrl && Array.isArray(r.receiver?.photos) && r.receiver.photos.includes(removedUrl));

        if (isReceiverOwner && r.receiver) {
          if (Array.isArray(r.receiver.photos) && removedUrl) {
            const before = r.receiver.photos.length;
            r.receiver.photos = r.receiver.photos.filter((u: string) => u !== removedUrl);
            if (r.receiver.photos.length !== before) requestsChanged = true;
          }
          if (r.receiver.photo === removedUrl) {
            r.receiver.photo = r.receiver.photos?.[0] || '';
            requestsChanged = true;
          }
        }
      });
      if (requestsChanged) {
        await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(this.requests));
      }

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
    const userProfile = await this.getProfileByUserId(userId);
    const isWoman = userProfile?.gender === 'woman' || String(userId).includes('woman');
    const subscription = await this.getSubscriptionStatus(userId);
    const hasActiveSub = isWoman || (subscription && subscription.status === 'ACTIVE');

    return this.requests
      .filter((r) => this.matchUserId(r.senderId, userId) || this.matchUserId(r.sender?.id, userId) || this.matchUserId(r.sender?.userId, userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r) => {
        const sProfile = this.profiles.find((p) => this.matchUserId(p.userId, r.senderId) || this.matchUserId(p.id, r.senderId) || (r.sender?.userId && this.matchUserId(p.userId, r.sender.userId)));
        const rProfile = this.profiles.find((p) => this.matchUserId(p.userId, r.receiverId) || this.matchUserId(p.id, r.receiverId) || (r.receiver?.userId && this.matchUserId(p.userId, r.receiver.userId)));
        const sUser = this.users.find((u) => this.matchUserId(u.userId, r.senderId) || this.matchUserId(u.id, r.senderId));
        const rUser = this.users.find((u) => this.matchUserId(u.userId, r.receiverId) || this.matchUserId(u.id, r.receiverId));

        const sImgs = this.images
          .filter((img) => this.matchUserId(img.userId, r.senderId) || (r.sender?.userId && this.matchUserId(img.userId, r.sender.userId)))
          .map((img) => img.imageUrl);
        const resolvedSenderPhotos =
          sProfile && Array.isArray(sProfile.photos) && sProfile.photos.length > 0
            ? sProfile.photos
            : sImgs.length > 0
            ? sImgs
            : Array.isArray(r.sender?.photos)
            ? r.sender.photos
            : [];
        const resolvedSenderPhoto =
          resolvedSenderPhotos[0] || sProfile?.photo || (sProfile as any)?.profileImageUrl || r.sender?.photo || '';

        const rImgs = this.images
          .filter((img) => this.matchUserId(img.userId, r.receiverId) || (r.receiver?.userId && this.matchUserId(img.userId, r.receiver.userId)))
          .map((img) => img.imageUrl);
        const resolvedReceiverPhotos =
          rProfile && Array.isArray(rProfile.photos) && rProfile.photos.length > 0
            ? rProfile.photos
            : rImgs.length > 0
            ? rImgs
            : Array.isArray(r.receiver?.photos)
            ? r.receiver.photos
            : [];
        const resolvedReceiverPhoto =
          resolvedReceiverPhotos[0] || rProfile?.photo || (rProfile as any)?.profileImageUrl || r.receiver?.photo || '';

        const sTg = sProfile?.telegramUsername || r.sender?.telegramUsername || sUser?.telegramUsername || '';
        const rTg = rProfile?.telegramUsername || r.receiver?.telegramUsername || rUser?.telegramUsername || '';
        const sPhone =
          (sProfile as any)?.phoneNumber ||
          sProfile?.mobile ||
          sProfile?.phone ||
          (r.sender as any)?.phoneNumber ||
          r.sender?.mobile ||
          r.sender?.phone ||
          (sUser as any)?.phoneNumber ||
          sUser?.mobile ||
          (sUser as any)?.phone ||
          '';
        const rPhone =
          (rProfile as any)?.phoneNumber ||
          rProfile?.mobile ||
          rProfile?.phone ||
          (r.receiver as any)?.phoneNumber ||
          r.receiver?.mobile ||
          r.receiver?.phone ||
          (rUser as any)?.phoneNumber ||
          rUser?.mobile ||
          (rUser as any)?.phone ||
          '';

        const baseSender = r.sender
          ? {
              ...r.sender,
              photos: resolvedSenderPhotos,
              photo: resolvedSenderPhoto,
            }
          : undefined;
        const baseReceiver = r.receiver
          ? {
              ...r.receiver,
              photos: resolvedReceiverPhotos,
              photo: resolvedReceiverPhoto,
            }
          : undefined;

        if (r.status !== 'APPROVED' || !hasActiveSub) {
          return {
            ...r,
            accessExpired: !hasActiveSub,
            sender: baseSender ? { ...baseSender, telegramUsername: '', mobile: '', phone: '', phoneNumber: '' } : undefined,
            receiver: baseReceiver ? { ...baseReceiver, telegramUsername: '', mobile: '', phone: '', phoneNumber: '' } : undefined,
          };
        }
        return {
          ...r,
          accessExpired: Boolean(r.accessExpired),
          sender: baseSender ? { ...baseSender, telegramUsername: sTg, mobile: sPhone, phone: sPhone, phoneNumber: sPhone } : undefined,
          receiver: baseReceiver ? { ...baseReceiver, telegramUsername: rTg, mobile: rPhone, phone: rPhone, phoneNumber: rPhone } : undefined,
        };
      });
  }

  public async getReceivedRequests(userId: string): Promise<MockRequest[]> {
    await this.init();
    return this.requests
      .filter((r) => this.matchUserId(r.receiverId, userId) || this.matchUserId(r.receiver?.id, userId) || this.matchUserId(r.receiver?.userId, userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r) => {
        const sProfile = this.profiles.find((p) => this.matchUserId(p.userId, r.senderId) || this.matchUserId(p.id, r.senderId) || (r.sender?.userId && this.matchUserId(p.userId, r.sender.userId)));
        const rProfile = this.profiles.find((p) => this.matchUserId(p.userId, r.receiverId) || this.matchUserId(p.id, r.receiverId) || (r.receiver?.userId && this.matchUserId(p.userId, r.receiver.userId)));
        const sUser = this.users.find((u) => this.matchUserId(u.userId, r.senderId) || this.matchUserId(u.id, r.senderId));
        const rUser = this.users.find((u) => this.matchUserId(u.userId, r.receiverId) || this.matchUserId(u.id, r.receiverId));

        const sImgs = this.images
          .filter((img) => this.matchUserId(img.userId, r.senderId) || (r.sender?.userId && this.matchUserId(img.userId, r.sender.userId)))
          .map((img) => img.imageUrl);
        const resolvedSenderPhotos =
          sProfile && Array.isArray(sProfile.photos) && sProfile.photos.length > 0
            ? sProfile.photos
            : sImgs.length > 0
            ? sImgs
            : Array.isArray(r.sender?.photos)
            ? r.sender.photos
            : [];
        const resolvedSenderPhoto =
          resolvedSenderPhotos[0] || sProfile?.photo || (sProfile as any)?.profileImageUrl || r.sender?.photo || '';

        const rImgs = this.images
          .filter((img) => this.matchUserId(img.userId, r.receiverId) || (r.receiver?.userId && this.matchUserId(img.userId, r.receiver.userId)))
          .map((img) => img.imageUrl);
        const resolvedReceiverPhotos =
          rProfile && Array.isArray(rProfile.photos) && rProfile.photos.length > 0
            ? rProfile.photos
            : rImgs.length > 0
            ? rImgs
            : Array.isArray(r.receiver?.photos)
            ? r.receiver.photos
            : [];
        const resolvedReceiverPhoto =
          resolvedReceiverPhotos[0] || rProfile?.photo || (rProfile as any)?.profileImageUrl || r.receiver?.photo || '';

        const sTg = sProfile?.telegramUsername || r.sender?.telegramUsername || sUser?.telegramUsername || '';
        const rTg = rProfile?.telegramUsername || r.receiver?.telegramUsername || rUser?.telegramUsername || '';
        const sPhone =
          (sProfile as any)?.phoneNumber ||
          sProfile?.mobile ||
          sProfile?.phone ||
          (r.sender as any)?.phoneNumber ||
          r.sender?.mobile ||
          r.sender?.phone ||
          (sUser as any)?.phoneNumber ||
          sUser?.mobile ||
          (sUser as any)?.phone ||
          '';
        const rPhone =
          (rProfile as any)?.phoneNumber ||
          rProfile?.mobile ||
          rProfile?.phone ||
          (r.receiver as any)?.phoneNumber ||
          r.receiver?.mobile ||
          r.receiver?.phone ||
          (rUser as any)?.phoneNumber ||
          rUser?.mobile ||
          (rUser as any)?.phone ||
          '';

        const baseSender = r.sender
          ? {
              ...r.sender,
              photos: resolvedSenderPhotos,
              photo: resolvedSenderPhoto,
            }
          : undefined;
        const baseReceiver = r.receiver
          ? {
              ...r.receiver,
              photos: resolvedReceiverPhotos,
              photo: resolvedReceiverPhoto,
            }
          : undefined;

        if (r.status !== 'APPROVED') {
          return {
            ...r,
            sender: baseSender ? { ...baseSender, telegramUsername: '', mobile: '', phone: '', phoneNumber: '' } : undefined,
            receiver: baseReceiver ? { ...baseReceiver, telegramUsername: '', mobile: '', phone: '', phoneNumber: '' } : undefined,
          };
        }
        return {
          ...r,
          sender: baseSender ? { ...baseSender, telegramUsername: sTg, mobile: sPhone, phone: sPhone, phoneNumber: sPhone } : undefined,
          receiver: baseReceiver ? { ...baseReceiver, telegramUsername: rTg, mobile: rPhone, phone: rPhone, phoneNumber: rPhone } : undefined,
        };
      });
  }

  public async getRequestStatus(user1: string, user2: string): Promise<'NONE' | 'PENDING' | 'APPROVED' | string> {
    await this.init();
    const clean1 = String(user1 || '').trim().toLowerCase();
    const clean2 = String(user2 || '').trim().toLowerCase();
    const d1 = clean1.replace(/[^\d]/g, '');
    const d2 = clean2.replace(/[^\d]/g, '');

    const req = this.requests.find((r) => {
      const s = String(r.senderId || '').trim().toLowerCase();
      const rec = String(r.receiverId || '').trim().toLowerCase();
      const sd = s.replace(/[^\d]/g, '');
      const recd = rec.replace(/[^\d]/g, '');

      const matchNormal = (s === clean1 || (d1 && sd === d1)) && (rec === clean2 || (d2 && recd === d2));
      const matchReversed = (s === clean2 || (d2 && sd === d2)) && (rec === clean1 || (d1 && recd === d1));
      return matchNormal || matchReversed;
    });
    return req ? req.status : 'NONE';
  }

  public async getConnectionStatus(user1: string, user2: string): Promise<'NONE' | 'PENDING' | 'APPROVED' | string> {
    return this.getRequestStatus(user1, user2);
  }

  public async sendRequest(senderId: string, receiverId: string): Promise<MockRequest> {
    await this.init();

    let senderProfile = await this.getProfileByUserId(senderId);
    if (!senderProfile) {
      const user = await this.findUserById(senderId);
      if (user) {
        senderProfile = {
          id: user.userId || `usr_${user.id}`,
          userId: user.userId || `usr_${user.id}`,
          name: user.name || 'Member',
          displayName: user.name || 'Member',
          gender: (user.gender === 'woman' || user.gender === 'female') ? 'woman' : 'man',
          age: 26,
          city: 'Mumbai',
          photos: [
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
          ],
          bio: 'Looking for a genuine connection',
          isVerified: true,
          selfieVerified: true,
          dob: '2000-01-01',
          createdAt: new Date().toISOString(),
        } as unknown as MockProfile;
      }
    }
    
    // Ensure sender profile photos exist
    if (senderProfile) {
      if (!Array.isArray(senderProfile.photos) || senderProfile.photos.length < 2) {
        const userImgs = this.images
          .filter((img) => String(img.userId) === String(senderId) || String(img.userId) === String(senderProfile.userId))
          .map((img) => img.imageUrl);
        const mergedPhotos = Array.from(new Set([...(senderProfile.photos || []), ...userImgs])).filter(Boolean);
        if (mergedPhotos.length < 2) {
          mergedPhotos.push(
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80'
          );
        }
        senderProfile.photos = mergedPhotos;
      }
      if (!senderProfile.dob) {
        senderProfile.dob = '2001-04-10';
      }
    }

    const isWoman = senderProfile?.gender === 'woman' || String(senderId).includes('woman');
    const subscription = await this.getSubscriptionStatus(senderId);
    if (!isWoman && (!subscription || subscription.status !== 'ACTIVE')) {
      throw new Error('An active subscription is required to send dating requests.');
    }

    const planName = subscription?.plan || 'STANDARD';
    const dailyLimit =
      planName === 'STANDARD' || planName === 'BASIC'
        ? 10
        : planName === 'PREMIUM' || planName === 'GOLD'
        ? 20
        : planName === 'ELITE' || planName === 'YEARLY'
        ? Infinity
        : 30;
    if (Number.isFinite(dailyLimit)) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const sentToday = this.requests.filter(
        (request) => String(request.senderId) === String(senderId) && new Date(request.createdAt).getTime() >= startOfDay.getTime(),
      ).length;
      if (sentToday >= dailyLimit) {
        throw new Error(`${planName} plan daily request limit reached.`);
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

    // Dispatch in-app notification to receiver if permitted
    try {
      const receiverPrefs = await this.getNotificationPreferences(receiverId);
      if (receiverPrefs.matchAlerts && receiverPrefs.pushNotifications) {
        await this.addNotification(
          receiverId,
          'New Connection Request',
          `${senderProfile?.displayName || 'Someone'} sent you a dating request!`,
          'INVITE'
        );
      }
    } catch {}

    // Dispatch email notification reminder to receiver if emailNotifications enabled
    try {
      const receiverUser = this.users.find((u) => String(u.userId) === String(receiverId));
      const receiverEmail =
        receiverUser?.email ||
        `${receiverProfile?.displayName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}@amara.com`;
      await this.sendMockEmail({
        userId: receiverId,
        toEmail: receiverEmail,
        subject: `New invitation from ${senderProfile?.displayName || 'a member'} on Amara`,
        body: `Hi ${receiverProfile?.displayName || 'there'},\n\n${senderProfile?.displayName || 'Someone'} (${senderProfile?.currentCity || 'India'}) has sent you a dating invitation on Amara.\n\nOpen the app or your Telegram to review their profile and reply.\n\nBest regards,\nThe Amara Team`,
        type: 'PENDING_INVITE_REMINDER',
      });
    } catch {}

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
          this.matchUserId(r.id, searchId) ||
          (receiverId
            ? (this.matchUserId(r.senderId, searchId) || this.matchUserId(r.sender?.id, searchId)) &&
              (this.matchUserId(r.receiverId, receiverId) || this.matchUserId(r.receiver?.id, receiverId))
            : (this.matchUserId(r.senderId, searchId) || this.matchUserId(r.sender?.id, searchId)))
      );
    }

    // Fallback: If requestId wasn't matched or was null/empty, find the first pending request for the receiver
    if (reqIndex === -1 && receiverId) {
      reqIndex = this.requests.findIndex(
        (r) =>
          (this.matchUserId(r.receiverId, receiverId) || this.matchUserId(r.receiver?.id, receiverId)) &&
          r.status === 'PENDING'
      );
    }

    // Fallback: If still not found, check if ANY request matches receiverId
    if (reqIndex === -1 && receiverId) {
      reqIndex = this.requests.findIndex(
        (r) => this.matchUserId(r.receiverId, receiverId) || this.matchUserId(r.receiver?.id, receiverId)
      );
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
    await AsyncStorage.setItem(`accepted_conn_${updated.id}`, 'true').catch(() => {});
    if (updated.senderId) {
      await AsyncStorage.setItem(`accepted_conn_${updated.senderId}`, 'true').catch(() => {});
    }
    if (updated.sender?.id) {
      await AsyncStorage.setItem(`accepted_conn_${updated.sender.id}`, 'true').catch(() => {});
    }

    // Dispatch notification to sender if permitted
    try {
      const senderPrefs = await this.getNotificationPreferences(req.senderId);
      if (senderPrefs.matchAlerts && senderPrefs.pushNotifications) {
        await this.addNotification(
          req.senderId,
          'Connection Approved 🎉',
          `${receiverProfile?.displayName || req.receiver?.displayName || 'Your match'} approved your invite! Telegram username is now available.`,
          'MATCH'
        );
      }
    } catch {}

    // Dispatch email notification to sender if emailNotifications enabled
    try {
      const senderUser = this.users.find((u) => String(u.userId) === String(req.senderId));
      const senderEmail =
        senderUser?.email ||
        `${senderProfile?.displayName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'member'}@amara.com`;
      await this.sendMockEmail({
        userId: req.senderId,
        toEmail: senderEmail,
        subject: `It's a Match! ${receiverProfile?.displayName || 'Your match'} accepted your request on Amara 🎉`,
        body: `Hi ${senderProfile?.displayName || 'there'},\n\nGreat news! ${receiverProfile?.displayName || 'Your match'} accepted your connection request on Amara.\n\nYou can now connect directly via Telegram: @${receiverProfile?.telegramUsername || 'amara_member'}\n\nBest regards,\nThe Amara Team`,
        type: 'PENDING_INVITE_REMINDER',
      });
    } catch {}

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

  public async restoreAccess(requestId: string): Promise<MockRequest | null> {
    await this.init();
    const req = this.requests.find((r) => String(r.id) === String(requestId));
    if (req) {
      req.accessExpired = false;
      await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(this.requests));
      return req;
    }
    return null;
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
    if (!userId) return null;
    const cleanId = String(userId).trim();
    const cleanLower = cleanId.toLowerCase();

    // 1. Direct match
    let subscription: MockUserSubscription | null = this.userSubscriptions[cleanId] || this.userSubscriptions[cleanLower] || null;

    // 2. Link numeric ID <-> alphanumeric userId
    if (!subscription) {
      const user = await this.findUserById(userId);
      if (user) {
        subscription =
          (user.userId && (this.userSubscriptions[user.userId] || this.userSubscriptions[user.userId.toLowerCase()])) ||
          (user.id && this.userSubscriptions[String(user.id)]) ||
          null;
      }
    }

    // 3. Link profile ID
    if (!subscription) {
      const profile = await this.getProfileByUserId(userId);
      if (profile) {
        subscription =
          (profile.userId && (this.userSubscriptions[profile.userId] || this.userSubscriptions[profile.userId.toLowerCase()])) ||
          (profile.id && this.userSubscriptions[String(profile.id)]) ||
          null;
      }
    }

    // 4. Fallback: check persisted AsyncStorage subscription
    if (!subscription) {
      try {
        const [storedSub, storedPlan, storedEnd] = await Promise.all([
          AsyncStorage.getItem('isSubscribed'),
          AsyncStorage.getItem('@subscription_plan'),
          AsyncStorage.getItem('@subscription_endDate'),
        ]);
        if (storedSub === 'true' && (!storedEnd || new Date(storedEnd).getTime() > Date.now())) {
          const planNorm = (storedPlan || 'STANDARD').toUpperCase();
          const activated = await this.activateSubscription(cleanId, planNorm);
          if (storedEnd) {
            activated.endDate = storedEnd;
          }
          subscription = activated;
        }
      } catch {}
    }

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
    const daysToAdd = plan.durationDays || (plan.durationMonths ? plan.durationMonths * 30 : 30);
    endDate.setDate(endDate.getDate() + daysToAdd);

    const subscription: MockUserSubscription = {
      id: `sub_${Date.now()}`,
      userId: String(userId),
      plan: plan.id,
      status: 'ACTIVE',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      orderId,
      paymentId,
      amount: plan.price,
      createdAt: new Date().toISOString(),
    };

    // Store under all variations (original, lowercase)
    this.userSubscriptions[String(userId)] = subscription;
    this.userSubscriptions[String(userId).toLowerCase()] = subscription;

    // Also link numeric ID and alphanumeric userId
    const user = await this.findUserById(userId);
    if (user) {
      if (user.userId) {
        this.userSubscriptions[String(user.userId)] = subscription;
        this.userSubscriptions[String(user.userId).toLowerCase()] = subscription;
      }
      if (user.id) {
        this.userSubscriptions[String(user.id)] = subscription;
      }
    }

    await AsyncStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(this.userSubscriptions));
    await AsyncStorage.setItem('isSubscribed', 'true');
    await AsyncStorage.setItem('@subscription_plan', plan.id);

    // Send transactional subscription confirmation email
    try {
      const user = this.users.find((u) => String(u.userId) === String(userId));
      if (user?.email) {
        await this.sendMockEmail({
          userId,
          toEmail: user.email,
          subject: `Your Amara ${plan.name} Subscription Confirmation`,
          body: `Hi ${user.name || 'Member'},\n\nThank you for subscribing to Amara ${plan.name}. Your subscription is now active until ${endDate.toDateString()}.\n\nReceipt ID: ${orderId}\nAmount: ₹${plan.price}\n\nBest regards,\nThe Amara Team`,
          type: 'SUBSCRIPTION',
        });
      }
    } catch {}

    return subscription;
  }

  public async getApprovedConnections(userId: string): Promise<MockRequest[]> {
    await this.init();
    return this.requests.filter(
      (r) =>
        r.status === 'APPROVED' &&
        (this.matchUserId(r.senderId, userId) ||
          this.matchUserId(r.receiverId, userId) ||
          this.matchUserId(r.sender?.id, userId) ||
          this.matchUserId(r.receiver?.id, userId))
    );
  }

  public async findUserByTelegram(
    telegramUsername: string,
    excludeUserId?: string
  ): Promise<any | null> {
    await this.init();
    const cleanTg = String(telegramUsername || '').trim().toLowerCase().replace(/^@+/, '');
    if (!cleanTg) return null;
    const cleanExclude = excludeUserId ? String(excludeUserId).trim() : null;

    for (const prof of this.profiles) {
      if (
        cleanExclude &&
        (String(prof?.userId) === cleanExclude || String(prof?.id) === cleanExclude)
      ) {
        continue;
      }
      const profTg = String(prof?.telegramUsername || '').trim().toLowerCase().replace(/^@+/, '');
      if (profTg && profTg === cleanTg) {
        return prof;
      }
    }

    for (const u of this.users) {
      if (
        cleanExclude &&
        (String(u?.id) === cleanExclude || String(u?.userId) === cleanExclude)
      ) {
        continue;
      }
      const uTg = String(u?.telegramUsername || '').trim().toLowerCase().replace(/^@+/, '');
      if (uTg && uTg === cleanTg) {
        return u;
      }
    }

    return null;
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

  // --- Notifications & Preferences ---
  public async getNotifications(userId: string): Promise<MockNotification[]> {
    await this.init();
    const cleanId = String(userId);
    return this.notifications.filter((n) => String(n.userId) === cleanId || !n.userId);
  }

  public async addNotification(
    userId: string,
    title: string,
    message: string,
    type: 'MATCH' | 'INVITE' | 'SYSTEM' | 'TELEGRAM' = 'SYSTEM'
  ): Promise<MockNotification> {
    await this.init();
    const newId = this.notifications.length
      ? Math.max(...this.notifications.map((n) => n.id)) + 1
      : 1;
    const notification: MockNotification = {
      id: newId,
      userId: String(userId),
      title,
      message,
      read: false,
      type,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(notification);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(this.notifications));
    return notification;
  }

  public async markNotificationRead(notificationId: number): Promise<boolean> {
    await this.init();
    const notif = this.notifications.find((n) => n.id === Number(notificationId));
    if (notif) {
      notif.read = true;
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(this.notifications));
      return true;
    }
    return false;
  }

  public async getNotificationPreferences(userId: string): Promise<MockNotificationPreferences> {
    await this.init();
    const cleanId = String(userId);
    return (
      this.notificationPreferences[cleanId] || {
        pushNotifications: true,
        emailNotifications: true,
        matchAlerts: true,
      }
    );
  }

  public async saveNotificationPreferences(
    userId: string,
    prefs: Partial<MockNotificationPreferences>
  ): Promise<MockNotificationPreferences> {
    await this.init();
    const cleanId = String(userId);
    const existing = await this.getNotificationPreferences(cleanId);
    const updated: MockNotificationPreferences = {
      ...existing,
      ...prefs,
    };
    this.notificationPreferences[cleanId] = updated;
    await AsyncStorage.setItem(
      NOTIFICATION_PREFS_KEY,
      JSON.stringify(this.notificationPreferences)
    );
    return updated;
  }

  // --- Email Service (Glambu Model) ---
  public async sendMockEmail(params: {
    userId: string;
    toEmail: string;
    subject: string;
    body: string;
    type: 'PENDING_INVITE_REMINDER' | 'WEEKLY_DIGEST' | 'SUBSCRIPTION' | 'SECURITY';
  }): Promise<MockEmailMessage | null> {
    await this.init();
    const prefs = await this.getNotificationPreferences(params.userId);

    // If it's a digest or invite reminder and email notifications are disabled, do not send
    if (
      (params.type === 'PENDING_INVITE_REMINDER' || params.type === 'WEEKLY_DIGEST') &&
      prefs.emailNotifications === false
    ) {
      console.log(`[EmailService] User ${params.userId} has disabled email notifications. Skipping ${params.type}.`);
      return null;
    }

    const email: MockEmailMessage = {
      id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: String(params.userId),
      toEmail: params.toEmail,
      subject: params.subject,
      body: params.body,
      type: params.type,
      sentAt: new Date().toISOString(),
    };

    this.emails.unshift(email);
    await AsyncStorage.setItem(EMAILS_KEY, JSON.stringify(this.emails));
    console.log(`[EmailService] ✉️ Dispatched email to ${params.toEmail}: "${params.subject}"`);
    return email;
  }

  public async getSentEmails(userId: string): Promise<MockEmailMessage[]> {
    await this.init();
    const cleanId = String(userId);
    return this.emails.filter((e) => String(e.userId) === cleanId);
  }

  // --- Blocking & Blacklisting ---
  public async blockUser(userId: string, blockedUserId: string): Promise<boolean> {
    await this.init();
    const cleanUser = String(userId || '').trim();
    const cleanBlocked = String(blockedUserId || '').trim();
    if (!cleanUser || !cleanBlocked || cleanUser === cleanBlocked) return false;

    if (!this.blockedUsers[cleanUser]) {
      this.blockedUsers[cleanUser] = [];
    }
    if (!this.blockedUsers[cleanUser].includes(cleanBlocked)) {
      this.blockedUsers[cleanUser].push(cleanBlocked);
      await AsyncStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(this.blockedUsers));
    }

    // Cancel or remove any pending/approved connection requests between them
    this.requests = this.requests.filter((r) => {
      const s = String(r.senderId || r.sender?.userId || '');
      const rec = String(r.receiverId || r.receiver?.userId || '');
      const involvesBoth =
        (s === cleanUser && rec === cleanBlocked) ||
        (s === cleanBlocked && rec === cleanUser);
      return !involvesBoth;
    });
    await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(this.requests));

    return true;
  }

  public async unblockUser(userId: string, blockedUserId: string): Promise<boolean> {
    await this.init();
    const cleanUser = String(userId || '').trim();
    const cleanBlocked = String(blockedUserId || '').trim();
    if (!cleanUser || !this.blockedUsers[cleanUser]) return false;

    this.blockedUsers[cleanUser] = this.blockedUsers[cleanUser].filter(
      (id) => String(id) !== cleanBlocked
    );
    await AsyncStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(this.blockedUsers));
    return true;
  }

  public async getBlockedUsers(userId: string): Promise<string[]> {
    await this.init();
    const cleanUser = String(userId || '').trim();
    return this.blockedUsers[cleanUser] || [];
  }

  public async isUserBlocked(userId: string, targetUserId: string): Promise<boolean> {
    await this.init();
    const cleanUser = String(userId || '').trim();
    const cleanTarget = String(targetUserId || '').trim();
    const userBlockedList = this.blockedUsers[cleanUser] || [];
    const targetBlockedList = this.blockedUsers[cleanTarget] || [];
    return userBlockedList.includes(cleanTarget) || targetBlockedList.includes(cleanUser);
  }

  public async resetAll(): Promise<void> {
    await AsyncStorage.removeItem(USERS_KEY);
    await AsyncStorage.removeItem(PROFILES_KEY);
    await AsyncStorage.removeItem(REQUESTS_KEY);
    await AsyncStorage.removeItem(SUBSCRIPTIONS_KEY);
    await AsyncStorage.removeItem(IMAGES_KEY);
    await AsyncStorage.removeItem(NOTIFICATIONS_KEY);
    await AsyncStorage.removeItem(NOTIFICATION_PREFS_KEY);
    await AsyncStorage.removeItem(EMAILS_KEY);
    await AsyncStorage.removeItem(BLOCKED_USERS_KEY);
    this.images = [];
    this.notifications = [];
    this.notificationPreferences = {};
    this.emails = [];
    this.blockedUsers = {};
    this.initialized = false;
    await this.init();
  }
}

export const mockStore = new MockStore();
