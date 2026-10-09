const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Admin = require('../models/Admin');
const EmailVerification = require('../models/EmailVerification');
const generateOtp = require('../utils/generateOtp');
const { sendEmail } = require('../utils/sendEmail');

const cookieOptions = {
  httpOnly: true,
  path: '/',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const sanitizeUser = (account) => ({
  id: account._id.toString(),
  name: account.name,
  email: account.email,
  role: account.role,
});

const findAccountByEmail = async (email) => {
  const [user, vendor, admin] = await Promise.all([
    User.findOne({ email }),
    Vendor.findOne({ email }),
    Admin.findOne({ email }),
  ]);

  return user || vendor || admin;
};

const getAccountModel = (role) => {
  const models = {
    user: User,
    vendor: Vendor,
    admin: Admin,
  };

  return models[role];
};

const findAccountByRoleAndId = async (role, id) => {
  const Model = getAccountModel(role);

  if (!Model) {
    return null;
  }

  return Model.findById(id).select('-password');
};

const createOtpRecord = async ({ email, userId, role, otp }) => {
  const otpHash = await bcrypt.hash(otp, 10);

  await EmailVerification.deleteMany({ email });

  await EmailVerification.create({
    email,
    userId,
    role,
    otpHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0,
  });
};

const sendOtpMessage = async ({ email, name, otp, purpose = 'verify' }) => {
  const isReset = purpose === 'reset';
  const subject = isReset
    ? 'Reset your Wedding Planner password'
    : 'Your Wedding Planner email verification code';
  const heading = isReset ? 'Reset your password' : 'Verify your email';
  const text = isReset
    ? `Hello ${name},\n\nYour password reset code is ${otp}. It will expire in 10 minutes.\n\nWedding Planner`
    : `Hello ${name},\n\nYour OTP is ${otp}. It will expire in 10 minutes.\n\nWedding Planner`;

  await sendEmail({
    to: email,
    subject,
    text,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
        <h2>${heading}</h2>
        <p>Hello ${name},</p>
        <p>${isReset ? 'Your password reset code is:' : 'Your verification code is:'}</p>
        <h1 style="letter-spacing: 0.2rem;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `,
  });
};

const generateAuthToken = (account) =>
  jwt.sign(
    {
      id: account._id.toString(),
      role: account.role,
    },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingAccount = await findAccountByEmail(normalizedEmail);

    if (existingAccount) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user',
      isEmailVerified: false,
    });

    const otp = generateOtp();
    await createOtpRecord({
      email: normalizedEmail,
      userId: user._id,
      role: 'user',
      otp,
    });

    await sendOtpMessage({
      email: normalizedEmail,
      name: user.name,
      otp,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. OTP sent to your email.',
    });
  } catch (error) {
    return next(error);
  }
};

