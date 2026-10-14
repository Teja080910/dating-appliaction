import { Alert, Linking } from "react-native";
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

/**
 * Open the official Amara Telegram Bot directly.
 * Tries the native app deep-link first, and falls back to web.
 */
export const openAmaraBot = async (): Promise<void> => {
  return openTelegramChat(AMARA_BOT_USERNAME);
};
