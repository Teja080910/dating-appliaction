const { Telegraf, Markup } = require('telegraf');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.error('❌ ERROR: Missing TELEGRAM_BOT_TOKEN!');
  console.error('Please create telegram-bot/.env and set your token from @BotFather:');
  console.error('TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// 1. /start command
bot.start((ctx) => {
  const name = ctx.from.first_name || 'there';
  const username = ctx.from.username ? `@${ctx.from.username}` : 'your account';

  return ctx.reply(
    `👋 *Welcome to Amara Dating, ${name}!*\n\n` +
      `You are connected as *${username}*.\n\n` +
      `Here are quick commands:\n` +
      `• /login - Open Amara login\n` +
      `• /help - Support and information\n` +
      `• /connect - How to link your account in the app`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔐 Log In Info', 'LOGIN_INFO')],
        [Markup.button.callback('❓ Help & Support', 'HELP_INFO')],
      ]),
    }
  );
});

// 2. /help command
bot.help((ctx) => {
  return ctx.reply(
    `✨ *Amara Support & Help*\n\n` +
      `• *How Amara Works:* When someone sends an invite and both profiles accept, your handles connect for private conversation.\n\n` +
      `• *Need Account Help:* Open the Amara app, go to *Profile* ➔ *Support* to raise a ticket, or email support@amara.app.\n\n` +
      `• *Commands:*\n` +
      `/login - Instructions to log in\n` +
      `/help - Show this guide\n` +
      `/connect - How to link your Telegram username`,
    { parse_mode: 'Markdown' }
  );
});

// 3. /login command
bot.command('login', (ctx) => {
  return ctx.reply(
    `🔐 *Log In to Amara*\n\n` +
      `1. Open the *Amara* app on your mobile device.\n` +
      `2. Enter your registered email or phone number and password/OTP.\n` +
      `3. Go to *Profile* ➔ *Telegram* and ensure your username (@${ctx.from.username || 'username'}) matches!\n\n` +
      `Once linked, you will receive invitation updates here!`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ Got it', 'ACK_LOGIN')],
      ]),
    }
  );
});

// 4. /connect command
bot.command('connect', (ctx) => {
  const userHandle = ctx.from.username;
  if (userHandle) {
    return ctx.reply(
      `🔗 *Your Telegram Username:* @${userHandle}\n\n` +
        `To link it to Amara:\n` +
        `1. Open the Amara app.\n` +
        `2. Go to *Profile* ➔ *Telegram*.\n` +
        `3. Enter \`${userHandle}\` and tap *Connect*.\n\n` +
        `You're all set!`,
      { parse_mode: 'Markdown' }
    );
  } else {
    return ctx.reply(
      `⚠️ *No Telegram Username Set*\n\n` +
        `You haven't set a public username on Telegram yet.\n` +
        `Go to Telegram *Settings* ➔ *Username* to create one (e.g., @john_doe), then use it in Amara!`,
      { parse_mode: 'Markdown' }
    );
  }
});

// Inline button actions
bot.action('LOGIN_INFO', (ctx) => {
  ctx.answerCbQuery();
  return ctx.reply(
    `📱 To log in, open the Amara app on your phone. Make sure your Telegram handle matches @${ctx.from.username || 'username'} in settings!`
  );
});

bot.action('HELP_INFO', (ctx) => {
  ctx.answerCbQuery();
  return ctx.reply(
    `Need direct support? Email us at support@amara.app or open Support in the Amara app.`
  );
});

bot.action('ACK_LOGIN', (ctx) => {
  ctx.answerCbQuery('Ready!');
});

// Launch bot
bot
  .launch()
  .then(() => {
    console.log('-------------------------------------------');
    console.log('🤖 Amara Telegram Bot is ONLINE locally!');
    console.log('👉 Open Telegram and test: t.me/amara_dating_bot');
    console.log('👉 Send /start, /login, or /help to see responses');
    console.log('-------------------------------------------');
  })
  .catch((err) => {
    console.error('❌ Failed to launch bot:', err);
  });

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
