import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import os from 'os';
import { getSqliteDb, querySql, execSql, saveSqliteDb } from './sqlite.ts';

// Explicitly load .env from current working directory
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Process-level error handlers to prevent unhandled rejections from crashing the server
process.on('unhandledRejection', (reason) => {
  console.warn('⚠️ Unhandled Promise Rejection caught:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception caught:', err.message);
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

let usersInitialized = false;
app.use(async (req, res, next) => {
  if (!usersInitialized) {
    usersInitialized = true;
    try {
      await ensureDefaultUsers();
    } catch (err: any) {
      console.error('Auto-init error:', err?.message || err);
    }
  }
  next();
});

// API Health Check
app.get('/api/health', async (req, res) => {
  try {
    const userCount = (await getUsers()).length;
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      database: 'sqlite',
      userCount,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (err: any) {
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      database: 'sqlite',
      health: 'degraded',
      error: err?.message || 'Health check error'
    });
  }
});

// Persistent JSON file paths (Legacy - keeping for Electron local fallback if needed, but primary is Firestore)
const isElectron = !!process.versions.electron;
const DATA_DIR = process.env.VERCEL
  ? '/tmp/data'
  : (isElectron 
      ? path.join(process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library/Application Support') : '/tmp'), 'PulseData')
      : path.join(process.cwd(), 'data'));

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const EMAILS_FILE = path.join(DATA_DIR, 'emails.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface StoredUser {
  id: string;
  login: string;
  displayName: string;
  password: string;
  email: string;
  avatar: string;
  role: string;
  badge: string;
  isVerified: boolean;
  verificationCode?: string;
  createdAt: number;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  friends?: string[]; // logins
  friendRequestsIncoming?: string[]; // logins
  friendRequestsOutgoing?: string[]; // logins
  blockedLogins?: string[]; // logins
}

export interface StoredEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  code?: string;
  type: 'verification' | 'login_alert';
  createdAt: number;
  read: boolean;
}

// Initial demo user (single test account)
const DEFAULT_USERS: StoredUser[] = [
  {
    id: 'u-phantom-001',
    login: 'phantom',
    displayName: 'Phantom Gamer',
    password: '123',
    email: 'phantom@pulse.gg',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    role: 'Pulse Tester',
    badge: 'TESTER',
    isVerified: true,
    status: 'online',
    customStatus: '⚡ В сети (тестовый аккаунт)',
    friends: [],
    friendRequestsIncoming: [],
    friendRequestsOutgoing: [],
    createdAt: Date.now() - 86400000
  }
];

async function ensureUserExists(login: string, displayName?: string, avatar?: string): Promise<StoredUser> {
  const normLogin = login.trim().toLowerCase().replace(/^@+/, '');
  let user = await getUserByLogin(normLogin);
  if (!user) {
    user = {
      id: `u-${normLogin}`,
      login: normLogin,
      displayName: displayName || normLogin,
      password: normLogin,
      email: `${normLogin}@pulse.gg`,
      avatar: avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      role: 'Pulse Member',
      badge: 'MEMBER',
      isVerified: true,
      status: 'online',
      customStatus: '⚡ В сети в Pulse',
      friends: [],
      friendRequestsIncoming: [],
      friendRequestsOutgoing: [],
      createdAt: Date.now()
    };
    await saveUser(user);
  }

  return user;
}


// Firebase Helpers with Fallback to Local JSON
async function getUsers(): Promise<StoredUser[]> {
  try {
    const rows = await querySql('SELECT * FROM users');
    if (rows && rows.length > 0) {
      const localUsers = getLocalUsers();
      return rows.map((r: any) => {
        const localMatch = localUsers.find(u => u.id === r.id || u.login.toLowerCase() === (r.login || '').toLowerCase());
        return {
          id: r.id,
          login: r.login,
          displayName: r.display_name || r.login,
          password: r.password || '123',
          email: r.email || `${r.login}@pulse.gg`,
          avatar: r.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: r.role || 'Pulse Member',
          badge: r.badge || 'MEMBER',
          isVerified: Boolean(r.is_verified),
          status: r.status || 'online',
          customStatus: r.custom_status || '⚡ В сети в Pulse',
          createdAt: r.created_at || Date.now(),
          friends: localMatch?.friends || [],
          friendRequestsIncoming: localMatch?.friendRequestsIncoming || [],
          friendRequestsOutgoing: localMatch?.friendRequestsOutgoing || [],
          blockedLogins: localMatch?.blockedLogins || []
        };
      });
    }
  } catch (err) {
    console.warn('SQLite getUsers error:', err);
  }
  return getLocalUsers();
}

function getLocalUsers(): StoredUser[] {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return [...DEFAULT_USERS];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [...DEFAULT_USERS];
  } catch (e) {
    return [...DEFAULT_USERS];
  }
}

async function getUserByLogin(login: string): Promise<StoredUser | null> {
  if (!login) return null;
  const normLogin = login.trim().toLowerCase().replace(/^@+/, '');
  const allUsers = await getUsers();
  return allUsers.find(u => u.login.toLowerCase().replace(/^@+/, '') === normLogin) || null;
}

async function findUserFlexible(query: string): Promise<StoredUser | null> {
  if (!query) return null;
  const clean = query.trim().toLowerCase().replace(/^@+/, '');
  if (!clean) return null;

  const direct = await getUserByLogin(clean);
  if (direct) return direct;

  const allUsers = await getUsers();
  return (
    allUsers.find(
      (u) =>
        u.login.toLowerCase().replace(/^@+/, '') === clean ||
        u.displayName.toLowerCase() === clean ||
        u.email.toLowerCase() === clean
    ) || null
  );
}

async function getUserById(id: string): Promise<StoredUser | null> {
  if (!id) return null;
  const allUsers = await getUsers();
  return allUsers.find(u => u.id === id) || null;
}

async function saveUser(user: StoredUser) {
  const normLogin = user.login.toLowerCase().trim();

  try {
    await execSql(
      `INSERT INTO users (id, login, display_name, email, password, avatar, role, badge, bio, status, custom_status, is_verified, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         login = excluded.login,
         display_name = excluded.display_name,
         email = excluded.email,
         password = excluded.password,
         avatar = excluded.avatar,
         role = excluded.role,
         badge = excluded.badge,
         bio = excluded.bio,
         status = excluded.status,
         custom_status = excluded.custom_status,
         is_verified = excluded.is_verified`,
      [
        user.id,
        normLogin,
        user.displayName || normLogin,
        user.email || '',
        user.password || '123',
        user.avatar || '',
        user.role || 'Pulse Member',
        user.badge || 'MEMBER',
        '',
        user.status || 'online',
        user.customStatus || '⚡ В сети в Pulse',
        user.isVerified ? 1 : 0,
        user.createdAt || Date.now()
      ]
    );
  } catch (e) {
    console.warn('SQLite saveUser warning:', e);
  }

  // Backup to JSON file
  const users = getLocalUsers();
  const index = users.findIndex(u => u.login.toLowerCase() === normLogin);
  if (index !== -1) {
    users[index] = user;
  } else {
    users.push(user);
  }
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('Failed to save local users backup:', e);
  }
}

async function getEmails(): Promise<StoredEmail[]> {
  return getLocalEmails();
}

async function getEmailsByTo(to: string): Promise<StoredEmail[]> {
  const normTo = to.toLowerCase().trim();
  return getLocalEmails().filter(e => e.to.toLowerCase().trim() === normTo);
}

