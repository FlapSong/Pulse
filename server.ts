import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import os from 'os';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Explicitly load .env from current working directory
dotenv.config({ path: path.join(process.cwd(), '.env') });


// Initialize Firebase Admin lazily
let db: any;

async function initFirebase() {
  if (db !== undefined) return;
  
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let config: any = {};
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } catch (e) {
        console.warn('⚠️ Could not parse firebase-applet-config.json');
      }
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || config.projectId;
    const databaseId = process.env.FIRESTORE_DATABASE_ID || config.firestoreDatabaseId;

    if (!projectId) {
      console.log('ℹ️ No Firebase Project ID found. Using local storage mode.');
      db = null;
      return;
    }

    try {
      console.log(`📡 Attempting to initialize Firebase for project: ${projectId}`);
      
      initializeApp({
        projectId: projectId
      });
      
      const firestore = databaseId ? getFirestore(databaseId) : getFirestore();
      
      // CRITICAL: Trigger a dummy call to force credential validation
      // We wrap this in a sub-try-catch to ensure NO_ADC_FOUND doesn't crash the server
      try {
        await firestore.collection('_internal').doc('health').get();
        db = firestore;
        console.log(`✅ Firebase Admin initialized (Project: ${projectId}, DB: ${databaseId || '(default)'})`);
      } catch (authErr: any) {
        const msg = authErr.message || '';
        if (msg.includes('Could not load the default credentials') || msg.includes('NO_ADC_FOUND')) {
          console.warn('⚠️ Google Cloud credentials (ADC) not found. Firestore will be disabled.');
          console.warn('💡 To fix: Run "gcloud auth application-default login" or set GOOGLE_APPLICATION_CREDENTIALS.');
        } else {
          console.warn('⚠️ Firestore access check failed:', msg);
        }
        db = null;
      }
    } catch (credErr: any) {
      if (credErr.code === 'app/duplicate-app') {
        db = databaseId ? getFirestore(databaseId) : getFirestore();
      } else {
        const msg = credErr.message || '';
        if (msg.includes('Could not load the default credentials') || msg.includes('NO_ADC_FOUND')) {
          console.warn('⚠️ Google Cloud credentials (ADC) not found. Falling back to local storage.');
          console.warn('💡 To use Firestore locally, set GOOGLE_APPLICATION_CREDENTIALS environment variable.');
        } else {
          console.warn('⚠️ Firebase Admin initialization failed. Falling back to local storage.', msg);
        }
        db = null;
      }
    }
  } catch (err: any) {
    console.error('❌ Unexpected error during Firebase setup:', err.message);
    db = null;
  }
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', async (req, res) => {
  await initFirebase();
  
  let userCount = 0;
  let firestoreStatus = 'inactive';
  
  if (db) {
    try {
      const snapshot = await db.collection('users').count().get();
      userCount = snapshot.data().count;
      firestoreStatus = 'active';
    } catch (e: any) {
      firestoreStatus = `error: ${e.message}`;
    }
  }

  res.json({
    status: 'ok',
    timestamp: Date.now(),
    database: db ? 'firestore' : 'json',
    firestore: {
      status: firestoreStatus,
      userCount
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Persistent JSON file paths (Legacy - keeping for Electron local fallback if needed, but primary is Firestore)
const isElectron = !!process.versions.electron;
const DATA_DIR = isElectron 
  ? path.join(process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library/Application Support') : '/tmp'), 'PulseData')
  : path.join(process.cwd(), 'data');

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

// Initial demo users (empty as requested)
const DEFAULT_USERS: StoredUser[] = [];


// Firebase Helpers with Fallback to Local JSON
async function getUsers(): Promise<StoredUser[]> {
  if (db) {
    try {
      const snapshot = await db.collection('users').get();
      return snapshot.docs.map((doc: any) => doc.data() as StoredUser);
    } catch (err) {
      console.warn('Firestore getUsers failed, falling back to JSON:', err);
    }
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
  if (db) {
    try {
      const doc = await db.collection('users').doc(normLogin).get();
      if (doc.exists) return doc.data() as StoredUser;
      
      // If not found in Firestore, check if we have it locally (maybe not migrated yet)
      const localUsers = getLocalUsers();
      const localMatch = localUsers.find(u => u.login.toLowerCase().replace(/^@+/, '') === normLogin);
      if (localMatch) {
        console.log(`ℹ️ User ${normLogin} found in local JSON but not Firestore. Triggering background migration.`);
        saveUser(localMatch).catch(err => console.error('Background migration failed:', err));
        return localMatch;
      }
    } catch (err: any) {
      console.warn('Firestore getUserByLogin failed, falling back to JSON:', err.message);
    }
  }
  const users = getLocalUsers();
  return users.find(u => u.login.toLowerCase().replace(/^@+/, '') === normLogin) || null;
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
  if (db) {
    try {
      const snapshot = await db.collection('users').where('id', '==', id).limit(1).get();
      if (!snapshot.empty) return snapshot.docs[0].data() as StoredUser;
    } catch (err) {
      console.warn('Firestore getUserById failed, falling back to JSON:', err);
    }
  }
  const users = getLocalUsers();
  return users.find(u => u.id === id) || null;
}

async function saveUser(user: StoredUser) {
  const normLogin = user.login.toLowerCase().trim();
  // Always save to JSON as a backup
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

  // Try to save to Firestore if available
  if (db) {
    try {
      await db.collection('users').doc(normLogin).set(user, { merge: true });
    } catch (err) {
      console.warn('Firestore saveUser failed:', err);
    }
  }
}

async function getEmails(): Promise<StoredEmail[]> {
  if (db) {
    try {
      const snapshot = await db.collection('emails').get();
      return snapshot.docs.map((doc: any) => doc.data() as StoredEmail);
    } catch (err) {
      console.warn('Firestore getEmails failed, falling back to JSON:', err);
    }
  }
  return getLocalEmails();
}

async function getEmailsByTo(to: string): Promise<StoredEmail[]> {
  const normTo = to.toLowerCase().trim();
  if (db) {
    try {
      const snapshot = await db.collection('emails')
        .where('to', '==', normTo)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((doc: any) => doc.data() as StoredEmail);
    } catch (err) {
      console.warn('Firestore getEmailsByTo failed, falling back to JSON:', err);
    }
  }
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
  // Backup to JSON
  const emails = getLocalEmails();
  emails.unshift(email);
  try {
    fs.writeFileSync(EMAILS_FILE, JSON.stringify(emails, null, 2));
  } catch (e) {
    console.error('Failed to save local emails backup:', e);
  }

  // Save to Firestore
  if (db) {
    try {
      await db.collection('emails').doc(email.id).set(email);
    } catch (err) {
      console.warn('Firestore saveEmail failed:', err);
    }
  }
}

async function ensureDefaultUsers() {
  await initFirebase();
  console.log('🔄 Starting user initialization/migration...');
  try {
    // Check if we have local data to migrate
    if (fs.existsSync(USERS_FILE)) {
      try {
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        const localUsers: StoredUser[] = JSON.parse(data);
        if (Array.isArray(localUsers)) {
          console.log(`📂 Found ${localUsers.length} local users in ${USERS_FILE}`);
          for (const user of localUsers) {
            const existing = await getUserByLogin(user.login);
            if (!existing) {
              await saveUser(user);
              if (db) console.log(`🚀 Migrated local user to Firestore: ${user.login}`);
            } else {
              console.log(`✅ User ${user.login} already exists in ${db ? 'Firestore' : 'JSON'}`);
            }
          }
        }
      } catch (e: any) {
        console.error('❌ Migration failed:', e.message);
      }
    } else {
      console.log(`ℹ️ No local users file found at ${USERS_FILE}`);
    }

    for (const user of DEFAULT_USERS) {
      const existing = await getUserByLogin(user.login);
      if (!existing) {
        await saveUser(user);
        console.log(`✨ Initialized default user: ${user.login}`);
      }
    }
    console.log('✅ User initialization complete.');
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

  const normLogin = login.trim().toLowerCase();
  const user = await getUserByLogin(normLogin);

  if (!user) {
    return res.status(404).json({ success: false, error: 'Пользователь не найден' });
  }

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

  const usersList = await getUsers();
  const me = usersList.find((u) => u.login.toLowerCase().replace(/^@+/, '') === currentLogin);

  const meFriends = me?.friends || [];
  const meIncoming = me?.friendRequestsIncoming || [];
  const meOutgoing = me?.friendRequestsOutgoing || [];

  const results = usersList
    .filter((u) => {
      if (u.login.toLowerCase() === currentLogin) return false;
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
  const me = await getUserByLogin(normLogin);

  if (!me) {
    return res.status(404).json({ success: false, error: 'Пользователь не найден' });
  }

  // Auto-seed default test friends
  me.friends = me.friends || [];
  // Filter and clean fake test friends if they were previously saved
  const mockLogins = ['phantom', 'neon_rider', 'echo_bot', 'test-user-bot'];
  if (Array.isArray(me.friends) && me.friends.some((f: string) => mockLogins.includes(f))) {
    me.friends = me.friends.filter((f: string) => !mockLogins.includes(f));
    await saveUser(me);
  }

  const usersList = await getUsers();
  const friendsList = usersList
    .filter((u) => (me.friends || []).includes(u.login) && !mockLogins.includes(u.login))
    .map((u) => sanitizeUser(u));

  const incomingList = usersList
    .filter((u) => (me.friendRequestsIncoming || []).includes(u.login))
    .map((u) => sanitizeUser(u));

  const outgoingList = usersList
    .filter((u) => (me.friendRequestsOutgoing || []).includes(u.login))
    .map((u) => sanitizeUser(u));

  res.json({
    success: true,
    friends: friendsList,
    incomingRequests: incomingList,
    outgoingRequests: outgoingList
  });
});

// SEND FRIEND REQUEST
app.post('/api/friends/request', async (req, res) => {
  const { currentLogin, targetLogin } = req.body;
  if (!currentLogin || !targetLogin) {
    return res.status(400).json({ success: false, error: 'Укажите логины участников' });
  }

  const normCurrent = currentLogin.trim().toLowerCase().replace(/^@+/, '');
  const me = await getUserByLogin(normCurrent);
  let target = await getUserByLogin(targetLogin);
  if (!target) {
    target = await findUserFlexible(targetLogin);
  }

  if (!me || !target) {
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

  const normCurrent = currentLogin.trim().toLowerCase();
  const normTarget = targetLogin.trim().toLowerCase();

  const me = await getUserByLogin(normCurrent);
  const target = await getUserByLogin(normTarget);

  if (!me || !target) {
    return res.status(404).json({ success: false, error: 'Пользователь не найден' });
  }

  me.friends = me.friends || [];
  target.friends = target.friends || [];

  me.friendRequestsIncoming = (me.friendRequestsIncoming || []).filter((l) => l !== normTarget);
  target.friendRequestsOutgoing = (target.friendRequestsOutgoing || []).filter((l) => l !== normCurrent);

  if (!me.friends.includes(normTarget)) me.friends.push(normTarget);
  if (!target.friends.includes(normCurrent)) target.friends.push(normCurrent);

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

  const normCurrent = currentLogin.trim().toLowerCase();
  const normTarget = targetLogin.trim().toLowerCase();

  const me = await getUserByLogin(normCurrent);
  const target = await getUserByLogin(normTarget);

  if (me) {
    me.friendRequestsIncoming = (me.friendRequestsIncoming || []).filter((l) => l !== normTarget);
    me.friendRequestsOutgoing = (me.friendRequestsOutgoing || []).filter((l) => l !== normTarget);
    await saveUser(me);
  }

  if (target) {
    target.friendRequestsIncoming = (target.friendRequestsIncoming || []).filter((l) => l !== normCurrent);
    target.friendRequestsOutgoing = (target.friendRequestsOutgoing || []).filter((l) => l !== normCurrent);
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

  const me = await getUserByLogin(normCurrent);
  const target = await getUserByLogin(normTarget);

  if (me) {
    me.friends = (me.friends || []).filter((l) => l !== normTarget);
    await saveUser(me);
  }
  if (target) {
    target.friends = (target.friends || []).filter((l) => l !== normCurrent);
    await saveUser(target);
  }

  res.json({ success: true, message: 'Пользователь удален из друзей' });
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
  // Initialize Firebase
  await initFirebase();

  // Ensure default users exist (handles both Firestore and Local fallback)
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Pulse Server running on http://localhost:${PORT}`);
  });
}

startServer();
