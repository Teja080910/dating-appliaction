import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  extractBotUsername,
  fetchAmaraBotName,
  DEFAULT_AMARA_BOT_USERNAME,
  BOT_NAME_STORAGE_KEY,
} from '../src/api/useTelegram';
import { getAmaraBotUsername, openAmaraBot, AMARA_BOT_USERNAME } from '../src/utils/telegramHelper';
import { Linking } from 'react-native';

describe('Telegram Bot Dynamic Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('extractBotUsername parses string and object responses accurately', () => {
    expect(extractBotUsername('amara_dating_bot')).toBe('amara_dating_bot');
    expect(extractBotUsername('@amara_dating_bot')).toBe('amara_dating_bot');
    expect(extractBotUsername({ botUsername: 'official_amara_bot' })).toBe('official_amara_bot');
    expect(extractBotUsername({ data: { botName: 'amara_chat_bot' } })).toBe('amara_chat_bot');
    expect(extractBotUsername({ username: '@my_test_bot' })).toBe('my_test_bot');
    expect(extractBotUsername('')).toBe('');
    expect(extractBotUsername(null)).toBe('');
  });

  it('fetchAmaraBotName returns amara_dating_bot from backend or defaults to amara_dating_bot', async () => {
    const botName = await fetchAmaraBotName();
    expect(botName).toBe('amara_dating_bot');
  });

  it('getAmaraBotUsername returns cached bot name from AsyncStorage if present', async () => {
    await AsyncStorage.setItem(BOT_NAME_STORAGE_KEY, 'custom_backend_bot');
    const resolved = await getAmaraBotUsername();
    expect(resolved).toBe('custom_backend_bot');
  });

  it('openAmaraBot uses custom bot username and opens native/web links', async () => {
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    await openAmaraBot('super_dating_bot');
    expect(openURLSpy).toHaveBeenCalledWith('tg://resolve?domain=super_dating_bot');
  });

  it('openAmaraBot handles full backend deep-link with start token', async () => {
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    await openAmaraBot('https://t.me/amara_dating_bot?start=3205e528bcdb4f83ad44adefca1eae57');
    expect(openURLSpy).toHaveBeenCalledWith('tg://resolve?domain=amara_dating_bot&start=3205e528bcdb4f83ad44adefca1eae57');
  });
});
