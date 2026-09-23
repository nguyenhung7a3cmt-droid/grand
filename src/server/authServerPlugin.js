import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { getDB, hashPassword, verifyPassword, sanitizeUser } from './database.js';
import { getClientIP, resolveCountry } from './geoHelper.js';

// Ensure environment variables from .env are loaded into process.env if needed
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {
  // ignore
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing');
  }
  return secret;
}

function createToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    isOwner: Boolean(user.is_owner ?? user.isOwner),
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7
  };
  const tokenData = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', getJwtSecret()).update(tokenData).digest('base64url');
  return `${tokenData}.${signature}`;
}

function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [tokenData, signature] = token.split('.');
  if (!tokenData || !signature) return null;
  try {
    const expectedSig = crypto.createHmac('sha256', getJwtSecret()).update(tokenData).digest('base64url');
    if (!timingSafeEqualStr(signature, expectedSig)) return null;
    const payload = JSON.parse(Buffer.from(tokenData, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function getMailer() {
  let gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  let gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  if (!gmailUser || !gmailPass) {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed.startsWith('GMAIL_USER=')) {
            gmailUser = trimmed.split('=')[1].trim().replace(/^["']|["']$/g, '');
          } else if (trimmed.startsWith('GMAIL_APP_PASSWORD=')) {
            gmailPass = trimmed.split('=')[1].trim().replace(/^["']|["']$/g, '');
          }
        }
      }
    } catch (e) {
      console.warn('Could not read .env for mailer:', e.message);
    }
  }

  if (gmailUser && gmailPass) {
    return {
      transporter: nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass
        }
      }),
      fromEmail: gmailUser
    };
  }
  return null;
}

async function sendOTPEmail(targetEmail, otpCode, userName = 'Customer', actionType = 'reset') {
  const mailerObj = getMailer();
  const isRegistration = actionType === 'registration';
  const headingTitle = isRegistration ? 'Account Registration Verification' : 'Password Reset Verification Code';
  const descriptionText = isRegistration
    ? `Welcome <strong>${userName}</strong>! Please enter the following 6-digit verification code to complete your GrandStock account registration.`
    : `Hello <strong>${userName}</strong>, use the following 6-digit verification code to reset your GrandStock account password.`;
  const subjectLine = isRegistration
    ? `[GrandStock] ${otpCode} is your Registration Verification Code`
    : `[GrandStock] ${otpCode} is your Password Reset Verification Code`;

  const htmlContent = `
    <div style="background-color: #08090C; color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #232634;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #EE1D36; font-size: 26px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 2px;">GRANDSTOCK</h1>
        <p style="color: #94A3B8; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Roblox In-Game Shopping Security</p>
      </div>

      <div style="background-color: #111218; padding: 24px; border-radius: 12px; border: 1px solid #232634; text-align: center;">
        <h2 style="color: #FFFFFF; font-size: 18px; margin: 0 0 8px 0;">${headingTitle}</h2>
        <p style="color: #94A3B8; font-size: 13px; margin: 0 0 20px 0; line-height: 1.5;">
          ${descriptionText} This code will expire in <strong>10 minutes</strong>.
        </p>

        <div style="background-color: #181A22; border: 2px dashed #EE1D36; border-radius: 12px; padding: 16px; margin: 16px 0; display: inline-block;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 900; color: #EE1D36; letter-spacing: 8px;">${otpCode}</span>
        </div>

        <p style="color: #94A3B8; font-size: 11px; margin: 16px 0 0 0;">
          If you did not request this verification, please ignore this email. Your security remains fully protected.
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #64748B; font-size: 11px;">
        &copy; 2026 GrandStock.net &bull; SQLite Verified &bull; Escrow Protection
      </div>
    </div>
  `;

  if (mailerObj) {
    try {
      await mailerObj.transporter.sendMail({
        from: `"GrandStock Security" <${mailerObj.fromEmail}>`,
        to: targetEmail,
        subject: subjectLine,
        html: htmlContent
      });
      return { sent: true };
    } catch (e) {
      console.error('Nodemailer SMTP Error:', e.message);
    }
  }

  console.log(`
======================================================
📧 [SQL-BACKED OTP DISPATCH - ${actionType.toUpperCase()}] Sent to: ${targetEmail}
🔑 VERIFICATION CODE: ${otpCode}
⏳ EXPIRES: in 10 minutes
======================================================
`);
  return { sent: false };
}

