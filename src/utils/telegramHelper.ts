import { Alert, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { t } from '../i18n';

/**
 * Robust helper to launch Telegram chat with a specified username.
 * Tries the native app deep-link (tg://resolve?domain=...) first,
 * and gracefully falls back to web (https://t.me/...) in the browser.
 */
export const openTelegramChat = async (username?: string | null): Promise<void> => {
  const clean = String(username || "").replace(/^@+/, "").trim();
  if (!clean) {
    Alert.alert(
      "Telegram Not Connected",
      "This user has not connected their Telegram account yet."
    );
    return;
  }

  const appUrl = `tg://resolve?domain=${clean}`;
  const webUrl = `https://t.me/${clean}`;

  // 1. Try checking canOpenURL for native app scheme
  try {
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
      return;
    }
  } catch {
    // canOpenURL can fail on some Android versions due to package visibility
  }

  // 2. Direct attempt with appUrl
  try {
    await Linking.openURL(appUrl);
    return;
  } catch {
    // Native Telegram app not installed or failed to handle tg://
  }

  // 3. Fallback to web URL in device browser
  try {
    await Linking.openURL(webUrl);
  } catch {
    Alert.alert(
      "Telegram Handle",
      t('common.telegramhelper.could_not_open_telegram_directly_n_nusername_nlink', { clean, webUrl })
    );
  }
};

export const AMARA_BOT_USERNAME = 'amara_dating_bot';
export const BOT_NAME_STORAGE_KEY = '@amara_telegram_bot_name';

/**
 * Get the currently configured or cached bot username.
 */
export const getAmaraBotUsername = async (): Promise<string> => {
  try {
    const cached = await AsyncStorage.getItem(BOT_NAME_STORAGE_KEY);
    if (cached && cached.trim()) {
      const clean = cached.trim().replace(/^@+/, '');
      if (clean.toLowerCase().includes('amaraofficialbot')) {
        await AsyncStorage.removeItem(BOT_NAME_STORAGE_KEY).catch(() => {});
      } else {
        return clean;
      }
    }
  } catch {}
  return AMARA_BOT_USERNAME;
};

/**
 * Open the official Amara Telegram Bot directly.
 * Accepts either:
 * - A full bot link (e.g. "https://t.me/amara_dating_bot?start=3205e528bcdb4f83ad44adefca1eae57")
 * - A bot username (e.g. "amara_dating_bot" or "@amara_dating_bot")
 * Dynamically resolves to native tg:// deep-link with start params, and falls back to web.
 */
export const openAmaraBot = async (customBotNameOrUrl?: string): Promise<void> => {
  const raw = (customBotNameOrUrl || '').trim();
  let webUrl = '';
  let appUrl = '';

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    webUrl = raw;
    const match = raw.match(/t\.me\/([^/?#]+)(?:\?start=([^&#]+))?/i);
    if (match) {
      const bot = match[1];
      const start = match[2];
      appUrl = start ? `tg://resolve?domain=${bot}&start=${start}` : `tg://resolve?domain=${bot}`;
    } else {
      appUrl = `tg://resolve?domain=${AMARA_BOT_USERNAME}`;
    }
  } else {
    const clean = raw.replace(/^@+/, '') || (await getAmaraBotUsername());
    webUrl = `https://t.me/${clean}`;
    appUrl = `tg://resolve?domain=${clean}`;
  }

  // 1. Try native app URL first
  try {
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
      return;
    }
  } catch {}

  try {
    await Linking.openURL(appUrl);
    return;
  } catch {}

  // 2. Fallback to web URL in browser
  try {
    await Linking.openURL(webUrl);
  } catch {
    Alert.alert(
      'Telegram Link',
      `Please open Telegram or visit:\n\n${webUrl}`
    );
  }
};
