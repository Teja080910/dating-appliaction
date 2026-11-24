import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../src/api/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock('../src/utils/sessionHelper', () => ({
  getUserId: jest.fn(async () => 'VIEWER001'),
}));

import apiClient from '../src/api/apiClient';
import { useMyProfile } from '../src/api/useProfile';
import { calculateAgeFromDob } from '../src/utils/dateUtils';

const mockGet = apiClient.get as jest.Mock;

const flushPromises = async () => {
  for (let i = 0; i < 8; i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

const renderProfile = async (uid: string | undefined) => {
  let latest: any = null;
  let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

  const Probe = () => {
    const { data } = useMyProfile(uid);
    React.useEffect(() => {
      if (data) latest = data;
    }, [data]);
    return null;
  };

  await act(async () => {
    renderer = ReactTestRenderer.create(<Probe />);
  });
  await flushPromises();

  return {
    getLatest: () => latest,
    unmount: async () => {
      await act(async () => {
        renderer?.unmount();
      });
    },
  };
};

describe('DOB isolation between the viewer and the profile being opened', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    await AsyncStorage.setItem('userId', 'VIEWER001');
    await AsyncStorage.setItem('userDob', '2005-05-05');
    await AsyncStorage.setItem('user_dob_VIEWER001', '2005-05-05');

    mockGet.mockImplementation((url: string) => {
      if (String(url).includes('/images')) {
        return Promise.resolve({ data: [] });
      }
      if (String(url).includes('/profile/me/OTHER002')) {
        return Promise.resolve({
          data: {
            userId: 'OTHER002',
            name: 'Other User',
            displayName: 'Other',
            dob: '1990-01-01',
            age: 99,
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it("keeps another discovery profile's DOB and age instead of the viewer's", async () => {
    const view = await renderProfile('OTHER002');
    const profile = view.getLatest();

    expect(profile?.dob).toBe('1990-01-01');
    // A valid DOB is authoritative over a contradictory server age.
    expect(profile?.age).toBe(calculateAgeFromDob('1990-01-01'));

    await view.unmount();
  });

  it("still uses the signed-in user's locally saved DOB for their own profile", async () => {
    const view = await renderProfile('VIEWER001');
    const profile = view.getLatest();

    expect(profile?.dob).toBe('2005-05-05');
    expect(profile?.age).toBe(calculateAgeFromDob('2005-05-05'));

    await view.unmount();
  });

  it('prefers the server DOB over a stale local value for the signed-in user', async () => {
    mockGet.mockImplementation((url: string) => {
      if (String(url).includes('/images')) {
        return Promise.resolve({ data: [] });
      }
      if (String(url).includes('/profile/me/VIEWER001')) {
        return Promise.resolve({
          data: {
            userId: 'VIEWER001',
            name: 'Viewer',
            dob: '1990-02-02',
            age: 99,
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const view = await renderProfile('VIEWER001');
    const profile = view.getLatest();

    expect(profile?.dob).toBe('1990-02-02');
    expect(profile?.age).toBe(calculateAgeFromDob('1990-02-02'));

    await view.unmount();
  });

  it('shares one in-flight request when several profile hooks mount together', async () => {
    let first: any = null;
    let second: any = null;
    let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

    const Probe = ({ onData }: { onData: (data: any) => void }) => {
      const { data } = useMyProfile('OTHER002');
      React.useEffect(() => {
        if (data) onData(data);
      }, [data, onData]);
      return null;
    };

    await act(async () => {
      renderer = ReactTestRenderer.create(
        <>
          <Probe onData={(data) => { first = data; }} />
          <Probe onData={(data) => { second = data; }} />
        </>
      );
    });
    await flushPromises();

    const profileCalls = mockGet.mock.calls.filter(([url]) =>
      String(url).includes('/profile/me/OTHER002')
    );
    expect(profileCalls).toHaveLength(1);
    expect(first?.dob).toBe('1990-01-01');
    expect(second?.dob).toBe('1990-01-01');

    await act(async () => {
      renderer?.unmount();
    });
  });
});
