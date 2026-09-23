import nodemailer from 'nodemailer';

async function testSmtp() {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER || '';
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '';

  console.log(`Connecting to Gmail SMTP as ${user}...`);
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass
    }
  });

  try {
    console.log('Verifying SMTP connection...');
    const verifyRes = await transporter.verify();
    console.log('SMTP Verification success:', verifyRes);

    const testOtp = '882369';
    const targetEmail = process.env.TEST_EMAIL || user || 'test@example.com';
    console.log(`Dispatching test OTP email to ${targetEmail}...`);
    const info = await transporter.sendMail({
      from: `"GrandStock Security" <${user}>`,
      to: targetEmail,
      subject: `[GrandStock] ${testOtp} is your Registration Verification Code`,
      html: `
        <div style="background-color: #08090C; color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #232634;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #EE1D36; font-size: 26px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 2px;">GRANDSTOCK</h1>
            <p style="color: #94A3B8; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Roblox In-Game Shopping Security</p>
          </div>

          <div style="background-color: #111218; padding: 24px; border-radius: 12px; border: 1px solid #232634; text-align: center;">
            <h2 style="color: #FFFFFF; font-size: 18px; margin: 0 0 8px 0;">Account Registration Verification</h2>
            <p style="color: #94A3B8; font-size: 13px; margin: 0 0 20px 0; line-height: 1.5;">
              Welcome <strong>Khanh</strong>! Please enter the following 6-digit verification code to complete your GrandStock account registration. This code will expire in <strong>10 minutes</strong>.
            </p>

            <div style="background-color: #181A22; border: 2px dashed #EE1D36; border-radius: 12px; padding: 16px; margin: 16px 0; display: inline-block;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 900; color: #EE1D36; letter-spacing: 8px;">${testOtp}</span>
            </div>

            <p style="color: #94A3B8; font-size: 11px; margin: 16px 0 0 0;">
              If you did not request this verification, please ignore this email. Your security remains fully protected.
            </p>
          </div>

          <div style="text-align: center; margin-top: 24px; color: #64748B; font-size: 11px;">
            &copy; 2026 GrandStock.net &bull; SQLite Verified &bull; Escrow Protection
          </div>
        </div>
      `
    });

    console.log('EMAIL SENT SUCCESSFULLY!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (err) {
    console.error('SMTP test failed:', err);
  }
}

testSmtp();
