import users from './users.json';
import profiles from './profiles.json';
import requests from './requests.json';
import subscriptions from './subscriptions.json';

export interface MockUser {
  id: number;
  userId: string;
  name: string;
  mobile: string;
  password?: string;
  gender: 'man' | 'woman' | string;
  telegramUsername?: string;
  createdAt: string;
}

export interface MockProfile {
  id?: number;
  userId: string;
  displayName: string;
  name: string;
  age: number;
  dob?: string;
  gender: 'man' | 'woman' | string;
  bio: string;
  photos: string[];
  photo?: string;
  online?: boolean;
  currentCity?: string;
  telegramUsername?: string;
  language?: string;
  height?: number;
  appearance?: string;
  bodyType?: string;
  smoke?: string;
  drink?: string;
  englishLevel?: string;
  ethnicity?: string;
  lookingFor?: string;
  kidCount?: string;
  netWorth?: string;
}

export interface MockRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'APPROVED';
  createdAt: string;
  updatedAt: string;
  sender?: Partial<MockProfile>;
  receiver?: Partial<MockProfile>;
}

export interface MockSubscriptionPlan {
  id: 'BASIC' | 'GOLD' | 'PREMIUM' | string;
  name: string;
  durationMonths: number;
  price: number;
  tagline?: string;
  popular?: boolean;
  features: string[];
  gradient?: string[];
}

export interface MockUserSubscription {
  id: string;
  userId: string;
  plan: 'BASIC' | 'GOLD' | 'PREMIUM' | string;
  status: 'ACTIVE' | 'EXPIRED';
  startDate: string;
  endDate: string;
  orderId?: string;
  paymentId?: string;
  amount: number;
  createdAt: string;
}

export const mockData = {
  users: users as MockUser[],
  profiles: profiles as MockProfile[],
  requests: requests as MockRequest[],
  subscriptions: subscriptions as {
    plans: MockSubscriptionPlan[];
    userSubscriptions: Record<string, MockUserSubscription>;
  },
};

export { users, profiles, requests, subscriptions };
