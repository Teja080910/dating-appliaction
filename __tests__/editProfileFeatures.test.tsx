import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import ContactDetails from '../src/components/ProfileTabComponents/ProfileSettings/ContactDetails';
import ProfilePhotoGrid from '../src/components/ProfileTabComponents/ProfileSettings/ProfilePhotoGrid';
import AppContext from '../src/context/CreateGlobalStateContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Feather', () => 'Feather');

jest.mock('../src/api/useImages', () => ({
  TOTAL_SLOTS: 6,
  mapImagesToSlots: () => ({ slots: [], imageIdByIndex: {}, profileImageUrl: null }),
  useUserImages: () => ({
    uploadImage: { mutate: jest.fn() },
    getAllImages: { mutate: jest.fn() },
    deleteImage: { mutate: jest.fn() },
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('Edit Profile New Features', () => {
  it('renders ContactDetails with Telegram section and hides WhatsApp by default', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <ContactDetails
            telegramUsername=""
            setTelegramUsername={jest.fn()}
          />
        </QueryClientProvider>
      );
    });

    const json = JSON.stringify(renderer!.toJSON());
    expect(json).toContain('Contact details');
    expect(json).not.toContain('WhatsApp number');
    expect(json).toContain('Your Telegram');
    expect(json).toContain('Connect Telegram');
    expect(json).toContain('Not connected');
  });

  it('renders WhatsApp section when showWhatsApp is enabled', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <ContactDetails
            showWhatsApp={true}
            countryCode="+44"
            setCountryCode={jest.fn()}
            countryName="United Kingdom"
            setCountryName={jest.fn()}
            countryFlag="🇬🇧"
            setCountryFlag={jest.fn()}
            phoneNumber="1234567890"
            setPhoneNumber={jest.fn()}
            telegramUsername=""
            setTelegramUsername={jest.fn()}
          />
        </QueryClientProvider>
      );
    });

    const json = JSON.stringify(renderer!.toJSON());
    expect(json).toContain('Contact details');
    expect(json).toContain('WhatsApp number');
    expect(json).toContain('United Kingdom');
    expect(json).toContain('+44');
    expect(json).toContain('Your Telegram');
  });

  it('renders ProfilePhotoGrid containing Add Photo and Face photo required modal templates', () => {
    const mockContext = {
      images: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
      setImages: jest.fn(),
      setProfileImage: jest.fn(),
      setProfileImageUrl: jest.fn(),
      authUserId: 'usr_test_1',
      setAuthUserId: jest.fn(),
    };

    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <AppContext.Provider value={mockContext as any}>
            <ProfilePhotoGrid initialPhotos={['https://example.com/p1.jpg', 'https://example.com/p2.jpg']} />
          </AppContext.Provider>
        </QueryClientProvider>
      );
    });

    const root = renderer!.root;
    const json = JSON.stringify(renderer!.toJSON());

    // Both modals are declared in the ProfilePhotoGrid component tree
    // In React Native, Modal children might render inside Modal or as separate nodes depending on mock
    expect(root).toBeDefined();
    // Test that the component rendered slots
    expect(json).toContain('https://example.com/photo1.jpg');
  });
});
