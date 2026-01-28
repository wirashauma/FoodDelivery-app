// ============================================
// Enhanced Auth Controller - OTP & SSO Support
// ============================================
// Features:
// - Phone OTP Authentication
// - Google OAuth
// - Apple Sign-In
// - Email/Password Authentication
// - Token Refresh
// - Device Management

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshkey';

// ==================== OTP AUTHENTICATION ====================

/**
 * Request OTP for phone authentication
 */
exports.requestOTP = async (req, res) => {
  try {
    const { phone, countryCode = '+62' } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone Required',
        message: 'Please provide a phone number'
      });
    }

    const fullPhone = countryCode + phone.replace(/^0+/, '');

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP (in production, use Redis for expiration)
    await prisma.oTPVerification.upsert({
      where: { phone: fullPhone },
      update: {
        otp,
        expiresAt,
        attempts: 0
      },
      create: {
        phone: fullPhone,
        otp,
        expiresAt
      }
    });

    // In production, send OTP via SMS gateway (Twilio, Nexmo, etc.)
    console.log(`[DEV] OTP for ${fullPhone}: ${otp}`);

    // TODO: Integrate SMS gateway
    // await sendSMS(fullPhone, `Your Titipin verification code is: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone: fullPhone,
        expiresIn: 300 // 5 minutes in seconds
      }
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Verify OTP and authenticate user
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, countryCode = '+62', otp, deviceId, deviceInfo } = req.body;
    const platform = req.platform || 'mobile';

    const fullPhone = countryCode + phone.replace(/^0+/, '');

    const otpRecord = await prisma.oTPVerification.findUnique({
      where: { phone: fullPhone }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: 'OTP Not Found',
        message: 'Please request a new OTP'
      });
    }

    // Check expiration
    if (new Date() > otpRecord.expiresAt) {
      await prisma.oTPVerification.delete({ where: { phone: fullPhone } });
      return res.status(400).json({
        success: false,
        error: 'OTP Expired',
        message: 'OTP has expired. Please request a new one'
      });
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      await prisma.oTPVerification.delete({ where: { phone: fullPhone } });
      return res.status(400).json({
        success: false,
        error: 'Too Many Attempts',
        message: 'Too many failed attempts. Please request a new OTP'
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      await prisma.oTPVerification.update({
        where: { phone: fullPhone },
        data: { attempts: { increment: 1 } }
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP',
        message: 'The OTP you entered is incorrect'
      });
    }

    // Delete used OTP
    await prisma.oTPVerification.delete({ where: { phone: fullPhone } });

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { phone: fullPhone }
    });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          phone: fullPhone,
          role: 'CUSTOMER',
          isPhoneVerified: true,
          status: 'ACTIVE'
        }
      });
    } else if (!user.isPhoneVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true }
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user, platform);

    // Store device info
    if (deviceId) {
      await prisma.userDevice.upsert({
        where: { deviceId },
        update: {
          userId: user.id,
          deviceInfo: deviceInfo || {},
          lastActiveAt: new Date()
        },
        create: {
          userId: user.id,
          deviceId,
          deviceInfo: deviceInfo || {},
          platform
        }
      });
    }

    res.json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
        isNewUser
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== SOCIAL LOGIN ====================

/**
 * Google OAuth authentication
 */
exports.googleAuth = async (req, res) => {
  try {
    const { idToken, accessToken: googleAccessToken, deviceId, deviceInfo } = req.body;
    const platform = req.platform || 'mobile';

    // In production, verify idToken with Google
    // const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    // const payload = ticket.getPayload();

    // For development, decode token (NOT SECURE - use verification in production)
    const tokenParts = idToken.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email Required',
        message: 'Email is required from Google account'
      });
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { googleId }
        ]
      }
    });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email,
          fullName: name,
          profilePicture: picture,
          googleId,
          role: 'CUSTOMER',
          isEmailVerified: true,
          status: 'ACTIVE'
        }
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          fullName: user.fullName || name,
          profilePicture: user.profilePicture || picture,
          isEmailVerified: true
        }
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user, platform);

    // Store device info
    if (deviceId) {
      await prisma.userDevice.upsert({
        where: { deviceId },
        update: {
          userId: user.id,
          deviceInfo: deviceInfo || {},
          lastActiveAt: new Date()
        },
        create: {
          userId: user.id,
          deviceId,
          deviceInfo: deviceInfo || {},
          platform
        }
      });
    }

    res.json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
        isNewUser
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Apple Sign-In authentication
 */
