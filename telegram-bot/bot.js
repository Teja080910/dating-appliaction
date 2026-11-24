const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.error('❌ ERROR: Missing TELEGRAM_BOT_TOKEN!');
  console.error('Please create telegram-bot/.env and set your token from @BotFather:');
  console.error('TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Persistent store for user chat IDs & pending match notifications
const STORE_PATH = path.join(__dirname, 'bot_users.json');

const loadStore = () => {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    }
  } catch (e) {}
  return { byUsername: {}, byUserId: {}, pendingMatches: {} };
};

const saveStore = (store) => {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save bot store:', e);
  }
};

const recordUserChat = (chatId, username, startPayload) => {
  const store = loadStore();
  if (username) {
    const cleanUser = username.toLowerCase().replace(/^@+/, '');
    store.byUsername[cleanUser] = chatId;
  }
  if (startPayload) {
    const cleanStart = String(startPayload).replace(/^USER_/i, '').trim();
    if (cleanStart) {
      store.byUserId[cleanStart] = chatId;
    }
  }
  saveStore(store);
  return store;
};

const resolveChatId = (username, userId) => {
  const store = loadStore();
  if (userId && store.byUserId[String(userId)]) {
    return store.byUserId[String(userId)];
  }
  if (username) {
    const cleanUser = username.toLowerCase().replace(/^@+/, '');
    if (store.byUsername[cleanUser]) {
      return store.byUsername[cleanUser];
    }
  }
  return null;
};

const buildMatchKeyboard = (payload) => {
  const buttons = [];
  const femaleTg = payload.femaleTelegram ? String(payload.femaleTelegram).replace(/^@+/, '') : '';
  const digits = payload.femaleWhatsApp ? String(payload.femaleWhatsApp).replace(/[^\d]/g, '') : '';
  const cleanDigits = digits.startsWith('9191') ? digits.slice(2) : digits;

  const actionButtons = [];
  if (femaleTg) {
    actionButtons.push(Markup.button.url('💬 Chat on Telegram', `https://t.me/${femaleTg}`));
  } else if (cleanDigits) {
    actionButtons.push(Markup.button.url('💬 Chat on WhatsApp', `https://wa.me/${cleanDigits}`));
  }

  buttons.push([Markup.button.url('📱 View Profile in Amara', 'https://amara.app')]);
  if (actionButtons.length > 0) {
    buttons.unshift(actionButtons);
  }

  return Markup.inlineKeyboard(buttons);
};

const formatMatchMessage = (payload) => {
  const femaleName = payload.femaleName || 'A member';
  const femaleAge = payload.femaleAge ? `${payload.femaleAge} years` : '';
  const femaleLocation = payload.femaleLocation || '';
  const femaleTg = payload.femaleTelegram ? `@${payload.femaleTelegram.replace(/^@+/, '')}` : '';
  let femalePhone = payload.femaleWhatsApp ? String(payload.femaleWhatsApp).trim() : '';
  let cleanDigits = '';
  if (femalePhone) {
    const digits = femalePhone.replace(/[^\d]/g, '');
    cleanDigits = digits;
    if (cleanDigits.startsWith('9191')) cleanDigits = cleanDigits.slice(2);
  }

  const ageLoc = [femaleAge, femaleLocation].filter(Boolean).join(' • ');

  let msg = `🎉 *Interest Accepted!* 🎉\n\n`;
  msg += `Congratulations! 🎉\n`;
  msg += `Your interest request has been accepted by *${femaleName}* on Amara! ❤️\n\n`;
  msg += `👤 *Profile Details:*\n`;
  msg += `• Name: *${femaleName}* ✅\n`;
  if (ageLoc) msg += `• Age & City: *${ageLoc}*\n`;
  if (payload.femaleProfession) msg += `• Profession: 💼 *${payload.femaleProfession}*\n`;
  if (payload.femaleEducation) msg += `• Education: 🎓 *${payload.femaleEducation}*\n`;
  if (payload.femaleBio) msg += `• Bio: _${payload.femaleBio}_\n`;

  if (femaleTg || femalePhone) {
    msg += `\n📲 *Direct Contact:*\n`;
    if (femaleTg) msg += `💬 *Telegram:* ${femaleTg}\n`;
    if (femalePhone) msg += `📱 *WhatsApp:* ${femalePhone} (https://wa.me/${cleanDigits})\n`;
  }

  msg += `\n_You can now view her full profile and start a conversation on the Amara App._`;
  return msg;
};

// 1. /start command
bot.start(async (ctx) => {
  const name = ctx.from.first_name || 'there';
  const username = ctx.from.username ? `@${ctx.from.username}` : '';
  const chatId = ctx.chat.id;
  const startText = ctx.message?.text || '';
  const parts = startText.split(' ');
  const startParam = parts.length > 1 ? parts[1] : '';

  const store = recordUserChat(chatId, ctx.from.username, startParam);
  console.log(`🤖 Registered user chatId=${chatId}, username=${username}, param=${startParam}`);

  // Check for any pending match notifications for this user
  const userKey = ctx.from.username ? ctx.from.username.toLowerCase() : String(chatId);
  const pending = store.pendingMatches && store.pendingMatches[userKey];
  if (Array.isArray(pending) && pending.length > 0) {
    for (const matchPayload of pending) {
      const msg = formatMatchMessage(matchPayload);
      await ctx.reply(msg, { parse_mode: 'Markdown' }).catch(() => {});
    }
    delete store.pendingMatches[userKey];
    saveStore(store);
  }

  return ctx.reply(
    `👋 *Welcome to Amara Dating, ${name}!*\n\n` +
      `Your account is now linked to Amara! You will receive instant notifications whenever a match accepts your invitation, including her connected Telegram and WhatsApp contact details.\n\n` +
      `Quick commands:\n` +
      `• /login - Open Amara login\n` +
      `• /help - Support and information\n` +
      `• /connect - Link status`,
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
      `/connect - Link status`,
    { parse_mode: 'Markdown' }
  );
});