const registerVendor = async (req, res, next) => {
  try {
    const { name, email, password, businessName, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    if (!businessName || !businessName.trim()) {
      return res.status(400).json({ success: false, message: 'Business name is required.' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingAccount = await findAccountByEmail(normalizedEmail);

    if (existingAccount) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const vendor = await Vendor.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      businessName: businessName.trim(),
      phone: phone.trim(),
      role: 'vendor',
      isEmailVerified: false,
    });

    const otp = generateOtp();
    await createOtpRecord({
      email: normalizedEmail,
      userId: vendor._id,
      role: 'vendor',
      otp,
    });

    await sendOtpMessage({
      email: normalizedEmail,
      name: vendor.name,
      otp,
    });

    return res.status(201).json({
      success: true,
      message: 'Vendor registration successful. OTP sent to your email.',
    });
  } catch (error) {
    return next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required.' });
    }

    if (!otp || otp.length !== 6) {
      return res.status(400).json({ success: false, message: 'A valid 6-digit OTP is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const verification = await EmailVerification.findOne({ email: normalizedEmail });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this email. Please request a new one.',
      });
    }

    if (new Date(verification.expiresAt) < new Date()) {
      await EmailVerification.deleteOne({ _id: verification._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    if (verification.attempts >= 5) {
      await EmailVerification.deleteOne({ _id: verification._id });
      return res.status(400).json({
        success: false,
        message: 'Too many invalid attempts. Please request a new OTP.',
      });
    }

    const isValidOtp = await bcrypt.compare(otp, verification.otpHash);

    if (!isValidOtp) {
      verification.attempts += 1;
      await verification.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.',
      });
    }

    const account = await findAccountByRoleAndId(verification.role, verification.userId);

    if (!account) {
      await EmailVerification.deleteOne({ _id: verification._id });
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    account.isEmailVerified = true;
    await account.save();
    await EmailVerification.deleteOne({ _id: verification._id });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    return next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const account = await findAccountByEmail(normalizedEmail);

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (account.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified.' });
    }

    const existingVerification = await EmailVerification.findOne({ email: normalizedEmail });

    if (existingVerification) {
      const timeElapsed = Date.now() - new Date(existingVerification.createdAt).getTime();

      if (timeElapsed < 60 * 1000) {
        return res.status(429).json({
          success: false,
          message: 'Please wait before requesting a new OTP.',
        });
      }
    }

    const otp = generateOtp();
    await createOtpRecord({
      email: normalizedEmail,
      userId: account._id,
      role: account.role,
      otp,
    });

    await sendOtpMessage({
      email: normalizedEmail,
      name: account.name,
      otp,
    });

    return res.status(200).json({
      success: true,
      message: 'A new OTP has been sent to your email.',
    });
  } catch (error) {
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const account = await findAccountByEmail(normalizedEmail);

    if (!account) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists for this email, a password reset code has been sent.',
      });
    }

    const otp = generateOtp();
    await createOtpRecord({
      email: normalizedEmail,
      userId: account._id,
      role: account.role,
      otp,
    });

    await sendOtpMessage({
      email: normalizedEmail,
      name: account.name,
      otp,
      purpose: 'reset',
    });

    return res.status(200).json({
      success: true,
      message: 'A password reset code has been sent to your email.',
    });
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required.' });
    }

    if (!otp || otp.length !== 6) {
      return res.status(400).json({ success: false, message: 'A valid 6-digit OTP is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const verification = await EmailVerification.findOne({ email: normalizedEmail });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'No reset code found for this email. Please request a new one.',
      });
    }

    if (new Date(verification.expiresAt) < new Date()) {
      await EmailVerification.deleteOne({ _id: verification._id });
      return res.status(400).json({
        success: false,
        message: 'Reset code has expired. Please request a new one.',
      });
    }

    if (verification.attempts >= 5) {
      await EmailVerification.deleteOne({ _id: verification._id });
      return res.status(400).json({
        success: false,
        message: 'Too many invalid attempts. Please request a new reset code.',
      });
    }

    const isValidOtp = await bcrypt.compare(otp, verification.otpHash);

    if (!isValidOtp) {
      verification.attempts += 1;
      await verification.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid reset code. Please try again.',
      });
    }

    const Model = getAccountModel(verification.role);
    const account = Model ? await Model.findById(verification.userId) : null;

    if (!account) {
      await EmailVerification.deleteOne({ _id: verification._id });
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    account.password = hashedPassword;
    await account.save();
    await EmailVerification.deleteOne({ _id: verification._id });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully.',
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required.' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const [admin, vendor, user] = await Promise.all([
      Admin.findOne({ email: normalizedEmail }),
      Vendor.findOne({ email: normalizedEmail }),
      User.findOne({ email: normalizedEmail }),
    ]);
    const accounts = [admin, vendor, user].filter(Boolean);
    const passwordMatches = await Promise.all(
      accounts.map((account) => bcrypt.compare(password, account.password))
    );
    const account = accounts.find((_, index) => passwordMatches[index]);

    if (!account) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if ((account.role === 'user' || account.role === 'vendor') && !account.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
      });
    }

    const token = generateAuthToken(account);

    res.cookie('token', token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: sanitizeUser(account),
    });
  } catch (error) {
    return next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    path: '/',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

const getMe = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const account = await findAccountByRoleAndId(role, id);

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Session invalid. Please log in again.',
      });
    }

    return res.status(200).json({
      success: true,
      user: sanitizeUser(account),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registerUser,
  registerVendor,
  verifyEmail,
  resendOtp,
  forgotPassword,
  resetPassword,
  login,
  logout,
  getMe,
  findAccountByEmail,
};
