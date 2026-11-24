import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConnection } from '../src/api/useConnection';
import { mockStore } from '../src/mock/mockStore';

jest.mock('../src/utils/geolocation', () => ({
  getCurrentLocation: jest.fn().mockResolvedValue({ latitude: 12.9, longitude: 77.6 }),
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  stopLocationUpdates: jest.fn(),
  requestLocationPermission: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/utils/telegramHelper', () => ({
  dispatchTelegramMatchNotification: jest.fn().mockResolvedValue({ success: true }),
}));

describe('Real-Time Connection & Request Synchronization', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    await AsyncStorage.setItem('userId', 'usr_woman_201');
    await AsyncStorage.setItem('userGender', 'woman');
    await mockStore.resetAll();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('1. Immediately applies optimistic update (0ms) on accept across all query keys', async () => {
    queryClient.setQueryData(['connections-received', 'current'], [
      { id: 'req_101_201', senderId: 'usr_man_101', status: 'PENDING', sender: { displayName: 'Rahul' } },
    ]);
    queryClient.setQueryData(['connections-received', 'usr_woman_201'], [
      { id: 'req_101_201', senderId: 'usr_man_101', status: 'PENDING', sender: { displayName: 'Rahul' } },
    ]);

    const listener = jest.fn();
    const sub = DeviceEventEmitter.addListener('AMARA_CONNECTION_UPDATED', listener);

    let connectionHook: any;
    const TestComponent = () => {
      connectionHook = useConnection('usr_woman_201');
      return null;
    };

    await act(async () => {
      ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );
    });

    expect(connectionHook).toBeDefined();

    // Trigger accept
    await act(async () => {
      await connectionHook.accept.mutateAsync('req_101_201');
    });

    const cachedCurrent: any = queryClient.getQueryData(['connections-received', 'current']) || [];
    const cachedUser: any = queryClient.getQueryData(['connections-received', 'usr_woman_201']) || [];

    const currentReq = cachedCurrent.find((x: any) => String(x.id) === 'req_101_201');
    const userReq = cachedUser.find((x: any) => String(x.id) === 'req_101_201');

    expect(currentReq?.status).toBe('ACCEPTED');
    expect(userReq?.status).toBe('ACCEPTED');
    expect(listener).toHaveBeenCalled();

    const isAccepted = await AsyncStorage.getItem('accepted_conn_req_101_201');
    expect(isAccepted).toBe('true');

    sub.remove();
  });

  it('2. Immediately applies optimistic update on reject across all query keys', async () => {
    queryClient.setQueryData(['connections-received', 'current'], [
      { id: 'req_101_201', senderId: 'usr_man_101', status: 'PENDING', sender: { displayName: 'Rahul' } },
    ]);

    const listener = jest.fn();
    const sub = DeviceEventEmitter.addListener('AMARA_CONNECTION_UPDATED', listener);

    let connectionHook: any;
    const TestComponent = () => {
      connectionHook = useConnection();
      return null;
    };

    await act(async () => {
      ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );
    });

    expect(connectionHook).toBeDefined();

    await act(async () => {
      await connectionHook.reject.mutateAsync('req_101_201');
    });

    const cachedCurrent: any = queryClient.getQueryData(['connections-received', 'current']) || [];
    const currentReq = cachedCurrent.find((x: any) => String(x.id) === 'req_101_201');
    if (currentReq) {
      expect(currentReq.status).toBe('DECLINED');
    }
    expect(listener).toHaveBeenCalled();

    const isDeclined = await AsyncStorage.getItem('declined_conn_req_101_201');
    expect(isDeclined).toBe('true');

    sub.remove();
  });

  it('3. Invalidation matches prefix arrays so cross-component queries sync without refresh', async () => {
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    let connectionHook: any;
    const TestComponent = () => {
      connectionHook = useConnection();
      return null;
    };

    await act(async () => {
      ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );
    });

    expect(connectionHook).toBeDefined();

    await act(async () => {
      await connectionHook.accept.mutateAsync('req_101_201');
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['connections'] })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['connections-sent'] })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['connections-received'] })
    );
  });
});
