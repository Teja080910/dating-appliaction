import { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { mockStore } from './mockStore';

// Helper to simulate realistic network delay (80ms - 200ms)
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to parse query parameters from URL
const parseQueryParams = (url: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return params;

  const queryString = url.slice(queryIndex + 1);
  const pairs = queryString.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  }
  return params;
};

// Helper to extract JSON body safely
const parseRequestBody = (data: any): any => {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
};

const hideTelegramFromPublicProfile = <T extends Record<string, any>>(profile: T): T => ({
  ...profile,
  telegramUsername: '',
});

const calculateAge = (dob: unknown): number | null => {
  if (!dob) return null;
  const date = new Date(String(dob));
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
};

const isUnderage = (dob: unknown, age: unknown): boolean => {
  const calculatedAge = calculateAge(dob);
  return calculatedAge !== null ? calculatedAge < 18 : Number(age) < 18;
};

const redactDebugPayload = (value: any): any => {
  if (!value || typeof value !== 'object') return value;
  const copy = Array.isArray(value) ? [...value] : { ...value };
  for (const key of Object.keys(copy)) {
    if (['password', 'mobile', 'phoneNumber', 'email', 'token', 'accessToken', 'jwt'].includes(key)) {
      copy[key] = '[REDACTED]';
    } else if (copy[key] && typeof copy[key] === 'object') {
      copy[key] = redactDebugPayload(copy[key]);
    }
  }
  return copy;
};

const REPORT_REASONS = new Set([
  'FAKE_PROFILE',
  'HARASSMENT',
  'INAPPROPRIATE_CONTENT',
  'SPAM_SCAM',
  'SAFETY_CONCERN',
]);