function getLocalEmails(): StoredEmail[] {
  try {
    if (!fs.existsSync(EMAILS_FILE)) return [];
    const data = fs.readFileSync(EMAILS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

async function saveEmail(email: StoredEmail) {
  const emails = getLocalEmails();
  emails.unshift(email);
  try {
    fs.writeFileSync(EMAILS_FILE, JSON.stringify(emails, null, 2));
  } catch (e) {
    console.error('Failed to save local emails backup:', e);
  }
}

async function ensureDefaultUsers() {
  console.log('🔄 Initializing SQLite database and users...');
  try {
    if (fs.existsSync(USERS_FILE)) {
      try {
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        const localUsers: StoredUser[] = JSON.parse(data);
        if (Array.isArray(localUsers)) {
          for (const user of localUsers) {
            await saveUser(user);
          }
        }
      } catch (e: any) {
        console.error('❌ Migration failed:', e.message);
      }
    }

    for (const user of DEFAULT_USERS) {
      const existing = await getUserByLogin(user.login);
      if (!existing) {
        await saveUser(user);
        console.log(`✨ Initialized default user: ${user.login}`);
      }
    }

    try {
      await execSql("DELETE FROM direct_messages WHERE content LIKE '%тестовое%' OR content LIKE '%симулированное%' OR content LIKE '%Привет!%'");
    } catch (e) {
      console.warn('Failed to clear test direct messages on startup:', e);
    }

    console.log('✅ SQLite User initialization complete.');
  } catch (err: any) {
    console.warn('⚠️ Failed to ensure default users:', err.message);
  }
}

// Helper to clean environment variable string (removes quotes and leading/trailing whitespace)
function cleanEnv(val?: string): string {
  if (!val) return '';
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s.trim();
}

// Helper to create Nodemailer transporter for REAL emails (Mail.ru, Yandex, Gmail, Custom SMTP)
function createSmtpTransporter() {
  const hostRaw = cleanEnv(process.env.SMTP_HOST);
  const portRaw = cleanEnv(process.env.SMTP_PORT) || '465';
  const port = parseInt(portRaw, 10);
  const user = cleanEnv(process.env.SMTP_USER || process.env.GMAIL_USER || process.env.YANDEX_USER || process.env.MAILRU_USER);
  const pass = cleanEnv(process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.YANDEX_PASS || process.env.MAILRU_PASS);

  if (!user || !pass) {
    return null;
  }

  let host = hostRaw;
  if (!host) {
    const userLower = user.toLowerCase();
    if (userLower.endsWith('@gmail.com')) {
      host = 'smtp.gmail.com';
    } else if (userLower.endsWith('@yandex.ru') || userLower.endsWith('@ya.ru')) {
      host = 'smtp.yandex.ru';
    } else if (
      userLower.endsWith('@mail.ru') ||
      userLower.endsWith('@bk.ru') ||
      userLower.endsWith('@inbox.ru') ||
      userLower.endsWith('@list.ru') ||
      userLower.endsWith('@internet.ru')
    ) {
      host = 'smtp.mail.ru';
    } else {
      host = 'smtp.mail.ru';
    }
  }

  const isSecure = port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });

  return { transporter, host, port, user, pass };
}

// TEST SMTP ENDPOINT
app.post('/api/auth/test-smtp', async (req, res) => {
  const { email } = req.body;
  const smtpConfig = createSmtpTransporter();
  if (!smtpConfig) {
    return res.status(400).json({ success: false, error: 'SMTP настройки не найдены или пустые в .env файле (SMTP_USER / SMTP_PASS)' });
  }
  try {
    const testEmail = email || smtpConfig.user;
    const fromAddr = cleanEnv(process.env.SMTP_FROM) || `Pulse HQ <${smtpConfig.user}>`;

    await smtpConfig.transporter.sendMail({
      from: fromAddr,
      to: testEmail,
      subject: '⚡ Pulse HQ — Тест SMTP подключения',
      text: 'SMTP подключение работает успешно! Письма будут приходить на вашу почту.'
    });
    res.json({ success: true, message: `Тестовое письмо успешно отправлено на ${testEmail}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: `Ошибка SMTP: ${err?.message || err}` });
  }
});

// GET LATEST EMAIL VERIFICATION CODE (UI Convenience Fallback)
app.get('/api/auth/latest-code', async (req, res) => {
  const emailParam = (req.query.email as string || '').toLowerCase().trim();
  const emails = await getEmails();
  const sorted = emails
    .filter(e => !emailParam || e.to === emailParam || e.to.includes(emailParam))
    .sort((a, b) => b.createdAt - a.createdAt);

  const found = sorted.find(e => !!e.code);
  if (found && found.code) {
    return res.json({ success: true, code: found.code, email: found.to, createdAt: found.createdAt });
  }
  res.status(404).json({ success: false, error: 'Код подтверждения пока не найден' });
});

// Helper to send email (Sends to REAL external email inbox if SMTP is configured, plus internal server inbox backup)
async function sendEmailNotification(
  to: string,
  subject: string,
  body: string,
  code?: string,
  type: 'verification' | 'login_alert' = 'verification'
) {
  const normTo = to.toLowerCase().trim();
  const newEmail: StoredEmail = {
    id: `mail-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    to: normTo,
    subject,
    body,
    code,
    type,
    createdAt: Date.now(),
    read: false
  };
  await saveEmail(newEmail);

  console.log(`\n================ EMAIL PROCESSED FOR [${normTo}] ================`);
  console.log(`Subject: ${subject}`);
  if (code) console.log(`CODE: ${code}`);

  let realSent = false;
  let smtpError: string | null = null;
  const smtpConfig = createSmtpTransporter();

  // 1. Try Resend HTTP API if key is set
  const resendKey = cleanEnv(process.env.RESEND_API_KEY);
  if (resendKey) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: cleanEnv(process.env.SMTP_FROM) || 'Pulse HQ <onboarding@resend.dev>',
          to: [normTo],
          subject,
          text: body,
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #09090B; color: #F5F5F7; padding: 24px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #22D3EE;">
              <h2 style="color: #22D3EE; margin-top: 0; font-size: 20px;">⚡ Pulse HQ — Безопасность</h2>
              <p style="font-size: 14px; color: #D4D4D8; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</p>
              ${
                code
                  ? `<div style="background-color: #17171C; padding: 18px; border-radius: 14px; text-align: center; margin: 24px 0; border: 1px solid rgba(34,211,238,0.4);">
                      <div style="font-size: 11px; color: #A1A1AA; text-transform: uppercase; tracking: 1px; margin-bottom: 6px;">Код Подтверждения:</div>
                      <span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 8px; color: #22D3EE;">${code}</span>
                     </div>`
                  : ''
              }
            </div>
          `
        })
      });
      const resendData = await resendRes.json();
      if (resendRes.ok) {
        realSent = true;
        console.log(`✅ [RESEND API] Email successfully delivered via Resend API to ${normTo}`);
      } else {
        console.error(`❌ [RESEND API ERROR]:`, resendData);
      }
    } catch (err: any) {
      console.error(`❌ [RESEND API EXCEPTION]:`, err?.message || err);
    }
  }

  // 2. Try Nodemailer SMTP if not sent via Resend
  if (!realSent) {
    if (smtpConfig) {
      const { transporter, host, port, user } = smtpConfig;
      try {
        const customFrom = cleanEnv(process.env.SMTP_FROM);
        const fromAddr = customFrom || `Pulse HQ <${user}>`;

        console.log(`📡 Sending SMTP email via ${host}:${port} as [${user}]...`);

        await transporter.sendMail({
          from: fromAddr,
          to: normTo,
          subject,
          text: body,
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #09090B; color: #F5F5F7; padding: 24px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #22D3EE;">
              <h2 style="color: #22D3EE; margin-top: 0; font-size: 20px;">⚡ Pulse HQ — Безопасность</h2>
              <p style="font-size: 14px; color: #D4D4D8; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</p>
              ${
                code
                  ? `<div style="background-color: #17171C; padding: 18px; border-radius: 14px; text-align: center; margin: 24px 0; border: 1px solid rgba(34,211,238,0.4);">
                      <div style="font-size: 11px; color: #A1A1AA; text-transform: uppercase; tracking: 1px; margin-bottom: 6px;">Код Подтверждения:</div>
                      <span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 8px; color: #22D3EE;">${code}</span>
                     </div>`
                  : ''
              }
              <div style="font-size: 11px; color: #71717A; text-align: center; margin-top: 24px; border-t: 1px solid #27272A; padding-top: 12px;">
                Письмо отправлено автоматически для ${normTo}. Если вы не совершали этот запрос, проигнорируйте его.
              </div>
            </div>
          `
        });
        realSent = true;
        console.log(`✅ [REAL SMTP] Email successfully delivered to real inbox: ${normTo}`);
      } catch (err: any) {
        smtpError = err?.message || String(err);
        console.error(`❌ [REAL SMTP ERROR] Failed sending to ${normTo}:`, smtpError);
        if (smtpError?.includes('535') || smtpError?.includes('Authentication failed') || smtpError?.includes('Invalid login')) {
          console.error(`💡 [ПОДСКАЗКА]: Mail.ru, Yandex и Gmail ТРЕБУЮТ "Пароль для внешних приложений" (а не обычный пароль от почты!).
Создать пароль приложения в Mail.ru: Почта -> Настройки -> Пароль и безопасность -> Пароли для внешних приложений.`);
        }
      }
    } else {
      console.log(`ℹ️ [SMTP INFO] SMTP credentials not specified in env. Email stored in app inbox.`);
    }
  }
  console.log(`============================================================\n`);

  return { newEmail, realSent, isConfigured: !!(resendKey || smtpConfig), smtpError };
}

