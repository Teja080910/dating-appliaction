import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../../theme';
import { useTelegram } from '../../../api/useTelegram';
import { useAlert } from '../../AlertModal';
import { t, useTranslation } from '../../../i18n';

export interface CountryItem {
  name: string;
  code: string;
  flag: string;
}

export const COUNTRIES_LIST: CountryItem[] = [
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Spain', code: '+34', flag: '🇪🇸' },
  { name: 'Portugal', code: '+351', flag: '🇵🇹' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'Romania', code: '+40', flag: '🇷🇴' },
  { name: 'Russia', code: '+7', flag: '🇷🇺' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
];

interface ContactDetailsProps {
  showWhatsApp?: boolean;
  countryCode?: string;
  setCountryCode?: (code: string) => void;
  countryName?: string;
  setCountryName?: (name: string) => void;
  countryFlag?: string;
  setCountryFlag?: (flag: string) => void;
  phoneNumber?: string;
  setPhoneNumber?: (num: string) => void;
  telegramUsername: string;
  setTelegramUsername: (username: string) => void;
}

const ContactDetails: React.FC<ContactDetailsProps> = ({
  showWhatsApp = false,
  countryCode = '+44',
  setCountryCode = () => {},
  countryName = 'United Kingdom',
  setCountryName = () => {},
  countryFlag = '🇬🇧',
  setCountryFlag = () => {},
  phoneNumber = '',
  setPhoneNumber = () => {},
  telegramUsername,
  setTelegramUsername,
}) => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const { alert, AlertComponent } = useAlert();
  const { connectTelegram, disconnectTelegram } = useTelegram();

  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [telegramModalVisible, setTelegramModalVisible] = useState(false);
  const [inputTelegram, setInputTelegram] = useState(telegramUsername);
  const [tgLoading, setTgLoading] = useState(false);

  const cleanConnected = telegramUsername.trim().replace(/^@+/, '');

  const filteredCountries = COUNTRIES_LIST.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.includes(countrySearch)
  );

  const handleSelectCountry = (country: CountryItem) => {
    setCountryCode(country.code);
    setCountryName(country.name);
    setCountryFlag(country.flag);
    setCountryModalVisible(false);
  };

  const handleConnectTelegramPress = async () => {
    const botUrl = 'https://t.me/amara_dating_bot';
    const appUrl = 'tg://resolve?domain=amara_dating_bot';

    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(botUrl);
      }
    } catch {
      Linking.openURL(botUrl).catch(() => {});
    }

    setInputTelegram(cleanConnected);
    setTelegramModalVisible(true);
  };

  const handleSaveTelegram = async () => {
    const username = inputTelegram.trim().replace(/^@+/, '');
    if (!username) {
      alert('Username Required', 'Please enter your Telegram username.');
      return;
    }

    const TELEGRAM_USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{3,31}$/;
    if (!TELEGRAM_USERNAME_REGEX.test(username)) {
      alert(
        'Invalid Username',
        'Username must start with a letter and contain 4-32 alphanumeric characters or underscores.'
      );
      return;
    }

    setTgLoading(true);
    try {
      await connectTelegram.mutateAsync({ userId: '', username });
      setTelegramUsername(username);
      setTgLoading(false);
      setTelegramModalVisible(false);
      alert('Connected', t('profile.contactdetails.your_telegram_account_is_now_connected', { username }));
    } catch (error: any) {
      setTgLoading(false);
      setTelegramUsername(username);
      setTelegramModalVisible(false);
      alert('Connected', t('profile.contactdetails.your_telegram_account_is_saved', { username }));
    }
  };

  const handleDisconnectTelegram = async () => {
    setTgLoading(true);
    try {
      await disconnectTelegram.mutateAsync({ userId: '' });
      setTelegramUsername('');
      setTgLoading(false);
      setTelegramModalVisible(false);
      alert('Disconnected', 'Your Telegram account has been disconnected.');
    } catch (error: any) {
      setTgLoading(false);
      setTelegramUsername('');
      setTelegramModalVisible(false);
      alert('Disconnected', 'Your Telegram account has been disconnected.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Title: Contact details */}
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t('profile.contactdetails.contact_details')}</Text>

      {showWhatsApp && (
        <>
          {/* Field Label: WhatsApp number */}
          <Text style={[styles.fieldLabel, { color: isDark ? '#D1D5DB' : '#374151' }]}>{t('profile.contactdetails.whatsapp_number')}</Text>

          {/* WhatsApp input card matching Screenshot 1 */}
          <View
            style={[
              styles.whatsAppCard,
              {
                backgroundColor: isDark ? themeColors.surfaceLight : '#FFFFFF',
                borderColor: isDark ? themeColors.borderLight : '#E5E7EB',
              },
            ]}
          >
            {/* Country Selector Row */}
            <TouchableOpacity
              style={styles.countryRow}
              onPress={() => {
                setCountrySearch('');
                setCountryModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.countryFlag}>{countryFlag}</Text>
              <Text style={[styles.countryName, { color: themeColors.text }]}>
                {countryName}
              </Text>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Card Horizontal Divider */}
            <View
              style={[
                styles.cardDivider,
                { backgroundColor: isDark ? themeColors.borderLight : '#E5E7EB' },
              ]}
            />

            {/* Dial Code & Number Row */}
            <View style={styles.numberRow}>
              <Text style={[styles.dialCode, { color: themeColors.text }]}>
                {countryCode}
              </Text>
              <View
                style={[
                  styles.verticalDivider,
                  { backgroundColor: isDark ? themeColors.borderLight : '#E5E7EB' },
                ]}
              />
              <TextInput
                style={[styles.numberInput, { color: themeColors.text }]}
                placeholder="1234567890"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={
                  phoneNumber && !phoneNumber.includes('@') && !/[a-zA-Z]/.test(phoneNumber)
                    ? phoneNumber
                    : ''
                }
                onChangeText={(val) => setPhoneNumber(val.replace(/[^\d\s-]/g, ''))}
              />
            </View>
          </View>

          {/* Centered OR divider */}
          <View style={styles.orRow}>
            <View
              style={[
                styles.orLine,
                { backgroundColor: isDark ? themeColors.borderLight : '#E5E7EB' },
              ]}
            />
            <Text style={[styles.orText, { color: isDark ? '#9CA3AF' : '#9CA3AF' }]}>{t('profile.contactdetails.or')}</Text>
            <View
              style={[
                styles.orLine,
                { backgroundColor: isDark ? themeColors.borderLight : '#E5E7EB' },
              ]}
            />
          </View>
        </>
      )}

      {/* Field Label: Your Telegram */}
      <Text style={[styles.fieldLabel, { color: isDark ? '#D1D5DB' : '#374151' }]}>{t('profile.contactdetails.your_telegram')}</Text>

      {/* Telegram Card matching Screenshot 1 */}
      <View
        style={[
          styles.telegramCard,
          {
            borderColor: isDark ? 'rgba(56, 189, 248, 0.45)' : '#8FD2F8',
          },
        ]}
      >
        {/* Top button: Connect Telegram */}
        <TouchableOpacity
          style={styles.telegramConnectBtn}
          activeOpacity={0.85}
          onPress={handleConnectTelegramPress}
        >
          <Icon name="send" size={19} color="#FFFFFF" style={styles.sendIcon} />
          <Text style={styles.telegramConnectBtnText}>{t('profile.contactdetails.connect_telegram')}</Text>
        </TouchableOpacity>

        {/* Bottom status area */}
        <TouchableOpacity
          style={[
            styles.telegramStatusArea,
            {
              backgroundColor: isDark ? 'rgba(46, 165, 232, 0.12)' : '#E5F3FD',
            },
          ]}
          activeOpacity={cleanConnected ? 0.7 : 1}
          onPress={() => {
            setInputTelegram(cleanConnected);
            setTelegramModalVisible(true);
          }}
        >
          <Text
            style={[
              styles.telegramStatusText,
              { color: isDark ? '#BAE6FD' : '#0A3960' },
            ]}
          >{t('profile.contactdetails.status')}{' '}
            <Text
              style={[
                styles.telegramStatusValue,
                cleanConnected ? styles.telegramStatusConnected : null,
              ]}
            >
              {cleanConnected ? t('profile.contactdetails.connected', { cleanConnected }) : 'Not connected'}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Country Selection Modal */}
      {showWhatsApp && (
        <Modal
          visible={countryModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCountryModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setCountryModalVisible(false)}
          >
            <View
              style={[
                styles.countryModalCard,
                { backgroundColor: isDark ? '#1F1B2E' : '#FFFFFF' },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.countryModalHeader}>
                <Text
                  style={[
                    styles.countryModalTitle,
                    { color: isDark ? '#FFFFFF' : '#111827' },
                  ]}
                >{t('profile.contactdetails.select_country')}</Text>
                <TouchableOpacity
                  onPress={() => setCountryModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={22} color={isDark ? '#FFFFFF' : '#111827'} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[
                  styles.countrySearchInput,
                  {
                    color: isDark ? '#FFFFFF' : '#111827',
                    backgroundColor: isDark ? '#2D2845' : '#F3F4F6',
                  },
                ]}
                placeholder={t('profile.contactdetails.search_country_or_code')}
                placeholderTextColor="#9CA3AF"
                value={countrySearch}
                onChangeText={setCountrySearch}
              />

              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item.code + item.name}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = item.code === countryCode && item.name === countryName;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.countryItem,
                        isSelected && {
                          backgroundColor: isDark
                            ? 'rgba(124, 58, 237, 0.2)'
                            : 'rgba(124, 58, 237, 0.08)',
                        },
                      ]}
                      onPress={() => handleSelectCountry(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.countryItemFlag}>{item.flag}</Text>
                      <Text
                        style={[
                          styles.countryItemName,
                          { color: isDark ? '#FFFFFF' : '#111827' },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={styles.countryItemCode}>{item.code}</Text>
                      {isSelected && (
                        <Icon
                          name="check"
                          size={18}
                          color="#7C3AED"
                          style={{ marginLeft: 8 }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Telegram Username Link/Manage Modal */}
      <Modal
        visible={telegramModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTelegramModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setTelegramModalVisible(false)}
        >
          <View
            style={[
              styles.tgModalCard,
              { backgroundColor: isDark ? '#1F1B2E' : '#FFFFFF' },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text
              style={[
                styles.tgModalTitle,
                { color: isDark ? '#FFFFFF' : '#0F172A' },
              ]}
            >
              {cleanConnected ? t('profile.contactdetails.manage_telegram') : t('profile.contactdetails.link_telegram_account')}
            </Text>

            <Text
              style={[
                styles.tgModalSubtitle,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >{t('profile.contactdetails.enter_your_telegram_username_to_connect_with_the_amara_telegram_bot')}</Text>

            <View
              style={[
                styles.tgInputWrapper,
                {
                  backgroundColor: isDark ? '#2D2845' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#E2E8F0',
                },
              ]}
            >
              <Text style={styles.atPrefix}>@</Text>
              <TextInput
                style={[
                  styles.tgModalInput,
                  { color: isDark ? '#FFFFFF' : '#0F172A' },
                ]}
                placeholder="username"
                placeholderTextColor="#94A3B8"
                value={inputTelegram}
                onChangeText={(val) =>
                  setInputTelegram(val.replace(/^@+/, '').replace(/\s+/g, ''))
                }
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.tgBtnRow}>
              {cleanConnected ? (
                <TouchableOpacity
                  style={styles.disconnectBtn}
                  onPress={handleDisconnectTelegram}
                  disabled={tgLoading}
                >
                  <Text style={styles.disconnectBtnText}>{t('profile.contactdetails.disconnect')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setTelegramModalVisible(false)}
                  disabled={tgLoading}
                >
                  <Text style={styles.cancelModalBtnText}>{t('profile.additionaluploadsection.cancel')}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.saveModalBtn}
                onPress={handleSaveTelegram}
                disabled={tgLoading}
              >
                {tgLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveModalBtnText}>{t('more_info.savebutton.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {AlertComponent}
    </View>
  );
};

export default ContactDetails;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  fieldLabel: {
    fontSize: 15.5,
    fontWeight: '600',
    marginBottom: 10,
  },
  whatsAppCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 10,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    width: '100%',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
  },
  dialCode: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 36,
  },
  verticalDivider: {
    width: 1,
    height: 22,
    marginHorizontal: 14,
  },
  numberInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 0,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 14,
    fontSize: 13,
    fontWeight: '700',
  },
  telegramCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  telegramConnectBtn: {
    backgroundColor: '#2EA5E8',
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    marginRight: 8,
    transform: [{ rotate: '-45deg' }],
  },
  telegramConnectBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  telegramStatusArea: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telegramStatusText: {
    fontSize: 15,
    fontWeight: '500',
  },
  telegramStatusValue: {
    fontWeight: '600',
  },
  telegramStatusConnected: {
    color: '#059669',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  countryModalCard: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  countryModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  countryModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  countrySearchInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 2,
  },
  countryItemFlag: {
    fontSize: 20,
    marginRight: 10,
  },
  countryItemName: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '500',
  },
  countryItemCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  tgModalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  tgModalTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 8,
  },
  tgModalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  tgInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 22,
  },
  atPrefix: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2EA5E8',
    marginRight: 4,
  },
  tgModalInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 0,
  },
  tgBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelModalBtnText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  disconnectBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  disconnectBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
  saveModalBtn: {
    backgroundColor: '#2EA5E8',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
