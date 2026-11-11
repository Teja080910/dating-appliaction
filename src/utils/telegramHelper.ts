import { Alert, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatDisplayPhone, normalizePhoneDigits } from "./whatsappHelper";
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

export interface TelegramMatchNotificationParams {
  femaleName: string;
  femaleAge?: number | string | null;
  femaleLocation?: string | null;
  femaleTelegram?: string | null;
  femaleWhatsApp?: string | null;
  femalePhoto?: string | null;
  femaleBio?: string | null;
  femaleProfession?: string | null;
  femaleEducation?: string | null;
  maleTelegram?: string | null;
  maleUserId?: string | number | null;
}

/**
 * Dispatches an automated match notification via the Amara Telegram Bot,
 * delivering the female's connected profile and contact details (WhatsApp & Telegram)
 * directly to the male user's Telegram.
 */
export const dispatchTelegramMatchNotification = async (
  params: TelegramMatchNotificationParams
): Promise<boolean> => {
  const {
    femaleName,
    femaleAge,
    femaleLocation,
    femaleTelegram,
    femaleWhatsApp,
    femalePhoto,
    femaleBio,
    femaleProfession,
    femaleEducation,
    maleTelegram,
    maleUserId,
  } = params;

  const cleanMaleTg = String(maleTelegram || '').trim().replace(/^@+/, '');
  const cleanFemaleTg = String(femaleTelegram || '').trim().replace(/^@+/, '');
  const displayPhone = femaleWhatsApp ? formatDisplayPhone(femaleWhatsApp) : '';
  const digitsPhone = femaleWhatsApp ? normalizePhoneDigits(femaleWhatsApp) : '';

  const ageLoc = [femaleAge ? `${femaleAge} years` : '', femaleLocation].filter(Boolean).join(' • ');

  let messageText = `🎉 *Interest Accepted!* 🎉\n\n`;
  messageText += `Congratulations! 🎉\n`;
  messageText += `Your interest request has been accepted by *${femaleName}* on Amara! ❤️\n\n`;
  messageText += `👤 *Profile Details:*\n`;
  messageText += `• Name: *${femaleName}* ✅\n`;
  if (ageLoc) messageText += `• Age & City: *${ageLoc}*\n`;
  if (femaleProfession) messageText += `• Profession: 💼 *${femaleProfession}*\n`;
  if (femaleEducation) messageText += `• Education: 🎓 *${femaleEducation}*\n`;
  if (femaleBio) messageText += `• About: _${femaleBio}_\n`;

  if (cleanFemaleTg || displayPhone) {
    messageText += `\n📲 *Direct Contact:*\n`;
    if (cleanFemaleTg) messageText += `💬 *Telegram:* @${cleanFemaleTg}\n`;
    if (displayPhone) messageText += `📱 *WhatsApp:* ${displayPhone} (https://wa.me/${digitsPhone})\n`;
  }

  messageText += `\n_You can now view her full profile and start a conversation on the Amara App._`;

  // 1. Try sending to Amara Telegram Bot webhook server (port 9396)
  const webhookUrls = [
    'http://168.144.95.58:9396/notify-match',
    'http://localhost:9396/notify-match',
    'http://10.0.2.2:9396/notify-match',
  ];

  for (const url of webhookUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          maleTelegram: cleanMaleTg,
          maleUserId: String(maleUserId || ''),
          femaleName,
          femaleAge,
          femaleLocation,
          femaleTelegram: cleanFemaleTg,
          femaleWhatsApp: displayPhone || femaleWhatsApp || '',
          femalePhoto: femalePhoto || '',
          femaleProfession: femaleProfession || '',
          femaleEducation: femaleEducation || '',
          femaleBio: femaleBio || '',
          message: messageText,
        }),
      });
      clearTimeout(timeoutId);
      if (response && response.ok) {
        console.log(`✅ [Telegram Notification] Bot webhook dispatched successfully to ${url}`);
        return true;
      }
    } catch {}
  }

  // 2. Direct Telegram Bot API fallback using token
  const BOT_TOKEN = '8623345787:AAHbtum1TKbgW1xprMwKzOm510pmQiVTpNg';
  try {
    const storedChatId =
      (await AsyncStorage.getItem(`@amara_tg_chat_id_${maleUserId}`).catch(() => null)) ||
      (cleanMaleTg ? await AsyncStorage.getItem(`@amara_tg_chat_id_${cleanMaleTg.toLowerCase()}`).catch(() => null) : null);

    if (storedChatId) {
      const directRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: storedChatId,
          text: messageText,
          parse_mode: 'Markdown',
        }),
      });
      if (directRes && directRes.ok) {
        console.log('✅ [Telegram Notification] Sent directly via Telegram Bot API to chatId:', storedChatId);
        return true;
      }
    }
  } catch (err: any) {
    console.warn('⚠️ [Telegram Notification] Direct Bot API error:', err?.message);
  }

  return false;
};