exports.appleAuth = async (req, res) => {
  try {
    const { identityToken, authorizationCode, user: appleUserData, deviceId, deviceInfo } = req.body;
    const platform = req.platform || 'mobile';

    // In production, verify identityToken with Apple
    // const appleUser = await verifyAppleToken(identityToken);

    // Decode token (NOT SECURE - use verification in production)
    const tokenParts = identityToken.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

    const appleId = payload.sub;
    const email = payload.email || appleUserData?.email;
    const fullName = appleUserData?.fullName?.givenName
      ? `${appleUserData.fullName.givenName} ${appleUserData.fullName.familyName || ''}`.trim()
      : null;

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { appleId },
          ...(email ? [{ email }] : [])
        ]
      }
    });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email,
          fullName,
          appleId,
          role: 'CUSTOMER',
          isEmailVerified: !!email,
          status: 'ACTIVE'
        }
      });
    } else if (!user.appleId) {
      // Link Apple account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          appleId,
          fullName: user.fullName || fullName,
          isEmailVerified: user.isEmailVerified || !!email
        }
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user, platform);

    // Store device info
    if (deviceId) {
      await prisma.userDevice.upsert({
        where: { deviceId },
        update: {
          userId: user.id,
          deviceInfo: deviceInfo || {},
          lastActiveAt: new Date()
        },
        create: {
          userId: user.id,
          deviceId,
          deviceInfo: deviceInfo || {},
          platform
        }
      });
    }

    res.json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
        isNewUser
      }
    });
  } catch (error) {
    console.error('Apple auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== EMAIL/PASSWORD AUTH ====================

/**
 * Register with email and password
 */
exports.register = async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;
    const platform = req.platform || 'web';

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing Fields',
        message: 'Email and password are required'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email Exists',
        message: 'This email is already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        phone,
        role: 'CUSTOMER',
        status: 'ACTIVE'
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user, platform);

    // TODO: Send verification email
    // await sendVerificationEmail(user.email, generateVerificationToken(user.id));

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Login with email and password
 */
exports.login = async (req, res) => {
  try {
    const { email, password, deviceId, deviceInfo } = req.body;
    const platform = req.platform || 'web';

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing Fields',
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: { email }
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'Account Suspended',
        message: 'Your account has been suspended'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user, platform);

    // Store device info
    if (deviceId) {
      await prisma.userDevice.upsert({
        where: { deviceId },
        update: {
          userId: user.id,
          deviceInfo: deviceInfo || {},
          lastActiveAt: new Date()
        },
        create: {
          userId: user.id,
          deviceId,
          deviceInfo: deviceInfo || {},
          platform
        }
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== TOKEN MANAGEMENT ====================

/**
 * Refresh access token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const platform = req.platform || 'web';

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Token Required',
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Token',
        message: 'Refresh token is invalid or expired'
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        error: 'User Not Found',
        message: 'User not found or suspended'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user, platform);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Logout (invalidate tokens)
 */
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId, logoutAll } = req.body;

    if (logoutAll) {
      // Remove all devices
      await prisma.userDevice.deleteMany({
        where: { userId }
      });
    } else if (deviceId) {
      // Remove specific device
      await prisma.userDevice.deleteMany({
        where: {
          userId,
          deviceId
        }
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get current user profile
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...sanitizeUser(user),
        defaultAddress: user.addresses[0] || null
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== HELPER FUNCTIONS ====================

function generateTokens(user, platform = 'web') {
  const accessToken = jwt.sign(
    {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.fullName
      },
      platform
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      platform
    },
    JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    profilePicture: user.profilePicture,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    createdAt: user.createdAt
  };
}

module.exports = exports;