export function authPlugin() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  const setupMiddleware = (server) => {
    server.middlewares.use(async (req, res, next) => {
      const sendJSON = (statusCode, data) => {
        res.statusCode = statusCode;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      };

      const parseBody = () => new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
          body += chunk;
          if (body.length > 1048576) {
            req.destroy();
            return reject(new Error('Payload too large'));
          }
        });
        req.on('end', () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch (err) {
            reject(err);
          }
        });
        req.on('error', reject);
      });

      // 1A. POST /api/auth/register-request-otp (Step 1: Check uniqueness, Hash password, Dispatch OTP)
      if (req.url === '/api/auth/register-request-otp' && req.method === 'POST') {
        try {
          const body = await parseBody();
          const { name, email, password, robloxUsername } = body;

          if (!name || !email || !password || password.length < 5 || password.length > 16) {
            return sendJSON(400, { error: 'Name, valid email, and password (5 to 16 characters) are required.' });
          }

          const normalizedEmail = email.trim().toLowerCase();
          if (!normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
            return sendJSON(400, { error: 'Please provide a valid email address.' });
          }

          const db = getDB();
          const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
          if (existing) {
            return sendJSON(409, { error: 'An account with this email already exists. Please log in.' });
          }

          const { salt, hash } = hashPassword(password);
          const cleanName = name.trim();
          const cleanRoblox = (robloxUsername || name).trim();
          const otpCode = String(crypto.randomInt(100000, 999999));
          const expiresAt = Date.now() + 1000 * 60 * 10; // 10 minutes
          const now = new Date().toISOString();

          db.prepare(`
            INSERT INTO registration_otps (email, name, password_hash, salt, roblox_username, otp_code, expires_at, attempts, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
            ON CONFLICT(email) DO UPDATE SET
              name = excluded.name,
              password_hash = excluded.password_hash,
              salt = excluded.salt,
              roblox_username = excluded.roblox_username,
              otp_code = excluded.otp_code,
              expires_at = excluded.expires_at,
              attempts = 0,
              created_at = excluded.created_at
          `).run(normalizedEmail, cleanName, hash, salt, cleanRoblox, otpCode, expiresAt, now);

          const emailResult = await sendOTPEmail(normalizedEmail, otpCode, cleanName, 'registration');

          return sendJSON(200, {
            success: true,
            message: `A 6-digit verification code has been dispatched to ${normalizedEmail}`,
            email: normalizedEmail,
            expiresInSeconds: 600
          });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      // 1B. POST /api/auth/register-verify-otp (Step 2: Validate OTP, Create User in DB, Issue JWT)
      if (req.url === '/api/auth/register-verify-otp' && req.method === 'POST') {
        try {
          const body = await parseBody();
          const { email, otpCode } = body;

          if (!email || !otpCode) {
            return sendJSON(400, { error: 'Email and 6-digit verification code are required.' });
          }

          const normalizedEmail = email.trim().toLowerCase();
          const cleanOtp = String(otpCode).trim();
          const db = getDB();

          const pending = db.prepare('SELECT * FROM registration_otps WHERE email = ?').get(normalizedEmail);
          if (!pending) {
            return sendJSON(400, { error: 'No pending registration found for this email. Please register again.' });
          }

          if (Date.now() > pending.expires_at) {
            db.prepare('DELETE FROM registration_otps WHERE email = ?').run(normalizedEmail);
            return sendJSON(400, { error: 'Verification code has expired. Please request a new one.' });
          }

          if (!timingSafeEqualStr(cleanOtp, pending.otp_code)) {
            const attempts = (pending.attempts || 0) + 1;
            if (attempts >= 5) {
              db.prepare('DELETE FROM registration_otps WHERE email = ?').run(normalizedEmail);
              return sendJSON(400, { error: 'Too many incorrect attempts. Please restart registration.' });
            }
            db.prepare('UPDATE registration_otps SET attempts = ? WHERE email = ?').run(attempts, normalizedEmail);
            return sendJSON(400, { error: `Invalid verification code. (${5 - attempts} attempts remaining)` });
          }

          // Check again if already registered in the meantime
          const alreadyUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
          if (alreadyUser) {
            db.prepare('DELETE FROM registration_otps WHERE email = ?').run(normalizedEmail);
            return sendJSON(409, { error: 'An account with this email already exists.' });
          }

          const clientIP = getClientIP(req);
          const geo = resolveCountry(req, body);
          const userId = `usr-cust-${Date.now()}`;
          const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(pending.roblox_username)}&backgroundColor=111218`;
          const now = new Date().toISOString();

          db.prepare(`
            INSERT INTO users (id, name, email, password_hash, salt, role, is_owner, roblox_username, avatar, trades_completed, rating, assigned_games, ip_address, country_code, country_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'customer', 0, ?, ?, 0, '5.0★', '["All Games"]', ?, ?, ?, ?, ?)
          `).run(userId, pending.name, normalizedEmail, pending.password_hash, pending.salt, pending.roblox_username, avatar, clientIP, geo.code, geo.name, now, now);

          // Clean up OTP record
          db.prepare('DELETE FROM registration_otps WHERE email = ?').run(normalizedEmail);

          const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
          const token = createToken(newUser);

          return sendJSON(201, {
            success: true,
            user: sanitizeUser(newUser),
            token
          });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      // 1C. POST /api/auth/register (Direct Fallback for programmatic or legacy registrations - Dev Only)
      if (req.url === '/api/auth/register' && req.method === 'POST') {
        if (process.env.NODE_ENV !== 'development') {
          return sendJSON(404, { error: 'Not Found' });
        }
        try {
          const body = await parseBody();
          const { name, email, password, robloxUsername } = body;

          if (!name || !email || !password || password.length < 5 || password.length > 16) {
            return sendJSON(400, { error: 'Name, valid email, and password (5 to 16 characters) are required' });
          }

          const db = getDB();
          const normalizedEmail = email.trim().toLowerCase();

          const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
          if (existing) {
            return sendJSON(409, { error: 'An account with this email already exists' });
          }

          const clientIP = getClientIP(req);
          const geo = resolveCountry(req, body);

          const { salt, hash } = hashPassword(password);
          const userId = `usr-cust-${Date.now()}`;
          const cleanName = name.trim();
          const cleanRoblox = (robloxUsername || name).trim();
          const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanRoblox)}&backgroundColor=111218`;
          const now = new Date().toISOString();

          db.prepare(`
            INSERT INTO users (id, name, email, password_hash, salt, role, is_owner, roblox_username, avatar, trades_completed, rating, assigned_games, ip_address, country_code, country_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'customer', 0, ?, ?, 0, '5.0★', '["All Games"]', ?, ?, ?, ?, ?)
          `).run(userId, cleanName, normalizedEmail, hash, salt, cleanRoblox, avatar, clientIP, geo.code, geo.name, now, now);

          const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
          const token = createToken(newUser);

          return sendJSON(201, {
            success: true,
            user: sanitizeUser(newUser),
            token
          });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      // 2. POST /api/auth/login
      if (req.url === '/api/auth/login' && req.method === 'POST') {
        try {
          const body = await parseBody();
          const { email, password } = body;

          if (!email || !password) {
            return sendJSON(400, { error: 'Email and password are required' });
          }

          const db = getDB();
          const normalizedEmail = email.trim().toLowerCase();
          const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

          if (!user || !verifyPassword(password, user.salt, user.password_hash)) {
            return sendJSON(401, { error: 'Invalid email address or password' });
          }

          // Update last known IP and Country
          const clientIP = getClientIP(req);
          const geo = resolveCountry(req, body);
          db.prepare('UPDATE users SET ip_address = ?, country_code = ?, country_name = ?, updated_at = ? WHERE id = ?')
            .run(clientIP, geo.code, geo.name, new Date().toISOString(), user.id);

          const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
          const token = createToken(updatedUser);

          return sendJSON(200, {
            success: true,
            user: sanitizeUser(updatedUser),
            token
          });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      // 3. POST /api/auth/forgot-password
      if (req.url === '/api/auth/forgot-password' && req.method === 'POST') {
        try {
          const { email } = await parseBody();
          if (!email || !email.includes('@')) {
            return sendJSON(400, { error: 'A valid email address is required' });
          }

          const db = getDB();
          const normalizedEmail = email.trim().toLowerCase();
          const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

          if (!user) {
            return sendJSON(404, { error: 'No account registered with this email address' });
          }

          const otpCode = String(crypto.randomInt(100000, 999999));
          const expiresAt = Date.now() + 1000 * 60 * 10;
          const now = new Date().toISOString();

          db.prepare(`
            INSERT INTO password_resets (email, otp_code, reset_token, expires_at, attempts, verified, created_at)
            VALUES (?, ?, NULL, ?, 0, 0, ?)
            ON CONFLICT(email) DO UPDATE SET
              otp_code = excluded.otp_code,
              reset_token = NULL,
              expires_at = excluded.expires_at,
              attempts = 0,
              verified = 0,
              created_at = excluded.created_at
          `).run(normalizedEmail, otpCode, expiresAt, now);

          const emailResult = await sendOTPEmail(normalizedEmail, otpCode, user.name);

          return sendJSON(200, {
            success: true,
            message: `A 6-digit verification code has been dispatched to ${normalizedEmail}`,
            email: normalizedEmail,
            expiresInSeconds: 600
          });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      // 4. POST /api/auth/verify-otp
      if (req.url === '/api/auth/verify-otp' && req.method === 'POST') {
        try {
          const { email, otpCode } = await parseBody();
          if (!email || !otpCode) {
            return sendJSON(400, { error: 'Email and 6-digit OTP code are required' });
          }

          const db = getDB();
          const normalizedEmail = email.trim().toLowerCase();
          const record = db.prepare('SELECT * FROM password_resets WHERE email = ?').get(normalizedEmail);

          if (!record) {
            return sendJSON(400, { error: 'No active OTP request found. Please request a new code.' });
          }

          if (Date.now() > record.expires_at) {
            db.prepare('DELETE FROM password_resets WHERE email = ?').run(normalizedEmail);
            return sendJSON(400, { error: 'Verification code has expired. Please request a new one.' });
          }

          if (!timingSafeEqualStr(record.otp_code, otpCode.trim())) {
            const nextAttempts = record.attempts + 1;
            if (nextAttempts >= 5) {
              db.prepare('DELETE FROM password_resets WHERE email = ?').run(normalizedEmail);
              return sendJSON(400, { error: 'Too many incorrect attempts. Please request a new code.' });
            }
            db.prepare('UPDATE password_resets SET attempts = ? WHERE email = ?').run(nextAttempts, normalizedEmail);
            return sendJSON(400, { error: `Invalid code. ${5 - nextAttempts} attempts remaining.` });
          }

          const resetToken = crypto.randomBytes(32).toString('hex');
          db.prepare('UPDATE password_resets SET verified = 1, reset_token = ? WHERE email = ?').run(resetToken, normalizedEmail);

          return sendJSON(200, {
            success: true,
            message: 'Verification code confirmed.',
            resetToken
          });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      // 5. POST /api/auth/reset-password
      if (req.url === '/api/auth/reset-password' && req.method === 'POST') {
        try {
          const { email, otpCode, resetToken, newPassword } = await parseBody();
          if (!email || !newPassword || newPassword.length < 5 || newPassword.length > 16) {
            return sendJSON(400, { error: 'Password must be between 5 and 16 characters long' });
          }

          const db = getDB();
          const normalizedEmail = email.trim().toLowerCase();
          const record = db.prepare('SELECT * FROM password_resets WHERE email = ?').get(normalizedEmail);

          const isTokenValid = record && record.verified === 1 && (timingSafeEqualStr(record.reset_token, resetToken) || timingSafeEqualStr(record.otp_code, otpCode?.trim()));

          if (!isTokenValid) {
            return sendJSON(400, { error: 'Invalid or expired reset session. Please restart password recovery.' });
          }

          const { salt, hash } = hashPassword(newPassword);
          const now = new Date().toISOString();

          db.prepare('UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE email = ?').run(hash, salt, now, normalizedEmail);
          db.prepare('DELETE FROM password_resets WHERE email = ?').run(normalizedEmail);

          return sendJSON(200, {
            success: true,
            message: 'Your password has been successfully updated! You can now log in.'
          });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      // 6. GET /api/auth/me
      if (req.url === '/api/auth/me' && req.method === 'GET') {
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.replace('Bearer ', '');
        const payload = verifyToken(token);

        if (!payload) return sendJSON(401, { error: 'Unauthorized session' });

        const db = getDB();
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
        if (!user) return sendJSON(404, { error: 'User account not found' });

        return sendJSON(200, { user: sanitizeUser(user) });
      }

      // 7. GET /api/auth/users
      if (req.url === '/api/auth/users' && req.method === 'GET') {
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.replace('Bearer ', '');
        const payload = verifyToken(token);

        if (!payload || payload.role !== 'admin') {
          return sendJSON(403, { error: 'Access denied. Owner/Admin authorization required.' });
        }

        const db = getDB();
        const allUsers = db.prepare('SELECT * FROM users ORDER BY created_at ASC').all();
        return sendJSON(200, { users: allUsers.map(sanitizeUser) });
      }

      // 8. POST /api/auth/create-staff
      if (req.url === '/api/auth/create-staff' && req.method === 'POST') {
        try {
          const authHeader = req.headers['authorization'] || '';
          const token = authHeader.replace('Bearer ', '');
          const payload = verifyToken(token);

          if (!payload || payload.role !== 'admin') {
            return sendJSON(403, { error: 'Access denied. Only the Site Owner can create staff accounts.' });
          }

          const body = await parseBody();
          const { name, email, password, robloxUsername, assignedGames } = body;

          if (!name || !email || !password || !robloxUsername) {
            return sendJSON(400, { error: 'Staff name, email, password, and Roblox handle are required.' });
          }

          const db = getDB();
          const normalizedEmail = email.trim().toLowerCase();
          const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);

          if (existing) return sendJSON(409, { error: 'An account with this email already exists.' });

          const clientIP = getClientIP(req);
          const geo = resolveCountry(req, body);

          const { salt, hash } = hashPassword(password);
          const staffId = `usr-staff-${Date.now()}`;
          const now = new Date().toISOString();
          const assignedJson = JSON.stringify(Array.isArray(assignedGames) && assignedGames.length > 0 ? assignedGames : ['All Games']);
          const avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

          db.prepare(`
            INSERT INTO users (id, name, email, password_hash, salt, role, is_owner, roblox_username, avatar, trades_completed, rating, assigned_games, ip_address, country_code, country_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'staff', 0, ?, ?, 0, '5.0★', ?, ?, ?, ?, ?, ?)
          `).run(staffId, name.trim(), normalizedEmail, hash, salt, robloxUsername.trim(), avatar, assignedJson, clientIP, geo.code, geo.name, now, now);

          const newStaff = db.prepare('SELECT * FROM users WHERE id = ?').get(staffId);
          const allUsers = db.prepare('SELECT * FROM users ORDER BY created_at ASC').all();

          return sendJSON(201, {
            success: true,
            message: `Staff account @${newStaff.roblox_username} created successfully.`,
            staff: sanitizeUser(newStaff),
            users: allUsers.map(sanitizeUser)
          });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      // 9. POST /api/auth/update-role
      if (req.url === '/api/auth/update-role' && req.method === 'POST') {
        try {
          const authHeader = req.headers['authorization'] || '';
          const token = authHeader.replace('Bearer ', '');
          const payload = verifyToken(token);

          if (!payload || payload.role !== 'admin') {
            return sendJSON(403, { error: 'Access denied. Owner/Admin authorization required.' });
          }

          const body = await parseBody();
          const { userId, role, robloxUsername } = body;

          const db = getDB();
          const target = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
          if (!target) return sendJSON(404, { error: 'User not found' });

          const newRole = role || target.role;
          const newRoblox = robloxUsername ? robloxUsername.trim() : target.roblox_username;
          const now = new Date().toISOString();

          db.prepare('UPDATE users SET role = ?, roblox_username = ?, updated_at = ? WHERE id = ?').run(newRole, newRoblox, now, userId);

          const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
          const allUsers = db.prepare('SELECT * FROM users ORDER BY created_at ASC').all();

          return sendJSON(200, {
            success: true,
            user: sanitizeUser(updatedUser),
            users: allUsers.map(sanitizeUser)
          });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      if (req.url && (req.url.startsWith('/api/auth/') || req.url === '/api/auth')) {
        return sendJSON(404, { error: 'Endpoint not found' });
      }

      next();
    });
  };

  return {
    name: 'auth-backend-middleware',
    configureServer: setupMiddleware,
    configurePreviewServer: setupMiddleware
  };
}