export const handleMockRequest = async (
  config: InternalAxiosRequestConfig
): Promise<AxiosResponse> => {
  await delay();
  await mockStore.init();

  const url = config.url || '';
  const method = (config.method || 'GET').toUpperCase();
  // Axios allows null bodies for POST requests that send values in query params.
  // Normalize null/undefined here so endpoint handlers can safely read body fields.
  const body = parseRequestBody(config.data) || {};
  const queryParams = { ...parseQueryParams(url), ...(config.params || {}) };

  console.log(`[MOCK API] 🚀 Intercepted ${method} ${url}`, {
    body: redactDebugPayload(body),
    queryParams: redactDebugPayload(queryParams),
  });

  // ----------------------------------------------------
  // 1. AUTHENTICATION & ACCESS
  // ----------------------------------------------------

  // POST /register
  if (method === 'POST' && (url.includes('/register') || url.includes('/auth/register')) && !url.includes('/verify-register')) {
    const mobile = body.mobile || body.phoneNumber;
    const name = body.name || body.username || 'Test User';
    const password = body.password;
    const confirmPassword = body.confirmPassword || password;

    if (!mobile || String(mobile).replace(/\D/g, '').length < 10) {
      throw createMockError(config, 400, 'Mobile number must be at least 10 digits.');
    }
    if (password && confirmPassword && password !== confirmPassword) {
      throw createMockError(config, 400, 'Passwords do not match.');
    }
    if (isUnderage(body.dob, body.age)) {
      throw createMockError(config, 400, 'You must be at least 18 years old to use AMARA.', 'AGE_RESTRICTION');
    }

    const { otp, sessionId } = mockStore.createOtp(mobile);
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Registration initiated. OTP sent to mobile.',
      otp, // Exposed in mock for automated testing
      sessionId,
      data: { sessionId, mobile, name },
    });
  }

  // POST /verify-register/otp or /verify-otp
  if (method === 'POST' && (url.includes('/verify-register/otp') || url.includes('/verifyOtp') || url.includes('/verify-otp'))) {
    const mobile = body.mobile || body.phoneNumber;
    const otp = body.otp;
    const sessionId = body.sessionId;

    const isValid = mockStore.verifyOtp(mobile, otp, sessionId);
    if (!isValid) {
      throw createMockError(config, 400, 'Invalid OTP. Please check and try again.');
    }

    // Find or create registered user
    let user = await mockStore.findUserByMobile(mobile);
    if (!user) {
      user = await mockStore.createUser({
        name: body.name || 'New Amara User',
        mobile,
        password: body.password || 'Password@123',
        gender: body.gender || 'man',
      });
    }

    await mockStore.setCurrentUserId(user.userId);
    const profile = await mockStore.getProfileByUserId(user.userId);
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'User registered successfully',
      token: `mock-jwt-token-${user.userId}`,
      userId: user.userId,
      user: {
        id: user.id,
        userId: user.userId,
        name: user.name,
        displayName: user.name,
        mobile: user.mobile,
        gender: user.gender,
        telegramUsername: user.telegramUsername || '',
        profile,
      },
    });
  }

  // POST /login
  if (method === 'POST' && (url.includes('/login') || url.includes('/auth/login'))) {
    const mobile = body.mobile || body.phoneNumber;
    const password = body.password;

    if (!mobile || !password) {
      throw createMockError(config, 400, 'Mobile and password are required.');
    }

    const user = await mockStore.findUserByMobile(mobile);
    if (!user) {
      throw createMockError(config, 404, 'Account not found. Please register first.');
    }

    if (user.password && user.password !== password && password !== 'Password@123') {
      throw createMockError(config, 401, 'Invalid credentials. Please verify your password.');
    }

    await mockStore.setCurrentUserId(user.userId);
    const profile = await mockStore.getProfileByUserId(user.userId);
    return createMockResponse(config, 200, {
      token: `mock-jwt-token-${user.userId}`,
      userId: user.userId,
      user: {
        id: user.id,
        userId: user.userId,
        name: user.name,
        displayName: user.name,
        mobile: user.mobile,
        gender: user.gender,
        telegramUsername: user.telegramUsername || '',
        profile,
      },
    });
  }

  // POST /auth/send-otp
  if (method === 'POST' && url.includes('/auth/send-otp')) {
    const mobile = body.mobile || body.phoneNumber;
    const { otp, sessionId } = mockStore.createOtp(mobile);
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'OTP sent successfully',
      otp,
      sessionId,
    });
  }

  // POST /forgot-password/send-otp
  if (method === 'POST' && url.includes('/forgot-password/send-otp')) {
    const mobile = body.mobile;
    const { otp, sessionId } = mockStore.createOtp(mobile);
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Password reset OTP sent successfully',
      otp,
      sessionId,
    });
  }

  // POST /forgot-password/reset
  if (method === 'POST' && url.includes('/forgot-password/reset')) {
    const { mobile, otp, newPassword } = body;
    if (!mockStore.verifyOtp(mobile, otp)) {
      throw createMockError(config, 400, 'Invalid OTP for password reset.');
    }
    const user = await mockStore.findUserByMobile(mobile);
    if (user) {
      user.password = newPassword;
    }
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Password reset successfully. You can now login with your new password.',
    });
  }

  // POST /account/deactivate
  if (method === 'POST' && url.includes('/account/deactivate')) {
    const targetUserId = queryParams.userId || body.userId;
    if (targetUserId) {
      await mockStore.deactivateUser(String(targetUserId));
    }
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Account deactivated successfully.',
    });
  }

  // PUT /account/activate
  if (method === 'PUT' && url.includes('/account/activate')) {
    const targetUserId = queryParams.userId || body.userId;
    if (targetUserId) {
      await mockStore.activateUser(String(targetUserId));
    }
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Account activated successfully.',
    });
  }

  // DELETE /account/delete
  if (method === 'DELETE' && url.includes('/account/delete')) {
    const targetUserId = queryParams.userId || body.userId;
    if (targetUserId) {
      await mockStore.deleteUser(String(targetUserId));
    }
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Account deleted successfully.',
    });
  }

  // ----------------------------------------------------
  // 2. PROFILE MANAGEMENT
  // ----------------------------------------------------

  // GET or POST /profile/me/{userId}, /profile/me, or /profile/get
  if ((method === 'GET' || method === 'POST') && (url.includes('/profile/me') || url.includes('/profile/get'))) {
    const currentStoreUserId = await mockStore.getCurrentUserId();
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1]?.split('?')[0];
    const targetUserId =
      queryParams.userId ||
      body?.userId ||
      (lastPart && lastPart !== 'me' && lastPart !== 'get' ? lastPart : '') ||
      currentStoreUserId ||
      'usr_man_101';
    let profile = await mockStore.getProfileByUserId(targetUserId);

    const isWomanRequest =
      String(targetUserId).includes('woman') ||
      String(targetUserId).startsWith('2') ||
      profile?.gender === 'woman';

    if (!profile) {
      if (isWomanRequest) {
        const women = await mockStore.getProfiles('woman');
        profile = women[0];
      } else {
        profile = await mockStore.getProfileByUserId(currentStoreUserId || 'usr_man_101');
      }
    }

    const isWoman = profile?.gender === 'woman' || isWomanRequest;

    const defaultPhotos = isWoman
      ? [
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
        ]
      : [
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
        ];

    const photos = profile?.photos && profile.photos.length > 0 ? profile.photos : defaultPhotos;

    const responsePayload = {
      id: profile?.id || (isWoman ? 201 : 101),
      userId: profile?.userId || targetUserId,
      name: profile?.name || (isWoman ? 'Ananya Roy' : 'Rahul Sharma'),
      displayName: profile?.displayName || profile?.name || (isWoman ? 'Ananya' : 'Rahul'),
      age: profile?.age || (isWoman ? 24 : 25),
      dob: profile?.dob || (isWoman ? '2002-05-14' : '2001-05-10'),
      gender: profile?.gender || (isWoman ? 'woman' : 'man'),
      bio: profile?.bio || (isWoman ? 'Architect by day, espresso enthusiast by night.' : 'Welcome to my profile!'),
      photos,
      profileImageUrl: photos[0] || '',
      telegramUsername: profile?.telegramUsername || '',
      verifiedSelfie: true,
      selfieVerified: true,
      language: profile?.language || 'English',
      height: profile?.height || 175,
      appearance: profile?.appearance || 'Athletic',
      bodyType: profile?.bodyType || 'Fit',
      smoke: profile?.smoke || 'Never',
      drink: profile?.drink || 'Socially',
      englishLevel: profile?.englishLevel || 'advanced',
      ethnicity: profile?.ethnicity || 'Asian',
      lookingFor: profile?.lookingFor || 'Long-term, Marriage',
      completion: 100,
    };

    const isOwnProfile = String(targetUserId) === String(currentStoreUserId);
    const connectionStatus = isOwnProfile
      ? 'APPROVED'
      : await mockStore.getConnectionStatus(String(currentStoreUserId), String(targetUserId));
    if (!isOwnProfile && connectionStatus !== 'APPROVED') {
      responsePayload.telegramUsername = '';
    }

    return createMockResponse(config, 200, responsePayload);
  }

  // POST or GET /profile/completion
  if (url.includes('/profile/completion')) {
    return createMockResponse(config, 200, 100);
  }

  // POST /profile/{userId}/setup
  if (method === 'POST' && url.includes('/setup')) {
    const urlParts = url.split('/');
    const setupIndex = urlParts.indexOf('setup');
    const targetUserId = setupIndex > 0 ? urlParts[setupIndex - 1] : body.userId || 'usr_man_101';

    let profileData = body;
    if (body.data && typeof body.data === 'string') {
      try {
        profileData = JSON.parse(body.data);
      } catch {
        profileData = body;
      }
    }

    if (isUnderage(profileData.dob, profileData.age)) {
      throw createMockError(config, 400, 'You must be at least 18 years old to use AMARA.', 'AGE_RESTRICTION');
    }

    const saved = await mockStore.saveProfile({
      userId: targetUserId,
      ...profileData,
    });

    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Profile setup completed',
      profile: saved,
      data: saved,
    });
  }

  // PUT /profile/update-basic, PUT /profile/update-details, PUT /profile/update-preferences
  if ((method === 'PUT' || method === 'POST') && url.includes('/profile/update')) {
    const targetUserId = body.userId || queryParams.userId || (await mockStore.getCurrentUserId()) || 'usr_man_101';
    if (isUnderage(body.dob, body.age)) {
      throw createMockError(config, 400, 'You must be at least 18 years old to use AMARA.', 'AGE_RESTRICTION');
    }
    const updated = await mockStore.saveProfile({ ...body, userId: targetUserId });
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Profile updated successfully',
      data: updated,
    });
  }

  // POST /profile/upload-image
  if (method === 'POST' && url.includes('/upload-image')) {
    const targetUserId = queryParams.userId || body.userId || 'usr_man_101';
    let imageUri = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80';

    if (config.data && (config.data as any)._parts) {
      const parts = (config.data as any)._parts;
      for (const [key, val] of parts) {
        if (key === 'image' && val && val.uri) {
          imageUri = val.uri;
          break;
        }
      }
    }

    const newImage = await mockStore.addUserImage(targetUserId, imageUri);
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Image uploaded successfully',
      id: newImage.id,
      imageUrl: newImage.imageUrl,
      data: newImage,
    });
  }

  // GET /users/{userId}/images
  if (method === 'GET' && url.includes('/images') && url.includes('/users/')) {
    const match = url.match(/\/users\/([^/]+)\/images/);
    const targetUserId = match ? match[1] : (queryParams.userId || 'usr_man_101');
    const images = await mockStore.getUserImages(targetUserId);
    return createMockResponse(config, 200, images);
  }

  // PUT /users/{userId}/profile-photo/{imageId}
  if (method === 'PUT' && url.includes('/profile-photo/')) {
    const match = url.match(/\/users\/([^/]+)\/profile-photo\/([^/?]+)/);
    if (match) {
      await mockStore.setProfilePhoto(match[1], Number(match[2]));
    }
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Profile photo updated',
    });
  }

  // DELETE /users/images/{imageId} or /users/{userId}/images/{imageId}
  if (method === 'DELETE' && url.includes('/images/')) {
    const match = url.match(/\/images\/([^/?]+)/);
    if (match) {
      await mockStore.deleteUserImage(Number(match[1]));
    }
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Image deleted',
    });
  }

  // POST /profile/selfie/upload
  if (method === 'POST' && url.includes('/profile/selfie/upload')) {
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Selfie uploaded (Verification pending)',
    });
  }

  // PUT /profile/selfie/verify
  if ((method === 'PUT' || method === 'POST') && url.includes('/profile/selfie/verify')) {
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Verified',
    });
  }

  // POST /profile/gender-orientation
  if (method === 'POST' && url.includes('/profile/gender-orientation')) {
    const targetUserId = body.userId || (await mockStore.getCurrentUserId());
    const profile = await mockStore.getProfileByUserId(targetUserId);
    if (profile) {
      if (body.gender) profile.gender = body.gender;
      await mockStore.saveProfile(profile);
    }
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Gender and orientation updated',
      data: body,
    });
  }

  // ----------------------------------------------------
  // 3. DISCOVERY & BROWSING (MEN BROWSE WOMEN ONLY)
  // ----------------------------------------------------

  // GET /home/{userId}
  if (method === 'GET' && url.includes('/home/')) {
    const womenProfiles = await mockStore.getProfiles('woman');
    return createMockResponse(config, 200, womenProfiles.map(hideTelegramFromPublicProfile));
  }

  // GET /dashboard/recent or GET /dashboard/online
  if (method === 'GET' && (url.includes('/dashboard/recent') || url.includes('/dashboard/online') || url.includes('/dashboard'))) {
    // Only return women profiles as mandated by PRD FR-12 / BR-04
    const womenProfiles = await mockStore.getProfiles('woman');
    const visibleProfiles = url.includes('/dashboard/online')
      ? womenProfiles.filter((profile) => profile.online === true)
      : womenProfiles;
    const page = Number(queryParams?.page ?? 0);
    const size = Number(queryParams?.size ?? 20);
    const start = page * size;
    const paged = visibleProfiles.slice(start, start + size);
    return createMockResponse(config, 200, paged.map(hideTelegramFromPublicProfile));
  }

  // POST /search or POST /users/filter
  if (method === 'POST' && (url.includes('/search') || url.includes('/users/filter') || url.includes('/searchCriteria'))) {
    const womenProfiles = await mockStore.getProfiles('woman');
    let filtered = [...womenProfiles];

    // Filter by Age
    if (Number.isFinite(Number(body.minAge))) {
      filtered = filtered.filter(p => (p.age || 24) >= Number(body.minAge));
    }
    if (Number.isFinite(Number(body.maxAge))) {
      filtered = filtered.filter(p => (p.age || 24) <= Number(body.maxAge));
    }

    // Filter by Height
    if (Number.isFinite(Number(body.minHeight))) {
      filtered = filtered.filter(p => (p.height || 165) >= Number(body.minHeight));
    }
    if (Number.isFinite(Number(body.maxHeight))) {
      filtered = filtered.filter(p => (p.height || 165) <= Number(body.maxHeight));
    }

    // Filter by Ethnicity
    if (body.ethnicity && (Array.isArray(body.ethnicity) ? body.ethnicity.length > 0 : Boolean(body.ethnicity))) {
      const ethList: any[] = Array.isArray(body.ethnicity) ? body.ethnicity : [body.ethnicity];
      filtered = filtered.filter(p => !p.ethnicity || ethList.some((e: any) => String(p.ethnicity).toLowerCase().includes(String(e).toLowerCase())));
    }

    // Filter by Body Type
    if (body.bodyType && (Array.isArray(body.bodyType) ? body.bodyType.length > 0 : Boolean(body.bodyType))) {
      const btList: any[] = Array.isArray(body.bodyType) ? body.bodyType : [body.bodyType];
      filtered = filtered.filter(p => !p.bodyType || btList.some((b: any) => String(p.bodyType).toLowerCase().includes(String(b).toLowerCase())));
    }

    // Filter by Smoke / Drink
    if (body.smoke) {
      filtered = filtered.filter(p => !p.smoke || String(p.smoke).toLowerCase() === String(body.smoke).toLowerCase());
    }
    if (body.drink) {
      filtered = filtered.filter(p => !p.drink || String(p.drink).toLowerCase() === String(body.drink).toLowerCase());
    }

    // Filter by Appearance
    if (body.appearance && (Array.isArray(body.appearance) ? body.appearance.length > 0 : Boolean(body.appearance))) {
      const appList: any[] = Array.isArray(body.appearance) ? body.appearance : [body.appearance];
      filtered = filtered.filter(p => !p.appearance || appList.some((a: any) => String(p.appearance).toLowerCase().includes(String(a).toLowerCase())));
    }

    // Filter by Language
    if (body.language && (Array.isArray(body.language) ? body.language.length > 0 : Boolean(body.language))) {
      const langList: any[] = Array.isArray(body.language) ? body.language : [body.language];
      filtered = filtered.filter(p => !p.language || langList.some((l: any) => String(p.language).toLowerCase().includes(String(l).toLowerCase())));
    }

    // Filter by English Level
    if (body.englishLevel && (Array.isArray(body.englishLevel) ? body.englishLevel.length > 0 : Boolean(body.englishLevel))) {
      const lvlList: any[] = Array.isArray(body.englishLevel) ? body.englishLevel : [body.englishLevel];
      filtered = filtered.filter(p => !p.englishLevel || lvlList.some((l: any) => String(p.englishLevel).toLowerCase().includes(String(l).toLowerCase())));
    }

    // Filter by Looking For
    if (body.lookingFor && (Array.isArray(body.lookingFor) ? body.lookingFor.length > 0 : Boolean(body.lookingFor))) {
      const lfList: any[] = Array.isArray(body.lookingFor) ? body.lookingFor : [body.lookingFor];
      filtered = filtered.filter(p => !p.lookingFor || lfList.some((lf: any) => String(p.lookingFor).toLowerCase().includes(String(lf).toLowerCase())));
    }

    // Filter by Online Only
    if (body.onlyOnline) {
      filtered = filtered.filter(p => Boolean(p.online));
    }

    // Filter by Search Query
    if (body.query && typeof body.query === 'string') {
      const q = body.query.toLowerCase().trim();
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.displayName && p.displayName.toLowerCase().includes(q)) ||
        (p.bio && p.bio.toLowerCase().includes(q))
      );
    }

    const finalResult = filtered.map(hideTelegramFromPublicProfile);

    // Return Pageable format supported by normalizePagedUsersResponse
    return createMockResponse(config, 200, {
      content: finalResult,
      totalElements: finalResult.length,
      totalPages: 1,
      size: body.size || 20,
      number: body.page || 0,
      first: true,
      last: true,
      empty: finalResult.length === 0,
    });
  }

  // ----------------------------------------------------
  // 4. DATING REQUESTS & CONNECTIONS
  // ----------------------------------------------------

  // POST /connections/send
  if (method === 'POST' && (url.includes('/connections/send') || url.includes('/auth/user/send'))) {
    const senderId = body.senderId || body.userId;
    const receiverId = body.receiverId || body.targetUserId;

    if (!senderId || !receiverId) {
      throw createMockError(config, 400, 'senderId and receiverId are required.');
    }
    if (String(senderId) === String(receiverId)) {
      throw createMockError(config, 400, 'You cannot send a dating request to yourself.');
    }

    try {
      const newRequest = await mockStore.sendRequest(String(senderId), String(receiverId));
      return createMockResponse(config, 201, {
        status: 'success',
        message: 'Request Sent',
        data: newRequest,
      });
    } catch (err: any) {
      const message = err.message || 'Duplicate request';
      const status = message.includes('BR-01') ? 403 : 409;
      throw createMockError(config, status, message);
    }
  }

  // GET /connections/sent
  if (method === 'GET' && (url.includes('/connections/sent') || url.includes('/auth/user/sendList'))) {
    const currentStoreUserId = await mockStore.getCurrentUserId();
    const targetUserId = queryParams.userId || currentStoreUserId || 'usr_man_101';
    const sent = await mockStore.getSentRequests(String(targetUserId));
    return createMockResponse(config, 200, sent);
  }

  // GET /connections/received
  if (method === 'GET' && url.includes('/connections/received')) {
    const currentStoreUserId = await mockStore.getCurrentUserId();
    const targetUserId = queryParams.userId || currentStoreUserId || 'usr_woman_201';
    const received = await mockStore.getReceivedRequests(String(targetUserId));
    return createMockResponse(config, 200, received);
  }

  // PUT /connections/accept
  if ((method === 'PUT' || method === 'POST') && url.includes('/connections/accept')) {
    const requestId = body.requestId || queryParams.requestId;
    const senderId = body.senderId || queryParams.senderId;
    const receiverId = body.userId || body.receiverId || queryParams.userId;

    try {
      const approved = await mockStore.acceptRequest(requestId || senderId, receiverId);
      return createMockResponse(config, 200, {
        status: 'success',
        message: 'Request APPROVED successfully. Telegram contact is now unlocked!',
        data: approved,
      });
    } catch (err: any) {
      throw createMockError(config, 404, err.message || 'Request not found');
    }
  }

  // GET /connections/status
  if (method === 'GET' && url.includes('/connections/status')) {
    const user1 = queryParams.user1 || queryParams.senderId || '';
    const user2 = queryParams.user2 || queryParams.receiverId || '';
    const status = await mockStore.getRequestStatus(user1, user2);
    return createMockResponse(config, 200, { status });
  }

  // GET /connections/list
  if (method === 'GET' && url.includes('/connections/list')) {
    const currentStoreUserId = await mockStore.getCurrentUserId();
    const targetUserId = queryParams.userId || currentStoreUserId || 'usr_woman_201';
    const approved = await mockStore.getApprovedConnections(String(targetUserId));
    return createMockResponse(config, 200, approved);
  }

  // ----------------------------------------------------
  // 5. TELEGRAM HANDOFF
  // ----------------------------------------------------

  // POST /telegram/connect
  if (method === 'POST' && url.includes('/telegram/connect')) {
    const userId = body.userId || queryParams.userId || 'usr_man_101';
    const telegramUsername = (body.telegramUsername || queryParams.username || body.username || '').replace('@', '');
    if (!telegramUsername.trim()) {
      throw createMockError(config, 400, 'telegramUsername is required.');
    }

    const profile = await mockStore.getProfileByUserId(userId);
    if (profile) {
      profile.telegramUsername = telegramUsername;
      await mockStore.saveProfile(profile);
    }
    const user = await mockStore.findUserById(userId);
    if (user) {
      user.telegramUsername = telegramUsername;
    }

    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Telegram connected successfully',
      telegramUsername,
    });
  }

  // GET /telegram/link
  if (method === 'GET' && url.includes('/telegram/link')) {
    const currentStoreUserId = await mockStore.getCurrentUserId();
    const targetUserId = queryParams.targetUserId || queryParams.userId;

    if (targetUserId && currentStoreUserId && String(targetUserId) !== String(currentStoreUserId)) {
      const status = await mockStore.getConnectionStatus(String(currentStoreUserId), String(targetUserId));
      if (status !== 'APPROVED') {
        throw createMockError(config, 403, 'Telegram contact is locked until the connection request is approved.');
      }
    }

    const resolvedId = targetUserId || currentStoreUserId || 'usr_woman_201';
    const profile = await mockStore.getProfileByUserId(String(resolvedId));
    const username = profile?.telegramUsername || '';
    const isOwnLink = !targetUserId || String(targetUserId) === String(currentStoreUserId);
    return createMockResponse(config, 200, {
      telegramUsername: username,
      link: username ? `https://t.me/${username}` : (isOwnLink ? 'https://t.me/AmaraDatingBot' : ''),
    });
  }

  // DELETE /telegram/disconnect
  if (method === 'DELETE' && url.includes('/telegram/disconnect')) {
    const currentStoreUserId = await mockStore.getCurrentUserId();
    const targetUserId = queryParams.userId || currentStoreUserId || 'usr_man_101';
    await mockStore.disconnectTelegram(String(targetUserId));
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Telegram disconnected successfully',
      telegramUsername: '',
    });
  }

  // ----------------------------------------------------
  // 6. SUBSCRIPTIONS & MONETIZATION (RAZORPAY)
  // ----------------------------------------------------

  // POST /razorpay/create-order
  if (method === 'POST' && (url.includes('/razorpay/create-order') || url.includes('/order/create'))) {
    const { userId, plan = 'GOLD' } = body;
    const plans = await mockStore.getPlans();
    const selectedPlan = plans.find((p) => p.id === plan) || plans[1];
    const amount = selectedPlan.price * 100; // in paise

    return createMockResponse(config, 200, {
      orderId: `order_rzp_${Date.now()}`,
      id: `order_rzp_${Date.now()}`,
      amount,
      currency: 'INR',
      key: 'rzp_test_amara_mock_key',
      plan: selectedPlan.id,
      userId,
    });
  }

  // POST /razorpay/verify
  if (method === 'POST' && (url.includes('/razorpay/verify') || url.includes('/verify-payment'))) {
    const userId = body.userId || queryParams.userId;
    const plan = body.plan || queryParams.plan || 'GOLD';
    const orderId = body.orderId || queryParams.orderId;
    const paymentId = body.paymentId || queryParams.paymentId;
    const signature = body.signature || queryParams.signature;
    if (!orderId || !paymentId || !signature || !String(signature).startsWith('sig_mock_')) {
      throw createMockError(config, 400, 'Payment verification requires a valid orderId, paymentId, and signature.');
    }
    const activeUserId = userId || await mockStore.getCurrentUserId();
    const sub = await mockStore.activateSubscription(
      activeUserId,
      plan,
      orderId,
      paymentId
    );

    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Payment verified and subscription activated successfully!',
      userId: activeUserId,
      subscription: sub,
      data: sub,
    });
  }

  // GET /subscriber/status
  if (method === 'GET' && (url.includes('/subscriber/status') || url.includes('/subscription/status'))) {
    const targetUserId = queryParams.userId || 'usr_man_101';
    const sub = await mockStore.getSubscriptionStatus(String(targetUserId));

    if (sub && sub.status === 'ACTIVE') {
      const plan = String(sub.plan || '').toUpperCase();
      return createMockResponse(config, 200, {
        active: true,
        plan,
        planType: plan,
        startDate: sub.startDate,
        endDate: sub.endDate,
        status: 'ACTIVE',
        priorityHandoff: plan === 'GOLD' || plan === 'PREMIUM',
        eliteBadge: plan === 'PREMIUM',
        dailyRequestLimit: plan === 'BASIC' ? 10 : plan === 'GOLD' ? 20 : null,
      });
    }

    return createMockResponse(config, 200, {
      active: false,
      plan: null,
      startDate: null,
      endDate: null,
      status: 'EXPIRED',
    });
  }

  // GET /subscriber/remaining-days
  if (method === 'GET' && (url.includes('/subscriber/remaining-days') || url.includes('/remaining-days'))) {
    const targetUserId = queryParams.userId || 'usr_man_101';
    const sub = await mockStore.getSubscriptionStatus(String(targetUserId));
    let remainingDays = 0;
    if (sub && sub.endDate) {
      const diff = new Date(sub.endDate).getTime() - Date.now();
      remainingDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    return createMockResponse(config, 200, remainingDays);
  }

  // POST /subscriber/activate
  if (method === 'POST' && url.includes('/subscriber/activate')) {
    const targetUserId = queryParams.userId || body.userId || (await mockStore.getCurrentUserId());
    const plan = queryParams.plan || body.plan || 'GOLD';
    const sub = await mockStore.activateSubscription(String(targetUserId), plan);
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Subscription activated',
      subscription: sub,
      data: sub,
    });
  }

  // POST /razorpay/webhook
  if (method === 'POST' && url.includes('/razorpay/webhook')) {
    return createMockResponse(config, 200, { status: 'received' });
  }

  // ----------------------------------------------------
  // 7. LOCATION & GEOLOCATION
  // ----------------------------------------------------

  // POST /location/add
  if (method === 'POST' && url.includes('/location/add')) {
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Location added successfully',
      data: {
        id: Date.now(),
        ...body,
      },
    });
  }

  // PUT /location/switch
  if (method === 'PUT' && url.includes('/location/switch')) {
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Active location switched',
    });
  }

  // GET /location/history/{userId}
  if (method === 'GET' && url.includes('/location/history')) {
    return createMockResponse(config, 200, [
      {
        id: 1,
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        lat: 12.9716,
        lng: 77.5946,
        isCurrent: true,
      },
    ]);
  }

  // GET /location/current/{userId}
  if (method === 'GET' && url.includes('/location/current')) {
    const match = url.match(/\/location\/current\/([^/?]+)/);
    const targetUserId = match ? match[1] : (queryParams.userId || 'usr_man_101');
    return createMockResponse(config, 200, {
      id: 1,
      userId: targetUserId,
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      lat: 12.9716,
      lng: 77.5946,
      isCurrent: true,
    });
  }

  // GET /location/nearby
  if (method === 'GET' && url.includes('/location/nearby')) {
    const womenProfiles = await mockStore.getProfiles('woman');
    return createMockResponse(config, 200, womenProfiles);
  }

  // ----------------------------------------------------
  // 8. SUPPORT TICKETS
  // ----------------------------------------------------

  // POST /support/create
  if (method === 'POST' && url.includes('/support/create')) {
    const userId = String(body.userId || queryParams.userId || (await mockStore.getCurrentUserId()));
    if (!String(body.subject || '').trim() || !String(body.message || '').trim()) {
      throw createMockError(config, 400, 'Subject and message are required.');
    }
    const ticket = await mockStore.createSupportTicket(userId, body.subject, body.message);
    return createMockResponse(config, 201, {
      status: 'success',
      message: 'Support ticket created successfully.',
      data: ticket,
      ticket,
    });
  }

  // GET /support/my
  if (method === 'GET' && url.includes('/support/my')) {
    const userId = String(queryParams.userId || (await mockStore.getCurrentUserId()));
    return createMockResponse(config, 200, await mockStore.getSupportTickets(userId));
  }

  // GET /support/status?status=OPEN|CLOSED
  if (method === 'GET' && url.includes('/support/status')) {
    const userId = String(queryParams.userId || (await mockStore.getCurrentUserId()));
    return createMockResponse(
      config,
      200,
      await mockStore.getSupportTickets(userId, queryParams.status),
    );
  }

  // PUT /support/close/{ticketId}
  if (method === 'PUT' && url.includes('/support/close/')) {
    const match = url.match(/\/support\/close\/([^/?]+)/);
    const ticketId = match ? Number(match[1]) : 0;
    const userId = String(queryParams.userId || body.userId || (await mockStore.getCurrentUserId()));
    const ticket = await mockStore.closeSupportTicket(ticketId, userId);
    if (!ticket) {
      throw createMockError(config, 404, 'Support ticket not found.');
    }
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Support ticket closed successfully.',
      data: ticket,
      ticket,
    });
  }

  // ----------------------------------------------------
  // 9. PRIVACY, NOTIFICATIONS & ONLINE STATUS
  // ----------------------------------------------------

  // GET /privacy/status
  if (method === 'GET' && url.includes('/privacy/status')) {
    return createMockResponse(config, 200, { accepted: true, status: 'ACCEPTED' });
  }

  // POST /privacy/accept
  if (method === 'POST' && url.includes('/privacy/accept')) {
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Privacy policy accepted',
    });
  }

  // GET /privacy/details
  if (method === 'GET' && url.includes('/privacy/details')) {
    return createMockResponse(config, 200, {
      policy: 'AMARA is committed to protecting your privacy. We never share your phone number or contact info before mutual agreement.',
    });
  }

  // GET /notification
  if (method === 'GET' && url.includes('/notification') && !url.includes('/read')) {
    return createMockResponse(config, 200, [
      {
        id: 1,
        title: 'Welcome to AMARA',
        message: 'Your profile has been created successfully.',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  // PUT /notification/read/{id}
  if (method === 'PUT' && url.includes('/notification/read/')) {
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Notification marked as read',
    });
  }

  // POST /notification/push
  if (method === 'POST' && url.includes('/notification/push')) {
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Notification dispatched',
    });
  }

  // PUT /status/online
  if (method === 'PUT' && url.includes('/status/online')) {
    const userId = String(queryParams.userId || '');
    if (userId) await mockStore.saveProfile({ userId, online: true });
    return createMockResponse(config, 200, {
      status: 'online',
      userId,
    });
  }

  // PUT /status/offline
  if (method === 'PUT' && url.includes('/status/offline')) {
    const userId = String(queryParams.userId || '');
    if (userId) await mockStore.saveProfile({ userId, online: false });
    return createMockResponse(config, 200, {
      status: 'offline',
      userId,
    });
  }

  // ----------------------------------------------------
  // 10. SAFETY & REPORTS
  // ----------------------------------------------------

  // POST /reports/report or POST /report
  if (method === 'POST' && (url.includes('/reports/report') || url.includes('/report'))) {
    const reason = String(body.reason || '').trim().toUpperCase();
    if (!body.byUserId || !body.targetUserId || !REPORT_REASONS.has(reason)) {
      throw createMockError(
        config,
        400,
        'byUserId, targetUserId, and a valid report reason are required.',
        'INVALID_REPORT',
      );
    }

    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Profile has been reported. Our safety team will review it shortly.',
      data: {
        id: `report_${Date.now()}`,
        reportedById: String(body.byUserId),
        reportedUserId: String(body.targetUserId),
        reason,
        message: String(body.message || ''),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      },
    });
  }

  // GET /reports/my
  if (method === 'GET' && url.includes('/reports/my')) {
    return createMockResponse(config, 200, []);
  }

  // GET /reports/against
  if (method === 'GET' && url.includes('/reports/against')) {
    return createMockResponse(config, 200, []);
  }

  // PUT /reports/resolve/{reportId}
  if (method === 'PUT' && url.includes('/reports/resolve/')) {
    return createMockResponse(config, 200, {
      status: 'success',
      message: 'Report resolved successfully.',
    });
  }

  // Unknown routes must fail loudly so missing backend contract work is visible during development.
  console.warn(`[MOCK API] Unknown endpoint: ${method} ${url}`);
  throw createMockError(config, 404, `Mock endpoint not found: ${method} ${url}`);
};

// Helper to formulate a standard Axios response object
const createMockResponse = (
  config: InternalAxiosRequestConfig,
  status: number,
  data: any
): AxiosResponse => {
  return {
    data,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    headers: { 'content-type': 'application/json' },
    config,
  };
};

// Helper to create Axios-compatible error
const createMockError = (
  config: InternalAxiosRequestConfig,
  status: number,
  message: string,
  code?: string,
) => {
  const error: any = new Error(message);
  error.config = config;
  error.response = {
    data: { message, error: message, ...(code ? { code } : {}) },
    status,
    statusText: status === 400 ? 'Bad Request' : status === 401 ? 'Unauthorized' : status === 404 ? 'Not Found' : 'Error',
    headers: { 'content-type': 'application/json' },
    config,
  };
  return error;
};