// 3. /login command
bot.command('login', (ctx) => {
  return ctx.reply(
    `🔐 *Log In to Amara*\n\n` +
      `1. Open the *Amara* app on your mobile device.\n` +
      `2. Enter your registered email or phone number and password/OTP.\n` +
      `3. Go to *Profile* ➔ *Contact Details* and ensure your Telegram username matches @${ctx.from.username || 'username'}!\n\n` +
      `Once linked, you will receive real-time match and invitation updates here!`,
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
  const chatId = ctx.chat.id;
  recordUserChat(chatId, userHandle);

  if (userHandle) {
    return ctx.reply(
      `🔗 *Your Telegram Username:* @${userHandle}\n\n` +
        `Your Telegram account is active and registered (ID: \`${chatId}\`).\n\n` +
        `To link it to Amara:\n` +
        `1. Open the Amara app.\n` +
        `2. Go to *Profile* ➔ *Contact Details*.\n` +
        `3. Enter \`${userHandle}\` and tap *Connect*.\n\n` +
        `You will receive all match updates and partner details directly in this chat!`,
      { parse_mode: 'Markdown' }
    );
  } else {
    return ctx.reply(
      `⚠️ *No Telegram Username Set*\n\n` +
        `You haven't set a public username on Telegram yet.\n` +
        `Go to Telegram *Settings* ➔ *Username* to create one (e.g., @john_doe), then connect in Amara!`,
      { parse_mode: 'Markdown' }
    );
  }
});

// 4b. /status command
bot.command('status', (ctx) => {
  const userHandle = ctx.from.username;
  const chatId = ctx.chat.id;
  const store = loadStore();

  const isLinked =
    (userHandle && store.byUsername && store.byUsername[userHandle.toLowerCase()]) ||
    (store.byUserId && Object.values(store.byUserId).includes(chatId));

  if (isLinked) {
    return ctx.reply(
      `✅ *Telegram Account Linked!*\n\n` +
        `• Username: @${userHandle || 'linked'}\n` +
        `• Chat ID: \`${chatId}\`\n\n` +
        `Your account is fully connected to Amara. You will receive real-time notifications here when matches accept your invitations!`,
      { parse_mode: 'Markdown' }
    );
  }

  return ctx.reply(
    `❌ *Not Linked Yet.*\n\n` +
      `Open the Amara app > Profile > Settings > Contact Details and tap *Connect Telegram* to link this account.`,
    { parse_mode: 'Markdown' }
  );
});
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

// 5. Lightweight HTTP Webhook Server for App & Backend Integration
const HTTP_PORT = process.env.PORT || 9396;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'online', bot: 'amara_dating_bot', port: HTTP_PORT }));
    return;
  }

  // Match notification webhook: POST /notify-match
  if (req.method === 'POST' && req.url === '/notify-match') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const chatId = resolveChatId(payload.maleTelegram, payload.maleUserId);
        const messageText = payload.message || formatMatchMessage(payload);

        if (chatId) {
          const keyboard = buildMatchKeyboard(payload);
          if (payload.femalePhoto && payload.femalePhoto.startsWith('http')) {
            try {
              await bot.telegram.sendPhoto(chatId, payload.femalePhoto, {
                caption: messageText,
                parse_mode: 'Markdown',
                ...keyboard,
              });
            } catch {
              await bot.telegram.sendMessage(chatId, messageText, {
                parse_mode: 'Markdown',
                ...keyboard,
              });
            }
          } else {
            await bot.telegram.sendMessage(chatId, messageText, {
              parse_mode: 'Markdown',
              ...keyboard,
            });
          }
          console.log(`✅ [Telegram Bot] Match notification delivered to chatId=${chatId}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'delivered', chatId }));
        } else {
          // Store pending match notification to deliver upon next /start
          const store = loadStore();
          store.pendingMatches = store.pendingMatches || {};
          const key = payload.maleTelegram ? payload.maleTelegram.toLowerCase().replace(/^@+/, '') : String(payload.maleUserId || 'unknown');
          store.pendingMatches[key] = store.pendingMatches[key] || [];
          store.pendingMatches[key].push(payload);
          saveStore(store);

          console.log(`⏳ [Telegram Bot] User chatId not registered yet for '${key}'. Queued for next /start.`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'queued', message: 'Queued for user /start' }));
        }
      } catch (err) {
        console.error('❌ [Telegram Bot] Webhook error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(HTTP_PORT, () => {
  console.log(`🌐 Amara Telegram Bot Webhook Server running on port ${HTTP_PORT}`);
});

// Launch bot
bot
  .launch()
  .then(() => {
    console.log('-------------------------------------------');
    console.log('🤖 Amara Telegram Bot is ONLINE!');
    console.log('👉 Open Telegram and test: t.me/amara_dating_bot');
    console.log('👉 Send /start to link your account');
    console.log('-------------------------------------------');
  })
  .catch((err) => {
    console.error('❌ Failed to launch bot polling:', err);
  });

// Graceful stop
process.once('SIGINT', () => {
  server.close();
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  server.close();
  bot.stop('SIGTERM');
});
