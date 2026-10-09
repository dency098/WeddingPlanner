require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const EmailVerification = require('./src/models/EmailVerification');

const base = 'http://localhost:5001/api/auth';
const cookies = {};

const parseSetCookie = (setCookieHeader) => {
  if (!setCookieHeader) return;
  const cookiesToSet = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

  for (const entry of cookiesToSet) {
    const [raw] = entry.split(';');
    const [name, value] = raw.split('=');
    if (name && value) cookies[name.trim()] = value.trim();
  }
};

async function request(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };

  if (cookies.token) {
    headers.Cookie = `token=${cookies.token}`;
  }

  const response = await fetch(`${base}${path}`, {
    ...opts,
    headers,
  });

  const setCookie = response.headers.get('set-cookie');
  if (setCookie) parseSetCookie(setCookie);

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: response.status, data };
}

async function findOtp(email) {
  const record = await EmailVerification.findOne({ email }).lean();
  if (!record) throw new Error(`No OTP record for ${email}`);

  for (let i = 0; i <= 999999; i++) {
    const otp = String(i).padStart(6, '0');
    const matches = await bcrypt.compare(otp, record.otpHash);
    if (matches) {
      console.log(`Found OTP for ${email}: ${otp}`);
      return otp;
    }
  }

  throw new Error(`OTP not found for ${email}`);
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/weddingPlanner');

  const userEmail = 'userauth@mail.com';
  const vendorEmail = 'vendorauth@mail.com';

  const userRegister = await request('/user/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User Auth', email: userEmail, password: 'Password123' }),
  });
  console.log('USER register', userRegister.status, userRegister.data);

  const userOtp = await findOtp(userEmail.toLowerCase());
  const verifyUser = await request('/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, otp: userOtp }),
  });
  console.log('USER verify', verifyUser.status, verifyUser.data);

  const userLogin = await request('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, password: 'Password123' }),
  });
  console.log('USER login', userLogin.status, userLogin.data);

  const userMe = await request('/me', { method: 'GET' });
  console.log('USER me', userMe.status, userMe.data);

  const userLogout = await request('/logout', { method: 'POST' });
  console.log('USER logout', userLogout.status, userLogout.data);

  const vendorRegister = await request('/vendor/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Vendor Auth',
      email: vendorEmail,
      password: 'Password123',
      businessName: 'Bright Vows',
      phone: '0771234567',
    }),
  });
  console.log('VENDOR register', vendorRegister.status, vendorRegister.data);

  const vendorOtp = await findOtp(vendorEmail.toLowerCase());
  const verifyVendor = await request('/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: vendorEmail, otp: vendorOtp }),
  });
  console.log('VENDOR verify', verifyVendor.status, verifyVendor.data);

  const vendorLogin = await request('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: vendorEmail, password: 'Password123' }),
  });
  console.log('VENDOR login', vendorLogin.status, vendorLogin.data);

  const vendorMe = await request('/me', { method: 'GET' });
  console.log('VENDOR me', vendorMe.status, vendorMe.data);

  const vendorLogout = await request('/logout', { method: 'POST' });
  console.log('VENDOR logout', vendorLogout.status, vendorLogout.data);

  const adminLogin = await request('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@weddingplanner.com', password: 'Admin@12345' }),
  });
  console.log('ADMIN login', adminLogin.status, adminLogin.data);

  const adminMe = await request('/me', { method: 'GET' });
  console.log('ADMIN me', adminMe.status, adminMe.data);

  const adminLogout = await request('/logout', { method: 'POST' });
  console.log('ADMIN logout', adminLogout.status, adminLogout.data);

  await mongoose.disconnect();
  console.log('Auth end-to-end validation complete.');
  process.exit(0);
})().catch((error) => {
  console.error('Auth validation failed:', error);
  process.exit(1);
});
