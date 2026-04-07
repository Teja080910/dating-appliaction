import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_BASE_URL = process.env.SEED_BASE_URL || 'http://165.22.218.70:9395';
const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || 'Seed@123';
const DEFAULT_COUNT = Number(process.env.SEED_COUNT || 100);
const STATIC_OTP = process.env.SEED_OTP || '';

const maleNames = [
  'Arjun', 'Kabir', 'Rohan', 'Vivaan', 'Aarav', 'Ishaan', 'Aditya', 'Reyansh',
  'Kunal', 'Rahul', 'Varun', 'Samar', 'Manav', 'Nikhil', 'Harsh', 'Ayush',
  'Dev', 'Shaurya', 'Vihaan', 'Yash', 'Dhruv', 'Krish', 'Mohit', 'Siddharth',
];

const femaleNames = [
  'Aanya', 'Kiara', 'Ananya', 'Ira', 'Myra', 'Sara', 'Siya', 'Riya',
  'Anika', 'Pihu', 'Tara', 'Meera', 'Naina', 'Ishita', 'Kavya', 'Prisha',
  'Diya', 'Aditi', 'Saanvi', 'Navya', 'Ritika', 'Sneha', 'Trisha', 'Mira',
];

const bios = {
  male: [
    'Travel lover, cafe explorer, and someone who values honest conversations.',
    'Calm energy, ambitious mindset, and always up for a meaningful connection.',
    'Gym, work, family, and weekends with good food. Looking for something real.',
    'A little old-school, a little adventurous, and serious about genuine chemistry.',
  ],
  female: [
    'Soft heart, sharp mind, and happiest around thoughtful people.',
    'I enjoy deep talks, elegant evenings, and building a life with intention.',
    'Creative, grounded, and looking for warmth, respect, and real effort.',
    'Books, music, travel, and a calm connection over loud chaos any day.',
  ],
};

const cities = [
  { city: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.076, lng: 72.8777 },
  { city: 'Delhi', state: 'Delhi', country: 'India', lat: 28.6139, lng: 77.209 },
  { city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lng: 77.5946 },
  { city: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.385, lng: 78.4867 },
  { city: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lng: 73.8567 },
  { city: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: 23.0225, lng: 72.5714 },
];

const appearances = ['Elegant', 'Charming', 'Natural', 'Stylish', 'Classic'];
const bodyTypes = ['Slim', 'Athletic', 'Average', 'Fit', 'Curvy'];
const ethnicities = ['South Asian', 'Indian', 'Asian', 'Mixed'];
const englishLevels = ['Beginner', 'Intermediate', 'Advanced', 'Native'];
const languages = ['English, Hindi', 'Hindi, English', 'English, Punjabi', 'English, Marathi'];
const lookingForByGender = {
  male: 'Relationship',
  female: 'Relationship',
};

const smokeOptions = ['No', 'Occasionally'];
const drinkOptions = ['No', 'Occasionally', 'Socially'];

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const getArgValue = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};

const count = Number(getArgValue('--count', DEFAULT_COUNT));
const maleCount = Number(getArgValue('--male', Math.floor(count / 2)));
const femaleCount = Number(getArgValue('--female', count - maleCount));
const dryRun = hasFlag('--dry-run');
const outFile = getArgValue('--out', '');
const startMobile = Number(getArgValue('--start-mobile', '9876501000'));

const pad = (value) => String(value).padStart(2, '0');
const randomFrom = (items, index) => items[index % items.length];

const createDob = (index) => {
  const year = 1990 + (index % 10);
  const month = (index % 12) + 1;
  const day = ((index * 3) % 27) + 1;
  return `${year}-${pad(month)}-${pad(day)}`;
};

const createAge = (dob) => {
  const year = Number(String(dob).slice(0, 4));
  return 2026 - year;
};

const createMobile = (offset) => String(startMobile + offset);

const buildSeedProfile = (gender, index, offset) => {
  const sourceNames = gender === 'male' ? maleNames : femaleNames;
  const city = randomFrom(cities, index);
  const name = `${randomFrom(sourceNames, index)} ${gender === 'male' ? 'Singh' : 'Sharma'} ${index + 1}`;
  const dob = createDob(index);

  return {
    gender,
    name,
    mobile: createMobile(offset),
    password: DEFAULT_PASSWORD,
    confirmPassword: DEFAULT_PASSWORD,
    otp: STATIC_OTP,
    displayName: name.split(' ')[0],
    bio: randomFrom(bios[gender], index),
    age: createAge(dob),
    dob,
    language: randomFrom(languages, index),
    appearance: randomFrom(appearances, index),
    bodyType: randomFrom(bodyTypes, index),
    height: gender === 'male' ? 168 + (index % 15) : 154 + (index % 12),
    englishLevel: randomFrom(englishLevels, index),
    ethnicity: randomFrom(ethnicities, index),
    lookingFor: lookingForByGender[gender],
    smoke: randomFrom(smokeOptions, index),
    drink: randomFrom(drinkOptions, index),
    orientation: 'straight',
    location: city,
  };
};

const buildDataset = () => {
  const profiles = [];
  let offset = 0;

  for (let i = 0; i < maleCount; i += 1) {
    profiles.push(buildSeedProfile('male', i, offset));
    offset += 1;
  }

  for (let i = 0; i < femaleCount; i += 1) {
    profiles.push(buildSeedProfile('female', i, offset));
    offset += 1;
  }

  return profiles;
};

const safeJsonParse = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

