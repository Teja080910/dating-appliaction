import apiClient from '../src/api/apiClient';
import {
  fetchSubscriberPlans,
  normalizeBackendPlan,
  DEFAULT_SUBSCRIPTION_PLANS,
} from '../src/api/useSubscription';

describe('Subscriber Plans API Integration (/subscriber/plans)', () => {
  test('normalizeBackendPlan maps all backend attributes correctly', () => {
    const rawBackendPlan = {
      plan: 'PREMIUM',
      displayName: 'Premium',
      price: 2,
      durationDays: 180,
      dailyRequestLimit: 20,
      unlimited: false,
      limitLabel: '20 requests/day',
      tagline: 'Invite up to 20 members per day',
      description: 'Premium Plan: 20 daily connection requests for 180 days.',
      worldwideSearch: true,
      eliteBadge: false,
      priorityHandoff: true,
      popular: true,
      bestValue: false,
    };

    const clientPlan = normalizeBackendPlan(rawBackendPlan);

    expect(clientPlan.id).toBe('PREMIUM');
    expect(clientPlan.name).toBe('Premium');
    expect(clientPlan.price).toBe('₹2');
    expect(clientPlan.amount).toBe(2);
    expect(clientPlan.durationDays).toBe(180);
    expect(clientPlan.billedText).toBe('180 Days');
    expect(clientPlan.subText).toBe('20 requests/day');
    expect(clientPlan.dailyRequestLimit).toBe(20);
    expect(clientPlan.unlimited).toBe(false);
    expect(clientPlan.popular).toBe(true);
    expect(clientPlan.badge).toBe('POPULAR');
    expect(clientPlan.worldwideSearch).toBe(true);
    expect(clientPlan.priorityHandoff).toBe(true);
    expect(clientPlan.eliteBadge).toBe(false);
  });

  test('normalizeBackendPlan handles unlimited ELITE plan correctly', () => {
    const rawElitePlan = {
      plan: 'ELITE',
      displayName: 'Elite',
      price: 3,
      durationDays: 365,
      dailyRequestLimit: null,
      unlimited: true,
      limitLabel: 'Unlimited requests',
      tagline: 'Invite unlimited members per day',
      description: 'Elite Plan: unlimited daily connection requests for 365 days.',
      worldwideSearch: true,
      eliteBadge: true,
      priorityHandoff: true,
      popular: false,
      bestValue: true,
    };

    const clientPlan = normalizeBackendPlan(rawElitePlan);

    expect(clientPlan.id).toBe('ELITE');
    expect(clientPlan.name).toBe('Elite');
    expect(clientPlan.price).toBe('₹3');
    expect(clientPlan.amount).toBe(3);
    expect(clientPlan.durationDays).toBe(365);
    expect(clientPlan.billedText).toBe('365 Days');
    expect(clientPlan.subText).toBe('Unlimited requests');
    expect(clientPlan.contactView).toBe('UNLIMITED');
    expect(clientPlan.dailyRequestLimit).toBeNull();
    expect(clientPlan.unlimited).toBe(true);
    expect(clientPlan.bestValue).toBe(true);
    expect(clientPlan.badge).toBe('BEST VALUE');
    expect(clientPlan.eliteBadge).toBe(true);
  });

  test('GET /subscriber/plans returns status 200 with all 3 plans', async () => {
    const response = await apiClient.get('/subscriber/plans');
    expect(response.status).toBe(200);

    const plans = response.data;
    expect(Array.isArray(plans)).toBe(true);
    expect(plans.length).toBe(3);

    const standard = plans.find((p: any) => p.plan === 'STANDARD');
    expect(standard).toBeDefined();
    expect(standard.price).toBe(1);
    expect(standard.durationDays).toBe(120);
    expect(standard.dailyRequestLimit).toBe(10);
    expect(standard.unlimited).toBe(false);

    const premium = plans.find((p: any) => p.plan === 'PREMIUM');
    expect(premium).toBeDefined();
    expect(premium.price).toBe(2);
    expect(premium.durationDays).toBe(180);
    expect(premium.dailyRequestLimit).toBe(20);
    expect(premium.popular).toBe(true);

    const elite = plans.find((p: any) => p.plan === 'ELITE');
    expect(elite).toBeDefined();
    expect(elite.price).toBe(3);
    expect(elite.durationDays).toBe(365);
    expect(elite.unlimited).toBe(true);
    expect(elite.bestValue).toBe(true);
  });

  test('fetchSubscriberPlans successfully fetches and normalizes plans', async () => {
    const plans = await fetchSubscriberPlans();

    expect(Array.isArray(plans)).toBe(true);
    expect(plans.length).toBe(3);

    expect(plans[0].id).toBe('STANDARD');
    expect(plans[0].price).toBe('₹1');
    expect(plans[0].billedText).toBe('120 Days');

    expect(plans[1].id).toBe('PREMIUM');
    expect(plans[1].price).toBe('₹2');
    expect(plans[1].billedText).toBe('180 Days');

    expect(plans[2].id).toBe('ELITE');
    expect(plans[2].price).toBe('₹3');
    expect(plans[2].billedText).toBe('365 Days');
  });

  test('does not invent or synthesize fields not present in API payload', () => {
    const rawApiPlan = {
      plan: 'PREMIUM',
      displayName: 'Premium',
      price: 2,
      durationDays: 180,
      dailyRequestLimit: 20,
      unlimited: false,
      popular: true,
      bestValue: false,
      tagline: 'Invite up to 20 members per day',
      description: 'Premium Plan: 20 daily connection requests for 180 days.',
      limitLabel: '20 requests/day',
    };

    const clientPlan = normalizeBackendPlan(rawApiPlan);

    expect(clientPlan.worldwideSearch).toBe(false);
    expect(clientPlan.priorityHandoff).toBe(false);
    expect(clientPlan.eliteBadge).toBe(false);
  });
});