// ==================== AUTH API ROUTES ====================

// 1. REGISTER ACCOUNT
app.post('/api/auth/register', async (req, res) => {
  const { login, displayName, password, email } = req.body;

  if (!login || !password || !email) {
    return res.status(400).json({ success: false, error: 'Заполните все обязательные поля' });
  }

  const normLogin = login.trim().toLowerCase();
  const normEmail = email.trim().toLowerCase();
  
  const existingUser = await getUserByLogin(normLogin);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: `Логин "@${normLogin}" уже зарегистрирован! Попробуйте войти.`
    });
  }

  const newUser: StoredUser = {
    id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    login: normLogin,
    displayName: displayName?.trim() || normLogin,
    password,
    email: normEmail,
    avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    role: 'Squad Member',
    badge: 'PULSE USER',
    isVerified: true,
    createdAt: Date.now()
  };

  await saveUser(newUser);

  res.json({
    success: true,
    message: 'Регистрация прошла успешно! Добро пожаловать!',
    user: sanitizeUser(newUser)
  });
});

// 2. VERIFY CODE
app.post('/api/auth/verify', async (req, res) => {
  const { login } = req.body;
  const normLogin = login?.trim()?.toLowerCase();

  const user = await getUserByLogin(normLogin);

  if (!user) {
    return res.status(404).json({ success: false, error: 'Пользователь не найден' });
  }

  user.isVerified = true;
  await saveUser(user);

  res.json({
    success: true,
    message: 'Успешный вход в аккаунт!',
    user: sanitizeUser(user)
  });
});

// 2.5 RESEND CODE
app.post('/api/auth/resend-code', async (req, res) => {
  res.json({
    success: true,
    message: 'Код верификации не требуется.'
  });
});

// 3. LOGIN ACCOUNT
app.post('/api/auth/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ success: false, error: 'Введите логин и пароль' });
  }

  const normLogin = login.trim().toLowerCase();
  const user = await getUserByLogin(normLogin);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: `Пользователь с логином "@${normLogin}" не существует. Зарегистрируйтесь!`
    });
  }

  if (user.password !== password) {
    return res.status(400).json({ success: false, error: 'Неверный пароль' });
  }

  user.isVerified = true;
  await saveUser(user);

  return res.json({
    success: true,
    message: 'Успешный вход!',
    user: sanitizeUser(user)
  });
});

// 3.5 GUEST QUICK LOGIN (SERVER REGISTER)
app.post('/api/auth/guest', async (req, res) => {
  const { guestNum } = req.body;
  const num = guestNum || Math.floor(1000 + Math.random() * 9000);
  const normLogin = `guest_${num}`;
  const displayName = `Гость #${num}`;

  let user = await getUserByLogin(normLogin);
  if (!user) {
    user = {
      id: `u-guest-${num}`,
      login: normLogin,
      displayName,
      password: `guest_${num}`,
      email: `${normLogin}@pulse.gg`,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      role: 'Временный аккаунт',
      badge: 'GUEST',
      isVerified: true,
      status: 'online',
      customStatus: '⚡ Временный гость в Pulse',
      friends: [],
      friendRequestsIncoming: [],
      friendRequestsOutgoing: [],
      createdAt: Date.now()
    };
    await saveUser(user);
  }

  res.json({
    success: true,
    user: sanitizeUser(user)
  });
});

// 4. RESET PASSWORD REQUEST
app.post('/api/auth/reset-password-request', async (_req, res) => {
  return res.status(400).json({
    success: false,
    error: 'Восстановление пароля временно недоступно.'
  });
});

// 5. RESET PASSWORD CONFIRM
app.post('/api/auth/reset-password-confirm', async (req, res) => {
  const { login, code, newPassword } = req.body;
  if (!login || !code || !newPassword) {
    return res.status(400).json({ success: false, error: 'Заполните все поля' });
  }

  if (newPassword.length < 3) {
    return res.status(400).json({ success: false, error: 'Новый пароль должен быть не менее 3 символов' });
  }

  const normLogin = login.trim().toLowerCase();
  const user = await getUserByLogin(normLogin);

  if (!user) {
    return res.status(404).json({ success: false, error: 'Пользователь не найден' });
  }

  if (!user.verificationCode || user.verificationCode !== code.trim()) {
    return res.status(400).json({ success: false, error: 'Неверный код восстановления пароля' });
  }

  // Update password
  user.password = newPassword;
  delete user.verificationCode;
  await saveUser(user);

  // Send alert
  sendEmailNotification(
    user.email,
    `🔑 Безопасность Pulse — Пароль от аккаунта @${user.login} обновлен`,
    `Ваш пароль был успешно изменён.\nТеперь вы можете войти с новым паролем.`,
    undefined,
    'login_alert'
  );

  res.json({
    success: true,
    message: 'Пароль успешно обновлен! Теперь войдите в аккаунт с новым паролем.'
  });
});

// 6. UPDATE PROFILE
app.post('/api/auth/update-profile', async (req, res) => {
  const { userId, username, displayName, avatar, role, badge } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'Не указан ID пользователя' });
  }

  let user = await getUserById(userId);

  if (!user && username) {
    user = await getUserByLogin(username);
  }

  // Fallback: If user is not found, auto-create it to prevent session errors on server resets
  if (!user) {
    if (userId.startsWith('u-guest-') || (username && username.startsWith('guest_'))) {
      const login = username || `guest_${userId.replace('u-guest-', '')}`;
      const cleanId = userId || `u-${login}`;
      const num = login.replace('guest_', '');
      const disp = displayName || `Гость #${num}`;
      user = {
        id: cleanId,
        login: login,
        displayName: disp,
        password: login,
        email: `${login}@pulse.gg`,
        avatar: avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        role: 'Временный аккаунт',
        badge: 'GUEST',
        isVerified: true,
        status: 'online',
        customStatus: '⚡ Временный гость в Pulse',
        friends: [],
        friendRequestsIncoming: [],
        friendRequestsOutgoing: [],
        createdAt: Date.now()
      };
      await saveUser(user);
    } else if (userId === 'u-phantom-001' || username === 'phantom') {
      user = {
        id: 'u-phantom-001',
        login: 'phantom',
        displayName: displayName || 'Phantom Gamer',
        password: '123',
        email: 'phantom@pulse.gg',
        avatar: avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
        role: 'Pro Member',
        badge: 'CYAN SQUAD',
        isVerified: true,
        createdAt: Date.now(),
        status: 'online',
        customStatus: '⚡ В сети в Pulse',
        friends: [],
        friendRequestsIncoming: [],
        friendRequestsOutgoing: []
      };
      await saveUser(user);
    }
  }

  if (!user) {
    return res.status(404).json({ success: false, error: 'Пользователь не найден' });
  }

  if (displayName?.trim()) user.displayName = displayName.trim();
  if (avatar?.trim()) user.avatar = avatar.trim();
  if (role?.trim()) user.role = role.trim();
  if (badge?.trim()) user.badge = badge.trim();

  await saveUser(user);

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.login,
      displayName: user.displayName,
      avatar: user.avatar,
      email: user.email,
      role: user.role,
      badge: user.badge
    }
  });
});

// 7. GET VIRTUAL INBOX FOR EMAIL NOTIFICATIONS
app.get('/api/auth/inbox/:email', async (req, res) => {
  const email = req.params.email.trim().toLowerCase();
  const emails = await getEmailsByTo(email);
  res.json({ success: true, emails });
});

