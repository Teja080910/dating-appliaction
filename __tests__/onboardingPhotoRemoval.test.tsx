import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UploadPhotosScreen from '../src/screens/onboarding/UploadImageScreen';
import AppContext from '../src/context/CreateGlobalStateContext';
import { APIURL } from '../src/environment/ApiConfig';

jest.mock('../src/api/useImages', () => {
  const mockDeleteImageMutateAsync = jest.fn().mockResolvedValue({});
  return {
    __mockDeleteImageMutateAsync: mockDeleteImageMutateAsync,
    MAX_PROFILE_IMAGES: 6,
    UPLOAD_PHOTO_OPTIONS: {},
    parseUploadResponse: () => ({ id: null, imageUrl: null }),
    getUploadErrorMessage: () => null,
    getPhotoRejectionKind: () => null,
    getPhotoRejectionCopy: () => ({ title: '', message: '' }),
    useUserImages: () => ({
      deleteImage: { mutateAsync: mockDeleteImageMutateAsync },
      uploadImage: { mutateAsync: jest.fn() },
      setProfilePhoto: { mutateAsync: jest.fn() },
    }),
  };
});

jest.mock('../src/utils/sessionHelper', () => ({
  getUserId: jest.fn(async () => 'usr_woman_201'),
}));

const useImagesMock = require('../src/api/useImages') as any;

describe('Onboarding photo removal', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useImagesMock.__mockDeleteImageMutateAsync.mockClear();
  });

  it('deletes a removed hosted photo from the server and local slots', async () => {
    const keep = `${APIURL}/uploads/keep.jpg`;
    const remove = `${APIURL}/uploads/remove.jpg`;
    let latestSlots: any[] = [keep, remove];
    const setImages = jest.fn((next: any[]) => {
      latestSlots = next;
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <AppContext.Provider
          value={{
            images: [keep, remove],
            setImages,
            name: 'Test',
            isModalVisible: false,
            setIsModalVisible: jest.fn(),
            setSelectedIndex: jest.fn(),
            setProfileImage: jest.fn(),
            setProfileImageUrl: jest.fn(),
          } as any}
        >
          <UploadPhotosScreen
            navigation={{
              canGoBack: () => true,
              goBack: jest.fn(),
              replace: jest.fn(),
              navigate: jest.fn(),
            }}
          />
        </AppContext.Provider>
      );
    });

    const removeButton = renderer!.root
      .findAllByProps({ testID: 'remove-photo-1' })
      .find((node) => typeof node.props.onPress === 'function');

    expect(removeButton).toBeTruthy();

    await act(async () => {
      await removeButton!.props.onPress();
    });

    expect(useImagesMock.__mockDeleteImageMutateAsync).toHaveBeenCalledWith({
      imageId: remove,
      imageUrl: remove,
      userId: 'usr_woman_201',
    });
    expect(setImages).toHaveBeenCalled();
    expect(latestSlots[1]).toBeNull();
    expect(latestSlots[0]).toBe(keep);

    const stored = await AsyncStorage.getItem('onboardingImages');
    expect(JSON.parse(stored as string)[1]).toBeNull();
  });

  it('does not call the server for a local-only image', async () => {
    const local = 'file:///tmp/local-photo.jpg';
    const setImages = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <AppContext.Provider
          value={{
            images: [local],
            setImages,
            name: 'Test',
            isModalVisible: false,
            setIsModalVisible: jest.fn(),
            setSelectedIndex: jest.fn(),
            setProfileImage: jest.fn(),
            setProfileImageUrl: jest.fn(),
          } as any}
        >
          <UploadPhotosScreen
            navigation={{
              canGoBack: () => true,
              goBack: jest.fn(),
              replace: jest.fn(),
              navigate: jest.fn(),
            }}
          />
        </AppContext.Provider>
      );
    });

    const removeButton = renderer!.root
      .findAllByProps({ testID: 'remove-photo-0' })
      .find((node) => typeof node.props.onPress === 'function');

    await act(async () => {
      await removeButton!.props.onPress();
    });

    expect(useImagesMock.__mockDeleteImageMutateAsync).not.toHaveBeenCalled();
    expect(setImages).toHaveBeenCalled();
  });
});