const request = async (pathname, options = {}, token = '') => {
  const headers = {
    Accept: '*/*',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${DEFAULT_BASE_URL}${pathname}`, {
    ...options,
    headers,
  });

  const body = await safeJsonParse(response);
  if (!response.ok) {
    const message =
      body?.message ||
      body?.error ||
      (typeof body === 'string' ? body : JSON.stringify(body));
    throw new Error(`${response.status} ${pathname}: ${message}`);
  }

  return body;
};

const extractToken = (payload) =>
  payload?.token ||
  payload?.accessToken ||
  payload?.access_token ||
  payload?.jwt ||
  payload?.data?.token ||
  payload?.data?.accessToken ||
  '';

const extractUserId = (payload) =>
  payload?.userId ||
  payload?.id ||
  payload?.user?.id ||
  payload?.data?.userId ||
  payload?.data?.id ||
  null;

const registerAndVerify = async (profile) => {
  const registerBody = {
    name: profile.name,
    mobile: profile.mobile,
    password: profile.password,
    confirmPassword: profile.confirmPassword,
    otp: '',
  };

  const registerResult = await request('/register', {
    method: 'POST',
    body: JSON.stringify(registerBody),
  });

  const sessionId = registerResult?.sessionId;
  if (!sessionId) {
    throw new Error(`Missing sessionId for ${profile.mobile}`);
  }

  if (!STATIC_OTP) {
    throw new Error(`OTP required for ${profile.mobile}. Set SEED_OTP and rerun.`);
  }

  const verifyResult = await request('/verify-register/otp', {
    method: 'POST',
    body: JSON.stringify({
      mobile: profile.mobile,
      otp: STATIC_OTP,
      sessionId,
    }),
  });

  let token = extractToken(verifyResult);
  let userId = extractUserId(verifyResult);

  if (!token || !userId) {
    const loginResult = await request('/login', {
      method: 'POST',
      body: JSON.stringify({
        mobile: profile.mobile,
        password: profile.password,
      }),
    });
    token = token || extractToken(loginResult);
    userId = userId || extractUserId(loginResult);
  }

  if (!token || !userId) {
    throw new Error(`Could not resolve token/userId for ${profile.mobile}`);
  }

  return { token, userId: Number(userId) };
};

const setupProfile = async (profile, auth) => {
  await request(`/privacy/accept?userId=${auth.userId}`, { method: 'POST' }, auth.token);

  await request('/profile/gender-orientation', {
    method: 'POST',
    body: JSON.stringify({
      userId: auth.userId,
      gender: profile.gender,
      orientation: profile.orientation,
    }),
  }, auth.token);

  await request('/profile/update-basic', {
    method: 'PUT',
    body: JSON.stringify({
      userId: auth.userId,
      displayName: profile.displayName,
      bio: profile.bio,
      age: profile.age,
    }),
  }, auth.token);

  await request('/profile/update-details', {
    method: 'PUT',
    body: JSON.stringify({
      userId: auth.userId,
      language: profile.language,
      appearance: profile.appearance,
      bodyType: profile.bodyType,
      height: profile.height,
    }),
  }, auth.token);

  await request('/profile/update-preferences', {
    method: 'PUT',
    body: JSON.stringify({
      userId: auth.userId,
      lookingFor: profile.lookingFor,
      smoke: profile.smoke,
      drink: profile.drink,
    }),
  }, auth.token);

  await request('/location/add', {
    method: 'POST',
    body: JSON.stringify({
      userId: auth.userId,
      city: profile.location.city,
      state: profile.location.state,
      country: profile.location.country,
      lat: profile.location.lat,
      lng: profile.location.lng,
    }),
  }, auth.token);

  return request(`/profile/me/${auth.userId}`, { method: 'GET' }, auth.token);
};

const run = async () => {
  const dataset = buildDataset();

  if (outFile) {
    const target = path.resolve(process.cwd(), outFile);
    await fs.writeFile(target, JSON.stringify(dataset, null, 2), 'utf8');
    console.log(`Payload preview written to ${target}`);
  }

  if (dryRun) {
    console.log(JSON.stringify({
      count: dataset.length,
      maleCount,
      femaleCount,
      sample: dataset.slice(0, 3),
    }, null, 2));
    return;
  }

  if (!STATIC_OTP) {
    throw new Error('SEED_OTP is required for live creation because /verify-register/otp rejects invalid OTP.');
  }

  const results = [];
  for (const [index, profile] of dataset.entries()) {
    try {
      const auth = await registerAndVerify(profile);
      const liveProfile = await setupProfile(profile, auth);
      results.push({
        index: index + 1,
        mobile: profile.mobile,
        userId: auth.userId,
        displayName: liveProfile?.displayName || profile.displayName,
        gender: profile.gender,
        status: 'created',
      });
      console.log(`[${index + 1}/${dataset.length}] created ${profile.mobile} -> ${auth.userId}`);
    } catch (error) {
      results.push({
        index: index + 1,
        mobile: profile.mobile,
        gender: profile.gender,
        status: 'failed',
        error: String(error.message || error),
      });
      console.error(`[${index + 1}/${dataset.length}] failed ${profile.mobile}: ${error.message || error}`);
    }
  }

  const summary = {
    count: dataset.length,
    created: results.filter((item) => item.status === 'created').length,
    failed: results.filter((item) => item.status === 'failed').length,
    results,
  };

  console.log(JSON.stringify(summary, null, 2));
};

run().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