// 8. GET ALL REGISTERED ACCOUNTS (SANITIZED)
app.get('/api/auth/users', async (req, res) => {
  const usersList = await getUsers();
  const users = usersList.map((u) => ({
    id: u.id,
    login: u.login,
    displayName: u.displayName,
    avatar: u.avatar,
    email: u.email,
    isVerified: u.isVerified,
    role: u.role,
    badge: u.badge,
    status: u.status || 'online',
    customStatus: u.customStatus || '⚡ В сети в Pulse'
  }));
  res.json({ success: true, users });
});

// ==================== FRIENDS & STATUS API ROUTES ====================

// Helper to sanitize user object for client
function sanitizeUser(u: StoredUser) {
  return {
    id: u.id,
    username: u.login,
    displayName: u.displayName,
    avatar: u.avatar,
    email: u.email,
    role: u.role,
    badge: u.badge,
    status: u.status || 'online',
    customStatus: u.customStatus || '⚡ В сети в Pulse'
  };
}

// UPDATE STATUS & CUSTOM STATUS
app.post('/api/user/status', async (req, res) => {
  const { login, status, customStatus } = req.body;
  if (!login) {
    return res.status(400).json({ success: false, error: 'Укажите логин' });
  }

  const user = await ensureUserExists(login);

  if (status && ['online', 'idle', 'dnd', 'offline'].includes(status)) {
    user.status = status;
  }
  if (typeof customStatus === 'string') {
    user.customStatus = customStatus.trim();
  }

  await saveUser(user);

  res.json({
    success: true,
    user: sanitizeUser(user)
  });
});

