import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractTelegram, extractPhone } from '../src/utils/whatsappHelper';

describe('Telegram and Contact Handle Isolation', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('UserDetails Target Contact Resolution', () => {
    const isSameId = (a: any, b: any) => {
      const sa = String(a || '').trim().toLowerCase();
      const sb = String(b || '').trim().toLowerCase();
      if (!sa || !sb || sa === '0' || sb === '0') return false;
      if (sa === sb) return true;
      const da = sa.replace(/[^\d]/g, '');
      const db = sb.replace(/[^\d]/g, '');
      if (da && db && da === db && da !== '0') return true;
      return false;
    };

    it('when a man with Telegram views an accepted woman with NO Telegram, her telegram must be empty (never fallback to man)', () => {
      const currentUserId = 'usr_man_101';
      const resolvedTargetUserId = 'usr_woman_999';

      const matchingMatch: any = {
        id: 'conn_101_999',
        sender: {
          id: 'usr_man_101',
          userId: 'usr_man_101',
          name: 'Rahul Sharma',
          telegramUsername: 'rahul_amara',
          phoneNumber: '+919876543210',
        },
        receiver: {
          id: 'usr_woman_999',
          userId: 'usr_woman_999',
          name: 'Pooja Verma',
          telegramUsername: '', // Woman has NO Telegram
          phoneNumber: '', // Woman has NO Phone
        },
      };

      const resolvedProfile: any = {
        id: 'usr_woman_999',
        userId: 'usr_woman_999',
        name: 'Pooja Verma',
        telegramUsername: '',
      };

      // Implement the exact logic used in UserDetails.tsx
      const targetParty = (() => {
        if (matchingMatch) {
          const sId = matchingMatch?.sender?.id ?? matchingMatch?.sender?.userId ?? matchingMatch?.senderId;
          const rId = matchingMatch?.receiver?.id ?? matchingMatch?.receiver?.userId ?? matchingMatch?.receiverId;
          if (resolvedTargetUserId && isSameId(rId, resolvedTargetUserId)) return matchingMatch.receiver;
          if (resolvedTargetUserId && isSameId(sId, resolvedTargetUserId)) return matchingMatch.sender;
          if (currentUserId && isSameId(sId, currentUserId)) return matchingMatch.receiver;
          if (currentUserId && isSameId(rId, currentUserId)) return matchingMatch.sender;
          return matchingMatch.receiver;
        }
        return null;
      })();

      const isProfileMine =
        isSameId(resolvedProfile?.id, currentUserId) ||
        isSameId(resolvedProfile?.userId, currentUserId);

      const targetTelegramUsername = (() => {
        const raw = extractTelegram(
          targetParty,
          !isProfileMine ? resolvedProfile : null
        );
        return raw.trim().replace(/^@+/, '');
      })();

      const targetPhoneNumber = extractPhone(
        targetParty,
        !isProfileMine ? resolvedProfile : null
      );

      // Verify that woman's profile does NOT display the viewing man's contacts
      expect(targetParty).toBe(matchingMatch.receiver);
      expect(targetTelegramUsername).toBe('');
      expect(targetTelegramUsername).not.toBe('rahul_amara');
      expect(targetPhoneNumber).toBe('');
      expect(targetPhoneNumber).not.toBe('+919876543210');
    });

    it('when a woman has connected Telegram, her handle is correctly extracted and shown to the man', () => {
      const currentUserId = 'usr_man_101';
      const resolvedTargetUserId = 'usr_woman_201';

      const matchingMatch: any = {
        id: 'conn_101_201',
        sender: {
          id: 'usr_man_101',
          userId: 'usr_man_101',
          name: 'Rahul Sharma',
          telegramUsername: 'rahul_amara',
        },
        receiver: {
          id: 'usr_woman_201',
          userId: 'usr_woman_201',
          name: 'Ananya Sharma',
          telegramUsername: 'ananya_amara',
        },
      };

      const resolvedProfile: any = {
        id: 'usr_woman_201',
        name: 'Ananya Sharma',
        telegramUsername: 'ananya_amara',
      };

      const targetParty = (() => {
        if (matchingMatch) {
          const sId = matchingMatch?.sender?.id ?? matchingMatch?.sender?.userId ?? matchingMatch?.senderId;
          const rId = matchingMatch?.receiver?.id ?? matchingMatch?.receiver?.userId ?? matchingMatch?.receiverId;
          if (resolvedTargetUserId && isSameId(rId, resolvedTargetUserId)) return matchingMatch.receiver;
          if (resolvedTargetUserId && isSameId(sId, resolvedTargetUserId)) return matchingMatch.sender;
          if (currentUserId && isSameId(sId, currentUserId)) return matchingMatch.receiver;
          if (currentUserId && isSameId(rId, currentUserId)) return matchingMatch.sender;
          return matchingMatch.receiver;
        }
        return null;
      })();

      const isProfileMine =
        isSameId(resolvedProfile?.id, currentUserId) ||
        isSameId(resolvedProfile?.userId, currentUserId);

      const targetTelegramUsername = (() => {
        const raw = extractTelegram(
          targetParty,
          !isProfileMine ? resolvedProfile : null
        );
        return raw.trim().replace(/^@+/, '');
      })();

      expect(targetTelegramUsername).toBe('ananya_amara');
      expect(targetTelegramUsername).not.toBe('rahul_amara');
    });
  });

  describe('Scoped Storage Multi-User Isolation', () => {
    it('storing Telegram for User 1 does not leak into User 2 storage or acceptance payload', async () => {
      const user1Id = 'usr_man_101';
      const user2Id = 'usr_woman_999';

      // User 1 saves telegram handle
      await AsyncStorage.setItem(`user_telegram_${user1Id}`, 'user1_telegram');
      await AsyncStorage.setItem(`@telegram_username_${user1Id}`, 'user1_telegram');

      // Legacy keys must be clear
      await AsyncStorage.multiRemove(['telegramUsername', '@telegram_username']);

      // User 2 reads scoped storage
      const user2ScopedTg = await AsyncStorage.getItem(`user_telegram_${user2Id}`);
      expect(user2ScopedTg).toBeNull();

      // Candidate resolution for User 2
      const [uTg, atTg] = await Promise.all([
        AsyncStorage.getItem(`user_telegram_${user2Id}`).catch(() => null),
        AsyncStorage.getItem(`@telegram_username_${user2Id}`).catch(() => null),
      ]);
      const cand = [uTg, atTg].find((val) => {
        if (!val) return false;
        const c = String(val).trim().replace(/^@+/, '');
        const n = c.toUpperCase();
        return c && n !== 'NONE' && n !== 'NULL' && n !== 'UNDEFINED' && n !== '-' && n !== 'N/A';
      });

      expect(cand).toBeUndefined();

      // Acceptance payload check for User 2
      const myTg = user2Id ? await AsyncStorage.getItem(`user_telegram_${user2Id}`).catch(() => null) : null;
      const payload: Record<string, any> = {
        requestId: 'req_123',
        userId: user2Id,
      };
      if (myTg) {
        payload.telegramUsername = myTg;
        payload.femaleTelegram = myTg;
      }

      expect(payload.telegramUsername).toBeUndefined();
      expect(payload.femaleTelegram).toBeUndefined();
    });
  });
});
