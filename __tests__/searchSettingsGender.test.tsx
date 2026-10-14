import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import ShowMe from '../src/components/SearchSettingsComponents/ShowMe';
import AppContext from '../src/context/CreateGlobalStateContext';
import apiClient from '../src/api/apiClient';
import { mockStore } from '../src/mock/mockStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('Search Settings Gender Filter & ShowMe multi-select', () => {
  beforeAll(async () => {
    await mockStore.init();
  });
  const renderShowMe = (
    showMeVal: 'straight_man' | 'straight_woman' | 'both' | null = null,
    setShowMeMock = jest.fn(),
    onChangeMock = jest.fn()
  ) => {
    const mockContextValue: any = {
      showMe: showMeVal,
      setShowMe: setShowMeMock,
    };

    let renderer: any;
    act(() => {
      renderer = ReactTestRenderer.create(
        <AppContext.Provider value={mockContextValue}>
          <ShowMe onChange={onChangeMock} />
        </AppContext.Provider>
      );
    });

    return { renderer, setShowMeMock, onChangeMock };
  };

  test('defaults to only Women selected when showMe is not set', () => {
    const setShowMe = jest.fn();
    const onChange = jest.fn();
    const { renderer } = renderShowMe(null, setShowMe, onChange);

    expect(setShowMe).toHaveBeenCalledWith('straight_woman');
    expect(onChange).toHaveBeenCalledWith(['Female']);

    const womenBtn = renderer.root.findByProps({ testID: 'show-me-women' });
    const menBtn = renderer.root.findByProps({ testID: 'show-me-men' });
    expect(womenBtn).toBeTruthy();
    expect(menBtn).toBeTruthy();
  });

  test('allows selecting Men while Women is selected (multi-select both)', () => {
    const setShowMe = jest.fn();
    const onChange = jest.fn();
    const { renderer } = renderShowMe('straight_woman', setShowMe, onChange);

    const menBtn = renderer.root.findByProps({ testID: 'show-me-men' });
    act(() => {
      menBtn.props.onPress();
    });

    expect(setShowMe).toHaveBeenCalledWith('both');
    expect(onChange).toHaveBeenCalledWith(['Female', 'Male']);
  });

  test('allows deselecting Women when both are selected, leaving Men only', () => {
    const setShowMe = jest.fn();
    const onChange = jest.fn();
    const { renderer } = renderShowMe('both', setShowMe, onChange);

    const womenBtn = renderer.root.findByProps({ testID: 'show-me-women' });
    act(() => {
      womenBtn.props.onPress();
    });

    expect(setShowMe).toHaveBeenCalledWith('straight_man');
    expect(onChange).toHaveBeenCalledWith(['Male']);
  });

  test('prevents deselecting the only selected option', () => {
    const setShowMe = jest.fn();
    const onChange = jest.fn();
    const { renderer } = renderShowMe('straight_woman', setShowMe, onChange);

    const womenBtn = renderer.root.findByProps({ testID: 'show-me-women' });
    act(() => {
      womenBtn.props.onPress();
    });

    expect(setShowMe).not.toHaveBeenCalledWith(null);
  });

  test('POST /search returns women profiles by default', async () => {
    const res = await apiClient.post('/search', {
      gender: ['Female'],
      page: 0,
      size: 20,
    });

    expect(res.status).toBe(200);
    const profiles = res.data.content;
    expect(profiles.length).toBeGreaterThan(0);
    expect(profiles.every((p: any) => p.gender === 'woman')).toBe(true);
  });

  test('POST /search returns men profiles when Men is selected', async () => {
    const res = await apiClient.post('/search', {
      gender: ['Male'],
      page: 0,
      size: 20,
    });

    expect(res.status).toBe(200);
    const profiles = res.data.content;
    expect(profiles.length).toBeGreaterThan(0);
    expect(profiles.every((p: any) => p.gender === 'man')).toBe(true);
  });

  test('POST /search returns both women and men profiles when both are selected', async () => {
    const res = await apiClient.post('/search', {
      gender: ['Female', 'Male'],
      page: 0,
      size: 30,
    });

    expect(res.status).toBe(200);
    const profiles = res.data.content;
    expect(profiles.length).toBeGreaterThan(0);
    const hasWomen = profiles.some((p: any) => p.gender === 'woman');
    const hasMen = profiles.some((p: any) => p.gender === 'man');
    expect(hasWomen).toBe(true);
    expect(hasMen).toBe(true);
  });
});