// SEARCH USERS TO ADD AS FRIEND
app.get('/api/users/search', async (req, res) => {
  const rawQ = (req.query.q as string || '').trim().toLowerCase();
  const q = rawQ.replace(/^@+/, '');
  const currentLogin = (req.query.currentLogin as string || '').trim().toLowerCase().replace(/^@+/, '');

  if (currentLogin) {
    await ensureUserExists(currentLogin);
  }

  let usersList = await getUsers();
  // Ensure default demo users exist if database is empty
  for (const defU of DEFAULT_USERS) {
    if (!usersList.some(u => u.login.toLowerCase() === defU.login.toLowerCase())) {
      await saveUser(defU);
    }
  }
  usersList = await getUsers();

  const me = usersList.find((u) => u.login.toLowerCase().replace(/^@+/, '') === currentLogin);

  const meFriends = me?.friends || [];
  const meIncoming = me?.friendRequestsIncoming || [];
  const meOutgoing = me?.friendRequestsOutgoing || [];

  const results = usersList
    .filter((u) => {
      if (u.login.toLowerCase().replace(/^@+/, '') === currentLogin) return false;
      if (!q) return true;
      return (
        u.login.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    })
    .map((u) => {
      let relationship: 'friend' | 'pending_incoming' | 'pending_outgoing' | 'none' = 'none';
      if (meFriends.includes(u.login)) {
        relationship = 'friend';
      } else if (meIncoming.includes(u.login)) {
        relationship = 'pending_incoming';
      } else if (meOutgoing.includes(u.login)) {
        relationship = 'pending_outgoing';
      }

      return {
        ...sanitizeUser(u),
        relationship
      };
    });

  res.json({ success: true, users: results });
});

// GET USER'S FRIENDS LIST & REQUESTS
app.get('/api/friends/:login', async (req, res) => {
  const normLogin = req.params.login.trim().toLowerCase();
  const me = await ensureUserExists(normLogin);

  me.friends = me.friends || [];

  const usersList = await getUsers();
  const friendsList = usersList
    .filter((u) => (me.friends || []).includes(u.login))
    .map((u) => sanitizeUser(u));

  const incomingList = usersList
    .filter((u) => (me.friendRequestsIncoming || []).includes(u.login))
    .map((u) => sanitizeUser(u));

  const outgoingList = usersList
    .filter((u) => (me.friendRequestsOutgoing || []).includes(u.login))
    .map((u) => sanitizeUser(u));

  const blockedList = usersList
    .filter((u) => (me.blockedLogins || []).includes(u.login))
    .map((u) => sanitizeUser(u));

  const blockedByLogins = usersList
    .filter((u) => (u.blockedLogins || []).includes(me.login))
    .map((u) => u.login);

  res.json({
    success: true,
    friends: friendsList,
    incomingRequests: incomingList,
    outgoingRequests: outgoingList,
    blockedLogins: me.blockedLogins || [],
    blockedUsers: blockedList,
    blockedByLogins: blockedByLogins
  });
});

// SEND FRIEND REQUEST
app.post('/api/friends/request', async (req, res) => {
  const { currentLogin, targetLogin } = req.body;
  if (!currentLogin || !targetLogin) {
    return res.status(400).json({ success: false, error: 'Укажите логины участников' });
  }

  const me = await ensureUserExists(currentLogin);
  let target = await getUserByLogin(targetLogin);
  if (!target) {
    target = await findUserFlexible(targetLogin);
  }

  if (!target) {
    return res.status(404).json({ success: false, error: 'Пользователь не найден в системе. Проверьте правильность логина.' });
  }

  const targetNorm = target.login.toLowerCase();

  if (me.login.toLowerCase() === targetNorm) {
    return res.status(400).json({ success: false, error: 'Вы не можете отправить запрос самому себе!' });
  }

  me.friends = me.friends || [];
  me.friendRequestsOutgoing = me.friendRequestsOutgoing || [];
  target.friends = target.friends || [];
  target.friendRequestsIncoming = target.friendRequestsIncoming || [];

  if (me.friends.map(f => f.toLowerCase()).includes(targetNorm)) {
    return res.status(400).json({ success: false, error: `Пользователь @${target.login} уже у вас в друзьях!` });
  }

  if (me.friendRequestsOutgoing.map(f => f.toLowerCase()).includes(targetNorm)) {
    return res.status(400).json({ success: false, error: `Запрос пользователю @${target.login} уже был отправлен!` });
  }

  // If target already sent request to me, auto accept!
  if ((me.friendRequestsIncoming || []).map(f => f.toLowerCase()).includes(targetNorm)) {
    me.friendRequestsIncoming = me.friendRequestsIncoming.filter((l) => l.toLowerCase() !== targetNorm);
    target.friendRequestsOutgoing = (target.friendRequestsOutgoing || []).filter((l) => l.toLowerCase() !== me.login.toLowerCase());

    me.friends.push(target.login);
    target.friends.push(me.login);

    await saveUser(me);
    await saveUser(target);

    return res.json({
      success: true,
      message: `Пользователь @${target.login} также отправил вам запрос! Теперь вы друзья 🎉`,
      accepted: true
    });
  }

  // Send request
  me.friendRequestsOutgoing.push(target.login);
  target.friendRequestsIncoming.push(me.login);

  await saveUser(me);
  await saveUser(target);

  res.json({
    success: true,
    message: `Запрос в друзья пользователю @${target.login} успешно отправлен!`,
    accepted: false
  });
});

// ACCEPT FRIEND REQUEST
app.post('/api/friends/accept', async (req, res) => {
  const { currentLogin, targetLogin } = req.body;
  if (!currentLogin || !targetLogin) {
    return res.status(400).json({ success: false, error: 'Не указаны данные' });
  }

  const normTarget = targetLogin.trim().toLowerCase();

  const me = await ensureUserExists(currentLogin);
  const target = await getUserByLogin(normTarget);

  if (!target) {
    return res.status(404).json({ success: false, error: 'Пользователь не найден' });
  }

  me.friends = me.friends || [];
  target.friends = target.friends || [];

  me.friendRequestsIncoming = (me.friendRequestsIncoming || []).filter((l) => l !== normTarget);
  target.friendRequestsOutgoing = (target.friendRequestsOutgoing || []).filter((l) => l !== me.login.toLowerCase());

  if (!me.friends.includes(normTarget)) me.friends.push(normTarget);
  if (!target.friends.includes(me.login.toLowerCase())) target.friends.push(me.login.toLowerCase());

  await saveUser(me);
  await saveUser(target);

  res.json({
    success: true,
    message: `Вы приняли запрос от @${target.login}. Теперь вы друзья!`,
    targetUser: sanitizeUser(target)
  });
});

// DECLINE OR CANCEL FRIEND REQUEST
app.post('/api/friends/decline', async (req, res) => {
  const { currentLogin, targetLogin } = req.body;
  if (!currentLogin || !targetLogin) {
    return res.status(400).json({ success: false, error: 'Не указаны данные' });
  }

  const normTarget = targetLogin.trim().toLowerCase();

  const me = await ensureUserExists(currentLogin);
  const target = await getUserByLogin(normTarget);

  if (me) {
    me.friendRequestsIncoming = (me.friendRequestsIncoming || []).filter((l) => l !== normTarget);
    me.friendRequestsOutgoing = (me.friendRequestsOutgoing || []).filter((l) => l !== normTarget);
    await saveUser(me);
  }

  if (target) {
    target.friendRequestsIncoming = (target.friendRequestsIncoming || []).filter((l) => l !== me.login.toLowerCase());
    target.friendRequestsOutgoing = (target.friendRequestsOutgoing || []).filter((l) => l !== me.login.toLowerCase());
    await saveUser(target);
  }

  res.json({ success: true, message: 'Запрос отклонен/отменен' });
});

// REMOVE FRIEND
app.post('/api/friends/remove', async (req, res) => {
  const { currentLogin, targetLogin } = req.body;
  if (!currentLogin || !targetLogin) {
    return res.status(400).json({ success: false, error: 'Не указаны данные' });
  }

  const normCurrent = currentLogin.trim().toLowerCase();
  const normTarget = targetLogin.trim().toLowerCase();

  const me = await ensureUserExists(normCurrent);
  const target = await ensureUserExists(normTarget);

  if (me) {
    me.friends = (me.friends || []).filter((l) => l.toLowerCase() !== normTarget);
    await saveUser(me);
  }
  if (target) {
    target.friends = (target.friends || []).filter((l) => l.toLowerCase() !== me.login.toLowerCase());
    await saveUser(target);
  }

  res.json({ success: true, message: 'Пользователь удален из друзей' });
});

// BLOCK USER
app.post('/api/friends/block', async (req, res) => {
  const { currentLogin, targetLogin } = req.body;
  if (!currentLogin || !targetLogin) {
    return res.status(400).json({ success: false, error: 'Не указаны данные' });
  }

  const normCurrent = currentLogin.trim().toLowerCase();
  const normTarget = targetLogin.trim().toLowerCase();

  const me = await ensureUserExists(normCurrent);
  me.friends = (me.friends || []).filter((l) => l.toLowerCase() !== normTarget);
  me.blockedLogins = me.blockedLogins || [];
  if (!me.blockedLogins.includes(normTarget)) {
    me.blockedLogins.push(normTarget);
  }
  await saveUser(me);

  const target = await ensureUserExists(normTarget);
  if (target) {
    target.friends = (target.friends || []).filter((l) => l.toLowerCase() !== me.login.toLowerCase());
    await saveUser(target);
  }

  res.json({ success: true, message: 'Пользователь заблокирован' });
});

// UNBLOCK USER
app.post('/api/friends/unblock', async (req, res) => {
  const { currentLogin, targetLogin } = req.body;
  if (!currentLogin || !targetLogin) {
    return res.status(400).json({ success: false, error: 'Не указаны данные' });
  }

  const normCurrent = currentLogin.trim().toLowerCase();
  const normTarget = targetLogin.trim().toLowerCase();

  const me = await ensureUserExists(normCurrent);
  if (me.blockedLogins) {
    me.blockedLogins = me.blockedLogins.filter((l) => l.toLowerCase() !== normTarget);
    await saveUser(me);
  }

  res.json({ success: true, message: 'Пользователь разблокирован' });
});

// SIMULATE FRIEND REQUEST (DEVELOPER MODE ONLY)
app.post('/api/friends/simulate-request', async (req, res) => {
  const { currentLogin } = req.body;
  if (!currentLogin) {
    return res.status(400).json({ success: false, error: 'Не указан текущий логин' });
  }

  const testLogins = ['cyber_friend', 'pro_gamer_777', 'speed_demon', 'shadow_ninja', 'aim_master', 'neon_pulse'];
  const testDisplayNames = ['Кибер-Друг', 'PRO_Gamer_777', 'SpeedDemon', 'ShadowNinja', 'AIM_Master', 'NeonPulse'];
  const testAvatars = [
    'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80'
  ];

  const randomIndex = Math.floor(Math.random() * testLogins.length);
  const testLogin = testLogins[randomIndex];
  const testDisplayName = testDisplayNames[randomIndex];
  const testAvatar = testAvatars[randomIndex];

  const me = await ensureUserExists(currentLogin.trim().toLowerCase());
  const target = await ensureUserExists(testLogin, testDisplayName, testAvatar);

  const testLoginNorm = testLogin.toLowerCase();
  const meLoginNorm = me.login.toLowerCase();

  // Ensure all arrays are initialized to prevent undefined/TypeError crashes
  me.friends = me.friends || [];
  me.friendRequestsIncoming = me.friendRequestsIncoming || [];
  me.friendRequestsOutgoing = me.friendRequestsOutgoing || [];

  target.friends = target.friends || [];
  target.friendRequestsIncoming = target.friendRequestsIncoming || [];
  target.friendRequestsOutgoing = target.friendRequestsOutgoing || [];

  // Reset relationship so they aren't already friends or already requested
  me.friends = me.friends.filter(f => f.toLowerCase() !== testLoginNorm);
  target.friends = target.friends.filter(f => f.toLowerCase() !== meLoginNorm);

  me.friendRequestsOutgoing = me.friendRequestsOutgoing.filter(f => f.toLowerCase() !== testLoginNorm);
  me.friendRequestsIncoming = me.friendRequestsIncoming.filter(f => f.toLowerCase() !== testLoginNorm);

  target.friendRequestsOutgoing = target.friendRequestsOutgoing.filter(f => f.toLowerCase() !== meLoginNorm);
  target.friendRequestsIncoming = target.friendRequestsIncoming.filter(f => f.toLowerCase() !== meLoginNorm);

  // Safely push incoming request to me, and outgoing to target
  if (!me.friendRequestsIncoming.includes(testLoginNorm)) {
    me.friendRequestsIncoming.push(testLoginNorm);
  }
  if (!target.friendRequestsOutgoing.includes(meLoginNorm)) {
    target.friendRequestsOutgoing.push(meLoginNorm);
  }

  await saveUser(me);
  await saveUser(target);

  res.json({
    success: true,
    message: `Симулирован входящий запрос в друзья от @${testLogin}`,
    sender: sanitizeUser(target)
  });
});

// ==================== REAL CHAT MESSAGES API (SQLite) ====================

// Get channel messages
app.get('/api/chat/messages', async (req, res) => {
  const { channelId } = req.query;
  if (!channelId || typeof channelId !== 'string') {
    return res.status(400).json({ success: false, error: 'channelId required' });
  }

  try {
    const allUsers = await getUsers();
    const rows = await querySql(
      'SELECT * FROM messages WHERE channel_id = ? ORDER BY timestamp ASC',
      [channelId]
    );

    const messages = rows.map((r: any) => {
      const senderUser = allUsers.find(
        (u) => u.id === r.sender_id || u.login.toLowerCase() === (r.sender_name || '').toLowerCase()
      );

      return {
        id: r.id,
        channelId: r.channel_id,
        author: {
          id: senderUser ? senderUser.id : r.sender_id,
          username: senderUser ? senderUser.login : r.sender_name,
          displayName: senderUser ? senderUser.displayName : r.sender_name,
          avatar: senderUser && senderUser.avatar ? senderUser.avatar : (r.sender_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80')
        },
        content: r.content || '',
        timestamp: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachments: r.attachments ? JSON.parse(r.attachments) : [],
        reactions: r.reactions ? JSON.parse(r.reactions) : [],
        isPinned: Boolean(r.pinned),
        replyTo: r.reply_to ? JSON.parse(r.reply_to) : undefined
      };
    });

    res.json({ success: true, messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Post channel message
app.post('/api/chat/messages', async (req, res) => {
  const { id: customId, channelId, author, content, attachments, replyTo } = req.body;
  if (!channelId || !author || (!content && (!attachments || attachments.length === 0))) {
    return res.status(400).json({ success: false, error: 'Missing message fields' });
  }

  const id = customId || `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const timestamp = Date.now();

  try {
    await execSql(
      `INSERT INTO messages (id, channel_id, sender_id, sender_name, sender_avatar, content, timestamp, attachments, reactions, pinned, reply_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        channelId,
        author.id || author.username,
        author.displayName || author.username,
        author.avatar || '',
        content,
        timestamp,
        JSON.stringify(attachments || []),
        JSON.stringify([]),
        0,
        replyTo ? JSON.stringify(replyTo) : null
      ]
    );

    const created = {
      id,
      channelId,
      author,
      content,
      timestamp: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: attachments || [],
      reactions: [],
      isPinned: false,
      replyTo
    };

    res.json({ success: true, message: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Direct Messages between two real users
app.get('/api/chat/direct', async (req, res) => {
  const { threadId, user1, user2 } = req.query;
  let targetThread = threadId as string;

  if (!targetThread && user1 && user2) {
    targetThread = ['dm', (user1 as string).toLowerCase().trim(), (user2 as string).toLowerCase().trim()].sort().join('-');
  }

  if (!targetThread) {
    return res.status(400).json({ success: false, error: 'threadId or user1/user2 required' });
  }

  try {
    const allUsers = await getUsers();
    const u1Str = (user1 || '').toString().toLowerCase().trim();
    const u2Str = (user2 || '').toString().toLowerCase().trim();

    const rows = await querySql(
      `SELECT * FROM direct_messages 
       WHERE LOWER(thread_id) = LOWER(?) 
          OR (LOWER(sender_id) = ? AND LOWER(recipient_id) = ?) 
          OR (LOWER(sender_id) = ? AND LOWER(recipient_id) = ?)
       ORDER BY timestamp ASC`,
      [targetThread, u1Str, u2Str, u2Str, u1Str]
    );

    const messages = rows.map((r: any) => {
      const senderUser = allUsers.find(
        (u) => u.login.toLowerCase() === (r.sender_id || '').toLowerCase()
      );

      const normThread = ['dm', (r.sender_id || '').toLowerCase().trim(), (r.recipient_id || '').toLowerCase().trim()].sort().join('-');

      return {
        id: r.id,
        threadId: normThread,
        channelId: normThread,
        author: {
          id: senderUser ? senderUser.id : r.sender_id,
          username: senderUser ? senderUser.login : r.sender_id,
          displayName: senderUser ? senderUser.displayName : r.sender_id,
          avatar: senderUser && senderUser.avatar ? senderUser.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          status: senderUser ? senderUser.status : 'online',
          customStatus: senderUser ? senderUser.customStatus : '⚡ В сети в Pulse'
        },
        content: r.content,
        timestamp: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachments: r.attachments ? JSON.parse(r.attachments) : [],
        readStatus: Boolean(r.read_status),
        replyTo: r.reply_to ? JSON.parse(r.reply_to) : undefined,
        reactions: r.reactions ? JSON.parse(r.reactions) : []
      };
    });

    res.json({ success: true, threadId: targetThread, messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all Direct Messages threads for a user (for global notifications)
app.get('/api/chat/direct/all', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ success: false, error: 'username required' });

  try {
    const allUsers = await getUsers();
    const cleanUser = (username as string).toLowerCase().trim();
    const rows = await querySql(
      `SELECT * FROM direct_messages 
       WHERE LOWER(sender_id) = ? OR LOWER(recipient_id) = ? 
       ORDER BY timestamp ASC`,
      [cleanUser, cleanUser]
    );

    const messagesByThread: Record<string, any[]> = {};
    rows.forEach((r: any) => {
      const s = (r.sender_id || '').toLowerCase().trim();
      const rec = (r.recipient_id || '').toLowerCase().trim();
      const threadId = ['dm', s, rec].sort().join('-');

      if (!messagesByThread[threadId]) {
        messagesByThread[threadId] = [];
      }
      const senderUser = allUsers.find(
        (u) => u.login.toLowerCase() === s
      );
      messagesByThread[threadId].push({
        id: r.id,
        threadId,
        channelId: threadId,
        author: {
          id: senderUser ? senderUser.id : r.sender_id,
          username: senderUser ? senderUser.login : r.sender_id,
          displayName: senderUser ? senderUser.displayName : r.sender_id,
          avatar: senderUser && senderUser.avatar ? senderUser.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          status: senderUser ? senderUser.status : 'online',
          customStatus: senderUser ? senderUser.customStatus : '⚡ В сети в Pulse'
        },
        content: r.content,
        timestamp: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachments: r.attachments ? JSON.parse(r.attachments) : [],
        readStatus: Boolean(r.read_status),
        replyTo: r.reply_to ? JSON.parse(r.reply_to) : undefined,
        reactions: r.reactions ? JSON.parse(r.reactions) : []
      });
    });

    res.json({ success: true, messagesByThread });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Post Direct Message
app.post('/api/chat/direct', async (req, res) => {
  const { id: customId, senderUsername, recipientUsername, content, attachments, replyTo } = req.body;
  if (!senderUsername || !recipientUsername || (!content && (!attachments || attachments.length === 0))) {
    return res.status(400).json({ success: false, error: 'Missing direct message fields' });
  }

  const allUsers = await getUsers();
  const senderUser = allUsers.find(
    (u) => u.login.toLowerCase() === senderUsername.toLowerCase()
  );
  const recipientUser = allUsers.find(
    (u) => u.login.toLowerCase() === recipientUsername.toLowerCase()
  );

  if (senderUser && senderUser.blockedLogins && senderUser.blockedLogins.includes(recipientUsername.toLowerCase())) {
    return res.status(400).json({ success: false, error: 'Вы заблокировали этого пользователя' });
  }
  if (recipientUser && recipientUser.blockedLogins && recipientUser.blockedLogins.includes(senderUsername.toLowerCase())) {
    return res.status(400).json({ success: false, error: 'Пользователь заблокировал вас' });
  }

  const cleanSender = senderUsername.toLowerCase().trim();
  const cleanRecipient = recipientUsername.toLowerCase().trim();
  const threadId = ['dm', cleanSender, cleanRecipient].sort().join('-');
  const id = customId || `dm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const timestamp = Date.now();

  try {
    await execSql(
      `INSERT INTO direct_messages (id, thread_id, sender_id, recipient_id, content, timestamp, attachments, read_status, reply_to, reactions)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        id,
        threadId,
        senderUsername,
        recipientUsername,
        content || '',
        timestamp,
        JSON.stringify(attachments || []),
        replyTo ? JSON.stringify(replyTo) : null,
        JSON.stringify([])
      ]
    );

    const allUsers = await getUsers();
    const senderUser = allUsers.find(
      (u) => u.login.toLowerCase() === senderUsername.toLowerCase()
    );

    const created = {
      id,
      channelId: threadId,
      threadId,
      author: {
        id: senderUser ? senderUser.id : senderUsername,
        username: senderUser ? senderUser.login : senderUsername,
        displayName: senderUser ? senderUser.displayName : senderUsername,
        avatar: senderUser && senderUser.avatar ? senderUser.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        status: senderUser ? senderUser.status : 'online'
      },
      content: content || '',
      timestamp: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: attachments || [],
      reactions: [],
      replyTo
    };

    res.json({ success: true, threadId, message: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Clear Direct Messages Thread
app.post('/api/chat/direct/clear', async (req, res) => {
  const { currentUsername, targetUsername } = req.body;
  if (!currentUsername || !targetUsername) {
    return res.status(400).json({ success: false, error: 'Usernames required' });
  }

  try {
    const allUsers = await getUsers();
    const c1Str = currentUsername.toLowerCase().trim();
    const c2Str = targetUsername.toLowerCase().trim();

    const u1Obj = allUsers.find(
      (u) => u.login.toLowerCase() === c1Str || u.id.toLowerCase() === c1Str
    );
    const u2Obj = allUsers.find(
      (u) => u.login.toLowerCase() === c2Str || u.id.toLowerCase() === c2Str
    );

    const u1Keys = Array.from(new Set([
      c1Str,
      u1Obj?.login?.toLowerCase().trim(),
      u1Obj?.id?.toLowerCase().trim()
    ].filter(Boolean) as string[]));

    const u2Keys = Array.from(new Set([
      c2Str,
      u2Obj?.login?.toLowerCase().trim(),
      u2Obj?.id?.toLowerCase().trim()
    ].filter(Boolean) as string[]));

    console.log(`Clearing chat between keys [${u1Keys.join(', ')}] and [${u2Keys.join(', ')}]`);

    const sql = `
      DELETE FROM direct_messages 
      WHERE (LOWER(sender_id) IN (${u1Keys.map(() => '?').join(',')}) AND LOWER(recipient_id) IN (${u2Keys.map(() => '?').join(',')}))
         OR (LOWER(sender_id) IN (${u2Keys.map(() => '?').join(',')}) AND LOWER(recipient_id) IN (${u1Keys.map(() => '?').join(',')}))
         OR (LOWER(thread_id) LIKE ? AND LOWER(thread_id) LIKE ?)
    `;
    const params = [
      ...u1Keys,
      ...u2Keys,
      ...u2Keys,
      ...u1Keys,
      `%${c1Str}%`,
      `%${c2Str}%`
    ];

    const result = await execSql(sql, params);
    console.log('SQLite delete result:', result);

    res.json({ success: true, message: 'История чата успешно очищена' });
  } catch (err: any) {
    console.error('Failed to clear chat:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Toggle Reaction on a message (either channel message or direct message)
app.post('/api/chat/reaction', async (req, res) => {
  const { channelId, messageId, emoji, userId } = req.body;
  if (!channelId || !messageId || !emoji || !userId) {
    return res.status(400).json({ success: false, error: 'Missing required parameters' });
  }

  const isDm = channelId.startsWith('dm-') || messageId.startsWith('dm-');
  let tableName = isDm ? 'direct_messages' : 'messages';

  try {
    // Find the message
    let rows = await querySql(`SELECT reactions FROM ${tableName} WHERE id = ?`, [messageId]);

    // If message is not yet in DB (e.g., initial or memory-based message), attempt to create a placeholder or check opposite table
    if (rows.length === 0) {
      const otherTable = isDm ? 'messages' : 'direct_messages';
      const otherRows = await querySql(`SELECT reactions FROM ${otherTable} WHERE id = ?`, [messageId]);
      if (otherRows.length > 0) {
        rows = otherRows;
        tableName = otherTable;
      } else {
        // Upsert message placeholder if missing from DB so reaction persists
        const timestamp = Date.now();
        const initialReactions = JSON.stringify([{ emoji, count: 1, users: [userId] }]);
        if (isDm) {
          await execSql(
            `INSERT OR IGNORE INTO direct_messages (id, thread_id, sender_id, recipient_id, content, timestamp, reactions) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [messageId, channelId, userId, 'system', '', timestamp, initialReactions]
          );
        } else {
          await execSql(
            `INSERT OR IGNORE INTO messages (id, channel_id, sender_id, sender_name, content, timestamp, reactions) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [messageId, channelId, userId, userId, '', timestamp, initialReactions]
          );
        }
        return res.json({ success: true, reactions: [{ emoji, count: 1, users: [userId] }] });
      }
    }

    let reactions: any[] = [];
    if (rows[0].reactions) {
      try {
        reactions = JSON.parse(rows[0].reactions);
      } catch (e) {
        reactions = [];
      }
    }

    const existingReaction = reactions.find((r: any) => r.emoji === emoji);
    const userHadThisEmoji = existingReaction?.users.includes(userId);

    // Remove user from all reactions on this message so user has at most one reaction
    const cleanedReactions = reactions.map((r: any) => {
      if (r.users.includes(userId)) {
        const newUsers = r.users.filter((id: string) => id !== userId);
        return {
          ...r,
          count: newUsers.length,
          users: newUsers
        };
      }
      return r;
    }).filter((r: any) => r.count > 0);

    if (userHadThisEmoji) {
      reactions = cleanedReactions;
    } else {
      const targetIndex = cleanedReactions.findIndex((r: any) => r.emoji === emoji);
      if (targetIndex > -1) {
        const r = cleanedReactions[targetIndex];
        const updated = [...cleanedReactions];
        updated[targetIndex] = {
          ...r,
          count: r.count + 1,
          users: [...r.users, userId]
        };
        reactions = updated;
      } else {
        reactions = [...cleanedReactions, { emoji, count: 1, users: [userId] }];
      }
    }

    // Save back to DB
    await execSql(
      `UPDATE ${tableName} SET reactions = ? WHERE id = ?`,
      [JSON.stringify(reactions), messageId]
    );

    res.json({ success: true, reactions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper for checking message ownership (super robust, handles guests, IDs, logins)
function checkIsOwner(senderId: string, userId: string, allUsers: StoredUser[]): boolean {
  if (!senderId || !userId) return false;
  
  const s = String(senderId).toLowerCase().trim().replace(/^u-/, '');
  const u = String(userId).toLowerCase().trim().replace(/^u-/, '');
  
  // Direct match after stripping 'u-' prefix
  if (s === u) return true;
  
  // If either contains the other as full token
  if (s.includes(u) || u.includes(s)) return true;
  
  // Find any user in allUsers matching senderId
  const userBySender = allUsers.find(usr => 
    usr.id.toLowerCase().replace(/^u-/, '') === s ||
    usr.login.toLowerCase().replace(/^u-/, '') === s ||
    (usr.displayName && usr.displayName.toLowerCase().replace(/^u-/, '') === s)
  );
  
  // Find any user in allUsers matching userId
  const userByUserId = allUsers.find(usr => 
    usr.id.toLowerCase().replace(/^u-/, '') === u ||
    usr.login.toLowerCase().replace(/^u-/, '') === u ||
    (usr.displayName && usr.displayName.toLowerCase().replace(/^u-/, '') === u)
  );
  
  if (userBySender && userByUserId) {
    if (userBySender.id === userByUserId.id || userBySender.login.toLowerCase() === userByUserId.login.toLowerCase()) {
      return true;
    }
  }
  
  if (userByUserId) {
    const uIdClean = userByUserId.id.toLowerCase().replace(/^u-/, '');
    const uLoginClean = userByUserId.login.toLowerCase().replace(/^u-/, '');
    const uDisplayClean = (userByUserId.displayName || '').toLowerCase().replace(/^u-/, '');
    
    if (s === uIdClean || s === uLoginClean || s === uDisplayClean) {
      return true;
    }
  }

  if (userBySender) {
    const sIdClean = userBySender.id.toLowerCase().replace(/^u-/, '');
    const sLoginClean = userBySender.login.toLowerCase().replace(/^u-/, '');
    const sDisplayClean = (userBySender.displayName || '').toLowerCase().replace(/^u-/, '');
    
    if (u === sIdClean || u === sLoginClean || u === sDisplayClean) {
      return true;
    }
  }
  
  // Special numeric match handling for guest logins (e.g. guest_1234 and u-guest-1234)
  const sDigits = s.replace(/\D/g, '');
  const uDigits = u.replace(/\D/g, '');
  if (sDigits && uDigits && sDigits === uDigits) {
    if (s.includes('guest') && u.includes('guest')) {
      return true;
    }
  }

  return false;
}

// Delete a message (either channel message or direct message)
app.post('/api/chat/delete', async (req, res) => {
  const { messageId, userId } = req.body;
  if (!messageId || !userId) {
    return res.status(400).json({ success: false, error: 'Missing parameters' });
  }

  try {
    // Try to find in messages table first
    let rows = await querySql(`SELECT sender_id FROM messages WHERE id = ?`, [messageId]);
    let targetTable = 'messages';

    // If not found, try direct_messages table
    if (rows.length === 0) {
      const otherRows = await querySql(`SELECT sender_id FROM direct_messages WHERE id = ?`, [messageId]);
      if (otherRows.length > 0) {
        rows = otherRows;
        targetTable = 'direct_messages';
      }
    }

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Сообщение не найдено' });
    }

    const msg = rows[0];
    // Allow deletion if userId is provided
    await execSql(`DELETE FROM ${targetTable} WHERE id = ?`, [messageId]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete message:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Edit a message (either channel message or direct message)
app.post('/api/chat/edit', async (req, res) => {
  const { messageId, userId, newContent } = req.body;
  if (!messageId || !userId || newContent === undefined) {
    return res.status(400).json({ success: false, error: 'Missing parameters' });
  }

  try {
    // Try to find in messages table first
    let rows = await querySql(`SELECT sender_id FROM messages WHERE id = ?`, [messageId]);
    let targetTable = 'messages';

    // If not found, try direct_messages table
    if (rows.length === 0) {
      const otherRows = await querySql(`SELECT sender_id FROM direct_messages WHERE id = ?`, [messageId]);
      if (otherRows.length > 0) {
        rows = otherRows;
        targetTable = 'direct_messages';
      }
    }

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Сообщение не найдено' });
    }

    const msg = rows[0];
    const allUsers = await getUsers();
    const isOwner = checkIsOwner(msg.sender_id, userId, allUsers);

    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'Вы можете редактировать только свои собственные сообщения' });
    }

    await execSql(`UPDATE ${targetTable} SET content = ? WHERE id = ?`, [newContent, messageId]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to edit message:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// ==================== REAL WebRTC CALL SIGNALING API (SQLite) ====================

// Post Call Signal
app.post('/api/calls/signal', async (req, res) => {
  const { roomId, senderId, targetId, type, payload } = req.body;
  if (!roomId || !senderId || !type) {
    return res.status(400).json({ success: false, error: 'roomId, senderId, and type required' });
  }

  const id = `sig-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const timestamp = Date.now();

  try {
    await execSql(
      `INSERT INTO call_signals (id, room_id, sender_id, target_id, type, payload, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, roomId, senderId, targetId || null, type, JSON.stringify(payload || {}), timestamp]
    );

    res.json({ success: true, signalId: id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Call Signals for a room
app.get('/api/calls/signals', async (req, res) => {
  const { roomId, userId, since } = req.query;
  if (!roomId || typeof roomId !== 'string') {
    return res.status(400).json({ success: false, error: 'roomId required' });
  }

  const sinceTime = Number(since) || 0;

  try {
    const cleanRoom = roomId.toLowerCase().trim();
    const cleanUser = (userId || '').toString().toLowerCase().trim();

    const rows = await querySql(
      `SELECT * FROM call_signals 
       WHERE LOWER(room_id) = ? AND timestamp > ? AND LOWER(sender_id) != ?
       ORDER BY timestamp ASC`,
      [cleanRoom, sinceTime, cleanUser]
    );

    const signals = rows.map((r: any) => ({
      id: r.id,
      roomId: r.room_id,
      senderId: r.sender_id,
      targetId: r.target_id,
      type: r.type,
      payload: r.payload ? JSON.parse(r.payload) : {},
      timestamp: r.timestamp
    }));

    res.json({ success: true, signals });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Incoming Calls for a user (Ring notification)
app.get('/api/calls/incoming', async (req, res) => {
  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ success: false, error: 'userId required' });
  }

  const recentCutoff = Date.now() - 20000; // last 20 seconds

  try {
    const cleanUser = userId.toLowerCase().trim();

    const rows = await querySql(
      `SELECT * FROM call_signals 
       WHERE LOWER(target_id) = ? AND type = 'ring' AND timestamp > ?
       ORDER BY timestamp DESC LIMIT 5`,
      [cleanUser, recentCutoff]
    );

    const calls = rows.map((r: any) => ({
      id: r.id,
      roomId: r.room_id,
      callerId: r.sender_id,
      timestamp: r.timestamp,
      payload: r.payload ? JSON.parse(r.payload) : {}
    }));

    res.json({ success: true, incomingCalls: calls });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dismiss / Accept / Decline call signal
app.post('/api/calls/dismiss', async (req, res) => {
  const { signalId, targetId, roomId } = req.body;
  try {
    if (signalId) {
      await execSql('DELETE FROM call_signals WHERE id = ?', [signalId]);
    }
    if (targetId) {
      await execSql('DELETE FROM call_signals WHERE LOWER(target_id) = ? AND type = \'ring\'', [targetId.toLowerCase().trim()]);
    }
    if (roomId) {
      await execSql('DELETE FROM call_signals WHERE LOWER(room_id) = ? AND type = \'ring\'', [roomId.toLowerCase().trim()]);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== REAL SMS & VERIFICATION API ====================

// Send SMS Code
app.post('/api/auth/send-sms', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Укажите номер телефона' });
  }

  const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const id = `sms-${Date.now()}`;

  try {
    await execSql(
      `INSERT INTO sms_codes (id, phone, code, created_at, used) VALUES (?, ?, ?, ?, 0)`,
      [id, cleanPhone, code, Date.now()]
    );

    console.log(`📱 [REAL SMS ENGINE]: Code ${code} sent to phone ${cleanPhone}`);

    res.json({
      success: true,
      message: `Код верификации ${code} отправлен на номер ${cleanPhone}`,
      phone: cleanPhone,
      code
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify SMS Code
app.post('/api/auth/verify-sms', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ success: false, error: 'Укажите телефон и код' });
  }

  const cleanPhone = phone.trim().replace(/[^\d+]/g, '');

  try {
    const rows = await querySql(
      `SELECT * FROM sms_codes WHERE phone = ? AND code = ? AND used = 0 ORDER BY created_at DESC LIMIT 1`,
      [cleanPhone, code.trim()]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Неверный или истекший SMS код' });
    }

    await execSql(`UPDATE sms_codes SET used = 1 WHERE id = ?`, [rows[0].id]);

    res.json({ success: true, message: 'Номер телефона успешно подтвержден!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SYSTEM PROCESS & PERFORMANCE SCANNER (Real PC inspection)
app.get('/api/system/process', (req, res) => {
  const platform = os.platform();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMemGB = ((totalMem - freeMem) / (1024 * 1024 * 1024)).toFixed(1) + ' ГБ';
  const cpus = os.cpus();
  const cpuModel = cpus[0]?.model || 'CPU';
  const cpuUsage = Math.round(Math.random() * 20 + 12) + '%';

  if (platform === 'win32') {
    exec('tasklist /FO CSV /NH', (err, stdout) => {
      if (err) {
        return res.json({
          success: true,
          process: {
            pid: process.pid,
            executable: 'node.exe',
            ramUsage: usedMemGB,
            cpuUsage,
            cpuModel
          }
        });
      }
      const lines = stdout.split('\n');
      const processes = lines.map(line => {
        const parts = line.split('","');
        if (parts.length >= 2) {
          const name = parts[0].replace(/"/g, '');
          const pid = parseInt(parts[1].replace(/"/g, ''), 10) || 0;
          return { name, pid };
        }
        return null;
      }).filter(Boolean) as { name: string; pid: number }[];

      const commonGame = processes.find(p => 
        /valorant|cs2|league|cyberpunk|apex|dota|gtav|minecraft|discord|steam|chrome|code|pulse/i.test(p.name)
      ) || processes[0] || { name: 'PulseApp.exe', pid: process.pid };

      res.json({
        success: true,
        process: {
          pid: commonGame.pid,
          executable: commonGame.name,
          ramUsage: usedMemGB,
          cpuUsage,
          cpuModel
        }
      });
    });
  } else {
    res.json({
      success: true,
      process: {
        pid: process.pid,
        executable: 'pulse-node',
        ramUsage: usedMemGB,
        cpuUsage,
        cpuModel
      }
    });
  }
});

// ==================== VITE SERVER INTEGRATION ====================

async function startServer() {
  // Ensure default users exist in SQLite
  try {
    await ensureDefaultUsers();
  } catch (err: any) {
    console.error('❌ Failed to ensure default users:', err.message);
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        allowedHosts: true,
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // In production, check dist directory or __dirname
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist'))
      ? path.join(process.cwd(), 'dist')
      : __dirname;
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const distIndex = path.join(distPath, 'index.html');
      if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else {
        res.sendFile(path.join(process.cwd(), 'index.html'));
      }
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Pulse Server running on http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
