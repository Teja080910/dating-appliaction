import { t, setLanguage } from '../src/i18n';

describe('Membership, Telegram, and WhatsApp Translations', () => {
  beforeEach(async () => {
    await setLanguage('en');
  });

  afterAll(async () => {
    await setLanguage('en');
  });

  it('translates Standard, Premium, and Elite membership titles across languages', async () => {
    // English
    await setLanguage('en');
    expect(t('profile.profilescreen.standard_membership')).toBe('Standard Membership');
    expect(t('profile.profilescreen.premium_membership')).toBe('Premium Membership');
    expect(t('profile.profilescreen.elite_membership')).toBe('Elite Membership');
    expect(t('profile.profilescreen.membership_days_left', { membership: 'Standard Membership', days: 105 }))
      .toBe('Standard Membership (105d left)');

    // French
    await setLanguage('fr');
    expect(t('profile.profilescreen.standard_membership')).toBe('Abonnement Standard');
    expect(t('profile.profilescreen.membership_days_left', { membership: 'Abonnement Standard', days: 105 }))
      .toBe('Abonnement Standard (105 j restants)');

    // Spanish
    await setLanguage('es');
    expect(t('profile.profilescreen.standard_membership')).toBe('Membresía Estándar');
    expect(t('profile.profilescreen.membership_days_left', { membership: 'Membresía Estándar', days: 105 }))
      .toBe('Membresía Estándar (quedan 105 d)');

    // German
    await setLanguage('de');
    expect(t('profile.profilescreen.standard_membership')).toBe('Standard-Mitgliedschaft');

    // Russian
    await setLanguage('ru');
    expect(t('profile.profilescreen.standard_membership')).toBe('Стандартная подписка');

    // Japanese
    await setLanguage('ja');
    expect(t('profile.profilescreen.standard_membership')).toBe('スタンダード会員');

    // Chinese
    await setLanguage('zh');
    expect(t('profile.profilescreen.standard_membership')).toBe('标准会员');
  });

  it('translates Telegram connect, disconnect, and status display across languages', async () => {
    await setLanguage('en');
    expect(t('profile.contactdetails.disconnect_telegram')).toBe('Disconnect Telegram');
    expect(t('profile.contactdetails.connected_to', { username: 'sai_049' })).toBe('Connected to: @sai_049');
    expect(t('profile.contactdetails.not_connected')).toBe('Not connected');

    await setLanguage('fr');
    expect(t('profile.contactdetails.disconnect_telegram')).toBe('Déconnecter Telegram');
    expect(t('profile.contactdetails.connected_to', { username: 'sai_049' })).toBe('Connecté à : @sai_049');
    expect(t('profile.contactdetails.not_connected')).toBe('Non connecté');

    await setLanguage('es');
    expect(t('profile.contactdetails.disconnect_telegram')).toBe('Desconectar Telegram');
    expect(t('profile.contactdetails.connected_to', { username: 'sai_049' })).toBe('Conectado a: @sai_049');
    expect(t('profile.contactdetails.not_connected')).toBe('No conectado');

    await setLanguage('de');
    expect(t('profile.contactdetails.disconnect_telegram')).toBe('Telegram trennen');
    expect(t('profile.contactdetails.connected_to', { username: 'sai_049' })).toBe('Verbunden mit: @sai_049');
    expect(t('profile.contactdetails.not_connected')).toBe('Nicht verbunden');

    // Native script transliterations for Telegram
    await setLanguage('ru');
    expect(t('nav.bottomtabs.telegram')).toBe('Телеграм');

    await setLanguage('ja');
    expect(t('nav.bottomtabs.telegram')).toBe('テレグラム');

    await setLanguage('zh');
    expect(t('nav.bottomtabs.telegram')).toBe('电报');
  });

  it('translates WhatsApp and Telegram contact details notices across languages', async () => {
    await setLanguage('en');
    expect(t('profile.userdetails.contact_unlock_on_accept')).toContain('WhatsApp number and Telegram contact');
    expect(t('profile.userdetails.contact_locked_desc')).toContain('WhatsApp or Telegram');
    expect(t('profile.contactdetails.select_chat_app')).toContain('WhatsApp or Telegram');

    await setLanguage('fr');
    expect(t('profile.userdetails.contact_unlock_on_accept')).toContain('numéro WhatsApp et son contact Telegram');
    expect(t('profile.userdetails.contact_locked_desc')).toContain('WhatsApp ou Telegram');
    expect(t('profile.contactdetails.select_chat_app')).toContain('WhatsApp ou Telegram');

    await setLanguage('es');
    expect(t('profile.userdetails.contact_unlock_on_accept')).toContain('número de WhatsApp y su contacto de Telegram');
    expect(t('profile.userdetails.contact_locked_desc')).toContain('WhatsApp o Telegram');
    expect(t('profile.contactdetails.select_chat_app')).toContain('WhatsApp o Telegram');
  });

  it('correctly extracts telegram handle from various source shapes without losing connection', () => {
    const { extractTelegram } = require('../src/utils/whatsappHelper');
    expect(extractTelegram('my_tg_handle')).toBe('my_tg_handle');
    expect(extractTelegram('@my_tg_handle')).toBe('my_tg_handle');
    expect(extractTelegram('', { telegramUsername: 'alex_tg' })).toBe('alex_tg');
    expect(extractTelegram('', { telegram: 'alex_tg' })).toBe('alex_tg');
    expect(extractTelegram('', null, 'stored_handle')).toBe('stored_handle');
    expect(extractTelegram('NONE', 'NULL', 'UNDEFINED', 'real_user')).toBe('real_user');
  });
});
